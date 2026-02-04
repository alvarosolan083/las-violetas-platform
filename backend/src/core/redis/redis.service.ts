import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

    async onModuleDestroy() {
        await this.redis.quit();
    }

    async set(key: string, value: string, ttlSeconds?: number) {
        if (ttlSeconds && ttlSeconds > 0) {
            await this.redis.set(key, value, 'EX', ttlSeconds);
            return;
        }
        await this.redis.set(key, value);
    }

    async get(key: string) {
        return this.redis.get(key);
    }

    async del(key: string) {
        return this.redis.del(key);
    }


    /**
     * GETDEL atómico (Redis >= 6.2):
     * - lee el valor
     * - borra la key
     * en una sola operación => blindado ante concurrencia.
     */
    async getDel(key: string): Promise<string | null> {
        // ioredis no tipa getdel en todas las versiones, por eso any
        // @ts-ignore
        return (this.redis as any).getdel(key) as Promise<string | null>;
    }

    async incrWithExpire(key: string, ttlSeconds: number) {
        const count = await this.redis.incr(key);

        // Si es el primer hit, fijamos TTL para crear la ventana
        if (count === 1 && ttlSeconds > 0) {
            await this.redis.expire(key, ttlSeconds);
        }

        return count;
    }

    async ping() {
        return this.redis.ping();
    }
}
