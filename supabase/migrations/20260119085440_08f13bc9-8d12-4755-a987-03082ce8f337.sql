-- Fix unified_listing_approvals view to use security_invoker
DROP VIEW IF EXISTS public.unified_listing_approvals;
CREATE VIEW public.unified_listing_approvals
WITH (security_invoker = on) AS
SELECT la.id,
    la.listing_id,
    la.listing_type,
    la.step_number,
    la.step_name,
    la.approver_role,
    la.approver_name,
    la.approver_email,
    la.approver_photo,
    la.approver_title,
    la.approver_department,
    la.status,
    la.notes,
    la.approved_at,
    la.created_at,
    CASE
        WHEN (la.listing_type = 'rental') THEN rl.property_title
        WHEN (la.listing_type = 'sale') THEN ((sl.property_type || ' in ') || sl.property_location)
        ELSE NULL
    END AS property_title,
    CASE
        WHEN (la.listing_type = 'rental') THEN rl.user_id
        WHEN (la.listing_type = 'sale') THEN sl.user_id
        ELSE NULL::uuid
    END AS owner_user_id
FROM ((listing_approvals la
    LEFT JOIN rental_listings rl ON ((la.listing_id = rl.id) AND (la.listing_type = 'rental')))
    LEFT JOIN seller_listings sl ON ((la.listing_id = sl.id) AND (la.listing_type = 'sale')));