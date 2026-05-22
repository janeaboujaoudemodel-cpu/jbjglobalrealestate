/**
 * Shared with Brokers — owner workspace
 *
 * Lists every lead that has at least one active broker share, and lets the
 * owner edit the collaborative fields (pipeline_stage, priority, notes,
 * next_followup_at). Edits made here flow LIVE to the assigned brokers via
 * the `crm_update_lead_as_shared` RPC (which sets the `crm.context = shared`
 * GUC inside the same transaction as the UPDATE, so the trigger fans the
 * diff out to the share queue with `published_at = now()` instantly).
 *
 * Edits made anywhere else (`/owner/crm?entity=leads&view=all`) stay private
 * because the trigger defaults to `crm.context = private` and no-ops.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Radio, Users, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type SharedLead = {
  lead_id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  pipeline_stage: string | null;
  priority: string | null;
  notes: string | null;
  next_followup_at: string | null;
  shared_with: string;
  share_id: string;
  permission_level: string;
  broker_name: string | null;
  broker_id: string | null;
};

const STAGES = [
  "new", "contacted", "qualified", "interested", "negotiation",
  "closed_won", "closed_lost", "no_answer", "callback", "followup",
  "not_interested", "do_not_contact", "junk",
];

export default function SharedWithBrokersView() {
  const [rows, setRows] = useState<SharedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<SharedLead>>>({});
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_lead_shares")
      .select(`
        id, permission_level, shared_with, created_at,
        crm_leads:lead_id (
          id, full_name, email_lower, phone_e164,
          pipeline_stage, priority, notes, next_followup_at
        )
      `)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load shared leads", { description: error.message });
      setLoading(false);
      return;
    }

    // Resolve broker display names
    const brokerIds = Array.from(new Set((data || []).map((r: any) => r.shared_with).filter(Boolean)));
    let brokerMap: Record<string, { id: string; full_name: string | null }> = {};
    if (brokerIds.length) {
      const { data: brokers } = await supabase
        .from("crm_brokers")
        .select("id, owner_id, full_name")
        .in("owner_id", brokerIds);
      (brokers || []).forEach((b: any) => {
        if (b.owner_id) brokerMap[b.owner_id] = { id: b.id, full_name: b.full_name };
      });
    }

    const flat: SharedLead[] = (data || [])
      .filter((r: any) => r.crm_leads)
      .map((r: any) => ({
        lead_id: r.crm_leads.id,
        full_name: r.crm_leads.full_name,
        email_lower: r.crm_leads.email_lower,
        phone_e164: r.crm_leads.phone_e164,
        pipeline_stage: r.crm_leads.pipeline_stage,
        priority: r.crm_leads.priority,
        notes: r.crm_leads.notes,
        next_followup_at: r.crm_leads.next_followup_at,
        shared_with: r.shared_with,
        share_id: r.id,
        permission_level: r.permission_level,
        broker_name: brokerMap[r.shared_with]?.full_name || null,
        broker_id: brokerMap[r.shared_with]?.id || null,
      }));

    setRows(flat);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const t = q.toLowerCase();
    return rows.filter(r =>
      (r.full_name || "").toLowerCase().includes(t) ||
      (r.email_lower || "").toLowerCase().includes(t) ||
      (r.broker_name || "").toLowerCase().includes(t)
    );
  }, [rows, q]);

  const setDraft = (lead_id: string, patch: Partial<SharedLead>) => {
    setDrafts(d => ({ ...d, [lead_id]: { ...d[lead_id], ...patch } }));
  };

  const save = async (lead_id: string) => {
    const patch = drafts[lead_id];
    if (!patch || Object.keys(patch).length === 0) return;
    setSaving(lead_id);
    const { error } = await supabase.rpc("crm_update_lead_as_shared", {
      p_id: lead_id,
      p_patch: patch as any,
    });
    setSaving(null);
    if (error) {
      toast.error("Failed to publish edit", { description: error.message });
      return;
    }
    toast.success("Published to broker", {
      description: "The broker will see this change immediately.",
    });
    setDrafts(d => { const { [lead_id]: _, ...rest } = d; return rest; });
    load();
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-xl border border-[#B89555]/40 bg-gradient-to-r from-[#FDFBF7] to-[#EFE6D6] p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-[15px] font-bold text-[#1A1A1A] leading-tight">
            Shared with Brokers — live workspace
          </h2>
          <p className="text-[12.5px] text-[#1A1A1A]/75 mt-0.5">
            Every edit you make here is <strong>published instantly</strong> to the
            assigned broker. Want to keep changes private? Edit the lead from{" "}
            <Link to="/owner/crm?entity=leads&view=all" className="underline font-semibold">
              All Leads
            </Link>{" "}
            instead — your private CRM stays untouched.
          </p>
        </div>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by lead, email, or broker…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md bg-white border-[#B89555]/30"
        />
        <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
          <Users className="w-3 h-3 mr-1" />
          {filtered.length} shared
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]/50" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-12 text-center">
          <Users className="w-10 h-10 text-[#1A1A1A]/30 mx-auto mb-3" />
          <p className="text-sm text-[#1A1A1A]/70">
            No leads are currently shared with any broker.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const draft = drafts[r.lead_id] || {};
            const hasChanges = Object.keys(draft).length > 0;
            const stage = draft.pipeline_stage ?? r.pipeline_stage ?? "new";
            const priority = draft.priority ?? r.priority ?? "";
            const notes = draft.notes ?? r.notes ?? "";

            return (
              <div
                key={r.share_id}
                className="rounded-xl border border-[#B89555]/30 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-[14px] font-bold text-[#1A1A1A] truncate">
                        {r.full_name || "Unnamed lead"}
                      </h3>
                      <Badge variant="outline" className="border-[#B89555]/40 text-[10px] text-[#1A1A1A]/70">
                        {r.permission_level}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-[#1A1A1A]/65 truncate">
                      {r.email_lower || "—"} · {r.phone_e164 || "—"}
                    </p>
                    <p className="text-[11.5px] text-[#1A1A1A]/55 mt-1">
                      Shared with:{" "}
                      {r.broker_id ? (
                        <Link
                          to={`/owner/crm/brokers/${r.broker_id}`}
                          className="font-semibold text-[#1A1A1A] underline inline-flex items-center gap-1"
                        >
                          {r.broker_name || "broker"}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <span className="font-semibold text-[#1A1A1A]">{r.broker_name || "broker"}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-[200px] shrink-0">
                    <Select
                      value={stage}
                      onValueChange={(v) => setDraft(r.lead_id, { pipeline_stage: v })}
                    >
                      <SelectTrigger className="h-9 bg-[#F7F2EA] border-[#B89555]/30 text-[#1A1A1A]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#B89555]/30">
                        {STAGES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Priority"
                      value={priority}
                      onChange={(e) => setDraft(r.lead_id, { priority: e.target.value })}
                      className="h-9 bg-[#F7F2EA] border-[#B89555]/30"
                    />
                  </div>
                </div>

                <Textarea
                  placeholder="Notes broker will see…"
                  value={notes}
                  onChange={(e) => setDraft(r.lead_id, { notes: e.target.value })}
                  className="mt-3 bg-[#F7F2EA] border-[#B89555]/30 text-[13px] min-h-[60px]"
                />

                {hasChanges && (
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDrafts(d => { const { [r.lead_id]: _, ...rest } = d; return rest; })}
                    >
                      Discard
                    </Button>
                    <Button
                      size="sm"
                      disabled={saving === r.lead_id}
                      onClick={() => save(r.lead_id)}
                      className="bg-[#1A1A1A] text-white hover:bg-[#0A0A0A]"
                    >
                      {saving === r.lead_id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Publish to broker
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
