import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;

  const mockAuthService = {
    signIn: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  describe('login', () => {
    const mockCookie = jest.fn();
    const mockContext = {
      res: {
        cookie: mockCookie,
      },
    };

    const signInInput = {
      email: 'test@example.com',
      password: 'password123',
    };

    beforeEach(() => {
      mockCookie.mockClear();
      mockAuthService.signIn.mockResolvedValue({
        access_token: 'test-jwt-token',
      });
    });

    it('should set cookie with httpOnly flag', async () => {
      await resolver.login(signInInput, mockContext);

      expect(mockCookie).toHaveBeenCalledWith(
        'jwt',
        'test-jwt-token',
        expect.objectContaining({
          httpOnly: true,
        }),
      );
    });

    it('should set cookie with sameSite strict flag', async () => {
      await resolver.login(signInInput, mockContext);

      expect(mockCookie).toHaveBeenCalledWith(
        'jwt',
        'test-jwt-token',
        expect.objectContaining({
          sameSite: 'strict',
        }),
      );
    });

    it('should set cookie with path /', async () => {
      await resolver.login(signInInput, mockContext);

      expect(mockCookie).toHaveBeenCalledWith(
        'jwt',
        'test-jwt-token',
        expect.objectContaining({
          path: '/',
        }),
      );
    });

    it('should set secure: true when NODE_ENV is production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await resolver.login(signInInput, mockContext);

      expect(mockCookie).toHaveBeenCalledWith(
        'jwt',
        'test-jwt-token',
        expect.objectContaining({
          secure: true,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should set secure: false when NODE_ENV is development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await resolver.login(signInInput, mockContext);

      expect(mockCookie).toHaveBeenCalledWith(
        'jwt',
        'test-jwt-token',
        expect.objectContaining({
          secure: false,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should set secure: false when NODE_ENV is not set', async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      await resolver.login(signInInput, mockContext);

      expect(mockCookie).toHaveBeenCalledWith(
        'jwt',
        'test-jwt-token',
        expect.objectContaining({
          secure: false,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should include all required cookie flags together', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await resolver.login(signInInput, mockContext);

      expect(mockCookie).toHaveBeenCalledWith('jwt', 'test-jwt-token', {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        path: '/',
        domain: process.env.FRONTEND_DOMAIN,
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('logout', () => {
    const mockClearCookie = jest.fn();
    const mockContext = {
      res: {
        clearCookie: mockClearCookie,
      },
    };

    beforeEach(() => {
      mockClearCookie.mockClear();
    });

    it('should clear cookie with httpOnly flag', async () => {
      await resolver.logout(mockContext);

      expect(mockClearCookie).toHaveBeenCalledWith(
        'jwt',
        expect.objectContaining({
          httpOnly: true,
        }),
      );
    });

    it('should clear cookie with sameSite strict flag', async () => {
      await resolver.logout(mockContext);

      expect(mockClearCookie).toHaveBeenCalledWith(
        'jwt',
        expect.objectContaining({
          sameSite: 'strict',
        }),
      );
    });

    it('should clear cookie with path /', async () => {
      await resolver.logout(mockContext);

      expect(mockClearCookie).toHaveBeenCalledWith(
        'jwt',
        expect.objectContaining({
          path: '/',
        }),
      );
    });

    it('should set secure: true when NODE_ENV is production for logout', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await resolver.logout(mockContext);

      expect(mockClearCookie).toHaveBeenCalledWith(
        'jwt',
        expect.objectContaining({
          secure: true,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should set secure: false when NODE_ENV is development for logout', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await resolver.logout(mockContext);

      expect(mockClearCookie).toHaveBeenCalledWith(
        'jwt',
        expect.objectContaining({
          secure: false,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should include all required cookie flags together for logout', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await resolver.logout(mockContext);

      expect(mockClearCookie).toHaveBeenCalledWith('jwt', {
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        path: '/',
        domain: process.env.FRONTEND_DOMAIN,
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});
