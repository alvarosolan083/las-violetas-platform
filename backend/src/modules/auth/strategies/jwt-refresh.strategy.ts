import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

type JwtRefreshPayload = {
    sub: string;
    role: string;
    jti?: string;
    iat?: number;
    exp?: number;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(private readonly config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
        });
    }

    async validate(payload: JwtRefreshPayload) {
        // La verificación real (whitelist/rotación) se hace en AuthService.refresh()
        if (!payload?.sub) throw new UnauthorizedException('Refresh token inválido');
        return payload;
    }
}
