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

    async ping() {
        return this.redis.ping();
    }
}
