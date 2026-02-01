import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) { }

    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UnauthorizedException('Credenciales inválidas');

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) throw new UnauthorizedException('Credenciales inválidas');

        return user;
    }

    async login(user: { id: string; role: string }) {
        const payload = { sub: user.id, role: user.role };

        const access_token = await this.jwt.signAsync(payload, {
            expiresIn: '15m',
        });

        const refresh_token = await this.jwt.signAsync(payload, {
            expiresIn: '7d',
            secret: this.config.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
        });

        return { access_token, refresh_token };
    }
}
