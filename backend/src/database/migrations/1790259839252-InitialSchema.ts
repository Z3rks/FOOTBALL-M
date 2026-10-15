import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790259839252 implements MigrationInterface {
    name = 'InitialSchema1790259839252'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_role" AS ENUM('player', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(30) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255), "google_id" character varying(255), "role" "public"."user_role" NOT NULL DEFAULT 'player', "status" "public"."user_status" NOT NULL DEFAULT 'active', "country" character(2), "level" integer NOT NULL DEFAULT '1', "xp_total" integer NOT NULL DEFAULT '0', "streak_days" integer NOT NULL DEFAULT '0', "last_played_on" date, "accuracy" numeric(5,2) NOT NULL DEFAULT '0', "credits_balance" integer NOT NULL DEFAULT '0', "referred_by" uuid, "consent_accepted_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_0bd5012aeb82628e07f6a1be53b" UNIQUE ("google_id"), CONSTRAINT "CHK_users_credits_balance_non_negative" CHECK ("credits_balance" >= 0), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5a0fc442b558f7a0546483c5ce" ON "users" ("status", "created_at") `);
        await queryRunner.query(`CREATE TABLE "badges" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "icon" character varying(20) NOT NULL, "description" character varying(255) NOT NULL, CONSTRAINT "UQ_9c91fc9c4a4ae01712baad1e9f6" UNIQUE ("name"), CONSTRAINT "PK_8a651318b8de577e8e217676466" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_badges" ("user_id" uuid NOT NULL, "badge_id" uuid NOT NULL, "earned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_201b6e34825dc5bd06181320bde" PRIMARY KEY ("user_id", "badge_id"))`);
        await queryRunner.query(`CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL, "last_seen_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a869942c46b32d4d0d5f9c4c11" ON "user_sessions" ("started_at") `);
        await queryRunner.query(`CREATE TYPE "public"."news_category" AS ENUM('Transfers', 'Champions League', 'World Cup', 'Premier League')`);
        await queryRunner.query(`CREATE TABLE "news_articles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "external_id" character varying(255) NOT NULL, "title" character varying(300) NOT NULL, "description" text NOT NULL, "category" "public"."news_category" NOT NULL, "source" character varying(100) NOT NULL, "source_url" character varying(1000) NOT NULL, "image_url" character varying(1000), "published_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "UQ_f31af14eaa64f809c18662e03e2" UNIQUE ("external_id"), CONSTRAINT "PK_ca1b67b1b6b2c382317bbd769dc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c1125de080b50f6e9f454505fd" ON "news_articles" ("category", "published_at") `);
        await queryRunner.query(`CREATE TYPE "public"."game_category" AS ENUM('Players', 'Clubs', 'Stadiums', 'Logic', 'History', 'Transfers', 'Teams', 'Rules')`);
        await queryRunner.query(`CREATE TYPE "public"."game_difficulty" AS ENUM('Easy', 'Medium', 'Hard', 'Expert')`);
        await queryRunner.query(`CREATE TABLE "games" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "description" character varying(255) NOT NULL, "category" "public"."game_category" NOT NULL, "difficulty" "public"."game_difficulty" NOT NULL, "icon" character varying(20) NOT NULL, "strategy_key" character varying(50) NOT NULL, CONSTRAINT "UQ_464ecdd7b60f5b12396b7e678f8" UNIQUE ("strategy_key"), CONSTRAINT "PK_c9b16b62917b5595af982d66337" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "game_id" uuid NOT NULL, "statement" text NOT NULL, "options" jsonb, "correct_answer" character varying(255) NOT NULL, "media_url" character varying(500), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4e863279d671a962aa9a42bb63" ON "questions" ("game_id", "statement") `);
        await queryRunner.query(`CREATE TYPE "public"."game_session_status" AS ENUM('in_progress', 'completed', 'abandoned')`);
        await queryRunner.query(`CREATE TABLE "game_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "game_id" uuid NOT NULL, "status" "public"."game_session_status" NOT NULL DEFAULT 'in_progress', "is_daily_challenge" boolean NOT NULL DEFAULT false, "score" integer, "total_questions" integer NOT NULL, "accuracy" numeric(5,2), "xp_earned" integer, "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_e25fa82d55744e55000c3288fdc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ca8d33a757645fae805d072fc2" ON "game_sessions" ("game_id", "completed_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_6fe93007ab08f703d16abbffaf" ON "game_sessions" ("user_id", "completed_at") `);
        await queryRunner.query(`CREATE TABLE "game_answers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "question_id" uuid NOT NULL, "question_number" integer NOT NULL, "given_answer" character varying(255) NOT NULL, "is_correct" boolean NOT NULL, "answered_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a1a057394e3f6341f3212f1ef38" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_945205af72e2bac06e578fa017" ON "game_answers" ("session_id", "question_number") `);
        // game_category ya se creó para "games"; "fun_facts" reutiliza el mismo tipo.
        await queryRunner.query(`CREATE TABLE "fun_facts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "text" text NOT NULL, "category" "public"."game_category", CONSTRAINT "UQ_5018ebe4a8488484e1fba788b83" UNIQUE ("text"), CONSTRAINT "PK_7c332ead01f8d4474d8c40b4cfc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "daily_challenges" ("challenge_date" date NOT NULL, "game_id" uuid NOT NULL, "title" character varying(100) NOT NULL, "xp_reward" integer NOT NULL DEFAULT '50', "credits_reward" integer NOT NULL DEFAULT '50', CONSTRAINT "PK_0448f7d4d820ecb5ed0c8254289" PRIMARY KEY ("challenge_date"))`);
        await queryRunner.query(`CREATE TYPE "public"."store_item_type" AS ENUM('avatar', 'badge_frame', 'ball_icon', 'background')`);
        await queryRunner.query(`CREATE TABLE "store_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "item_type" "public"."store_item_type" NOT NULL, "cost" integer NOT NULL, "icon" character varying(20) NOT NULL, CONSTRAINT "UQ_ffe2f4f08f2122c609dbc556e12" UNIQUE ("name"), CONSTRAINT "PK_0d47463134b9663b18d7df22282" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_store_items" ("user_id" uuid NOT NULL, "item_id" uuid NOT NULL, "is_equipped" boolean NOT NULL DEFAULT false, "purchased_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_4768942131c9eacd3087971a60f" PRIMARY KEY ("user_id", "item_id"))`);
        await queryRunner.query(`CREATE TYPE "public"."credit_transaction_type" AS ENUM('earn', 'spend')`);
        await queryRunner.query(`CREATE TYPE "public"."credit_reason" AS ENUM('daily_challenge', 'streak_7_days', 'share_result', 'referral', 'purchase')`);
        await queryRunner.query(`CREATE TABLE "credit_transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "amount" integer NOT NULL, "type" "public"."credit_transaction_type" NOT NULL, "reason" "public"."credit_reason" NOT NULL, "reference_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a408319811d1ab32832ec86fc2c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eb56bb81f1690d875347b2b994" ON "credit_transactions" ("user_id", "created_at") `);
        await queryRunner.query(`CREATE TYPE "public"."auth_token_type" AS ENUM('refresh', 'password_reset')`);
        await queryRunner.query(`CREATE TABLE "auth_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "type" "public"."auth_token_type" NOT NULL, "token_hash" character(64) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_3a94cfa1eada85ac2bf6f3016b7" UNIQUE ("token_hash"), CONSTRAINT "PK_41e9ddfbb32da18c4e85e45c2fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "admin_user_id" uuid NOT NULL, "action" character varying(100) NOT NULL, "target_user_id" uuid, "details" text, "ip_address" character varying(45) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_de7a8fc2fbb525484c71a86bb96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ee43923e8ce21dbe10bccaba85" ON "admin_audit_logs" ("created_at") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_cae1425350da39cb85345115cbb" FOREIGN KEY ("referred_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_badges" ADD CONSTRAINT "FK_f1221d9b1aaa64b1f3c98ed46d3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_badges" ADD CONSTRAINT "FK_715b81e610ab276ff6603cfc8e8" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_2fd6ddf4cb199ba01ee26ec1eb6" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ADD CONSTRAINT "FK_34e9014c98588c0aea0917afe01" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_sessions" ADD CONSTRAINT "FK_9a9ca77e7c2859e07f4bd84e3c5" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_answers" ADD CONSTRAINT "FK_289f8c74d3aa7d7fe4969be7025" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "game_answers" ADD CONSTRAINT "FK_1a07ee4b3fdd63f6ab1cf5e0bb1" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "daily_challenges" ADD CONSTRAINT "FK_b932ccb503341720f72c47cc272" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_store_items" ADD CONSTRAINT "FK_ae3b85aaa4f84632be940ec4787" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_store_items" ADD CONSTRAINT "FK_e71b0c2d8dc8caa737d2c506069" FOREIGN KEY ("item_id") REFERENCES "store_items"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" ADD CONSTRAINT "FK_9ac41a5292ef4d8356a86be30c2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" ADD CONSTRAINT "FK_9691367d446cd8b18f462c191b3" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "FK_8937fba1af21d770ab36a16e8ea" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "FK_8937fba1af21d770ab36a16e8ea"`);
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_9691367d446cd8b18f462c191b3"`);
        await queryRunner.query(`ALTER TABLE "credit_transactions" DROP CONSTRAINT "FK_9ac41a5292ef4d8356a86be30c2"`);
        await queryRunner.query(`ALTER TABLE "user_store_items" DROP CONSTRAINT "FK_e71b0c2d8dc8caa737d2c506069"`);
        await queryRunner.query(`ALTER TABLE "user_store_items" DROP CONSTRAINT "FK_ae3b85aaa4f84632be940ec4787"`);
        await queryRunner.query(`ALTER TABLE "daily_challenges" DROP CONSTRAINT "FK_b932ccb503341720f72c47cc272"`);
        await queryRunner.query(`ALTER TABLE "game_answers" DROP CONSTRAINT "FK_1a07ee4b3fdd63f6ab1cf5e0bb1"`);
        await queryRunner.query(`ALTER TABLE "game_answers" DROP CONSTRAINT "FK_289f8c74d3aa7d7fe4969be7025"`);
        await queryRunner.query(`ALTER TABLE "game_sessions" DROP CONSTRAINT "FK_9a9ca77e7c2859e07f4bd84e3c5"`);
        await queryRunner.query(`ALTER TABLE "game_sessions" DROP CONSTRAINT "FK_34e9014c98588c0aea0917afe01"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_2fd6ddf4cb199ba01ee26ec1eb6"`);
        await queryRunner.query(`ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_e9658e959c490b0a634dfc54783"`);
        await queryRunner.query(`ALTER TABLE "user_badges" DROP CONSTRAINT "FK_715b81e610ab276ff6603cfc8e8"`);
        await queryRunner.query(`ALTER TABLE "user_badges" DROP CONSTRAINT "FK_f1221d9b1aaa64b1f3c98ed46d3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_cae1425350da39cb85345115cbb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ee43923e8ce21dbe10bccaba85"`);
        await queryRunner.query(`DROP TABLE "admin_audit_logs"`);
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."auth_token_type"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb56bb81f1690d875347b2b994"`);
        await queryRunner.query(`DROP TABLE "credit_transactions"`);
        await queryRunner.query(`DROP TYPE "public"."credit_reason"`);
        await queryRunner.query(`DROP TYPE "public"."credit_transaction_type"`);
        await queryRunner.query(`DROP TABLE "user_store_items"`);
        await queryRunner.query(`DROP TABLE "store_items"`);
        await queryRunner.query(`DROP TYPE "public"."store_item_type"`);
        await queryRunner.query(`DROP TABLE "daily_challenges"`);
        await queryRunner.query(`DROP TABLE "fun_facts"`);
        // game_category se elimina después de "games", que también lo usa.
        await queryRunner.query(`DROP INDEX "public"."IDX_945205af72e2bac06e578fa017"`);
        await queryRunner.query(`DROP TABLE "game_answers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6fe93007ab08f703d16abbffaf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ca8d33a757645fae805d072fc2"`);
        await queryRunner.query(`DROP TABLE "game_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."game_session_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e863279d671a962aa9a42bb63"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TABLE "games"`);
        await queryRunner.query(`DROP TYPE "public"."game_difficulty"`);
        await queryRunner.query(`DROP TYPE "public"."game_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1125de080b50f6e9f454505fd"`);
        await queryRunner.query(`DROP TABLE "news_articles"`);
        await queryRunner.query(`DROP TYPE "public"."news_category"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a869942c46b32d4d0d5f9c4c11"`);
        await queryRunner.query(`DROP TABLE "user_sessions"`);
        await queryRunner.query(`DROP TABLE "user_badges"`);
        await queryRunner.query(`DROP TABLE "badges"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5a0fc442b558f7a0546483c5ce"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."user_status"`);
        await queryRunner.query(`DROP TYPE "public"."user_role"`);
    }

}
