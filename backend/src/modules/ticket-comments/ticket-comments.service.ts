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

        const comment = await this.prisma.ticketComment.create({
            data: {
                ticketId,
                authorId,
                message: dto.message,
            },
            include: {
                author: { select: { id: true, name: true, email: true } },
            },
        });

        await this.prisma.ticketEvent.create({
            data: {
                ticketId,
                type: 'COMMENT_CREATED',
                actorId: authorId,
                payload: {
                    commentId: comment.id,
                    message: dto.message,
                },
            },
        });

        return comment;
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
