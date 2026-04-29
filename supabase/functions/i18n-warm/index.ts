// i18n-warm — admin-triggered batch warmer for translations_cache.
// Pulls the curated chrome dictionary + the most-used cached strings and
// pre-translates them into all 14 non-English languages, so language switching
// is effectively instant from a cold cache.
//
// Body (all optional):
//   { langs?: string[], extraStrings?: string[], domain?: string }
// Returns:
//   { warmed: { [lang]: number }, totalStrings: number }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const ALL_LANGS = [
  "ar", "es", "fr", "ru", "zh", "hi", "fa", "tr",
  "de", "it", "nl", "he", "pl", "ja",
];

// Minimal core glossary used to seed every locale on first warm.
// (Full chrome dictionary streams in via the client `prewarmChromeDictionary`.)
const CORE_GLOSSARY = [
  "Home", "About", "Contact", "Login", "Sign Up", "Sign In", "Sign Out",
  "Search", "Search properties", "Filters", "Save", "Saved", "Favorites",
  "Properties", "Areas", "Developers", "News", "Insights", "Services",
  "Buy", "Sell", "Rent", "Off-Plan", "Resale", "Apartment", "Villa",
  "Penthouse", "Townhouse", "Studio", "Loading", "Loading…", "Submit",
  "Cancel", "Confirm", "Continue", "Back", "Next", "Previous", "Yes", "No",
  "Email", "Phone", "Name", "Message", "Get Started", "Learn More",
  "View Details", "Read More", "Show Less", "Bedrooms", "Bathrooms",
  "Price", "Starting from", "Per month", "Per year", "Square feet",
  "Square metres", "Investment", "Yield", "Mortgage Calculator",
  "Golden Visa", "Service Charge", "Handover", "Floor Plans",
  "Amenities", "Location", "Map View", "List View", "Newest", "Oldest",
  "Most Popular", "Recommended", "Trending", "Welcome", "Discover",
  "Schedule a Viewing", "Book a Consultation", "Speak to an advisor",
  "Brochure", "Download Brochure", "Privacy Policy", "Terms of Service",
  "Cookie Settings", "All rights reserved",
];

async function callTranslateBatch(
  strings: string[],
  targetLang: string,
  domain: string,
): Promise<number> {
  if (strings.length === 0) return 0;
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/translate-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ strings, targetLang, domain }),
  });
  if (!resp.ok) {
    console.error(`warm batch ${targetLang} failed`, resp.status);
    return 0;
  }
  return strings.length;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: caller must be an authenticated owner.
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userRes } = await userClient.auth.getUser();
  if (!userRes?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  // Owner-role gate
  const { data: roleRow } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .in("role", ["owner", "admin"])
    .maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const langs: string[] = Array.isArray(body?.langs) && body.langs.length
      ? body.langs.filter((l: string) => ALL_LANGS.includes(l))
      : ALL_LANGS;
    const extra: string[] = Array.isArray(body?.extraStrings) ? body.extraStrings : [];
    const domain: string = String(body?.domain ?? "ui");

    // Pull top 200 most-used source strings from cache (proxy for hot UI)
    const { data: hot } = await admin
      .from("translations_cache")
      .select("source_text")
      .order("created_at", { ascending: false })
      .limit(500);
    const hotStrings = Array.from(
      new Set(
        (hot ?? [])
          .map((r) => r.source_text)
          .filter((s) => typeof s === "string" && s.trim().length > 1),
      ),
    ).slice(0, 200);

    const allStrings = Array.from(new Set([
      ...CORE_GLOSSARY, ...hotStrings, ...extra,
    ]));

    const warmed: Record<string, number> = {};
    for (const lang of langs) {
      warmed[lang] = await callTranslateBatch(allStrings, lang, domain);
    }

    return new Response(
      JSON.stringify({ warmed, totalStrings: allStrings.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("i18n-warm error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
