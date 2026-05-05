UPDATE crm_email_templates
SET html = $html$<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F7F2EA;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
<div style="background:#F7F2EA;padding:40px 16px">
  <div style="max-width:640px;margin:0 auto;background:#FDFBF7;border:1px solid #B89555;border-radius:14px;padding:36px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:6px">CITI Developer</div>
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#1A1A1A99;margin-bottom:24px">Sales &amp; Training · Private Breakfast Invitation</div>

    <p style="margin:0 0 16px;font-size:15px">Dear <strong>{{contact_first_name}}</strong>,</p>

    <p style="margin:0 0 16px;font-size:14px">On behalf of <strong>CITI Developer</strong>, I&rsquo;d like to invite <strong>{{brokerage_name}}</strong> to a private breakfast &amp; briefing — this is an exclusive invitation reserved for your company.</p>

    <div style="margin:24px 0;padding:22px 24px;background:#F7F2EA;border:1px solid #B89555;border-radius:12px">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Featured Project</div>
      <div style="font-size:20px;font-weight:600;color:#1A1A1A;margin-bottom:8px">{{project_name}}</div>
      <div style="font-size:14px;color:#1A1A1A;margin-bottom:16px">{{project_tagline}}</div>
      <a href="{{project_url}}" style="display:inline-block;padding:12px 24px;background:#1A1A1A;color:#FDFBF7;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;border:1px solid #1A1A1A">Open {{project_name}} e-catalogue &rarr;</a>
    </div>

    {{#if project_offer_html}}
    <div style="margin:20px 0;padding:18px 22px;background:#FDFBF7;border:1px solid #B89555;border-radius:10px;font-size:13px">{{project_offer_html}}</div>
    {{/if}}

    <div style="margin:24px 0;padding:20px 22px;background:#F7F2EA;border:1px solid #B89555;border-radius:10px;font-size:14px">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:10px">Please Confirm</div>
      <ul style="margin:0;padding-left:18px">
        <li style="margin-bottom:6px">The <strong>names of attendees</strong> joining from {{brokerage_name}}.</li>
        <li style="margin-bottom:6px">The <strong>number of brokers</strong> attending and the <strong>total members</strong> joining the breakfast.</li>
        <li style="margin-bottom:6px">Reply by email with the <strong>date and time that suits you</strong> — any slot from <strong>Monday to Friday</strong>, between <strong>11:00 and 17:00</strong> Dubai time.</li>
        <li>Please also book directly from the calendar and reply back with the slot you have selected.</li>
      </ul>
    </div>

    {{#if booking_url}}
    <div style="text-align:center;margin:24px 0">
      <a href="{{booking_url}}" style="display:inline-block;padding:14px 30px;background:#1A1A1A;color:#FDFBF7;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.3px;border:1px solid #1A1A1A">Book your slot on the calendar &rarr;</a>
    </div>
    {{/if}}

    <p style="margin:18px 0;font-size:14px">If you&rsquo;d like, share the best WhatsApp number for <strong>{{brokerage_name}}</strong> — we&rsquo;ll add the right contact to our private channel for breakfast logistics and fast-track your CITI Developer registration if not already in place.</p>

    <p style="margin:18px 0;font-size:13px;color:#1A1A1A99"><em>Please disregard this message if {{brokerage_name}} is already registered with CITI Developer, already part of our active WhatsApp group, or actively selling with us.</em></p>

    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #B8955540;font-size:13px">
      Warm regards,<br/>
      <strong>{{owner_first_name}}</strong><br/>
      <span style="color:#1A1A1A">CITI Developer</span><br/>
      <span style="color:#1A1A1A99">Sales &amp; Training · Channel Partner Activation</span><br/>
      <a href="mailto:{{reply_to}}" style="color:#1A1A1A;text-decoration:none;border-bottom:1px solid #B89555">{{reply_to}}</a>
    </div>
  </div>
  <div style="max-width:640px;margin:16px auto 0;text-align:center;font-size:11px;color:#1A1A1A66">
    CITI Developer · Sales &amp; Training · Channel Partner Activation
  </div>
</div>
</body></html>$html$
WHERE variant = 'brokerage_breakfast_invite';

UPDATE crm_email_templates
SET html = $html$<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#F7F2EA;font-family:Inter,-apple-system,Segoe UI,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
<div style="background:#F7F2EA;padding:40px 16px">
  <div style="max-width:640px;margin:0 auto;background:#FDFBF7;border:1px solid #B89555;border-radius:14px;padding:36px 40px;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:6px">CITI Developer</div>
    <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#1A1A1A99;margin-bottom:24px">Sales &amp; Training · Channel Partner Activation</div>

    <p style="margin:0 0 16px;font-size:15px">Dear <strong>{{contact_first_name}}</strong> from <strong>{{brokerage_name}}</strong>,</p>

    <p style="margin:0 0 16px;font-size:14px">This is <strong>{{owner_first_name}}</strong> from <strong>CITI Developer</strong>, Sales &amp; Training department.</p>

    <p style="margin:0 0 24px;font-size:14px">We&rsquo;d love to introduce <strong>CITI Developer</strong> to your team and confirm whether <strong>{{brokerage_name}}</strong> is already registered with us — so we can fast-track activation and add you to our private WhatsApp channel for the breakfast invitation.</p>

    <div style="margin:24px 0;padding:22px 24px;background:#F7F2EA;border:1px solid #B89555;border-radius:12px">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Featured Project</div>
      <div style="font-size:22px;font-weight:600;color:#1A1A1A;margin-bottom:8px">{{project_name}}</div>
      <div style="font-size:14px;color:#1A1A1A;margin-bottom:18px">{{project_tagline}}</div>
      <a href="{{project_url}}" style="display:inline-block;padding:13px 26px;background:#1A1A1A;color:#FDFBF7;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;letter-spacing:0.3px;border:1px solid #1A1A1A">Open {{project_name}} e-catalogue &rarr;</a>
    </div>

    {{#if project_offer_html}}
    <div style="margin:20px 0;padding:18px 22px;background:#FDFBF7;border:1px solid #B89555;border-radius:10px;font-size:13px">{{project_offer_html}}</div>
    {{/if}}

    <div style="margin:28px 0;padding:26px;background:#FDFBF7;border:1px solid #B89555;border-radius:14px">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Private Invitation</div>
      <div style="font-size:18px;font-weight:600;margin-bottom:10px">Partnership Briefing &amp; Breakfast</div>
      <p style="margin:0 0 14px;font-size:14px">I&rsquo;d like to invite <strong>{{brokerage_name}}</strong> to a private breakfast at our Dubai office — exclusive for your company. Agenda covers <strong>{{project_name}}</strong>, commissions, sales training and channel partner activation.</p>

      <div style="margin:14px 0;padding:16px 18px;background:#F7F2EA;border:1px solid #B89555;border-radius:10px;font-size:13px">
        <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#1A1A1A;font-weight:700;margin-bottom:8px">Please Confirm</div>
        <ul style="margin:0;padding-left:18px">
          <li style="margin-bottom:6px">The <strong>names of attendees</strong> from {{brokerage_name}}.</li>
          <li style="margin-bottom:6px">The <strong>number of brokers</strong> attending and the <strong>total members</strong> joining the breakfast.</li>
          <li style="margin-bottom:6px">Reply by email with the <strong>date and time that suits you</strong> — any slot from <strong>Monday to Friday</strong>, between <strong>11:00 and 17:00</strong> Dubai time.</li>
          <li>Please also book directly from the calendar and reply back with the slot you have selected.</li>
        </ul>
      </div>

      {{#if booking_url}}
      <div style="text-align:center;margin-top:18px">
        <a href="{{booking_url}}" style="display:inline-block;padding:13px 28px;background:#1A1A1A;color:#FDFBF7;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.3px;border:1px solid #1A1A1A">Book your slot on the calendar &rarr;</a>
      </div>
      {{/if}}
    </div>

    <p style="margin:20px 0 14px;font-size:14px">Could you also confirm whether <strong>{{brokerage_name}}</strong> is already registered with <strong>CITI Developer</strong>? If not, we&rsquo;ll fast-track your registration and add the right contact to our WhatsApp group for breakfast logistics.</p>

    <p style="margin:14px 0 24px;font-size:13px;color:#1A1A1A99"><em>Please disregard this message if {{brokerage_name}} is already registered with CITI Developer, already part of our active WhatsApp group, or actively selling with us.</em></p>

    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #B8955540;font-size:13px">
      Warm regards,<br/>
      <strong>{{owner_first_name}}</strong><br/>
      <span style="color:#1A1A1A">CITI Developer</span><br/>
      <span style="color:#1A1A1A99">Sales &amp; Training · Channel Partner Activation</span><br/>
      <a href="mailto:{{reply_to}}" style="color:#1A1A1A;text-decoration:none;border-bottom:1px solid #B89555">{{reply_to}}</a>
    </div>
  </div>
  <div style="max-width:640px;margin:16px auto 0;text-align:center;font-size:11px;color:#1A1A1A66">
    CITI Developer · Sales &amp; Training · Channel Partner Activation
  </div>
</div>
</body></html>$html$
WHERE variant = 'brokerage_partnership_intro';
