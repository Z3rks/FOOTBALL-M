import { Transform } from 'class-transformer';
import { Equals, IsBoolean, IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../../users/user.enums';
import { USERNAME_MESSAGE, USERNAME_PATTERN } from '../../users/username';

const normalizeEmail = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

/** bcrypt solo usa los primeros 72 bytes; se limita para que la contraseña completa cuente. */
const PASSWORD_MAX = 72;

/** POST /auth/register — RF-040 a RF-044. */
export class RegisterDto {
  @Matches(USERNAME_PATTERN, { message: USERNAME_MESSAGE })
  username: string;

  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(PASSWORD_MAX)
  password: string;

  /** Aceptación de la política de tratamiento de datos (Ley 1581, RNF-SEC-07). */
  @Equals(true, { message: 'consentAccepted must be true' })
  consentAccepted: boolean;

  /** Username de quien lo invitó ("Refer a friend"). */
  @IsOptional()
  @Matches(USERNAME_PATTERN, { message: 'referralCode must be a valid username' })
  referralCode?: string;
}

/** POST /auth/login — RF-025 a RF-034. */
export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(PASSWORD_MAX)
  password: string;

  /** Tipo de acceso elegido en el toggle de SignInScreen. El backend valida el rol real. */
  @IsIn([UserRole.PLAYER, UserRole.ADMIN])
  role: UserRole;
}

/** POST /auth/login/google y /auth/register/google — RF-020 a RF-024, RF-050 a RF-054. */
export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  idToken: string;

  /** Obligatorio (true) solo si la cuenta todavía no existe y se va a crear. */
  @IsOptional()
  @IsBoolean()
  consentAccepted?: boolean;

  @IsOptional()
  @Matches(USERNAME_PATTERN, { message: 'referralCode must be a valid username' })
  referralCode?: string;
}

/** POST /auth/forgot-password — RF-035 a RF-039. */
export class ForgotPasswordDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;
}

/** POST /auth/reset-password — RF-035 a RF-039. */
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(PASSWORD_MAX)
  newPassword: string;
}
