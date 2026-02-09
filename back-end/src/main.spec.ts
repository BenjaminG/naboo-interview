import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { BaseAppModule } from './app.module';
import { TestModule, closeInMongodConnection } from './test/test.module';

describe('Main (Security Headers)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, BaseAppModule],
    }).compile();

    app = module.createNestApplication();
    app.use(cookieParser());

    // Apply helmet with CSP disabled for non-production (same as main.ts will do)
    const isProduction = process.env.NODE_ENV === 'production';
    app.use(
      helmet({
        contentSecurityPolicy: isProduction ? undefined : false,
      }),
    );

    app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeInMongodConnection();
  });

  describe('Security Headers', () => {
    it('should include X-Content-Type-Options: nosniff header', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: '{ __typename }',
        });

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('should include X-Frame-Options header', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: '{ __typename }',
        });

      expect(response.headers['x-frame-options']).toBeDefined();
    });

    it('should include X-DNS-Prefetch-Control header', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: '{ __typename }',
        });

      expect(response.headers['x-dns-prefetch-control']).toBe('off');
    });

    it('should include X-Download-Options header', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: '{ __typename }',
        });

      expect(response.headers['x-download-options']).toBe('noopen');
    });
  });

  describe('GraphQL Functionality', () => {
    it('should allow GraphQL introspection queries', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: '{ __typename }',
        })
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.__typename).toBe('Query');
    });

    it('should allow GraphQL queries without interference from helmet', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              getLatestActivities {
                id
                name
              }
            }
          `,
        })
        .expect(200);

      expect(response.body.errors).toBeUndefined();
    });
  });

  describe('CORS', () => {
    it('should still work correctly after helmet is applied', async () => {
      const response = await request(app.getHttpServer())
        .options('/graphql')
        .set('Origin', process.env.FRONTEND_URL || 'http://localhost:3001')
        .set('Access-Control-Request-Method', 'POST');

      // CORS headers should be present
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});
