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
import { Loader2, AlertTriangle, FileText } from "lucide-react";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";

function decodeUrlParam(s: string | null): string {
  if (!s) return "";
  try {
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
  const [state, setState] = useState<"ready" | "loading" | "ok" | "fallback">("ready");

  // Route through our backend download-file proxy when the target is a
  // Supabase storage URL — this streams the file with Content-Disposition
  // attachment and is NOT blocked by desktop ad-blockers (the raw
  // *.supabase.co URL often is).
  const proxiedTarget = target ? maybeProxyStorageUrl(target, { filename, disposition: "attachment" }) : "";

  const triggerDownload = async () => {
    if (!proxiedTarget) { setState("fallback"); return; }
    setState("loading");
    try {
      const res = await fetch(proxiedTarget, { credentials: "omit" });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
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
      setState("fallback");
    }
  };

  // Auto-start on mount so users land on a "preparing your download" screen.
  useEffect(() => { triggerDownload(); /* eslint-disable-next-line */ }, []);

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
            <FileText className="w-8 h-8 mx-auto mb-4 text-[#1A1A1A]" />
            <div className="text-base font-semibold text-[#1A1A1A]">Download started</div>
            <div className="text-xs text-[#1A1A1A]/60 mt-2">Check your downloads folder for <strong>{filename}</strong>.</div>
            <button type="button" onClick={triggerDownload} className="mt-5 inline-block text-[11px] tracking-[0.18em] uppercase text-[#B89555] underline">
              Didn't start? Download again
            </button>
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
                href={proxiedTarget || target}
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
