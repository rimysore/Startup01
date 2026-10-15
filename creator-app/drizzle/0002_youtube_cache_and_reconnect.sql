CREATE TABLE "youtube_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"value" text NOT NULL,
	"fetched_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"keep_until" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "youtube_connections" ADD COLUMN "needs_reconnect_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "youtube_cache" ADD CONSTRAINT "youtube_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "youtube_cache_user" ON "youtube_cache" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "youtube_cache_keep" ON "youtube_cache" USING btree ("keep_until");