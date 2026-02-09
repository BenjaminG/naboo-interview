import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Max, Min } from 'class-validator';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true, defaultValue: 15 })
  @Min(1)
  @Max(100)
  limit = 15;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @Min(0)
  offset = 0;
}
