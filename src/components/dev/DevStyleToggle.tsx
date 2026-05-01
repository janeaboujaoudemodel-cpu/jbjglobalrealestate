/**
 * DevStyleToggle — DEV ONLY floating switch.
 *
 * Modes:
 *  - "after"    : the live build (no overlay).
 *  - "before"   : a CSS-only simulation of the pre-refactor styling
 *                 (see styles/dev-before-overlay.css). Approximate, not exact.
 *  - "snapshot" : overlays a real stored screenshot of the previous build at
 *                 /before-snapshots/<route>.png on top of the live page,
 *                 with an A/B wipe slider. If no snapshot exists for the
 *                 current route, falls back to "before" with a note.
 *
 * Renders nothing in production. Persists choice in localStorage.
 * Hotkey: Shift+B cycles through the three modes.
 */
import { useEffect, useState, useCallback } from "react";
// Note: intentionally NOT using useLocation() here. This component renders
// at the very top of the tree and must survive being mounted briefly outside
// a <Router> (e.g. during error-boundary remounts or HMR). We read the
// pathname directly from window.location and listen for navigation events.
import "@/styles/dev-before-overlay.css";

const STORAGE_KEY = "dev:style-mode";
type Mode = "before" | "after" | "snapshot";

function applyMode(mode: Mode) {
  // The CSS overlay only triggers for "before"; "snapshot" leaves the live
  // page untouched and renders an absolute image overlay instead.
  const cssMode = mode === "before" ? "before" : "after";
  document.documentElement.setAttribute("data-style-mode", cssMode);
}

