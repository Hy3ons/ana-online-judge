CREATE TABLE "problem_favorites" (
	"problem_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "problem_favorites_user_id_problem_id_pk" PRIMARY KEY("user_id","problem_id")
);
--> statement-breakpoint
ALTER TABLE "problem_favorites" ADD CONSTRAINT "problem_favorites_problem_id_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_favorites" ADD CONSTRAINT "problem_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problem_favorites_problem_idx" ON "problem_favorites" USING btree ("problem_id");--> statement-breakpoint
CREATE INDEX "problem_favorites_user_created_idx" ON "problem_favorites" USING btree ("user_id","created_at");