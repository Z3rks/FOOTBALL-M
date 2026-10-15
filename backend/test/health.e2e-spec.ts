import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

// Requiere la base de datos de Docker levantada (npm run db:up).
describe('Health (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/health es público y confirma que la API y la base de datos están arriba', () => {
    return request(app.getHttpServer()).get('/v1/health').expect(200).expect({ status: 'ok', database: 'up' });
  });

  it('Plan de Seguridad A05: responde con las cabeceras de seguridad de Helmet y sin X-Powered-By', async () => {
    const res = await request(app.getHttpServer()).get('/v1/health').expect(200);
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toContain('max-age=');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
