import { IsEnum, IsUUID } from 'class-validator';
import { PermissionScope } from '@prisma/client';

export class CreatePermissionDto {
  @IsUUID()
  userId: string;

  @IsEnum(PermissionScope)
  scope: PermissionScope;

  @IsUUID()
  resourceId: string;
}
