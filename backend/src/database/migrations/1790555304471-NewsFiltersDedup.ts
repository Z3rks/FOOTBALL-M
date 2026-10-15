import { MigrationInterface, QueryRunner } from "typeorm";

// ---------------------------------------------------------------------------------------------
// Copia fija de las reglas de noticias del 27 de septiembre de 2026 (titleKey en
// news-article.entity.ts; isRelevant e isBlockedSource en currents.provider.ts). Una migración
// no importa código de la app: si esas reglas cambian, esta migración sigue haciendo lo mismo.
// ---------------------------------------------------------------------------------------------

function titleKey(title: string): string {
    return title.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").slice(0, 300);
}

const OTHER_SPORTS =
  /(?<![\p{L}\p{N}])(nfl|ncaa|cfb|college football|college sports|quarterbacks?|touchdowns?|super bowl|gridiron|tennis|tenis|nba|mlb|nhl|rugby|cricket|golf|formula 1|fórmula 1|f1|motogp|ufc|boxing|boxeo|baseball|béisbol|basketball|baloncesto|básquet|euroliga|euroleague|acb|hockey|darts|snooker|nascar|wwe|wrestling|cycling|ciclismo|ciclistas?|pogacar|pogačar|atletismo|marat[oó]n|marathon|triatl[oó]n|triathlon|natación|swimming|balonmano|handball|voleibol|volleyball|pádel|padel|esquí|ajedrez|chess|gimnasia|judo|remo|medallas?|odi|t20|ipl|wickets?|innings|test series|batting|bowlers?|netball|wallabies|springboks|all blacks|fútbol americano|futsal|fútbol sala)(?![\p{L}\p{N}])/iu;
/** Marcadores como "29-39": son de balonmano o baloncesto, nunca de un partido de fútbol. */
const HIGH_SCORE = /\b[2-9]\d\s?-\s?[2-9]\d\b/;
/**
 * En español "Mundial" y "fichajes" se usan igual en cualquier deporte, así que la noticia debe
 * tener además al menos una de estas palabras. En inglés las palabras clave ya son de fútbol
 * ("transfer news", "Premier League") y basta con descartar los otros deportes.
 */
const FOOTBALL_TERMS: Record<string, RegExp | null> = {
  en: null,
  es: /(?<![\p{L}\p{N}])(fútbol|futbol|futbolistas?|fifa|uefa|conmebol|goles?|golazo|goleador(es)?|delanteros?|centrocampistas?|mediocampistas?|volantes?|porteros?|arqueros?|guardametas?|penaltis?|penales|laliga|premier|serie a|bundesliga|ligue 1|champions|europa league|libertadores|sudamericana|selecci[oó]n|seleccionador|balón de oro|derbi|clásico|entrenador|club|árbitros?|liguero|plantilla|jugador(es)?)(?![\p{L}\p{N}])/iu,
};
const CATEGORY_TERMS: Record<string, Record<string, RegExp>> = {
  en: {
    "Transfers": /(?<![\p{L}\p{N}])(transfers?|signings?|signs?|signed|loan|bids?|fee|moves?|gossip|contract|deal|target|release clause)(?![\p{L}\p{N}])/iu,
    "Champions League": /champions league/i,
    "World Cup": /world cup/i,
    "Premier League": /premier league/i,
    "La Liga": /(?<![\p{L}\p{N}])la ?liga(?![\p{L}\p{N}])/iu,
    "Serie A": /(?<![\p{L}\p{N}])serie a(?![\p{L}\p{N}])/iu,
    "Bundesliga": /bundesliga/i,
    "Copa Libertadores": /libertadores/i,
  },
  es: {
    "Transfers": /(?<![\p{L}\p{N}])(fichajes?|ficha|fichará|traspasos?|cesión|oferta|contrato|cláusula|refuerzos?|mercado de pases)(?![\p{L}\p{N}])/iu,
    "Champions League": /champions/i,
    "World Cup": /(?<![\p{L}\p{N}])(mundial|copa del mundo)(?![\p{L}\p{N}])/iu,
    "Premier League": /premier league/i,
    // "la liga" a secas aparece en cualquier texto ("la liga colombiana"): se pide la española.
    "La Liga": /(?<![\p{L}\p{N}])(laliga|la liga (española|ea sports|hypermotion)|liga española|primera división)(?![\p{L}\p{N}])/iu,
    "Serie A": /(?<![\p{L}\p{N}])serie a(?![\p{L}\p{N}])/iu,
    "Bundesliga": /bundesliga/i,
    "Copa Libertadores": /libertadores/i,
  },
};

/** ¿La noticia es de fútbol, del tema de la categoría y no de otro deporte? */
function isRelevant(category: string, title: string, description: string, language: string): boolean {
  const text = `${title} ${description}`;
  const football = FOOTBALL_TERMS[language];
  return !OTHER_SPORTS.test(text) && !HIGH_SCORE.test(text) && (!football || football.test(text)) && CATEGORY_TERMS[language][category].test(text);
}

