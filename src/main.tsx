import { StrictMode } from"react";
import { createRoot } from"react-dom/client";
import App from"./App";
import { initSentry, captureToSentry } from"@/lib/sentry";

// Must run before anything else renders or throws, so early errors are
// captured too. No-op if VITE_SENTRY_DSN isn't set (see src/lib/sentry.ts).
initSentry();

import"./styles/theme-tokens.css";
import"./index.css";
import"./styles/sidebar.css";
import"./styles/cards.css";
import"./styles/buttons-ctas.css";
import"./styles/hero-video.css";
import"./styles/modals.css";
import"./styles/forms.css";
import"./styles/theme-moon.css";
import"./styles/pass-302-emerald-polish.css";
import"./styles/pass-303-skin-parity.css";
import"./styles/pass-305-sun-champagne-parity.css";
import"./styles/pass-306-rail-width-parity.css";
import"./styles/pass-307-deep-start-and-sun-footer.css";
import"./styles/pass-308-footer-parity-strap-emerald.css";
import"./styles/pass-309-rail-seam-and-deep-top.css";
import"./styles/pass-310-deep-rail-and-seam-lock.css";
import"./styles/pass-311-photo-card-white-ink.css";
import"./styles/pass-312-moon-rail-no-icon-highlight.css";
import"./styles/pass-313-rail-footer-fit-and-brand-padding.css";
import"./styles/pass-314-expanded-rail-rhythm.css";
import"./styles/pass-315-sun-partners-strap-and-rail-parity.css";
import"./styles/pass-316-sun-champagne-tab-and-centered-strap.css";
import"./styles/pass-317-sun-rail-footer-black-ink.css";
import"./styles/pass-318-mobile-nav-parity.css";
import"./styles/pass-324-phone-header-identity.css";
import"./styles/pass-325-phone-champagne-chrome.css";
import"./styles/pass-326-phone-header-footer-color-match.css";
import"./styles/pass-328-phone-portrait-chrome-and-hero-fill.css";
import"./styles/pass-329-sun-phone-header-footer-parity.css";
import"./styles/pass-330-sun-phone-clear-top-and-filter-geometry.css";
import"./styles/pass-331-hero-clear-chrome.css";
import"./styles/pass-333-orientation-chrome-and-sun-controls.css";
import"./styles/pass-335-hero-clear-rail-and-hover-parity.css";
import"./styles/pass-338-instant-theme-swap.css";
import"./styles/pass-339-sun-search-champagne-and-rail-fit.css";
import"./styles/pass-340-sun-cta-champagne-and-clear-rail-footer.css";
import"./styles/pass-341-universal-rail-all-devices.css";
import"./styles/pass-342-moon-rail-white-labels.css";
import"./styles/pass-344-sun-rail-black-ink.css";
import"./styles/pass-346-open-rail-ink-and-title-parity.css";
import"./styles/pass-348-sun-champagne-dominant-chrome.css";
import"./styles/pass-349-sun-emerald-accents-and-gold-borders.css";
import"./styles/pass-351-phone-drawer-gold-and-pref-align.css";
import"./styles/pass-353-cta-band-white-ink.css";
import"./styles/pass-354-drawer-scroll-theme-border-and-compact-cta.css";
import"./styles/pass-355-hero-clear-no-highlight.css";
import"./styles/pass-356-gated-portal-popup.css";
import"./styles/pass-357-filter-option-alignment.css";
import"./styles/pass-358-recommendation-popup-emerald-white.css";
import"./styles/pass-359-toast-action-emerald-pair.css";
import"./styles/pass-360-recommendation-popup-ink-and-layout.css";
import"./styles/pass-364-rail-no-gold-white-monogram-resend-rhythm.css";
import"./styles/pass-365-rail-footer-fill-and-innovation-layers.css";
import"./styles/pass-366-moon-rail-deep-top-density.css";
import"./styles/pass-367-featured-ad-photo-ink.css";
import"./styles/pass-369-ai-tools-sun-champagne.css";
import"./styles/pass-371-backoffice-phone-layout.css";
import"./styles/pass-372-ai-gate-contrast.css";
import"./styles/pass-373-sun-org-picker-ink.css";
import"./styles/pass-374-form-modal-system.css";
import"./styles/pass-375-rail-reflow-and-centered-content.css";
import"./styles/pass-376-moon-hero-clear-rail.css";
import"./styles/pass-377-dark-host-heading-contract.css";







