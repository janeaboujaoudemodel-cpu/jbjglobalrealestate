/**
 * Project Duplicate Check
 *
 * Given a project name + optional developer name, returns a ranked list of
 * likely-existing project records so the uploader can decide whether to
 * continue, open an existing project, or merge.
 *
 * Access: authenticated (owner, developer rep, or admin uploader).
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  getCorsHeaders,
  createSupabaseClients,
  callLovableAI,
  errorResponse,
} from "../_shared/ai-utils.ts";

interface Req {
  name: string;
  developer_name?: string | null;
  emirate?: string | null;
  location?: string | null;
}

interface Candidate {
  id: string;
  name: string;
  developer_name: string | null;
  emirate: string | null;
  location: string | null;
  cover_image_url: string | null;
  slug: string | null;
  is_published: boolean | null;
  created_at: string;
  score: number;
  reason: string;
}

serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errorResponse("Unauthorized", 401, cors);
    const { service } = createSupabaseClients(authHeader);

    const body = (await req.json()) as Req;
    const rawName = (body?.name || "").trim();
    if (!rawName || rawName.length < 2) {
      return new Response(JSON.stringify({ candidates: [] }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const devName = (body.developer_name || "").trim();

    // ── 1. Fuzzy prefilter with ilike on name + developer_name ──
    // Normalize tokens: strip "the", "residences", "residence", "tower",
    // "apartments", "villas" that create false negatives when a user drops
    // the marketing suffix.
    const noise = /\b(the|residences?|tower|towers|apartments?|villas?|resort|hotel|community)\b/gi;
    const stripped = rawName.replace(noise, " ").replace(/\s+/g, " ").trim();
    const tokens = Array.from(new Set([rawName, stripped, ...stripped.split(" ")]))
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);

    // Build an "or" ilike clause over name; run a separate query per token
    // and merge, to avoid PostgREST or-clause length limits.
    const seen = new Map<string, any>();
    for (const t of tokens.slice(0, 6)) {
      const { data } = await service
        .from("projects")
        .select(
          "id, name, developer_name, emirate, location, cover_image_url, slug, is_published, created_at"
        )
        .ilike("name", `%${t}%`)
        .limit(25);
      for (const r of data || []) seen.set(r.id, r);
    }
    if (devName) {
      const { data } = await service
        .from("projects")
        .select(
          "id, name, developer_name, emirate, location, cover_image_url, slug, is_published, created_at"
        )
        .ilike("developer_name", `%${devName}%`)
        .ilike("name", `%${tokens[0] || ""}%`)
        .limit(25);
      for (const r of data || []) seen.set(r.id, r);
    }

    const raw = Array.from(seen.values()).slice(0, 30);
    if (raw.length === 0) {
      return new Response(JSON.stringify({ candidates: [] }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // ── 2. Ask AI to score similarity and pick likely duplicates ──
    let scored: Candidate[] = [];
    try {
      const system =
        "You detect duplicate real-estate development records. Given an input project name/developer and a list of existing records, return a JSON array of objects {id, score (0..1), reason} for the entries that are plausibly the SAME project (name variations, marketing suffixes, misspellings, or the same building sold under a different brand). Ignore entries that are clearly a different project. Return only records with score >= 0.55. Respond with ONLY valid JSON, no prose.";
      const user = JSON.stringify({
        input: { name: rawName, developer_name: devName || null, emirate: body.emirate || null, location: body.location || null },
        candidates: raw.map((r) => ({
          id: r.id,
          name: r.name,
          developer_name: r.developer_name,
          emirate: r.emirate,
          location: r.location,
        })),
      });
      const out = await callLovableAI({
        model: "google/gemini-2.5-flash",
        systemPrompt: system,
        userPrompt: user,
        temperature: 0.1,
        maxTokens: 800,
      });
      const jsonText = (out.match(/\[[\s\S]*\]/)?.[0]) || "[]";
      const parsed = JSON.parse(jsonText) as Array<{ id: string; score: number; reason?: string }>;
      const byId = new Map(raw.map((r) => [r.id, r]));
      scored = parsed
        .filter((p) => byId.has(p.id))
        .map((p) => ({
          ...(byId.get(p.id) as any),
          score: Math.max(0, Math.min(1, Number(p.score) || 0)),
          reason: p.reason || "Similar name",
        }))
        .filter((c) => c.score >= 0.55)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    } catch (_e) {
      // Fallback: simple case-insensitive-normalized string overlap
      const norm = (s: string) => s.toLowerCase().replace(noise, " ").replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
      const target = norm(rawName);
      scored = raw
        .map((r) => {
          const cand = norm(r.name || "");
          const overlap = cand && (cand.includes(target) || target.includes(cand)) ? 0.75 : 0;
          return { ...r, score: overlap, reason: overlap ? "Name overlap" : "" };
        })
        .filter((c) => c.score >= 0.55)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }

    return new Response(JSON.stringify({ candidates: scored }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("project-duplicate-check error", e);
    return errorResponse((e as Error).message || "Duplicate check failed", 500, cors);
  }
});
