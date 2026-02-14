import { SetMetadata } from '@nestjs/common';

export const CONDO_ROLES_KEY = 'condo_roles';
export type CondoRoleAllowed = 'ADMINISTRADOR' | 'COMITE' | 'COPROPIETARIO';

export const CondoRoles = (...roles: CondoRoleAllowed[]) =>
    SetMetadata(CONDO_ROLES_KEY, roles);
