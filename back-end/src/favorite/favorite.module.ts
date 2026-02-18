import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Favorite, FavoriteSchema } from './favorite.schema';
import { FavoriteService } from './favorite.service';
import { FavoriteResolver } from './favorite.resolver';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Favorite.name, schema: FavoriteSchema },
    ]),
    ActivityModule,
  ],
  providers: [FavoriteService, FavoriteResolver],
  exports: [FavoriteService],
})
export class FavoriteModule {}
