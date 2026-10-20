CREATE TABLE "beta_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"anon_id" text,
	"name" text NOT NULL,
	"props" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"video_id" text NOT NULL,
	"video_title" text NOT NULL,
	"fixes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"baseline_pct_x10" integer,
	"language" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beta_events" ADD CONSTRAINT "beta_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sprints" ADD CONSTRAINT "sprints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "beta_events_user_time" ON "beta_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "beta_events_name_time" ON "beta_events" USING btree ("name","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sprints_user_video" ON "sprints" USING btree ("user_id","video_id");