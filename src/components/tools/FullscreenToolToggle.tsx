import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";

/**
 * App-level fullscreen toggle used by every tool page.
 * Adds `data-tool-fullscreen="true"` on <html>; global CSS in index.css
 * hides the header/sidebar and pins the active tool shell edge-to-edge.
 *
 * Clicking X exits fullscreen (does NOT navigate away).
 */
const FullscreenToolToggle = ({ defaultOn = false }: { defaultOn?: boolean }) => {
  const [on, setOn] = useState<boolean>(defaultOn);

  useEffect(() => {
    const root = document.documentElement;
    if (on) {
      root.setAttribute("data-tool-fullscreen", "true");
    } else {
      root.removeAttribute("data-tool-fullscreen");
    }
    return () => {
      root.removeAttribute("data-tool-fullscreen");
    };
  }, [on]);

  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      data-allow-dark-cta
      data-no-contrast-guard
      aria-label={on ? "Exit full screen" : "Enter full screen"}
      title={on ? "Exit full screen" : "Enter full screen"}
      className="allow-white fixed z-[10000] top-24 right-4 md:top-28 md:right-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-[0.18em] backdrop-blur-md transition-all hover:scale-[1.03]"
      style={{
        background: "rgba(15,15,22,0.72)",
        border: "1px solid rgba(255,255,255,0.28)",
        color: "#FFFFFF",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      {on ? <X className="w-3.5 h-3.5 allow-white" /> : <Maximize2 className="w-3.5 h-3.5 allow-white" />}
      <span className="allow-white">{on ? "Exit" : "Full Screen"}</span>
    </button>
  );
};

export default FullscreenToolToggle;
