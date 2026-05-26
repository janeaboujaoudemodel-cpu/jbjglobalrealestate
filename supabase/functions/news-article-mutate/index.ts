// news-article-mutate — Owner-only. Create / update / hide / delete / toggle-redirect
// Writes market_news_revisions on every change.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EDITABLE = [
  "title","excerpt","content","category","source","source_url","image_url",
  "published_date","tags","is_featured","is_verified","status","redirect_to_source",
  "slug","key_stats","key_takeaways","ai_analysis","ai_generated",
] as const;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json();
    const action = String(body.action || "");
    const id = body.id ? String(body.id) : null;
    const patch: Record<string, any> = {};
    for (const k of EDITABLE) if (k in (body.fields || {})) patch[k] = body.fields[k];

    if (action === "create") {
      if (!patch.title || !patch.source) {
        return json({ error: "title and source required" }, 400);
      }
      if (!patch.slug) patch.slug = `${slugify(patch.title)}-${Date.now().toString(36)}`;
      if (!patch.status) patch.status = "draft";
      patch.edited_by = auth.userId;
      patch.edited_at = new Date().toISOString();
      const { data, error } = await sb.from("market_news").insert(patch).select().single();
      if (error) throw error;
      await sb.from("market_news_revisions").insert({
        article_id: data.id, action: "create", changed_fields: Object.keys(patch),
        before_values: null, after_values: patch, edited_by: auth.userId,
      });
      return json({ article: data });
    }

    if (!id) return json({ error: "id required" }, 400);

    const { data: before, error: beforeErr } = await sb.from("market_news").select("*").eq("id", id).maybeSingle();
    if (beforeErr) throw beforeErr;
    if (!before) return json({ error: "Not found" }, 404);

    if (action === "delete") {
      const upd = { status: "deleted", edited_by: auth.userId, edited_at: new Date().toISOString() };
      const { error } = await sb.from("market_news").update(upd).eq("id", id);
      if (error) throw error;
      await sb.from("market_news_revisions").insert({
        article_id: id, action: "delete", changed_fields: ["status"],
        before_values: { status: before.status }, after_values: { status: "deleted" },
        edited_by: auth.userId,
      });
      return json({ ok: true });
    }

    if (action === "hide" || action === "publish" || action === "draft") {
      const next = action === "hide" ? "hidden" : action === "publish" ? "published" : "draft";
      const upd = { status: next, edited_by: auth.userId, edited_at: new Date().toISOString() };
      const { error } = await sb.from("market_news").update(upd).eq("id", id);
      if (error) throw error;
      await sb.from("market_news_revisions").insert({
        article_id: id, action, changed_fields: ["status"],
        before_values: { status: before.status }, after_values: { status: next },
        edited_by: auth.userId,
      });
      return json({ ok: true });
    }

    if (action === "toggle_redirect") {
      const next = !before.redirect_to_source;
      const upd = { redirect_to_source: next, edited_by: auth.userId, edited_at: new Date().toISOString() };
      const { error } = await sb.from("market_news").update(upd).eq("id", id);
      if (error) throw error;
      await sb.from("market_news_revisions").insert({
        article_id: id, action: "toggle_redirect", changed_fields: ["redirect_to_source"],
        before_values: { redirect_to_source: before.redirect_to_source },
        after_values: { redirect_to_source: next }, edited_by: auth.userId,
      });
      return json({ ok: true, redirect_to_source: next });
    }

    if (action === "update") {
      patch.edited_by = auth.userId;
      patch.edited_at = new Date().toISOString();
      const changed: string[] = [];
      const bv: Record<string, any> = {};
      const av: Record<string, any> = {};
      for (const k of Object.keys(patch)) {
        if ((before as any)[k] !== patch[k]) {
          changed.push(k); bv[k] = (before as any)[k]; av[k] = patch[k];
        }
      }
      if (changed.length === 0) return json({ ok: true, unchanged: true });
      const { data, error } = await sb.from("market_news").update(patch).eq("id", id).select().single();
      if (error) throw error;
      await sb.from("market_news_revisions").insert({
        article_id: id, action: "update", changed_fields: changed,
        before_values: bv, after_values: av, edited_by: auth.userId,
      });
      return json({ article: data });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }

  function json(o: unknown, status = 200) {
    return new Response(JSON.stringify(o), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
