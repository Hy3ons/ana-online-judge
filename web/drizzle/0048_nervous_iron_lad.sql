ALTER TABLE "workshop_drafts" ADD COLUMN "title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "problem_type" "workshop_problem_type" DEFAULT 'icpc' NOT NULL;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "time_limit" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "memory_limit" integer DEFAULT 512 NOT NULL;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "seed" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "checker_language" text;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "checker_path" text;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "validator_language" text;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "validator_path" text;--> statement-breakpoint
ALTER TABLE "workshop_drafts" ADD COLUMN "generator_script" text;