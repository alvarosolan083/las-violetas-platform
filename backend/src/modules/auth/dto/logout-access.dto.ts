import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LogoutAccessDto {
    @ApiPropertyOptional({
        description: 'Opcional: refresh_token para cerrar sesión completa',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    })
    @IsOptional()
    @IsString()
    refresh_token?: string;
}
