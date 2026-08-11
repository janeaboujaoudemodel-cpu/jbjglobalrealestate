/**
 * ThemeModeContext — the site-wide Sun / Moon switch.
 *
 * Sun  = the existing champagne/gold day theme (primary = champagne, ink = black).
 * Moon = reversed logic: primary becomes the emerald→black pair gradient with
 *        PURE WHITE content, and champagne/gold becomes the secondary accent
 *        (always with black ink on top of it — Contrast Guard rule).
 *
 * Scope rules (locked by the owner):
 *  - Standard users: the chosen mode applies to BOTH the public site and their
 *    own back-office surfaces.
 *  - Owner: the mode applies to the PUBLIC front end only. The owner's back end
 *    (/owner, /crm, …) never changes — we set `data-jbj-backend-lock="1"` on
 *    <html> for those routes so the moon stylesheet stops matching.
 *
 * The moon stylesheet is imported lazily, so a Sun-mode visitor never pays the
 * style-recalculation cost of the inversion layer.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export type ThemeMode = "sun" | "moon";

const STORAGE_KEY = "jbj-theme-mode";

interface ThemeModeContextValue {
  mode: ThemeMode;
  isMoon: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: "sun",
  isMoon: false,
  setMode: () => {},
  toggleMode: () => {},
});

export const useThemeMode = () => useContext(ThemeModeContext);

function readStoredMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "moon" ? "moon" : "sun";
  } catch {
    return "sun";
  }
}

/** Owner back-office route prefixes that must stay on the fixed emerald CRM skin. */
const OWNER_BACKEND_PREFIXES = [
  "/owner",
  "/crm",
  "/admin",
];

function isOwnerBackendPath(pathname: string) {
  return OWNER_BACKEND_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

let moonSheetLoaded = false;

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isOwner } = useAuth();
  const { pathname } = useLocation();
  const [mode, setModeState] = useState<ThemeMode>(() =>
    typeof window === "undefined" ? "sun" : readStoredMode(),
  );

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private-mode browsers: in-memory only */
    }
  }, []);

  const toggleMode = useCallback(
    () => setMode(mode === "moon" ? "sun" : "moon"),
    [mode, setMode],
  );

  // Owner keeps a fixed back end; every other user carries the theme everywhere.
  const backendLocked = isOwner && isOwnerBackendPath(pathname);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-jbj-theme", mode);
    if (backendLocked) root.setAttribute("data-jbj-backend-lock", "1");
    else root.removeAttribute("data-jbj-backend-lock");

    if (mode === "moon" && !moonSheetLoaded) {
      moonSheetLoaded = true;
      import("@/styles/theme-moon.css").catch(() => {
        moonSheetLoaded = false;
      });
    }
  }, [mode, backendLocked]);

  const value = useMemo(
    () => ({ mode, isMoon: mode === "moon", setMode, toggleMode }),
    [mode, setMode, toggleMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export default ThemeModeProvider;
