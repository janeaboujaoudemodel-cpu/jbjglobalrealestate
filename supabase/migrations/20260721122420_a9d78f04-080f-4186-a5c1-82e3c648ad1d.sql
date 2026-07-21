
UPDATE public.crm_email_templates
SET html = $HTML$<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
.citi-cta{transition:background-color 120ms ease,box-shadow 120ms ease}
.citi-cta:hover{background-color:#EFE6D6 !important}
.citi-tile{transition:background-color 120ms ease}
.citi-tile:hover{background-color:#F8F3E9 !important}
a{color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important}
@media only screen and (max-width:480px){.citi-outer{padding:24px 8px !important}.citi-card{padding:22px 16px !important}.citi-footer-cell{display:block !important;width:100% !important;padding:4px 0 !important}}
</style></head><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
<div class="citi-outer" style="background:#FDFBF7;padding:40px 16px">
<div class="citi-card" style="max-width:640px;margin:0 auto;background:#F7F2EA;border:1px solid #B89555;border-radius:16px;padding:36px">
<div style="text-align:center;padding:16px 0 22px;border-bottom:1px solid #B89555;margin-bottom:24px">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png" alt="CITI Developers" width="190" style="max-width:190px;height:auto;display:inline-block;border:0"/>
<div style="margin-top:10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A">Sales &amp; Training Department</div>
</div>
<p style="margin:0 0 14px;font-size:15px">Dear <strong>{{brokerage_name}}</strong> team,</p>
<p style="margin:0 0 14px;font-size:14px">This is <strong>Jane</strong> from <strong>CITI Developers</strong>, Sales &amp; Training Department. It would be a pleasure to introduce <strong>CITI Developers</strong> to <strong>{{brokerage_name}}</strong> and to invite your leadership to a private briefing at our Dubai Sales &amp; Experience Center.</p>
<p style="margin:0 0 18px;font-size:14px">Could you kindly confirm whether <strong>{{brokerage_name}}</strong> is already <strong>registered with CITI Developers</strong>? If not, please share the best contact email so our Channel Partner Department can reach <strong>{{brokerage_name}}</strong> directly and share the required registration documents.</p>
<p style="margin:0 0 18px;font-size:14px">If your team runs an internal <strong>WhatsApp group</strong> for project updates, kindly add <strong>+971 54 716 7107</strong> so we can keep {{brokerage_name}} informed on launches, inventory and commissions — otherwise we will happily create a dedicated group for your team.</p>
<div style="margin:24px 0;padding:28px 24px;background:#F7F2EA;border:1px solid #B89555;border-radius:14px;text-align:center">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Featured Project</div>
<div style="font-size:26px;font-weight:600;color:#1A1A1A;margin-bottom:8px;letter-spacing:0.5px">AMRA</div>
<div style="font-size:14px;color:#1A1A1A;margin:0 auto 18px;max-width:460px;line-height:1.6">Wellness-led beachfront resort residences in Umm Al Quwain — our current launch focus.</div>
<a href="https://citideveloper.com/e-catalogue/amra" target="_blank" rel="noopener" class="citi-cta" style="display:inline-block;padding:14px 28px;background:#EFE6D6;color:#1A1A1A;text-decoration:none;border-radius:10px;font-size:13px;font-weight:600;letter-spacing:0.3px;border:1px solid #B89555">Open AMRA E-Catalogue &rarr;</a>
</div>
<div style="margin:0 0 24px;text-align:center">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:10px">Book a private briefing</div>
<a href="{{booking_url}}" target="_blank" rel="noopener" class="citi-cta" style="display:inline-block;padding:12px 24px;background:#064E3B;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:0.3px;border:1px solid #064E3B">Book a slot on Google Calendar &rarr;</a>
<div style="font-size:12px;color:#4B5D55;margin-top:8px">Pick a time that suits your team — the invite lands directly in our calendar.</div>
</div>
<div style="text-align:center;margin:18px 0 6px;font-size:13.5px;color:#1A1A1A;line-height:1.7">
<div style="font-style:italic">Looking forward to a long-lasting partnership.</div>
<div style="margin-top:4px">&mdash; Jane</div>
</div>
<div style="margin-top:26px;padding-top:20px;border-top:1px solid #B89555">
<div style="text-align:center;margin-bottom:14px">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png" alt="CITI Developers" width="160" style="max-width:160px;height:auto;display:inline-block;border:0;opacity:0.95"/>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:6px 0;margin:10px 0 16px;table-layout:fixed"><tr>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:top"><a href="https://www.citidevelopers.com" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:8px 4px;background:#FDFBF7;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center;white-space:nowrap">Website</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:top"><a href="https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:8px 4px;background:#FDFBF7;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center;white-space:nowrap">Visit our office</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:top"><a href="tel:+971547167107" class="citi-tile" style="display:block;padding:8px 4px;background:#FDFBF7;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center;white-space:nowrap" data-no-link-tracking="true">Call us</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:top"><a href="https://wa.me/971547167107" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:8px 4px;background:#FDFBF7;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center;white-space:nowrap" data-no-link-tracking="true">WhatsApp</a></td>
</tr></table>
<div style="text-align:center;font-size:13px;color:#1A1A1A;line-height:1.7">
<div><strong>Jane</strong> &middot; Sales &amp; Training Department &middot; CITI Developers</div>
</div>
</div>
</div></div></body></html>$HTML$
WHERE variant = 'brokerage_partnership_intro';

UPDATE public.crm_email_templates
SET html = $HTML$<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
.citi-cta{transition:background-color 120ms ease}.citi-cta:hover{background-color:#EFE6D6 !important}
.citi-tile{transition:background-color 120ms ease}.citi-tile:hover{background-color:#F8F3E9 !important}
a{color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important}
@media only screen and (max-width:480px){.citi-outer{padding:24px 8px !important}.citi-card{padding:22px 16px !important}.citi-footer-cell{display:block !important;width:100% !important;padding:4px 0 !important}}
</style></head><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
<div class="citi-outer" style="background:#FDFBF7;padding:32px 16px">
<div class="citi-card" style="max-width:640px;margin:0 auto;background:#F7F2EA;border:1px solid #B89555;border-radius:16px;padding:30px">
<div style="text-align:center;padding:16px 0 22px;border-bottom:1px solid #B89555;margin-bottom:24px">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png" alt="CITI Developers" width="190" style="max-width:190px;height:auto;display:inline-block;border:0"/>
<div style="margin-top:10px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A">Private Breakfast Briefing</div>
</div>
<p style="margin:0 0 14px;font-size:15px">Dear <strong>{{brokerage_name}}</strong> team,</p>
<p style="margin:0 0 14px;font-size:14px">This is <strong>Jane</strong> from <strong>CITI Developers</strong>, Sales &amp; Training Department. It would be a pleasure to host <strong>{{brokerage_name}}</strong> for a private breakfast briefing at our Dubai Sales &amp; Experience Center.</p>
<p style="margin:0 0 18px;font-size:14px">{{group_status_line}}</p>
<div style="margin:24px 0;padding:26px 22px;background:#FDFBF7;border:1px solid #B89555;border-radius:14px;text-align:center">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Private Invitation</div>
<div style="font-size:18px;font-weight:600;color:#1A1A1A;margin-bottom:14px">Partnership Briefing &amp; Breakfast at CITI Developers</div>
<p style="margin:0 0 18px;font-size:14px;color:#1A1A1A;line-height:1.6;text-align:left">We would like to host <strong>{{brokerage_name}}</strong> for a private breakfast at our Dubai Sales &amp; Experience Center. The agenda covers <strong>AMRA</strong>, commissions, sales training and channel partner activation. Full project materials are in the <a href="https://citideveloper.com/e-catalogue/amra" target="_blank" rel="noopener" style="color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:underline">AMRA E-Catalogue</a>.</p>
<div style="margin:6px 0 0"><a href="{{booking_url}}" target="_blank" rel="noopener" class="citi-cta" style="display:inline-block;padding:14px 30px;background:#064E3B;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;text-decoration:none;border-radius:12px;font-size:13px;font-weight:700;letter-spacing:0.3px;border:1px solid #064E3B">Book a slot on Google Calendar &rarr;</a></div>
</div>
<div style="margin:24px 0;font-size:13.5px;color:#1A1A1A;line-height:1.65">
<div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;font-weight:700;margin-bottom:10px">Before we lock your seats</div>
<p style="margin:0 0 10px">Kindly reply with the following so our team can register <strong>{{brokerage_name}}</strong> on the official CITI Developers guest list:</p>
<ul style="margin:0 0 10px;padding-left:22px">
<li>Whether your agency is already <strong>registered with CITI Developers</strong>.</li>
<li>Any <strong>existing WhatsApp group</strong> your team is in with us — or a number we can add to a new one.</li>
<li>The <strong>date &amp; time slot</strong> you wish to confirm (Mon–Fri, 11:00–17:00 GST).</li>
<li>The <strong>full list of attendees</strong> — name, mobile, and email for each broker.</li>
</ul>
<p style="margin:0;color:#1A1A1A;font-size:13px">A confirmation tick is required on the booking page acknowledging the <strong>48-hour cancellation notice</strong>. Each agency is responsible for informing us at least two days in advance of any change.</p>
</div>
<div style="text-align:center;margin:18px 0 6px;font-size:13.5px;color:#1A1A1A;line-height:1.7">
<div style="font-style:italic">Looking forward to a long-lasting partnership.</div>
<div style="margin-top:4px">&mdash; Jane</div>
</div>
<div style="margin-top:26px;padding-top:20px;border-top:1px solid #B89555">
<div style="text-align:center;margin-bottom:14px">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png" alt="CITI Developers" width="160" style="max-width:160px;height:auto;display:inline-block;border:0;opacity:0.95"/>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:6px 0;margin:10px 0 16px;table-layout:fixed"><tr>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:top"><a href="https://www.citidevelopers.com" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:8px 4px;background:#FDFBF7;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center;white-space:nowrap">Website</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:top"><a href="https://maps.app.goo.gl/oK1Ts4Y3bsq8m3u18" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:8px 4px;background:#FDFBF7;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center;white-space:nowrap">Visit our office</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:top"><a href="tel:+971547167107" class="citi-tile" style="display:block;padding:8px 4px;background:#FDFBF7;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center;white-space:nowrap" data-no-link-tracking="true">Call us</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:top"><a href="https://wa.me/971547167107" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:8px 4px;background:#FDFBF7;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;text-decoration:none;border-radius:8px;font-size:12px;font-weight:600;border:1px solid #B89555;text-align:center;white-space:nowrap" data-no-link-tracking="true">WhatsApp</a></td>
</tr></table>
<div style="text-align:center;font-size:13px;color:#1A1A1A;line-height:1.7">
<div><strong>Jane</strong> &middot; Sales &amp; Training Department &middot; CITI Developers</div>
</div>
</div>
</div></div></body></html>$HTML$
WHERE variant = 'brokerage_breakfast_invite';
