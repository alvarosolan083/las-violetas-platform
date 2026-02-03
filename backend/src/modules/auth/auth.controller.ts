import {
    Body,
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiTags,
    ApiOkResponse,
    ApiUnauthorizedResponse,
    ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutAccessDto } from './dto/logout-access.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.CREATED)
    @ApiOkResponse({ description: 'JWT access y refresh tokens' })
    @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
    @ApiBody({ type: LoginDto })
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(body.email, body.password);
        return this.authService.login({ id: user.id, role: user.role });
    }

    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: 'Tokens rotados correctamente' })
    @ApiUnauthorizedResponse({ description: 'Refresh token inválido' })
    @ApiBody({ type: RefreshDto })
    async refresh(@Body() body: RefreshDto) {
        return this.authService.refresh(body.refresh_token);
    }

    /**
     * Logout real:
     * - Revoca Access Token actual (blacklist por jti hasta exp)
     * - Opcional: si envías refresh_token, elimina sesión refresh (whitelist)
     */
    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOkResponse({ description: 'Sesión cerrada exitosamente' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    @ApiBody({ type: LogoutAccessDto })
    async logout(@Req() req: any, @Body() body: LogoutAccessDto) {
        // Si llegaste acá, ya pasaste por JwtStrategy.validate()
        const { jti, exp } = req.user;

        // 1) Revoca Access (blacklist hasta exp)
        await this.authService.blacklistAccessToken(jti, exp);

        // 2) Opcional: mata refresh session
        if (body?.refresh_token) {
            await this.authService.logout(body.refresh_token);
        }

        return { message: 'Sesión cerrada exitosamente' };
    }

    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOkResponse({ description: 'Usuario autenticado (sin datos sensibles)' })
    @ApiUnauthorizedResponse({ description: 'Token inválido o sesión revocada' })
    me(@Req() req: any) {
        return req.user;
    }
}
