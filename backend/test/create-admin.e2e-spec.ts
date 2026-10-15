import { NestFactory } from '@nestjs/core';
import { INestApplicationContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateAdminModule } from '../src/database/scripts/create-admin';
import { UserRole } from '../src/users/user.enums';
import { UsersService } from '../src/users/users.service';
import { RUN_ID } from './utils';

// Requiere la base de datos de Docker levantada (npm run db:up).
describe('Script admin:create (e2e)', () => {
  let app: INestApplicationContext;
  const email = `admin.${RUN_ID}@e2e.test`;

  afterAll(async () => {
    await app?.get(DataSource).query(`DELETE FROM users WHERE email = $1`, [email]);
    await app?.close();
  });

  // Si a un módulo que importa Users le falta una dependencia (ej. AppClock), el script ni arranca
  // y nadie se entera hasta que hace falta crear un administrador.
  it('arranca y crea un administrador con el rol admin', async () => {
    app = await NestFactory.createApplicationContext(CreateAdminModule, { logger: false, abortOnError: false });
    const users = app.get(UsersService);
    await users.createAdministrator({ email, username: `adm_${RUN_ID}`.slice(0, 30), passwordHash: 'hash-de-prueba' });
    expect(await users.findByEmail(email)).toMatchObject({ email, role: UserRole.ADMIN });
  });
});
