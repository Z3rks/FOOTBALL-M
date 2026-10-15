import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Plan de Seguridad A01: en Supabase, la API REST/GraphQL propia de Supabase publica las tablas
 * del esquema public a los roles anon y authenticated, y por defecto les da todos los permisos.
 * Football Maestro no usa esa API (todo pasa por el backend, que se conecta como dueño de las
 * tablas), así que se les quitan los permisos, también para las tablas futuras, y se activa
 * RLS en todas las tablas como segunda barrera. El dueño de una tabla no está sujeto a RLS, así
 * que el backend sigue funcionando igual.
 *
 * En PostgreSQL local (Docker) los roles anon y authenticated no existen: esa parte se salta.
 */
export class CloseSupabaseDataApi1790960000000 implements MigrationInterface {
    name = 'CloseSupabaseDataApi1790960000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
                    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
                    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
                    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
                    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
                    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
                END IF;
            END $$`);
        await queryRunner.query(`
            DO $$
            DECLARE t record;
            BEGIN
                FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
                    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
                END LOOP;
            END $$`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Vuelve al estado anterior, que deja las tablas expuestas en la API de Supabase.
        await queryRunner.query(`
            DO $$
            DECLARE t record;
            BEGIN
                FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
                    EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', t.tablename);
                END LOOP;
            END $$`);
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                    GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
                    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
                    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
                    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
                    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
                    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
                END IF;
            END $$`);
    }

}
