import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ActivityModule } from './activity/activity.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';
import { UserModule } from './user/user.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { PayloadDto } from './auth/types/jwtPayload.dto';

/**
 * Returns whether GraphQL Playground should be enabled.
 * Disabled in production for security, enabled in development.
 */
export function getPlaygroundConfig(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Verifies a JWT token and returns the payload or null.
 * Returns null instead of throwing for invalid/expired tokens,
 * allowing public queries to proceed while protected routes
 * use AuthGuard to enforce authentication.
 */
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
    // Invalid or expired token - return null to allow public queries
    // Protected routes use AuthGuard which checks for jwtPayload
    return null;
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [JwtModule],
      inject: [JwtService, ConfigService],
      useFactory: async (
        jwtService: JwtService,
        configService: ConfigService,
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

            return {
              jwtPayload,
              req,
              res,
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
  providers: [AppService, SeedService],
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
