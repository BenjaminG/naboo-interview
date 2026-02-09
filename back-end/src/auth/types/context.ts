import { Request, Response } from 'express';
import * as DataLoader from 'dataloader';
import { PayloadDto } from './jwtPayload.dto';
import { User } from 'src/user/user.schema';

export interface ContextWithJWTPayload {
  jwtPayload: PayloadDto | null;
  req: Request;
  res: Response;
  userLoader: DataLoader<string, User | null>;
}
