import {
    Body,
    Controller,
    Get,
    HttpStatus,
    HttpCode,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

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
}