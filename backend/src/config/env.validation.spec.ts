import { validateEnv } from './env.validation';

const validEnv = {
  PORT: '3000',
  FRONTEND_URL: 'http://localhost:5173',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'football_maestro',
  DB_USER: 'football',
  DB_PASSWORD: 'secret',
  JWT_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('convierte los valores numéricos del .env (que llegan como texto)', () => {
    const env = validateEnv(validEnv);
    expect(env.PORT).toBe(3000);
    expect(env.DB_PORT).toBe(5432);
  });

  it('usa el puerto 3000 si PORT no está definido', () => {
    const { PORT, ...withoutPort } = validEnv;
    expect(validateEnv(withoutPort).PORT).toBe(3000);
  });

  it('falla si falta una variable obligatoria de la base de datos', () => {
    const { DB_PASSWORD, ...incomplete } = validEnv;
    expect(() => validateEnv(incomplete)).toThrow(/DB_PASSWORD/);
  });

  it('falla si FRONTEND_URL no es una URL', () => {
    expect(() => validateEnv({ ...validEnv, FRONTEND_URL: 'no-es-url' })).toThrow(/FRONTEND_URL/);
  });

  it('falla si JWT_SECRET es demasiado corto', () => {
    expect(() => validateEnv({ ...validEnv, JWT_SECRET: 'corto' })).toThrow(/JWT_SECRET/);
  });

  it('aplica los valores por defecto de seguridad', () => {
    const env = validateEnv(validEnv);
    expect(env.JWT_EXPIRES_IN).toBe('15m');
    expect(env.REFRESH_TOKEN_DAYS).toBe(7);
    expect(env.BCRYPT_COST).toBeGreaterThanOrEqual(10);
    expect(env.COOKIE_SAMESITE).toBe('strict');
  });

  it('rechaza un factor de bcrypt menor a 10', () => {
    expect(() => validateEnv({ ...validEnv, BCRYPT_COST: '8' })).toThrow(/BCRYPT_COST/);
  });

  it('con MAIL_API_KEY exige un MAIL_FROM válido; sin clave no hace falta', () => {
    expect(() => validateEnv({ ...validEnv, MAIL_API_KEY: 'xkeysib-1' })).toThrow(/MAIL_FROM/);
    expect(() => validateEnv({ ...validEnv, MAIL_API_KEY: 'xkeysib-1', MAIL_FROM: 'no-es-correo' })).toThrow(/MAIL_FROM/);
    expect(validateEnv({ ...validEnv, MAIL_API_KEY: 'xkeysib-1', MAIL_FROM: 'equipo@gmail.com' }).MAIL_FROM).toBe('equipo@gmail.com');
    expect(() => validateEnv(validEnv)).not.toThrow();
  });
});
