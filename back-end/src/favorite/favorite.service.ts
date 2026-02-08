import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite } from './favorite.schema';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name)
    private favoriteModel: Model<Favorite>,
    private activityService: ActivityService,
  ) {}

  async findByUser(userId: string): Promise<Favorite[]> {
    return this.favoriteModel.find({ user: userId }).sort({ order: 1 }).exec();
  }

  async findFavoritedActivityIds(userId: string): Promise<string[]> {
    const favorites = await this.favoriteModel
      .find({ user: userId })
      .select('activity')
      .lean();

    return favorites.map((f) => f.activity.toString());
  }

  async toggle(userId: string, activityId: string): Promise<boolean> {
    await this.activityService.findOne(activityId);

    const existing = await this.favoriteModel.findOne({
      user: userId,
      activity: activityId,
    });

    if (existing) {
      await this.favoriteModel.deleteOne({ _id: existing._id });
      return false;
    }

    const maxOrderFavorite = await this.favoriteModel
      .findOne({ user: userId })
      .sort({ order: -1 })
      .select('order')
      .lean();

    const newOrder = maxOrderFavorite ? maxOrderFavorite.order + 1 : 0;

    try {
      await this.favoriteModel.create({
        user: userId,
        activity: activityId,
        order: newOrder,
      });
      return true;
    } catch (error: unknown) {
      // Duplicate key (11000) from race condition — remove instead
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        await this.favoriteModel.deleteOne({
          user: userId,
          activity: activityId,
        });
        return false;
      }
      throw error;
    }
  }

  async reorder(userId: string, activityIds: string[]): Promise<Favorite[]> {
    const uniqueIds = new Set(activityIds);
    if (uniqueIds.size !== activityIds.length) {
      throw new BadRequestException('Duplicate activity IDs provided');
    }

    const userFavorites = await this.favoriteModel
      .find({ user: userId })
      .lean();

    if (activityIds.length !== userFavorites.length) {
      throw new BadRequestException(
        'Activity IDs count does not match your favorites count',
      );
    }

    const userActivityIds = new Set(
      userFavorites.map((f) => f.activity.toString()),
    );
    for (const id of activityIds) {
      if (!userActivityIds.has(id)) {
        throw new BadRequestException(
          'One or more activity IDs do not belong to your favorites',
        );
      }
    }

    const bulkOps = activityIds.map((activityId, index) => ({
      updateOne: {
        filter: { user: userId, activity: activityId },
        update: { $set: { order: index } },
      },
    }));

    await this.favoriteModel.bulkWrite(bulkOps);

    return this.findByUser(userId);
  }

  async removeByActivity(activityId: string): Promise<void> {
    await this.favoriteModel.deleteMany({ activity: activityId });
  }
}
