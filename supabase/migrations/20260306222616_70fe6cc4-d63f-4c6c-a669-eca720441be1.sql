-- MERGE DUPLICATE DEVELOPERS
-- Strategy: Reassign projects from the weaker duplicate to the canonical record, then soft-delete duplicates

-- 1. Acube: Keep "Acube Developers" (155025ff), merge "Acube Developments" (6e3a7bd7) into it
UPDATE projects SET developer_id = '155025ff-17cb-4f1d-abee-b36e15121a43'
WHERE developer_id = '6e3a7bd7-8e43-45a1-af96-999dbe5adf3e';

UPDATE developers SET is_hidden = true WHERE id = '6e3a7bd7-8e43-45a1-af96-999dbe5adf3e';

-- 2. Azizi: Keep "Azizi Developments" (43c40b22, 51 projects), merge "Azizi" (e72895ef, 12 projects) into it
UPDATE projects SET developer_id = '43c40b22-9572-4540-8058-e48342a11419'
WHERE developer_id = 'e72895ef-64c1-42ab-ae61-67bd9d7ffcc8';

UPDATE developers SET is_hidden = true WHERE id = 'e72895ef-64c1-42ab-ae61-67bd9d7ffcc8';

-- 3. Beyond: Keep "Beyond Developments" (fb819da5, 8 projects), merge "Beyond" (93f80d99, 7 projects) into it
UPDATE projects SET developer_id = 'fb819da5-8fba-44ae-93a6-32c9d3c6b8a1'
WHERE developer_id = '93f80d99-f81e-4255-931a-305e67dab4e2';

UPDATE developers SET is_hidden = true WHERE id = '93f80d99-f81e-4255-931a-305e67dab4e2';