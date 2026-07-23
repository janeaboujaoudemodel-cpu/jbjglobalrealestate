UPDATE public.crm_email_templates
SET html = $email$<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
a{color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important}
.citi-booking-cta{background:#064E3B;background-image:linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%) !important;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;border-color:#064E3B !important}
.citi-tile{color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important}
.amra-link{color:#0a0a0a !important;-webkit-text-fill-color:#0a0a0a !important;text-decoration:underline;text-decoration-color:#B89555}
@media only screen and (max-width:520px){.citi-outer{padding:16px 6px !important}.citi-card{padding:20px 14px !important}.citi-footer-cell{font-size:10px !important;padding:8px 4px !important}}
</style></head><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.55">
<div class="citi-outer" style="background:#FDFBF7;padding:28px 12px">
<div class="citi-card" style="max-width:600px;margin:0 auto;background:#F7F2EA;border:1px solid #B89555;border-radius:16px;padding:26px">
<div style="text-align:center;padding:2px 0 14px;border-bottom:1px solid #B89555;margin-bottom:16px">
<img src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/email-assets/brand/citi-developers-gold.png" alt="CITI Developers" width="170" style="max-width:170px;height:auto;display:inline-block;border:0"/>
<div style="margin-top:8px;font-size:10.5px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A">Sales &amp; Training Department</div>
</div>
<p style="margin:0 0 10px;font-size:14px">Dear <strong>{{brokerage_name}}</strong> team,</p>
<p style="margin:0 0 10px;font-size:13.5px">This is <strong>Jane Bou Jaoude</strong> from <strong>CITI Developers</strong>, Sales &amp; Training Department. It would be a pleasure to introduce <strong>CITI Developers</strong> to <strong>{{brokerage_name}}</strong> and invite your leadership to a private briefing at our Dubai Sales &amp; Experience Center.</p>
<p style="margin:0 0 10px;font-size:13.5px">Could you kindly confirm whether <strong>{{brokerage_name}}</strong> is already <strong>registered with CITI Developers</strong>? If not, please share the best contact email so our Channel Partner Department can reach {{brokerage_name}} directly and share the required registration documents.</p>
<p style="margin:0 0 12px;font-size:13.5px">If your team already runs an internal <strong>WhatsApp group</strong> for project updates but it is <strong>not updated daily</strong>, kindly add <strong>Jane Bou Jaoude</strong> on <strong>{{developer_phone_display}}</strong> &mdash; or, if easier, create a fresh dedicated group with our team. If {{brokerage_name}} does <strong>not currently run a WhatsApp group</strong>, we would be glad if you set one up so we can keep you informed on launches, inventory and commissions.</p>
<p style="margin:0 0 16px;font-size:13.5px">Featured project: <a href="https://citideveloper.com/e-catalogue/amra" target="_blank" rel="noopener" class="amra-link"><strong>AMRA</strong> &mdash; open the e-catalogue &rarr;</a></p>
{{#if booking_url}}<div style="margin:0 0 14px;text-align:center">
<a href="{{booking_url}}" target="_blank" rel="noopener" class="citi-booking-cta" style="display:inline-block;padding:12px 24px;background:#064E3B;background-image:linear-gradient(135deg,#064E3B 0%,#042c1c 70%,#000000 100%);color:#FFFFFF;text-decoration:none;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:0.3px;border:1px solid #064E3B">Book a slot on Google Calendar &rarr;</a>
<div style="font-size:11.5px;color:#4B5D55;margin-top:6px">Pick a time that suits your team &mdash; the invite lands directly in our calendar.</div>
</div>{{/if}}
<div style="text-align:center;margin:8px 0 4px;font-size:13px;color:#1A1A1A;line-height:1.6">
<div style="font-style:italic">Looking forward to a long-lasting partnership.</div>
<div style="margin-top:2px">&mdash; Jane Bou Jaoude</div>
</div>
<div style="margin-top:16px;padding-top:14px;border-top:1px solid #B89555">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:6px 0;margin:2px 0 0;table-layout:fixed"><tr>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:middle"><a href="{{developer_website}}" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:9px 6px;background:#FDFBF7;color:#1A1A1A;text-decoration:none;border-radius:8px;font-size:10.5px;font-weight:700;border:1px solid #B89555;text-align:center;white-space:nowrap;line-height:1.2">Website</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:middle"><a href="{{developer_map}}" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:9px 6px;background:#FDFBF7;color:#1A1A1A;text-decoration:none;border-radius:8px;font-size:10.5px;font-weight:700;border:1px solid #B89555;text-align:center;white-space:nowrap;line-height:1.2">Visit office</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:middle"><a href="{{developer_phone_tel}}" class="citi-tile" style="display:block;padding:9px 6px;background:#FDFBF7;color:#1A1A1A;text-decoration:none;border-radius:8px;font-size:10.5px;font-weight:700;border:1px solid #B89555;text-align:center;white-space:nowrap;line-height:1.2" data-no-link-tracking="true">Call us</a></td>
<td class="citi-footer-cell" width="25%" style="width:25%;vertical-align:middle"><a href="{{whatsapp_url}}" target="_blank" rel="noopener" class="citi-tile" style="display:block;padding:9px 6px;background:#FDFBF7;color:#1A1A1A;text-decoration:none;border-radius:8px;font-size:10.5px;font-weight:700;border:1px solid #B89555;text-align:center;white-space:nowrap;line-height:1.2" data-no-link-tracking="true">WhatsApp</a></td>
</tr></table>
</div>
</div></div></body></html>$email$,
    updated_at = now()
WHERE variant = 'brokerage_partnership_intro';