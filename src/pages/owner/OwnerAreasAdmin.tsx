/**
 * Owner Areas Admin — CRUD on public.areas.
 * From here the owner can mark an area as "manually verified" so the
 * public listings' owner-only filter can hide un-curated entries.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ShieldCheck, ShieldOff, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AreaRow {
  id: string;
  name: string;
  slug: string;
  emirate: string;
  description: string | null;
  hero_image_url: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_trending: boolean;
  is_high_demand: boolean;
  is_manually_verified: boolean;
  manually_verified_at: string | null;
  property_count: number | null;
}

const EMPTY: Partial<AreaRow> = {
  name: "",
  slug: "",
  emirate: "Dubai",
  description: "",
  hero_image_url: "",
  image_url: "",
  latitude: null,
  longitude: null,
  is_active: true,
  is_trending: false,
  is_high_demand: false,
  is_manually_verified: true,
};

const slugify = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function OwnerAreasAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<AreaRow> | null>(null);
  const [q, setQ] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["owner-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("id,name,slug,emirate,description,hero_image_url,image_url,latitude,longitude,is_active,is_trending,is_high_demand,is_manually_verified,manually_verified_at,property_count")
        .order("name");
      if (error) throw error;
      return (data ?? []) as AreaRow[];
    },
  });

  const save = useMutation({
    mutationFn: async (row: Partial<AreaRow>) => {
      const payload = {
        name: row.name ?? "",
        slug: row.slug || slugify(row.name || ""),
        emirate: row.emirate ?? "Dubai",
        description: row.description ?? null,
        hero_image_url: row.hero_image_url || null,
        image_url: row.image_url || null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        is_active: !!row.is_active,
        is_trending: !!row.is_trending,
        is_high_demand: !!row.is_high_demand,
        is_manually_verified: !!row.is_manually_verified,
        manually_verified_at: row.is_manually_verified ? new Date().toISOString() : null,
      };
      if (row.id) {
        const { error } = await supabase.from("areas").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("areas").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Area saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["owner-areas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("areas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Area deleted");
      qc.invalidateQueries({ queryKey: ["owner-areas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleVerify = useMutation({
    mutationFn: async (row: AreaRow) => {
      const next = !row.is_manually_verified;
      const { error } = await supabase
        .from("areas")
        .update({
          is_manually_verified: next,
          manually_verified_at: next ? new Date().toISOString() : null,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-areas"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = (data ?? []).filter((r) => {
    if (onlyVerified && !r.is_manually_verified) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!r.name.toLowerCase().includes(s) && !(r.emirate || "").toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const verifiedCount = (data ?? []).filter((r) => r.is_manually_verified).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-700" />
            Areas & Communities
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the areas you show on the site. Mark records as <strong>manually verified</strong> once you've curated real data — the public listing filter can then show only verified entries.
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary">{data?.length ?? 0} total</Badge>
            <Badge className="bg-emerald-700 text-white">{verifiedCount} verified</Badge>
          </div>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="w-4 h-4 mr-2" /> New area
        </Button>
      </header>

      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search area or emirate…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} />
          Verified only
        </label>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Emirate</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2 text-center">Verified</th>
                <th className="px-4 py-2 text-center">Active</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-2 font-medium">{r.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{r.emirate}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{r.slug}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => toggleVerify.mutate(r)}
                      className="inline-flex items-center gap-1 text-xs"
                      title={r.is_manually_verified ? "Click to unverify" : "Click to mark as manually verified"}
                    >
                      {r.is_manually_verified ? (
                        <><ShieldCheck className="w-4 h-4 text-emerald-700" /> Verified</>
                      ) : (
                        <><ShieldOff className="w-4 h-4 text-muted-foreground" /> Unverified</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-center">{r.is_active ? "✓" : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete "${r.name}"? This cannot be undone.`)) del.mutate(r.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No areas match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit area" : "New area"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2 text-sm">
                Name
                <Input
                  value={editing.name || ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value, slug: editing.id ? editing.slug : slugify(e.target.value) })}
                />
              </label>
              <label className="text-sm">
                Slug
                <Input value={editing.slug || ""} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </label>
              <label className="text-sm">
                Emirate
                <Input value={editing.emirate || ""} onChange={(e) => setEditing({ ...editing, emirate: e.target.value })} />
              </label>
              <label className="col-span-2 text-sm">
                Description
                <Textarea rows={3} value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </label>
              <label className="text-sm">
                Hero image URL
                <Input value={editing.hero_image_url || ""} onChange={(e) => setEditing({ ...editing, hero_image_url: e.target.value })} />
              </label>
              <label className="text-sm">
                Card image URL
                <Input value={editing.image_url || ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
              </label>
              <label className="text-sm">
                Latitude
                <Input
                  type="number"
                  step="0.000001"
                  value={editing.latitude ?? ""}
                  onChange={(e) => setEditing({ ...editing, latitude: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </label>
              <label className="text-sm">
                Longitude
                <Input
                  type="number"
                  step="0.000001"
                  value={editing.longitude ?? ""}
                  onChange={(e) => setEditing({ ...editing, longitude: e.target.value === "" ? null : Number(e.target.value) })}
                />
              </label>
              <div className="col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                  Active (visible)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editing.is_trending} onChange={(e) => setEditing({ ...editing, is_trending: e.target.checked })} />
                  Trending
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editing.is_high_demand} onChange={(e) => setEditing({ ...editing, is_high_demand: e.target.checked })} />
                  High demand
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!editing.is_manually_verified} onChange={(e) => setEditing({ ...editing, is_manually_verified: e.target.checked })} />
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Manually verified
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => editing && save.mutate(editing)} disabled={save.isPending || !editing?.name}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
