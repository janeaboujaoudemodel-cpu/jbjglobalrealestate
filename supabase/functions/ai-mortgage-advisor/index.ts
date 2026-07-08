import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { enforceWAF } from "../_shared/waf-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type MortgageContext = {
  propertyPrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  projectName?: string;
  location?: string;
};

type RequestBody = {
  question: string;
  context: MortgageContext;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const waf = await enforceWAF(req, corsHeaders, "ai", "ai-mortgage-advisor");
  if (waf.blocked) return waf.response!;

  // Require an authenticated user (JWT). Deployment default is verify_jwt=false,
  // so validate the caller in code before invoking the AI gateway.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  try {
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }




  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body: RequestBody = await req.json();
    const question = (body?.question || "").toString().slice(0, 2000);
    const ctx = body?.context;

    if (!question) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ctx || typeof ctx.propertyPrice !== "number" || typeof ctx.monthlyPayment !== "number") {
      return new Response(JSON.stringify({ error: "Invalid context" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a UAE mortgage assistant for a real-estate website.

COMPLIANCE RULES:
- Do NOT guarantee approvals or rates.
- Do NOT provide personal financial advice.
- Provide general guidance and practical next steps.
- Keep answers concise and decision-focused.

Return the result strictly via the suggest_mortgage_answer tool.`;

    const userPrompt = `Context (computed mortgage estimate):
- Project: ${ctx.projectName || "N/A"}
- Location: ${ctx.location || "N/A"}
- Property price: AED ${Math.round(ctx.propertyPrice).toLocaleString()}
- Down payment: ${ctx.downPaymentPercent}% (AED ${Math.round(ctx.downPayment).toLocaleString()})
- Loan amount: AED ${Math.round(ctx.loanAmount).toLocaleString()}
- Interest rate (annual): ${ctx.interestRate}%
- Term: ${ctx.loanTermYears} years
- Estimated monthly payment: AED ${Math.round(ctx.monthlyPayment).toLocaleString()}
- Total interest: AED ${Math.round(ctx.totalInterest).toLocaleString()}

User question: ${question}

Answer in the context of UAE banking norms (residency/non-residency can affect LTV; down payments often 20–25%+), and mention eligibility depends on bank policies.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_mortgage_answer",
              description: "Return a concise mortgage guidance response",
              parameters: {
                type: "object",
                properties: {
                  answer: { type: "string" },
                  keyPoints: { type: "array", items: { type: "string" } },
                  nextSteps: { type: "array", items: { type: "string" } },
                  disclaimer: { type: "string" },
                },
                required: ["answer", "keyPoints", "nextSteps", "disclaimer"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_mortgage_answer" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: `AI gateway error: ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function?.name !== "suggest_mortgage_answer") {
      throw new Error("Invalid AI response structure");
    }
    const payload = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI Mortgage Advisor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
