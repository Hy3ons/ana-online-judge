-- Backfill per-draft headers from the shared workshop_problems row BEFORE dropping
-- those columns, so `db:migrate` (and `make prod-db-migrate`) copies the data
-- automatically on deploy. Idempotent: only fills drafts whose seed is still ''
-- (the 0048 add-migration default); app-created drafts get a non-empty seed and
-- are never clobbered by a re-run. Runs in the same migration as the drops so the
-- source columns still exist at copy time.
UPDATE "workshop_drafts" d SET "title" = p."title", "description" = p."description", "problem_type" = p."problem_type", "time_limit" = p."time_limit", "memory_limit" = p."memory_limit", "seed" = p."seed", "checker_language" = p."checker_language", "checker_path" = p."checker_path", "validator_language" = p."validator_language", "validator_path" = p."validator_path", "generator_script" = p."generator_script", "updated_at" = NOW() FROM "workshop_problems" p WHERE d."workshop_problem_id" = p."id" AND d."seed" = '';--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "problem_type";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "time_limit";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "memory_limit";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "seed";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "checker_language";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "checker_path";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "validator_language";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "validator_path";--> statement-breakpoint
ALTER TABLE "workshop_problems" DROP COLUMN IF EXISTS "generator_script";
