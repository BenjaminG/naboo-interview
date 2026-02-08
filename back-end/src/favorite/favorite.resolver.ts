import { Resolver, Mutation, Args, Context, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { AuthGuard } from '../auth/auth.guard';
import { ContextWithJWTPayload } from '../auth/types/context';

@Resolver()
export class FavoriteResolver {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Mutation(() => Boolean)
  @UseGuards(AuthGuard)
  async toggleFavorite(
    @Context() context: ContextWithJWTPayload,
    @Args('activityId', { type: () => ID }) activityId: string,
  ): Promise<boolean> {
    return this.favoriteService.toggle(context.jwtPayload.id, activityId);
  }
}
