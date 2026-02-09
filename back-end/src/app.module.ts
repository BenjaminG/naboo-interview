import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ActivityModule } from './activity/activity.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';
import { UserModule } from './user/user.module';
import { UserService } from './user/user.service';
import { createUserLoader } from './user/user.loader';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { PayloadDto } from './auth/types/jwtPayload.dto';
import { GqlThrottlerGuard } from './throttler-gql.guard';

export function getPlaygroundConfig(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export async function verifyJwtToken(
  jwtService: JwtService,
  token: string | undefined,
  secret: string,
): Promise<PayloadDto | null> {
  if (!token) {
    return null;
  }

  try {
    return (await jwtService.verifyAsync(token, { secret })) as PayloadDto;
  } catch {
    return null;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 100, // 100 requests per minute (generous for normal use)
      },
    ]),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [JwtModule, UserModule],
      inject: [JwtService, ConfigService, UserService],
      useFactory: async (
        jwtService: JwtService,
        configService: ConfigService,
        userService: UserService,
      ) => {
        const secret = configService.get<string>('JWT_SECRET');
        return {
          autoSchemaFile: 'schema.gql',
          sortSchema: true,
          playground: getPlaygroundConfig(),
          buildSchemaOptions: { numberScalarMode: 'integer' },
          context: async ({ req, res }: { req: Request; res: Response }) => {
            const token =
              req.headers.jwt ?? (req.cookies && req.cookies['jwt']);

            const jwtPayload = await verifyJwtToken(
              jwtService,
              token as string | undefined,
              secret ?? '',
            );

            // Create a fresh DataLoader per request to avoid caching across requests
            const userLoader = createUserLoader(userService);

            return {
              jwtPayload,
              req,
              res,
              userLoader,
            };
          },
        };
      },
    }),
    AuthModule,
    UserModule,
    MeModule,
    ActivityModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SeedService,
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class BaseAppModule {}

@Module({
  imports: [
    BaseAppModule,
    MongooseModule.forRootAsync({
      useFactory: () => {
        return { uri: process.env.MONGO_URI };
      },
    }),
  ],
})
export class AppModule {}
