
-- 1) Refresh breakfast slots: deactivate old 12:30/13:30 slots, insert hourly 11:00–17:00 Dubai (UTC+4) for next 8 weeks (Tue + Thu)
UPDATE public.breakfast_slots SET is_active = false WHERE is_active = true;

DO $$
DECLARE
  d date;
  h int;
  iso timestamptz;
BEGIN
  FOR i IN 0..56 LOOP
    d := (current_date + i)::date;
    IF EXTRACT(DOW FROM d) IN (2, 4) THEN  -- Tuesday=2, Thursday=4
      FOR h IN 11..17 LOOP
        -- Dubai is UTC+4, no DST → store as UTC by subtracting 4h
        iso := ((d::text || ' ' || lpad(h::text,2,'0') || ':00:00+04')::timestamptz);
        IF iso > now() THEN
          INSERT INTO public.breakfast_slots (slot_at, capacity, is_active, notes)
          VALUES (iso, 6, true, 'Private partnership breakfast — JBJ Dubai office')
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 2) Replace the partnership intro template with a premium unified briefing + breakfast layout.
--    First unlock if it was locked, so the upsert works.
UPDATE public.crm_email_templates
SET locked_at = NULL
WHERE variant = 'brokerage_partnership_intro';

UPDATE public.crm_email_templates
SET
  subject = '{{project_name}} — Private Briefing & Breakfast for {{brokerage_name}}',
  html = $TPL$<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F7F2EA;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
<div style="background:linear-gradient(180deg,#FDFBF7 0%,#F7F2EA 100%);padding:40px 16px">
  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #B89555;border-radius:14px;padding:36px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B89555;font-weight:700;margin-bottom:6px">JBJ Global Real Estate</div>
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#1A1A1A99;margin-bottom:24px">Channel Partner — {{represented_developer_name}}</div>

    <p style="margin:0 0 16px;font-size:15px">Dear <strong>{{contact_first_name}}</strong> from <strong>{{brokerage_name}}</strong>,</p>

    <p style="margin:0 0 16px;font-size:14px">This is <strong>{{owner_first_name}}</strong> from <strong>JBJ Global Real Estate</strong>, channel partner for <strong>{{represented_developer_name}}</strong>.</p>

    <p style="margin:0 0 24px;font-size:14px">{{group_status_line}}</p>

    <div style="margin:24px 0;padding:20px 22px;background:#FDFBF7;border:1px solid #1A1A1A14;border-left:3px solid #B89555;border-radius:10px">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B89555;font-weight:700;margin-bottom:8px">Featured Project</div>
      <div style="font-size:20px;font-weight:600;color:#1A1A1A;margin-bottom:8px">{{project_name}}</div>
      <div style="font-size:14px;color:#1A1A1A;margin-bottom:14px">{{project_tagline}}</div>
      <a href="{{project_url}}" style="display:inline-block;padding:10px 20px;background:#1A1A1A;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">Open {{project_name}} e-catalogue →</a>
    </div>

    {{#if project_offer_html}}
    <div style="margin:20px 0;padding:16px 18px;background:#F7F2EA;border:1px solid #B89555;border-radius:8px;font-size:13px">{{project_offer_html}}</div>
    {{/if}}

    <div style="margin:28px 0;padding:24px;background:linear-gradient(135deg,#FDFBF7 0%,#EFE6D6 100%);border:1px solid #B89555;border-radius:12px">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#B89555;font-weight:700;margin-bottom:8px">Private Invitation</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:10px">Partnership Briefing & Breakfast</div>
      <p style="margin:0 0 14px;font-size:14px">I'd like to invite <strong>{{brokerage_name}}</strong> to a private breakfast at our Dubai office — agenda covers {{project_name}}, commissions, training and channel activation.</p>
      {{#if preferred_event_time_label}}
      <p style="margin:0 0 14px;font-size:13px"><strong>Suggested time:</strong> {{preferred_event_time_label}}</p>
      {{/if}}
      <p style="margin:0 0 16px;font-size:13px;color:#1A1A1A99">Pick any time slot from <strong>11:00 to 17:00</strong> Dubai time on Tuesdays or Thursdays.</p>
      {{#if booking_url}}
      <a href="{{booking_url}}" style="display:inline-block;padding:12px 24px;background:#B89555;color:#FFFFFF;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">RSVP & pick your slot →</a>
      {{/if}}
    </div>

    <p style="margin:20px 0 24px;font-size:14px">Could you also confirm whether <strong>{{brokerage_name}}</strong> is already registered with {{represented_developer_name}}? If not, we'll fast-track the registration on your behalf.</p>

    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1A1A1A14;font-size:13px">
      Warm regards,<br/>
      <strong>{{owner_first_name}}</strong><br/>
      <span style="color:#1A1A1A99">JBJ Global Real Estate · {{reply_to}}</span>
    </div>
  </div>
  <div style="max-width:640px;margin:16px auto 0;text-align:center;font-size:11px;color:#1A1A1A66">
    JBJ Global Real Estate · Channel Partner Activation
  </div>
</div>
</body></html>$TPL$,
  updated_at = now()
WHERE variant = 'brokerage_partnership_intro';
