// Zoho CRM proxy — backend scaffold for the JBJ CRM shell.
// Routes read/write requests to the Lovable connector gateway using the
// linked Zoho CRM connection. UI is intentionally not built out yet;
// this exists so module pages (Leads first, then Contacts/Accounts/Deals/
// Tasks) can wire live data without leaking the access token to the client.
//
// Request body:
//   { op: "list" | "get" | "search" | "create" | "update" | "delete",
//     module: "Leads" | "Contacts" | "Accounts" | "Deals" | "Tasks" | ...,
//     id?: string,
//     fields?: string[],
//     page?: number, per_page?: number,
//     criteria?: string,          // Zoho COQL-ish search
//     data?: Record<string, any> | Record<string, any>[] }
//
// Response mirrors Zoho v6 shape: { data, info? } or { error }.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/zoho_crm";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const ZOHO_CRM_API_KEY = Deno.env.get("ZOHO_CRM_API_KEY");

const ALLOWED_MODULES = new Set([
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Tasks",
  "Calls",
  "Meetings",
  "Products",
  "Quotes",
  "Invoices",
  "Cases",
]);

type Op = "list" | "get" | "search" | "create" | "update" | "delete";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGateway(path: string, init: RequestInit = {}) {
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": ZOHO_CRM_API_KEY!,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return { status: 204, body: { data: [] } };
  let body: any = null;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!LOVABLE_API_KEY || !ZOHO_CRM_API_KEY) {
    return json(
      { error: "Zoho CRM connector is not linked. Link the Zoho CRM connector to enable this proxy." },
      503,
    );
  }

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }

  const op = payload?.op as Op;
  const module = String(payload?.module ?? "");
  if (!ALLOWED_MODULES.has(module)) return json({ error: `Unsupported module: ${module}` }, 400);
  if (!op) return json({ error: "Missing op" }, 400);

  try {
    switch (op) {
      case "list": {
        const fields = Array.isArray(payload.fields) && payload.fields.length
          ? payload.fields.join(",")
          : "id";
        const page = Number(payload.page ?? 1);
        const perPage = Math.min(200, Number(payload.per_page ?? 50));
        const qs = `fields=${encodeURIComponent(fields)}&page=${page}&per_page=${perPage}`;
        const { status, body } = await callGateway(`/${module}?${qs}`);
        return json(body ?? { data: [] }, status === 204 ? 200 : status);
      }
      case "get": {
        if (!payload.id) return json({ error: "Missing id" }, 400);
        const { status, body } = await callGateway(`/${module}/${encodeURIComponent(payload.id)}`);
        return json(body ?? {}, status);
      }
      case "search": {
        if (!payload.criteria) return json({ error: "Missing criteria" }, 400);
        const fields = Array.isArray(payload.fields) && payload.fields.length
          ? `&fields=${encodeURIComponent(payload.fields.join(","))}`
          : "";
        const qs = `criteria=${encodeURIComponent(payload.criteria)}${fields}`;
        const { status, body } = await callGateway(`/${module}/search?${qs}`);
        return json(body ?? { data: [] }, status === 204 ? 200 : status);
      }
      case "create": {
        const rows = Array.isArray(payload.data) ? payload.data : [payload.data];
        const { status, body } = await callGateway(`/${module}`, {
          method: "POST",
          body: JSON.stringify({ data: rows }),
        });
        return json(body ?? {}, status);
      }
      case "update": {
        const rows = Array.isArray(payload.data) ? payload.data : [payload.data];
        const { status, body } = await callGateway(`/${module}`, {
          method: "PUT",
          body: JSON.stringify({ data: rows }),
        });
        return json(body ?? {}, status);
      }
      case "delete": {
        if (!payload.id) return json({ error: "Missing id" }, 400);
        const { status, body } = await callGateway(
          `/${module}/${encodeURIComponent(payload.id)}`,
          { method: "DELETE" },
        );
        return json(body ?? {}, status);
      }
      default:
        return json({ error: `Unsupported op: ${op}` }, 400);
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
