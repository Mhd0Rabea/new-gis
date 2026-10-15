import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Pool } from 'pg';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ApiExceptionFilter } from '../../src/common/api-exception.filter';
import { DATABASE_POOL } from '../../src/config/database.config';

const describeLive = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeLive('Live PostGIS CRUD integration', () => {
  let app: INestApplication;
  let pool: Pool;
  let id: string | undefined;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    pool = app.get<Pool>(DATABASE_POOL);
  });

  afterAll(async () => {
    if (pool && id) await pool.query('DELETE FROM mgos.military_bases WHERE id = $1', [id]);
    if (app) await app.close();
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('writes EPSG:4326 GeoJSON as a valid EPSG:32637 PostGIS geometry', async () => {
    const baseId = 1_900_000_000 + Math.floor(Date.now() / 1000) % 90_000_000;
    const created = await request(app.getHttpServer())
      .post('/api/features/Military_Bases')
      .send({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [36.75, 33.5] },
        properties: { base_name: 'API Live Test Base' },
      })
      .expect(201);
    id = created.body.id;

    const geometryCheck = await pool.query(
      'SELECT ST_SRID(geom) AS srid, ST_IsValid(geom) AS valid FROM mgos.military_bases WHERE id = $1',
      [id],
    );
    expect(geometryCheck.rows[0]).toEqual({ srid: 32637, valid: true });

    await request(app.getHttpServer())
      .patch(`/api/features/Military_Bases/${id}`)
      .send({ properties: { base_name: 'API Live Test Base Updated' } })
      .expect(200);
    await request(app.getHttpServer()).delete(`/api/features/Military_Bases/${id}`).expect(204);
    id = undefined;
  });
});