function snapshotPathForRoute(pathname: string): string {
  const slug = pathname.replace(/^\/+|\/+$/g, "").replace(/\//g, "_") || "home";
  return `/before-snapshots/${slug}.png`;
}

export default function DevStyleToggle() {
  // Hard gate — only render in dev builds.
  if (!import.meta.env.DEV) return null;

  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "after";
    return ((localStorage.getItem(STORAGE_KEY) as Mode) || "after");
  });
  const [collapsed, setCollapsed] = useState(false);
  const [wipe, setWipe] = useState(50); // 0–100 wipe % for snapshot mode
  const [snapshotExists, setSnapshotExists] = useState<boolean | null>(null);
  const [pathname, setPathname] = useState<string>(() =>
    typeof window === "undefined" ? "/" : window.location.pathname
  );

  // Track route changes without depending on Router context.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", update);
    // Patch pushState/replaceState to emit a synthetic event we can listen to.
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (...args) {
      const r = origPush.apply(this, args as Parameters<typeof origPush>);
      window.dispatchEvent(new Event("dev:locationchange"));
      return r;
    };
    window.history.replaceState = function (...args) {
      const r = origReplace.apply(this, args as Parameters<typeof origReplace>);
      window.dispatchEvent(new Event("dev:locationchange"));
      return r;
    };
    window.addEventListener("dev:locationchange", update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener("dev:locationchange", update);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
    };
  }, []);

  useEffect(() => {
    applyMode(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
  }, [mode]);

  // Probe snapshot existence whenever route changes or snapshot mode activates
  useEffect(() => {
    if (mode !== "snapshot") {
      setSnapshotExists(null);
      return;
    }
    const url = snapshotPathForRoute(location.pathname);
    const img = new Image();
    img.onload = () => setSnapshotExists(true);
    img.onerror = () => setSnapshotExists(false);
    img.src = url;
  }, [mode, location.pathname]);

  const cycle = useCallback(() => {
    setMode((m) => (m === "after" ? "before" : m === "before" ? "snapshot" : "after"));
  }, []);

  // Shift+B hotkey
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "B" || e.key === "b") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
        e.preventDefault();
        cycle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cycle]);

  // Snapshot overlay (only when active AND image loads)
  const snapshotOverlay =
    mode === "snapshot" && snapshotExists ? (
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 2147483640,
          pointerEvents: "none",
          clipPath: `inset(0 ${100 - wipe}% 0 0)`,
        }}
      >
        <img
          src={snapshotPathForRoute(location.pathname)}
          alt="Pre-refactor snapshot"
          style={{
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
            objectPosition: "top left",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${wipe}%`,
            width: 2,
            background: "#dc2626",
            boxShadow: "0 0 12px rgba(220,38,38,0.6)",
          }}
        />
      </div>
    ) : null;

  if (collapsed) {
    return (
      <>
        {snapshotOverlay}
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Show style toggle"
          style={{
            position: "fixed", bottom: 16, right: 16, zIndex: 2147483647,
            width: 36, height: 36, borderRadius: 9999,
            border: "1px solid rgba(0,0,0,0.12)", background: "#fff",
            boxShadow: "0 6px 20px rgba(0,0,0,0.18)", cursor: "pointer", fontSize: 16,
          }}
        >🎨</button>
      </>
    );
  }

  const labels: Record<Mode, { text: string; bg: string; pillBg: string }> = {
    before:   { text: "Before",   bg: "#fef2f2", pillBg: "#dc2626" },
    after:    { text: "After",    bg: "#ecfdf5", pillBg: "#059669" },
    snapshot: { text: "Snapshot", bg: "#eff6ff", pillBg: "#1d4ed8" },
  };
  const order: Mode[] = ["before", "after", "snapshot"];
  const idx = order.indexOf(mode);

  return (
    <>
      {snapshotOverlay}
      <div
        role="region"
        aria-label="Developer style toggle"
        style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 2147483647,
          display: "flex", flexDirection: "column", gap: 6,
          padding: "8px 10px", borderRadius: 16,
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 8px 28px rgba(0,0,0,0.18)", backdropFilter: "blur(8px)",
          font: "500 12px/1 'Inter', ui-sans-serif, system-ui, sans-serif",
          color: "#111", userSelect: "none", minWidth: 220,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#71717a" }}>DEV</span>

          <button
            type="button"
            onClick={cycle}
            aria-label={`Style mode: ${mode}. Click to cycle.`}
            title="Cycle Before / After / Snapshot (Shift+B)"
            style={{
              position: "relative", width: 198, height: 28, borderRadius: 9999,
              border: "1px solid rgba(0,0,0,0.12)",
              background: labels[mode].bg, cursor: "pointer", padding: 0, overflow: "hidden", flex: 1,
            }}
          >
            <span
              style={{
                position: "absolute", top: 2,
                left: 2 + idx * 64, width: 64, height: 22, borderRadius: 9999,
                background: labels[mode].pillBg, color: "#fff",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "left 180ms ease, background 180ms ease", textTransform: "uppercase",
              }}
            >{labels[mode].text}</span>
            <span
              aria-hidden
              style={{
                position: "absolute", inset: 0, display: "flex",
                alignItems: "center", justifyContent: "space-around",
                fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "rgba(0,0,0,0.35)",
              }}
            >
              <span style={{ visibility: mode === "before" ? "hidden" : "visible", width: 64, textAlign: "center" }}>Before</span>
              <span style={{ visibility: mode === "after" ? "hidden" : "visible", width: 64, textAlign: "center" }}>After</span>
              <span style={{ visibility: mode === "snapshot" ? "hidden" : "visible", width: 64, textAlign: "center" }}>Snap</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Hide style toggle"
            title="Hide"
            style={{ width: 22, height: 22, borderRadius: 9999, border: "1px solid rgba(0,0,0,0.08)", background: "transparent", color: "#71717a", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}
          >×</button>
        </div>

        {/* Mode caption */}
        <div style={{ fontSize: 10, color: "#52525b", lineHeight: 1.35 }}>
          {mode === "after" && "Live build."}
          {mode === "before" && "CSS simulation of pre-refactor styling. Approximate, not exact."}
          {mode === "snapshot" && snapshotExists === true && "Real screenshot of pre-refactor build. Drag the slider to compare."}
          {mode === "snapshot" && snapshotExists === false && (
            <>No snapshot at <code style={{ background: "#f4f4f5", padding: "0 4px", borderRadius: 3 }}>{snapshotPathForRoute(location.pathname)}</code>. Capture it from the previous build and commit to <code style={{ background: "#f4f4f5", padding: "0 4px", borderRadius: 3 }}>public/before-snapshots/</code>.</>
          )}
          {mode === "snapshot" && snapshotExists === null && "Loading snapshot…"}
        </div>

        {/* Wipe slider — only relevant in snapshot mode with image present */}
        {mode === "snapshot" && snapshotExists && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "#71717a", letterSpacing: "0.1em", textTransform: "uppercase" }}>Wipe</span>
            <input
              type="range"
              min={0}
              max={100}
              value={wipe}
              onChange={(e) => setWipe(Number(e.target.value))}
              style={{ flex: 1 }}
              aria-label="Snapshot wipe position"
            />
            <span style={{ fontSize: 10, color: "#52525b", width: 28, textAlign: "right" }}>{wipe}%</span>
          </div>
        )}
      </div>
    </>
  );
}
