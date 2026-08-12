/**
 * PostLoginRedirect — completes the social sign-in return trip.
 *
 * Full-page Google/Apple OAuth must return to a public same-origin URL
 * (window.location.origin), so the browser lands on "/" and the intended
 * destination lives in sessionStorage. /auth consumes it for password logins;
 * this mount consumes it for the OAuth round-trip, once the session exists.
 */
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const KEY = "jbj_post_login_redirect";
const STAMP_KEY = "jbj_post_login_redirect_at";
const MAX_AGE_MS = 10 * 60 * 1000;

export const PostLoginRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    // /auth owns its own redirect chain; never race it.
    if (location.pathname !== "/") return;

    let target: string | null = null;
    let stamp = 0;
    try {
      target = sessionStorage.getItem(KEY);
      stamp = Number(sessionStorage.getItem(STAMP_KEY) || "0");
    } catch {
      return;
    }
    if (!target) return;

    const clear = () => {
      try {
        sessionStorage.removeItem(KEY);
        sessionStorage.removeItem(STAMP_KEY);
      } catch { /* ignore */ }
    };

    const fresh = !stamp || Date.now() - stamp < MAX_AGE_MS;
    const safe = target.startsWith("/") && !target.startsWith("//") && target !== "/";
    clear();
    if (fresh && safe) navigate(target, { replace: true });
  }, [user, loading, location.pathname, navigate]);

  return null;
};

export default PostLoginRedirect;
