import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  Int,
  Parent,
  ResolveField,
  ID,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Activity } from './activity.schema';

import { CreateActivityInput } from './activity.inputs.dto';
import { User } from 'src/user/user.schema';
import { ContextWithJWTPayload } from 'src/auth/types/context';
import { getAuthPayload } from 'src/auth/utils/getAuthPayload';
import { PaginationArgs } from 'src/common/pagination.args';
import { PaginatedActivities } from 'src/common/paginated-result.type';

@Resolver(() => Activity)
export class ActivityResolver {
  constructor(private readonly activityService: ActivityService) {}

  @ResolveField(() => ID)
  id(@Parent() activity: Activity): string {
    return activity._id.toString();
  }

  @ResolveField(() => User, { nullable: true })
  async owner(
    @Parent() activity: Activity,
    @Context() ctx: ContextWithJWTPayload,
  ): Promise<User | null> {
    const ownerId = activity.owner?.toString();
    if (!ownerId) {
      return null;
    }
    return ctx.userLoader.load(ownerId);
  }

  @Query(() => PaginatedActivities)
  async getActivities(
    @Args() pagination: PaginationArgs,
  ): Promise<PaginatedActivities> {
    return this.activityService.findAll(pagination.limit, pagination.offset);
  }

  @Query(() => [Activity])
  async getLatestActivities(): Promise<Activity[]> {
    return this.activityService.findLatest();
  }

  @Query(() => PaginatedActivities)
  @UseGuards(AuthGuard)
  async getActivitiesByUser(
    @Context() context: ContextWithJWTPayload,
    @Args() pagination: PaginationArgs,
  ): Promise<PaginatedActivities> {
    return this.activityService.findByUser(
      getAuthPayload(context).id,
      pagination.limit,
      pagination.offset,
    );
  }

  @Query(() => [String])
  async getCities(): Promise<string[]> {
    const cities = await this.activityService.findCities();
    return cities;
  }

  @Query(() => PaginatedActivities)
  async getActivitiesByCity(
    @Args('city') city: string,
    @Args({ name: 'activity', nullable: true }) activity?: string,
    @Args({ name: 'price', nullable: true, type: () => Int }) price?: number,
    @Args() pagination?: PaginationArgs,
  ): Promise<PaginatedActivities> {
    return this.activityService.findByCity(
      city,
      activity,
      price,
      pagination?.limit,
      pagination?.offset,
    );
  }

  @Query(() => Activity)
  async getActivity(@Args('id') id: string): Promise<Activity> {
    return this.activityService.findOne(id);
  }

  @Mutation(() => Activity)
  @UseGuards(AuthGuard)
  async createActivity(
    @Context() context: ContextWithJWTPayload,
    @Args('createActivityInput') createActivity: CreateActivityInput,
  ): Promise<Activity> {
    return this.activityService.create(
      getAuthPayload(context).id,
      createActivity,
    );
  }
}
