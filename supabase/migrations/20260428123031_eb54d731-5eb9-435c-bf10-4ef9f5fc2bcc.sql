
CREATE TABLE IF NOT EXISTS public.crm_email_templates (
  variant text PRIMARY KEY,
  subject text NOT NULL,
  html text NOT NULL,
  locked_at timestamptz,
  locked_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.crm_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_select_email_templates" ON public.crm_email_templates
  FOR SELECT TO authenticated USING (is_jbj_owner(auth.uid()));
CREATE POLICY "owner_insert_email_templates" ON public.crm_email_templates
  FOR INSERT TO authenticated WITH CHECK (is_jbj_owner(auth.uid()));
CREATE POLICY "owner_update_email_templates" ON public.crm_email_templates
  FOR UPDATE TO authenticated USING (is_jbj_owner(auth.uid())) WITH CHECK (is_jbj_owner(auth.uid()));

CREATE TRIGGER trg_crm_email_templates_upd
BEFORE UPDATE ON public.crm_email_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the two variants. {{developer_name}} and {{drive_url}} are substituted at send time.
INSERT INTO public.crm_email_templates (variant, subject, html) VALUES
('developer_registration',
 'Broker Registration Request — JBJ Global Real Estate',
$HTML$<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF5EA;font-family:Inter,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;padding:32px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFDF7;border:1px solid #E8D9B8;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:36px 40px 18px;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A86A;font-weight:700;">JBJ Global Real Estate</div>
          <div style="height:1px;background:#E8D9B8;margin:16px 0 20px;"></div>
          <h1 style="font-size:24px;line-height:1.25;margin:0 0 6px;color:#0a0a0a;font-weight:700;">Broker Registration Request</h1>
          <div style="font-size:12px;color:#7a6748;letter-spacing:1px;text-transform:uppercase;">RERA Licensed Brokerage · Dubai, UAE</div>
        </td></tr>
        <tr><td style="padding:8px 40px 0;font-size:15px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 14px;">Dear <strong>{{developer_name}}</strong> Broker Relations Team,</p>
          <p style="margin:0 0 14px;">We at <strong>JBJ GLOBAL REAL ESTATE</strong> would like to formally request broker registration with {{developer_name}}. Our brokerage is fully RERA-licensed in Dubai and actively placing investors across the UAE prime market.</p>
          <p style="margin:0 0 18px;">Please find our complete document pack — Trade License, RERA Card, Authorised Signatory ID, MOU draft and broker profile — at the secure link below.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 40px 8px;">
          <a href="{{drive_url}}" style="display:inline-block;background:#0a0a0a;color:#FFFDF7;text-decoration:none;padding:15px 34px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.5px;border:1px solid #C9A86A;">Open Document Pack →</a>
        </td></tr>
        <tr><td style="padding:18px 40px 0;font-size:14px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 12px;">Kindly share your registration form, NOC requirements, agency code and commission structure to complete onboarding.</p>
          <div style="background:#FAF5EA;border:1px solid #E8D9B8;border-radius:10px;padding:14px 18px;font-size:13px;line-height:1.6;color:#0a0a0a;margin:18px 0 8px;">For any questions, please reply to <a href="mailto:contact@jbj.ae" style="color:#0a0a0a;font-weight:600;">contact@jbj.ae</a> with <a href="mailto:infoo.jane@gmail.com" style="color:#0a0a0a;font-weight:600;">infoo.jane@gmail.com</a> on CC.</div>
        </td></tr>
        <tr><td style="padding:24px 40px 36px;font-size:14px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 4px;">Warm regards,</p>
          <p style="margin:0;font-weight:700;color:#0a0a0a;">JBJ Team</p>
          <p style="margin:2px 0 0;font-size:12px;color:#7a6748;letter-spacing:1px;text-transform:uppercase;">JBJ Global Real Estate</p>
          <div style="height:1px;background:#E8D9B8;margin:22px 0 14px;"></div>
          <div style="font-size:11px;color:#7a6748;text-align:center;letter-spacing:1px;">RERA Licensed · Dubai, UAE · jbj.ae</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>$HTML$),
('developer_confirm_registered',
 'Confirming Active Broker Registration — JBJ Global Real Estate',
$HTML$<!doctype html>
<html><body style="margin:0;padding:0;background:#FAF5EA;font-family:Inter,Helvetica,Arial,sans-serif;color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF5EA;padding:32px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFDF7;border:1px solid #E8D9B8;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:36px 40px 18px;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A86A;font-weight:700;">JBJ Global Real Estate</div>
          <div style="height:1px;background:#E8D9B8;margin:16px 0 20px;"></div>
          <h1 style="font-size:24px;line-height:1.25;margin:0 0 6px;color:#0a0a0a;font-weight:700;">Registration Confirmation Request</h1>
          <div style="font-size:12px;color:#7a6748;letter-spacing:1px;text-transform:uppercase;">RERA Licensed Brokerage · Dubai, UAE</div>
        </td></tr>
        <tr><td style="padding:8px 40px 0;font-size:15px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 14px;">Dear <strong>{{developer_name}}</strong> Broker Relations Team,</p>
          <p style="margin:0 0 14px;">Could you kindly confirm that <strong>JBJ GLOBAL REAL ESTATE</strong> is currently active and registered as a broker partner with {{developer_name}}?</p>
          <p style="margin:0 0 14px;">If our agency code, commission tier or any onboarding documents need renewal, please let us know what is required and we will action it promptly.</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 40px 8px;">
          <a href="mailto:contact@jbj.ae?subject=Confirming%20JBJ%20Registration" style="display:inline-block;background:#0a0a0a;color:#FFFDF7;text-decoration:none;padding:15px 34px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.5px;border:1px solid #C9A86A;">Reply to Confirm →</a>
        </td></tr>
        <tr><td style="padding:18px 40px 0;font-size:14px;line-height:1.7;color:#0a0a0a;">
          <div style="background:#FAF5EA;border:1px solid #E8D9B8;border-radius:10px;padding:14px 18px;font-size:13px;line-height:1.6;color:#0a0a0a;margin:18px 0 8px;">Please reply to <a href="mailto:contact@jbj.ae" style="color:#0a0a0a;font-weight:600;">contact@jbj.ae</a> with <a href="mailto:infoo.jane@gmail.com" style="color:#0a0a0a;font-weight:600;">infoo.jane@gmail.com</a> on CC.</div>
        </td></tr>
        <tr><td style="padding:24px 40px 36px;font-size:14px;line-height:1.7;color:#0a0a0a;">
          <p style="margin:18px 0 4px;">Warm regards,</p>
          <p style="margin:0;font-weight:700;color:#0a0a0a;">JBJ Team</p>
          <p style="margin:2px 0 0;font-size:12px;color:#7a6748;letter-spacing:1px;text-transform:uppercase;">JBJ Global Real Estate</p>
          <div style="height:1px;background:#E8D9B8;margin:22px 0 14px;"></div>
          <div style="font-size:11px;color:#7a6748;text-align:center;letter-spacing:1px;">RERA Licensed · Dubai, UAE · jbj.ae</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>$HTML$)
ON CONFLICT (variant) DO NOTHING;
