import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe } from './core/validation/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RedisService } from './core/redis/redis.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173'],
  });

  app.enableShutdownHooks();
  app.useGlobalPipes(createValidationPipe());
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Las Violetas API')
    .setDescription('API para gestión del condominio Las Violetas')
    .setVersion('0.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  try {
    const redisService = app.get(RedisService);
    const result = await redisService.ping();
    console.log('🚀 REDIS STATUS =>', result);
  } catch (error: any) {
    console.error('❌ REDIS ERROR =>', error.message);
  }

  await app.listen(3000);
}

bootstrap();