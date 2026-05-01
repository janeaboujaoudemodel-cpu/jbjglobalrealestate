UPDATE public.crm_email_templates
SET html = REPLACE(
  html,
  '<a href="mailto:{{reply_to}}?subject=RSVP%20%E2%80%94%20Breakfast%20Briefing%20%E2%80%94%20{{brokerage_name}}" style="display:inline-block;background:#0a0a0a;color:#FFFDF7;text-decoration:none;padding:15px 34px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.5px;border:1px solid #C9A86A;">RSVP — Reserve Our Seats →</a>',
  '<a href="{{booking_url}}" style="display:inline-block;background:#B89555;color:#0a0a0a;text-decoration:none;padding:15px 34px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:1px solid #B89555;">Reserve Your Breakfast Time →</a><div style="margin-top:10px;font-size:12px;color:#7a6748;">or reply to <a href="mailto:{{reply_to}}?subject=RSVP%20%E2%80%94%20Breakfast%20Briefing%20%E2%80%94%20{{brokerage_name}}" style="color:#7a6748;text-decoration:underline;">{{reply_to}}</a></div>'
)
WHERE variant = 'brokerage_breakfast_invite';

UPDATE public.crm_email_templates
SET html = REPLACE(
  html,
  '<a href="mailto:{{reply_to}}?subject=Re%3A%20Breakfast%20Briefing%20%E2%80%94%20{{brokerage_name}}"',
  '<a href="{{booking_url}}" style="display:inline-block;background:#B89555;color:#0a0a0a;text-decoration:none;padding:14px 30px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:0.5px;border:1px solid #B89555;margin-bottom:10px;">Schedule the Partnership Briefing →</a><br/><a href="mailto:{{reply_to}}?subject=Re%3A%20Breakfast%20Briefing%20%E2%80%94%20{{brokerage_name}}"'
)
WHERE variant = 'brokerage_partnership_intro';