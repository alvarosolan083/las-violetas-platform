import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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
    async create(condoId: string, userId: string, dto: CreateTicketDto) {
        const ticket = await this.prisma.ticket.create({
            data: {
                condominiumId: condoId,
                createdById: userId,
                title: dto.title,
                description: dto.description,
                category: dto.category,
                priority: dto.priority ?? 'MEDIUM',
            },
        });

        await this.prisma.ticketEvent.create({
            data: {
                ticketId: ticket.id,
                type: 'TICKET_CREATED',
                actorId: userId,
                payload: {
                    title: ticket.title,
                    description: ticket.description,
                    category: ticket.category,
                    priority: ticket.priority,
                    status: ticket.status,
                },
            },
        });

        return ticket;
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
                attachments: { orderBy: { createdAt: 'asc' } },
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

        const updated = await this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: status as any,
                statusUpdatedAt: new Date(),
                statusUpdatedById: userId,
            },
        });

        if (ticket.status !== status) {
            await this.prisma.ticketEvent.create({
                data: {
                    ticketId,
                    type: 'STATUS_CHANGED',
                    actorId: userId,
                    payload: {
                        previousStatus: ticket.status,
                        newStatus: status,
                    },
                },
            });
        }

        return updated;
    }

    // -----------------------------
    // UPDATE PRIORITY
    // -----------------------------
    async updatePriority(condoId: string, ticketId: string, userId: string, priority: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true, priority: true },
        });
        if (!ticket) throw new NotFoundException('Ticket no encontrado');

        const updated = await this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                priority: priority as any,
                priorityUpdatedAt: new Date(),
                priorityUpdatedById: userId,
            },
        });

        if (ticket.priority !== priority) {
            await this.prisma.ticketEvent.create({
                data: {
                    ticketId,
                    type: 'PRIORITY_CHANGED',
                    actorId: userId,
                    payload: {
                        previousPriority: ticket.priority,
                        newPriority: priority,
                    },
                },
            });
        }

        return updated;
    }

    // -----------------------------
    // TIMELINE (status changes + comments)
    // -----------------------------
    async timeline(condoId: string, ticketId: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true },
        });

        if (!ticket) throw new NotFoundException('Ticket no encontrado');

        const events = await this.prisma.ticketEvent.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'asc' },
            include: {
                actor: { select: { id: true, name: true, email: true } },
            },
        });

        return {
            ticketId,
            timeline: events.map((e) => ({
                id: e.id,
                type: e.type,
                createdAt: e.createdAt,
                message: e.message,
                payload: e.payload,
                actor: e.actor,
            })),
        };
    }

    // -----------------------------
    // UPDATE DETAILS
    // -----------------------------
    async updateDetails(condoId: string, ticketId: string, userId: string, dto: { title?: string; description?: string; category?: string }) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true, status: true, title: true, description: true, category: true },
        });
        if (!ticket) throw new NotFoundException('Ticket no encontrado');
        if (ticket.status === 'CLOSED') {
            throw new ForbiddenException('Ticket cerrado no puede modificarse');
        }

        // Detectar solo campos realmente modificados
        const changes: Record<string, { before: string | null; after: string | null }> = {};

        if (dto.title !== undefined && dto.title !== ticket.title) {
            changes.title = { before: ticket.title, after: dto.title };
        }
        if (dto.description !== undefined && dto.description !== ticket.description) {
            changes.description = { before: ticket.description, after: dto.description };
        }
        if (dto.category !== undefined && dto.category !== ticket.category) {
            changes.category = { before: ticket.category, after: dto.category };
        }

        if (Object.keys(changes).length === 0) {
            throw new BadRequestException('No se detectaron cambios reales en los detalles del ticket');
        }

        // Construir data de update solo con campos cambiados
        const data: Record<string, string> = {};
        for (const key of Object.keys(changes)) {
            data[key] = changes[key].after!;
        }

        const [updated] = await this.prisma.$transaction([
            this.prisma.ticket.update({
                where: { id: ticketId },
                data,
            }),
            this.prisma.ticketEvent.create({
                data: {
                    ticketId,
                    actorId: userId,
                    type: 'DETAILS_UPDATED',
                    message: 'Detalles del ticket actualizados',
                    payload: { changes },
                },
            }),
        ]);

        return updated;
    }

    // -----------------------------
    // CLOSE TICKET
    // -----------------------------
    async close(condoId: string, ticketId: string, userId: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true, status: true },
        });
        if (!ticket) throw new NotFoundException('Ticket no encontrado');
        if (ticket.status === 'CLOSED') {
            throw new ForbiddenException('El ticket ya está cerrado');
        }

        const updated = await this.prisma.ticket.update({
            where: { id: ticketId },
            data: {
                status: 'CLOSED',
                statusUpdatedAt: new Date(),
                statusUpdatedById: userId,
            },
        });

        await this.prisma.ticketEvent.create({
            data: {
                ticketId,
                type: 'TICKET_CLOSED',
                actorId: userId,
                payload: {
                    previousStatus: ticket.status,
                    newStatus: 'CLOSED',
                },
            },
        });

        return updated;
    }
}
