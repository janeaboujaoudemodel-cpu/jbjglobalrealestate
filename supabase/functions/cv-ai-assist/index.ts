// CV AI Assist — writes/improves summary, polishes bullets, translates CV text.
// Uses Lovable AI Gateway. Public function (verify_jwt = false).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

type Action =
  | { action: "summary"; description: string; headline?: string; tone?: string }
  | { action: "bullets"; role: string; company?: string; bullets: string }
  | { action: "translate"; text: string; targetLanguage: string };

async function chat(messages: any[], model = "google/gemini-3-flash-preview") {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const r = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI gateway ${r.status}: ${t}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Action;
    let text = "";

    if (body.action === "summary") {
      const sys =
        "You write concise, professional CV summaries (3-5 sentences, first person implied, no clichés, no buzzwords like 'synergy/passionate/team-player'). Return plain text only.";
      const user = `Headline: ${body.headline || "(none)"}\nTone: ${body.tone || "professional, confident"}\n\nApplicant description:\n${body.description}\n\nWrite the summary.`;
      text = await chat([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);
    } else if (body.action === "bullets") {
      const sys =
        "You rewrite CV experience highlights into 3-5 strong, quantified achievement bullets. Each bullet on its own line, no leading dashes or numbers. Strong verbs, measurable impact where possible. Plain text only.";
      const user = `Role: ${body.role}\nCompany: ${body.company || ""}\n\nCurrent notes / draft bullets:\n${body.bullets}\n\nRewrite as polished bullets.`;
      text = await chat([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);
    } else if (body.action === "translate") {
      const sys = `You translate CV content to ${body.targetLanguage}. Preserve formatting and line breaks. Output translated text only.`;
      text = await chat([
        { role: "system", content: sys },
        { role: "user", content: body.text },
      ]);
    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
