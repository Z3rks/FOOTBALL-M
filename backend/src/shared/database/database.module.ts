import { Global, Module } from '@nestjs/common';
import { TypeOrmUnitOfWork } from './typeorm-unit-of-work';
import { UnitOfWork } from './unit-of-work';

/** Provee UnitOfWork a todos los módulos. */
@Global()
@Module({
  providers: [{ provide: UnitOfWork, useClass: TypeOrmUnitOfWork }],
  exports: [UnitOfWork],
})
export class DatabaseModule {}
