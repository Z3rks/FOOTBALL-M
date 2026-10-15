import { MigrationInterface, QueryRunner } from "typeorm";

export class CreditRewardOnce1790263329944 implements MigrationInterface {
    name = 'CreditRewardOnce1790263329944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_credit_transactions_reward_once" ON "credit_transactions" ("user_id", "reason", "reference_id") WHERE "reference_id" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."UQ_credit_transactions_reward_once"`);
    }

}
