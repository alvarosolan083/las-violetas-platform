import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiTags,
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CondoMemberGuard } from '../condo/condo-member.guard';
import { TicketCommentsService } from './ticket-comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('ticket-comments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, CondoMemberGuard)
@Controller('condominiums/:condoId/tickets/:ticketId/comments')
export class TicketCommentsController {
    constructor(private readonly comments: TicketCommentsService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiCreatedResponse({ description: 'Comentario agregado al ticket' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No eres miembro activo del condominio' })
    @ApiParam({ name: 'condoId', example: 'violetas-condo' })
    @ApiParam({ name: 'ticketId', example: 'cml8p2aif0001ap30tsvlsica' })
    create(
        @Param('condoId') condoId: string,
        @Param('ticketId') ticketId: string,
        @Req() req: any,
        @Body() dto: CreateCommentDto,
    ) {
        return this.comments.create(condoId, ticketId, req.user.id, dto);
    }

    @Get()
    @ApiOkResponse({ description: 'Listado de comentarios del ticket' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiForbiddenResponse({ description: 'No eres miembro activo del condominio' })
    @ApiParam({ name: 'condoId', example: 'violetas-condo' })
    @ApiParam({ name: 'ticketId', example: 'cml8p2aif0001ap30tsvlsica' })
    list(@Param('condoId') condoId: string, @Param('ticketId') ticketId: string) {
        return this.comments.list(condoId, ticketId);
    }
}