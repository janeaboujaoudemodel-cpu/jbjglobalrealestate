-- Brokerage outreach automation: mirror the developer registration flow

-- 1) Ensure outreach_count exists on crm_brokerages so we can increment per send
ALTER TABLE public.crm_brokerages
  ADD COLUMN IF NOT EXISTS outreach_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_crm_brokerages_last_outreach_at
  ON public.crm_brokerages(owner_id, last_outreach_at);

-- 2) Allow new brokerage variants in crm_email_templates.
--    The existing CHECK constraint (if any) is dropped and rewritten to include the
--    two new variants. If no constraint exists this is a no-op.
DO $$
DECLARE
  v_conname text;
BEGIN
  SELECT conname INTO v_conname
  FROM pg_constraint
  WHERE conrelid = 'public.crm_email_templates'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%variant%';
  IF v_conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.crm_email_templates DROP CONSTRAINT %I', v_conname);
  END IF;
END $$;

ALTER TABLE public.crm_email_templates
  ADD CONSTRAINT crm_email_templates_variant_check
  CHECK (variant IN (
    'developer_registration',
    'developer_confirm_registered',
    'brokerage_partnership_intro',
    'brokerage_breakfast_invite'
  ));

-- 3) Seed the two brokerage templates (idempotent)
INSERT INTO public.crm_email_templates (variant, subject, html)
VALUES
('brokerage_partnership_intro',
 'Private Breakfast Briefing — JBJ Global Real Estate × {{brokerage_name}}',
 $TPL$<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF5EA;font-family:Inter,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;padding:32px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFDF7;border:1px solid #E8D9B8;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:36px 40px 18px;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A86A;font-weight:700;">JBJ Global Real Estate</div>
          <div style="height:1px;background:#E8D9B8;margin:16px 0 20px;"></div>
          <h1 style="font-size:24px;line-height:1.25;margin:0 0 6px;color:#0a0a0a;font-weight:700;">Private Breakfast Briefing</h1>
          <div style="font-size:12px;color:#7a6748;letter-spacing:1px;text-transform:uppercase;">Channel Partner Programme · Dubai, UAE</div>
        </td></tr>
        <tr><td style="padding:8px 40px 0;font-size:15px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 14px;">Dear <strong>{{contact_first_name}}</strong>,</p>
          <p style="margin:0 0 14px;">I'm <strong>{{owner_first_name}}</strong>, Head of Sales handling Channel Partners at <strong>JBJ GLOBAL REAL ESTATE</strong>. I wanted to reach out personally to check whether <strong>{{brokerage_name}}</strong> is currently registered with us, or has an active group on our channel-partner network — and if not, I'd like to fix that.</p>
          <p style="margin:0 0 18px;">We're hosting a <strong>private breakfast briefing</strong> at our Dubai office for senior leadership at selected brokerages. The agenda is short and focused: a market read on the current quarter, a walk-through of our exclusive inventory and commission structure, and a private conversation about how we can collaborate as channel partners going forward.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 40px 8px;">
          <a href="mailto:{{reply_to}}?subject=Re%3A%20Breakfast%20Briefing%20%E2%80%94%20{{brokerage_name}}" style="display:inline-block;background:#0a0a0a;color:#FFFDF7;text-decoration:none;padding:15px 34px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.5px;border:1px solid #C9A86A;">Reply to Confirm Interest →</a>
        </td></tr>
        <tr><td style="padding:18px 40px 0;font-size:14px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 12px;">If this is of interest, simply reply to this email and my office will send three date options. I'd also be glad to bring a tailored partnership brief specific to <strong>{{brokerage_name}}</strong>.</p>
          <div style="background:#FAF5EA;border:1px solid #E8D9B8;border-radius:10px;padding:14px 18px;font-size:13px;line-height:1.6;color:#0a0a0a;margin:18px 0 8px;">For any questions, please reply to <a href="mailto:{{reply_to}}" style="color:#0a0a0a;font-weight:600;">{{reply_to}}</a> with <a href="mailto:{{cc_email}}" style="color:#0a0a0a;font-weight:600;">{{cc_email}}</a> on CC.</div>
        </td></tr>
        <tr><td style="padding:24px 40px 36px;font-size:14px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:0 0 4px;">Warm regards,</p>
          <p style="margin:0;font-weight:700;">{{owner_first_name}}</p>
          <p style="margin:0;color:#7a6748;font-size:13px;">Head of Sales — Channel Partners</p>
          <p style="margin:0;color:#7a6748;font-size:13px;">{{from_name}}</p>
        </td></tr>
      </table>
      <div style="font-size:11px;color:#a8946a;margin-top:14px;letter-spacing:0.5px;">JBJ GLOBAL REAL ESTATE · Dubai, UAE</div>
    </td></tr>
  </table>
</body></html>$TPL$
)
ON CONFLICT (variant) DO NOTHING;

