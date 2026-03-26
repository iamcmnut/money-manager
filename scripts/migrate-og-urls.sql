-- Migrate OG image URLs from /api/upload/ to R2 public domain
-- Run: wrangler d1 execute manager-money-db --remote --file=scripts/migrate-og-urls.sql

UPDATE charging_networks
SET coupon_og_image_en = REPLACE(coupon_og_image_en, '/api/upload/', 'https://cdn.manager.money/')
WHERE coupon_og_image_en LIKE '/api/upload/%';

UPDATE charging_networks
SET coupon_og_image_th = REPLACE(coupon_og_image_th, '/api/upload/', 'https://cdn.manager.money/')
WHERE coupon_og_image_th LIKE '/api/upload/%';

-- Also migrate logo URLs if they use the API route
UPDATE charging_networks
SET logo = REPLACE(logo, '/api/upload/', 'https://cdn.manager.money/')
WHERE logo LIKE '/api/upload/%';
