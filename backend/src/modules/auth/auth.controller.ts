import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOkResponse,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK) // login estándar -> 200
    @ApiOkResponse({
        description: 'JWT access y refresh tokens',
        schema: {
            example: {
                access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
        },
    })
    @ApiUnauthorizedResponse({
        description: 'Credenciales inválidas',
        schema: {
            example: { statusCode: 401, message: 'Credenciales inválidas', error: 'Unauthorized' },
        },
    })
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(body.email, body.password);
        return this.authService.login(user);
    }

    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOkResponse({
        description: 'Usuario autenticado (sin datos sensibles)',
        schema: {
            example: {
                id: 'cml2ab5eo000011bhzcrc84cs',
                name: 'Admin Test',
                email: 'admin@test.com',
                role: 'ADMIN',
                active: true,
                departmentId: null,
                createdAt: '2026-01-31T12:00:00.000Z',
                updatedAt: '2026-01-31T12:00:00.000Z',
            },
        },
    })
    me(@Req() req: any) {
        return req.user;
    }
}
