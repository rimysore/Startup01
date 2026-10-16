CREATE TABLE "prospect_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"seed" text NOT NULL,
	"language" text,
	"units" integer NOT NULL,
	"found" integer NOT NULL,
	"added" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel_id" text NOT NULL,
	"title" text NOT NULL,
	"handle" text,
	"avatar" text,
	"country" text,
	"language" text,
	"subscribers" integer DEFAULT 0 NOT NULL,
	"views" text DEFAULT '0' NOT NULL,
	"video_count" integer DEFAULT 0 NOT NULL,
	"last_upload_at" timestamp with time zone,
	"latest_video_title" text,
	"description" text,
	"emails" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"seed" text NOT NULL,
	"subject" text,
	"opener" text,
	"status" text DEFAULT 'new' NOT NULL,
	"notes" text,
	"contacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prospects_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE INDEX "prospect_runs_time" ON "prospect_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "prospects_status" ON "prospects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prospects_score" ON "prospects" USING btree ("score");