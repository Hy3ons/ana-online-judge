CREATE TYPE "public"."external_site" AS ENUM('codeforces', 'atcoder');--> statement-breakpoint
CREATE TABLE "user_external_handles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" "external_site" NOT NULL,
	"handle" text NOT NULL,
	"rating" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "main_external_site" "external_site";--> statement-breakpoint
ALTER TABLE "user_external_handles" ADD CONSTRAINT "user_external_handles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_external_handles_user_provider_uniq" ON "user_external_handles" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "user_external_handles_handle_uniq" ON "user_external_handles" USING btree ("provider",lower("handle"));--> statement-breakpoint
CREATE INDEX "user_external_handles_provider_updated_idx" ON "user_external_handles" USING btree ("provider","updated_at");