import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateCommentDto {
    @ApiProperty({ example: 'Ya fue revisado por mantenimiento.' })
    @IsString()
    @MinLength(2)
    message: string;
}
