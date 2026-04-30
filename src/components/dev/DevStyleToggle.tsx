/**
 * DevStyleToggle — DEV ONLY floating switch.
 *
 * Flips <html data-style-mode="before|after"> to overlay pre-refactor
 * typography & contrast rules (see styles/dev-before-overlay.css).
 * Lets reviewers spot any remaining wash-out in seconds.
 *
 * Renders nothing in production builds. Persists choice in localStorage.
 * Hotkey: Shift+B to toggle without clicking.
 */
import { useEffect, useState, useCallback } from "react";
import "@/styles/dev-before-overlay.css";

const STORAGE_KEY = "dev:style-mode";
type Mode = "before" | "after";

function applyMode(mode: Mode) {
  document.documentElement.setAttribute("data-style-mode", mode);
}

export default function DevStyleToggle() {
  // Hard gate — only render in dev builds.
  if (!import.meta.env.DEV) return null;

  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "after";
    return (localStorage.getItem(STORAGE_KEY) as Mode) || "after";
  });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    applyMode(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((m) => (m === "before" ? "after" : "before"));
  }, []);

  // Shift+B hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "B" || e.key === "b") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label="Show style toggle"
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 2147483647,
          width: 36,
          height: 36,
          borderRadius: 9999,
          border: "1px solid rgba(0,0,0,0.12)",
          background: "#fff",
          boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          cursor: "pointer",
          fontSize: 16,
        }}
      >
        🎨
      </button>
    );
  }

  const isBefore = mode === "before";

  return (
    <div
      role="region"
      aria-label="Developer style toggle"
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px 8px 12px",
        borderRadius: 9999,
        background: "rgba(255,255,255,0.96)",
        border: "1px solid rgba(0,0,0,0.1)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
        backdropFilter: "blur(8px)",
        font: "500 12px/1 'Inter', ui-sans-serif, system-ui, sans-serif",
        color: "#111",
        userSelect: "none",
      }}
    >
      <span
        aria-hidden
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#71717a",
        }}
      >
        DEV
      </span>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={isBefore}
        aria-label={`Style mode: ${mode}. Click to switch.`}
        title="Toggle pre-refactor styles (Shift+B)"
        style={{
          position: "relative",
          width: 132,
          height: 28,
          borderRadius: 9999,
          border: "1px solid rgba(0,0,0,0.12)",
          background: isBefore ? "#fef2f2" : "#ecfdf5",
          cursor: "pointer",
          padding: 0,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: isBefore ? 2 : 66,
            width: 64,
            height: 22,
            borderRadius: 9999,
            background: isBefore ? "#dc2626" : "#059669",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "left 180ms ease",
            textTransform: "uppercase",
          }}
        >
          {isBefore ? "Before" : "After"}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.35)",
          }}
        >
          <span style={{ visibility: isBefore ? "hidden" : "visible" }}>Before</span>
          <span style={{ visibility: isBefore ? "visible" : "hidden" }}>After</span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => setCollapsed(true)}
        aria-label="Hide style toggle"
        title="Hide"
        style={{
          width: 22,
          height: 22,
          borderRadius: 9999,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "transparent",
          color: "#71717a",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}
