import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { GoogleAuthLibraryVerifier, GoogleVerifier } from './adapters/google-verifier';
import { BrevoMailSender } from './adapters/brevo-mail-sender';
import { ConsoleMailSender, MailSender } from './adapters/mail-sender';
import { AuthEventsListener } from './auth-events.listener';
import { AuthTokensService } from './auth-tokens.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { durationToSeconds } from './duration';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthTokensRepository } from './repositories/auth-tokens.repository';
import { TypeOrmAuthTokensRepository } from './repositories/typeorm-auth-tokens.repository';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { algorithm: 'HS256', expiresIn: durationToSeconds(config.getOrThrow<string>('JWT_EXPIRES_IN')) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthTokensService,
    AuthEventsListener,
    { provide: AuthTokensRepository, useClass: TypeOrmAuthTokensRepository },
    { provide: GoogleVerifier, useClass: GoogleAuthLibraryVerifier },
    {
      // Con MAIL_API_KEY se envían correos reales con Brevo; sin clave, el enlace sale en la consola.
      provide: MailSender,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => (config.get<string>('MAIL_API_KEY') ? new BrevoMailSender(config) : new ConsoleMailSender()),
    },
    // Guards globales, en este orden: primero autenticación, luego rol.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
