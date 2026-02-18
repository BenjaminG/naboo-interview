import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  Parent,
  ResolveField,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { AuthGuard } from '../auth/auth.guard';
import { ContextWithJWTPayload } from '../auth/types/context';
import { getAuthPayload } from '../auth/utils/getAuthPayload';
import { Favorite } from './favorite.schema';
import { Activity } from '../activity/activity.schema';

@Resolver(() => Favorite)
export class FavoriteResolver {
  constructor(private readonly favoriteService: FavoriteService) {}

  @ResolveField(() => ID)
  id(@Parent() favorite: Favorite): string {
    return favorite._id.toString();
  }

  @ResolveField(() => Activity)
  async activity(@Parent() favorite: Favorite): Promise<Activity> {
    await favorite.populate('activity');
    return favorite.activity;
  }

  @Query(() => [Favorite])
  @UseGuards(AuthGuard)
  async getMyFavorites(
    @Context() context: ContextWithJWTPayload,
  ): Promise<Favorite[]> {
    return this.favoriteService.findByUser(getAuthPayload(context).id);
  }

  @Query(() => [String])
  @UseGuards(AuthGuard)
  async getMyFavoritedActivityIds(
    @Context() context: ContextWithJWTPayload,
  ): Promise<string[]> {
    return this.favoriteService.findFavoritedActivityIds(getAuthPayload(context).id);
  }

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async toggleFavorite(
    @Context() context: ContextWithJWTPayload,
    @Args('activityId', { type: () => ID }) activityId: string,
  ): Promise<boolean> {
    return this.favoriteService.toggle(getAuthPayload(context).id, activityId);
  }

  @Mutation(() => [Favorite])
  @UseGuards(AuthGuard)
  async reorderFavorites(
    @Context() context: ContextWithJWTPayload,
    @Args('activityIds', { type: () => [String] }) activityIds: string[],
  ): Promise<Favorite[]> {
    return this.favoriteService.reorder(getAuthPayload(context).id, activityIds);
  }
}
