import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Briefing {
  id: string;
  developer_name: string;
  project_name: string;
  briefing_date: string;
  briefing_time: string;
  location_type: string | null;
  location_address: string | null;
  notes: string | null;
  status: string;
  rating: number | null;
  rating_notes: string | null;
  sales_rep_id: string | null;
  sales_rep?: { id: string; full_name: string; title: string | null } | null;
}

function StarRating({
  value,
  onChange,
  size = 20,
  readOnly = false,
}: { value: number | null; onChange?: (v: number) => void; size?: number; readOnly?: boolean }) {
  const [hover, setHover] = useState<number | null>(null);
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="inline-flex items-center gap-0.5">
      {stars.map((n) => {
        const active = (hover ?? value ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => !readOnly && onChange?.(n)}
            className={readOnly ? "cursor-default" : "cursor-pointer"}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={active ? "fill-[#064E3B] text-[#064E3B]" : "text-[#B89555]/50"}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function BriefingsHub() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState<Briefing | null>(null);
  const [form, setForm] = useState({
    developer_name: "",
    project_name: "",
    briefing_date: new Date().toISOString().slice(0, 10),
    briefing_time: "14:00",
    location_type: "developer_office",
    location_address: "",
    sales_rep_id: "",
    notes: "",
    rating: 0,
    rating_notes: "",
  });

  const { data: reps = [] } = useQuery({
    queryKey: ["sales-reps-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_sales_reps")
        .select("id, full_name, title")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: briefings = [], isLoading } = useQuery({
    queryKey: ["owner-briefings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("briefing_requests")
        .select("id, developer_name, project_name, briefing_date, briefing_time, location_type, location_address, notes, status, rating, rating_notes, sales_rep_id, sales_rep:developer_sales_reps!briefing_requests_sales_rep_id_fkey(id, full_name, title)")
        .order("briefing_date", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as Briefing[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.developer_name.trim()) throw new Error("Developer is required");
      if (!form.project_name.trim()) throw new Error("Project is required");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data: anyRep } = await supabase
        .from("developer_representatives")
        .select("id")
        .limit(1)
        .maybeSingle();

      const { error } = await supabase.from("briefing_requests").insert({
        user_id: userId,
        representative_id: anyRep?.id ?? "00000000-0000-0000-0000-000000000000",
        developer_name: form.developer_name.trim(),
        project_name: form.project_name.trim(),
        briefing_date: form.briefing_date,
        briefing_time: form.briefing_time,
        location_type: form.location_type,
        location_address: form.location_address.trim() || null,
        sales_rep_id: form.sales_rep_id || null,
        notes: form.notes.trim() || null,
        rating: form.rating > 0 ? form.rating : null,
        rating_notes: form.rating_notes.trim() || null,
        status: "received",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Briefing added");
      qc.invalidateQueries({ queryKey: ["owner-briefings"] });
      setOpen(false);
      setForm({
        developer_name: "",
        project_name: "",
        briefing_date: new Date().toISOString().slice(0, 10),
        briefing_time: "14:00",
        location_type: "developer_office",
        location_address: "",
        sales_rep_id: "",
        notes: "",
        rating: 0,
        rating_notes: "",
      });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save"),
  });

  const saveRating = useMutation({
    mutationFn: async ({ id, rating, notes, salesRepId }: { id: string; rating: number; notes: string; salesRepId: string | null }) => {
      const { error } = await supabase
        .from("briefing_requests")
        .update({
          rating: rating > 0 ? rating : null,
          rating_notes: notes.trim() || null,
          sales_rep_id: salesRepId,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rating saved");
      qc.invalidateQueries({ queryKey: ["owner-briefings"] });
      setRatingOpen(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const avgRating = useMemo(() => {
    const rated = briefings.filter((b) => typeof b.rating === "number");
    if (!rated.length) return null;
    return rated.reduce((s, b) => s + (b.rating || 0), 0) / rated.length;
  }, [briefings]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Developers Portal</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mt-1">Briefings</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            {briefings.length} briefing{briefings.length === 1 ? "" : "s"}
            {avgRating !== null && ` · avg rating ${avgRating.toFixed(1)} / 5`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-surface="emerald" data-emerald-ok="button" className="jj-surface-emerald allow-white text-white hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" /> Add briefing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New briefing</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Developer *</Label>
                  <Input value={form.developer_name} onChange={(e) => setForm((f) => ({ ...f, developer_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Project *</Label>
                  <Input value={form.project_name} onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.briefing_date} onChange={(e) => setForm((f) => ({ ...f, briefing_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={form.briefing_time} onChange={(e) => setForm((f) => ({ ...f, briefing_time: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Sales representative</Label>
                <Select value={form.sales_rep_id} onValueChange={(v) => setForm((f) => ({ ...f, sales_rep_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select rep who briefed us" /></SelectTrigger>
                  <SelectContent>
                    {reps.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.full_name}{r.title ? ` — ${r.title}` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Location type</Label>
                  <Select value={form.location_type} onValueChange={(v) => setForm((f) => ({ ...f, location_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer_office">Developer office</SelectItem>
                      <SelectItem value="our_office">Our office</SelectItem>
                      <SelectItem value="project_site">Project site</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input value={form.location_address} onChange={(e) => setForm((f) => ({ ...f, location_address: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Rating (rate the rep)</Label>
                <div className="mt-1"><StarRating value={form.rating || null} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} /></div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={() => create.mutate()}
                disabled={create.isPending}
                data-surface="emerald" data-emerald-ok="button"
                className="jj-surface-emerald allow-white text-white"
              >
                {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save briefing"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]/60" /></div>
      ) : briefings.length === 0 ? (
        <Card className="bg-[#F7F2EA] border-[#B89555]/40 p-10 rounded-lg text-center text-[#1A1A1A]/70">
          No briefings yet. Add your first briefing to start rating reps.
        </Card>
      ) : (
        <div className="grid gap-3">
          {briefings.map((b) => (
            <Card key={b.id} className="bg-[#F7F2EA] border-[#B89555]/40 p-4 rounded-lg">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[#1A1A1A]">{b.developer_name}</h3>
                    <span className="text-[#1A1A1A]/40">·</span>
                    <span className="text-[#1A1A1A]/80 text-sm">{b.project_name}</span>
                    <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] text-[10.5px]">{b.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-[#1A1A1A]/70 flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>{b.briefing_date} · {b.briefing_time?.slice(0, 5)}</span>
                    <span>{b.location_type?.replace(/_/g, " ")}{b.location_address ? ` — ${b.location_address}` : ""}</span>
                    {b.sales_rep && <span>Rep: {b.sales_rep.full_name}</span>}
                  </div>
                  {b.notes && <p className="mt-2 text-sm text-[#1A1A1A]/80 line-clamp-2">{b.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StarRating value={b.rating} readOnly size={18} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]"
                    onClick={() => setRatingOpen(b)}
                  >
                    {b.rating ? "Update rating" : "Rate rep"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Rating dialog */}
      <Dialog open={!!ratingOpen} onOpenChange={(o) => !o && setRatingOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate briefing</DialogTitle>
          </DialogHeader>
          {ratingOpen && (
            <RatingEditor
              briefing={ratingOpen}
              reps={reps}
              onSave={(rating, notes, salesRepId) =>
                saveRating.mutate({ id: ratingOpen.id, rating, notes, salesRepId })
              }
              busy={saveRating.isPending}
              onClose={() => setRatingOpen(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RatingEditor({
  briefing,
  reps,
  onSave,
  busy,
  onClose,
}: {
  briefing: Briefing;
  reps: { id: string; full_name: string; title: string | null }[];
  onSave: (rating: number, notes: string, salesRepId: string | null) => void;
  busy: boolean;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(briefing.rating ?? 0);
  const [notes, setNotes] = useState(briefing.rating_notes ?? "");
  const [rep, setRep] = useState(briefing.sales_rep_id ?? "");
  return (
    <>
      <div className="space-y-3 py-2">
        <div className="text-sm text-[#1A1A1A]/80">
          <b>{briefing.developer_name}</b> · {briefing.project_name}
        </div>
        <div>
          <Label>Sales representative</Label>
          <Select value={rep} onValueChange={setRep}>
            <SelectTrigger><SelectValue placeholder="Select rep" /></SelectTrigger>
            <SelectContent>
              {reps.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.full_name}{r.title ? ` — ${r.title}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Stars</Label>
          <div className="mt-1"><StarRating value={rating || null} onChange={setRating} size={24} /></div>
        </div>
        <div>
          <Label>Comments</Label>
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What made this briefing good or bad?" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave(rating, notes, rep || null)}
          disabled={busy}
          data-surface="emerald" data-emerald-ok="button"
          className="jj-surface-emerald allow-white text-white"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
}
