import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class CondoService {
    constructor(private readonly prisma: PrismaService) { }

    async getMyRole(condoId: string, userId: string) {
        const membership = await this.prisma.condoMembership.findUnique({
            where: { condominiumId_userId: { condominiumId: condoId, userId } },
            select: {
                role: true,
                active: true,
                condominium: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!membership) {
            throw new NotFoundException('No perteneces a este condominio');
        }

        return {
            condominiumId: condoId,
            condominiumName: membership.condominium.name,
            role: membership.role,
            active: membership.active,
        };
    }
}
