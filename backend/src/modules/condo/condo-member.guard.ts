import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class CondoMemberGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const userId = req.user?.id;
        const condominiumId = req.params?.condoId;

        if (!userId) throw new ForbiddenException('No autenticado');
        if (!condominiumId) throw new ForbiddenException('Falta condoId');

        const membership = await this.prisma.condoMembership.findUnique({
            where: { condominiumId_userId: { condominiumId, userId } },
        });

        if (!membership || !membership.active) {
            throw new ForbiddenException('No perteneces al condominio');
        }

        // Deja el rol disponible en req para controllers/services
        req.condoRole = membership.role;
        return true;
    }
}
