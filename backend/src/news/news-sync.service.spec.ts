import { ConfigService } from '@nestjs/config';
import { NewsSyncService } from './news-sync.service';
import { NewsProvider } from './news.provider';
import { NewsRepository } from './repositories/news.repository';

const HOUR = 3_600_000;
const NOW = new Date('2026-10-02T12:00:00Z').getTime();

function serviceWithLastSync(last: Date | null | Error) {
  const articles = { lastSyncedAt: () => (last instanceof Error ? Promise.reject(last) : Promise.resolve(last)) } as unknown as NewsRepository;
  return new NewsSyncService(articles, {} as NewsProvider, new ConfigService({ NEWS_SYNC_MINUTES: 120 }));
}

describe('NewsSyncService: sincronización al arrancar', () => {
  it('si la última sincronización fue hace menos de 120 min, espera lo que falta (no gasta el cupo al despertar)', async () => {
    expect(await serviceWithLastSync(new Date(NOW - 0.5 * HOUR)).millisUntilNextSync(NOW)).toBe(1.5 * HOUR);
  });

  it('si ya pasó el intervalo, no hay noticias o no se puede consultar, sincroniza ya', async () => {
    expect(await serviceWithLastSync(new Date(NOW - 3 * HOUR)).millisUntilNextSync(NOW)).toBe(0);
    expect(await serviceWithLastSync(null).millisUntilNextSync(NOW)).toBe(0);
    expect(await serviceWithLastSync(new Error('sin base de datos')).millisUntilNextSync(NOW)).toBe(0);
  });
});
