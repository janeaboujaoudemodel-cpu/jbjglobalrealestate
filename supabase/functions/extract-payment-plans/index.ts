import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentBreakdown {
  milestone: string;
  percentage: number;
}

/**
 * Parse payment plan patterns from text.
 * Matches patterns like "60/40", "80/20", "20/80", "30/70 payment plan",
 * "20% down payment", "60% during construction, 40% on handover", etc.
 */
function extractPaymentPlan(text: string): PaymentBreakdown[] | null {
  if (!text) return null;

  const lower = text.toLowerCase();

  // Pattern 1: "60/40" or "80/20" shorthand
  const slashPattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{1,2}))?(?:\s*payment\s*plan)?/gi;
  let match = slashPattern.exec(lower);
  if (match) {
    const parts = [parseInt(match[1]), parseInt(match[2])];
    if (match[3]) parts.push(parseInt(match[3]));
    const sum = parts.reduce((a, b) => a + b, 0);
    if (sum === 100) {
      const labels = parts.length === 2
        ? ["On Booking / Construction", "On Handover"]
        : ["On Booking", "During Construction", "On Handover"];
      return parts.map((p, i) => ({ milestone: labels[i], percentage: p }));
    }
  }

  // Pattern 2: Explicit percentages with context
  const percentages: { pct: number; context: string }[] = [];
  const pctRegex = /(\d{1,3})%\s*(down\s*payment|on\s*booking|during\s*construction|on\s*handover|post[\s-]*handover|upon\s*completion|on\s*completion)/gi;
  let m;
  while ((m = pctRegex.exec(lower)) !== null) {
    percentages.push({ pct: parseInt(m[1]), context: m[2].trim() });
  }
  if (percentages.length >= 2) {
    const sum = percentages.reduce((a, b) => a + b.pct, 0);
    if (sum === 100) {
      return percentages.map((p) => ({
        milestone: capitalize(p.context),
        percentage: p.pct,
      }));
    }
  }

  return null;
}

function capitalize(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch projects missing payment_breakdown
    let allProjects: any[] = [];
    let offset = 0;
    const batchSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from("projects")
        .select("id, description, short_description, payment_plan, payment_breakdown")
        .is("payment_breakdown", null)
        .range(offset, offset + batchSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allProjects = allProjects.concat(data);
      if (data.length < batchSize) break;
      offset += batchSize;
    }

    let updated = 0;
    let skipped = 0;

    for (const project of allProjects) {
      // Try payment_plan field first, then description, then short_description
      const textsToCheck = [
        project.payment_plan,
        project.description,
        project.short_description,
      ].filter(Boolean);

      let breakdown: PaymentBreakdown[] | null = null;
      for (const text of textsToCheck) {
        breakdown = extractPaymentPlan(text);
        if (breakdown) break;
      }

      if (breakdown) {
        const { error: updateError } = await supabase
          .from("projects")
          .update({ payment_breakdown: breakdown })
          .eq("id", project.id);

        if (!updateError) {
          updated++;
        }
      } else {
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_scanned: allProjects.length,
        updated,
        skipped,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
