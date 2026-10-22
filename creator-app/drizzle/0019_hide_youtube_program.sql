-- Instagram-only launch: hide the YouTube Shopping programme from creators (admins can publish it again).
UPDATE "programs" SET "status" = 'hidden' WHERE "id" = 'seed-youtube-shopping' AND "status" = 'published';
--> statement-breakpoint
-- In its place, an Instagram-first programme, so creators still see at least 10 from the start.
INSERT INTO "programs" ("id", "kind", "name", "summary", "eligibility", "link", "sort_order") VALUES
  ('seed-wishlink', 'platform', 'Wishlink', 'An Indian creator storefront: put the products you show in your reels and stories in one link in your Instagram bio, and earn a commission on what your followers buy.', 'Instagram creators. Check Wishlink''s current terms.', 'https://www.wishlink.com/', 10)
ON CONFLICT ("id") DO NOTHING;
