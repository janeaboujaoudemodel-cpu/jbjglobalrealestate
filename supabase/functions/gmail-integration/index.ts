import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return new Response(JSON.stringify({ error: "Google OAuth credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, code, redirect_uri, access_token, refresh_token, to, subject, body, message_id, max_results, label_ids, query } = await req.json();

    // === ACTION: exchange_code — Exchange authorization code for tokens ===
    if (action === "exchange_code") {
      if (!code || !redirect_uri) throw new Error("Missing code or redirect_uri");

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        console.error("Token exchange failed:", tokenData);
        return new Response(JSON.stringify({ error: "Token exchange failed", details: tokenData }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user email
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await profileRes.json();

      return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        email: profile.email,
        name: profile.name,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === ACTION: refresh_token — Refresh expired access token ===
    if (action === "refresh_token") {
      if (!refresh_token) throw new Error("Missing refresh_token");

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          grant_type: "refresh_token",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return new Response(JSON.stringify({ error: "Token refresh failed", details: tokenData }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === ACTION: list_messages — List inbox messages ===
    if (action === "list_messages") {
      if (!access_token) throw new Error("Missing access_token");

      const params = new URLSearchParams({
        maxResults: String(max_results || 20),
      });
      if (label_ids) params.set("labelIds", label_ids);
      if (query) params.set("q", query);

      const res = await fetch(`${GMAIL_API_BASE}/users/me/messages?${params}`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(JSON.stringify({ error: "Failed to list messages", details: err }), {
          status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === ACTION: get_message — Get a single message with full content ===
    if (action === "get_message") {
      if (!access_token || !message_id) throw new Error("Missing access_token or message_id");

      const res = await fetch(`${GMAIL_API_BASE}/users/me/messages/${message_id}?format=full`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(JSON.stringify({ error: "Failed to get message", details: err }), {
          status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();

      // Parse headers
      const headers: Record<string, string> = {};
      for (const h of data.payload?.headers || []) {
        headers[h.name.toLowerCase()] = h.value;
      }

      // Decode body
      let bodyText = "";
      const parts = data.payload?.parts || [data.payload];
      for (const part of parts) {
        if (part?.mimeType === "text/plain" && part.body?.data) {
          bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          break;
        }
        if (part?.mimeType === "text/html" && part.body?.data && !bodyText) {
          bodyText = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }

      return new Response(JSON.stringify({
        id: data.id,
        threadId: data.threadId,
        labelIds: data.labelIds,
        snippet: data.snippet,
        from: headers.from || "",
        to: headers.to || "",
        subject: headers.subject || "",
        date: headers.date || "",
        body: bodyText,
        internalDate: data.internalDate,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // === ACTION: send_email — Send an email ===
    if (action === "send_email") {
      if (!access_token || !to || !subject) throw new Error("Missing access_token, to, or subject");

      const rawEmail = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/html; charset=utf-8`,
        "",
        body || "",
      ].join("\r\n");

      const encoded = btoa(rawEmail).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await fetch(`${GMAIL_API_BASE}/users/me/messages/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encoded }),
      });

      if (!res.ok) {
        const err = await res.text();
        return new Response(JSON.stringify({ error: "Failed to send email", details: err }), {
          status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await res.json();
      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ACTION: get_labels — Get all labels ===
    if (action === "get_labels") {
      if (!access_token) throw new Error("Missing access_token");

      const res = await fetch(`${GMAIL_API_BASE}/users/me/labels`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: unknown) {
    console.error("gmail-integration error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
