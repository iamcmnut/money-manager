-- One-shot backfill: assign a random 12-char hex slug to any user missing one.
-- Run after migration 0012 has been applied. Subsequent registrations generate
-- their own slug at signup via src/lib/slug.ts.
--
-- Usage:
--   wrangler d1 execute manager-money-db --local --file=scripts/backfill-slugs.sql
--   wrangler d1 execute manager-money-db --remote --file=scripts/backfill-slugs.sql

UPDATE users SET public_slug = lower(hex(randomblob(6))) WHERE public_slug IS NULL;
