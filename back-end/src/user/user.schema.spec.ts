import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { BaseAppModule } from '../app.module';
import { TestModule, closeInMongodConnection } from '../test/test.module';

describe('User Schema', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, BaseAppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeInMongodConnection();
  });

  describe('GraphQL Schema Introspection', () => {
    it('should NOT expose password field on User type', async () => {
      const introspectionQuery = `
        query {
          __type(name: "User") {
            fields {
              name
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: introspectionQuery })
        .expect(200);

      const userFields = response.body.data.__type.fields;
      const fieldNames = userFields.map(
        (field: { name: string }) => field.name,
      );

      // Password should NOT be exposed in the GraphQL schema
      expect(fieldNames).not.toContain('password');

      // These fields SHOULD be present
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('firstName');
      expect(fieldNames).toContain('lastName');
    });

    it('should NOT allow querying password through getMe', async () => {
      // This query should fail validation if password field is removed from schema
      const queryWithPassword = `
        query {
          __type(name: "User") {
            fields {
              name
              type {
                name
              }
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: queryWithPassword })
        .expect(200);

      const userFields = response.body.data.__type.fields;
      const passwordField = userFields.find(
        (field: { name: string }) => field.name === 'password',
      );

      // Password field should not exist in the schema
      expect(passwordField).toBeUndefined();
    });
  });
});
