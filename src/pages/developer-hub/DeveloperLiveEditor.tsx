import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit3, ExternalLink, Loader2 } from "lucide-react";
import { useDeveloperAutoPublish } from "@/hooks/useDeveloperAutoPublish";

interface Project {
  id: string;
  name: string;
  slug: string | null;
  price_from: number | null;
  handover_date: string | null;
  is_published: boolean | null;
  cover_image_url: string | null;
  data_quality_flags: unknown;
}

const DeveloperLiveEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const publish = useDeveloperAutoPublish();
  const [editing, setEditing] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { price_from?: string; handover_date?: string }>>({});

  const { data: rep } = useQuery({
    queryKey: ["rep-list", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("developer_representatives")
        .select("current_developer_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ["developer-projects", rep?.current_developer_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, name, slug, price_from, handover_date, is_published, cover_image_url, data_quality_flags")
        .eq("developer_id", rep!.current_developer_id!)
        .order("updated_at", { ascending: false });
      return (data || []) as Project[];
    },
    enabled: !!rep?.current_developer_id,
  });

  const saveEdit = async (p: Project) => {
    const e = edits[p.id] || {};
    const patch: Record<string, unknown> = {};
    if (e.price_from !== undefined) patch.price_from = Number(e.price_from);
    if (e.handover_date !== undefined) patch.handover_date = e.handover_date;
    if (!Object.keys(patch).length) {
      setEditing(null);
      return;
    }
    await publish.mutateAsync({
      developer_id: rep!.current_developer_id!,
      project_id: p.id,
      patch,
    });
    setEditing(null);
    setEdits((s) => ({ ...s, [p.id]: {} }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">My Projects</h1>
          <p className="text-[#1A1A1A]/70 text-sm mt-1">Click any project to edit. Edits publish live for approved developers.</p>
        </div>
        <Button onClick={() => navigate("/developer-hub/new-project")} className="bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#1A1A1A]/90">
          <Plus className="w-4 h-4 mr-2" /> Add project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]/60" /></div>
      ) : !projects?.length ? (
        <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-10 rounded-lg text-center">
          <p className="text-[#1A1A1A]/70">No projects yet. Add your first project to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => {
            const isEdit = editing === p.id;
            const flags = Array.isArray(p.data_quality_flags) ? p.data_quality_flags : [];
            return (
              <Card key={p.id} className="bg-[#F7F2EA] border-[#B89555]/40 p-4 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded bg-[#EFE6D6] border border-[#B89555]/40 flex-shrink-0 overflow-hidden">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt={p.name} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[10px] text-[#1A1A1A]/40">No cover</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#1A1A1A]">{p.name}</h3>
                      {p.is_published ? (
                        <Badge variant="outline" className="jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30">Live</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">Unpublished</Badge>
                      )}
                      {flags.length > 0 && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {flags.length} data issue{flags.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    {isEdit ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <Input
                          type="number"
                          placeholder="Price from (AED)"
                          defaultValue={p.price_from ?? ""}
                          onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], price_from: e.target.value } }))}
                          className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
                        />
                        <Input
                          type="date"
                          defaultValue={p.handover_date ?? ""}
                          onChange={(e) => setEdits((s) => ({ ...s, [p.id]: { ...s[p.id], handover_date: e.target.value } }))}
                          className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
                        />
                      </div>
                    ) : (
                      <div className="flex gap-6 text-sm text-[#1A1A1A]/70 mt-2">
                        <span>From AED {p.price_from?.toLocaleString() ?? "—"}</span>
                        <span>Handover {p.handover_date ?? "—"}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {isEdit ? (
                      <>
                        <Button size="sm" onClick={() => saveEdit(p)} disabled={publish.isPending} className="bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#1A1A1A]/90">
                          {publish.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save & publish"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)} className="border-[#B89555]/40 text-[#1A1A1A]">
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditing(p.id)} className="border-[#B89555]/40 text-[#1A1A1A]">
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        {p.is_published && p.slug && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(`/projects/${p.slug}`, "_blank")} className="text-[#1A1A1A]">
                            <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeveloperLiveEditor;