import { installWhatsAppGuard } from"@/utils/whatsappGuard";
import { installImageRecoveryGuard } from"@/utils/imageRecoveryGuard";
import { installLazyImageEnforcer } from"@/utils/lazyImageEnforcer";
import { installInteractionCssPruner } from"@/utils/pruneCostlyCssRules";

// Apply the saved skin before React paints. Public Moon mirrors the emerald JBJ
// Hub shell; owner/admin routes remain on their fixed backend skin.
if (typeof document !== "undefined") {
  try {
    const pathname = window.location.pathname;
    const storedTheme = localStorage.getItem("jbj-theme-mode") === "moon" ? "moon" : "sun";
    const themeLocked = /^\/access(\/|$)/.test(pathname);
    document.documentElement.setAttribute("data-jbj-theme", themeLocked ? "sun" : storedTheme);
    // Homepage shell attributes must exist before React's first paint. Adding
    // them from page/header effects caused the content gutter and transparent
    // header rules to arrive one frame late, exposing a white strip below the
    // horizontal chrome in both themes.
    if (pathname === "/" || pathname === "/index") {
      document.body.setAttribute("data-homepage", "true");
      document.body.setAttribute("data-home-hero-state", window.scrollY > 80 ? "scrolled" : "atrest");
    }
    if (themeLocked) {
      document.documentElement.setAttribute("data-jbj-theme-lock", "original");
    }
    if (/^\/(owner|crm|admin)(\/|$)/.test(pathname)) {
      document.documentElement.setAttribute("data-jbj-backend-lock", "1");
    }
  } catch {
    document.documentElement.setAttribute("data-jbj-theme", "sun");
  }
}

// Site-wide guard: every WhatsApp link is normalized to wa.me with sanitized
// digits.
installWhatsAppGuard();

// Site-wide guard: every broken <img loading="lazy" decoding="async"> is recovered with a high-res retry then
// a branded champagne-initials fallback. Opt out per-image via `data-no-fallback`.
installImageRecoveryGuard();

// Site-wide perf guard: every <img> without an explicit eager/high hint is
// forced to loading="lazy" + decoding="async". Opt out via `data-eager`.
installLazyImageEnforcer();
installInteractionCssPruner();

// ---------------------------------------------------------------------------
// Global diagnostics + chunk-error auto-recovery (added with user approval).
// Logs the exact failing module so we can find the root cause, and silently
// reloads once when Vite reports a preload error (stale chunk after deploy).
// ---------------------------------------------------------------------------
if (typeof window !=="undefined") {
 window.addEventListener("error", (e) => {
 const msg = e?.message ||"";
 const src = (e?.filename as string) ||"";
 if (msg || src) {
 console.warn("[boot-diag] window.error", { msg, src, lineno: e.lineno, colno: e.colno });
 captureToSentry("window.error", e?.error ?? msg, { src, lineno: e.lineno, colno: e.colno });
 }
 });

 window.addEventListener("unhandledrejection", (e) => {
 const reason: unknown = e?.reason;
 const msg = reason instanceof Error ? reason.message : String(reason ||"");
 console.warn("[boot-diag] unhandledrejection", { msg, stack: reason instanceof Error ? reason.stack : undefined });
 captureToSentry("unhandledrejection", reason ?? msg);
 });

 // Vite emits this when a dynamic import fails (chunk hash changed mid-session).
 // Auto-reload once per minute so users never see the error card for stale bundles.
 window.addEventListener("vite:preloadError", (event: Event) => {
 console.warn("[boot-diag] vite:preloadError — reloading once", event);
 try {
  const k ="jbj_recovery_reload_at";
 const last = Number(sessionStorage.getItem(k) || 0);
 if (Date.now() - last > 60_000) {
 sessionStorage.setItem(k, String(Date.now()));
 event.preventDefault();
 window.location.reload();
 }
 } catch {
 window.location.reload();
 }
 });
}

// Declare the global flag type
declare global {
 interface Window {
 __APP_MOUNTED__?: boolean;
 }
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Application root element is missing");
const root = createRoot(rootElement);

root.render(
 <StrictMode>
 <App />
 </StrictMode>
);

// Mark app as mounted after first render completes
// This prevents the boot overlay from showing for runtime errors
requestAnimationFrame(() => {
 window.__APP_MOUNTED__ = true;
});
