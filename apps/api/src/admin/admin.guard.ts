import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { email?: string } | undefined;
    if (!user?.email || user.email !== process.env.ADMIN_EMAIL) {
      throw new ForbiddenException('Admin access only');
    }
    return true;
  }
}
