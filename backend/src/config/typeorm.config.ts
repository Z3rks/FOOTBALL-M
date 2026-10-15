import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

/**
 * Con ts-node (desarrollo, CLI y pruebas) se cargan los .ts; con el código compilado de dist/
 * (producción) solo los .js. En dist/ también hay archivos .d.ts por cada migración, y TypeORM
 * intentaría ejecutarlos si el patrón aceptara ".ts".
 */
const EXT = __filename.endsWith('.ts') ? 'ts' : 'js';

/**
 * SSL hacia PostgreSQL (DB_SSL=true). Las bases en la nube (Supabase) lo exigen. Con DB_SSL_CA
 * (el certificado de la base, en una sola línea con \n) además se verifica que el servidor sea
 * el correcto; sin él la conexión va cifrada pero sin verificar el certificado.
 */
export function sslOptions(env: NodeJS.ProcessEnv): PostgresConnectionOptions['ssl'] {
  if (env.DB_SSL !== 'true') return false;
  return env.DB_SSL_CA ? { ca: env.DB_SSL_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true } : { rejectUnauthorized: false };
}

/**
 * Opciones de conexión compartidas por la aplicación (AppModule) y por la CLI de
 * TypeORM (migraciones). `synchronize` siempre está apagado: el esquema solo cambia
 * mediante migraciones.
 */
export function buildDataSourceOptions(env: NodeJS.ProcessEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST,
    port: Number(env.DB_PORT),
    database: env.DB_NAME,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: sslOptions(env),
    entities: [join(__dirname, '..', '**', `*.entity.${EXT}`)],
    migrations: [join(__dirname, '..', 'database', 'migrations', `*.${EXT}`)],
    synchronize: false,
  };
}
