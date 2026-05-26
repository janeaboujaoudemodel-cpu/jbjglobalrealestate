import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Link2, Eye, EyeOff, Trash2, Pencil, ExternalLink, RefreshCw } from "lucide-react";

type Article = {
  id: string; title: string; source: string; source_url: string | null;
  status: string; redirect_to_source: boolean; published_date: string;
  category: string; image_url: string | null; excerpt: string | null;
  content: string | null; tags: string[] | null;
};

type Draft = {
  source_url: string; title: string; excerpt: string; content: string;
  author?: string | null; published_at?: string | null;
  hero_image_url?: string | null; category: string; tags?: string[]; source: string;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
  { key: "hidden", label: "Hidden" },
] as const;

export default function OwnerNewsHub() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [extractUrl, setExtractUrl] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState<Article | null>(null);

  async function load() {
    setLoading(true);
    let qb = supabase.from("market_news")
      .select("id,title,source,source_url,status,redirect_to_source,published_date,category,image_url,excerpt,content,tags")
      .order("published_date", { ascending: false }).limit(200);
    if (filter !== "all") qb = qb.eq("status", filter);
    if (q.trim()) qb = qb.ilike("title", `%${q.trim()}%`);
    const { data, error } = await qb;
    if (error) toast.error(error.message); else setRows((data ?? []) as Article[]);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  async function extract() {
    if (!extractUrl) return;
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("news-extract-from-link", {
        body: { url: extractUrl },
      });
      if (error) throw error;
      setDraft(data.draft as Draft);
      toast.success("Draft extracted — review and save.");
    } catch (e: any) {
      toast.error(e?.message || "Failed to extract");
    } finally { setExtracting(false); }
  }

  async function saveDraft(publish: boolean) {
    if (!draft) return;
    try {
      const { data, error } = await supabase.functions.invoke("news-article-mutate", {
        body: {
          action: "create",
          fields: {
            title: draft.title, excerpt: draft.excerpt, content: draft.content,
            source: draft.source, source_url: draft.source_url,
            image_url: draft.hero_image_url || null,
            category: draft.category, tags: draft.tags ?? [],
            published_date: (draft.published_at || new Date().toISOString()).slice(0, 10),
            status: publish ? "published" : "draft",
          },
        },
      });
      if (error) throw error;
      toast.success(publish ? "Published" : "Saved as draft");
      setDraft(null); setExtractUrl(""); load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
  }

  async function mutate(id: string, action: string) {
    try {
      const { error } = await supabase.functions.invoke("news-article-mutate", { body: { action, id } });
      if (error) throw error;
      toast.success("Updated");
      load();
    } catch (e: any) { toast.error(e?.message || "Failed"); }
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      const { error } = await supabase.functions.invoke("news-article-mutate", {
        body: {
          action: "update", id: editing.id,
          fields: {
            title: editing.title, excerpt: editing.excerpt, content: editing.content,
            source: editing.source, source_url: editing.source_url,
            image_url: editing.image_url, category: editing.category,
          },
        },
      });
      if (error) throw error;
      toast.success("Saved"); setEditing(null); load();
    } catch (e: any) { toast.error(e?.message || "Save failed"); }
  }

  return (
    <div className="min-h-screen pt-[88px] px-6 pb-16 bg-[#FDFBF7] text-[#1A1A1A]">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">News Admin Hub</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Paste any article URL to extract a draft, then publish, hide, edit, delete, or toggle redirect.
          </p>
        </header>

        <Card className="p-6 bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl">
          <Label className="text-sm font-medium">Quick-Add by Link</Label>
          <div className="flex gap-2 mt-2">
            <Input value={extractUrl} onChange={(e) => setExtractUrl(e.target.value)}
              placeholder="https://www.khaleejtimes.com/..." className="bg-[#FDFBF7]" />
            <Button onClick={extract} disabled={extracting || !extractUrl} variant="default">
              {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              <span className="ml-2">Extract</span>
            </Button>
          </div>

          {draft && (
            <div className="mt-6 space-y-3 border-t border-[#B89555]/20 pt-6">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Title</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></div>
                <div><Label>Source</Label><Input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></div>
                <div><Label>Published date</Label><Input type="date" value={(draft.published_at || "").slice(0,10)}
                  onChange={(e) => setDraft({ ...draft, published_at: e.target.value })} /></div>
                <div className="col-span-2"><Label>Hero image URL</Label>
                  <Input value={draft.hero_image_url ?? ""} onChange={(e) => setDraft({ ...draft, hero_image_url: e.target.value })} /></div>
              </div>
              <div><Label>Excerpt</Label><Textarea rows={2} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} /></div>
              <div><Label>Body (markdown / html)</Label><Textarea rows={8} value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} /></div>
              <div className="flex gap-2">
                <Button onClick={() => saveDraft(false)} variant="outline">Save as Draft</Button>
                <Button onClick={() => saveDraft(true)}>Publish</Button>
                <Button onClick={() => setDraft(null)} variant="ghost">Cancel</Button>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-sm rounded-full border ${filter === f.key
                  ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
                  : "border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#EFE6D6]/50"}`}>
                {f.label}
              </button>
            ))}
            <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search title…" className="ml-2 max-w-xs bg-[#FDFBF7]" />
            <Button onClick={load} variant="ghost" size="sm"><RefreshCw className="h-4 w-4" /></Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-[#1A1A1A]/60">
                <th className="py-2 pr-2">Title</th><th className="py-2 pr-2">Source</th>
                <th className="py-2 pr-2">Status</th><th className="py-2 pr-2">Date</th>
                <th className="py-2 pr-2">Redirect</th><th className="py-2 pr-2">Actions</th>
              </tr></thead>
              <tbody>
                {loading && <tr><td colSpan={6} className="py-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>}
                {!loading && rows.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-[#1A1A1A]/60">No articles.</td></tr>}
                {rows.map((a) => (
                  <tr key={a.id} className="border-t border-[#B89555]/15">
                    <td className="py-2 pr-2 max-w-md"><div className="truncate font-medium">{a.title}</div></td>
                    <td className="py-2 pr-2">{a.source}</td>
                    <td className="py-2 pr-2"><span className="px-2 py-0.5 text-xs rounded-full bg-[#EFE6D6] border border-[#B89555]/30">{a.status}</span></td>
                    <td className="py-2 pr-2">{a.published_date}</td>
                    <td className="py-2 pr-2">
                      <button onClick={() => mutate(a.id, "toggle_redirect")} className="text-xs underline">
                        {a.redirect_to_source ? "ON" : "OFF"}
                      </button>
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" title="Edit" onClick={() => setEditing(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                        {a.status !== "published"
                          ? <Button size="sm" variant="ghost" title="Publish" onClick={() => mutate(a.id, "publish")}><Eye className="h-3.5 w-3.5" /></Button>
                          : <Button size="sm" variant="ghost" title="Hide" onClick={() => mutate(a.id, "hide")}><EyeOff className="h-3.5 w-3.5" /></Button>}
                        <Button size="sm" variant="ghost" title="Delete" onClick={() => { if (confirm("Delete article?")) mutate(a.id, "delete"); }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        {a.source_url && <a href={a.source_url} target="_blank" rel="noreferrer"
                          className="inline-flex items-center px-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A]"><ExternalLink className="h-3.5 w-3.5" /></a>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {editing && (
          <Card className="p-6 bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl">
            <h2 className="font-semibold mb-3">Edit article</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Source</Label><Input value={editing.source} onChange={(e) => setEditing({ ...editing, source: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
              <div><Label>Source URL</Label><Input value={editing.source_url ?? ""} onChange={(e) => setEditing({ ...editing, source_url: e.target.value })} /></div>
              <div className="col-span-2"><Label>Hero image URL</Label><Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} /></div>
              <div className="col-span-2"><Label>Excerpt</Label><Textarea rows={2} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>
              <div className="col-span-2"><Label>Body</Label><Textarea rows={8} value={editing.content ?? ""} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={saveEdit}>Save</Button>
              <Button onClick={() => setEditing(null)} variant="ghost">Cancel</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
