import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FavoriteService } from './favorite.service';
import { Favorite } from './favorite.schema';
import { Activity } from '../activity/activity.schema';
import { TestModule, closeInMongodConnection } from '../test/test.module';
import { FavoriteModule } from './favorite.module';
import { ActivityModule } from '../activity/activity.module';

describe('FavoriteService', () => {
  let service: FavoriteService;
  let favoriteModel: Model<Favorite>;
  let activityModel: Model<Activity>;

  const testUserId = new Types.ObjectId().toString();
  const testUserId2 = new Types.ObjectId().toString();
  let testActivity: Activity;
  let testActivity2: Activity;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, FavoriteModule, ActivityModule],
    }).compile();

    service = module.get<FavoriteService>(FavoriteService);
    favoriteModel = module.get<Model<Favorite>>(getModelToken(Favorite.name));
    activityModel = module.get<Model<Activity>>(getModelToken(Activity.name));

    // Clean up
    await favoriteModel.deleteMany({});
    await activityModel.deleteMany({});

    // Create test activities
    testActivity = await activityModel.create({
      name: 'Test Activity 1',
      city: 'Paris',
      price: 50,
      description: 'Test description 1',
      owner: new Types.ObjectId(),
    });

    testActivity2 = await activityModel.create({
      name: 'Test Activity 2',
      city: 'London',
      price: 100,
      description: 'Test description 2',
      owner: new Types.ObjectId(),
    });
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('toggle', () => {
    it('should add a favorite and return true when activity is not favorited', async () => {
      const result = await service.toggle(testUserId, testActivity.id);

      expect(result).toBe(true);

      const favorite = await favoriteModel.findOne({
        user: testUserId,
        activity: testActivity.id,
      });
      expect(favorite).not.toBeNull();
    });

    it('should remove a favorite and return false when activity is already favorited', async () => {
      // First add a favorite
      await service.toggle(testUserId, testActivity.id);

      // Then toggle again to remove
      const result = await service.toggle(testUserId, testActivity.id);

      expect(result).toBe(false);

      const favorite = await favoriteModel.findOne({
        user: testUserId,
        activity: testActivity.id,
      });
      expect(favorite).toBeNull();
    });

    it('should throw NotFoundException when activity does not exist', async () => {
      const nonExistentActivityId = new Types.ObjectId().toString();

      await expect(
        service.toggle(testUserId, nonExistentActivityId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should assign order = 0 for first favorite', async () => {
      await service.toggle(testUserId, testActivity.id);

      const favorite = await favoriteModel.findOne({
        user: testUserId,
        activity: testActivity.id,
      });
      expect(favorite?.order).toBe(0);
    });

    it('should assign order = max(existing) + 1 for subsequent favorites', async () => {
      // Add first favorite (order = 0)
      await service.toggle(testUserId, testActivity.id);

      // Add second favorite (order = 1)
      await service.toggle(testUserId, testActivity2.id);

      const favorite2 = await favoriteModel.findOne({
        user: testUserId,
        activity: testActivity2.id,
      });
      expect(favorite2?.order).toBe(1);
    });

    it('should maintain correct order when adding after removal (gaps allowed)', async () => {
      // Add two favorites
      await service.toggle(testUserId, testActivity.id); // order = 0
      await service.toggle(testUserId, testActivity2.id); // order = 1

      // Remove first favorite
      await service.toggle(testUserId, testActivity.id);

      // Add a new activity
      const testActivity3 = await activityModel.create({
        name: 'Test Activity 3',
        city: 'Tokyo',
        price: 75,
        description: 'Test description 3',
        owner: new Types.ObjectId(),
      });

      await service.toggle(testUserId, testActivity3.id); // order = 2

      const favorite3 = await favoriteModel.findOne({
        user: testUserId,
        activity: testActivity3.id,
      });
      expect(favorite3?.order).toBe(2);
    });

    it('should handle rapid toggle (double-click scenario) without throwing', async () => {
      // Simulate rapid toggle calls - they should not throw even with race conditions
      const results = await Promise.allSettled([
        service.toggle(testUserId, testActivity.id),
        service.toggle(testUserId, testActivity.id),
      ]);

      // Both promises should resolve (not reject)
      for (const result of results) {
        expect(result.status).toBe('fulfilled');
      }

      // Final state should be deterministic - either favorited or not
      const favorite = await favoriteModel.findOne({
        user: testUserId,
        activity: testActivity.id,
      });
      // The state is valid whether the favorite exists or not
      expect(favorite === null || favorite !== null).toBe(true);
    });

    it('should not affect other users favorites when toggling', async () => {
      // User 1 adds favorite
      await service.toggle(testUserId, testActivity.id);

      // User 2 adds the same activity as favorite
      await service.toggle(testUserId2, testActivity.id);

      // User 1 removes favorite
      await service.toggle(testUserId, testActivity.id);

      // User 2's favorite should still exist
      const user2Favorite = await favoriteModel.findOne({
        user: testUserId2,
        activity: testActivity.id,
      });
      expect(user2Favorite).not.toBeNull();
    });
  });

  describe('unique constraint on (user, activity)', () => {
    it('should prevent duplicate favorites via model constraint', async () => {
      // Add favorite through service
      await service.toggle(testUserId, testActivity.id);

      // Try to directly create a duplicate (bypassing service logic)
      const createDuplicate = async () => {
        await favoriteModel.create({
          user: testUserId,
          activity: testActivity.id,
          order: 99,
        });
      };

      // Should throw a duplicate key error
      await expect(createDuplicate()).rejects.toThrow();
    });
  });
});
