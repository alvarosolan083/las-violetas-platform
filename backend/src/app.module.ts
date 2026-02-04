import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { ConfigModule } from './core/config/config.module';
import { RedisModule } from './core/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { RateLimitModule } from './core/rate-limit/rate-limit.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    RateLimitModule,
    AuthModule,
    HealthModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }