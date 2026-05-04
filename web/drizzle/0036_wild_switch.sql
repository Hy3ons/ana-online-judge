CREATE TABLE "problem_set_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"problem_set_id" integer NOT NULL,
	"problem_id" integer NOT NULL,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_set_likes" (
	"problem_set_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "problem_set_likes_problem_set_id_user_id_pk" PRIMARY KEY("problem_set_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "problem_sets" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "problem_set_items" ADD CONSTRAINT "problem_set_items_problem_set_id_problem_sets_id_fk" FOREIGN KEY ("problem_set_id") REFERENCES "public"."problem_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_set_items" ADD CONSTRAINT "problem_set_items_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_set_likes" ADD CONSTRAINT "problem_set_likes_problem_set_id_problem_sets_id_fk" FOREIGN KEY ("problem_set_id") REFERENCES "public"."problem_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_set_likes" ADD CONSTRAINT "problem_set_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_sets" ADD CONSTRAINT "problem_sets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problem_set_items_set_order_idx" ON "problem_set_items" USING btree ("problem_set_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "problem_set_items_uniq" ON "problem_set_items" USING btree ("problem_set_id","problem_id");--> statement-breakpoint
CREATE INDEX "problem_set_likes_user_created_idx" ON "problem_set_likes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "problem_sets_created_by_idx" ON "problem_sets" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "problem_sets_like_count_idx" ON "problem_sets" USING btree ("like_count");--> statement-breakpoint
CREATE INDEX "problem_sets_title_trgm_idx" ON "problem_sets" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "problem_sets_description_trgm_idx" ON "problem_sets" USING gin ("description" gin_trgm_ops);