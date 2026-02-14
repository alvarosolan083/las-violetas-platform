import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CondoMemberGuard } from '../condo/condo-member.guard';
import { TicketAttachmentsService } from './ticket-attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';

@ApiTags('ticket-attachments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, CondoMemberGuard)
@Controller('condominiums/:condoId/tickets/:ticketId/attachments')
export class TicketAttachmentsController {
    constructor(private readonly attachments: TicketAttachmentsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'Adjunto agregado al ticket' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No eres miembro activo del condominio' })
    @ApiBody({ type: CreateAttachmentDto })
    create(@Param('condoId') condoId: string, @Param('ticketId') ticketId: string, @Body() dto: CreateAttachmentDto) {
        return this.attachments.create(condoId, ticketId, dto);
    }

    @Get()
    @ApiOkResponse({ description: 'Listado de adjuntos del ticket' })
    list(@Param('condoId') condoId: string, @Param('ticketId') ticketId: string) {
        return this.attachments.list(condoId, ticketId);
    }
}
