import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, UserPlus, Trash2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import SEOHead from "@/components/SEOHead";

interface Delegate {
  id: string;
  delegate_email: string;
  delegate_user_id: string | null;
  scopes: Record<string, boolean>;
  is_active: boolean;
  note: string | null;
  created_at: string;
}

const SCOPES: { key: string; label: string; help: string }[] = [
  { key: "project_text",      label: "Project text",        help: "Titles, descriptions, prices, location" },
  { key: "project_photos",    label: "Project photos",      help: "Upload, reorder, set cover, delete" },
  { key: "project_documents", label: "Project documents",   help: "Brochures, floor plans, factsheets" },
  { key: "quick_facts",       label: "Quick facts",         help: "Handover, bedrooms, size, status" },
  { key: "developer_info",    label: "Developer info",      help: "Logo, name, description, year founded" },
  { key: "market_intel",      label: "Market intelligence", help: "Dubai market data & reports" },
  { key: "crm",               label: "CRM",                 help: "Leads, contacts, pipeline" },
  { key: "marketing",         label: "Marketing Hub",       help: "Campaigns, audiences, email sends" },
];

export default function AccessDelegates() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [newScopes, setNewScopes] = useState<Record<string, boolean>>({});
  const [note, setNote] = useState("");

  const { data: delegates = [], isLoading } = useQuery({
    queryKey: ["owner-delegates"],
    queryFn: async (): Promise<Delegate[]> => {
      const { data, error } = await (supabase as any)
        .from("owner_delegates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((d: any) => ({ ...d, scopes: d.scopes ?? {} }));
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      if (!email.trim()) throw new Error("Email required");
      const { error } = await (supabase as any).from("owner_delegates").insert({
        owner_user_id: user.id,
        delegate_email: email.trim().toLowerCase(),
        scopes: newScopes,
        note: note.trim() || null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delegate added");
      setEmail(""); setNote(""); setNewScopes({});
      qc.invalidateQueries({ queryKey: ["owner-delegates"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add delegate"),
  });

  const updateRow = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Delegate> }) => {
      const { error } = await (supabase as any).from("owner_delegates").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["owner-delegates"] }),
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("owner_delegates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["owner-delegates"] });
    },
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      <SEOHead title="Access & Delegates | Owner" description="Manage who can edit which parts of your site." />
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-7 h-7 text-[#B89555]" />
          <h1 className="text-3xl font-bold">Access & Delegates</h1>
        </div>
        <p className="text-[#1A1A1A]/70 mb-8">
          Add a person by email and tick exactly what they're allowed to edit. They'll see edit pencils only
          on the sections you grant. Existing accounts are linked instantly; new sign-ups inherit access the
          moment they log in with that email.
        </p>

        <div className="rounded-xl border-2 border-[#B89555]/40 bg-[#F7F2EA] p-6 mb-10">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5" />
            <h2 className="font-semibold text-lg">Add a delegate</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Email address</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" type="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Internal note (optional)</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Saleem — content manager" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {SCOPES.map((s) => (
              <label key={s.key} className="flex items-start gap-2 cursor-pointer rounded-lg bg-[#FDFBF7] border border-[#B89555]/30 px-3 py-2">
                <Checkbox
                  checked={!!newScopes[s.key]}
                  onCheckedChange={(v) => setNewScopes((p) => ({ ...p, [s.key]: !!v }))}
                />
                <div>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-[#1A1A1A]/65">{s.help}</div>
                </div>
              </label>
            ))}
          </div>
          <Button variant="gold" onClick={() => add.mutate()} disabled={add.isPending || !email}>
            {add.isPending ? "Adding…" : "Grant access"}
          </Button>
        </div>

        <h2 className="font-semibold text-lg mb-3">Current delegates</h2>
        {isLoading ? (
          <div className="text-sm text-[#1A1A1A]/60">Loading…</div>
        ) : delegates.length === 0 ? (
          <div className="text-sm text-[#1A1A1A]/60 rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-6 text-center">
            No delegates yet. Add the first one above.
          </div>
        ) : (
          <div className="space-y-3">
            {delegates.map((d) => (
              <div key={d.id} className={`rounded-xl border-2 ${d.is_active ? "border-[#B89555]/40" : "border-[#1A1A1A]/15"} bg-[#FDFBF7] p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-semibold text-base">{d.delegate_email}</div>
                    <div className="text-xs text-[#1A1A1A]/60">
                      {d.delegate_user_id ? "Active account linked" : "Pending — will activate on first login"}
                      {d.note ? ` · ${d.note}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateRow.mutate({ id: d.id, patch: { is_active: !d.is_active } as any })}
                    >
                      {d.is_active ? <><Pause className="w-3.5 h-3.5 mr-1" />Pause</> : <><Play className="w-3.5 h-3.5 mr-1" />Resume</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { if (confirm(`Remove ${d.delegate_email}?`)) remove.mutate(d.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />Remove
                    </Button>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {SCOPES.map((s) => {
                    const checked = !!d.scopes?.[s.key];
                    return (
                      <label key={s.key} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            const next = { ...(d.scopes ?? {}), [s.key]: !!v };
                            updateRow.mutate({ id: d.id, patch: { scopes: next } as any });
                          }}
                        />
                        <span>{s.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