INSERT INTO public.crm_email_templates (variant, subject, html)
VALUES
('brokerage_breakfast_invite',
 'You''re invited — Private Partnership Breakfast at JBJ Global Real Estate',
 $TPL$<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF5EA;font-family:Inter,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;padding:32px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFDF7;border:1px solid #E8D9B8;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:36px 40px 18px;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A86A;font-weight:700;">JBJ Global Real Estate</div>
          <div style="height:1px;background:#E8D9B8;margin:16px 0 20px;"></div>
          <h1 style="font-size:24px;line-height:1.25;margin:0 0 6px;color:#0a0a0a;font-weight:700;">A Private Partnership Breakfast</h1>
          <div style="font-size:12px;color:#7a6748;letter-spacing:1px;text-transform:uppercase;">Invitation · {{brokerage_name}}</div>
        </td></tr>
        <tr><td style="padding:8px 40px 0;font-size:15px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 14px;">Dear <strong>{{contact_first_name}}</strong>,</p>
          <p style="margin:0 0 14px;">Following our recent conversations across the market, we'd like to formally invite the leadership of <strong>{{brokerage_name}}</strong> to a <strong>private breakfast at our Dubai office</strong>, hosted by <strong>{{owner_first_name}}</strong> and the JBJ Global Real Estate partnerships team.</p>
          <p style="margin:0 0 14px;">The morning is intentionally intimate — a small group of senior brokerage leaders, a market briefing, and a candid discussion about a long-term channel partnership. We'll share the current Q-pipeline, exclusive inventory routes, and the commission framework we offer to active partner brokerages.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 40px 8px;">
          <a href="mailto:{{reply_to}}?subject=RSVP%20%E2%80%94%20Breakfast%20Briefing%20%E2%80%94%20{{brokerage_name}}" style="display:inline-block;background:#0a0a0a;color:#FFFDF7;text-decoration:none;padding:15px 34px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.5px;border:1px solid #C9A86A;">RSVP — Reserve Our Seats →</a>
        </td></tr>
        <tr><td style="padding:18px 40px 0;font-size:14px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 12px;">Reply with your preferred week and how many seats to hold for {{brokerage_name}}, and we'll confirm the date, address, and parking by return email.</p>
          <div style="background:#FAF5EA;border:1px solid #E8D9B8;border-radius:10px;padding:14px 18px;font-size:13px;line-height:1.6;color:#0a0a0a;margin:18px 0 8px;">RSVP to <a href="mailto:{{reply_to}}" style="color:#0a0a0a;font-weight:600;">{{reply_to}}</a> with <a href="mailto:{{cc_email}}" style="color:#0a0a0a;font-weight:600;">{{cc_email}}</a> on CC.</div>
        </td></tr>
        <tr><td style="padding:24px 40px 36px;font-size:14px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:0 0 4px;">Warm regards,</p>
          <p style="margin:0;font-weight:700;">{{owner_first_name}}</p>
          <p style="margin:0;color:#7a6748;font-size:13px;">Head of Sales — Channel Partners</p>
          <p style="margin:0;color:#7a6748;font-size:13px;">{{from_name}}</p>
        </td></tr>
      </table>
      <div style="font-size:11px;color:#a8946a;margin-top:14px;letter-spacing:0.5px;">JBJ GLOBAL REAL ESTATE · Dubai, UAE</div>
    </td></tr>
  </table>
</body></html>$TPL$
)
ON CONFLICT (variant) DO NOTHING;