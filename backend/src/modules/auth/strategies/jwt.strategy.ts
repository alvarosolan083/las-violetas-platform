import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';

type JwtPayload = {
    sub: string;
    role: string;
    jti: string;
    iat?: number;
    exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
        });
    }

    private blacklistKey(jti: string) {
        return `auth:blacklist:access:${jti}`;
    }

    async validate(payload: JwtPayload) {
        if (!payload?.jti) {
            throw new UnauthorizedException('Token inválido');
        }
        if (!payload?.exp) {
            throw new UnauthorizedException('Token inválido');
        }

        const isBlacklisted = await this.redis.get(this.blacklistKey(payload.jti));
        if (isBlacklisted) {
            // Mensaje consistente (sin filtrar demasiado)
            throw new UnauthorizedException('Sesión revocada');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                departmentId: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user || !user.active) {
            throw new UnauthorizedException('Token inválido');
        }

        return {
            ...user,
            jti: payload.jti,
            exp: payload.exp,
        };
    }
}
