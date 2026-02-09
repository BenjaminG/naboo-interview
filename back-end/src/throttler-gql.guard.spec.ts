import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './throttler-gql.guard';

describe('GqlThrottlerGuard', () => {
  describe('Unit Tests', () => {
    let guard: GqlThrottlerGuard;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])],
        providers: [GqlThrottlerGuard],
      }).compile();

      guard = module.get<GqlThrottlerGuard>(GqlThrottlerGuard);
    });

    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should extract req/res from GraphQL context', () => {
      const mockReq = { ip: '127.0.0.1' };
      const mockRes = { setHeader: jest.fn() };

      const mockGqlContext = {
        getContext: () => ({
          req: mockReq,
          res: mockRes,
        }),
      };

      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue(mockGqlContext as never);

      const mockExecutionContext = {
        getType: () => 'graphql',
        getHandler: () => ({}),
        getClass: () => ({}),
        getArgs: () => [],
        getArgByIndex: () => ({}),
        switchToHttp: () => ({}),
        switchToRpc: () => ({}),
        switchToWs: () => ({}),
      } as unknown as ExecutionContext;

      const result = guard.getRequestResponse(mockExecutionContext);

      expect(result.req).toBe(mockReq);
      expect(result.res).toBe(mockRes);
    });
  });
});
