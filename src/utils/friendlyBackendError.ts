/**
 * Maps raw backend / PostgREST / Supabase errors (especially 400 + 409 RLS
 * responses) into short, human-readable messages for broker-facing UI.
 *
 * Broker hooks / pages previously surfaced raw strings like
 *   "new row violates row-level security policy for table ..."
 * which look like the app is broken. This helper normalises them.
 */

export type FriendlyBackendError = {
  /** Short title suitable for toast / banner heading */
  title: string;
  /** Plain-English explanation for the user */
  message: string;
  /** Optional next-step hint */
  hint?: string;
  /** Original status code if we could detect one */
  status?: number;
  /** PostgREST / Postgres code if present (e.g. "23505", "42501", "PGRST301") */
  code?: string;
  /** Original raw message — kept for logging, never shown by default */
  raw?: string;
};

const pickStatus = (err: any): number | undefined => {
  const s = err?.status ?? err?.statusCode ?? err?.code;
  const n = typeof s === "string" ? Number(s) : s;
  return Number.isFinite(n) ? (n as number) : undefined;
};

const pickCode = (err: any): string | undefined =>
  err?.code ?? err?.details?.code ?? err?.error?.code ?? undefined;

const pickRawMessage = (err: any): string =>
  (err?.message ||
    err?.error_description ||
    err?.error?.message ||
    err?.details ||
    (typeof err === "string" ? err : "") ||
    "") as string;

/** Match Postgres/PostgREST RLS + permission signatures */
const isRlsViolation = (msg: string, code?: string) =>
  /row-level security/i.test(msg) ||
  /violates row-level security/i.test(msg) ||
  /permission denied for (table|relation)/i.test(msg) ||
  code === "42501" ||
  code === "PGRST301" ||
  code === "PGRST116";

const isUniqueViolation = (msg: string, code?: string) =>
  code === "23505" || /duplicate key value|already exists/i.test(msg);

const isFkViolation = (msg: string, code?: string) =>
  code === "23503" || /foreign key/i.test(msg);

const isNotNull = (msg: string, code?: string) =>
  code === "23502" || /null value in column/i.test(msg);

const isCheckViolation = (msg: string, code?: string) =>
  code === "23514" || /violates check constraint/i.test(msg);

export function friendlyBackendError(err: unknown): FriendlyBackendError {
  const raw = pickRawMessage(err);
  const status = pickStatus(err);
  const code = pickCode(err);

  // 409 conflicts — surface as a clear "already exists"
  if (status === 409 || isUniqueViolation(raw, code)) {
    return {
      title: "Already exists",
      message:
        "A record with the same details already exists. Open the existing entry instead of creating a duplicate.",
      hint: "Try searching your pipeline before adding it again.",
      status: status ?? 409,
      code,
      raw,
    };
  }

  // 401 / 403 / RLS — user is signed-in but lacks permission
  if (status === 401 || status === 403 || isRlsViolation(raw, code)) {
    return {
      title: "You don't have access to this",
      message:
        "Your broker account isn't permitted to view or change this record. If you believe this is wrong, ask your team admin to grant access.",
      hint: "Tip: make sure you're signed in with the correct broker email.",
      status: status ?? 403,
      code,
      raw,
    };
  }

  // 400 — validation / shape problems
  if (status === 400 || isNotNull(raw, code) || isCheckViolation(raw, code) || isFkViolation(raw, code)) {
    let message =
      "Some required information is missing or invalid. Please review the form and try again.";
    if (isNotNull(raw, code)) message = "A required field was left empty. Please fill it in and try again.";
    if (isFkViolation(raw, code))
      message =
        "This record references something that no longer exists (it may have been deleted). Refresh the page and retry.";
    return {
      title: "We couldn't save that",
      message,
      status: status ?? 400,
      code,
      raw,
    };
  }

  // 429 — rate limited
  if (status === 429 || /rate limit|too many/i.test(raw)) {
    return {
      title: "Slow down a moment",
      message: "You've made too many requests in a short time. Please wait a few seconds and try again.",
      status: 429,
      code,
      raw,
    };
  }

  // 5xx — backend trouble
  if (typeof status === "number" && status >= 500) {
    return {
      title: "Backend is having trouble",
      message:
        "The server didn't respond as expected. Please retry in a moment — your work hasn't been lost.",
      status,
      code,
      raw,
    };
  }

  // Network / offline
  if (/network|fetch failed|failed to fetch|offline/i.test(raw)) {
    return {
      title: "Network problem",
      message: "We couldn't reach the server. Check your connection and try again.",
      code,
      raw,
    };
  }

  // Fallback — still readable, never the raw RLS string
  return {
    title: "Something went wrong",
    message:
      raw && raw.length < 140 && !/row-level|permission denied|PGRST/i.test(raw)
        ? raw
        : "We hit an unexpected error. Please try again — if it persists, contact support.",
    status,
    code,
    raw,
  };
}

/** One-liner for toast.error() calls inside broker hooks. */
export function friendlyBackendMessage(err: unknown): string {
  const f = friendlyBackendError(err);
  return f.hint ? `${f.message} ${f.hint}` : f.message;
}
