import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UserAccounts } from '../../users/user-accounts';
import { UserStatus } from '../../users/user.enums';
import { AccessTokenPayload } from '../auth.service';
import { AuthenticatedUser, IS_PUBLIC_KEY } from '../decorators';

/**
 * Guard global: todo endpoint exige un access token válido salvo los marcados con @Public().
 * El usuario se relee de la base de datos en cada petición, así un rol cambiado o una cuenta
 * suspendida se aplican de inmediato, sin esperar a que venza el token (Plan de Seguridad A01).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UserAccounts,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Missing access token');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Invalid or expired access token');
    if (user.status !== UserStatus.ACTIVE) throw new ForbiddenException('Account suspended');

    request.user = { id: user.id, username: user.username, role: user.role };
    return true;
  }
}
