import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DecisionController } from '../../src/decision/decision.controller';
import { DecisionService } from '../../src/decision/decision.service';

const sessionId = '8cb1e8f8-e0ea-4cff-8c67-9cb20f77b36a';
const alertId = 'cb4d9476-3d06-4b4b-b85b-e897a8265148';

describe('Decision center HTTP contract', () => {
  let app: INestApplication;
  const service = {
    riskAssessments: jest.fn().mockResolvedValue([]),
    routeReadiness: jest.fn().mockResolvedValue([]),
    trackingSessions: jest.fn().mockResolvedValue([]),
    forecasts: jest.fn().mockResolvedValue([]),
    changes: jest.fn().mockResolvedValue([]),
    startTracking: jest.fn(),
    stopTracking: jest.fn(),
    reviewAlert: jest.fn().mockResolvedValue({ id: sessionId }),
    analyzeForecast: jest.fn(),
    reviewForecast: jest.fn().mockResolvedValue({ id: sessionId }),
    analyzeChange: jest.fn(),
    reviewChange: jest.fn().mockResolvedValue({ id: sessionId }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ controllers: [DecisionController], providers: [{ provide: DecisionService, useValue: service }] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it.each([
    ['/decision/risk', 'riskAssessments'],
    ['/decision/routes', 'routeReadiness'],
    ['/decision/alerts', 'trackingSessions'],
    ['/decision/forecast', 'forecasts'],
    ['/decision/changes', 'changes'],
  ])('publishes the documented read route %s', async (route, method) => {
    await request(app.getHttpServer()).get(`${route}?limit=25`).expect(200, []);
    expect(service[method as keyof typeof service]).toHaveBeenCalledWith(25);
  });

  it('forwards the human review decision and note without automatic approval', async () => {
    await request(app.getHttpServer()).post(`/decision/tracking/${sessionId}/alerts/${alertId}/review`).send({ decision: 'accepted', note: 'تم التحقق من المصدر المرفوع.' }).expect(201);
    expect(service.reviewAlert).toHaveBeenCalledWith(sessionId, alertId, 'accepted', 'تم التحقق من المصدر المرفوع.');
  });

  it('rejects invalid review states', async () => {
    await request(app.getHttpServer()).post(`/decision/tracking/${sessionId}/alerts/${alertId}/review`).send({ decision: 'approved' }).expect(400);
  });

  it('enforces the documented result limit', async () => {
    await request(app.getHttpServer()).get('/decision/risk?limit=0').expect(400);
    await request(app.getHttpServer()).get('/decision/risk?limit=101').expect(400);
  });

  it('requires user-uploaded files and never falls back to generated inputs', async () => {
    await request(app.getHttpServer()).post('/decision/tracking/start').expect(400);
    await request(app.getHttpServer()).post('/decision/forecast/analyze').expect(400);
    await request(app.getHttpServer()).post('/decision/change/analyze').expect(400);
    expect(service.startTracking).not.toHaveBeenCalled();
    expect(service.analyzeForecast).not.toHaveBeenCalled();
    expect(service.analyzeChange).not.toHaveBeenCalled();
  });

  it('forwards stop and review actions to the documented service methods', async () => {
    service.stopTracking.mockResolvedValueOnce({ id: sessionId, status: 'stopped' });
    await request(app.getHttpServer()).post(`/decision/tracking/${sessionId}/stop`).expect(201);
    await request(app.getHttpServer()).post(`/decision/forecast/${sessionId}/review`).send({ decision: 'rejected', note: 'بيانات غير كافية.' }).expect(201);
    await request(app.getHttpServer()).post(`/decision/change/${sessionId}/review`).send({ decision: 'accepted', note: 'تمت المراجعة البشرية.' }).expect(201);
    expect(service.stopTracking).toHaveBeenCalledWith(sessionId);
    expect(service.reviewForecast).toHaveBeenCalledWith(sessionId, 'rejected', 'بيانات غير كافية.');
    expect(service.reviewChange).toHaveBeenCalledWith(sessionId, 'accepted', 'تمت المراجعة البشرية.');
  });
});