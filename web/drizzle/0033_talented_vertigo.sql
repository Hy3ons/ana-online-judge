ALTER TABLE "problems" ADD COLUMN "use_full_judge" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "problems" ADD COLUMN "pass_threshold" integer;