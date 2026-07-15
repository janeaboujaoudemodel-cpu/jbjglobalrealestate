import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * SiteAccessGate — Gated access
 *
 * Requires an authenticated session to enter the site.
 * Anonymous visitors are redirected to /access (the public landing/gate).
 * A small allow-list keeps auth, signup, and the gate itself reachable.
 */

const PUBLIC_PATHS = [
  "/access",
  "/signup",
  "/login",
  "/auth",
  "/reset-password",
  "/forgot-password",
  "/checkout",
  "/legal",
  "/privacy",
  "/terms",
  "/cookies",
  "/aml",
  "/aml-kyc",
  "/welcome",
  "/oauth",
  "/.lovable/oauth",
  // Token-based public routes used by emailed action links —
  // these carry their own auth (token/signature) and must remain
  // reachable without a logged-in session.
  "/sign",
  "/documents/sign",
  "/broker/agreement",
  "/broker/activate",
  "/card",
  "/ticket-survey",
  "/survey",
  "/book",
  "/d",
  "/coming-soon",
  "/maintenance",
  "/403",
  // Public marketing / conversion surfaces — reachable without a session.
  "/membership",
  "/insights",
  "/library",
  "/academy",
  "/agencies",
  "/success-stories",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function isLocalPlaywrightPreview() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  const localHost = host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
  return localHost && window.navigator.webdriver === true;
}

export default function SiteAccessGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (isPublicPath(location.pathname) || isLocalPlaywrightPreview()) return <>{children}</>;
  if (loading) return null;
  if (!user) {
    return <Navigate to="/access" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
