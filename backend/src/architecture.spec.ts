import { readdirSync, readFileSync } from 'fs';
import { join, posix, relative, sep } from 'path';

/**
 * Pruebas de arquitectura (Arquitectura §3-§7): hacen fallar la suite si el código rompe el
 * desacople entre módulos o la inversión de dependencias, aunque todo lo demás funcione.
 */

const SRC = __dirname;
const DOMAIN_MODULES = ['auth', 'users', 'games', 'credits', 'news', 'admin'] as const;
type DomainModule = (typeof DOMAIN_MODULES)[number];

/**
 * Interfaz pública de cada módulo: lo único que otros módulos pueden importar. Los puertos son
 * clases abstractas pequeñas, una por consumidor (inversión de dependencias y segregación de
 * interfaces); el resto es vocabulario compartido (enums, reglas de validación) o el módulo
 * de NestJS que los provee.
 */
const PORTS: Record<DomainModule, string[]> = {
  auth: [],
  users: ['users/user-accounts', 'users/credit-balance.store', 'users/player-directory', 'users/users-stats.reader', 'users/players-breakdown.reader'],
  games: ['games/player-game-stats.reader', 'games/games-stats.reader', 'games/game-insights.reader', 'games/games-by-player.reader'],
  credits: ['credits/credits-stats.reader'],
  news: [],
  admin: [],
};
const SHARED_VOCABULARY: Record<DomainModule, string[]> = {
  auth: ['auth/decorators'],
  users: ['users/users.module', 'users/user.enums', 'users/username'],
  games: ['games/games.module'],
  credits: ['credits/credits.module'],
  news: [],
  admin: [],
};
const PUBLIC_API = Object.fromEntries(DOMAIN_MODULES.map((m) => [m, [...PORTS[m], ...SHARED_VOCABULARY[m]]])) as Record<DomainModule, string[]>;

/** Las entidades de USER solo se comparten para las llaves foráneas de otras entidades. */
const FOREIGN_KEY_ONLY = 'users/entities/user.entity';

/** Solo estas carpetas pueden conocer el ORM; los servicios dependen de interfaces (DIP). */
const ORM_ALLOWED = [/\/repositories\//, /\/entities\//, /^database\//, /^config\//, /^shared\/database\//, /^shared\/transformers\//, /^health\//, /^app\.module\.ts$/];

interface SourceImport {
  file: string;
  target: string;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts') ? [relative(SRC, path).split(sep).join('/')] : [];
  });
}

function importsOf(file: string): SourceImport[] {
  const code = readFileSync(join(SRC, file), 'utf8');
  // Comillas simples (código de la app) o dobles (migraciones generadas por TypeORM).
  return [...code.matchAll(/from ['"]([^'"]+)['"]/g)].map(([, spec]) => ({
    file,
    target: spec.startsWith('.') ? posix.normalize(posix.join(posix.dirname(file), spec)) : spec,
  }));
}

const moduleOf = (path: string) => DOMAIN_MODULES.find((m) => path === m || path.startsWith(`${m}/`));

const MIGRATIONS = /^database\/migrations\//;
const files = sourceFiles(SRC).filter((file) => !MIGRATIONS.test(file));
const imports = files.flatMap(importsOf);
const migrations = sourceFiles(SRC).filter((file) => MIGRATIONS.test(file));

describe('Arquitectura', () => {
  it('encuentra el código fuente', () => {
    expect(files.length).toBeGreaterThan(50);
    expect(migrations.length).toBeGreaterThan(0);
  });

  it('las migraciones son fotos fijas: solo importan typeorm, nunca código de la app', () => {
    // Si una migración usara una función de un módulo, cambiar esa función cambiaría lo que la
    // migración hace en una base de datos nueva. Lo que necesite se copia dentro de ella.
    const offenders = migrations
      .flatMap(importsOf)
      .filter((i) => i.target !== 'typeorm')
      .map((i) => `${i.file} → ${i.target}`);
    expect(offenders).toEqual([]);
  });

  it('solo los repositorios y la infraestructura importan el ORM (inversión de dependencias)', () => {
    const offenders = imports
      .filter((i) => i.target === 'typeorm' || i.target === '@nestjs/typeorm')
      .filter((i) => !ORM_ALLOWED.some((allowed) => allowed.test(i.file)))
      .map((i) => i.file);
    expect(offenders).toEqual([]);
  });

  it('un módulo solo importa la interfaz pública de otro (nunca sus repositorios ni servicios internos)', () => {
    const offenders = imports
      .filter((i) => {
        const from = moduleOf(i.file);
        const to = moduleOf(i.target);
        if (!from || !to || from === to || PUBLIC_API[to].includes(i.target)) return false;
        return !(i.target === FOREIGN_KEY_ONLY && i.file.includes('/entities/'));
      })
      .map((i) => `${i.file} -> ${i.target}`);
    expect(offenders).toEqual([]);
  });

  it('los puertos públicos son abstracciones, no implementaciones (inversión de dependencias)', () => {
    const offenders = Object.values(PORTS)
      .flat()
      .filter((port) => {
        const code = readFileSync(join(SRC, `${port}.ts`), 'utf8');
        const concrete = /@Injectable\(\)/.test(code) || /^export class /m.test(code.replace(/^export class \w+Error extends Error/gm, ''));
        return !/export abstract class /.test(code) || concrete;
      });
    expect(offenders).toEqual([]);
  });

  it('otro módulo nunca recibe la entidad User ni su contraseña: solo objetos de lectura', () => {
    const offenders = imports
      .filter((i) => i.target === FOREIGN_KEY_ONLY && moduleOf(i.file) !== 'users' && !i.file.includes('/entities/'))
      .map((i) => i.file);
    expect(offenders).toEqual([]);
  });

  it('Games no depende de Users salvo la llave foránea de sus entidades', () => {
    const offenders = imports
      .filter((i) => moduleOf(i.file) === 'games' && moduleOf(i.target) === 'users' && !i.file.includes('/entities/'))
      .map((i) => `${i.file} -> ${i.target}`);
    expect(offenders).toEqual([]);
  });

  it('no hay dependencias circulares entre módulos de dominio', () => {
    // Auth → Users por las cuentas; los decoradores de Auth (@CurrentUser, @Roles) son transversales.
    const graph = new Map<DomainModule, Set<DomainModule>>(DOMAIN_MODULES.map((m) => [m, new Set()]));
    for (const i of imports) {
      const from = moduleOf(i.file);
      const to = moduleOf(i.target);
      if (from && to && from !== to && i.target !== 'auth/decorators' && !i.file.includes('/entities/')) graph.get(from)!.add(to);
    }
    const cycles: string[] = [];
    const visit = (node: DomainModule, path: DomainModule[]) => {
      if (path.includes(node)) return cycles.push([...path, node].join(' → '));
      for (const next of graph.get(node)!) visit(next, [...path, node]);
    };
    DOMAIN_MODULES.forEach((m) => visit(m, []));
    expect(cycles).toEqual([]);
  });
});
