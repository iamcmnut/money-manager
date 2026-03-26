INSERT INTO `coupons` (`id`, `network_id`, `code`, `description_en`, `description_th`, `start_date`, `end_date`, `is_active`, `created_at`, `updated_at`)
SELECT
  'coupon-legacy-' || `id`,
  `id`,
  `referral_code`,
  `referral_caption_en`,
  `referral_caption_th`,
  CAST(strftime('%s', '2024-01-01') AS INTEGER),
  CAST(strftime('%s', '2099-12-31') AS INTEGER),
  1,
  `created_at`,
  CAST(strftime('%s', 'now') AS INTEGER)
FROM `charging_networks`
WHERE `referral_code` IS NOT NULL;
