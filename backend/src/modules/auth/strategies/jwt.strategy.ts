import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../core/prisma/prisma.service';

type JwtPayload = {
    sub: string;
    role: string;
    iat?: number;
    exp?: number;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
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
            throw new UnauthorizedException('Usuario no válido o inactivo');
        }

        return user;
    }
}
