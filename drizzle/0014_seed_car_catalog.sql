-- Seed Phase 1 car catalog (Thai EV market). Admins can extend via /boss-office.

INSERT OR IGNORE INTO car_brands (id, name, slug, logo, created_at) VALUES
('byd', 'BYD', 'byd', NULL, unixepoch()),
('tesla', 'Tesla', 'tesla', NULL, unixepoch()),
('mg', 'MG', 'mg', NULL, unixepoch()),
('neta', 'NETA', 'neta', NULL, unixepoch()),
('ora', 'ORA', 'ora', NULL, unixepoch()),
('great-wall', 'Great Wall Motor', 'great-wall', NULL, unixepoch()),
('volvo', 'Volvo', 'volvo', NULL, unixepoch()),
('bmw', 'BMW', 'bmw', NULL, unixepoch()),
('mercedes-benz', 'Mercedes-Benz', 'mercedes-benz', NULL, unixepoch()),
('porsche', 'Porsche', 'porsche', NULL, unixepoch()),
('aion', 'AION', 'aion', NULL, unixepoch()),
('changan', 'Changan', 'changan', NULL, unixepoch()),
('deepal', 'Deepal', 'deepal', NULL, unixepoch()),
('xpeng', 'XPENG', 'xpeng', NULL, unixepoch()),
('nissan', 'Nissan', 'nissan', NULL, unixepoch()),
('hyundai', 'Hyundai', 'hyundai', NULL, unixepoch()),
('toyota', 'Toyota', 'toyota', NULL, unixepoch()),
('honda', 'Honda', 'honda', NULL, unixepoch());
--> statement-breakpoint

INSERT OR IGNORE INTO car_models (id, brand_id, name, model_year, battery_kwh, is_active, created_at) VALUES
-- BYD
('model-byd-atto3', 'byd', 'Atto 3', 2024, 60.5, 1, unixepoch()),
('model-byd-dolphin', 'byd', 'Dolphin', 2024, 44.9, 1, unixepoch()),
('model-byd-seal', 'byd', 'Seal', 2024, 82.5, 1, unixepoch()),
('model-byd-m6', 'byd', 'M6', 2025, 71.8, 1, unixepoch()),
('model-byd-sealion6', 'byd', 'Sealion 6 DM-i', 2025, 18.3, 1, unixepoch()),
('model-byd-sealion7', 'byd', 'Sealion 7', 2025, 82.5, 1, unixepoch()),
-- Tesla
('model-tesla-model3', 'tesla', 'Model 3', 2024, 60.0, 1, unixepoch()),
('model-tesla-modely', 'tesla', 'Model Y', 2024, 75.0, 1, unixepoch()),
-- MG
('model-mg-zsev', 'mg', 'ZS EV', 2024, 51.1, 1, unixepoch()),
('model-mg-mg4', 'mg', 'MG4 Electric', 2024, 64.0, 1, unixepoch()),
('model-mg-ep', 'mg', 'MG EP', 2023, 50.3, 1, unixepoch()),
('model-mg-es', 'mg', 'MG ES', 2024, 51.1, 1, unixepoch()),
-- NETA
('model-neta-v', 'neta', 'NETA V', 2024, 38.5, 1, unixepoch()),
('model-neta-x', 'neta', 'NETA X', 2025, 60.0, 1, unixepoch()),
-- ORA
('model-ora-good-cat', 'ora', 'Good Cat', 2024, 47.8, 1, unixepoch()),
('model-ora-good-cat-gt', 'ora', 'Good Cat GT', 2024, 63.1, 1, unixepoch()),
-- Great Wall
('model-gwm-tank300hev', 'great-wall', 'Tank 300 HEV', 2024, 1.8, 1, unixepoch()),
-- Volvo
('model-volvo-xc40recharge', 'volvo', 'XC40 Recharge', 2024, 78.0, 1, unixepoch()),
('model-volvo-ex30', 'volvo', 'EX30', 2025, 69.0, 1, unixepoch()),
('model-volvo-ec40', 'volvo', 'EC40', 2025, 78.0, 1, unixepoch()),
-- BMW
('model-bmw-i4', 'bmw', 'i4', 2024, 83.9, 1, unixepoch()),
('model-bmw-ix3', 'bmw', 'iX3', 2024, 80.0, 1, unixepoch()),
('model-bmw-ix1', 'bmw', 'iX1', 2024, 64.7, 1, unixepoch()),
-- Mercedes-Benz
('model-mb-eqs', 'mercedes-benz', 'EQS', 2024, 107.8, 1, unixepoch()),
('model-mb-eqe', 'mercedes-benz', 'EQE', 2024, 90.6, 1, unixepoch()),
('model-mb-eqb', 'mercedes-benz', 'EQB', 2024, 66.5, 1, unixepoch()),
-- Porsche
('model-porsche-taycan', 'porsche', 'Taycan', 2024, 93.4, 1, unixepoch()),
-- AION
('model-aion-y-plus', 'aion', 'Y Plus', 2024, 63.2, 1, unixepoch()),
('model-aion-es', 'aion', 'ES', 2024, 49.0, 1, unixepoch()),
-- Changan
('model-changan-deepal-s07', 'changan', 'Deepal S07', 2024, 79.97, 1, unixepoch()),
-- Deepal
('model-deepal-l07', 'deepal', 'L07', 2025, 79.97, 1, unixepoch()),
-- XPENG
('model-xpeng-g6', 'xpeng', 'G6', 2025, 87.5, 1, unixepoch()),
('model-xpeng-x9', 'xpeng', 'X9', 2025, 101.5, 1, unixepoch()),
-- Nissan
('model-nissan-leaf', 'nissan', 'Leaf', 2024, 40.0, 1, unixepoch()),
-- Hyundai
('model-hyundai-ioniq5', 'hyundai', 'IONIQ 5', 2024, 72.6, 1, unixepoch()),
('model-hyundai-ioniq6', 'hyundai', 'IONIQ 6', 2024, 77.4, 1, unixepoch()),
('model-hyundai-kona', 'hyundai', 'Kona Electric', 2024, 64.0, 1, unixepoch()),
-- Toyota
('model-toyota-bz4x', 'toyota', 'bZ4X', 2024, 71.4, 1, unixepoch()),
-- Honda
('model-honda-e-ny1', 'honda', 'e:N1', 2024, 68.8, 1, unixepoch());
