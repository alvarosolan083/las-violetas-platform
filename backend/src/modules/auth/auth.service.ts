import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

type JwtPayload = {
    sub: string;
    role: string;
    jti: string;
    iat?: number;
    exp?: number;
};

@Injectable()
export class AuthService {
    private readonly refreshSecret: string;

    private static readonly ACCESS_TTL_SECONDS = 15 * 60; // 15m
    private static readonly REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60; // 7d

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
        private readonly redis: RedisService,
    ) {
        this.refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET');
    }

    // ---------- Redis keys ----------
    private refreshKey(userId: string) {
        return `auth:refresh:jti:${userId}`;
    }

    private blacklistKey(jti: string) {
        return `auth:blacklist:access:${jti}`;
    }

    // ---------- Auth ----------
    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Credenciales inválidas');

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) throw new UnauthorizedException('Credenciales inválidas');

        if (!user.active) throw new UnauthorizedException('Usuario inactivo');

        return user;
    }

    async login(user: { id: string; role: string }) {
        const accessPayload: JwtPayload = {
            sub: user.id,
            role: user.role,
            jti: randomUUID(),
        };

        const refreshPayload: JwtPayload = {
            sub: user.id,
            role: user.role,
            jti: randomUUID(),
        };

        const access_token = await this.jwt.signAsync(accessPayload, {
            expiresIn: `${AuthService.ACCESS_TTL_SECONDS}s`,
        });

        const refresh_token = await this.jwt.signAsync(refreshPayload, {
            expiresIn: `${AuthService.REFRESH_TTL_SECONDS}s`,
            secret: this.refreshSecret,
        });

        await this.redis.set(
            this.refreshKey(user.id),
            refreshPayload.jti,
            AuthService.REFRESH_TTL_SECONDS,
        );

        return { access_token, refresh_token };
    }

    // ---------- Refresh rotation (ATÓMICA real) ----------
    async refresh(refresh_token: string) {
        let payload: JwtPayload;

        // 1) Verificar firma/exp del refresh token
        try {
            payload = await this.jwt.verifyAsync<JwtPayload>(refresh_token, {
                secret: this.refreshSecret,
            });
        } catch {
            throw new UnauthorizedException('Refresh token inválido');
        }

        // 2) ATÓMICO: lee y borra la sesión en una sola operación (GETDEL)
        const key = this.refreshKey(payload.sub);
        const storedJti = await this.redis.getDel(key);

        // IMPORTANTE: respuesta genérica (no filtramos si la sesión existe)
        if (!storedJti) {
            throw new UnauthorizedException('Refresh token inválido');
        }

        // 3) Validación contra replay
        if (storedJti !== payload.jti) {
            throw new UnauthorizedException('Refresh token inválido');
        }

        // 4) Emitimos nuevo par y re-escribimos el nuevo JTI en Redis
        return this.login({ id: payload.sub, role: payload.role });
    }

    // ---------- Logout & Blacklist ----------
    async logout(refresh_token: string) {
        try {
            const payload = await this.jwt.verifyAsync<JwtPayload>(refresh_token, {
                secret: this.refreshSecret,
            });
            await this.redis.del(this.refreshKey(payload.sub));
        } catch {
            // Silencioso por seguridad
        }
        return { message: 'Sesión cerrada' };
    }

    async blacklistAccessToken(jti: string, exp: number) {
        const now = Math.floor(Date.now() / 1000);
        const ttl = exp - now;

        if (ttl > 0) {
            await this.redis.set(this.blacklistKey(jti), 'true', ttl);
        }

        return { message: 'Access token revocado' };
    }

    async isAccessTokenBlacklisted(jti: string) {
        const val = await this.redis.get(this.blacklistKey(jti));
        return !!val;
    }
}
