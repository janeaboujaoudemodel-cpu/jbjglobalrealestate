import { AlertTriangle, Lock, RefreshCw, X } from "lucide-react";
import { friendlyBackendError } from "@/utils/friendlyBackendError";

interface Props {
  error: unknown;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline banner used by broker pages to surface 400/409/RLS errors in a
 * controlled way — replaces blank screens and raw "row-level security
 * policy" strings with a calm, branded message.
 */
export function BackendErrorBanner({ error, onRetry, onDismiss, className }: Props) {
  if (!error) return null;
  const f = friendlyBackendError(error);
  const isPerm = f.status === 401 || f.status === 403;
  const Icon = isPerm ? Lock : AlertTriangle;

  return (
    <div
      role="alert"
      data-no-contrast-guard
      className={
        "relative flex items-start gap-3 rounded-[14px] border border-[#B89555]/40 " +
        "bg-[#FDFBF7] px-4 py-3 text-[#1A1A1A] shadow-[0_10px_28px_-22px_rgba(26,26,26,0.5)] " +
        (className ?? "")
      }
    >
      <span
        aria-hidden
        data-emerald-ok="icon"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
        style={{ background: "var(--jj-emerald-ombre, linear-gradient(135deg,#064E3B,#10B981))" }}
      >
        <Icon className="h-4 w-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} strokeWidth={2.6} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-tight">{f.title}</div>
        <div className="mt-0.5 text-[12.5px] leading-snug text-[#1A1A1A]/85">{f.message}</div>
        {f.hint && <div className="mt-1 text-[11.5px] text-[#1A1A1A]/65">{f.hint}</div>}
        {(onRetry || onDismiss) && (
          <div className="mt-2 flex items-center gap-2">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="jj-pill-emerald-metallic inline-flex h-7 items-center gap-1 rounded-full px-3 text-[11px] font-semibold"
              >
                <RefreshCw className="h-3 w-3" /> Try again
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex h-7 items-center gap-1 rounded-full border border-[#B89555]/40 bg-white px-3 text-[11px] font-semibold text-[#1A1A1A]/80 hover:bg-[#F7F2EA]"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-[#1A1A1A]/60 hover:bg-[#F7F2EA] hover:text-[#1A1A1A]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default BackendErrorBanner;
