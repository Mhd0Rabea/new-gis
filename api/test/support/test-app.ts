import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import { ApiExceptionFilter } from '../../src/common/api-exception.filter';
import { DATABASE_POOL } from '../../src/config/database.config';
import { FeaturesController } from '../../src/features/features.controller';
import { FeaturesService } from '../../src/features/features.service';
import { json } from 'express';

export async function createTestApp(pool: Partial<Pool>): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [FeaturesController],
    providers: [
      FeaturesService,
      { provide: DATABASE_POOL, useValue: pool },
      { provide: ConfigService, useValue: { get: (_key: string, fallback: unknown) => fallback } },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.use(json({ type: ['application/json', 'application/geo+json'] }));
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.init();
  return app;
}