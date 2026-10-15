import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ConfigService } from '@nestjs/config';
// eslint is intentionally not used; js-yaml types are unnecessary for this small contract check.
const yaml = require('js-yaml') as { load: (source: string) => unknown };
import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DATABASE_POOL } from '../../src/config/database.config';
import { FeaturesController } from '../../src/features/features.controller';
import { FeaturesService } from '../../src/features/features.service';

const contract = yaml.load(readFileSync(resolve(process.cwd(), '../specs/004-nestjs-spatial-api/contracts/openapi.yaml'), 'utf8')) as { paths: Record<string, Record<string, unknown>> };
const httpMethods = ['get', 'post', 'patch', 'delete', 'put'];

describe('Generated Swagger contract', () => {
  it('publishes every documented feature route and method', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FeaturesController],
      providers: [
        FeaturesService,
        { provide: DATABASE_POOL, useValue: { query: jest.fn(), connect: jest.fn() } },
        { provide: ConfigService, useValue: { get: (_key: string, fallback: unknown) => fallback } },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('MGOS Spatial API').setVersion('0.1.0').build());

    const contractRoutes = Object.fromEntries(Object.entries(contract.paths).map(([path, value]) => [path, Object.keys(value).filter((key) => httpMethods.includes(key)).sort()]));
    const generatedRoutes = Object.fromEntries(Object.entries(document.paths).map(([path, value]) => [path, Object.keys(value ?? {}).filter((key) => httpMethods.includes(key)).sort()]));
    expect(generatedRoutes).toEqual(contractRoutes);
    expect(contract.paths['/features/{layer}/{id}'].patch).toBeDefined();
    await app.close();
  });
});