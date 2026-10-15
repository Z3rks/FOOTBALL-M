import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/user.enums';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** El endpoint no requiere access token (login, registro, health…). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Solo usuarios con alguno de estos roles. Ej.: @Roles(UserRole.ADMIN) en /admin/*. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Funciones del juego (jugar, créditos, tienda): los administradores no las usan. */
export const PlayerOnly = () => Roles(UserRole.PLAYER);

/** Usuario autenticado, cargado desde la base de datos por JwtAuthGuard. */
export interface AuthenticatedUser {
  id: string;
  username: string;
  role: UserRole;
}

/** Inyecta el usuario autenticado en un parámetro del controlador: `@CurrentUser() user`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => ctx.switchToHttp().getRequest().user,
);
