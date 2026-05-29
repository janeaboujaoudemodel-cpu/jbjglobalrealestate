// Owner-only: turn a natural-language UI instruction into a scoped CSS
// override row (status='pending'). Owner reviews then approves/rejects.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Selectors we refuse to touch
const BLOCKED = [
  /\bauth\b/i,
  /\bpayment/i,
  /\bsignup/i,
  /\blogin/i,
  /password/i,
  /admin-only/i,
];

async function requireOwner(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
  const { data: roles } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const isOwner = (roles ?? []).some(
    (r: { role: string }) => r.role === "owner" || r.role === "admin",
  );
  return isOwner ? { userId, admin } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const ctx = await requireOwner(req);
    if (!ctx) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { route, instruction, domSnippet, screenshot, targetSelector } = await req.json();
    if (!route || !instruction) {
      return new Response(
        JSON.stringify({ error: "route + instruction required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userContent: Array<Record<string, unknown>> = [
      {
        type: "text",
        text:
          `Route: ${route}\n` +
          (targetSelector ? `Preferred selector (from owner pick): ${targetSelector}\n` : "") +
          `Instruction: ${instruction}\n\n` +
          `Visible DOM hints (truncated): ${(domSnippet ?? "").slice(0, 4000)}`,
      },
    ];
    if (typeof screenshot === "string" && screenshot.startsWith("data:image/")) {
      userContent.push({
        type: "image_url",
        image_url: { url: screenshot },
      });
    }

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You convert a UI instruction into a scoped CSS override. If a 'Preferred selector' is provided, use it. Otherwise pick a SAFE css selector (tag, class, data attribute) targeting the smallest reasonable element. Generate only CSS PROPERTIES (transform, margin, padding, color, background, font-size, opacity, display, gap, border-radius, box-shadow, etc). Never reposition auth/login/payment elements. If a screenshot is attached, use it as ground truth for layout. Output ONLY via the propose_override tool.",
            },
            {
              role: "user",
              content: userContent,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "propose_override",
                description: "Return one CSS override.",
                parameters: {
                  type: "object",
                  properties: {
                    selector: { type: "string" },
                    css: {
                      type: "object",
                      description: "Map of camelCase CSS properties to values.",
                      additionalProperties: { type: "string" },
                    },
                    label: {
                      type: "string",
                      description: "Short human label (e.g., 'Move search bar up 20px').",
                    },
                  },
                  required: ["selector", "css", "label"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "propose_override" },
          },
        }),
      },
    );

    if (!aiResp.ok) {
      const t = await aiResp.text();
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Lovable AI credits exhausted." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      console.error("ai gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const call = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No structured output" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);

    if (BLOCKED.some((re) => re.test(parsed.selector))) {
      return new Response(
        JSON.stringify({
          error: "Selector targets a protected area (auth / payment / admin).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { admin, userId } = ctx;
    const { data: override, error: oErr } = await admin
      .from("owner_ui_overrides")
      .insert({
        route_pattern: route,
        selector: parsed.selector,
        css: parsed.css,
        label: parsed.label,
        status: "pending",
        created_by: userId,
      })
      .select()
      .single();
    if (oErr) {
      return new Response(JSON.stringify({ error: oErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: cr, error: cErr } = await admin
      .from("owner_change_requests")
      .insert({
        route,
        instruction,
        status: "ready",
        proposed_override: parsed,
        override_id: override.id,
        created_by: userId,
      })
      .select()
      .single();
    if (cErr) {
      return new Response(JSON.stringify({ error: cErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ change_request: cr, override }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
