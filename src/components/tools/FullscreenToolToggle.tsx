import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * App-level fullscreen toggle used by every tool page.
 * Icon-only pill; expands to reveal label on hover/focus.
 * Uses inline styles + React hover state so global CSS overrides
 * (overflow/padding/opacity resets inside tool shells) cannot leak the
 * hidden label outside the circle.
 */
const FullscreenToolToggle = ({ defaultOn = false }: { defaultOn?: boolean }) => {
  const [on, setOn] = useState<boolean>(defaultOn);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (on) root.setAttribute("data-tool-fullscreen", "true");
    else root.removeAttribute("data-tool-fullscreen");
    return () => root.removeAttribute("data-tool-fullscreen");
  }, [on]);

  useEffect(() => {
    const sync = () => setOn(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await document.documentElement.requestFullscreen({ navigationUI: "hide" });
    } catch {
      setOn((v) => !v);
    }
  };

  const label = on ? "Exit fullscreen" : "Fullscreen";
  const Icon = on ? Minimize2 : Maximize2;

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
      data-fullscreen-tool-toggle
      data-allow-dark-cta
      data-no-contrast-guard
      aria-label={label}
      title={label}
      className="allow-white fixed z-[10000] top-24 right-4 md:top-28 md:right-6 inline-flex items-center justify-center rounded-full backdrop-blur-md font-semibold"
      style={{
        height: "40px",
        width: expanded ? "auto" : "40px",
        minWidth: "40px",
        maxWidth: expanded ? "220px" : "40px",
        paddingLeft: expanded ? "14px" : "0px",
        paddingRight: expanded ? "14px" : "0px",
        paddingTop: "0px",
        paddingBottom: "0px",
        gap: expanded ? "8px" : "0px",
        overflow: "hidden",
        whiteSpace: "nowrap",
        fontSize: "12px",
        lineHeight: "1",
        transition: "width 180ms ease, max-width 180ms ease, padding 180ms ease, gap 180ms ease, transform 180ms ease",
        background: "var(--jj-emerald-ombre)",
        border: "1px solid rgba(255,255,255,0.52)",
        color: "#FFFFFF",
        WebkitTextFillColor: "#FFFFFF",
        boxShadow: "0 8px 24px rgba(6,78,59,0.45), 0 0 0 1px rgba(16,194,133,0.18) inset",
      }}
    >
      <Icon className="allow-white" style={{ width: 16, height: 16, flexShrink: 0 }} />
      {expanded && (
        <span
          className="allow-white"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", whiteSpace: "nowrap" }}
        >
          {label}
        </span>
      )}
    </button>
  );
};

export default FullscreenToolToggle;
