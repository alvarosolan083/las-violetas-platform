import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAttachmentDto {
    @ApiProperty({ example: 'https://example.com/foto-porton.jpg' })
    @IsString()
    @MinLength(8)
    url: string;

    @ApiPropertyOptional({ example: 'foto-porton.jpg' })
    @IsOptional()
    @IsString()
    filename?: string;
}
