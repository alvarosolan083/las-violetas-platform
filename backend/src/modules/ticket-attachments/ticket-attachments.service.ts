import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

const TICKETS_UPLOAD_DIR = join(process.cwd(), "uploads", "tickets");

@Injectable()
export class TicketAttachmentsService {
    constructor(private readonly prisma: PrismaService) {}

    /* ── Helpers privados ── */

    private async validateTicket(condoId: string, ticketId: string) {
        const ticket = await this.prisma.ticket.findFirst({
            where: { id: ticketId, condominiumId: condoId },
            select: { id: true },
        });
        if (!ticket) {
            throw new NotFoundException("Ticket no encontrado");
        }
        return ticket;
    }

    /* ── Create ── */

    async create(condoId: string, ticketId: string, userId: string, file: Express.Multer.File) {
        await this.validateTicket(condoId, ticketId);

        const attachment = await this.prisma.ticketAttachment.create({
            data: {
                ticketId,
                fileName: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                fileUrl: `/uploads/tickets/${file.filename}`,
                uploadedById: userId,
            },
        });

        await this.prisma.ticketEvent.create({
            data: {
                ticketId,
                type: 'ATTACHMENT_ADDED',
                actorId: userId,
                payload: {
                    attachmentId: attachment.id,
                    originalName: attachment.originalName,
                    mimeType: attachment.mimeType,
                    sizeBytes: attachment.sizeBytes,
                },
            },
        });

        return attachment;
    }

    /* ── List ── */

    async list(condoId: string, ticketId: string) {
        await this.validateTicket(condoId, ticketId);

        const items = await this.prisma.ticketAttachment.findMany({
            where: { ticketId },
            orderBy: { createdAt: "asc" },
        });

        return items.map((item) => ({
            ...item,
            viewUrl: `/condominiums/${condoId}/tickets/${ticketId}/attachments/${item.id}/view`,
            downloadUrl: `/condominiums/${condoId}/tickets/${ticketId}/attachments/${item.id}/download`,
        }));
    }

    /* ── Get by ID (metadata con URLs hidratadas) ── */

    async getById(condoId: string, ticketId: string, attachmentId: string) {
        await this.validateTicket(condoId, ticketId);

        const attachment = await this.prisma.ticketAttachment.findFirst({
            where: { id: attachmentId, ticketId },
        });

        if (!attachment) {
            throw new NotFoundException("Adjunto no encontrado");
        }

        return {
            ...attachment,
            viewUrl: `/condominiums/${condoId}/tickets/${ticketId}/attachments/${attachment.id}/view`,
            downloadUrl: `/condominiums/${condoId}/tickets/${ticketId}/attachments/${attachment.id}/download`,
        };
    }

    /* ── Get raw (para servir archivo binario) ── */

    async getRawById(condoId: string, ticketId: string, attachmentId: string) {
        await this.validateTicket(condoId, ticketId);

        const attachment = await this.prisma.ticketAttachment.findFirst({
            where: { id: attachmentId, ticketId },
        });

        if (!attachment) {
            throw new NotFoundException("Adjunto no encontrado");
        }

        return attachment;
    }

    async remove(
        condoId: string,
        ticketId: string,
        attachmentId: string,
        userId: string,
        userRole: string
    ) {
        await this.validateTicket(condoId, ticketId);

        const attachment = await this.prisma.ticketAttachment.findFirst({
            where: { id: attachmentId, ticketId },
        });

        if (!attachment) {
            throw new NotFoundException("Adjunto no encontrado");
        }

        const isOwner = attachment.uploadedById === userId;
        const isAdmin = userRole === "ADMINISTRADOR" || userRole === "COMITE";

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("No tienes permisos para eliminar este adjunto");
        }

        const originalName = attachment.originalName;

        // eliminar registro DB
        await this.prisma.ticketAttachment.delete({
            where: { id: attachment.id },
        });

        await this.prisma.ticketEvent.create({
            data: {
                ticketId,
                type: 'ATTACHMENT_DELETED',
                actorId: userId,
                payload: {
                    attachmentId: attachment.id,
                    originalName,
                },
            },
        });

        // eliminar archivo físico
        const filePath = join(TICKETS_UPLOAD_DIR, attachment.fileName);

        if (existsSync(filePath)) {
            try {
                await unlink(filePath);
            } catch {
                // no bloqueamos si falla el borrado físico
            }
        }

        return {
            message: "Adjunto eliminado",
            id: attachment.id,
        };
    }
}
