CREATE TABLE "deal_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"deal_id" text NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text NOT NULL,
	"business_user_id" text NOT NULL,
	"creator_user_id" text NOT NULL,
	"fee_inr" integer,
	"message" text,
	"reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"deal_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "whatsapp" text;--> statement-breakpoint
ALTER TABLE "creator_profiles" ADD COLUMN "open_to_offers" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deal_outcomes" ADD COLUMN "link_code" text;--> statement-breakpoint
ALTER TABLE "deal_outcomes" ADD COLUMN "clicks" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "post_by" date;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "destination_url" text;--> statement-breakpoint
ALTER TABLE "deal_messages" ADD CONSTRAINT "deal_messages_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_messages" ADD CONSTRAINT "deal_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_business_user_id_users_id_fk" FOREIGN KEY ("business_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invites" ADD CONSTRAINT "invites_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deal_messages_deal" ON "deal_messages" USING btree ("deal_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invites_opportunity_creator" ON "invites" USING btree ("opportunity_id","creator_user_id");--> statement-breakpoint
CREATE INDEX "invites_creator" ON "invites" USING btree ("creator_user_id","created_at");--> statement-breakpoint
ALTER TABLE "deal_outcomes" ADD CONSTRAINT "deal_outcomes_link_code_unique" UNIQUE("link_code");