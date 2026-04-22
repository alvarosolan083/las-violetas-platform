import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { ConfigModule } from './core/config/config.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { RedisModule } from './core/redis/redis.module';
import { RateLimitModule } from './core/rate-limit/rate-limit.module';

import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthModule } from './modules/health/health.module';
import { CondoModule } from './modules/condo/condo.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { TicketCommentsModule } from './modules/ticket-comments/ticket-comments.module';
import { TicketAttachmentsModule } from './modules/ticket-attachments/ticket-attachments.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { CommonSpacesModule } from './modules/common-spaces/common-spaces.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { DocumentsModule } from './modules/documents/documents.module';

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
    AnnouncementsModule,
    CommonSpacesModule,
    ReservationsModule,
    DocumentsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }