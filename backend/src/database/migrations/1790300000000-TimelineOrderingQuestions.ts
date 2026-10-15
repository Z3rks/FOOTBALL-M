import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Timeline pasa de opción múltiple a ordenar eventos (TimelineStrategy): se retiran las preguntas
 * viejas de Timeline, que la estrategia nueva no puede juzgar, junto con sus respuestas. Las
 * partidas de Timeline en curso quedan abandonadas. Las preguntas nuevas las carga `npm run seed`.
 *
 * down hace lo contrario (retira las preguntas de ordenar) para poder volver al código anterior
 * y restaurar las preguntas viejas con `npm run seed`. Las respuestas borradas no se recuperan.
 */
export class TimelineOrderingQuestions1790300000000 implements MigrationInterface {
    name = 'TimelineOrderingQuestions1790300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.retire(queryRunner, `NOT LIKE '[%'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.retire(queryRunner, `LIKE '[%'`);
    }

    /** Retira las preguntas de Timeline cuyo correct_answer cumple la condición. */
    private async retire(queryRunner: QueryRunner, answerCondition: string): Promise<void> {
        const timelineQuestions = `SELECT q.id FROM "questions" q JOIN "games" g ON g.id = q.game_id WHERE g.strategy_key = 'timeline' AND q.correct_answer ${answerCondition}`;
        await queryRunner.query(`UPDATE "game_sessions" SET "status" = 'abandoned' WHERE "status" = 'in_progress' AND "game_id" IN (SELECT id FROM "games" WHERE strategy_key = 'timeline')`);
        await queryRunner.query(`DELETE FROM "game_answers" WHERE "question_id" IN (${timelineQuestions})`);
        await queryRunner.query(`DELETE FROM "questions" WHERE "id" IN (${timelineQuestions})`);
    }

}
