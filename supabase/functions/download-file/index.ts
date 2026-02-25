import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, cf-connecting-ip, x-forwarded-for, x-real-ip",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sanitizeFilename(value: string) {
  const trimmed = value.trim().slice(0, 140);
  return trimmed.replace(/[\u0000-\u001F\u007F]/g, "").replace(/[\\/]/g, "-");
}

function parseStorageObjectPath(pathname: string): { visibility: string; bucket: string; objectPath: string } | null {
  const match = pathname.match(/\/storage\/v1\/object\/(public|sign|authenticated)\/([^/]+)\/(.+)$/i);
  if (!match) return null;

  const [, visibility, bucket, rawPath] = match;
  const objectPath = (() => {
    try {
      return decodeURIComponent(rawPath);
    } catch {
      return rawPath;
    }
  })();

  return { visibility: visibility.toLowerCase(), bucket, objectPath };
}

// Trusted image/document CDN domains we allow proxying
const ALLOWED_DOMAINS = [
  "reelly.io",
  "reelly-assets",
  "cloudfront.net",
  "provident.ae",
  "bayut.com",
  "propertyfinder.ae",
  "dubizzle.com",
  "zaapi.ae",
  "emaar.com",
  "damacproperties.com",
  "sobharealty.com",
  "meraas.com",
  "nakheel.com",
  "aldar.com",
  "ellington.ae",
  "object.properties",
  "select.ae",
  "uploads.mangopulse",
  "cdn.sanity.io",
  "images.unsplash.com",
];

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const ownerEmail = (Deno.env.get("OWNER_EMAIL") || "").toLowerCase();

  try {
    const requestUrl = new URL(req.url);
    const target = requestUrl.searchParams.get("url") || "";
    const filenameParam = requestUrl.searchParams.get("filename") || undefined;

    if (!target) return json(400, { error: "Missing url" });

    const targetUrl = new URL(target);

    // Security: allow our own storage origin OR trusted CDN domains
    const isOwnStorage = supabaseUrl && targetUrl.origin === new URL(supabaseUrl).origin;
    const isTrustedCdn = ALLOWED_DOMAINS.some(domain => targetUrl.hostname.includes(domain));

    if (!isOwnStorage && !isTrustedCdn) {
      return json(400, { error: "URL not allowed" });
    }

    // For own storage, still require storage path
    if (isOwnStorage && !targetUrl.pathname.includes("/storage/v1/")) {
      return json(400, { error: "Only storage URLs are allowed" });
    }

    const contentDispositionParam = requestUrl.searchParams.get("disposition") || "attachment";
    const disposition = contentDispositionParam === "inline" ? "inline" : "attachment";
    const filename = filenameParam ? sanitizeFilename(filenameParam) : undefined;

    const buildHeaders = (contentType: string, contentLength?: string) => {
      const headers = new Headers({
        ...corsHeaders,
        "Content-Type": contentType || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
      });

      if (contentLength) headers.set("Content-Length", contentLength);
      if (filename) {
        headers.set("Content-Disposition", `${disposition}; filename="${filename}"`);
      } else {
        headers.set("Content-Disposition", disposition);
      }

      return headers;
    };

    // 1) First try direct upstream fetch (works for public/signed URLs)
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "JBJ-Download-Proxy/1.1",
      },
    });

    if (upstream.ok && upstream.body) {
      const contentType = upstream.headers.get("content-type") || "application/octet-stream";
      const contentLength = upstream.headers.get("content-length") || undefined;
      return new Response(upstream.body, {
        status: 200,
        headers: buildHeaders(contentType, contentLength),
      });
    }

    // 2) Fallback for private storage objects: privileged users only
    if (!isOwnStorage) {
      return json(upstream.status || 502, { error: "Upstream download failed" });
    }

    const parsed = parseStorageObjectPath(targetUrl.pathname);
    if (!parsed) {
      return json(upstream.status || 502, { error: "Upstream download failed" });
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) {
      return json(401, { error: "Authentication required to access this file" });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authErr } = await userClient.auth.getUser();
    if (authErr || !userData?.user) {
      return json(401, { error: "Invalid authentication token" });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const userEmail = (userData.user.email || "").toLowerCase();
    let isPrivileged = ownerEmail !== "" && userEmail === ownerEmail;

    if (!isPrivileged) {
      const { data: profile } = await adminClient
        .from("profiles")
        .select("user_role")
        .eq("id", userData.user.id)
        .maybeSingle();

      const userRole = (profile as any)?.user_role;
      if (typeof userRole === "string") {
        isPrivileged = ["owner", "admin", "owner_admin", "hr_admin", "super_admin"].includes(userRole.toLowerCase());
      }
    }

    if (!isPrivileged) {
      const { data: crmUser } = await adminClient
        .from("crm_users_profile")
        .select("crm_role, is_active")
        .eq("user_id", userData.user.id)
        .eq("is_active", true)
        .maybeSingle();

      const crmRole = (crmUser as any)?.crm_role;
      if (typeof crmRole === "string") {
        isPrivileged = ["owner_admin", "admin"].includes(crmRole.toLowerCase());
      }
    }

    if (!isPrivileged) {
      return json(403, { error: "Access denied" });
    }

    const { data: blob, error: downloadErr } = await adminClient.storage
      .from(parsed.bucket)
      .download(parsed.objectPath);

    if (downloadErr || !blob) {
      console.error("Private storage fallback failed:", downloadErr);
      return json(upstream.status || 502, { error: "File could not be downloaded" });
    }

    const contentType = blob.type || "application/octet-stream";
    const bytes = await blob.arrayBuffer();
    return new Response(bytes, {
      status: 200,
      headers: buildHeaders(contentType, String(bytes.byteLength)),
    });
  } catch (e) {
    console.error("download-file error:", e);
    return json(500, { error: "Unexpected error" });
  }
});
