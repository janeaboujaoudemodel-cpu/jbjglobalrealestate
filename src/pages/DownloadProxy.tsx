/**
 * /d — Branded download proxy.
 *
 * The visible URL stays on jbj.ae (which no ad-blocker filters), then we
 * fetch the underlying signed URL as a blob and trigger a client-side
 * download. Falls back to a direct link if the blob fetch is blocked.
 *
 * Query params:
 *   u  base64url-encoded target URL (signed Supabase storage URL)
 *   n  optional filename to suggest in the download dialog
 */
import { useEffect, useState } from "react";
import { Loader2, Download, AlertTriangle } from "lucide-react";

function decodeUrlParam(s: string | null): string {
  if (!s) return "";
  try {
    // base64url → base64
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(s.length + ((4 - (s.length % 4)) % 4), "=");
    return decodeURIComponent(escape(atob(b64)));
  } catch {
    try { return decodeURIComponent(s); } catch { return s; }
  }
}

export default function DownloadProxy() {
  const params = new URLSearchParams(window.location.search);
  const target = decodeUrlParam(params.get("u"));
  const filename = params.get("n") || "document.pdf";
  const [state, setState] = useState<"loading" | "ok" | "fallback">("loading");

  useEffect(() => {
    if (!target) { setState("fallback"); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(target, { credentials: "omit" });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        setState("ok");
      } catch {
        if (!cancelled) setState("fallback");
      }
    })();
    return () => { cancelled = true; };
  }, [target, filename]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-[#B89555]/40 rounded-md p-8 text-center">
        <div className="text-[10px] tracking-[0.22em] uppercase text-[#1A1A1A]/60 mb-3">
          JBJ Global Real Estate
        </div>
        {state === "loading" && (
          <>
            <Loader2 className="w-8 h-8 mx-auto mb-4 text-[#B89555] animate-spin" />
            <div className="text-base font-semibold text-[#1A1A1A]">Preparing your document…</div>
            <div className="text-xs text-[#1A1A1A]/60 mt-2">Your download will start automatically.</div>
          </>
        )}
        {state === "ok" && (
          <>
            <Download className="w-8 h-8 mx-auto mb-4 text-[#1A1A1A]" />
            <div className="text-base font-semibold text-[#1A1A1A]">Download started</div>
            <div className="text-xs text-[#1A1A1A]/60 mt-2">Check your downloads folder for <strong>{filename}</strong>.</div>
            {target && (
              <a
                href={target}
                target="_blank"
                rel="noopener"
                className="mt-5 inline-block text-[11px] tracking-[0.18em] uppercase text-[#B89555] underline"
              >
                Didn't start? Open directly
              </a>
            )}
          </>
        )}
        {state === "fallback" && (
          <>
            <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-[#B89555]" />
            <div className="text-base font-semibold text-[#1A1A1A]">Open document manually</div>
            <div className="text-xs text-[#1A1A1A]/60 mt-2 mb-5">
              Tap the button below to open your file in a new tab.
            </div>
            {target ? (
              <a
                href={target}
                target="_blank"
                rel="noopener"
                download={filename}
                className="inline-block px-6 py-3 bg-[#1A1A1A] text-[#FDFBF7] text-[12px] tracking-[0.22em] uppercase font-bold border border-[#B89555] no-underline"
              >
                Download {filename}
              </a>
            ) : (
              <div className="text-xs text-[#1A1A1A]/60">No document URL provided.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
