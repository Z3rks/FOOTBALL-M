import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedUser, CurrentUser } from '../auth/decorators';
import { ActivityService } from './activity.service';
import { BadgesService } from './badges.service';
import { ChangePasswordDto, DeleteAccountDto, UpdateProfileDto } from './dto/users.dto';
import { ProfileService } from './profile.service';
import { Locale, RequestLocale } from '../shared/i18n/locale';

/** Para frenar intentos de adivinar la contraseña actual desde una sesión robada. */
const PASSWORD_THROTTLE = { default: { limit: 5, ttl: 15 * 60_000 } };

/** Contrato de API §5.1 — perfil del usuario autenticado. */
@Controller('users/me')
export class UsersController {
  constructor(
    private readonly profile: ProfileService,
    private readonly badges: BadgesService,
  ) {}

  @Get()
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getProfile(user.id);
  }

  @Patch()
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.profile.updateProfile(user.id, dto);
  }

  @Throttle(PASSWORD_THROTTLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Patch('password')
  async changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto): Promise<void> {
    await this.profile.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  @Throttle(PASSWORD_THROTTLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async deleteAccount(@CurrentUser() user: AuthenticatedUser, @Body() dto: DeleteAccountDto): Promise<void> {
    await this.profile.deleteAccount(user.id, dto.password);
  }

  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getStats(user.id);
  }

  @Get('badges')
  getBadges(@CurrentUser() user: AuthenticatedUser, @RequestLocale() locale: Locale) {
    return this.badges.listForUser(user.id, locale);
  }
}

/** Contrato de API §5.2 — actividad de uso. */
@Controller('activity')
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('heartbeat')
  async heartbeat(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.activity.heartbeat(user.id);
  }
}
