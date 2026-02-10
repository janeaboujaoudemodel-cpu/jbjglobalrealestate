import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "JBJ-Download-Proxy/1.0",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return json(upstream.status || 502, { error: "Upstream download failed" });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length") || undefined;

    const headers = new Headers({
      ...corsHeaders,
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    });

    if (contentLength) headers.set("Content-Length", contentLength);

    const filename = filenameParam ? sanitizeFilename(filenameParam) : undefined;
    if (filename) {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      headers.set("Content-Disposition", "attachment");
    }

    return new Response(upstream.body, { status: 200, headers });
  } catch (e) {
    console.error("download-file error:", e);
    return json(500, { error: "Unexpected error" });
  }
});
