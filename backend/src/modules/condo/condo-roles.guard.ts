import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CONDO_ROLES_KEY, CondoRoleAllowed } from './condo-roles.decorator';

@Injectable()
export class CondoRolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const allowed = this.reflector.getAllAndOverride<CondoRoleAllowed[]>(
            CONDO_ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!allowed || allowed.length === 0) return true;

        const req = context.switchToHttp().getRequest();
        const role = req.condoRole as CondoRoleAllowed | undefined;

        if (!role) throw new ForbiddenException('Rol de condominio no disponible');

        if (!allowed.includes(role)) {
            throw new ForbiddenException('No tienes permisos');
        }

        return true;
    }
}
