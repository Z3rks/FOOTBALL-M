import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CookieOptions, Request, Response } from 'express';
import { AuthService, AuthSession } from './auth.service';
import { Public } from './decorators';
import { ForgotPasswordDto, GoogleAuthDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import { Locale, RequestLocale } from '../shared/i18n/locale';

export const REFRESH_COOKIE = 'refresh_token';
/** La cookie solo viaja a /v1/auth/*, no al resto de la API (Contrato de API §4.2). */
const REFRESH_COOKIE_PATH = '/v1/auth';
const FIFTEEN_MINUTES = 15 * 60_000;

/** Contrato de API §4 — módulo Auth. */
@Controller('auth')
export class AuthController {
  private readonly cookieBase: CookieOptions;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    const sameSite = config.get<'strict' | 'lax' | 'none'>('COOKIE_SAMESITE') ?? 'strict';
    this.cookieBase = {
      httpOnly: true,
      // SameSite=None exige Secure; en producción siempre va por HTTPS.
      secure: config.get('NODE_ENV') === 'production' || sameSite === 'none',
      sameSite,
      path: REFRESH_COOKIE_PATH,
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.register(dto));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60 * 60_000 } })
  @Post('register/google')
  async registerWithGoogle(@Body() dto: GoogleAuthDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.authenticateWithGoogle(dto));
  }

  /** Plan de Seguridad A07: máximo 5 intentos cada 15 minutos por IP (TC-44). */
  @Public()
  @Throttle({ default: { limit: 5, ttl: FIFTEEN_MINUTES } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.login(dto, req.ip ?? 'unknown'));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: FIFTEEN_MINUTES } })
  @HttpCode(HttpStatus.OK)
  @Post('login/google')
  async loginWithGoogle(@Body() dto: GoogleAuthDto, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.authenticateWithGoogle(dto));
  }

  /** SplashScreen lo usa para saber si hay sesión activa (RF-007, RF-009). */
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      return this.respond(res, await this.auth.refresh(req.cookies?.[REFRESH_COOKIE]));
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, this.cookieBase);
      throw error;
    }
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: FIFTEEN_MINUTES } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @RequestLocale() locale: Locale): Promise<void> {
    await this.auth.forgotPassword(dto.email, locale);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: FIFTEEN_MINUTES } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.auth.resetPassword(dto.token, dto.newPassword);
  }

  /** Requiere access token. Revoca la sesión en el servidor y borra la cookie (RNF-SEC-05). */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, this.cookieBase);
  }

  /** Pone el refresh token en la cookie y devuelve el resto en el cuerpo. */
  private respond(res: Response, session: AuthSession) {
    const { refreshToken, refreshExpiresAt, ...body } = session;
    res.cookie(REFRESH_COOKIE, refreshToken, { ...this.cookieBase, expires: refreshExpiresAt });
    return body;
  }
}
