import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShieldCheck, ShieldAlert, Clock, RotateCcw, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

interface Developer {
  id: string;
  name: string;
  slug: string | null;
  trust_level: "pending" | "auto_publish" | "suspended";
  approved_at: string | null;
  last_auto_publish_at: string | null;
}

interface SoftDeletedProject {
  id: string;
  name: string;
  developer_id: string | null;
  data_quality_flags: string[];
  deleted_at: string;
}

const DeveloperTrustPanel = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: developers, isLoading } = useQuery({
    queryKey: ["all-developers-trust"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, slug, trust_level, approved_at, last_auto_publish_at")
        .order("name");
      if (error) throw error;
      return (data || []) as Developer[];
    },
  });

  const { data: softDeleted } = useQuery({
    queryKey: ["soft-deleted-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, developer_id, data_quality_flags, deleted_at")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as SoftDeletedProject[];
    },
  });

  const updateTrust = useMutation({
    mutationFn: async ({ id, trust_level }: { id: string; trust_level: Developer["trust_level"] }) => {
      const patch: Record<string, unknown> = { trust_level };
      if (trust_level === "auto_publish") {
        patch.approved_at = new Date().toISOString();
        patch.approved_by = user?.id;
      }
      const { error } = await supabase.from("developers").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trust level updated");
      qc.invalidateQueries({ queryKey: ["all-developers-trust"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ deleted_at: null, data_quality_flags: [] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Project restored");
      qc.invalidateQueries({ queryKey: ["soft-deleted-projects"] });
    },
  });

  const trustBadge = (level: Developer["trust_level"]) => {
    if (level === "auto_publish")
      return (
        <Badge variant="outline" className="jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30">
          <ShieldCheck className="w-3 h-3 mr-1" /> Auto-publish
        </Badge>
      );
    if (level === "suspended")
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <ShieldAlert className="w-3 h-3 mr-1" /> Suspended
        </Badge>
      );
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
        <Clock className="w-3 h-3 mr-1" /> Pending
      </Badge>
    );
  };

  const filtered = (developers || []).filter((d) =>
    !search.trim() || d.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-[88px] px-4 md:px-8 pb-12">
      <SEOHead title="Developer Trust Panel — Owner" description="Approve developers, suspend trust, restore soft-deleted projects." noIndex />
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#1A1A1A] tracking-tight">Developer Trust Panel</h1>
          <p className="text-[#1A1A1A]/70 mt-1">
            One-time approval per developer. Approved developers' future edits publish live automatically.
          </p>
        </div>

        <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-5 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-[#1A1A1A]/60" />
            <Input
              placeholder="Search developers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]/60" /></div>
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-3 p-3 bg-[#FDFBF7] border border-[#B89555]/30 rounded">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#1A1A1A]">{d.name}</span>
                      {trustBadge(d.trust_level)}
                    </div>
                    <div className="text-xs text-[#1A1A1A]/60 mt-1">
                      {d.approved_at ? `Approved ${new Date(d.approved_at).toLocaleDateString()}` : "Not yet approved"}
                      {d.last_auto_publish_at && ` · Last publish ${new Date(d.last_auto_publish_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {d.trust_level !== "auto_publish" && (
                      <Button size="sm" onClick={() => updateTrust.mutate({ id: d.id, trust_level: "auto_publish" })} className="bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#1A1A1A]/90">
                        Approve
                      </Button>
                    )}
                    {d.trust_level === "auto_publish" && (
                      <Button size="sm" variant="outline" onClick={() => updateTrust.mutate({ id: d.id, trust_level: "suspended" })} className="border-red-300 text-red-700 hover:bg-red-50">
                        Suspend
                      </Button>
                    )}
                    {d.trust_level === "suspended" && (
                      <Button size="sm" variant="outline" onClick={() => updateTrust.mutate({ id: d.id, trust_level: "auto_publish" })} className="border-[#B89555]/40 text-[#1A1A1A]">
                        Reinstate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {!filtered.length && <p className="text-[#1A1A1A]/60 text-sm text-center py-6">No developers match.</p>}
            </div>
          )}
        </Card>

        {/* Soft-deleted projects */}
        <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-5 rounded-lg">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-1">Soft-deleted projects</h2>
          <p className="text-sm text-[#1A1A1A]/70 mb-4">
            Hidden from the public site. Restore to undo. {softDeleted?.length || 0} shown (latest 50).
          </p>
          <div className="space-y-2">
            {(softDeleted || []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 bg-[#FDFBF7] border border-[#B89555]/30 rounded">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#1A1A1A] truncate">{p.name}</div>
                  <div className="text-xs text-[#1A1A1A]/60 mt-1 flex gap-3 flex-wrap">
                    <span>Deleted {new Date(p.deleted_at).toLocaleDateString()}</span>
                    {Array.isArray(p.data_quality_flags) && p.data_quality_flags.map((f) => (
                      <Badge key={f} variant="outline" className="bg-red-50 text-red-700 border-red-200">{f}</Badge>
                    ))}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => restoreProject.mutate(p.id)} className="border-[#B89555]/40 text-[#1A1A1A]">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                </Button>
              </div>
            ))}
            {!softDeleted?.length && <p className="text-[#1A1A1A]/60 text-sm text-center py-6">Nothing soft-deleted.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DeveloperTrustPanel;
