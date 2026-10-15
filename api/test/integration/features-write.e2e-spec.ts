import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../support/test-app';

const geometry = { type: 'Point', coordinates: [36.75, 33.5] };

describe('Features write integration', () => {
  let app: INestApplication;
  let stored: Record<string, unknown> | undefined;
  const clientQuery = jest.fn();
  const release = jest.fn();
  const poolQuery = jest.fn(async (sql: string, values: unknown[] = []) => {
    if (sql.includes('SELECT ST_IsValid')) return { rows: [{ valid: true, type: 'ST_Point' }], rowCount: 1 };
    if (sql.includes('INSERT INTO')) {
      const id = String(values.at(-2));
      stored = { type: 'Feature', id, geometry, properties: { base_id: 9001, base_name: values[0] } };
      return { rows: [{ feature: stored }], rowCount: 1 };
    }
    if (sql.includes('UPDATE')) {
      if (!stored) return { rows: [], rowCount: 0 };
      stored = { ...stored, properties: { ...(stored.properties as object), base_name: values[0] } };
      return { rows: [{ feature: stored }], rowCount: 1 };
    }
    if (sql.includes('SELECT jsonb_build_object')) {
      return stored ? { rows: [{ feature: stored }], rowCount: 1 } : { rows: [], rowCount: 0 };
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const connect = jest.fn(async () => ({ query: clientQuery, release }));

  beforeEach(async () => {
    stored = undefined;
    poolQuery.mockClear();
    connect.mockClear();
    clientQuery.mockReset();
    release.mockClear();
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') return { rows: [], rowCount: null };
      if (sql.includes('DELETE FROM')) {
        if (!stored) return { rows: [], rowCount: 0 };
        const id = stored.id;
        stored = undefined;
        return { rows: [{ id }], rowCount: 1 };
      }
      throw new Error(`Unexpected client SQL: ${sql}`);
    });
    app = await createTestApp({ query: poolQuery, connect } as never);
  });

  afterEach(async () => app.close());

  it('runs POST -> GET -> PATCH -> DELETE with parameterized SQL', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/features/Military_Bases')
      .set('Content-Type', 'application/geo+json')
      .send({ type: 'Feature', geometry, properties: { base_name: 'API Training Base' } })
      .expect(201);
    const id = created.body.id as string;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);

    await request(app.getHttpServer()).get(`/api/features/Military_Bases/${id}`).expect(200);
    const updated = await request(app.getHttpServer())
      .patch(`/api/features/Military_Bases/${id}`)
      .send({ properties: { base_name: 'API Training Base Updated' } })
      .expect(200);
    expect(updated.body.properties.base_name).toBe('API Training Base Updated');

    await request(app.getHttpServer()).delete(`/api/features/Military_Bases/${id}`).expect(204);
    await request(app.getHttpServer()).get(`/api/features/Military_Bases/${id}`).expect(404);

    const insertCall = poolQuery.mock.calls.find(([sql]) => String(sql).includes('INSERT INTO'));
    expect(insertCall?.[0]).toContain('ST_Transform(ST_SetSRID(ST_GeomFromGeoJSON');
    expect(insertCall?.[0]).not.toContain('API Training Base');
    expect(clientQuery).toHaveBeenCalledWith('BEGIN');
    expect(clientQuery).toHaveBeenCalledWith('COMMIT');
    expect(release).toHaveBeenCalled();
  });

  it('rejects invalid geometry and fields outside the allowlist', async () => {
    await request(app.getHttpServer())
      .post('/api/features/Military_Bases')
      .send({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [] }, properties: { base_name: 'x' } })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/features/Military_Bases')
      .send({ type: 'Feature', geometry, properties: { base_name: 'x', password_hash: 'blocked' } })
      .expect(400);
    expect(poolQuery).not.toHaveBeenCalled();
  });

  it('maps a foreign-key delete failure to 409 and rolls back', async () => {
    stored = { type: 'Feature', id: 'cd879868-67b2-4caf-b92e-127e1e5fbc20', geometry, properties: {} };
    clientQuery.mockImplementation(async (sql: string) => {
      if (sql === 'BEGIN' || sql === 'ROLLBACK') return { rows: [], rowCount: null };
      if (sql.includes('DELETE FROM')) throw Object.assign(new Error('foreign key'), { code: '23503' });
      throw new Error(`Unexpected client SQL: ${sql}`);
    });
    const response = await request(app.getHttpServer())
      .delete('/api/features/Military_Bases/cd879868-67b2-4caf-b92e-127e1e5fbc20')
      .expect(409);
    expect(response.body.code).toBe('CONFLICT');
    expect(clientQuery).toHaveBeenCalledWith('ROLLBACK');
  });
});