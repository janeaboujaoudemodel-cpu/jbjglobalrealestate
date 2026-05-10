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
      return (data ?? []) as EmailSignature[];
    },
  });
}

/** Render a signature preset to HTML block. Uses stored html if present, else builds from fields. */
export function renderSignatureHtml(sig: EmailSignature): string {
  if (sig.html && sig.html.trim()) return sig.html;
  const lines = [
    sig.name_line,
    sig.title_line ? `<span style="color:#1A1A1A;opacity:.7;">${sig.title_line}</span>` : null,
    sig.company_line ? `<strong>${sig.company_line}</strong>` : null,
    sig.address_line,
    [sig.phone, sig.email].filter(Boolean).join(" · ") || null,
    sig.website ? `<a href="${sig.website}" style="color:#B89555;text-decoration:none;">${sig.website.replace(/^https?:\/\//, "")}</a>` : null,
  ].filter(Boolean);
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;border-top:1px solid #B89555;padding-top:16px;font-family:Inter,Arial,sans-serif;font-size:13px;line-height:1.6;color:#1A1A1A;">
  <tr><td>${lines.map((l) => `<div>${l}</div>`).join("")}</td></tr>
</table>`.trim();
}
