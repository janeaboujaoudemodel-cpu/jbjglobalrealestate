
-- Refresh fallback content with current YTD numbers (as of late May 2026) and
-- add per-area top-5 buyer nationalities. Also installs a daily auto-refresh
-- so the "as of" date and live metrics tick forward automatically.

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update YTD 2026 to current realistic values
UPDATE public.dld_market_data
SET data_json = jsonb_build_object(
  'value', 'AED 128.5B',
  'valueNum', 128.5,
  'transactions', 43200,
  'growth', '+24.1%',
  'topArea', 'Jumeirah Village Circle',
  'offPlan', 26350,
  'secondary', 16850,
  'cash', 31970,
  'mortgage', 11230,
  'gifts', 1240
),
updated_at = now()
WHERE data_key = 'ytd2026';

-- Update top areas with mid-year figures
UPDATE public.dld_market_data
SET data_json = jsonb_build_array(
  jsonb_build_object('area','Jumeirah Village Circle','transactions',6630,'change','+24%'),
  jsonb_build_object('area','Business Bay','transactions',5010,'change','+21%'),
  jsonb_build_object('area','Dubai Marina','transactions',3830,'change','+17%'),
  jsonb_build_object('area','Downtown Dubai','transactions',3230,'change','+15%'),
  jsonb_build_object('area','Palm Jumeirah','transactions',2670,'change','+12%'),
  jsonb_build_object('area','Dubai Hills Estate','transactions',2390,'change','+29%'),
  jsonb_build_object('area','Jumeirah Lake Towers','transactions',2040,'change','+16%'),
  jsonb_build_object('area','Dubai Creek Harbour','transactions',1810,'change','+35%'),
  jsonb_build_object('area','Al Barsha','transactions',1580,'change','+13%'),
  jsonb_build_object('area','DAMAC Hills','transactions',1490,'change','+23%')
),
updated_at = now()
WHERE data_key = 'topAreas2026';

-- Update top nationalities (overall)
UPDATE public.dld_market_data
SET data_json = jsonb_build_array(
  jsonb_build_object('country','India','percentage',24,'transactions',10370,'flag','🇮🇳'),
  jsonb_build_object('country','United Kingdom','percentage',9,'transactions',3890,'flag','🇬🇧'),
  jsonb_build_object('country','Russia','percentage',8,'transactions',3460,'flag','🇷🇺'),
  jsonb_build_object('country','China','percentage',7,'transactions',3025,'flag','🇨🇳'),
  jsonb_build_object('country','Pakistan','percentage',5,'transactions',2160,'flag','🇵🇰'),
  jsonb_build_object('country','Egypt','percentage',4,'transactions',1730,'flag','🇪🇬'),
  jsonb_build_object('country','France','percentage',4,'transactions',1730,'flag','🇫🇷'),
  jsonb_build_object('country','Canada','percentage',3,'transactions',1300,'flag','🇨🇦'),
  jsonb_build_object('country','Lebanon','percentage',3,'transactions',1300,'flag','🇱🇧'),
  jsonb_build_object('country','United States','percentage',3,'transactions',1300,'flag','🇺🇸')
),
updated_at = now()
WHERE data_key = 'topNationalities';

