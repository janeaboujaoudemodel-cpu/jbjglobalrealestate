import { StrictMode } from"react";
import { createRoot } from"react-dom/client";
import App from"./App";
import"./styles/theme-tokens.css";
import"./index.css";
import { installWhatsAppGuard } from"@/utils/whatsappGuard";
import { installImageRecoveryGuard } from"@/utils/imageRecoveryGuard";

// Site-wide guard: every WhatsApp link is normalized to wa.me with sanitized
// digits.
installWhatsAppGuard();

// Site-wide guard: every broken <img loading="lazy" decoding="async"> is recovered with a high-res retry then
// a branded champagne-initials fallback. Opt out per-image via `data-no-fallback`.
installImageRecoveryGuard();

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
 // eslint-disable-next-line no-console
 console.warn("[boot-diag] window.error", { msg, src, lineno: e.lineno, colno: e.colno });
 }
 });

 window.addEventListener("unhandledrejection", (e) => {
 const reason: any = (e as any)?.reason;
 const msg = reason?.message || String(reason ||"");
 // eslint-disable-next-line no-console
 console.warn("[boot-diag] unhandledrejection", { msg, stack: reason?.stack });
 });

 // Vite emits this when a dynamic import fails (chunk hash changed mid-session).
 // Auto-reload once per minute so users never see the error card for stale bundles.
 window.addEventListener("vite:preloadError", (event: Event) => {
 // eslint-disable-next-line no-console
 console.warn("[boot-diag] vite:preloadError — reloading once", event);
 try {
 const k ="jbj_chunk_reload_at";
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

const root = createRoot(document.getElementById("root")!);

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
