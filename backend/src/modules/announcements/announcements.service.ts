import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
    constructor(private readonly prisma: PrismaService) { }

    async listByCondo(condoId: string, page = 1, pageSize = 10) {
        const safePage = page < 1 ? 1 : page;
        const safePageSize = pageSize < 1 ? 10 : pageSize;
        const skip = (safePage - 1) * safePageSize;

        const [items, total] = await Promise.all([
            this.prisma.announcement.findMany({
                where: { condominiumId: condoId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: safePageSize,
                include: {
                    createdBy: { select: { id: true, email: true, name: true } },
                },
            }),
            this.prisma.announcement.count({ where: { condominiumId: condoId } }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / safePageSize));

        return {
            items,
            total,
            page: safePage,
            pageSize: safePageSize,
            totalPages,
        };
    }

    async createForCondo(condoId: string, userId: string, dto: CreateAnnouncementDto) {
        return this.prisma.announcement.create({
            data: {
                condominiumId: condoId,
                createdById: userId,
                title: dto.title,
                body: dto.body,
            },
            include: {
                createdBy: { select: { id: true, email: true, name: true } },
            },
        });
    }
}