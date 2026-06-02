import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

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

  useEffect(() => {
    const syncNativeFullscreen = () => setOn(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncNativeFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncNativeFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch {
      setOn((v) => !v);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      data-fullscreen-tool-toggle
      data-allow-dark-cta
      data-no-contrast-guard
      aria-label={on ? "Exit full screen" : "Enter full screen"}
      title={on ? "Exit full screen" : "Enter full screen"}
      className="allow-white fixed z-[10000] top-24 right-4 md:top-28 md:right-6 inline-flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all hover:scale-[1.03]"
      style={{
        background: "rgba(15,15,22,0.72)",
        border: "1px solid rgba(255,255,255,0.28)",
        color: "#FFFFFF",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      {on ? <Minimize2 className="w-4 h-4 allow-white" /> : <Maximize2 className="w-4 h-4 allow-white" />}
    </button>
  );
};

export default FullscreenToolToggle;
