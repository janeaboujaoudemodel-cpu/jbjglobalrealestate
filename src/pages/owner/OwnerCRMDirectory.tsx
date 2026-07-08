import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Download, Archive as ArchiveIcon, Search, Filter, RefreshCw } from "lucide-react";
import { CATEGORIES, DEVELOPER_POSITIONS, BROKER_POSITIONS, SERVICES, LANGUAGES } from "@/components/signup/constants";

type Profile = any;

const ALL_POSITIONS = Array.from(new Set([...DEVELOPER_POSITIONS, ...BROKER_POSITIONS])).sort();

const CAT_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);

export default function OwnerCRMDirectory() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [f, setF] = useState<Record<string, string>>({
    category: "", position: "", company: "", country: "", language: "", service: "", status: "",
  });
  const [selected, setSelected] = useState<Profile | null>(null);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("crm_user_profiles").select("*").order("created_at", { ascending: false });
    if (f.category) query = query.eq("category", f.category as any);
    if (f.position) query = query.eq("position", f.position);
    if (f.company) query = query.ilike("company_name", `%${f.company}%`);
    if (f.country) query = query.ilike("country", `%${f.country}%`);
    if (f.language) query = query.eq("preferred_language", f.language);
    if (f.status) query = query.eq("status", f.status);
    if (f.service) query = query.contains("services", [f.service]);
    if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
    const { data, error } = await query.limit(500);
    if (error) toast.error(error.message);
    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [f, q]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = { total: rows.length };
    for (const c of CATEGORIES) counts[c.value] = 0;
    for (const r of rows) counts[r.category] = (counts[r.category] || 0) + 1;
    return counts;
  }, [rows]);

  const exportCsv = () => {
    if (!rows.length) return;
    const cols = ["created_at","category","full_name","email","phone","country","nationality","company_name","position","years_experience","status"];
    const header = cols.join(",");
    const body = rows.map((r) => cols.map((c) => JSON.stringify(r[c] ?? "")).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `jbj-crm-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-[#0d3a2b]">CRM Directory</h1>
          <p className="text-sm text-[#1A1A1A]/60 mt-1">
            All registered users, segmented by category, position and preferences.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
          <Button onClick={exportCsv} className="bg-[#064E3B] hover:bg-[#053929] text-white">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </header>

      {/* stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Users" value={stats.total} onClick={() => setF({ ...f, category: "" })} />
        {CATEGORIES.map((c) => (
          <StatCard
            key={c.value}
            label={c.label}
            value={stats[c.value] ?? 0}
            active={f.category === c.value}
            onClick={() => setF({ ...f, category: f.category === c.value ? "" : c.value })}
          />
        ))}
      </div>

      {/* filters */}
      <div className="bg-white border border-[#B89555]/30 rounded-md p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#1A1A1A]/40" />
          <Input className="pl-9" placeholder="Search name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <SelectFilter label="Position" value={f.position} onChange={(v) => setF({ ...f, position: v })} options={ALL_POSITIONS} />
        <Input placeholder="Company / Developer / Brokerage" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
        <Input placeholder="Country" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} />
        <SelectFilter label="Language" value={f.language} onChange={(v) => setF({ ...f, language: v })} options={LANGUAGES} />
        <SelectFilter label="Service" value={f.service} onChange={(v) => setF({ ...f, service: v })} options={SERVICES} />
        <SelectFilter label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={["active","inactive"]} />
        <Button variant="ghost" onClick={() => { setF({ category:"",position:"",company:"",country:"",language:"",service:"",status:"" }); setQ(""); }}>
          <Filter className="w-4 h-4 mr-2" /> Clear filters
        </Button>
      </div>

      {/* table */}
      <div className="bg-white border border-[#B89555]/30 rounded-md overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-[#1A1A1A]/60">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-[#1A1A1A]/60">No profiles match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F2EA] text-[11px] tracking-[0.15em] uppercase text-[#1A1A1A]/60">
                <tr>
                  <Th>Name</Th><Th>Category</Th><Th>Position</Th><Th>Company</Th>
                  <Th>Country</Th><Th>Email</Th><Th>Phone</Th><Th>Registered</Th><Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} onClick={() => setSelected(r)} className="border-t border-[#B89555]/15 hover:bg-[#FDFBF7] cursor-pointer">
                    <Td className="font-medium">{r.full_name || "—"}</Td>
                    <Td><Badge variant="outline" className="border-[#064E3B]/30 text-[#064E3B]">{CAT_LABELS[r.category] ?? r.category}</Badge></Td>
                    <Td>{r.position || "—"}</Td>
                    <Td>{r.company_name || "—"}</Td>
                    <Td>{r.country || "—"}</Td>
                    <Td>{r.email}</Td>
                    <Td>{r.phone || "—"}</Td>
                    <Td>{new Date(r.created_at).toLocaleDateString()}</Td>
                    <Td>{r.archived_at ? <span className="text-[#8B0000]">Archived</span> : r.status}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProfileDrawer profile={selected} onClose={() => setSelected(null)} onSaved={load} />
    </div>
  );
}

function StatCard({ label, value, active, onClick }: { label: string; value: number; active?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`text-left p-3 rounded-md border transition-colors ${active ? "bg-[#064E3B] text-white border-[#064E3B]" : "bg-white border-[#B89555]/30 hover:border-[#064E3B]"}`}
    >
      <div className={`text-[10px] tracking-[0.18em] uppercase ${active ? "text-white/80" : "text-[#1A1A1A]/60"}`}>{label}</div>
      <div className="font-serif text-2xl mt-1">{value}</div>
    </button>
  );
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value || "__all"} onValueChange={(v) => onChange(v === "__all" ? "" : v)}>
      <SelectTrigger><SelectValue placeholder={label} /></SelectTrigger>
      <SelectContent className="bg-white z-50 max-h-72">
        <SelectItem value="__all">All {label.toLowerCase()}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => <th className="text-left px-3 py-2 font-normal">{children}</th>;
const Td = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => <td className={`px-3 py-2 ${className}`}>{children}</td>;

function ProfileDrawer({ profile, onClose, onSaved }: { profile: any; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>(profile);
  const [notes, setNotes] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profile);
    if (!profile) return;
    (async () => {
      const [n, a] = await Promise.all([
        supabase.from("crm_profile_notes").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }),
        supabase.from("crm_profile_activity").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(30),
      ]);
      setNotes(n.data || []);
      setActivity(a.data || []);
    })();
  }, [profile]);

  if (!profile || !form) return null;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("crm_user_profiles").update({
      full_name: form.full_name, phone: form.phone, whatsapp: form.whatsapp,
      country: form.country, nationality: form.nationality,
      preferred_language: form.preferred_language,
      preferred_contact_method: form.preferred_contact_method,
      preferred_contact_time: form.preferred_contact_time,
      notes: form.notes, status: form.status,
      position: form.position, company_name: form.company_name,
      tags: form.tags, internal_labels: form.internal_labels,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await supabase.from("crm_profile_activity").insert({ profile_id: profile.id, type: "edited", payload: {} });
    toast.success("Profile updated");
    onSaved();
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("crm_profile_notes").insert({ profile_id: profile.id, author_id: user?.id, body: newNote });
    if (error) return toast.error(error.message);
    setNewNote("");
    const n = await supabase.from("crm_profile_notes").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false });
    setNotes(n.data || []);
  };

  const archive = async () => {
    await supabase.from("crm_user_profiles").update({ archived_at: new Date().toISOString(), status: "inactive" }).eq("id", profile.id);
    toast.success("Archived");
    onSaved(); onClose();
  };

  return (
    <Sheet open={!!profile} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-[#FDFBF7]">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl text-[#0d3a2b]">
            {form.full_name} <Badge className="ml-2 bg-[#064E3B]">{CAT_LABELS[form.category] ?? form.category}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 grid gap-6">
          <section className="grid grid-cols-2 gap-3">
            <L label="Full name"><Input value={form.full_name || ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></L>
            <L label="Position"><Input value={form.position || ""} onChange={(e) => setForm({ ...form, position: e.target.value })} /></L>
            <L label="Company"><Input value={form.company_name || ""} onChange={(e) => setForm({ ...form, company_name: e.target.value })} /></L>
            <L label="Phone"><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></L>
            <L label="WhatsApp"><Input value={form.whatsapp || ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></L>
            <L label="Country"><Input value={form.country || ""} onChange={(e) => setForm({ ...form, country: e.target.value })} /></L>
            <L label="Nationality"><Input value={form.nationality || ""} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></L>
            <L label="Preferred language"><Input value={form.preferred_language || ""} onChange={(e) => setForm({ ...form, preferred_language: e.target.value })} /></L>
            <L label="Contact method"><Input value={form.preferred_contact_method || ""} onChange={(e) => setForm({ ...form, preferred_contact_method: e.target.value })} /></L>
            <L label="Contact time"><Input value={form.preferred_contact_time || ""} onChange={(e) => setForm({ ...form, preferred_contact_time: e.target.value })} /></L>
            <L label="Status">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </L>
            <L label="Tags (comma-sep)">
              <Input value={(form.tags || []).join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} />
            </L>
          </section>

          <section>
            <h3 className="font-serif text-lg text-[#0d3a2b] mb-2">Services</h3>
            <div className="flex flex-wrap gap-1.5">
              {(form.services || []).map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
              {!(form.services || []).length && <span className="text-xs text-[#1A1A1A]/50">None</span>}
            </div>
          </section>

          <section>
            <h3 className="font-serif text-lg text-[#0d3a2b] mb-2">Category details</h3>
            <pre className="text-xs bg-white border border-[#B89555]/30 rounded p-3 overflow-x-auto">
              {JSON.stringify(form.category_data || {}, null, 2)}
            </pre>
          </section>

          <section>
            <h3 className="font-serif text-lg text-[#0d3a2b] mb-2">Internal notes</h3>
            <div className="space-y-2 mb-3">
              {notes.map((n) => (
                <div key={n.id} className="bg-white border border-[#B89555]/20 rounded p-3 text-sm">
                  <div className="text-[11px] text-[#1A1A1A]/50 mb-1">{new Date(n.created_at).toLocaleString()}</div>
                  {n.body}
                </div>
              ))}
              {!notes.length && <div className="text-xs text-[#1A1A1A]/50">No notes yet.</div>}
            </div>
            <Textarea placeholder="Add a note…" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
            <Button className="mt-2 bg-[#064E3B] hover:bg-[#053929] text-white" onClick={addNote}>Add note</Button>
          </section>

          <section>
            <h3 className="font-serif text-lg text-[#0d3a2b] mb-2">Activity</h3>
            <ul className="space-y-1 text-xs text-[#1A1A1A]/70">
              {activity.map((a) => (
                <li key={a.id}>
                  <span className="text-[#0d3a2b] font-medium">{a.type}</span> — {new Date(a.created_at).toLocaleString()}
                </li>
              ))}
              {!activity.length && <li>No activity yet.</li>}
            </ul>
          </section>

          <div className="flex justify-between border-t border-[#B89555]/20 pt-4">
            <Button variant="ghost" onClick={archive}><ArchiveIcon className="w-4 h-4 mr-2" /> Archive</Button>
            <Button className="bg-[#064E3B] hover:bg-[#053929] text-white" onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <label className="text-[10px] tracking-[0.18em] uppercase text-[#1A1A1A]/60">{label}</label>
      {children}
    </div>
  );
}
