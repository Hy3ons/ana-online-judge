DROP INDEX "problem_authors_pk";--> statement-breakpoint
DROP INDEX "problem_reviewers_pk";--> statement-breakpoint
ALTER TABLE "problem_authors" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_reviewers" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_authors" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_authors" ADD COLUMN "external_name" text;--> statement-breakpoint
ALTER TABLE "problem_reviewers" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_reviewers" ADD COLUMN "external_name" text;--> statement-breakpoint
CREATE UNIQUE INDEX "problem_authors_user_uniq" ON "problem_authors" USING btree ("problem_id","user_id") WHERE "problem_authors"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "problem_authors_external_uniq" ON "problem_authors" USING btree ("problem_id","external_name") WHERE "problem_authors"."external_name" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "problem_reviewers_user_uniq" ON "problem_reviewers" USING btree ("problem_id","user_id") WHERE "problem_reviewers"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "problem_reviewers_external_uniq" ON "problem_reviewers" USING btree ("problem_id","external_name") WHERE "problem_reviewers"."external_name" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "problem_authors" ADD CONSTRAINT "problem_authors_identity_check" CHECK (("problem_authors"."user_id" IS NOT NULL) <> ("problem_authors"."external_name" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "problem_reviewers" ADD CONSTRAINT "problem_reviewers_identity_check" CHECK (("problem_reviewers"."user_id" IS NOT NULL) <> ("problem_reviewers"."external_name" IS NOT NULL));