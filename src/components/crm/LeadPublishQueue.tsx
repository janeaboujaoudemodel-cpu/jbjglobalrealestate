import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Send, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

/**
 * Owner-only panel: lists pending owner edits to leads that are currently
 * shared with brokers in `manual` publish mode. Owner explicitly releases
 * (publish) or discards diffs. Until then, brokers see the lead as it was
 * before the owner's edit.
 */
type Pending = {
  id: string;
  lead_id: string;
  broker_user_id: string;
  field_diff: Record<string, { old: unknown; new: unknown }>;
  created_at: string;
  edited_by: string;
};

type FilterMode = "today" | "yesterday" | "7d" | "30d" | "all";

function withinFilter(iso: string, mode: FilterMode): boolean {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const day = 24 * 3600 * 1000;
  switch (mode) {
    case "today":     return d >= now - 1 * day;
    case "yesterday": return d >= now - 2 * day && d < now - 1 * day;
    case "7d":        return d >= now - 7 * day;
    case "30d":       return d >= now - 30 * day;
    default:          return true;
  }
}

export default function LeadPublishQueue() {
  const [rows, setRows] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FilterMode>("7d");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_lead_publish_queue")
      .select("id, lead_id, broker_user_id, field_diff, created_at, edited_by")
      .is("published_at", null)
      .is("discarded_at", null)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) toast.error("Could not load pending diffs");
    setRows((data ?? []) as Pending[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(
    () => rows.filter(r => withinFilter(r.created_at, filter)),
    [rows, filter],
  );

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const publish = async (ids: string[]) => {
    if (!ids.length) { toast.info("Pick at least one diff to publish"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("crm_publish_lead_diffs", { _ids: ids });
    setBusy(false);
    if (error) { toast.error("Publish failed"); return; }
    toast.success(`Published ${data ?? 0} update${data === 1 ? "" : "s"} to brokers`);
    setSelected(new Set());
    load();
  };

  const discard = async (ids: string[]) => {
    if (!ids.length) return;
    setBusy(true);
    await supabase
      .from("crm_lead_publish_queue")
      .update({ discarded_at: new Date().toISOString(), discard_reason: "owner_discard" })
      .in("id", ids);
    setBusy(false);
    toast.success(`Discarded ${ids.length} diff${ids.length === 1 ? "" : "s"}`);
    setSelected(new Set());
    load();
  };

  return (
    <section className="rounded-md border border-[#B89555]/30 bg-[#FDFBF7] p-4">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#B89555]" />
          <h2 className="text-sm font-semibold text-[#1A1A1A]">
            Pending updates to brokers
          </h2>
          <span className="text-[11px] text-[#1A1A1A]/60">
            {visible.length} / {rows.length} in window
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {(["today","yesterday","7d","30d","all"] as FilterMode[]).map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={
                "inline-flex min-h-7 min-w-[58px] items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors " +
                (filter === m
                  ? "jj-surface-emerald border-transparent !text-white"
                  : "bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#F7F2EA]")
              }
              data-surface={filter === m ? "emerald" : undefined}
              data-emerald-ok={filter === m ? "pill" : undefined}
            >{m === "7d" ? "Last 7d" : m === "30d" ? "Last 30d" : m === "all" ? "All" : m === "today" ? "Today" : "Yesterday"}</button>
          ))}
          <span className="mx-1 h-4 w-px bg-[#B89555]/30" />
          <Button
            size="sm"
            disabled={busy || selected.size === 0}
            onClick={() => publish([...selected])}
            className="h-8 min-w-[132px] text-[11px]"
          >
            {busy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
            Publish selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || selected.size === 0}
            onClick={() => discard([...selected])}
            className="h-8 min-w-[92px] border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] text-[11px]"
          >
            <X className="h-3 w-3 mr-1" /> Discard
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="py-10 text-center text-xs text-[#1A1A1A]/60 flex items-center justify-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading pending diffs…
        </div>
      ) : visible.length === 0 ? (
        <div className="py-10 text-center text-xs text-[#1A1A1A]/60">
          Nothing pending in this window — owner edits propagate only when you publish.
        </div>
      ) : (
        <ul className="divide-y divide-[#B89555]/15">
          {visible.map(r => {
            const keys = Object.keys(r.field_diff ?? {});
            const isSel = selected.has(r.id);
            return (
              <li
                key={r.id}
                className={
                  "flex items-start gap-3 px-2 py-2 cursor-pointer transition-colors " +
                  (isSel ? "bg-[#EFE6D6]" : "hover:bg-[#F7F2EA]")
                }
                onClick={() => toggle(r.id)}
              >
                <input
                  type="checkbox"
                  checked={isSel}
                  onChange={() => toggle(r.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 accent-[#1A1A1A] h-3.5 w-3.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-[#1A1A1A] truncate">
                    Lead <span className="font-mono text-[10px]">{r.lead_id.slice(0,8)}</span>
                    <span className="ml-2 text-[#1A1A1A]/60">→ broker <span className="font-mono text-[10px]">{r.broker_user_id.slice(0,8)}</span></span>
                  </div>
                  <div className="text-[10px] text-[#1A1A1A]/60 mt-0.5">
                    {keys.length} field{keys.length === 1 ? "" : "s"} changed: {keys.slice(0,6).join(", ")}{keys.length > 6 ? "…" : ""}
                  </div>
                </div>
                <div className="text-[10px] text-[#1A1A1A]/55 whitespace-nowrap">
                  {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
