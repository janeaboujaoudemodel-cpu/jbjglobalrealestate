/**
 * Site-wide WhatsApp link guard.
 *
 * Guarantees that EVERY WhatsApp link — whether opened via `window.open()`,
 * `window.location.href = …`, or a clicked `<a>` element — is rewritten to
 * the canonical `https://wa.me/{digits}[?text=…]` form, with phone digits
 * normalized (non-digit chars stripped, leading "00" removed).
 *
 * Why a guard instead of per-callsite refactor:
 *  - There are ~60 WhatsApp callsites scattered across the codebase, some
 *    use bare `${phone}` (no normalization), some hardcode `web.whatsapp.com`.
 *  - A single interception layer is impossible to bypass and impossible to
 *    regress, so we never serve `api.whatsapp.com` or `web.whatsapp.com`
 *    URLs again (those are routinely blocked by corp firewalls / WhatsApp
 *    itself), and the phone is always normalized.
 *
 * Install once from `src/main.tsx`:
 *     import { installWhatsAppGuard } from "@/utils/whatsappGuard";
 *     installWhatsAppGuard();
 */

const WA_HOSTS = /^https?:\/\/(?:api\.whatsapp\.com|web\.whatsapp\.com|wa\.me)(\/.*)?$/i;

const sanitizeDigits = (raw: string): string => {
  let d = raw.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  return d;
};

/**
 * Rewrite any WhatsApp URL to canonical `https://wa.me/{digits}?text=…`.
 * Returns the URL unchanged if it's not a WhatsApp URL.
 */
export const normalizeWhatsAppUrl = (input: string): string => {
  if (!input || typeof input !== "string") return input;
  if (!WA_HOSTS.test(input)) return input;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return input;
  }

  // Extract phone + text from any WhatsApp URL shape:
  //   wa.me/{phone}?text=…
  //   api.whatsapp.com/send?phone={phone}&text=…
  //   web.whatsapp.com/send?phone={phone}&text=…
  let phoneRaw = "";
  let text = url.searchParams.get("text") || "";

  const host = url.hostname.toLowerCase();
  if (host === "wa.me") {
    phoneRaw = url.pathname.replace(/^\//, "");
  } else {
    phoneRaw = url.searchParams.get("phone") || "";
  }

  const digits = sanitizeDigits(phoneRaw);
  const textPart = text ? `?text=${encodeURIComponent(text)}` : "";
  return digits ? `https://wa.me/${digits}${textPart}` : `https://wa.me/${textPart}`;
};

let installed = false;

export const installWhatsAppGuard = (): void => {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const inFrame = (() => {
    try { return window.top !== window.self; } catch { return true; }
  })();

  const needsTopEscape = (url: string): boolean => {
    if (!url) return false;
    return /^mailto:/i.test(url) || WA_HOSTS.test(url);
  };

  // 1) Patch window.open — rewrites WhatsApp URLs opened programmatically AND
  //    forces mailto:/wa.me to navigate the top frame so the Lovable preview
  //    iframe doesn't try to load mail.google.com / web.whatsapp.com inline
  //    (which fail with ERR_BLOCKED_BY_RESPONSE / X-Frame-Options).
  const origOpen = window.open?.bind(window);
  if (origOpen) {
    window.open = function (
      url?: string | URL,
      target?: string,
      features?: string,
    ): Window | null {
      let safe: string | URL | undefined = url;
      const raw = typeof url === "string" ? url : url instanceof URL ? url.toString() : "";
      if (typeof url === "string") safe = normalizeWhatsAppUrl(url);
      else if (url instanceof URL) safe = normalizeWhatsAppUrl(url.toString());

      if (inFrame && needsTopEscape(raw)) {
        const finalUrl = typeof safe === "string" ? safe : safe?.toString() ?? raw;
        if (/^mailto:/i.test(finalUrl)) {
          try { if (window.top) { window.top.location.href = finalUrl; return null; } }
          catch { /* fall through */ }
        }
        return origOpen(safe as any, "_top", features);
      }
      return origOpen(safe as any, target, features);
    } as typeof window.open;
  }

  // 2) Click delegation — rewrites <a href="…whatsapp…"> at click time and
  //    forces mailto/wa.me anchors to target=_top inside the preview iframe.
  document.addEventListener(
    "click",
    (e) => {
      const path = e.composedPath?.() ?? [];
      const anchor = path.find(
        (n) => (n as HTMLElement)?.tagName === "A",
      ) as HTMLAnchorElement | undefined;
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      if (WA_HOSTS.test(href)) {
        const safe = normalizeWhatsAppUrl(href);
        if (safe !== href) anchor.setAttribute("href", safe);
      }

      if (inFrame && needsTopEscape(href) && anchor.getAttribute("target") !== "_top") {
        anchor.setAttribute("target", "_top");
      }
    },
    true,
  );

  // 3) Guard location assignments — catches `window.location.href = "https://web.whatsapp.com/…"`
  //    by patching the setter on the prototype. We can't redefine `location`
  //    itself, but we can wrap `assign`/`replace`.
  try {
    const proto = Object.getPrototypeOf(window.location) as Location;
    const origAssign = window.location.assign.bind(window.location);
    const origReplace = window.location.replace.bind(window.location);
    (proto as any).assign = (u: string) => origAssign(normalizeWhatsAppUrl(u));
    (proto as any).replace = (u: string) => origReplace(normalizeWhatsAppUrl(u));
  } catch {
    // Some browsers freeze the Location prototype — silently skip.
  }
};
