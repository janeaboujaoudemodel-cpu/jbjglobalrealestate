

## Delete All Non-UAE Projects (Oman)

### What Will Be Deleted

9 projects located outside the seven UAE Emirates:

- **Muscat Governorate, Oman** -- 8 projects
- **Dhofar Governorate, Oman** -- 1 project

No projects from Thailand or any other non-UAE country were found.

### Steps

1. **Delete related records first** (foreign key dependencies):
   - Delete from `project_images` where `project_id` matches any Oman project
   - Delete from `project_documents` where `project_id` matches any Oman project

2. **Delete the 9 projects** from the `projects` table where `emirate IN ('Muscat Governorate', 'Dhofar Governorate')`

3. **Verify** the deletion with a count query to confirm no non-UAE projects remain

### Technical Detail

A single database migration with three DELETE statements executed in order to respect foreign key constraints. No code file changes are needed -- the UI already reads from the `projects` table dynamically, so the Oman listings will simply disappear.

