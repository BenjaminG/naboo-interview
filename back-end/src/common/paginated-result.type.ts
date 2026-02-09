import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Activity } from '../activity/activity.schema';

@ObjectType()
export class PaginatedActivities {
  @Field(() => [Activity])
  items!: Activity[];

  @Field(() => Int)
  total!: number;
}
