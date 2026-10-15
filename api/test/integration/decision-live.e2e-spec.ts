import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { ApiExceptionFilter } from '../../src/common/api-exception.filter';
import { DATABASE_POOL } from '../../src/config/database.config';
import { DecisionController } from '../../src/decision/decision.controller';
import { DecisionService } from '../../src/decision/decision.service';

const describeLive = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeLive('Live decision center integration with user data', () => {
  let app: INestApplication;
  let pool: Pool;

  const storedCounts = async () => {
    const result = await pool.query(
      'SELECT ' +
      '(SELECT count(*) FROM mgos.decision_tracking_sessions)::integer AS tracking_sessions, ' +
      '(SELECT count(*) FROM mgos.decision_alerts)::integer AS alerts, ' +
      '(SELECT count(*) FROM mgos.decision_forecasts)::integer AS forecasts, ' +
      '(SELECT count(*) FROM mgos.decision_change_candidates)::integer AS changes',
    );
    return result.rows[0];
  };

  beforeAll(async () => {
    pool = new Pool({
      connectionString: process.env.TEST_DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
    const config = new ConfigService(process.env);
    const moduleRef = await Test.createTestingModule({
      controllers: [DecisionController],
      providers: [
        DecisionService,
        { provide: DATABASE_POOL, useValue: pool },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (pool) await pool.end();
  });

  it('reads risk assessments from existing PostGIS layers without a generated fallback', async () => {
    const response = await request(app.getHttpServer()).get('/api/decision/risk?limit=100').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    for (const item of response.body) {
      expect(item.source).toBe('user-uploaded-layer');
      expect(item.reviewRequired).toBe(true);
      expect(item.score).toBeGreaterThanOrEqual(0);
      expect(item.score).toBeLessThanOrEqual(100);
      expect(item.confidence).toBeGreaterThanOrEqual(0);
      expect(item.confidence).toBeLessThanOrEqual(1);
      const hasAvailableFactor = item.factors.some((factor: { available: boolean }) => factor.available);
      if (!hasAvailableFactor) {
        expect(item.score).toBe(0);
        expect(item.confidence).toBe(0);
      }
    }
  });

  it('returns only persisted route and analysis records and does not create substitutes', async () => {
    const before = await storedCounts();
    const routes = await request(app.getHttpServer()).get('/api/decision/routes?limit=100').expect(200);
    const alerts = await request(app.getHttpServer()).get('/api/decision/alerts?limit=100').expect(200);
    const forecasts = await request(app.getHttpServer()).get('/api/decision/forecast?limit=100').expect(200);
    const changes = await request(app.getHttpServer()).get('/api/decision/changes?limit=100').expect(200);
    expect(Array.isArray(routes.body)).toBe(true);
    expect(Array.isArray(alerts.body)).toBe(true);
    expect(Array.isArray(forecasts.body)).toBe(true);
    expect(Array.isArray(changes.body)).toBe(true);
    expect(await storedCounts()).toEqual(before);
  });

  it('rejects analyses without user files and leaves persisted data unchanged', async () => {
    const before = await storedCounts();
    await request(app.getHttpServer()).post('/api/decision/tracking/start').expect(400);
    await request(app.getHttpServer()).post('/api/decision/forecast/analyze').expect(400);
    await request(app.getHttpServer()).post('/api/decision/change/analyze').expect(400);
    expect(await storedCounts()).toEqual(before);
  });
});
