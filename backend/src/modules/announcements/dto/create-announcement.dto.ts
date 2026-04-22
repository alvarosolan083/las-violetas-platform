import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
    @ApiProperty({ example: 'Corte de agua programado', minLength: 3, maxLength: 120 })
    @IsString()
    @MinLength(3)
    @MaxLength(120)
    title: string;

    @ApiProperty({
        example: 'El viernes se realizará mantención del sistema de agua entre 15:00 y 18:00.',
        minLength: 5,
        maxLength: 2000,
    })
    @IsString()
    @MinLength(5)
    @MaxLength(2000)
    body: string;
}