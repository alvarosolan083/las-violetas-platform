import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createValidationPipe } from './core/validation/validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Evita procesos colgados / locks (muy útil en Windows + Prisma)
  app.enableShutdownHooks();

  app.useGlobalPipes(createValidationPipe());

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

  await app.listen(3000);
}

bootstrap();
