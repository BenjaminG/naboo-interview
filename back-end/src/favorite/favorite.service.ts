import { Injectable } from '@nestjs/common';
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

  /**
   * Toggle a favorite for a user.
   * If the activity is not favorited, add it and return true.
   * If the activity is already favorited, remove it and return false.
   */
  async toggle(userId: string, activityId: string): Promise<boolean> {
    // Verify activity exists (throws NotFoundException if not)
    await this.activityService.findOne(activityId);

    // Check if already favorited
    const existing = await this.favoriteModel.findOne({
      user: userId,
      activity: activityId,
    });

    if (existing) {
      // Remove favorite
      await this.favoriteModel.deleteOne({ _id: existing._id });
      return false;
    }

    // Add new favorite with order = max(existing) + 1
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
      // Handle duplicate key error from race condition (rapid toggle)
      // MongoDB error code 11000 = duplicate key
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 11000
      ) {
        // Another concurrent request already created the favorite,
        // so we should remove it instead
        await this.favoriteModel.deleteOne({
          user: userId,
          activity: activityId,
        });
        return false;
      }
      throw error;
    }
  }
}
