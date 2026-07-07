import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * OAuth 2.1 consent screen for the app's MCP server.
 * Mounted at /.lovable/oauth/consent — Supabase Auth redirects here when an
 * external MCP client (ChatGPT, Claude, Cursor, etc.) requests authorization.
 */
type SbOAuth = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

function oauthApi(): SbOAuth {
  // `supabase.auth.oauth` is beta and not yet in the generated types.
  return (supabase.auth as unknown as { oauth: SbOAuth }).oauth;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the full consent URL so the user is returned here after sign-in.
        const returnTo = window.location.pathname + window.location.search;
        window.location.href = "/auth?returnTo=" + encodeURIComponent(returnTo);
        return;
      }
      try {
        const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) {
          setError(error.message);
          return;
        }
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to load authorization request");
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const api = oauthApi();
      const { data, error } = approve
        ? await api.approveAuthorization(authorizationId)
        : await api.denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        setError(error.message);
        return;
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        setError("No redirect returned by the authorization server.");
        return;
      }
      window.location.href = target;
    } catch (e: any) {
      setBusy(false);
      setError(e?.message ?? "Failed to complete authorization");
    }
  }

  const clientName = details?.client?.name ?? "an external app";

  return (
    <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-[#B89555]/30 rounded-lg p-8 shadow-sm">
        <div className="text-[11px] tracking-[0.22em] uppercase text-[#1A1A1A]/60 mb-3">
          JBJ Global Real Estate
        </div>
        {error ? (
          <>
            <h1 className="text-lg font-semibold text-[#1A1A1A] mb-2">
              Authorization unavailable
            </h1>
            <p className="text-sm text-[#1A1A1A]/70">{error}</p>
          </>
        ) : !details ? (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-[#B89555]/30 border-t-[#B89555] animate-spin mb-4" />
            <p className="text-sm text-[#1A1A1A]/70">Loading authorization request…</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-[#1A1A1A] mb-2">
              Connect {clientName} to your JBJ account
            </h1>
            <p className="text-sm text-[#1A1A1A]/70 mb-6">
              This lets {clientName} call JBJ MCP tools on your behalf. You can
              revoke access at any time from your account settings.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-md bg-[#064E3B] text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-md border border-[#1A1A1A]/20 bg-white text-[#1A1A1A] px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Deny
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
