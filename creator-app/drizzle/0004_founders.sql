ALTER TABLE "users" ADD COLUMN "founder_number" integer;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_founder_number_unique" UNIQUE("founder_number");