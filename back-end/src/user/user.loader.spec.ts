import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserModule } from './user.module';
import { TestModule, closeInMongodConnection } from 'src/test/test.module';
import { createUserLoader } from './user.loader';
import { randomUUID } from 'crypto';
import * as DataLoader from 'dataloader';
import { User } from './user.schema';
import mongoose from 'mongoose';

describe('UserLoader', () => {
  let userService: UserService;
  let userLoader: DataLoader<string, User | null>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, UserModule],
    }).compile();

    userService = module.get<UserService>(UserService);
    userLoader = createUserLoader(userService);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('should batch multiple user loads into a single findByIds call', async () => {
    const user1 = await userService.createUser({
      email: randomUUID() + '@test.com',
      password: 'password',
      firstName: 'User',
      lastName: 'One',
    });
    const user2 = await userService.createUser({
      email: randomUUID() + '@test.com',
      password: 'password',
      firstName: 'User',
      lastName: 'Two',
    });

    const findByIdsSpy = jest.spyOn(userService, 'findByIds');

    // Load both users via DataLoader
    const [loadedUser1, loadedUser2] = await Promise.all([
      userLoader.load(user1.id),
      userLoader.load(user2.id),
    ]);

    expect(findByIdsSpy).toHaveBeenCalledTimes(1);
    expect(findByIdsSpy).toHaveBeenCalledWith([user1.id, user2.id]);
    expect(loadedUser1?.email).toBe(user1.email);
    expect(loadedUser2?.email).toBe(user2.email);
  });

  it('should deduplicate loads for the same user ID', async () => {
    const user = await userService.createUser({
      email: randomUUID() + '@test.com',
      password: 'password',
      firstName: 'User',
      lastName: 'Deduped',
    });

    const findByIdsSpy = jest.spyOn(userService, 'findByIds');

    // Load the same user three times
    const [loadedUser1, loadedUser2, loadedUser3] = await Promise.all([
      userLoader.load(user.id),
      userLoader.load(user.id),
      userLoader.load(user.id),
    ]);

    expect(findByIdsSpy).toHaveBeenCalledTimes(1);
    // Deduplicated - only one ID should be passed
    expect(findByIdsSpy).toHaveBeenCalledWith([user.id]);
    expect(loadedUser1?.email).toBe(user.email);
    expect(loadedUser2?.email).toBe(user.email);
    expect(loadedUser3?.email).toBe(user.email);
  });

  it('should return null for non-existent user IDs', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const findByIdsSpy = jest.spyOn(userService, 'findByIds');

    const loadedUser = await userLoader.load(nonExistentId);

    expect(findByIdsSpy).toHaveBeenCalledWith([nonExistentId]);
    expect(loadedUser).toBeNull();
  });

  it('should preserve order of results matching input IDs', async () => {
    const user1 = await userService.createUser({
      email: randomUUID() + '@test.com',
      password: 'password',
      firstName: 'Alpha',
      lastName: 'User',
    });
    const user2 = await userService.createUser({
      email: randomUUID() + '@test.com',
      password: 'password',
      firstName: 'Beta',
      lastName: 'User',
    });
    const user3 = await userService.createUser({
      email: randomUUID() + '@test.com',
      password: 'password',
      firstName: 'Charlie',
      lastName: 'User',
    });

    // Request in reverse order
    const [loadedUser3, loadedUser1, loadedUser2] = await Promise.all([
      userLoader.load(user3.id),
      userLoader.load(user1.id),
      userLoader.load(user2.id),
    ]);

    // Results should match the order of the requests
    expect(loadedUser1?.firstName).toBe('Alpha');
    expect(loadedUser2?.firstName).toBe('Beta');
    expect(loadedUser3?.firstName).toBe('Charlie');
  });

  it('should handle a mix of existing and non-existing users', async () => {
    const existingUser = await userService.createUser({
      email: randomUUID() + '@test.com',
      password: 'password',
      firstName: 'Existing',
      lastName: 'User',
    });
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const findByIdsSpy = jest.spyOn(userService, 'findByIds');

    const [loadedExisting, loadedNull] = await Promise.all([
      userLoader.load(existingUser.id),
      userLoader.load(nonExistentId),
    ]);

    expect(findByIdsSpy).toHaveBeenCalledTimes(1);
    expect(loadedExisting?.email).toBe(existingUser.email);
    expect(loadedNull).toBeNull();
  });
});
