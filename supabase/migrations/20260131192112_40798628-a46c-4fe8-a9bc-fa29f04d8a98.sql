-- Fix pending imports developer foreign key to match projects (developers table)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'pending_project_imports_developer_id_fkey'
      AND conrelid = 'public.pending_project_imports'::regclass
  ) THEN
    EXECUTE 'ALTER TABLE public.pending_project_imports DROP CONSTRAINT pending_project_imports_developer_id_fkey';
  END IF;
END $$;

-- Ensure existing rows won't fail the new FK
UPDATE public.pending_project_imports p
SET developer_id = NULL
WHERE p.developer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.developers d WHERE d.id = p.developer_id
  );

-- Recreate FK pointing to public.developers
ALTER TABLE public.pending_project_imports
ADD CONSTRAINT pending_project_imports_developer_id_fkey
FOREIGN KEY (developer_id)
REFERENCES public.developers(id)
ON UPDATE CASCADE
ON DELETE SET NULL;