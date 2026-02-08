import {
  BadRequestException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Favorite } from './favorite.schema';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectModel(Favorite.name)
    private favoriteModel: Model<Favorite>,
    @Inject(forwardRef(() => ActivityService))
    private activityService: ActivityService,
  ) {}

  /**
   * Find all favorites for a user, sorted by order ASC.
   */
  async findByUser(userId: string): Promise<Favorite[]> {
    return this.favoriteModel.find({ user: userId }).sort({ order: 1 }).exec();
  }

  /**
   * Find all favorited activity IDs for a user.
   * Returns an array of activity ID strings (lightweight, no population).
   */
  async findFavoritedActivityIds(userId: string): Promise<string[]> {
    const favorites = await this.favoriteModel
      .find({ user: userId })
      .select('activity')
      .lean();

    return favorites.map((f) => f.activity.toString());
  }

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

  /**
   * Reorder favorites for a user.
   * @param userId - The user ID
   * @param activityIds - Complete array of activity IDs in new order
   * @returns Updated favorites sorted by new order
   */
  async reorder(userId: string, activityIds: string[]): Promise<Favorite[]> {
    // Check for duplicates
    const uniqueIds = new Set(activityIds);
    if (uniqueIds.size !== activityIds.length) {
      throw new BadRequestException('Duplicate activity IDs provided');
    }

    // Get user's current favorites
    const userFavorites = await this.favoriteModel
      .find({ user: userId })
      .lean();

    // Validate count matches
    if (activityIds.length !== userFavorites.length) {
      throw new BadRequestException(
        'Activity IDs count does not match your favorites count',
      );
    }

    // Validate all IDs belong to user's favorites
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

    // Update order using bulkWrite for single DB round trip
    const bulkOps = activityIds.map((activityId, index) => ({
      updateOne: {
        filter: { user: userId, activity: activityId },
        update: { $set: { order: index } },
      },
    }));

    await this.favoriteModel.bulkWrite(bulkOps);

    // Return updated favorites sorted by new order
    return this.findByUser(userId);
  }

  /**
   * Remove all favorites for a given activity (cascade deletion).
   * @param activityId - The activity ID to remove favorites for
   */
  async removeByActivity(activityId: string): Promise<void> {
    await this.favoriteModel.deleteMany({ activity: activityId });
  }
}
