
UPDATE dld_market_data SET 
  data_json = '{"value":"AED 122.4B","valueNum":122.4,"transactions":41200,"growth":"+23.5%","topArea":"Jumeirah Village Circle","offPlan":25100,"secondary":16100,"cash":30500,"mortgage":10700,"gifts":1180}'::jsonb,
  updated_at = now()
WHERE data_key = 'ytd2026';

UPDATE dld_market_data SET 
  data_json = '[{"area":"Jumeirah Village Circle","transactions":6320,"change":"+24%"},{"area":"Business Bay","transactions":4780,"change":"+20%"},{"area":"Dubai Marina","transactions":3650,"change":"+17%"},{"area":"Downtown Dubai","transactions":3080,"change":"+14%"},{"area":"Palm Jumeirah","transactions":2540,"change":"+11%"},{"area":"Dubai Hills Estate","transactions":2280,"change":"+28%"},{"area":"Jumeirah Lake Towers","transactions":1940,"change":"+16%"},{"area":"Dubai Creek Harbour","transactions":1720,"change":"+34%"},{"area":"Al Barsha","transactions":1510,"change":"+13%"},{"area":"DAMAC Hills","transactions":1420,"change":"+22%"}]'::jsonb,
  updated_at = now()
WHERE data_key = 'topAreas2026';

UPDATE dld_market_data SET 
  data_json = '[{"country":"India","percentage":24,"transactions":9888,"flag":"🇮🇳"},{"country":"United Kingdom","percentage":9,"transactions":3708,"flag":"🇬🇧"},{"country":"Russia","percentage":8,"transactions":3296,"flag":"🇷🇺"},{"country":"China","percentage":7,"transactions":2884,"flag":"🇨🇳"},{"country":"Pakistan","percentage":5,"transactions":2060,"flag":"🇵🇰"},{"country":"Egypt","percentage":4,"transactions":1648,"flag":"🇪🇬"},{"country":"France","percentage":4,"transactions":1648,"flag":"🇫🇷"},{"country":"Canada","percentage":3,"transactions":1236,"flag":"🇨🇦"},{"country":"Lebanon","percentage":3,"transactions":1236,"flag":"🇱🇧"},{"country":"United States","percentage":3,"transactions":1236,"flag":"🇺🇸"}]'::jsonb,
  updated_at = now()
WHERE data_key = 'topNationalities';
