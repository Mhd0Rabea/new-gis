import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../support/test-app';

const id = 'cd879868-67b2-4caf-b92e-127e1e5fbc20';
const feature = { type: 'Feature', id, geometry: { type: 'Point', coordinates: [36.75, 33.5] }, properties: { base_id: 1, base_name: 'Training Base 01' } };

describe('Features read contract', () => {
  let app: INestApplication;
  const query = jest.fn();

  beforeEach(async () => {
    query.mockReset();
    app = await createTestApp({ query } as never);
  });

  afterEach(async () => app.close());

  it('returns an EPSG:4326 FeatureCollection with pagination metadata', async () => {
    query.mockResolvedValueOnce({ rows: [{ total: 1 }], rowCount: 1 });
    query.mockResolvedValueOnce({ rows: [{ feature }], rowCount: 1 });

    const response = await request(app.getHttpServer()).get('/api/features/Military_Bases?limit=10&offset=0').expect(200);
    expect(response.body).toEqual({ type: 'FeatureCollection', features: [feature], metadata: { limit: 10, offset: 0, returned: 1, total: 1 } });
    expect(query.mock.calls[1][0]).toContain('ST_Transform(t.geom, 4326)');
  });

  it('returns one feature by UUID', async () => {
    query.mockResolvedValueOnce({ rows: [{ feature }], rowCount: 1 });
    await request(app.getHttpServer()).get(`/api/features/Military_Bases/${id}`).expect(200, feature);
  });

  it('rejects a layer outside the allowlist without querying PostgreSQL', async () => {
    const response = await request(app.getHttpServer()).get('/api/features/not_allowed').expect(400);
    expect(response.body.code).toBe('BAD_REQUEST');
    expect(query).not.toHaveBeenCalled();
  });

  it('rejects an invalid UUID and returns 404 for a missing feature', async () => {
    await request(app.getHttpServer()).get('/api/features/Military_Bases/not-a-uuid').expect(400);
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await request(app.getHttpServer()).get(`/api/features/Military_Bases/${id}`).expect(404);
  });
});