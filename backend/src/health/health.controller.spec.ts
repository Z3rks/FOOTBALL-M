import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('responde ok cuando la base de datos contesta', async () => {
    const dataSource = { query: jest.fn().mockResolvedValue([{ '?column?': 1 }]) } as unknown as DataSource;
    await expect(new HealthController(dataSource).check()).resolves.toEqual({ status: 'ok', database: 'up' });
  });

  it('responde 503 cuando la base de datos no contesta', async () => {
    const dataSource = { query: jest.fn().mockRejectedValue(new Error('connection refused')) } as unknown as DataSource;
    await expect(new HealthController(dataSource).check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
