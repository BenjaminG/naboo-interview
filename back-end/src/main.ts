import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.use(cookieParser());

  // Apply helmet security headers
  // Disable CSP in non-production to allow GraphQL Playground
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );

  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
