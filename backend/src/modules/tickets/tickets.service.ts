import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

interface TicketListQuery {
    page: number;
    pageSize: number;
    status?: string;
    priority?: string;
    search?: string;
}

@Injectable()
export class TicketsService {
    constructor(private readonly prisma: PrismaService) { }

    // -----------------------------
    // CREATE
    // -----------------------------
    create(condoId: string, userId: string, dto: CreateTicketDto) {
        return this.prisma.ticket.create({
            data: {
                condominiumId: condoId,
                createdById: userId,
                title: dto.title,
                description: dto.description,
                category: dto.category,
                priority: dto.priority ?? 'MEDIUM',
            },
        });
    }

    // -----------------------------
    // LIST (con paginación y filtros)
    // -----------------------------
    async list(condoId: string, q: TicketListQuery) {
        const skip = (q.page - 1) * q.pageSize;
        const take = q.pageSize;

        const where: any = { condominiumId: condoId };

        if (q.status) where.status = q.status;
        if (q.priority) where.priority = q.priority;

        if (q.search) {
            where.OR = [
                { title: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.ticket.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take,
                include: {
                    createdBy: { select: { id: true, name: true, email: true } },
                },
            }),

            this.prisma.ticket.count({ where }),
        ]);

        return {
            page: q.page,
            pageSize: q.pageSize,
            total,
            totalPages: Math.ceil(total / q.pageSize),
            items,
        };
    }

    // -----------------------------
    // DETAIL
    // -----------------------------
    async get(condoId: string, ticketId: string) {
        const t = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                comments: {
                    orderBy: { createdAt: 'asc' },
                    include: {
                        author: { select: { id: true, name: true, email: true } },
                    },
                },
                attachments: true,
            },
        });

        if (!t) throw new NotFoundException('Ticket no encontrado');
        return t;
    }

    // -----------------------------
    // UPDATE STATUS
    // -----------------------------
    async updateStatus(condoId: string, ticketId: string, userId: string, status: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true, status: true },
        });

        if (!ticket) throw new NotFoundException('Ticket no encontrado');

        // Regla simple de workflow (rápida y segura):
        // CLOSED es final (no se reabre por ahora)
        if (ticket.status === 'CLOSED') {
            throw new ForbiddenException('Ticket cerrado no puede modificarse');
        }

        return this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: status as any,
                statusUpdatedAt: new Date(),
                statusUpdatedById: userId,
            },
        });
    }

    // -----------------------------
    // UPDATE PRIORITY
    // -----------------------------
    async updatePriority(condoId: string, ticketId: string, userId: string, priority: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true },
        });
        if (!ticket) throw new NotFoundException('Ticket no encontrado');

        return this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                priority: priority as any,
                priorityUpdatedAt: new Date(),
                priorityUpdatedById: userId,
            },
        });
    }

    // -----------------------------
    // TIMELINE (status changes + comments)
    // -----------------------------
    async getTimeline(condoId: string, ticketId: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            include: {
                createdBy: { select: { id: true, name: true, email: true } },
                statusUpdatedBy: { select: { id: true, name: true, email: true } },
                priorityUpdatedBy: { select: { id: true, name: true, email: true } },
                comments: {
                    include: {
                        author: { select: { id: true, name: true, email: true } },
                    },
                },
            },
        });

        if (!ticket) throw new NotFoundException('Ticket no encontrado');

        const timeline: any[] = [];

        // Evento de creación
        timeline.push({
            type: 'created',
            timestamp: ticket.createdAt,
            user: ticket.createdBy,
            data: {
                title: ticket.title,
                description: ticket.description,
                status: ticket.status,
                priority: ticket.priority,
            },
        });

        // Cambios de status
        if (ticket.statusUpdatedAt && ticket.statusUpdatedBy) {
            timeline.push({
                type: 'status_changed',
                timestamp: ticket.statusUpdatedAt,
                user: ticket.statusUpdatedBy,
                data: {
                    newStatus: ticket.status,
                },
            });
        }

        // Cambios de priority
        if (ticket.priorityUpdatedAt && ticket.priorityUpdatedBy) {
            timeline.push({
                type: 'priority_changed',
                timestamp: ticket.priorityUpdatedAt,
                user: ticket.priorityUpdatedBy,
                data: {
                    newPriority: ticket.priority,
                },
            });
        }

        // Comentarios
        ticket.comments.forEach((c) => {
            timeline.push({
                type: 'comment',
                timestamp: c.createdAt,
                user: c.author,
                data: {
                    message: c.message,
                },
            });
        });

        // Ordenar por timestamp
        timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        return {
            ticketId: ticket.id,
            timeline,
        };
    }
}
