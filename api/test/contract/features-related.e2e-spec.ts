import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../support/test-app';

const id = 'cd879868-67b2-4caf-b92e-127e1e5fbc20';

describe('Related records contract', () => {
  let app: INestApplication;
  const query = jest.fn();

  beforeEach(async () => {
    query.mockReset();
    app = await createTestApp({ query } as never);
  });

  afterEach(async () => app.close());

  it('returns records only from an allowed relationship', async () => {
    query.mockResolvedValueOnce({ rows: [{ exists: 1 }], rowCount: 1 });
    query.mockResolvedValueOnce({ rows: [{ record: { full_name: 'Synthetic Person 01' } }], rowCount: 1 });
    const response = await request(app.getHttpServer()).get(`/api/features/Military_Bases/${id}/related/Military_Personnel`).expect(200);
    expect(response.body).toEqual([{ full_name: 'Synthetic Person 01' }]);
    expect(query.mock.calls[1][0]).toContain('"military_personnel"');
  });

  it('rejects a relationship outside the allowlist without querying PostgreSQL', async () => {
    await request(app.getHttpServer()).get(`/api/features/Military_Bases/${id}/related/system_users`).expect(400);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing parent and an empty array when no child records exist', async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await request(app.getHttpServer()).get(`/api/features/Military_Bases/${id}/related/Military_Personnel`).expect(404);

    query.mockResolvedValueOnce({ rows: [{ exists: 1 }], rowCount: 1 });
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await request(app.getHttpServer()).get(`/api/features/Military_Bases/${id}/related/Military_Personnel`).expect(200, []);
  });
});