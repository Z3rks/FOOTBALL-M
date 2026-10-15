import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import dataSource from '../data-source';
import { StoreItem } from '../../credits/entities/store-item.entity';
import { FunFact } from '../../games/entities/fun-fact.entity';
import { Game } from '../../games/entities/game.entity';
import { Question } from '../../games/entities/question.entity';
import { Badge } from '../../users/entities/badge.entity';
import { BADGES, FUN_FACTS, STORE_ITEMS } from './data/catalog.data';
import { GAMES } from './data/games.data';
import { QUESTIONS_EN } from './data/games.en.data';
import { QuestionSeed } from './data/question-builders';

/** Textos de la pregunta que se guardan como traducción (ver Question.translations). */
const texts = ({ statement, options, correctAnswer, details }: QuestionSeed) => ({ statement, options, correctAnswer, details: details ?? null });

/**
 * Carga los catálogos (minijuegos, preguntas, tienda, insignias y datos curiosos) con sus traducciones.
 * Es idempotente: usa upsert sobre claves únicas, así que se puede ejecutar varias veces.
 * Uso: npm run seed
 */
async function run() {
  await dataSource.initialize();
  await dataSource.transaction(async (manager) => {
    // El orden de GAMES es el de MinigamesScreen; se guarda como sortOrder.
    for (const [index, { questions, ...game }] of GAMES.entries()) {
      await manager.upsert(Game, { ...game, sortOrder: index + 1 }, ['strategyKey']);
      const { id: gameId } = await manager.findOneByOrFail(Game, { strategyKey: game.strategyKey });
      // details se guarda como null si la pregunta no lo trae, así un re-seed no deja datos viejos.
      // La pregunta N de QUESTIONS_EN es la traducción al inglés de la pregunta N.
      const english = QUESTIONS_EN[game.strategyKey] ?? [];
      const rows = questions.map((q, i) => ({ ...q, details: q.details ?? null, gameId, translations: english[i] ? { en: texts(english[i]) } : null }));
      await manager.upsert(Question, rows as QueryDeepPartialEntity<Question>[], ['gameId', 'statement']);
    }
    await manager.upsert(StoreItem, STORE_ITEMS, ['name']);
    await manager.upsert(Badge, BADGES, ['code']);
    await manager.upsert(FunFact, FUN_FACTS, ['text']);
  });

  const counts = await Promise.all([Game, Question, StoreItem, Badge, FunFact].map((e) => dataSource.getRepository(e).count()));
  console.log(`Seeds cargados: ${counts[0]} minijuegos, ${counts[1]} preguntas, ${counts[2]} artículos, ${counts[3]} insignias, ${counts[4]} datos curiosos.`);
  await dataSource.destroy();
}

run().catch(async (error) => {
  console.error('Error cargando seeds:', error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
