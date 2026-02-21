import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { SCOPE_KEY, ScopeMeta } from '../decorators/scope.decorator';
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<ScopeMeta>(SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!meta) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user) throw new UnauthorizedException();

    // ADMIN always passes
    if (user.role === Role.ADMIN) return true;

    // Only SUB_ADMIN gets scope-checked
    if (user.role !== Role.SUB_ADMIN) throw new ForbiddenException();

    const resourceId = request.params[meta.param];
    if (!resourceId) throw new ForbiddenException();

    const permission = await this.prisma.subAdminPermission.findUnique({
      where: {
        userId_scope_resourceId: {
          userId: user.sub,
          scope: meta.scope,
          resourceId,
        },
      },
    });

    if (!permission) throw new ForbiddenException('You do not have permission to manage this resource.');

    return true;
  }
}
