import { buildDataSourceOptions, sslOptions } from './typeorm.config';

describe('configuración de la base de datos', () => {
  it('sin DB_SSL (desarrollo con Docker) no usa SSL', () => {
    expect(sslOptions({})).toBe(false);
    expect(sslOptions({ DB_SSL: 'false' })).toBe(false);
  });

  it('DB_SSL=true cifra la conexión; con DB_SSL_CA además verifica el certificado', () => {
    expect(sslOptions({ DB_SSL: 'true' })).toEqual({ rejectUnauthorized: false });
    expect(sslOptions({ DB_SSL: 'true', DB_SSL_CA: '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----' })).toEqual({
      ca: '-----BEGIN CERTIFICATE-----\nABC\n-----END CERTIFICATE-----',
      rejectUnauthorized: true,
    });
  });

  it('con ts-node carga las migraciones .ts (en dist/ serían solo .js, nunca los .d.ts)', () => {
    const { migrations } = buildDataSourceOptions({ DB_PORT: '5432' });
    expect(migrations).toEqual([expect.stringMatching(/migrations[\\/]\*\.ts$/)]);
  });
});
