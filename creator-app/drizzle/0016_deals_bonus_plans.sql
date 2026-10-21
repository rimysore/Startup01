ALTER TABLE "business_profiles" ADD COLUMN "plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "plan_interest" text;--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "plan_interest_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "bonus_per_customer_inr" integer;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "bonus_cap_inr" integer;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "kind" text DEFAULT 'paid' NOT NULL;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "barter_note" text;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "bonus_per_customer_inr" integer;--> statement-breakpoint
ALTER TABLE "invites" ADD COLUMN "bonus_cap_inr" integer;--> statement-breakpoint
ALTER TABLE "tracked_posts" ADD COLUMN "bonus_per_customer_inr" integer;--> statement-breakpoint
ALTER TABLE "tracked_posts" ADD COLUMN "bonus_cap_inr" integer;