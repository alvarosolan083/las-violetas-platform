import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@Injectable()
export class TicketAttachmentsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(condoId: string, ticketId: string, dto: CreateAttachmentDto) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true },
        });
        if (!ticket) throw new NotFoundException('Ticket no encontrado');

        return this.prisma.ticketAttachment.create({
            data: {
                ticketId,
                url: dto.url,
                filename: dto.filename,
            },
        });
    }

    async list(condoId: string, ticketId: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true },
        });
        if (!ticket) throw new NotFoundException('Ticket no encontrado');

        return this.prisma.ticketAttachment.findMany({
            where: { ticketId },
            orderBy: { createdAt: 'asc' },
        });
    }
}
