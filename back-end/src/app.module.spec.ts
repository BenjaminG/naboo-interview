import { JwtService } from '@nestjs/jwt';
import { getPlaygroundConfig, verifyJwtToken } from './app.module';
import { PayloadDto } from './auth/types/jwtPayload.dto';

describe('AppModule GraphQL Configuration', () => {
  describe('playground configuration', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      // Restore NODE_ENV after each test
      if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
    });

    it('should disable playground when NODE_ENV=production', () => {
      process.env.NODE_ENV = 'production';
      expect(getPlaygroundConfig()).toBe(false);
    });

    it('should enable playground when NODE_ENV=development', () => {
      process.env.NODE_ENV = 'development';
      expect(getPlaygroundConfig()).toBe(true);
    });

    it('should enable playground when NODE_ENV is not set (dev default)', () => {
      delete process.env.NODE_ENV;
      expect(getPlaygroundConfig()).toBe(true);
    });
  });

  describe('JWT verification in context', () => {
    it('should return null when no JWT token is provided', async () => {
      const mockJwtService = {
        verifyAsync: jest.fn(),
      } as unknown as JwtService;

      const result = await verifyJwtToken(mockJwtService, undefined, 'secret');

      expect(result).toBeNull();
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should return valid payload when JWT token is valid', async () => {
      const validPayload: PayloadDto = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };
      const mockJwtService = {
        verifyAsync: jest.fn().mockResolvedValue(validPayload),
      } as unknown as JwtService;

      const result = await verifyJwtToken(
        mockJwtService,
        'valid.jwt.token',
        'secret',
      );

      expect(result).toEqual(validPayload);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid.jwt.token',
        { secret: 'secret' },
      );
    });

    it('should return null when JWT token is expired', async () => {
      const mockJwtService = {
        verifyAsync: jest.fn().mockRejectedValue(new Error('jwt expired')),
      } as unknown as JwtService;

      const result = await verifyJwtToken(
        mockJwtService,
        'expired.jwt.token',
        'secret',
      );

      expect(result).toBeNull();
    });

    it('should return null when JWT token is invalid', async () => {
      const mockJwtService = {
        verifyAsync: jest.fn().mockRejectedValue(new Error('invalid token')),
      } as unknown as JwtService;

      const result = await verifyJwtToken(
        mockJwtService,
        'invalid.jwt.token',
        'secret',
      );

      expect(result).toBeNull();
    });

    it('should return null when JWT token has invalid signature', async () => {
      const mockJwtService = {
        verifyAsync: jest
          .fn()
          .mockRejectedValue(new Error('invalid signature')),
      } as unknown as JwtService;

      const result = await verifyJwtToken(
        mockJwtService,
        'tampered.jwt.token',
        'secret',
      );

      expect(result).toBeNull();
    });
  });
});
