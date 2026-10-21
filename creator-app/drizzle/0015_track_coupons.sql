CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"tracked_post_id" text NOT NULL,
	"source" text DEFAULT 'link' NOT NULL,
	"redeemed_at" timestamp with time zone,
	"redeemed_by" text,
	"pin_tries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"business_user_id" text NOT NULL,
	"creator_name" text NOT NULL,
	"creator_handle" text,
	"creator_user_id" text,
	"deal_id" text,
	"kind" text DEFAULT 'paid' NOT NULL,
	"base_fee_inr" integer,
	"barter_note" text,
	"offer_text" text NOT NULL,
	"promo_code" text NOT NULL,
	"link_code" text NOT NULL,
	"destination_url" text,
	"post_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tracked_posts_link_code_unique" UNIQUE("link_code")
);
--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "counter_pin_hash" text;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tracked_post_id_tracked_posts_id_fk" FOREIGN KEY ("tracked_post_id") REFERENCES "public"."tracked_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_posts" ADD CONSTRAINT "tracked_posts_business_user_id_users_id_fk" FOREIGN KEY ("business_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_posts" ADD CONSTRAINT "tracked_posts_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_posts" ADD CONSTRAINT "tracked_posts_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coupons_post" ON "coupons" USING btree ("tracked_post_id","redeemed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tracked_posts_business_code" ON "tracked_posts" USING btree ("business_user_id","promo_code");--> statement-breakpoint
CREATE INDEX "tracked_posts_business_time" ON "tracked_posts" USING btree ("business_user_id","created_at");