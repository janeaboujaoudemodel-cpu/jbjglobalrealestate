/**
 * Universal contact-action helpers — guarantees WhatsApp / Email / Phone
 * links open everywhere without popup-blocker or `api.whatsapp.com is blocked`
 * errors. Always uses wa.me, mailto:, tel: forms which are universally allowed.
 *
 * Usage MUST happen inside a synchronous user gesture (onClick handler).
 * Do NOT await before calling these functions.
 */
import { toast } from "sonner";

const sanitizePhone = (phone?: string | null): string => {
  if (!phone) return "";
  // Strip everything except digits; drop leading "00"
  let d = String(phone).replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  return d;
};

/** Trigger an external URL inside a trusted user gesture. */
const triggerLink = (href: string): boolean => {
  try {
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
};

export interface OpenWhatsAppOptions {
  /** International phone in any format. Empty/missing → opens contact picker. */
  phone?: string | null;
  /** Pre-filled message. */
  text?: string;
}

export const openWhatsApp = (
  phoneOrOpts?: string | OpenWhatsAppOptions,
  maybeText?: string,
): boolean => {
  const opts: OpenWhatsAppOptions =
    typeof phoneOrOpts === "string" || phoneOrOpts == null
      ? { phone: phoneOrOpts as string | undefined, text: maybeText }
      : phoneOrOpts;
  const digits = sanitizePhone(opts.phone);
  const text = opts.text ? `?text=${encodeURIComponent(opts.text)}` : "";
  // Always use wa.me — never api.whatsapp.com (blocked by many networks/filters).
  const url = digits ? `https://wa.me/${digits}${text}` : `https://wa.me/${text}`;
  const ok = triggerLink(url);
  if (!ok) {
    try {
      navigator.clipboard?.writeText(url);
      toast.message("WhatsApp link copied — paste it in your browser");
    } catch {
      toast.error("Could not open WhatsApp");
    }
  }
  return ok;
};

export interface OpenEmailOptions {
  to: string | string[];
  subject?: string;
  body?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export const openEmail = (opts: OpenEmailOptions): boolean => {
  const to = Array.isArray(opts.to) ? opts.to.join(",") : opts.to;
  if (!to) {
    toast.error("No recipient email");
    return false;
  }
  const params: string[] = [];
  if (opts.subject) params.push(`subject=${encodeURIComponent(opts.subject)}`);
  if (opts.body) params.push(`body=${encodeURIComponent(opts.body)}`);
  if (opts.cc) params.push(`cc=${encodeURIComponent(Array.isArray(opts.cc) ? opts.cc.join(",") : opts.cc)}`);
  if (opts.bcc) params.push(`bcc=${encodeURIComponent(Array.isArray(opts.bcc) ? opts.bcc.join(",") : opts.bcc)}`);
  const url = `mailto:${to}${params.length ? "?" + params.join("&") : ""}`;
  const ok = triggerLink(url);
  if (!ok) {
    try {
      navigator.clipboard?.writeText(to);
      toast.message("Email address copied to clipboard");
    } catch {
      toast.error("Could not open email client");
    }
  }
  return ok;
};

export const openTel = (phone: string): boolean => {
  const digits = sanitizePhone(phone);
  if (!digits) {
    toast.error("No phone number");
    return false;
  }
  const ok = triggerLink(`tel:+${digits}`);
  if (!ok) {
    try {
      navigator.clipboard?.writeText(`+${digits}`);
      toast.message("Phone number copied");
    } catch {
      toast.error("Could not start call");
    }
  }
  return ok;
};

export const buildWhatsAppUrl = (phone?: string | null, text?: string): string => {
  const digits = sanitizePhone(phone);
  const t = text ? `?text=${encodeURIComponent(text)}` : "";
  return digits ? `https://wa.me/${digits}${t}` : `https://wa.me/${t}`;
};
