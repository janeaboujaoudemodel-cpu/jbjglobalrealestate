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

export default function SiteAccessGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    // Fast path: if a locally-persisted session exists, treat the visitor as
    // authenticated immediately so that the redirect-to-/access race after
    // sign-in doesn't fire. We still revalidate with getUser() in the
    // background and only sign the user out if the server explicitly rejects
    // the session (SIGNED_OUT via onAuthStateChange also clears it).
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        setAuthed(true);
        setReady(true);
      }
    });
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      // Only downgrade to unauth if the auth server explicitly says the token
      // is invalid (401 / user missing). Network hiccups must not evict the
      // user — the session listener will catch a real sign-out.
      const invalidToken = error && /jwt|token|expired|invalid|not.?found/i.test(error.message ?? "");
      if (data.user) setAuthed(true);
      else if (invalidToken) setAuthed(false);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setAuthed(false);
      else if (session?.user) setAuthed(true);
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
