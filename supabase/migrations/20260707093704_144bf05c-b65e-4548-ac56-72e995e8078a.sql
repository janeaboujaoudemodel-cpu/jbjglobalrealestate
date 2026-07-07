
-- Fix Amra location truth (user-confirmed: Umm Al Quwain, not Al Hamra/RAK)
UPDATE public.projects
SET area_name = 'Al Raudah',
    location = 'Al Raudah, Umm Al Quwain',
    emirate = 'Umm Al Quwain',
    furnished_status = 'furnished',
    is_serviced = true,
    property_type_label = 'Hotel Apartment · Serviced Apartment'
WHERE id = 'b6e3de69-24d9-4401-b50b-f970d81a0b18';

-- Also fix sibling Amra Residences (same developer, same emirate)
UPDATE public.projects
SET emirate = 'Umm Al Quwain'
WHERE id = '6838b0ae-30ba-44fc-a45b-cc25f2bd7ca7';
