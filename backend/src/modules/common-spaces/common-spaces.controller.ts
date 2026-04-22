import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CondoMemberGuard } from "../condo/condo-member.guard";
import { CommonSpacesService } from "./common-spaces.service";

@ApiTags("Common Spaces")
@ApiBearerAuth("access-token")
@UseGuards(CondoMemberGuard)
@Controller("condominiums/:condoId/spaces")
export class CommonSpacesController {
    constructor(private readonly service: CommonSpacesService) { }

    @Get()
    @ApiOperation({ summary: "List common spaces for a condominium" })
    list(@Param("condoId") condoId: string) {
        return this.service.listByCondo(condoId);
    }

    @Get(":spaceId")
    @ApiOperation({ summary: "Get common space detail (includes slots & rules)" })
    getOne(
        @Param("condoId") condoId: string,
        @Param("spaceId") spaceId: string,
    ) {
        return this.service.getById(condoId, spaceId);
    }
}