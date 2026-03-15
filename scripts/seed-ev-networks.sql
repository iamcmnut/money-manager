-- Seed Thai EV Charging Networks
INSERT INTO charging_networks (id, name, slug, logo, website, phone, brand_color, created_at, updated_at)
VALUES
  ('ptt-ev-station-pluz', 'PTT EV Station PluZ', 'ptt-ev-station-pluz', NULL, 'https://evstationpluz.pttor.com', '02-239-9998', '#00A651', unixepoch(), unixepoch()),
  ('pea-volta', 'PEA VOLTA', 'pea-volta', NULL, 'https://peavoltaev.pea.co.th', '02-009-6127', '#1E3A8A', unixepoch(), unixepoch()),
  ('elexa', 'EleXA', 'elexa', NULL, 'https://elexaev.com', '+66 63 249 6651', '#FF6B00', unixepoch(), unixepoch()),
  ('charge-plus', 'Charge+', 'charge-plus', NULL, 'https://chargeplus.com/thailand', NULL, '#00B4D8', unixepoch(), unixepoch()),
  ('evolt', 'EVolt', 'evolt', NULL, 'https://evolt.co.th', '02-114-7343', '#8B5CF6', unixepoch(), unixepoch()),
  ('reversharger', 'ReverSharger', 'reversharger', NULL, 'https://sharge.co.th', '02 114 7571', '#10B981', unixepoch(), unixepoch())
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  slug = excluded.slug,
  website = excluded.website,
  phone = excluded.phone,
  brand_color = excluded.brand_color,
  updated_at = unixepoch();
