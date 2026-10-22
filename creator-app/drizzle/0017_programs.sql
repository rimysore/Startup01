CREATE TABLE "program_interests" (
	"user_id" text NOT NULL,
	"program_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_interests_user_id_program_id_pk" PRIMARY KEY("user_id","program_id")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"name" text NOT NULL,
	"summary" text NOT NULL,
	"eligibility" text,
	"area" text,
	"link" text,
	"status" text DEFAULT 'published' NOT NULL,
	"sort_order" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "program_interests" ADD CONSTRAINT "program_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_interests" ADD CONSTRAINT "program_interests_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "programs_status_sort" ON "programs" USING btree ("status","sort_order");--> statement-breakpoint
INSERT INTO "programs" ("id", "kind", "name", "summary", "eligibility", "link", "sort_order") VALUES
  ('seed-youtube-shopping', 'platform', 'YouTube Shopping affiliate (India)', 'Tag products from Flipkart, Myntra, Nykaa, Amazon, Meesho and other partner stores in your videos and Shorts, and earn when viewers buy.', 'YouTube Partner Program; reported 10K+ subscribers. Check YouTube''s current terms.', 'https://www.youtube.com/creators/', 10),
  ('seed-myntra-ugc', 'brand', 'Myntra Ultimate Glam Clan', 'Myntra''s creator programme for shoppers who post looks and reviews; earnings depend on how your posts perform.', 'Open sign-up in the Myntra app.', 'https://www.myntra.com/', 20),
  ('seed-meesho-creator', 'brand', 'Meesho Creator Club', 'Meesho''s in-house creator programme: share products and earn on sales your content brings, with performance analytics.', 'Check follower requirements in the Meesho app.', 'https://www.meesho.com/', 30),
  ('seed-amazon-associates', 'affiliate', 'Amazon Associates India', 'Amazon''s affiliate programme: share product links and earn a commission on qualifying purchases.', 'Website, app or social account with an audience. Check Amazon''s terms.', 'https://affiliate-program.amazon.in/', 40),
  ('seed-flipkart-affiliate', 'affiliate', 'Flipkart Affiliate', 'Flipkart''s affiliate programme: earn on purchases made through your links, with sale-season campaigns.', 'Check Flipkart''s current terms.', 'https://affiliate.flipkart.com/', 50),
  ('seed-earnkaro', 'affiliate', 'EarnKaro', 'Make affiliate links for many Indian shopping sites (Myntra, Flipkart, Ajio and more) from one app.', 'Free to join. Check payout terms.', 'https://earnkaro.com/', 60),
  ('seed-cuelinks', 'affiliate', 'Cuelinks', 'An Indian affiliate network: one account gives you links for hundreds of shopping and travel brands.', 'Website, blog or social account. Check approval terms.', 'https://www.cuelinks.com/', 70),
  ('seed-vcommission', 'affiliate', 'vCommission', 'An Indian affiliate network running campaigns for apps, finance, shopping and more.', 'Apply as a publisher. Check approval terms.', 'https://www.vcommission.com/', 80),
  ('seed-involve-asia', 'affiliate', 'Involve Asia', 'An affiliate network with Indian brand offers (including Myntra); apply to each brand''s offer for a tracking link.', 'Apply as a publisher, then per brand.', 'https://involve.asia/', 90),
  ('seed-mitra-local', 'local', 'Bengaluru cafés, salons and gyms on Mitra', 'Local businesses near you send paid or barter invites through Mitra, with the fee written down. Turn on "Let local businesses find me" in your media kit.', 'Kannada or English creators in Bengaluru.', NULL, 5)
ON CONFLICT DO NOTHING;
