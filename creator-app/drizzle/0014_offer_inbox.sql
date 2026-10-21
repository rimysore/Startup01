CREATE TABLE "inbox_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"source" text NOT NULL,
	"sender_name" text,
	"sender_email" text,
	"sender_phone" text,
	"sender_handle" text,
	"subject" text,
	"body" text NOT NULL,
	"checks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"verdict" jsonb,
	"status" text DEFAULT 'new' NOT NULL,
	"deal_id" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lookup_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sender_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"sender_key" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "inbox_token" text;--> statement-breakpoint
ALTER TABLE "inbox_offers" ADD CONSTRAINT "inbox_offers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_offers" ADD CONSTRAINT "inbox_offers_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sender_reports" ADD CONSTRAINT "sender_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inbox_offers_user_time" ON "inbox_offers" USING btree ("user_id","received_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sender_reports_user_key" ON "sender_reports" USING btree ("user_id","sender_key");--> statement-breakpoint
CREATE INDEX "sender_reports_key" ON "sender_reports" USING btree ("sender_key");--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_inbox_token_unique" UNIQUE("inbox_token");