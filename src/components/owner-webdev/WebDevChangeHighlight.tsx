/**
 * Owner-only overlay that listens for `jbj:webdev-highlight` events
 * dispatched by the WebDev dock. When a change lands on the current
 * page (or after navigation), it:
 *   1. Scrolls the target into view
 *   2. Draws a pulsing gold ring around it for 4s
 *   3. Shows a floating Before / After toggle card (CSS preview off vs on)
 *      with Save / Cancel actions that map to the existing override row.
 *
 * Mounted once at app root, gated by owner/admin role.
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Check, X, Eye, EyeOff } from "lucide-react";

type HighlightDetail = {
  selector: string;
  overrideId?: string | null;
  requestId?: string | null;
  changeLabel?: string;
};

export default function WebDevChangeHighlight() {
  const [allowed, setAllowed] = useState(false);
  const [active, setActive] = useState<HighlightDetail | null>(null);
  const [showAfter, setShowAfter] = useState(true);
  const ringRef = useRef<HTMLDivElement | null>(null);

  // Owner/admin gate
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      const ok = (roles ?? []).some(
        (r: { role: string }) =>
          r.role === "owner" || r.role === "admin",
      );
      setAllowed(ok);
    })();
  }, []);

  // Listen for highlight requests
  useEffect(() => {
    if (!allowed) return;
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<HighlightDetail>).detail;
      if (!detail?.selector) return;
      setActive(detail);
      setShowAfter(true);
      // Defer so the new route's DOM is mounted
      setTimeout(() => locateAndRing(detail.selector), 250);
    };
    window.addEventListener("jbj:webdev-highlight", handler as EventListener);
    return () =>
      window.removeEventListener(
        "jbj:webdev-highlight",
        handler as EventListener,
      );
  }, [allowed]);

  const locateAndRing = (selector: string) => {
    let target: Element | null = null;
    try {
      target = document.querySelector(selector);
    } catch {
      /* invalid selector */
    }
    if (!target) {
      toast({
        title: "Element not found on this page",
        description: selector,
      });
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    drawRing(target);
  };

  const drawRing = (el: Element) => {
    if (ringRef.current) ringRef.current.remove();
    const r = el.getBoundingClientRect();
    const ring = document.createElement("div");
    ring.style.cssText = `
      position: fixed;
      left: ${r.left - 6}px;
      top: ${r.top - 6}px;
      width: ${r.width + 12}px;
      height: ${r.height + 12}px;
      border: 2px solid #B89555;
      border-radius: 10px;
      box-shadow: 0 0 0 4px rgba(184,149,85,0.20), 0 0 24px rgba(184,149,85,0.45);
      pointer-events: none;
      z-index: 11990;
      animation: jbj-webdev-pulse 1.4s ease-in-out 2;
    `;
    document.body.appendChild(ring);
    ringRef.current = ring;
    setTimeout(() => {
      ring.remove();
      if (ringRef.current === ring) ringRef.current = null;
    }, 4000);
  };

  // Toggle Before/After by enabling/disabling the override preview event
  useEffect(() => {
    if (!active?.overrideId) return;
    if (showAfter) {
      // Re-emit the pending list to enable
      (async () => {
        const { data } = await supabase
          .from("owner_ui_overrides")
          .select("id, route_pattern, selector, css, status")
          .eq("status", "pending");
        window.dispatchEvent(
          new CustomEvent("jbj:override-preview", { detail: data ?? [] }),
        );
      })();
    } else {
      // Clear preview to see Before
      window.dispatchEvent(
        new CustomEvent("jbj:override-preview", { detail: [] }),
      );
    }
  }, [showAfter, active]);

  const save = async () => {
    if (!active?.overrideId) return;
    await supabase
      .from("owner_ui_overrides")
      .update({ status: "approved" })
      .eq("id", active.overrideId);
    if (active.requestId) {
      await supabase
        .from("owner_change_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", active.requestId);
    }
    toast({ title: "Saved", description: "Change is now live." });
    window.dispatchEvent(new CustomEvent("jbj:webdev-refresh"));
    setActive(null);
  };

  const cancel = async () => {
    if (!active?.overrideId) return;
    await supabase
      .from("owner_ui_overrides")
      .delete()
      .eq("id", active.overrideId);
    if (active.requestId) {
      await supabase
        .from("owner_change_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", active.requestId);
    }
    window.dispatchEvent(new CustomEvent("jbj:override-preview", { detail: [] }));
    window.dispatchEvent(new CustomEvent("jbj:webdev-refresh"));
    // Silent cancel — highlight closes immediately; no floating toast behind the dock
    setActive(null);
  };

  if (!allowed || !active) return null;

  return (
    <>
      <style>{`
        @keyframes jbj-webdev-pulse {
          0%   { box-shadow: 0 0 0 4px rgba(184,149,85,0.20), 0 0 24px rgba(184,149,85,0.45); }
          50%  { box-shadow: 0 0 0 8px rgba(184,149,85,0.10), 0 0 36px rgba(184,149,85,0.65); }
          100% { box-shadow: 0 0 0 4px rgba(184,149,85,0.20), 0 0 24px rgba(184,149,85,0.45); }
        }
      `}</style>
      <div
        className="fixed top-[100px] right-6 z-[12001] w-[300px] bg-[#FDFBF7] border border-[#B89555]/40 rounded-2xl shadow-2xl overflow-hidden"
        data-no-contrast-guard
      >
        <div className="px-3 py-2 bg-[#F7F2EA] border-b border-[#B89555]/30">
          <div className="text-[11px] uppercase tracking-wider text-[#1A1A1A]/60">
            Preview change
          </div>
          <div className="text-sm font-semibold text-[#1A1A1A] truncate">
            {active.changeLabel || "Untitled change"}
          </div>
        </div>
        <div className="p-3 space-y-2">
          <button
            type="button"
            onClick={() => setShowAfter((v) => !v)}
            className="w-full inline-flex items-center justify-center gap-2 h-9 rounded-md border border-[#B89555]/40 bg-white hover:bg-[#EFE6D6] text-[#1A1A1A] text-xs font-medium"
          >
            {showAfter ? (
              <>
                <EyeOff className="w-3.5 h-3.5" /> Show Before
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" /> Show After
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md jj-surface-emerald hover:jj-surface-emerald text-white text-xs font-semibold allow-white"
              data-no-contrast-guard
              data-allow-dark-cta
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button
              type="button"
              onClick={cancel}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-md border border-[#B89555]/40 bg-white hover:bg-red-50 text-red-700 text-xs font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              active.selector && locateAndRing(active.selector)
            }
            className="w-full text-[10px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] underline"
          >
            Re-highlight element
          </button>
        </div>
      </div>
    </>
  );
}
