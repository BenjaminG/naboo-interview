import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Activity, ActivitySchema } from './activity.schema';
import { TestModule, closeInMongodConnection } from '../test/test.module';

describe('Activity Schema', () => {
  let activityModel: Model<Activity>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestModule,
        MongooseModule.forFeature([
          { name: Activity.name, schema: ActivitySchema },
        ]),
      ],
    }).compile();

    activityModel = module.get<Model<Activity>>(getModelToken(Activity.name));

    // Create the collection by creating and immediately deleting a document
    // This ensures the collection exists before we check indexes
    await activityModel.createCollection();

    // Ensure indexes are created
    await activityModel.ensureIndexes();
  });

  afterAll(async () => {
    await module.close();
    await closeInMongodConnection();
  });

  describe('Database Indexes', () => {
    it('should have an index on city field', async () => {
      const indexes = await activityModel.collection.indexes();
      const cityIndex = indexes.find(
        (index) => index.key && index.key.city === 1,
      );

      expect(cityIndex).toBeDefined();
      expect(cityIndex?.key).toEqual({ city: 1 });
    });

    it('should have an index on owner field', async () => {
      const indexes = await activityModel.collection.indexes();
      const ownerIndex = indexes.find(
        (index) => index.key && index.key.owner === 1,
      );

      expect(ownerIndex).toBeDefined();
      expect(ownerIndex?.key).toEqual({ owner: 1 });
    });

    it('should have an index on createdAt field (descending)', async () => {
      const indexes = await activityModel.collection.indexes();
      const createdAtIndex = indexes.find(
        (index) => index.key && index.key.createdAt === -1,
      );

      expect(createdAtIndex).toBeDefined();
      expect(createdAtIndex?.key).toEqual({ createdAt: -1 });
    });

    it('should have the default _id index', async () => {
      const indexes = await activityModel.collection.indexes();
      const idIndex = indexes.find((index) => index.key && index.key._id === 1);

      expect(idIndex).toBeDefined();
    });
  });
});
