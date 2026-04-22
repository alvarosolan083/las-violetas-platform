import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../core/prisma/prisma.service";

@Injectable()
export class CommonSpacesService {
    constructor(private readonly prisma: PrismaService) { }

    async listByCondo(condoId: string) {
        const items = await this.prisma.commonSpace.findMany({
            where: { condominiumId: condoId },
            orderBy: { name: "asc" },
            include: { slots: { orderBy: { startTime: "asc" } } },
        });

        return { items };
    }

    async getById(condoId: string, spaceId: string) {
        const space = await this.prisma.commonSpace.findFirst({
            where: { id: spaceId, condominiumId: condoId },
            include: { slots: { orderBy: { startTime: "asc" } } },
        });

        if (!space) throw new NotFoundException("Espacio común no encontrado");
        return space;
    }
}