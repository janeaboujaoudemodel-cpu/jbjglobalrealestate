// brochure-auto-fetch
// Tries to locate an official PDF brochure for a project from developer-direct
// sources or Provident (partner). On success, uploads to project-brochures
// storage and patches projects.brochure_url, then returns the URL.
// On failure returns { found: false } so the UI can flip to "Request Brochure".
//
// Enforces global no-secondary-scraping rule via _shared/sourceAllowlist.ts.

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { classifySource } from "../_shared/sourceAllowlist.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ReqBody {
  projectId?: string;
  slug?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = (await req.json().catch(() => ({}))) as ReqBody;
    if (!body.projectId && !body.slug) {
      return json({ error: "projectId or slug required" }, 400);
    }

    const q = supa.from("projects").select("id, slug, name, brochure_url, developer_name").limit(1);
    const { data: project, error } = body.projectId
      ? await q.eq("id", body.projectId).maybeSingle()
      : await q.eq("slug", body.slug!).maybeSingle();

    if (error || !project) return json({ error: "project not found" }, 404);
    if (project.brochure_url) {
      return json({ found: true, url: project.brochure_url, source: "existing" });
    }

    const candidates = await discoverBrochureCandidates({
      name: project.name,
      slug: project.slug,
      developerName: project.developer_name,
    });

    for (const candidateUrl of candidates) {
      const decision = classifySource(candidateUrl);
      if (!decision.ok) continue; // secondary source — skip silently

      try {
        const resp = await fetch(candidateUrl, { redirect: "follow" });
        if (!resp.ok) continue;
        const ct = resp.headers.get("content-type") || "";
        if (!ct.includes("pdf")) continue;

        const bytes = new Uint8Array(await resp.arrayBuffer());
        const path = `auto/${project.id}.pdf`;

        const up = await supa.storage
          .from("project-brochures")
          .upload(path, bytes, { contentType: "application/pdf", upsert: true });
        if (up.error) continue;

        const pub = supa.storage.from("project-brochures").getPublicUrl(path);
        const url = pub.data.publicUrl;

        await supa
          .from("projects")
          .update({ brochure_url: url, brochure_source: decision.reason })
          .eq("id", project.id);

        return json({ found: true, url, source: decision.reason, origin: candidateUrl });
      } catch {
        continue;
      }
    }

    return json({ found: false });
  } catch (e) {
    console.error("brochure-auto-fetch error", e);
    return json({ error: String((e as Error)?.message || e) }, 500);
  }
});

async function discoverBrochureCandidates(p: {
  name: string;
  slug: string;
  developerName: string | null;
}): Promise<string[]> {
  const out = new Set<string>();
  const slug = p.slug;
  const dev = (p.developerName || "").toLowerCase();

  // Provident partner (off-plan only — never their secondary listings)
  out.add(`https://www.provident.ae/off-plan/${slug}/brochure.pdf`);
  out.add(`https://www.provident.ae/off-plan/${slug}.pdf`);

  // Common developer-direct shapes
  const devDomains: Record<string, string> = {
    emaar: "https://www.emaar.com",
    damac: "https://www.damacproperties.com",
    meraas: "https://www.meraas.com",
    nakheel: "https://www.nakheel.com",
    sobha: "https://www.sobharealty.com",
    "majid al futtaim": "https://www.majidalfuttaim.com",
    aldar: "https://www.aldar.com",
    danube: "https://www.danubeproperties.ae",
    azizi: "https://www.azizidevelopments.com",
    ellington: "https://www.ellingtongroup.com",
    binghatti: "https://www.binghattidevelopers.com",
    tiger: "https://www.tigerproperties.com",
    select: "https://www.selectgroup.ae",
    omniyat: "https://www.omniyat.com",
    arada: "https://www.arada.com",
    shapoorji: "https://www.shapoorji.ae",
  };
  for (const [key, base] of Object.entries(devDomains)) {
    if (dev.includes(key)) {
      out.add(`${base}/projects/${slug}/brochure.pdf`);
      out.add(`${base}/downloads/${slug}.pdf`);
      out.add(`${base}/${slug}/brochure.pdf`);
    }
  }
  return [...out];
}
