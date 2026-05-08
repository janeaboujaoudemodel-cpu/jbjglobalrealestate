// Helpers to detect Resend quota rejections (HTTP 429 from quotaGuardedFetch
// or upstream `daily_quota_exceeded`) and format a friendly UI message.

export interface QuotaInfo {
  sent_today?: number;
  daily_limit?: number;
  sent_month?: number;
  monthly_limit?: number;
}

export interface QuotaErrorDetails {
  isQuota: boolean;
  scope: "daily" | "monthly" | "rate" | "unknown";
  message: string;
  quota?: QuotaInfo;
}

const QUOTA_HINTS = [
  "DAILY_LIMIT_REACHED",
  "MONTHLY_LIMIT_REACHED",
  "QUOTA_REJECTED",
  "daily_quota_exceeded",
  "rate_limit_exceeded",
  "Too many requests",
];

export function parseQuotaError(err: unknown): QuotaErrorDetails {
  const blob = serialize(err);
  const lower = blob.toLowerCase();

  const hit = QUOTA_HINTS.find((h) => blob.includes(h) || lower.includes(h.toLowerCase()));
  if (!hit) return { isQuota: false, scope: "unknown", message: "" };

  // Try to recover the structured `quota` payload from quotaGuardedFetch.
  let quota: QuotaInfo | undefined;
  try {
    const m = blob.match(/\{[^]*"quota"\s*:\s*(\{[^}]*\})/);
    if (m?.[1]) quota = JSON.parse(m[1]);
  } catch { /* ignore */ }

  const scope: QuotaErrorDetails["scope"] =
    blob.includes("DAILY_LIMIT") || lower.includes("daily_quota_exceeded")
      ? "daily"
      : blob.includes("MONTHLY_LIMIT")
      ? "monthly"
      : lower.includes("rate") || lower.includes("too many")
      ? "rate"
      : "unknown";

  const message =
    scope === "daily"
      ? "Daily email cap reached on Resend free plan. Sends resume after UTC midnight."
      : scope === "monthly"
      ? "Monthly email cap reached on Resend free plan. Sends paused until next 30-day window."
      : scope === "rate"
      ? "Resend rate limit hit (2 req/s). The system will throttle and retry — try again in a few seconds."
      : "Resend rejected the send (quota).";

  return { isQuota: true, scope, message, quota };
}

export function formatRemaining(sentToday: number, dailyLimit: number): string {
  const left = Math.max(0, dailyLimit - sentToday);
  return `${left.toLocaleString()} of ${dailyLimit.toLocaleString()} emails left today`;
}

function serialize(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    // Supabase FunctionsHttpError exposes `context` with the response body.
    const ctx = (err as any).context;
    return [err.message, safeJson(ctx)].filter(Boolean).join(" ");
  }
  return safeJson(err);
}

function safeJson(v: unknown): string {
  try { return JSON.stringify(v); } catch { return String(v); }
}
