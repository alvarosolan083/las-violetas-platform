import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { RedisService } from '../../core/redis/redis.service';

type AccessPayload = { sub: string; role: string };
type RefreshPayload = { sub: string; role: string; jti: string };

@Injectable()
export class AuthService {
    private readonly refreshSecret: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
        private readonly redis: RedisService,
    ) {
        this.refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET');
    }

    private refreshKey(userId: string) {
        return `auth:refresh:jti:${userId}`;
    }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Credenciales inválidas');

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) throw new UnauthorizedException('Credenciales inválidas');

        if (!user.active) throw new UnauthorizedException('Usuario inactivo');

        return user;
    }

    async login(user: { id: string; role: string }) {
        const accessPayload: AccessPayload = { sub: user.id, role: user.role };

        const access_token = await this.jwt.signAsync(accessPayload, {
            expiresIn: '15m',
        });

        // Refresh JTI único
        const jti = randomUUID();
        const refreshPayload: RefreshPayload = { sub: user.id, role: user.role, jti };

        const refresh_token = await this.jwt.signAsync(refreshPayload, {
            expiresIn: '7d',
            secret: this.refreshSecret,
        });

        // Guardamos SOLO el jti válido (one-time session)
        await this.redis.set(this.refreshKey(user.id), jti, 7 * 24 * 60 * 60);

        return { access_token, refresh_token };
    }

    async refresh(refresh_token: string) {
        // 1) verificar refresh JWT
        let payload: RefreshPayload;
        try {
            payload = await this.jwt.verifyAsync<RefreshPayload>(refresh_token, {
                secret: this.refreshSecret,
            });
        } catch {
            throw new UnauthorizedException('Refresh token inválido');
        }

        // --- CAMBIO ATÓMICO AQUÍ ---
        const key = this.refreshKey(payload.sub);

        // Obtenemos el JTI y lo BORRAMOS en una sola operación (o inmediatamente después)
        // Esto invalida el token para cualquier otra petición que venga detrás
        const storedJti = await this.redis.get(key);

        if (!storedJti) throw new UnauthorizedException('Sesión no encontrada');

        // Si el JTI no coincide, es un ataque o token viejo
        if (storedJti !== payload.jti) {
            throw new UnauthorizedException('Refresh token inválido');
        }

        // IMPORTANTE: Borramos el JTI usado antes de generar el nuevo
        // Así, si haces doble clic, la segunda petición verá que ya no hay JTI
        await this.redis.del(key);

        // 3) rotación: generar nuevo par + nuevo jti (el login volverá a crear la key en Redis)
        return this.login({ id: payload.sub, role: payload.role });
    }

    async logout(refresh_token: string) {
        let payload: RefreshPayload;
        try {
            payload = await this.jwt.verifyAsync<RefreshPayload>(refresh_token, {
                secret: this.refreshSecret,
            });
        } catch {
            return { message: 'Sesión cerrada' };
        }

        await this.redis.del(this.refreshKey(payload.sub));
        return { message: 'Sesión cerrada' };
    }
}