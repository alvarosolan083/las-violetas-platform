import { Controller, Get, ForbiddenException } from '@nestjs/common';
import { ApiOkResponse, ApiTags, ApiForbiddenResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../core/redis/redis.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly redis: RedisService,
        private readonly config: ConfigService,
    ) { }

    @Public()
    @Get('redis')
    @ApiOkResponse({ description: 'Redis PING OK' })
    @ApiForbiddenResponse({ description: 'Not available (only development)' })
    async redisPing() {
        const nodeEnv = this.config.get<string>('NODE_ENV') ?? 'development';
        if (nodeEnv !== 'development') {
            throw new ForbiddenException('Not available');
        }

        const pong = await this.redis.ping();
        return { redis: pong };
    }
}
