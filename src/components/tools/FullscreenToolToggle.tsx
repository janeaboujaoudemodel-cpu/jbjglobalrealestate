import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * App-level fullscreen toggle used by every tool page.
 * Icon-only by default; expands to reveal a label on hover/focus.
 * Adds `data-tool-fullscreen="true"` on <html>; global CSS in index.css
 * hides the header/sidebar and pins the active tool shell edge-to-edge.
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

  const label = on ? "Exit fullscreen" : "Fullscreen";

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      data-fullscreen-tool-toggle
      data-allow-dark-cta
      data-no-contrast-guard
      aria-label={label}
      title={label}
      className="group allow-white fixed z-[10000] top-24 right-4 md:top-28 md:right-6 inline-flex h-10 items-center justify-center rounded-full backdrop-blur-md transition-[width,padding,background] duration-200 ease-out hover:scale-[1.03] text-xs font-semibold w-10 hover:w-auto focus-visible:w-auto px-0 hover:px-3 focus-visible:px-3 gap-0 hover:gap-2 focus-visible:gap-2 overflow-hidden"
      style={{
        background: "var(--jj-emerald-ombre)",
        border: "1px solid rgba(184,149,85,0.55)",
        color: "#FFFFFF",
        WebkitTextFillColor: "#FFFFFF",
        boxShadow: "0 8px 24px rgba(6,78,59,0.45), 0 0 0 1px rgba(16,194,133,0.18) inset",
      }}
    >
      {on ? (
        <Minimize2 className="w-4 h-4 shrink-0 allow-white" />
      ) : (
        <Maximize2 className="w-4 h-4 shrink-0 allow-white" />
      )}
      <span
        className="allow-white whitespace-nowrap max-w-0 group-hover:max-w-[160px] group-focus-visible:max-w-[160px] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-[max-width,opacity] duration-200 ease-out"
        style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
      >
        {label}
      </span>
    </button>
  );
};

export default FullscreenToolToggle;
