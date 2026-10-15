import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import { validateEnv } from '../../config/env.validation';
import { buildDataSourceOptions } from '../../config/typeorm.config';
import { DatabaseModule } from '../../shared/database/database.module';
import { TimeModule } from '../../shared/time/app-clock';
import { USERNAME_PATTERN } from '../../users/username';
import { UsersModule } from '../../users/users.module';
import { UsersService } from '../../users/users.service';

/**
 * Crea una cuenta de administrador. Por seguridad la API no permite crear administradores;
 * solo se crean desde la consola con acceso a la base de datos. Pasa por UsersService (el dueño
 * de la tabla USER), igual que el resto del código.
 *
 * Uso (la contraseña va en una variable de entorno para no quedar en el historial de comandos):
 *   PowerShell: $env:ADMIN_PASSWORD="..."; npm run admin:create -- admin@footballmaestro.com admin
 *   bash:       ADMIN_PASSWORD="..." npm run admin:create -- admin@footballmaestro.com admin
 */

/** Solo lo necesario para usar el módulo Users fuera del servidor HTTP. */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions(process.env) }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    // Users importa Games (estadísticas del jugador), que usa AppClock para saber qué día es hoy.
    TimeModule,
    UsersModule,
  ],
})
export class CreateAdminModule {}

async function run() {
  const [email, username] = process.argv.slice(2);
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !username || !password) {
    throw new Error('Uso: ADMIN_PASSWORD=... npm run admin:create -- <email> <username>');
  }
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
  if (!USERNAME_PATTERN.test(username)) throw new Error('Username: 3-30 caracteres, letras, números o guion bajo');

  const app = await NestFactory.createApplicationContext(CreateAdminModule, { logger: ['error'] });
  try {
    const users = app.get(UsersService);
    if (await users.findByEmail(email)) throw new Error(`Ya existe una cuenta con ${email}`);
    const passwordHash = await hash(password, Number(process.env.BCRYPT_COST ?? 12));
    await users.createAdministrator({ email, username, passwordHash });
    console.log(`Administrador creado: ${email} (${username})`);
  } finally {
    await app.close();
  }
}

// Solo se ejecuta al correr el script (npm run admin:create), no al importarlo en las pruebas.
if (require.main === module) {
  run().catch((error: Error) => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}
