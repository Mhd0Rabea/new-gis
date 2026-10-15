import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { json } from 'express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(json({ type: ['application/json', 'application/geo+json'] }));
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());

  const corsOrigin = config.get<string>('API_CORS_ORIGIN');
  if (corsOrigin) { app.enableCors({ origin: corsOrigin.split(',').map((value) => value.trim()) }); }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MGOS Spatial API')
    .setDescription('Local learning API for approved MGOS spatial layers.')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const host = config.get<string>('API_HOST', '127.0.0.1');
  const port = config.get<number>('API_PORT', 3000);
  await app.listen(port, host);
}

void bootstrap();
