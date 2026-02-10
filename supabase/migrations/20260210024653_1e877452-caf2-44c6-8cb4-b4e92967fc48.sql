-- Add new columns to areas table
ALTER TABLE areas ADD COLUMN IF NOT EXISTS developer_count INTEGER DEFAULT 0;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS project_count_sale INTEGER DEFAULT 0;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS avg_price_sqft NUMERIC;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS provident_url TEXT;
ALTER TABLE areas ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- Normalize emirates
UPDATE areas SET emirate = 'Abu Dhabi' WHERE emirate = 'Abu Dhabi Emirate';
UPDATE areas SET emirate = 'Sharjah' WHERE emirate = 'Sharjah Emirate';
UPDATE areas SET emirate = 'Ajman' WHERE emirate = 'Ajman Emirate';
UPDATE areas SET emirate = 'Ras Al Khaimah' WHERE emirate IN ('Ras al-Khaimah');
UPDATE areas SET emirate = 'Umm Al Quwain' WHERE emirate = 'Umm al-Quwain';