CREATE TYPE "public"."token_type" AS ENUM('oauth_device', 'pat');--> statement-breakpoint
CREATE TABLE "user_api_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"refresh_hash" text,
	"type" "token_type" NOT NULL,
	"scopes" text[] DEFAULT ARRAY['user']::text[] NOT NULL,
	"label" text,
	"expires_at" timestamp with time zone NOT NULL,
	"refresh_expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_api_tokens_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "user_api_tokens_refresh_hash_unique" UNIQUE("refresh_hash")
);
--> statement-breakpoint
ALTER TABLE "user_api_tokens" ADD CONSTRAINT "user_api_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_api_tokens_user_idx" ON "user_api_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_api_tokens_token_hash_idx" ON "user_api_tokens" USING btree ("token_hash");