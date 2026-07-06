import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import RepAvailabilityBadge from "@/components/developers-portal/RepAvailabilityBadge";
import { usePortalRole } from "@/hooks/usePortalRole";

interface Rep {
  id: string;
  full_name: string;
  title: string | null;
  position: string | null;
  nationality: string | null;
  languages: string[] | null;
  assigned_emirates: string[] | null;
  availability_status: string | null;
  is_active: boolean | null;
  developer_id: string;
}

const EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"];

export default function RepDirectory() {
  const { role } = usePortalRole();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [emirate, setEmirate] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    developer_id: "",
    full_name: "",
    title: "Sales Representative",
    phone_e164: "",
    email: "",
    nationality: "",
    languages: "",
    assigned_emirates: [] as string[],
    notes: "",
  });

  const { data: developers = [] } = useQuery({
    queryKey: ["uae-developers-min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("uae_developers")
        .select("id, name")
        .order("name", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: reps = [], isLoading } = useQuery({
    queryKey: ["portal-reps", { search, emirate, language }],
    queryFn: async (): Promise<Rep[]> => {
      let q = supabase
        .from("developer_sales_reps")
        .select("id, full_name, title, position, nationality, languages, assigned_emirates, availability_status, is_active, developer_id")
        .eq("is_active", true)
        .order("full_name", { ascending: true })
        .limit(500);

      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
      if (emirate !== "all") q = q.contains("assigned_emirates", [emirate]);
      if (language !== "all") q = q.contains("languages", [language]);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Rep[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.developer_id) throw new Error("Developer is required");
      if (!form.full_name.trim()) throw new Error("Name is required");
      if (!form.phone_e164.trim()) throw new Error("Phone is required");
      const languagesArr = form.languages.split(",").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase.from("developer_sales_reps").insert({
        developer_id: form.developer_id,
        full_name: form.full_name.trim(),
        title: form.title.trim() || "Sales Representative",
        phone_e164: form.phone_e164.trim(),
        email: form.email.trim() || null,
        nationality: form.nationality.trim() || null,
        languages: languagesArr.length ? languagesArr : null,
        assigned_emirates: form.assigned_emirates,
        notes: form.notes.trim() || null,
        is_active: true,
        availability_status: "available",
        specialty: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Sales rep created");
      qc.invalidateQueries({ queryKey: ["portal-reps"] });
      setOpen(false);
      setForm({
        developer_id: "",
        full_name: "",
        title: "Sales Representative",
        phone_e164: "",
        email: "",
        nationality: "",
        languages: "",
        assigned_emirates: [],
        notes: "",
      });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to create"),
  });

  const availableEmirates = useMemo(() => {
    const seen = new Set(reps.flatMap((r) => r.assigned_emirates ?? []));
    return Array.from(new Set([...EMIRATES, ...seen])).sort();
  }, [reps]);
  const languages = useMemo(
    () => Array.from(new Set(reps.flatMap((r) => r.languages ?? []))).sort(),
    [reps]
  );

  const toggleEmirate = (em: string) => {
    setForm((f) => ({
      ...f,
      assigned_emirates: f.assigned_emirates.includes(em)
        ? f.assigned_emirates.filter((x) => x !== em)
        : [...f.assigned_emirates, em],
    }));
  };

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Developers Portal</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mt-1">Sales Representatives</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            {reps.length} active rep{reps.length === 1 ? "" : "s"}{role === "owner" ? " across all developers" : ""}.
          </p>
        </div>
        {role === "owner" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                data-surface="emerald"
                data-emerald-ok="button"
                className="jj-surface-emerald allow-white text-white hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Sales Rep
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add sales representative</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>Developer *</Label>
                  <Select value={form.developer_id} onValueChange={(v) => setForm((f) => ({ ...f, developer_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select developer" /></SelectTrigger>
                    <SelectContent>
                      {developers.map((d: { id: string; name: string }) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Full name *</Label>
                    <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Phone (E.164) *</Label>
                    <Input placeholder="+9715..." value={form.phone_e164} onChange={(e) => setForm((f) => ({ ...f, phone_e164: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nationality</Label>
                    <Input value={form.nationality} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Languages (comma separated)</Label>
                    <Input placeholder="English, Arabic" value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label>Assigned emirates</Label>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {EMIRATES.map((em) => {
                      const on = form.assigned_emirates.includes(em);
                      return (
                        <button
                          type="button"
                          key={em}
                          onClick={() => toggleEmirate(em)}
                          data-surface={on ? "emerald" : undefined}
                          data-emerald-ok={on ? "chip" : undefined}
                          className={
                            on
                              ? "jj-surface-emerald allow-white text-white text-xs font-semibold px-3 py-1.5 rounded-full"
                              : "text-xs font-semibold px-3 py-1.5 rounded-full bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/30 hover:bg-[#E5D9C0]"
                          }
                        >
                          {em}
                        </button>
                      );
                    })}
                  </div>
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
                  data-surface="emerald"
                  data-emerald-ok="button"
                  className="jj-surface-emerald allow-white text-white"
                >
                  {create.isPending ? "Saving…" : "Save rep"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <Card className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={emirate} onValueChange={setEmirate}>
            <SelectTrigger><SelectValue placeholder="All Emirates" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Emirates</SelectItem>
              {availableEmirates.map((em) => <SelectItem key={em} value={em}>{em}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger><SelectValue placeholder="All Languages" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              {languages.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => { setSearch(""); setEmirate("all"); setLanguage("all"); }}
            className="border-[#B89555]/40 hover:bg-[#EFE6D6]"
          >
            Reset
          </Button>
        </div>
      </Card>

      {isLoading && <p className="text-sm text-[#1A1A1A]/60">Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reps.map((rep) => (
          <Link key={rep.id} to={`/developers-portal/reps/${rep.id}`}>
            <Card className="p-5 bg-[#FDFBF7] border border-[#B89555]/30 hover:border-[#B89555] transition-colors h-full">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[#1A1A1A] truncate">{rep.full_name}</p>
                  <p className="text-xs text-[#1A1A1A]/70 mt-0.5 truncate">
                    {rep.position || rep.title || "Sales Representative"}
                  </p>
                </div>
                <RepAvailabilityBadge status={rep.availability_status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(rep.assigned_emirates ?? []).slice(0, 4).map((em) => (
                  <Badge key={em} variant="outline" className="text-[10.5px] border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A]">
                    {em}
                  </Badge>
                ))}
                {(rep.languages ?? []).slice(0, 3).map((l) => (
                  <Badge key={l} variant="outline" className="text-[10.5px] border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A]">
                    {l}
                  </Badge>
                ))}
              </div>
            </Card>
          </Link>
        ))}

        {!isLoading && reps.length === 0 && (
          <Card className="p-8 col-span-full text-center bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A]/70">
            No sales representatives match these filters.
          </Card>
        )}
      </div>
    </div>
  );
}
