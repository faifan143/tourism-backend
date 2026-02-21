import { SetMetadata } from '@nestjs/common';
import { PermissionScope } from '@prisma/client';

export const SCOPE_KEY = 'scope';

export interface ScopeMeta {
  scope: PermissionScope;
  param: string; // route param name that holds the resourceId
}

export const Scope = (scope: PermissionScope, param: string) =>
  SetMetadata(SCOPE_KEY, { scope, param } as ScopeMeta);
