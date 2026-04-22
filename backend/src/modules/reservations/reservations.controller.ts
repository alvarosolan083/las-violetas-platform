import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CondoMemberGuard } from "../condo/condo-member.guard";
import { CondoRoles } from "../condo/condo-roles.decorator";
import { CondoRolesGuard } from "../condo/condo-roles.guard";
import { ReservationsService } from "./reservations.service";
import { CreateReservationDto } from "./dto/create-reservation.dto";

@ApiTags("Reservations")
@ApiBearerAuth("access-token")
@UseGuards(CondoMemberGuard)
@Controller("condominiums/:condoId/reservations")
export class ReservationsController {
    constructor(private readonly service: ReservationsService) { }

    @Get("mine")
    @ApiOperation({ summary: "List my reservations (future/past)" })
    listMine(
        @Param("condoId") condoId: string,
        @Query("tab") tab: "future" | "past" = "future",
        @Req() req: any,
    ) {
        return this.service.listMine(condoId, req.user.id, tab);
    }

    @Get()
    @UseGuards(CondoRolesGuard)
    @CondoRoles("ADMINISTRADOR", "COMITE")
    @ApiOperation({ summary: "List all reservations (ADMINISTRADOR/COMITE)" })
    listAll(
        @Param("condoId") condoId: string,
        @Query("status") status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED",
        @Query("spaceId") spaceId?: string,
        @Query("date") date?: string,
        @Query("q") q?: string,
        @Query("page") page?: string,
        @Query("pageSize") pageSize?: string,
    ) {
        return this.service.listAll(condoId, {
            status,
            spaceId,
            date,
            q,
            page: page ? Number(page) : 1,
            pageSize: pageSize ? Number(pageSize) : 10,
        });
    }

    @Get("spaces/:spaceId/availability")
    @ApiOperation({ summary: "Get availability by space and date" })
    getAvailability(
        @Param("condoId") condoId: string,
        @Param("spaceId") spaceId: string,
        @Query("date") date: string,
    ) {
        return this.service.getAvailability(condoId, spaceId, date);
    }

    @Post()
    @ApiOperation({ summary: "Create reservation (PENDING by default)" })
    create(
        @Param("condoId") condoId: string,
        @Req() req: any,
        @Body() dto: CreateReservationDto,
    ) {
        return this.service.createForCondo(condoId, req.user.id, dto);
    }

    @Post(":reservationId/cancel")
    @ApiOperation({ summary: "Cancel reservation before deadline" })
    cancel(
        @Param("condoId") condoId: string,
        @Param("reservationId") reservationId: string,
        @Req() req: any,
    ) {
        return this.service.cancel(condoId, req.user.id, reservationId);
    }

    @Patch(":reservationId/approve")
    @UseGuards(CondoRolesGuard)
    @CondoRoles("ADMINISTRADOR", "COMITE")
    @ApiOperation({ summary: "Approve reservation (ADMINISTRADOR/COMITE)" })
    approve(
        @Param("condoId") condoId: string,
        @Param("reservationId") reservationId: string,
        @Req() req: any,
    ) {
        return this.service.approve(condoId, req.user.id, reservationId);
    }

    @Patch(":reservationId/reject")
    @UseGuards(CondoRolesGuard)
    @CondoRoles("ADMINISTRADOR", "COMITE")
    @ApiOperation({ summary: "Reject reservation (ADMINISTRADOR/COMITE)" })
    reject(
        @Param("condoId") condoId: string,
        @Param("reservationId") reservationId: string,
        @Req() req: any,
    ) {
        return this.service.reject(condoId, req.user.id, reservationId);
    }
}