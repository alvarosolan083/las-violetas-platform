import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
    Strategy,
    'jwt-refresh',
) {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
            secretOrKey: config.get<string>('JWT_REFRESH_TOKEN_SECRET') || 'secret',
            ignoreExpiration: false,
        });
    }

    async validate(payload: any) {
        return payload;
    }
}
