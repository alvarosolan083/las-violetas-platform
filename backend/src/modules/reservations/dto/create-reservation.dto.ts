import { ApiProperty } from "@nestjs/swagger";
import { IsISO8601, IsString, MinLength } from "class-validator";

export class CreateReservationDto {
    @ApiProperty({ example: "cspace_123" })
    @IsString()
    @MinLength(3)
    spaceId!: string;

    @ApiProperty({ example: "cslot_123" })
    @IsString()
    @MinLength(3)
    slotId!: string;

    // fecha del día, ej "2026-03-06"
    @ApiProperty({ example: "2026-03-06" })
    @IsISO8601()
    date!: string;
}