import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface Slot {
  id: string;
  rep_id: string;
  starts_at: string;
  ends_at: string;
  is_blocked: boolean;
  note: string | null;
}

/**
 * RepAvailabilityCalendar — lightweight slot manager.
 * Adds 30-min+ slots, supports blocking, list view by upcoming date.
 * Reps edit their own; owners edit any.
 */
export default function RepAvailabilityCalendar({ repId }: { repId: string }) {
  const qc = useQueryClient();
  const [start, setStart] = useState<string>(() => format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"));
  const [end, setEnd] = useState<string>(() => format(new Date(Date.now() + 2 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState("");

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["rep-availability", repId],
    enabled: !!repId,
    queryFn: async (): Promise<Slot[]> => {
      const { data, error } = await supabase
        .from("developer_rep_availability")
        .select("id, rep_id, starts_at, ends_at, is_blocked, note")
        .eq("rep_id", repId)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Slot[];
    },
  });

  const add = useMutation({
    mutationFn: async (isBlocked: boolean) => {
      const { error } = await supabase.from("developer_rep_availability").insert({
        rep_id: repId,
        starts_at: new Date(start).toISOString(),
        ends_at: new Date(end).toISOString(),
        is_blocked: isBlocked,
        note: note || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slot added");
      setNote("");
      qc.invalidateQueries({ queryKey: ["rep-availability", repId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to add slot"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("developer_rep_availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Slot removed");
      qc.invalidateQueries({ queryKey: ["rep-availability", repId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Delete failed"),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="block">
          <span className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60">Start</span>
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60">End</span>
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60">Note (optional)</span>
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Meeting room A / Zoom" />
        </label>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => add.mutate(false)} disabled={add.isPending}>Add available slot</Button>
        <Button variant="outline" onClick={() => add.mutate(true)} disabled={add.isPending}>Block time off</Button>
      </div>

      <div className="border-t border-[#B89555]/30 pt-3">
        <p className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60 mb-2">Upcoming slots</p>
        {isLoading && <p className="text-sm text-[#1A1A1A]/60">Loading…</p>}
        {!isLoading && slots.length === 0 && (
          <p className="text-sm text-[#1A1A1A]/60">No upcoming availability set.</p>
        )}
        <ul className="space-y-1.5">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center justify-between bg-white border border-[#B89555]/30 rounded-md px-3 py-2 text-sm">
              <div className="min-w-0">
                <span className={s.is_blocked ? "text-red-700 font-semibold" : "text-[#1A1A1A] font-semibold"}>
                  {s.is_blocked ? "Blocked" : "Available"}
                </span>
                <span className="text-[#1A1A1A]/70 ml-2">
                  {format(new Date(s.starts_at), "EEE d MMM, HH:mm")} → {format(new Date(s.ends_at), "HH:mm")}
                </span>
                {s.note && <span className="text-[#1A1A1A]/60 ml-2">· {s.note}</span>}
              </div>
              <button
                onClick={() => remove.mutate(s.id)}
                className="text-xs text-red-700 hover:underline"
                disabled={remove.isPending}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
