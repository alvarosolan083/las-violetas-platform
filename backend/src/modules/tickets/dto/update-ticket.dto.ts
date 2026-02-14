import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTicketDto {
    @ApiPropertyOptional({ example: 'Portón no abre (actualizado)' })
    @IsOptional()
    @IsString()
    @MinLength(3)
    title?: string;

    @ApiPropertyOptional({ example: 'Ahora falla solo después de las 22:00.' })
    @IsOptional()
    @IsString()
    @MinLength(5)
    description?: string;

    @ApiPropertyOptional({ example: 'Portón' })
    @IsOptional()
    @IsString()
    category?: string;
}
