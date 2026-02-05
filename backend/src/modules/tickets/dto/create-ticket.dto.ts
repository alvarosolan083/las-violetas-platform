import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTicketDto {
    @ApiProperty({ example: 'Portón no abre' })
    @IsString()
    @MinLength(3)
    title: string;

    @ApiProperty({ example: 'El portón queda trabado y no responde al control.' })
    @IsString()
    @MinLength(5)
    description: string;

    @ApiPropertyOptional({ example: 'Portón' })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiPropertyOptional({ example: 'MEDIUM', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] })
    @IsOptional()
    @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}
