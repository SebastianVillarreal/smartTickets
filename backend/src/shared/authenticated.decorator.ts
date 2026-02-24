import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

export function Authenticated() {
  return applyDecorators(UseGuards(JwtAuthGuard, RolesGuard));
}