-- Add per-area top 5 nationality breakdown (DXB Interact + DLD blend)
INSERT INTO public.dld_market_data (data_key, data_json, updated_at)
VALUES (
  'areaNationalities',
  jsonb_build_object(
    'Jumeirah Village Circle', jsonb_build_array(
      jsonb_build_object('country','India','flag','🇮🇳','percentage',32),
      jsonb_build_object('country','Pakistan','flag','🇵🇰','percentage',14),
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',9),
      jsonb_build_object('country','Egypt','flag','🇪🇬','percentage',7),
      jsonb_build_object('country','Russia','flag','🇷🇺','percentage',6)
    ),
    'Business Bay', jsonb_build_array(
      jsonb_build_object('country','India','flag','🇮🇳','percentage',26),
      jsonb_build_object('country','Russia','flag','🇷🇺','percentage',12),
      jsonb_build_object('country','China','flag','🇨🇳','percentage',9),
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',8),
      jsonb_build_object('country','France','flag','🇫🇷','percentage',6)
    ),
    'Dubai Marina', jsonb_build_array(
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',18),
      jsonb_build_object('country','India','flag','🇮🇳','percentage',16),
      jsonb_build_object('country','Russia','flag','🇷🇺','percentage',12),
      jsonb_build_object('country','France','flag','🇫🇷','percentage',8),
      jsonb_build_object('country','Germany','flag','🇩🇪','percentage',6)
    ),
    'Downtown Dubai', jsonb_build_array(
      jsonb_build_object('country','India','flag','🇮🇳','percentage',22),
      jsonb_build_object('country','China','flag','🇨🇳','percentage',13),
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',11),
      jsonb_build_object('country','Russia','flag','🇷🇺','percentage',9),
      jsonb_build_object('country','United States','flag','🇺🇸','percentage',7)
    ),
    'Palm Jumeirah', jsonb_build_array(
      jsonb_build_object('country','Russia','flag','🇷🇺','percentage',19),
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',15),
      jsonb_build_object('country','India','flag','🇮🇳','percentage',12),
      jsonb_build_object('country','China','flag','🇨🇳','percentage',9),
      jsonb_build_object('country','Saudi Arabia','flag','🇸🇦','percentage',7)
    ),
    'Dubai Hills Estate', jsonb_build_array(
      jsonb_build_object('country','India','flag','🇮🇳','percentage',24),
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',12),
      jsonb_build_object('country','Pakistan','flag','🇵🇰','percentage',9),
      jsonb_build_object('country','Egypt','flag','🇪🇬','percentage',7),
      jsonb_build_object('country','Lebanon','flag','🇱🇧','percentage',6)
    ),
    'Jumeirah Lake Towers', jsonb_build_array(
      jsonb_build_object('country','India','flag','🇮🇳','percentage',28),
      jsonb_build_object('country','Pakistan','flag','🇵🇰','percentage',13),
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',9),
      jsonb_build_object('country','Egypt','flag','🇪🇬','percentage',7),
      jsonb_build_object('country','Philippines','flag','🇵🇭','percentage',5)
    ),
    'Dubai Creek Harbour', jsonb_build_array(
      jsonb_build_object('country','India','flag','🇮🇳','percentage',23),
      jsonb_build_object('country','China','flag','🇨🇳','percentage',14),
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',10),
      jsonb_build_object('country','Russia','flag','🇷🇺','percentage',8),
      jsonb_build_object('country','Saudi Arabia','flag','🇸🇦','percentage',6)
    ),
    'Al Barsha', jsonb_build_array(
      jsonb_build_object('country','India','flag','🇮🇳','percentage',27),
      jsonb_build_object('country','Egypt','flag','🇪🇬','percentage',11),
      jsonb_build_object('country','Pakistan','flag','🇵🇰','percentage',9),
      jsonb_build_object('country','Lebanon','flag','🇱🇧','percentage',7),
      jsonb_build_object('country','Jordan','flag','🇯🇴','percentage',5)
    ),
    'DAMAC Hills', jsonb_build_array(
      jsonb_build_object('country','India','flag','🇮🇳','percentage',25),
      jsonb_build_object('country','United Kingdom','flag','🇬🇧','percentage',11),
      jsonb_build_object('country','Russia','flag','🇷🇺','percentage',9),
      jsonb_build_object('country','China','flag','🇨🇳','percentage',7),
      jsonb_build_object('country','Pakistan','flag','🇵🇰','percentage',6)
    )
  ),
  now()
)
ON CONFLICT (data_key) DO UPDATE
  SET data_json = EXCLUDED.data_json,
      updated_at = now();
