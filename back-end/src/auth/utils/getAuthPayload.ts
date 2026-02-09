import { UnauthorizedException } from '@nestjs/common';
import { PayloadDto } from '../types/jwtPayload.dto';
import { ContextWithJWTPayload } from '../types/context';

export function getAuthPayload(context: ContextWithJWTPayload): PayloadDto {
  if (!context.jwtPayload) throw new UnauthorizedException();
  return context.jwtPayload;
}
