CREATE TYPE "public"."notification_type" AS ENUM('submission_viewed', 'rejudge', 'admin_announcement', 'board_comment');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" "notification_type" NOT NULL,
	"body" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rejudge_batch_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"batch_id" integer NOT NULL,
	"submission_id" integer NOT NULL,
	"problem_id" integer NOT NULL,
	"before_verdict" "verdict" NOT NULL,
	"after_verdict" "verdict" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rejudge_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submission_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"submission_id" integer NOT NULL,
	"viewer_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "submission_views_submission_viewer_uniq" UNIQUE("submission_id","viewer_id")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rejudge_batch_items" ADD CONSTRAINT "rejudge_batch_items_batch_id_rejudge_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."rejudge_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rejudge_batch_items" ADD CONSTRAINT "rejudge_batch_items_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rejudge_batch_items" ADD CONSTRAINT "rejudge_batch_items_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rejudge_batches" ADD CONSTRAINT "rejudge_batches_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_views" ADD CONSTRAINT "submission_views_submission_id_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_views" ADD CONSTRAINT "submission_views_viewer_id_users_id_fk" FOREIGN KEY ("viewer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "rejudge_items_problem_batch_idx" ON "rejudge_batch_items" USING btree ("problem_id","batch_id");--> statement-breakpoint
CREATE INDEX "rejudge_items_submission_idx" ON "rejudge_batch_items" USING btree ("submission_id");