import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { ConfigModule } from './core/config/config.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  providers: [
    // Todo endpoint es privado por defecto.
    // Para hacerlo público, usamos @Public().
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
