/**
 * PASS 299 — GATED VS PUBLIC ESCALATION (LOCKED)
 *
 * Chat, internal search and every advisory hand-off that happens *inside* the
 * gated portal can only be reached by a signed-in account. So an escalation
 * from those routes must always carry a session: we never mint an "anonymous"
 * ticket there. Only the open marketing site may produce a guest ticket.
 *
 * Keep this list in sync with supabase/functions/advisory-desk-request GATED_PREFIXES.
 */
export const GATED_ROUTE_PREFIXES = [
  "/owner",
  "/admin",
  "/crm",
  "/broker",
  "/broker-portal",
  "/agent",
  "/developer-portal",
  "/dashboard",
  "/account",
  "/my-",
  "/portal",
  "/investor",
  "/client",
  "/saved",
  "/shortlist",
];

/** True when the given path lives behind the login wall. */
export function isGatedRoute(pathname: string = typeof window !== "undefined" ? window.location.pathname : "/"): boolean {
  const path = (pathname || "").toLowerCase();
  if (!path) return false;
  return GATED_ROUTE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(p));
}
