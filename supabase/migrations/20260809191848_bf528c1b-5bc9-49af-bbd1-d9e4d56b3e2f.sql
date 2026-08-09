SET LOCAL app.allow_logo_overwrite = 'true';

-- Unlock the specific defective logo records first (lock guard only trips when logo_url changes)
UPDATE public.developers
SET logo_locked = FALSE
WHERE id IN (
  'd7408864-2e18-4428-97a1-ea42d585e536',
  'd596cb0f-0324-4425-8388-0d9032e4c0f6',
  '296ad609-a535-488e-a3d3-7a28e781563f',
  '6e4f80a5-19cf-46a1-96e5-99551d571aed',
  '2c175ea5-2c7d-4867-b5de-91267e6c82ad',
  'e3b46ab5-4ebe-4e39-825e-21e8c63c91d6',
  'd111fafd-f279-45bf-8bd7-4c9169812a84',
  '8e16db56-ac0e-4596-bc63-863adbaac601',
  'eb3acb2e-fe40-4c7e-8ad7-b117122ee396',
  'e141a712-bf83-41d1-a43b-513b58fe06c5',
  '8318e699-213c-43d0-8577-19521c5009be',
  '1d74ec1d-52ab-4e24-a9ca-0f70475de7fe'
);

-- Purge fake / non-project developer covers (verified visually one by one)
UPDATE public.developers
SET feature_image_url = NULL,
    needs_review = TRUE,
    review_flags = COALESCE(review_flags, '{}'::jsonb) || jsonb_build_object('cover_removed_fake', TRUE, 'cover_removed_reason', 'not genuine project imagery (stock people / advertising banner / app screenshot / mall / collage / dead link)', 'cover_removed_at', now()),
    review_flagged_at = now(),
    updated_at = now()
WHERE id IN (
  '4714e2c0-84d1-4b78-95de-755fdde0718f',
  'ba302d15-2ca4-4854-8185-0584d0132f6c',
  'aa9421e9-38f5-4679-9948-406a66a26259',
  '69eeab66-c9f1-46e7-af5e-496eb6ce35c4',
  'a59a60df-8f72-4d55-8cb2-431bb225951b',
  'a1335c94-d582-4314-b96d-506ca8eb5871',
  'e258bb10-bef7-462f-8d5e-3b090add794b'
)
OR (feature_image_url IS NOT NULL AND (
     feature_image_url ILIKE '%bing.com%'
  OR feature_image_url ILIKE '%cronos.com/seo%'
  OR feature_image_url ILIKE '%Open_House%'
  OR feature_image_url ILIKE '%deerfieldsmall.com%'
  OR feature_image_url ILIKE '%tuscanyred.com/./images/p3.jpg%'
  OR feature_image_url ILIKE '%bonyanholding.com%slider2%'
  OR feature_image_url ILIKE '%67ed2e5521651ad99e65f756_banner%'
  OR feature_image_url ILIKE '%Zenith-Projects-Updated%'
  OR feature_image_url ILIKE '%tripadvisor%'
));

-- Purge placeholder / defective logos (blank circles, knocked-out boxes, faint ghosts, baked squares, dead links)
UPDATE public.developers
SET logo_url = NULL,
    logo_url_processed = NULL,
    logo_verified = FALSE,
    logo_locked = FALSE,
    logo_status = 'missing',
    needs_review = TRUE,
    review_flags = COALESCE(review_flags, '{}'::jsonb) || jsonb_build_object('logo_removed_invalid', TRUE, 'logo_removed_reason', 'placeholder blob / baked square background / faint ghost ink / dead link', 'logo_removed_at', now()),
    review_flagged_at = now(),
    updated_at = now()
WHERE id IN (
  'd7408864-2e18-4428-97a1-ea42d585e536',
  'd596cb0f-0324-4425-8388-0d9032e4c0f6',
  '296ad609-a535-488e-a3d3-7a28e781563f',
  '6e4f80a5-19cf-46a1-96e5-99551d571aed',
  '2c175ea5-2c7d-4867-b5de-91267e6c82ad',
  'e3b46ab5-4ebe-4e39-825e-21e8c63c91d6',
  'd111fafd-f279-45bf-8bd7-4c9169812a84',
  '8e16db56-ac0e-4596-bc63-863adbaac601',
  'eb3acb2e-fe40-4c7e-8ad7-b117122ee396',
  'e141a712-bf83-41d1-a43b-513b58fe06c5',
  '8318e699-213c-43d0-8577-19521c5009be',
  '1d74ec1d-52ab-4e24-a9ca-0f70475de7fe'
);