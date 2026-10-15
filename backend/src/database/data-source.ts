import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/typeorm.config';

// La CLI de TypeORM y los seeds no pasan por Nest, así que cargan el .env aquí.
const envFile = join(__dirname, '..', '..', '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default new DataSource(buildDataSourceOptions(process.env));
