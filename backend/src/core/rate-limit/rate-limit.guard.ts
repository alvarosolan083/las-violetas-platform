import {
    CanActivate,
    ExecutionContext,
    Injectable,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_OPTIONS, RateLimitOptions } from './rate-limit.constants';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly redis: RedisService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const opts = this.reflector.getAllAndOverride<RateLimitOptions>(
            RATE_LIMIT_OPTIONS,
            [context.getHandler(), context.getClass()],
        );

        // si no hay decorator, no aplicamos limit
        if (!opts) return true;

        const req = context.switchToHttp().getRequest();
        const ip = this.getClientIp(req);

        const key = `ratelimit:${opts.keyPrefix}:${ip}`;

        const count = await this.redis.incrWithExpire(key, opts.ttlSeconds);

        if (count > opts.limit) {
            throw new HttpException(
                { message: 'Demasiadas solicitudes. Intenta nuevamente más tarde.' },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        return true;
    }

    private getClientIp(req: any): string {
        const ip =
            req.ip ||
            req.headers?.['x-forwarded-for']?.split(',')?.[0]?.trim() ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress;

        return (ip ?? 'unknown').toString();
    }
}
