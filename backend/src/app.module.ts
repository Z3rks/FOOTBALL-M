import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { buildDataSourceOptions } from './config/typeorm.config';
import { CreditsModule } from './credits/credits.module';
import { GamesModule } from './games/games.module';
import { HealthModule } from './health/health.module';
import { NewsModule } from './news/news.module';
import { DatabaseModule } from './shared/database/database.module';
import { TimeModule } from './shared/time/app-clock';
import { UsersModule } from './users/users.module';

/**
 * Módulo raíz. Cada módulo de dominio (Auth, Users, News, Games, Credits, Admin) se
 * registra aquí desde su propia rama feature/<modulo>.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      // ConfigModule ya cargó y validó el .env en process.env.
      useFactory: () => buildDataSourceOptions(process.env),
    }),
    // UnitOfWork (transacciones) para los servicios de todos los módulos.
    DatabaseModule,
    TimeModule,
    // Eventos de dominio entre módulos (Arquitectura §5).
    EventEmitterModule.forRoot(),
    // Plan de Seguridad §7: límite global de 100 peticiones por minuto por IP; Auth define límites más estrictos.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    HealthModule,
    UsersModule,
    AuthModule,
    GamesModule,
    CreditsModule,
    NewsModule,
    AdminModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
