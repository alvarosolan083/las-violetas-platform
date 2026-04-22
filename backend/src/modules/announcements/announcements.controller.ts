// backend/src/modules/announcements/announcements.controller.ts
import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CondoMemberGuard } from '../condo/condo-member.guard';
import { CondoRolesGuard } from '../condo/condo-roles.guard';
import { CondoRoles } from '../condo/condo-roles.decorator';

@ApiTags('Announcements')
@ApiBearerAuth('access-token') // <<<<<< CLAVE para que Swagger mande Authorization
@Controller('condominiums/:condoId/announcements')
@UseGuards(CondoMemberGuard)
export class AnnouncementsController {
    constructor(private readonly announcementsService: AnnouncementsService) { }

    @Get()
    @ApiOperation({ summary: 'List announcements for a condominium (paginated)' })
    @ApiParam({ name: 'condoId', type: String })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    async list(
        @Param('condoId') condoId: string,
        @Query('page') page = '1',
        @Query('pageSize') pageSize = '10',
    ) {
        const pageNumber = Number(page) || 1;
        const pageSizeNumber = Number(pageSize) || 10;

        return this.announcementsService.listByCondo(
            condoId,
            pageNumber,
            pageSizeNumber,
        );
    }

    @Post()
    @UseGuards(CondoRolesGuard)
    @CondoRoles('ADMINISTRADOR', 'COMITE')
    @ApiOperation({ summary: 'Create an announcement (ADMINISTRADOR/COMITE)' })
    @ApiParam({ name: 'condoId', type: String })
    async create(
        @Param('condoId') condoId: string,
        @Req() req: any,
        @Body() dto: CreateAnnouncementDto,
    ) {
        return this.announcementsService.createForCondo(
            condoId,
            req.user.id,
            dto,
        );
    }
}