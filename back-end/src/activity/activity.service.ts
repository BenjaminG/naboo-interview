import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Activity } from './activity.schema';
import { CreateActivityInput } from './activity.inputs.dto';
import { FavoriteService } from '../favorite/favorite.service';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(Activity.name)
    private activityModel: Model<Activity>,
    @Inject(forwardRef(() => FavoriteService))
    private favoriteService: FavoriteService,
  ) {}

  async findAll(limit = 15, offset = 0): Promise<PaginatedResult<Activity>> {
    const [items, total] = await Promise.all([
      this.activityModel
        .find()
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.activityModel.countDocuments().exec(),
    ]);
    return { items, total };
  }

  async findLatest(): Promise<Activity[]> {
    return this.activityModel.find().sort({ createdAt: -1 }).limit(3).exec();
  }

  async findByUser(
    userId: string,
    limit = 15,
    offset = 0,
  ): Promise<PaginatedResult<Activity>> {
    const filter: FilterQuery<Activity> = { owner: userId };
    const [items, total] = await Promise.all([
      this.activityModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.activityModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activityModel.findById(id).exec();
    if (!activity) throw new NotFoundException();
    return activity;
  }

  async findByIds(ids: string[]): Promise<Activity[]> {
    return this.activityModel.find({ _id: { $in: ids } }).exec();
  }

  async create(userId: string, data: CreateActivityInput): Promise<Activity> {
    const activity = await this.activityModel.create({
      ...data,
      owner: userId,
    });
    return activity;
  }

  async findCities(): Promise<string[]> {
    return this.activityModel.distinct('city').exec();
  }

  async findByCity(
    city: string,
    activity?: string,
    price?: number,
    limit = 15,
    offset = 0,
  ): Promise<PaginatedResult<Activity>> {
    const filter: FilterQuery<Activity> = {
      $and: [
        { city },
        ...(price ? [{ price }] : []),
        ...(activity
          ? [{ name: { $regex: escapeRegex(activity), $options: 'i' } }]
          : []),
      ],
    };
    const [items, total] = await Promise.all([
      this.activityModel.find(filter).skip(offset).limit(limit).exec(),
      this.activityModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async countDocuments(): Promise<number> {
    return this.activityModel.estimatedDocumentCount().exec();
  }
}
