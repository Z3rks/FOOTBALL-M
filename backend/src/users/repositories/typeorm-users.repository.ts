import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { User } from '../entities/user.entity';
import { NewUserRecord, UserChanges, UsersRepository } from './users.repository';

@Injectable()
export class TypeOrmUsersRepository extends TypeOrmRepository implements UsersRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  private get users() {
    return this.manager.getRepository(User);
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email: email.toLowerCase() });
  }

  findByUsername(username: string): Promise<User | null> {
    return this.users.createQueryBuilder('u').where('LOWER(u.username) = LOWER(:username)', { username }).getOne();
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.users.findOneBy({ googleId });
  }

  create(data: NewUserRecord): Promise<User> {
    return this.translateErrors(() => this.users.save(this.users.create({ ...data, email: data.email.toLowerCase() })));
  }

  async update(id: string, changes: UserChanges): Promise<void> {
    if (Object.keys(changes).length === 0) return;
    await this.translateErrors(() => this.users.update({ id }, changes));
  }

  async delete(id: string): Promise<void> {
    await this.users.delete({ id });
  }

  findByIdForUpdate(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id }, lock: { mode: 'pessimistic_write' } });
  }

  async addCreditsBalance(id: string, delta: number): Promise<number | null> {
    const [row] = await this.translateErrors(() =>
      this.updateReturning<{ credits_balance: number }>('UPDATE users SET credits_balance = credits_balance + $2 WHERE id = $1 RETURNING credits_balance', [id, delta]),
    );
    return row ? row.credits_balance : null;
  }
}
