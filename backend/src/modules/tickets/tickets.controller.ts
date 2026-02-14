import {
    Body,
    Controller,
    Get,
    HttpStatus,
    HttpCode,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiOkResponse,
    ApiQuery,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CondoMemberGuard } from '../condo/condo-member.guard';
import { CondoRoles } from '../condo/condo-roles.decorator';
import { CondoRolesGuard } from '../condo/condo-roles.guard';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { UpdateTicketPriorityDto } from './dto/update-ticket-priority.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@ApiTags('tickets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, CondoMemberGuard)
@Controller('condominiums/:condoId/tickets')
export class TicketsController {
    constructor(private readonly tickets: TicketsService) { }

    // -------------------------------
    // CREATE
    // -------------------------------
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'Ticket creado' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No eres miembro activo del condominio' })
    @ApiParam({ name: 'condoId', example: 'violetas-condo' })
    create(
        @Param('condoId') condoId: string,
        @Req() req: any,
        @Body() dto: CreateTicketDto,
    ) {
        return this.tickets.create(condoId, req.user.id, dto);
    }

    // -------------------------------
    // LIST (paginado + filtros)
    // -------------------------------
    @Get()
    @ApiOkResponse({ description: 'Listado paginado de tickets' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No eres miembro activo del condominio' })
    @ApiParam({ name: 'condoId', example: 'violetas-condo' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'priority', required: false })
    @ApiQuery({ name: 'search', required: false })
    list(
        @Param('condoId') condoId: string,
        @Query('page') page = 1,
        @Query('pageSize') pageSize = 20,
        @Query('status') status?: string,
        @Query('priority') priority?: string,
        @Query('search') search?: string,
    ) {
        return this.tickets.list(condoId, {
            page: Number(page),
            pageSize: Number(pageSize),
            status,
            priority,
            search,
        });
    }

    // -------------------------------
    // DETAIL
    // -------------------------------
    @Get(':ticketId')
    @ApiOkResponse({ description: 'Detalle del ticket' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No eres miembro activo del condominio' })
    @ApiParam({ name: 'condoId', example: 'violetas-condo' })
    @ApiParam({ name: 'ticketId', example: 'cml8p2aif0001ap30tsvlsica' })
    get(@Param('condoId') condoId: string, @Param('ticketId') ticketId: string) {
        return this.tickets.get(condoId, ticketId);
    }

    // -------------------------------
    // UPDATE STATUS
    // -------------------------------
    @Patch(':ticketId/status')
    @UseGuards(JwtAuthGuard, CondoMemberGuard, CondoRolesGuard)
    @CondoRoles('ADMINISTRADOR', 'COMITE', 'COPROPIETARIO')
    @ApiOkResponse({ description: 'Estado actualizado' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No tienes permisos' })
    @ApiBody({ type: UpdateTicketStatusDto })
    async updateStatus(
        @Param('condoId') condoId: string,
        @Param('ticketId') ticketId: string,
        @Req() req: any,
        @Body() dto: UpdateTicketStatusDto,
    ) {
        return this.tickets.updateStatus(condoId, ticketId, req.user.id, dto.status);
    }

    // -------------------------------
    // UPDATE PRIORITY
    // -------------------------------
    @Patch(':ticketId/priority')
    @UseGuards(JwtAuthGuard, CondoMemberGuard, CondoRolesGuard)
    @CondoRoles('ADMINISTRADOR', 'COMITE', 'COPROPIETARIO')
    @ApiOkResponse({ description: 'Prioridad actualizada' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No tienes permisos' })
    @ApiBody({ type: UpdateTicketPriorityDto })
    async updatePriority(
        @Param('condoId') condoId: string,
        @Param('ticketId') ticketId: string,
        @Req() req: any,
        @Body() dto: UpdateTicketPriorityDto,
    ) {
        return this.tickets.updatePriority(condoId, ticketId, req.user.id, dto.priority);
    }

    // -------------------------------
    // TIMELINE
    // -------------------------------
    @Get(':ticketId/timeline')
    @ApiOkResponse({ description: 'Timeline del ticket' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No eres miembro activo del condominio' })
    timeline(@Param('condoId') condoId: string, @Param('ticketId') ticketId: string) {
        return this.tickets.timeline(condoId, ticketId);
    }

    // -------------------------------
    // UPDATE DETAILS
    // -------------------------------
    @Patch(':ticketId')
    @UseGuards(JwtAuthGuard, CondoMemberGuard, CondoRolesGuard)
    @CondoRoles('ADMINISTRADOR', 'COMITE')
    @ApiOkResponse({ description: 'Ticket actualizado' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No tienes permisos' })
    @ApiBody({ type: UpdateTicketDto })
    updateDetails(
        @Param('condoId') condoId: string,
        @Param('ticketId') ticketId: string,
        @Body() dto: UpdateTicketDto,
    ) {
        return this.tickets.updateDetails(condoId, ticketId, dto);
    }

    // -------------------------------
    // CLOSE TICKET
    // -------------------------------
    @Patch(':ticketId/close')
    @UseGuards(JwtAuthGuard, CondoMemberGuard, CondoRolesGuard)
    @CondoRoles('ADMINISTRADOR', 'COMITE')
    @ApiOkResponse({ description: 'Ticket cerrado' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No tienes permisos o el ticket ya está cerrado' })
    close(
        @Param('condoId') condoId: string,
        @Param('ticketId') ticketId: string,
        @Req() req: any,
    ) {
        return this.tickets.close(condoId, ticketId, req.user.id);
    }
}