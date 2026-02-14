import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { ConfigModule } from './core/config/config.module';
import { RedisModule } from './core/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { RateLimitModule } from './core/rate-limit/rate-limit.module';
import { CondoModule } from './modules/condo/condo.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { TicketCommentsModule } from './modules/ticket-comments/ticket-comments.module';
import { TicketAttachmentsModule } from './modules/ticket-attachments/ticket-attachments.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    RateLimitModule,
    AuthModule,
    HealthModule,
    CondoModule,
    TicketsModule,
    TicketCommentsModule,
    TicketAttachmentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }