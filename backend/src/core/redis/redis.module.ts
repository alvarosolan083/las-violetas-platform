import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const host = config.get<string>('REDIS_HOST') ?? 'localhost';
                const port = Number(config.get<string>('REDIS_PORT') ?? 6379);
                const password = config.get<string>('REDIS_PASSWORD') || undefined;

                return new Redis({
                    host,
                    port,
                    password,
                    maxRetriesPerRequest: 3,
                    enableReadyCheck: true,
                    lazyConnect: false,
                });
            },
        },
        RedisService,
    ],
    exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule { }
