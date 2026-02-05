import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class TicketCommentsService {
    constructor(private prisma: PrismaService) { }

    async create(condoId: string, ticketId: string, authorId: string, dto: CreateCommentDto) {
        // Validar que el ticket existe y pertenece al condominio
        const exists = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
        });

        if (!exists) throw new NotFoundException('Ticket no encontrado');

        return this.prisma.ticketComment.create({
            data: {
                ticketId,
                authorId,
                message: dto.message,
            },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });
    }

    list(condoId: string, ticketId: string) {
        return this.prisma.ticketComment.findMany({
            where: {
                ticketId,
                ticket: { condominiumId: condoId },
            },
            orderBy: { createdAt: 'asc' },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });
    }
}
