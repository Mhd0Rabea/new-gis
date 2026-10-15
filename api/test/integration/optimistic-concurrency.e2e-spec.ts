import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../support/test-app';
const id='cd879868-67b2-4caf-b92e-127e1e5fbc20';
describe('Optimistic concurrency integration',()=>{
 let app:INestApplication;const query=jest.fn();
 beforeEach(async()=>{query.mockReset();app=await createTestApp({query} as never)});afterEach(async()=>app.close());
 it('rejects a stale expectedVersion without overwriting the current row',async()=>{
  query.mockResolvedValueOnce({rows:[],rowCount:0});
  const response=await request(app.getHttpServer()).patch(`/api/features/Military_Bases/${id}`).send({properties:{notes:'قيمة مؤقتة'},expectedVersion:3}).expect(409);
  expect(response.body.code).toBe('CONFLICT');expect(query.mock.calls[0][0]).toContain('t.row_version');expect(query.mock.calls[0][1]).toEqual(['قيمة مؤقتة',id,3]);
 });
});
