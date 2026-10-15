import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';

// Las pruebas e2e usan la base de datos de Docker (npm run db:up) y los valores del .env.
const envFile = join(__dirname, '..', '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

process.env.NODE_ENV = 'test';
// Cada prueba simula una IP distinta con X-Forwarded-For, para que el rate limiting no las mezcle.
process.env.TRUST_PROXY = 'true';
// Costo mínimo permitido: las pruebas cifran muchas contraseñas.
process.env.BCRYPT_COST = '10';
// Las pruebas nunca llaman a la API de noticias real: sin sincronización automática ni clave.
process.env.NEWS_SYNC_MINUTES = '0';
process.env.NEWS_API_KEY = '';
