import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";

@Injectable()
export class DocumentsService {
    constructor(private readonly prisma: PrismaService) { }

    async createForCondo(
        condoId: string,
        userId: string,
        dto: {
            title: string;
            description?: string;
            category: string;
        },
        file: Express.Multer.File,
    ) {
        if (!file) {
            throw new ForbiddenException("Debes adjuntar un archivo");
        }

        return this.prisma.document.create({
            data: {
                condominiumId: condoId,
                title: dto.title,
                description: dto.description,
                category: dto.category,
                fileName: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                fileUrl: `uploads/documents/${file.filename}`,
                uploadedById: userId,
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    async listByCondo(
        condoId: string,
        params: {
            category?: string;
            search?: string;
            page?: number;
            pageSize?: number;
        },
    ) {
        const page = Math.max(1, Number(params.page ?? 1));
        const pageSize = Math.min(50, Math.max(1, Number(params.pageSize ?? 10)));
        const skip = (page - 1) * pageSize;

        const where: any = {
            condominiumId: condoId,
        };

        if (params.category) {
            where.category = params.category;
        }

        if (params.search?.trim()) {
            where.OR = [
                {
                    title: {
                        contains: params.search.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: params.search.trim(),
                        mode: "insensitive",
                    },
                },
                {
                    originalName: {
                        contains: params.search.trim(),
                        mode: "insensitive",
                    },
                },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.document.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: "desc" },
                include: {
                    uploadedBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.document.count({ where }),
        ]);

        const hydratedItems = items.map((item) => ({
            ...item,
            fileUrl: `/condominiums/${condoId}/documents/${item.id}/view`,
            downloadUrl: `/condominiums/${condoId}/documents/${item.id}/download`,
        }));

        return {
            items: hydratedItems,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        };
    }

    /** Devuelve metadata con URLs hidratadas (para respuestas JSON al frontend). */
    async getById(condoId: string, documentId: string) {
        const document = await this.prisma.document.findFirst({
            where: {
                id: documentId,
                condominiumId: condoId,
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!document) {
            throw new NotFoundException("Documento no encontrado");
        }

        return {
            ...document,
            fileUrl: `/condominiums/${condoId}/documents/${document.id}/view`,
            downloadUrl: `/condominiums/${condoId}/documents/${document.id}/download`,
        };
    }

    /** Devuelve el registro crudo de BD (para servir el archivo binario en view/download). */
    async getRawById(condoId: string, documentId: string) {
        const document = await this.prisma.document.findFirst({
            where: {
                id: documentId,
                condominiumId: condoId,
            },
        });

        if (!document) {
            throw new NotFoundException("Documento no encontrado");
        }

        return document;
    }

    async remove(condoId: string, documentId: string) {
        const document = await this.prisma.document.findFirst({
            where: {
                id: documentId,
                condominiumId: condoId,
            },
        });

        if (!document) {
            throw new NotFoundException("Documento no encontrado");
        }

        await this.prisma.document.delete({
            where: { id: documentId },
        });

        return {
            message: "Documento eliminado correctamente",
            document,
        };
    }
}