CREATE TABLE "business_interests" (
	"creator_user_id" text NOT NULL,
	"business_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_interests_creator_user_id_business_user_id_pk" PRIMARY KEY("creator_user_id","business_user_id")
);
--> statement-breakpoint
CREATE TABLE "instagram_connections" (
	"user_id" text PRIMARY KEY NOT NULL,
	"ig_user_id" text NOT NULL,
	"username" text NOT NULL,
	"access_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_profiles" ADD COLUMN "listed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_handles" ADD COLUMN "stats" jsonb;--> statement-breakpoint
ALTER TABLE "creator_handles" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "creator_handles" ADD COLUMN "profile_url" text;--> statement-breakpoint
ALTER TABLE "business_interests" ADD CONSTRAINT "business_interests_creator_user_id_users_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_interests" ADD CONSTRAINT "business_interests_business_user_id_users_id_fk" FOREIGN KEY ("business_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_connections" ADD CONSTRAINT "instagram_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_interests_business" ON "business_interests" USING btree ("business_user_id","created_at");