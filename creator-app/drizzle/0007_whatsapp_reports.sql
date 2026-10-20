CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"channel" text DEFAULT 'none' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"payload" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "whatsapp_contacts" (
	"user_id" text PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"opted_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opted_out_at" timestamp with time zone,
	"last_inbound_at" timestamp with time zone,
	"state" jsonb,
	CONSTRAINT "whatsapp_contacts_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_link_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" text DEFAULT 'hinglish' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_weekly" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_video_check" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "notify_email" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_link_codes" ADD CONSTRAINT "whatsapp_link_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_unique" ON "notifications" USING btree ("user_id","kind","key");--> statement-breakpoint
CREATE INDEX "notifications_status" ON "notifications" USING btree ("status","created_at");