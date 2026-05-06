UPDATE public.crm_email_templates
SET html = $HTML$<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
  .jbj-cta { transition: background-color 120ms ease, transform 120ms ease, box-shadow 120ms ease; }
  .jbj-cta:hover { background-color:#EFE6D6 !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(184,149,85,0.18); }
  .jbj-tile { transition: background-color 120ms ease, transform 120ms ease; }
  .jbj-tile:hover { background-color:#EFE6D6 !important; transform: translateY(-1px); }
  a { color:inherit; }
</style></head><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
<div style="background:#FDFBF7;padding:32px 16px">
<div style="max-width:640px;margin:0 auto;background:#F7F2EA;border:1px solid #B89555;border-radius:16px;padding:30px">
<div style="text-align:center;padding:16px 0 20px;border-bottom:1px solid #B89555;margin-bottom:24px">
  <img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png" alt="CITI DEVELOPERS" width="200" style="max-width:200px;height:auto;display:inline-block;border:0" />
  <div style="margin-top:12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A">Sales &amp; Channel Partner Activation</div>
</div>
<p style="margin:0 0 14px;font-size:15px">Dear <strong>{{salutation}}</strong>,</p>
<p style="margin:0 0 14px;font-size:14px">On behalf of <strong>CITI DEVELOPERS</strong>, I'd like to personally invite <strong>{{brokerage_name}}</strong> to a private breakfast briefing at our Dubai Sales &amp; Experience Center.</p>
<p style="margin:0 0 18px;font-size:14px">{{group_status_line}}</p>
<div style="margin:24px 0;padding:26px 22px;background:#FDFBF7;border:1px solid #B89555;border-radius:14px;text-align:center">
  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Private Invitation</div>
  <div style="font-size:18px;font-weight:600;color:#1A1A1A;margin-bottom:14px">Partnership Briefing &amp; Breakfast at CITI DEVELOPERS</div>
  <p style="margin:0 0 18px;font-size:14px;color:#1A1A1A;line-height:1.6;text-align:left">We'd like to host <strong>{{brokerage_name}}</strong> for a private breakfast at our Dubai Sales &amp; Experience Center. Agenda covers <strong>{{project_name}}</strong>, commissions, sales training and channel partner activation.</p>
  <a href="{{booking_url}}" target="_blank" rel="noopener" class="jbj-tile" style="display:block;margin:18px auto 14px;max-width:260px;background:#F7F2EA;border:1px solid #B89555;border-radius:14px;overflow:hidden;text-align:center;text-decoration:none;color:#1A1A1A">
    <div style="background:#1A1A1A;color:#FDFBF7;padding:9px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:600">Mon &mdash; Fri &middot; 11:00&ndash;17:00 GST</div>
    <div style="padding:18px 12px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#1A1A1A">Breakfast &amp; Briefing</div>
      <div style="margin:10px 0 6px;line-height:0"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B89555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16" rx="2"></rect><path d="M3 9h18M8 3v3M16 3v3"></path></svg></div>
      <div style="font-size:13px;color:#1A1A1A;font-weight:600">Pick a slot that suits you</div>
    </div>
  </a>
  <div style="margin:6px 0 0">
    <a href="{{booking_url}}" target="_blank" rel="noopener" class="jbj-cta" style="display:inline-block;padding:14px 30px;background:#F7F2EA;color:#1A1A1A;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;letter-spacing:0.3px;border:1px solid #B89555">Reserve a slot &rarr;</a>
  </div>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border-collapse:collapse;margin:24px 0"><tr><td style="width:100%;padding:0">
<div style="padding:22px 22px;background:#FDFBF7;border:1px solid #B89555;border-radius:14px;font-size:13.5px;color:#1A1A1A;line-height:1.65">
  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:10px">Before we lock your seats</div>
  <p style="margin:0 0 10px">Kindly reply to this email with the following details so our team can register <strong>{{brokerage_name}}</strong> on the official guest list:</p>
  <ul style="margin:0 0 10px;padding-left:22px">
    <li style="margin-bottom:4px">Whether your agency is already <strong>registered with CITI DEVELOPERS</strong>.</li>
    <li style="margin-bottom:4px">Any <strong>existing WhatsApp group</strong> your team is already in with us.</li>
    <li style="margin-bottom:4px">The <strong>date &amp; time slot</strong> you wish to confirm (Mon&ndash;Fri, 11:00&ndash;17:00 GST).</li>
    <li style="margin-bottom:0">The <strong>full list of attendees</strong> &mdash; name, mobile, and email for each broker &mdash; so we can register them on the guest list.</li>
  </ul>
  <p style="margin:0;color:#1A1A1A;font-size:13px">This is a private breakfast hosted exclusively for your company. Kindly let us know at least <strong>48 hours in advance</strong> if you need to reschedule or cancel. Thank you for considering this partnership &mdash; we look forward to welcoming the <strong>{{brokerage_name}}</strong> team to our office and to a long, successful collaboration with CITI DEVELOPERS.</p>
</div>
</td></tr></table>
<div style="text-align:center;margin:22px 0 6px;font-size:13.5px;color:#1A1A1A;line-height:1.7">
  <div style="font-style:italic">Looking forward to a long-lasting partnership.</div>
  <div style="margin-top:4px">&mdash; {{owner_first_name}} Bou Jaoude, <strong>CITI DEVELOPERS</strong></div>
</div>
<div style="margin-top:22px;padding-top:20px;border-top:1px solid #B89555">
  <div style="text-align:center;padding:14px 0 18px">
    <img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png" alt="CITI DEVELOPERS" width="200" style="max-width:200px;height:auto;display:inline-block;border:0" />
    <div style="margin-top:10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A">Sales &amp; Channel Partner Activation</div>
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:8px 0;margin:14px 0 18px">
    <tr>
      <td width="25%" style="width:25%;vertical-align:top">
        <a href="https://www.citidevelopers.com" target="_blank" rel="noopener" class="jbj-tile" style="display:block;padding:10px 6px;background:#FDFBF7;color:#1A1A1A;text-decoration:none;border-radius:10px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B89555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg><span style="border-bottom:1px solid #B89555">Website</span></a>
      </td>
      <td width="25%" style="width:25%;vertical-align:top">
        <a href="https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18" target="_blank" rel="noopener" class="jbj-tile" style="display:block;padding:10px 6px;background:#FDFBF7;color:#1A1A1A;text-decoration:none;border-radius:10px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B89555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg><span style="border-bottom:1px solid #B89555">Visit office</span></a>
      </td>
      <td width="25%" style="width:25%;vertical-align:top">
        <a href="tel:+971547167107" class="jbj-tile" style="display:block;padding:10px 6px;background:#FDFBF7;color:#1A1A1A;text-decoration:none;border-radius:10px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B89555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg><span style="border-bottom:1px solid #B89555">Call us</span></a>
      </td>
      <td width="25%" style="width:25%;vertical-align:top">
        <a href="https://wa.me/971547167107" target="_blank" rel="noopener" class="jbj-tile" style="display:block;padding:10px 6px;background:#FDFBF7;color:#1A1A1A;text-decoration:none;border-radius:10px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B89555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/><path d="M9 10c.5 1.5 1.5 2.5 3 3"/></svg><span style="border-bottom:1px solid #B89555">WhatsApp</span></a>
      </td>
    </tr>
  </table>
  <div style="text-align:center;font-size:13px;color:#1A1A1A;line-height:1.7;margin-top:14px">
    <div><strong>{{owner_first_name}} Bou Jaoude</strong> &middot; CITI DEVELOPERS</div>
    <div><a href="mailto:jane@citideveloper.com" style="color:#1A1A1A;text-decoration:none;border-bottom:1px solid #B89555">jane@citideveloper.com</a></div>
    <div style="font-size:12px;color:#1A1A1A;margin-top:8px">Sales &amp; Experience Center: Villa 1 &amp; 2 &mdash; 625 Jumeira St, Umm Suqeim 1, Dubai</div>
  </div>
</div>
</div></div></body></html>$HTML$
WHERE variant = 'brokerage_breakfast_invite';