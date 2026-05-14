import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailSignature {
  id: string;
  name: string;
  role_label: string | null;
  name_line: string | null;
  title_line: string | null;
  company_line: string | null;
  address_line: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  socials: Record<string, string> | null;
  html: string | null;
  is_system: boolean;
  is_default: boolean;
}

export function useEmailSignatures() {
  return useQuery({
    queryKey: ["email_signature_presets"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_signature_presets")
        .select("*")
        .order("is_system", { ascending: false })
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      const rows = (data ?? []) as EmailSignature[];
      const seen = new Set<string>();
      return rows.filter((sig) => {
        const label = `${sig.name || ""} ${sig.role_label || ""} ${sig.title_line || ""}`.toLowerCase();
        // Hide accidental front-desk/help-desk aliases so the picker stays compact;
        // the single Support preset remains available and every preset renders contact@jbj.ae.
        if (/front\s*desk|help\s*desk/.test(label)) return false;
        const key = (sig.name || sig.role_label || sig.title_line || sig.id).trim().toLowerCase().replace(/\s+/g, " ");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },
  });
}

/** Force the brand token "JBJ" to uppercase in any visible label, leaving
 *  surrounding casing intact. Hrefs are NOT transformed (routing stays valid). */
function upperJbj(s: string): string {
  return String(s ?? "").replace(/jbj/gi, "JBJ");
}

/** Render a signature preset to HTML block — ONE canonical premium layout
 *  used for every preset. Only per-preset fields differ. Stored sig.html is
 *  intentionally ignored so the four presets can never visually drift. */
export function renderSignatureHtml(sig: EmailSignature): string {
  const ink = "#1A1A1A";
  const gold = "#B89555";

  const name = sig.name_line ? upperJbj(sig.name_line) : "";
  const title = sig.title_line ? upperJbj(sig.title_line) : "";
  const company = sig.company_line ? upperJbj(sig.company_line) : "JBJ GLOBAL REAL ESTATE";
  const address = sig.address_line || "";

  const phone = sig.phone ? sig.phone.trim() : "";
  const emailHref = "contact@jbj.ae";
  const emailDisplay = emailHref ? upperJbj(emailHref) : "";
  const contactRow = [
    phone
      ? `<a href="tel:${phone.replace(/[^+\d]/g, "")}" style="color:${gold};text-decoration:none;font-weight:600;letter-spacing:.04em;">${phone}</a>`
      : null,
    emailHref
      ? `<a href="mailto:${emailHref}" style="color:${gold};text-decoration:none;font-weight:600;letter-spacing:.04em;">${emailDisplay}</a>`
      : null,
  ]
    .filter(Boolean)
    .join('<span style="color:' + ink + ';opacity:.5;"> &nbsp;·&nbsp; </span>');

  const websiteHref = sig.website ? sig.website.trim() : "";
  const websiteDisplay = websiteHref ? upperJbj(websiteHref.replace(/^https?:\/\//, "")) : "";
  const websiteRow = websiteHref
    ? `<a href="${websiteHref}" style="color:${gold};text-decoration:none;font-weight:600;letter-spacing:.04em;">${websiteDisplay}</a>`
    : "";

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" data-jbj-sig-table="1" style="margin-top:28px;border-collapse:collapse;font-family:Inter,Arial,sans-serif;">
  <tr><td style="padding-bottom:14px;"><div style="width:100%;max-width:380px;height:1px;background:${gold};line-height:1px;font-size:0;">&nbsp;</div></td></tr>
  ${name ? `<tr><td style="font-size:14px;font-weight:700;color:${ink};letter-spacing:.02em;padding-bottom:4px;">${name}</td></tr>` : ""}
  ${title ? `<tr><td style="font-style:italic;font-size:12px;color:${gold};letter-spacing:.06em;padding-bottom:10px;">${title}</td></tr>` : ""}
  <tr><td style="font-size:11px;font-weight:700;color:${ink};letter-spacing:.16em;text-transform:uppercase;padding-bottom:4px;">${company}</td></tr>
  ${address ? `<tr><td style="font-size:12px;color:${ink};opacity:.72;letter-spacing:.02em;padding-bottom:4px;">${address}</td></tr>` : ""}
  ${contactRow ? `<tr><td style="font-size:12px;color:${ink};letter-spacing:.02em;padding-bottom:2px;">${contactRow}</td></tr>` : ""}
  ${websiteRow ? `<tr><td style="font-size:12px;letter-spacing:.02em;padding-bottom:2px;">${websiteRow}</td></tr>` : ""}
</table>`.trim();
}
