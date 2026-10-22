CREATE TABLE "creator_passes" (
	"user_id" text PRIMARY KEY NOT NULL,
	"paid_until" timestamp with time zone,
	"source" text,
	"note" text,
	"interest_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dm_automations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"media_id" text,
	"media_caption" text,
	"media_url" text,
	"media_thumb" text,
	"keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"any_comment" boolean DEFAULT false NOT NULL,
	"message" text NOT NULL,
	"link_url" text,
	"public_reply" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dm_events" (
	"comment_id" text PRIMARY KEY NOT NULL,
	"automation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"commenter_username" text,
	"text" text,
	"status" text NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instagram_connections" ADD COLUMN "scopes" text;--> statement-breakpoint
ALTER TABLE "instagram_connections" ADD COLUMN "subscribed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "creator_passes" ADD CONSTRAINT "creator_passes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_automations" ADD CONSTRAINT "dm_automations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_events" ADD CONSTRAINT "dm_events_automation_id_dm_automations_id_fk" FOREIGN KEY ("automation_id") REFERENCES "public"."dm_automations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dm_events" ADD CONSTRAINT "dm_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dm_automations_user" ON "dm_automations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dm_events_automation_time" ON "dm_events" USING btree ("automation_id","created_at");--> statement-breakpoint
CREATE INDEX "dm_events_user_time" ON "dm_events" USING btree ("user_id","created_at");