import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { SeedService } from './seed/seed.service';

describe('AppService', () => {
  let appService: AppService;

  const mockSeedService = {
    execute: jest.fn(),
  };

  const originalSeedEnabled = process.env.SEED_ENABLED;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: SeedService,
          useValue: mockSeedService,
        },
      ],
    }).compile();

    appService = module.get<AppService>(AppService);
  });

  afterEach(() => {
    // Restore SEED_ENABLED after each test
    if (originalSeedEnabled === undefined) {
      delete process.env.SEED_ENABLED;
    } else {
      process.env.SEED_ENABLED = originalSeedEnabled;
    }
  });

  describe('onApplicationBootstrap', () => {
    describe('seed gating by SEED_ENABLED environment variable', () => {
      it('should run seed when SEED_ENABLED=true', async () => {
        process.env.SEED_ENABLED = 'true';

        await appService.onApplicationBootstrap();

        expect(mockSeedService.execute).toHaveBeenCalledTimes(1);
      });

      it('should NOT run seed when SEED_ENABLED is unset', async () => {
        delete process.env.SEED_ENABLED;

        await appService.onApplicationBootstrap();

        expect(mockSeedService.execute).not.toHaveBeenCalled();
      });

      it('should NOT run seed when SEED_ENABLED=false', async () => {
        process.env.SEED_ENABLED = 'false';

        await appService.onApplicationBootstrap();

        expect(mockSeedService.execute).not.toHaveBeenCalled();
      });

      it('should NOT run seed when SEED_ENABLED=0', async () => {
        process.env.SEED_ENABLED = '0';

        await appService.onApplicationBootstrap();

        expect(mockSeedService.execute).not.toHaveBeenCalled();
      });
    });
  });
});