/** Medios que no publican fútbol o que solo repiten enlaces de otros (foros). */
const BLOCKED_SOURCES = ["cricinfo.com", "espncricinfo.com", "reddit.com"];

function isBlockedSource(url: string): boolean {
  const host = new URL(url).hostname.replace(/^www\./, "");
  return BLOCKED_SOURCES.some((domain) => host === domain || host.endsWith(`.${domain}`));
}


/**
 * Noticias: 4 categorías nuevas (La Liga, Serie A, Bundesliga y Copa Libertadores, RF-176) y
 * title_key para no guardar la misma noticia publicada por varios medios (ej. los periódicos de
 * un mismo grupo repiten título e imagen). Las repetidas que ya estaban se borran (queda la
 * primera que se publicó), y también las de otros deportes que dejaba pasar el filtro anterior.
 * El down no las recupera: la siguiente sincronización trae noticias nuevas.
 */
export class NewsFiltersDedup1790555304471 implements MigrationInterface {
    name = 'NewsFiltersDedup1790555304471'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "news_articles" ADD "title_key" character varying(300) NOT NULL DEFAULT ''`);
        // La clave se calcula con la misma función que usa la app, para que coincida siempre.
        const rows: Array<{ id: string; title: string }> = await queryRunner.query(`SELECT "id", "title" FROM "news_articles"`);
        for (const { id, title } of rows) {
            await queryRunner.query(`UPDATE "news_articles" SET "title_key" = $1 WHERE "id" = $2`, [titleKey(title), id]);
        }
        await queryRunner.query(`ALTER TABLE "news_articles" ALTER COLUMN "title_key" DROP DEFAULT`);

        // Las noticias de Currents guardadas con el filtro anterior se revisan con el nuevo
        // (maratón, ciclismo, críquet… que entraban por "Mundial" o "fichajes").
        const stored: Array<{ id: string; category: string; language: string; title: string; description: string; source_url: string }> =
            await queryRunner.query(`SELECT "id", "category", "language", "title", "description", "source_url" FROM "news_articles" WHERE "external_id" LIKE 'currents:%'`);
        const rejected = stored.filter((n) => isBlockedSource(n.source_url) || !isRelevant(n.category, n.title, n.description, n.language)).map((n) => n.id);
        if (rejected.length > 0) await queryRunner.query(`DELETE FROM "news_articles" WHERE "id" = ANY($1)`, [rejected]);
        for (const column of ['title_key', 'image_url']) {
            await queryRunner.query(`
                DELETE FROM "news_articles" WHERE "id" IN (
                    SELECT "id" FROM (
                        SELECT "id", ROW_NUMBER() OVER (PARTITION BY "language", "${column}" ORDER BY "published_at", "id") AS n
                        FROM "news_articles" WHERE "${column}" IS NOT NULL
                    ) repeated WHERE n > 1
                )`);
        }

        await queryRunner.query(`DROP INDEX "public"."IDX_c1125de080b50f6e9f454505fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2bfe61881315e88d5aafec66f"`);
        await queryRunner.query(`ALTER TYPE "public"."news_category" RENAME TO "news_category_old"`);
        await queryRunner.query(`CREATE TYPE "public"."news_category" AS ENUM('Transfers', 'Champions League', 'World Cup', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Copa Libertadores')`);
        await queryRunner.query(`ALTER TABLE "news_articles" ALTER COLUMN "category" TYPE "public"."news_category" USING "category"::"text"::"public"."news_category"`);
        await queryRunner.query(`DROP TYPE "public"."news_category_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_de53e10f0774f2bb52af6feb64" ON "news_articles" ("language", "title_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_d2bfe61881315e88d5aafec66f" ON "news_articles" ("language", "category", "published_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1125de080b50f6e9f454505fd" ON "news_articles" ("category", "published_at") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Las noticias de las categorías nuevas no caben en el enum anterior.
        await queryRunner.query(`DELETE FROM "news_articles" WHERE "category" IN ('La Liga', 'Serie A', 'Bundesliga', 'Copa Libertadores')`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1125de080b50f6e9f454505fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2bfe61881315e88d5aafec66f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_de53e10f0774f2bb52af6feb64"`);
        await queryRunner.query(`CREATE TYPE "public"."news_category_old" AS ENUM('Transfers', 'Champions League', 'World Cup', 'Premier League')`);
        await queryRunner.query(`ALTER TABLE "news_articles" ALTER COLUMN "category" TYPE "public"."news_category_old" USING "category"::"text"::"public"."news_category_old"`);
        await queryRunner.query(`DROP TYPE "public"."news_category"`);
        await queryRunner.query(`ALTER TYPE "public"."news_category_old" RENAME TO "news_category"`);
        await queryRunner.query(`CREATE INDEX "IDX_d2bfe61881315e88d5aafec66f" ON "news_articles" ("language", "category", "published_at") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1125de080b50f6e9f454505fd" ON "news_articles" ("category", "published_at") `);
        await queryRunner.query(`ALTER TABLE "news_articles" DROP COLUMN "title_key"`);
    }

}
