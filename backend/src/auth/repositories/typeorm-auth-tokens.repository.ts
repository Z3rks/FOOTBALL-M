import { Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { TypeOrmRepository } from '../../shared/database/typeorm-unit-of-work';
import { AuthToken, AuthTokenType } from '../entities/auth-token.entity';
import { AuthTokensRepository } from './auth-tokens.repository';

@Injectable()
export class TypeOrmAuthTokensRepository extends TypeOrmRepository implements AuthTokensRepository {
  constructor(dataSource: DataSource) {
    super(dataSource);
  }

  private get tokens() {
    return this.manager.getRepository(AuthToken);
  }

  async insert(token: { userId: string; type: AuthTokenType; tokenHash: string; expiresAt: Date }): Promise<void> {
    await this.tokens.insert(token);
  }

  findByHash(tokenHash: string, type: AuthTokenType): Promise<AuthToken | null> {
    return this.tokens.findOneBy({ tokenHash, type });
  }

  async revokeIfActive(id: string): Promise<boolean> {
    const { affected } = await this.tokens.update({ id, revokedAt: IsNull() }, { revokedAt: new Date() });
    return affected === 1;
  }

  async revokeByHash(tokenHash: string, type: AuthTokenType): Promise<void> {
    await this.tokens.update({ tokenHash, type, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  async revokeAllOfUser(userId: string, type: AuthTokenType): Promise<void> {
    await this.tokens.update({ userId, type, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  async consumeValid(tokenHash: string, type: AuthTokenType): Promise<string | null> {
    const result = await this.tokens
      .createQueryBuilder()
      .update(AuthToken)
      .set({ revokedAt: () => 'now()' })
      .where('token_hash = :tokenHash', { tokenHash })
      .andWhere('type = :type', { type })
      .andWhere('revoked_at IS NULL')
      .andWhere('expires_at > now()')
      .returning('user_id')
      .execute();
    return (result.raw as Array<{ user_id: string }>)[0]?.user_id ?? null;
  }
}
