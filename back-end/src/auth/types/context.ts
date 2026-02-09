import { Request, Response } from 'express';
import { PayloadDto } from './jwtPayload.dto';

export interface ContextWithJWTPayload {
  jwtPayload: PayloadDto | null;
  req: Request;
  res: Response;
}
