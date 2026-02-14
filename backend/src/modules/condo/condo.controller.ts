import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiParam,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CondoMemberGuard } from './condo-member.guard';
import { CondoService } from './condo.service';

@ApiTags('condominiums')
@ApiBearerAuth('access-token')
@Controller('condominiums')
export class CondoController {
    constructor(private readonly condo: CondoService) { }

    @Get(':condoId/me')
    @UseGuards(JwtAuthGuard, CondoMemberGuard)
    @ApiOkResponse({ description: 'Rol del usuario en el condominio' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No perteneces al condominio' })
    @ApiParam({ name: 'condoId', example: 'violetas-condo' })
    getMyRole(@Param('condoId') condoId: string, @Req() req: any) {
        return this.condo.getMyRole(condoId, req.user.id);
    }
}
