import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserAccounts } from '../../users/user-accounts';
import { UserRole, UserStatus } from '../../users/user.enums';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../decorators';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

function contextWith(request: Record<string, unknown>, metadata: Record<string, unknown> = {}) {
  const handler = () => undefined;
  Object.entries(metadata).forEach(([key, value]) => Reflect.defineMetadata(key, value, handler));
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const jwt = new JwtService({ secret: 'x'.repeat(32) });
  const users = { findById: jest.fn() } as unknown as jest.Mocked<UserAccounts>;
  const guard = new JwtAuthGuard(new Reflector(), jwt, users);
  const bearer = (sub: string) => ({ headers: { authorization: `Bearer ${jwt.sign({ sub, role: UserRole.PLAYER })}` } });

  it('deja pasar los endpoints @Public() sin token', async () => {
    await expect(guard.canActivate(contextWith({ headers: {} }, { [IS_PUBLIC_KEY]: true }))).resolves.toBe(true);
  });

  it('responde 401 sin token', async () => {
    await expect(guard.canActivate(contextWith({ headers: {} }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('responde 401 con un token firmado con otra clave', async () => {
    const forged = new JwtService({ secret: 'y'.repeat(32) }).sign({ sub: 'user-1', role: UserRole.ADMIN });
    await expect(guard.canActivate(contextWith({ headers: { authorization: `Bearer ${forged}` } }))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('carga el usuario desde la base de datos en request.user', async () => {
    users.findById.mockResolvedValue({ id: 'user-1', username: 'fan', role: UserRole.PLAYER, status: UserStatus.ACTIVE } as never);
    const request: Record<string, unknown> = bearer('user-1');
    await expect(guard.canActivate(contextWith(request))).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-1', username: 'fan', role: UserRole.PLAYER });
  });

  it('responde 403 si la cuenta fue suspendida después de emitir el token', async () => {
    users.findById.mockResolvedValue({ id: 'user-1', username: 'fan', role: UserRole.PLAYER, status: UserStatus.INACTIVE } as never);
    await expect(guard.canActivate(contextWith(bearer('user-1')))).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('TC-34: un jugador no puede usar un endpoint @Roles(admin)', () => {
    const ctx = contextWith({ user: { id: 'u', role: UserRole.PLAYER } }, { [ROLES_KEY]: [UserRole.ADMIN] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('un administrador sí puede', () => {
    const ctx = contextWith({ user: { id: 'u', role: UserRole.ADMIN } }, { [ROLES_KEY]: [UserRole.ADMIN] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('sin @Roles() no restringe', () => {
    expect(guard.canActivate(contextWith({ user: { id: 'u', role: UserRole.PLAYER } }))).toBe(true);
  });
});
