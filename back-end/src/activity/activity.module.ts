import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { ActivityService } from './activity.service';
import { Activity, ActivitySchema } from './activity.schema';
import { ActivityResolver } from './activity.resolver';
import { UserModule } from 'src/user/user.module';
import { FavoriteModule } from 'src/favorite/favorite.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activity.name, schema: ActivitySchema },
    ]),
    AuthModule,
    UserModule,
    forwardRef(() => FavoriteModule),
  ],
  exports: [ActivityService],
  providers: [ActivityService, ActivityResolver],
})
export class ActivityModule {}
