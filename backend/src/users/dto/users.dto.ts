import { Transform } from 'class-transformer';
import { IsISO31661Alpha2, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { USERNAME_MESSAGE, USERNAME_PATTERN } from '../username';

/** PATCH /users/me — "Edit Profile" (RF-112). */
export class UpdateProfileDto {
  @IsOptional()
  @Matches(USERNAME_PATTERN, { message: USERNAME_MESSAGE })
  username?: string;

  /** Código ISO 3166-1 alfa-2 (ej. "CO"); null para quitarlo. */
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  @ValidateIf((dto: UpdateProfileDto) => dto.country !== null && dto.country !== undefined)
  @IsISO31661Alpha2()
  country?: string | null;
}

/** PATCH /users/me/password — "Account Settings" (RF-112). */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}

/** DELETE /users/me — derecho de supresión (Ley 1581, RNF-SEC-07). */
export class DeleteAccountDto {
  /** Obligatoria si la cuenta tiene contraseña (confirma que es el dueño quien la borra). */
  @IsOptional()
  @IsString()
  @MaxLength(72)
  password?: string;
}
