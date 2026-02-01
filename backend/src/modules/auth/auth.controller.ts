import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';
import { ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    async login(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(body.email, body.password);
        return this.authService.login({ id: user.id, role: user.role });
    }

    @Public()
    @Post('refresh')
    @ApiOkResponse({ description: 'Tokens rotados correctamente' })
    @ApiUnauthorizedResponse({ description: 'Refresh token inválido' })
    async refresh(@Body() body: RefreshDto) {
        return this.authService.refresh(body.refresh_token);
    }


    @Public()
    @Post('logout')
    async logout(@Body() body: LogoutDto) {
        return this.authService.logout(body.refresh_token);
    }

    @ApiBearerAuth('access-token')
    @UseGuards(JwtAuthGuard)
    @Get('me')
    me(@Req() req: any) {
        return req.user;
    }
}
