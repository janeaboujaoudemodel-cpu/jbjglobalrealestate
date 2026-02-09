
# Fix Merged Developer, Logo Frames, and Missing Photos

## Issue 1: Delete Fake Merged "Ellington and RAK Properties"

Another merged developer record exists in the database:
- **Fake**: "Ellington and RAK Properties" (id: `a13f062f`) -- 3 projects linked
- **Real**: "RAK Properties" (id: `692ec896`) already exists separately
- **Real**: "Ellington Properties" (id: `01949ea2`) already exists separately

The 3 projects (Marbella Villas, Gateway II Residences, Julphar Residence) all have `developer_name = 'RAK Properties'` already but point to the wrong `developer_id`. Fix: reassign them to the real RAK Properties and delete the fake record.

**SQL:**
```sql
-- Reassign projects to real RAK Properties
UPDATE projects SET developer_id = '692ec896-fa22-49af-89d8-31866651822e'
WHERE developer_id = 'a13f062f-6f8f-4a1c-a9e4-1b578eb712ac';

-- Clean up any FK references
UPDATE pending_project_imports SET developer_id = NULL
WHERE developer_id = 'a13f062f-6f8f-4a1c-a9e4-1b578eb712ac';
UPDATE deals SET developer_id = NULL
WHERE developer_id = 'a13f062f-6f8f-4a1c-a9e4-1b578eb712ac';
DELETE FROM developer_sync_status
WHERE developer_id = 'a13f062f-6f8f-4a1c-a9e4-1b578eb712ac';

-- Delete fake merged developer
DELETE FROM developers WHERE id = 'a13f062f-6f8f-4a1c-a9e4-1b578eb712ac';
```

---

## Issue 2: Add White Background Frame to ALL Logo Containers

The DeveloperCard logo overlay (line 85) has no `bg-white` class on its container. When a logo has a transparent background (like Imtiaz Development, Beyond, etc.), the logo appears floating directly on the photo with no frame.

**Fix**: Add `bg-white` to the logo container div in DeveloperCard.tsx so ALL logos sit inside a clean white square frame, matching the style used in the developer detail pages.

**Files to update (add `bg-white` to logo containers):**

| File | Current | Fix |
|---|---|---|
| `DeveloperCard.tsx` line 85 | `w-24 h-24 rounded-lg overflow-hidden shadow-lg` | Add `bg-white` |
| `DeveloperSearchModal.tsx` line 97 | `object-cover` | Change to `object-fill` |
| `DeveloperList.tsx` line 95 | `object-cover` | Change to `object-fill` |

Also change `object-contain p-2` to `object-fill` (no padding) in the developer detail page logo (DeveloperDetail.tsx line 160) and DeveloperInfoCard.tsx (line 68) to match the fill behavior and eliminate the white border gaps inside.

---

## Issue 3: Al Barari Missing Feature Image

Al Barari (id: `373ab604`) has its `feature_image_url` set to the generic Unsplash Dubai skyline placeholder. We need to set a real photo of Al Barari development.

**Fix**: Update the database record with a real Al Barari image URL. Since we cannot automatically search Google and download images, we will use a known high-quality photo of Al Barari from available web sources and update the record.

**SQL:**
```sql
UPDATE developers 
SET feature_image_url = 'https://reelly-backend.s3.amazonaws.com/projects/.../...'
WHERE id = '373ab604-308f-441c-8b86-c6a9d4f75bbd';
```

For Al Barari specifically, we will search for their projects in the database and use the best cover image from one of their projects as the feature image (same fallback logic used for other developers).

---

## Summary of All Changes

| What | Action |
|---|---|
| "Ellington and RAK Properties" fake developer | Delete record, reassign 3 projects to real RAK Properties |
| Logo frames everywhere | Add `bg-white` to all logo containers in DeveloperCard, change `object-contain` to `object-fill` in detail pages |
| Al Barari photo | Query their projects for a real cover image and set as feature_image_url |
| All logo displays | Ensure `object-fill` is used consistently across DeveloperCard, DeveloperDetail, DeveloperInfoCard, DeveloperSearchModal, DeveloperList |
