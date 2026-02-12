
-- Fix Skyblade price
UPDATE projects SET price_from = 1600000 WHERE id = '2e08730e-dbf9-4f36-89bf-3053ecacff59';

-- Clear FK references before deleting duplicate
UPDATE pending_project_imports SET matched_project_id = NULL WHERE matched_project_id = '2c43a30d-138d-432e-b90a-67425446f561';
DELETE FROM projects WHERE id = '2c43a30d-138d-432e-b90a-67425446f561';
