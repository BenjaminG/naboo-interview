import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../user/user.schema';
import { Activity } from '../activity/activity.schema';

@ObjectType()
@Schema({ timestamps: true })
export class Favorite extends Document {
  @Field(() => ID)
  id!: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user!: User;

  @Field(() => Activity)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
  })
  activity!: Activity;

  @Field(() => Int)
  @Prop({ required: true, default: 0 })
  order!: number;

  @Field(() => Date)
  createdAt!: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);

FavoriteSchema.index({ user: 1, activity: 1 }, { unique: true });
FavoriteSchema.index({ user: 1, order: 1 });
