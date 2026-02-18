import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityService } from 'src/activity/activity.service';
import { Activity, ActivitySchema } from 'src/activity/activity.schema';
import { User, UserSchema } from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';
import { ActivityModule } from '../activity/activity.module';
import { UserModule } from '../user/user.module';
import { FavoriteModule } from '../favorite/favorite.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
    UserModule,
    ActivityModule,
    FavoriteModule,
  ],
  providers: [UserService, ActivityService],
})
export class SeedModule {}
