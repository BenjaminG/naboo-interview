import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService, escapeRegex } from './activity.service';
import { ActivityModule } from './activity.module';
import { TestModule, closeInMongodConnection } from 'src/test/test.module';
import { getModelToken } from '@nestjs/mongoose';
import { Activity } from './activity.schema';
import { Model, Types } from 'mongoose';

describe('ActivityService', () => {
  let service: ActivityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, ActivityModule],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('escapeRegex', () => {
  it('should escape all regex special characters', () => {
    const specialChars = '.*+?^${}()|[]\\';
    const escaped = escapeRegex(specialChars);
    // Each special character should be escaped with a backslash
    expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
  });

  it('should escape period (.) to literal', () => {
    expect(escapeRegex('New.York')).toBe('New\\.York');
  });

  it('should escape asterisk (*) to literal', () => {
    expect(escapeRegex('Paris*')).toBe('Paris\\*');
  });

  it('should escape plus (+) to literal', () => {
    expect(escapeRegex('a+b')).toBe('a\\+b');
  });

  it('should escape question mark (?) to literal', () => {
    expect(escapeRegex('London?')).toBe('London\\?');
  });

  it('should escape caret (^) to literal', () => {
    expect(escapeRegex('^start')).toBe('\\^start');
  });

  it('should escape dollar ($) to literal', () => {
    expect(escapeRegex('end$')).toBe('end\\$');
  });

  it('should escape curly braces {} to literal', () => {
    expect(escapeRegex('a{2,3}')).toBe('a\\{2,3\\}');
  });

  it('should escape parentheses () to literal', () => {
    expect(escapeRegex('(group)')).toBe('\\(group\\)');
  });

  it('should escape pipe (|) to literal', () => {
    expect(escapeRegex('a|b')).toBe('a\\|b');
  });

  it('should escape square brackets [] to literal', () => {
    expect(escapeRegex('[abc]')).toBe('\\[abc\\]');
  });

  it('should escape backslash (\\) to literal', () => {
    expect(escapeRegex('path\\file')).toBe('path\\\\file');
  });

  it('should handle empty string', () => {
    expect(escapeRegex('')).toBe('');
  });

  it('should leave normal text unchanged', () => {
    expect(escapeRegex('New York')).toBe('New York');
    expect(escapeRegex('Paris')).toBe('Paris');
  });

  it('should handle unicode city names', () => {
    expect(escapeRegex('Zürich')).toBe('Zürich');
    expect(escapeRegex('São Paulo')).toBe('São Paulo');
    expect(escapeRegex('東京')).toBe('東京');
  });
});

describe('ActivityService.findByCity - regex sanitization', () => {
  let service: ActivityService;
  let activityModel: Model<Activity>;
  const testOwnerId = new Types.ObjectId();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule, ActivityModule],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    activityModel = module.get<Model<Activity>>(getModelToken(Activity.name));

    // Clean up and seed test data
    await activityModel.deleteMany({});
    await activityModel.create([
      {
        name: 'Paris Walking Tour',
        city: 'Paris',
        price: 50,
        description: 'A walking tour in Paris',
        owner: testOwnerId,
      },
      {
        name: 'Paris.* Special',
        city: 'Paris',
        price: 60,
        description: 'Special Paris tour',
        owner: testOwnerId,
      },
      {
        name: 'New York City Tour',
        city: 'New York',
        price: 100,
        description: 'NYC tour',
        owner: testOwnerId,
      },
      {
        name: 'Zürich Lake Cruise',
        city: 'Zürich',
        price: 80,
        description: 'Cruise on Zürich lake',
        owner: testOwnerId,
      },
      {
        name: 'São Paulo Adventure',
        city: 'São Paulo',
        price: 70,
        description: 'Adventure in São Paulo',
        owner: testOwnerId,
      },
    ]);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('should treat ".*" as literal characters, not regex wildcards', async () => {
    // If not escaped, "Paris.*" would match any activity starting with "Paris"
    // When escaped, it should only match activities containing literal ".*"
    const results = await service.findByCity('Paris', 'Paris.*');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Paris.* Special');
  });

  it('should complete ReDoS payload "(a+)+$" in under 100ms', async () => {
    const start = Date.now();
    await service.findByCity('Paris', '(a+)+$');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('should return correct results for normal search "Walking"', async () => {
    const results = await service.findByCity('Paris', 'Walking');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Paris Walking Tour');
  });

  it('should return correct results for normal search "Tour"', async () => {
    const results = await service.findByCity('Paris', 'Tour');
    expect(results.length).toBe(1);
    expect(results[0].name).toContain('Tour');
  });

  it('should handle unicode city names in search - Zürich', async () => {
    const results = await service.findByCity('Zürich', 'Lake');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Zürich Lake Cruise');
  });

  it('should handle unicode city names in search - São Paulo', async () => {
    const results = await service.findByCity('São Paulo', 'Adventure');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('São Paulo Adventure');
  });

  it('should handle search with special regex chars in query', async () => {
    // Searching for "[abc]" should be literal, not a character class
    const results = await service.findByCity('Paris', '[abc]');
    expect(results.length).toBe(0);
  });
});
