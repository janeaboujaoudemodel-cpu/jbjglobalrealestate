// Shared admin guard + service client for the Admin Email Inbox edge functions.
// Every provider call happens server side; no provider token ever reaches the browser.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const inboxCors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...inboxCors, "Content-Type": "application/json" },
  });
}

export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export interface InboxAuthResult {
  response: Response | null;
  userId: string;
  email: string;
  isCron: boolean;
  admin: SupabaseClient;
}

/**
 * Requires an authenticated admin/owner caller, OR a valid cron shared secret
 * (used by the 5-minute pg_cron sync schedule).
 */
export async function requireInboxAdmin(req: Request): Promise<InboxAuthResult> {
  const admin = serviceClient();

  const cronSecret = req.headers.get("x-cron-secret");
  const expectedCron = Deno.env.get("CRON_SHARED_SECRET");
  if (cronSecret && expectedCron && cronSecret === expectedCron) {
    return { response: null, userId: "", email: "cron", isCron: true, admin };
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return {
      response: jsonResponse({ error: "Authentication required" }, 401),
      userId: "",
      email: "",
      isCron: false,
      admin,
    };
  }

  const token = authHeader.slice(7);
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) {
    return {
      response: jsonResponse({ error: "Invalid session" }, 401),
      userId: "",
      email: "",
      isCron: false,
      admin,
    };
  }

  const user = data.user;
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const allowed = (roles ?? []).some((r: { role: string }) =>
    ["admin", "owner", "super_admin"].includes(r.role)
  );

  if (!allowed) {
    return {
      response: jsonResponse({ error: "Admin access required" }, 403),
      userId: user.id,
      email: user.email ?? "",
      isCron: false,
      admin,
    };
  }

  return {
    response: null,
    userId: user.id,
    email: user.email ?? "",
    isCron: false,
    admin,
  };
}
