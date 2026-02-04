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
  // Remove path separators and control characters
  return trimmed.replace(/[\u0000-\u001F\u007F]/g, "").replace(/[\\/]/g, "-");
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  if (!supabaseUrl) return json(500, { error: "Missing backend configuration" });

  try {
    const requestUrl = new URL(req.url);
    const target = requestUrl.searchParams.get("url") || "";
    const filenameParam = requestUrl.searchParams.get("filename") || undefined;

    if (!target) return json(400, { error: "Missing url" });

    const targetUrl = new URL(target);
    const allowedOrigin = new URL(supabaseUrl).origin;

    // Security: only allow files hosted on our own backend origin
    if (targetUrl.origin !== allowedOrigin) {
      return json(400, { error: "URL not allowed" });
    }

    // Security: only allow storage URLs (avoid open proxy)
    if (!targetUrl.pathname.includes("/storage/v1/")) {
      return json(400, { error: "Only storage URLs are allowed" });
    }

    const upstream = await fetch(targetUrl.toString(), {
      // Avoid leaking client Authorization headers to upstream
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
      // Prevent MIME sniffing
      "X-Content-Type-Options": "nosniff",
      // Cache safely (PDFs/images can be cached)
      "Cache-Control": "public, max-age=3600",
    });

    if (contentLength) headers.set("Content-Length", contentLength);

    const filename = filenameParam ? sanitizeFilename(filenameParam) : undefined;
    if (filename) {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      // Default to attachment to force a real download (and avoid in-tab PDF blockers)
      headers.set("Content-Disposition", "attachment");
    }

    return new Response(upstream.body, { status: 200, headers });
  } catch (e) {
    console.error("download-file error:", e);
    return json(500, { error: "Unexpected error" });
  }
});
