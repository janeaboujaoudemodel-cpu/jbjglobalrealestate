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
import { anonHeaders } from "@/config/backend";

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
      const res = await fetch(proxiedTarget, { credentials: "omit", headers: anonHeaders() });
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
      <div className="w-full max-w-lg bg-white border border-[#B89555]/40 rounded-md p-10 text-center shadow-sm">
        <div className="text-[10px] tracking-[0.28em] uppercase text-[#B89555] mb-3 font-semibold">
          JBJ Global Real Estate LLC SOC
        </div>
        <div className="h-px w-16 bg-[#B89555] mx-auto mb-6" />
        <FileText className="w-10 h-10 mx-auto mb-4 text-[#1A1A1A]" />
        <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Your document is ready</h1>
        <p className="text-sm text-[#1A1A1A]/70 mb-1">
          <strong className="text-[#1A1A1A]">{filename}</strong>
        </p>
        <p className="text-xs text-[#1A1A1A]/60 mb-6">
          Tap the button below to save the document to your device. The file is delivered securely from JBJ Global Real Estate.
        </p>

        {state === "loading" && (
          <div className="flex items-center justify-center gap-2 text-[#1A1A1A]/70 text-sm mb-4">
            <Loader2 className="w-4 h-4 animate-spin text-[#B89555]" /> Preparing your download…
          </div>
        )}
        {state === "ok" && (
          <div className="text-xs text-emerald-700 mb-4">
            Download started — check your downloads folder.
          </div>
        )}
        {state === "fallback" && (
          <div className="flex items-center justify-center gap-2 text-[#1A1A1A]/70 text-xs mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-[#B89555]" />
            Tap the button to download manually.
          </div>
        )}

        <button
          type="button"
          onClick={triggerDownload}
          disabled={!target || state === "loading"}
          className="inline-block w-full px-6 py-3 bg-[#1A1A1A] text-[#FDFBF7] text-[12px] tracking-[0.22em] uppercase font-bold border border-[#B89555] hover:bg-[#1A1A1A]/90 disabled:opacity-60"
        >
          {state === "loading" ? "Preparing…" : `Download ${filename}`}
        </button>

        {!target && (
          <div className="text-xs text-[#1A1A1A]/60 mt-4">No document URL provided.</div>
        )}

        <div className="mt-8 pt-6 border-t border-[#B89555]/20 text-[10px] text-[#1A1A1A]/50 tracking-[0.18em] uppercase">
          Secure delivery · JBJ.AE
        </div>
      </div>
    </div>
  );
}
