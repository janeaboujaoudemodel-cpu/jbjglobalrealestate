import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function SiteAccessGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (isPublicPath(location.pathname)) return <>{children}</>;
  if (!ready) return null;
  if (!authed) {
    return <Navigate to="/access" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
