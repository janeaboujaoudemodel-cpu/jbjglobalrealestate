import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sparkles, Plus, Pencil, Trash2, RefreshCw, Wand2, Eye, EyeOff, Loader2,
  Star, Flame, Pause, XCircle, EyeOff as Hide, CircleDot,
} from "lucide-react";
import { toast } from "sonner";

type JobStatus = "open" | "urgent" | "paused" | "closed" | "hidden";

const STATUS_META: Record<JobStatus, { label: string; icon: any; pill: string }> = {
  open:    { label: "Open",          icon: CircleDot, pill: "bg-[#E8F4EC] text-[#1F6B3A] border-[#1F6B3A]/40" },
  urgent:  { label: "Urgent Hiring", icon: Flame,     pill: "bg-[#FEF3F2] text-[#C04A2B] border-[#C04A2B]/50" },
  paused:  { label: "Paused",        icon: Pause,     pill: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60" },
  closed:  { label: "Closed",        icon: XCircle,   pill: "bg-[#EFE6D6] text-[#1A1A1A] border-[#1A1A1A]/40" },
  hidden:  { label: "Hidden",        icon: Hide,      pill: "bg-[#1A1A1A] text-white border-[#B89555]/40" },
};

interface Position {
  id: string;
  title: string;
  department: string;
  description: string | null;
  requirements: string[] | null;
  employment_type: string | null;
  is_active: boolean | null;
  is_broker_role: boolean | null;
  location: string | null;
  seniority: string | null;
  salary_band: string | null;
  ai_generated: boolean | null;
  archived_at: string | null;
  created_at: string;
  status: JobStatus | null;
  is_featured: boolean | null;
  application_cap: number | null;
  applications_count: number | null;
}

interface FormState {
  id?: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  seniority: string;
  salary_band: string;
  description: string;
  requirements: string[];
  status: JobStatus;
  is_featured: boolean;
  application_cap: string;
  ai_generated: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  department: "",
  location: "Dubai, UAE",
  employment_type: "full_time",
  seniority: "",
  salary_band: "",
  description: "",
  requirements: [],
  status: "open",
  is_featured: false,
  application_cap: "",
  ai_generated: false,
};

export default function PositionManager() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState<null | "generate" | "regenerate" | "edit">(null);
  const [aiInstruction, setAiInstruction] = useState("");

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("open_positions")
      .select("*")
      // Featured roles first, then newest. Toggling Feature reorders the list
      // visibly so the action never feels like a "blink".
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPositions((data as Position[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);


  const openCreate = () => { setForm(EMPTY_FORM); setAiInstruction(""); setEditorOpen(true); };
  const openEdit = (p: Position) => {
    setForm({
      id: p.id,
      title: p.title,
      department: p.department,
      location: p.location ?? "Dubai, UAE",
      employment_type: p.employment_type ?? "full_time",
      seniority: p.seniority ?? "",
      salary_band: p.salary_band ?? "",
      description: p.description ?? "",
      requirements: p.requirements ?? [],
      status: (p.status as JobStatus) ?? (p.is_active ? "open" : "hidden"),
      is_featured: !!p.is_featured,
      application_cap: p.application_cap != null ? String(p.application_cap) : "",
      ai_generated: !!p.ai_generated,
    });
    setAiInstruction("");
    setEditorOpen(true);
  };

  const callAI = async (mode: "generate" | "regenerate" | "edit") => {
    if (!form.title.trim()) return toast.error("Enter a job title first");
    if (mode === "edit" && !aiInstruction.trim()) return toast.error("Tell the AI what to change");
    setAiBusy(mode);
    try {
      const { data, error } = await supabase.functions.invoke("generate-job-description", {
        body: {
          mode,
          title: form.title,
          department: form.department,
          location: form.location,
          employment_type: form.employment_type,
          seniority: form.seniority,
          salary_band: form.salary_band,
          current_description: form.description,
          current_requirements: form.requirements,
          instruction: aiInstruction,
        },
      });
      if (error) throw error;
      const jd = (data as { jd: { description_html?: string; summary?: string; responsibilities?: string[]; requirements?: string[] } })?.jd;
      if (!jd) throw new Error("Empty AI response");
      const composed = [
        jd.summary ? `<h3>Overview</h3><p>${jd.summary}</p>` : "",
        jd.responsibilities?.length
          ? `<h3>Responsibilities</h3><ul>${jd.responsibilities.map((r) => `<li>${r}</li>`).join("")}</ul>`
          : "",
        jd.description_html && !jd.summary ? jd.description_html : "",
      ].filter(Boolean).join("\n");
      setForm((f) => ({
        ...f,
        description: composed || jd.description_html || f.description,
        requirements: jd.requirements?.length ? jd.requirements : f.requirements,
        ai_generated: true,
      }));
      toast.success(mode === "edit" ? "AI applied your edits" : "AI draft ready — review and save");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI call failed";
      toast.error(msg);
    } finally {
      setAiBusy(null);
    }
  };

  const save = async () => {
    if (!form.title.trim() || !form.department.trim()) {
      return toast.error("Title and department are required");
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      department: form.department.trim(),
      location: form.location || "Dubai, UAE",
      employment_type: form.employment_type || "full_time",
      seniority: form.seniority || null,
      salary_band: form.salary_band || null,
      description: form.description || null,
      requirements: form.requirements,
      status: form.status,
      is_featured: form.is_featured,
      application_cap: form.application_cap.trim() === "" ? null : Math.max(0, parseInt(form.application_cap, 10) || 0),
      ai_generated: form.ai_generated,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from("open_positions").update(payload).eq("id", form.id));
    } else {
      ({ error } = await supabase.from("open_positions").insert(payload));
    }
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(form.id ? "Position updated" : "Position created");
    setEditorOpen(false);
    refresh();
  };


  const remove = async (p: Position) => {
    if (!confirm(`Permanently delete "${p.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("open_positions").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Position deleted");
    refresh();
  };

  const changeStatus = async (p: Position, status: JobStatus) => {
    const { error } = await supabase
      .from("open_positions")
      .update({ status })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(`Status set to ${STATUS_META[status].label}`);
    refresh();
  };

  const toggleFeatured = async (p: Position) => {
    const { error } = await supabase
      .from("open_positions")
      .update({ is_featured: !p.is_featured })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(p.is_featured ? "Removed from Featured" : "Marked as Featured");
    refresh();
  };

  const visible = positions.filter((p) => {
    const isHidden = (p.status ?? (p.is_active ? "open" : "hidden")) === "hidden";
    return showArchived ? isHidden : !isHidden;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Open Positions</h2>
          <p className="text-sm text-[#1A1A1A]/70">
            Add, edit, change status, cap applications, or feature roles. Hidden roles disappear from the public Careers page.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
            className="border-[#B89555]"
          >
            {showArchived ? <Eye className="w-4 h-4 mr-1.5" /> : <EyeOff className="w-4 h-4 mr-1.5" />}
            {showArchived ? "Showing hidden" : "Show hidden"}
          </Button>
          <Button
            data-allow-dark-cta
            data-no-contrast-guard
            onClick={openCreate}
            className="bg-[#102540] hover:bg-[#1a3d63] text-white border border-[#B89555]"
          >
            <Plus className="w-4 h-4 mr-1.5" /> New Position
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#1A1A1A]/70">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading positions…
        </div>
      ) : visible.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-[#1A1A1A]/70">
          {showArchived ? "No hidden positions." : "No active positions yet. Click \"New Position\" to add one."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((p) => {
            const status = (p.status as JobStatus) ?? (p.is_active ? "open" : "hidden");
            const meta = STATUS_META[status];
            const cap = p.application_cap;
            const count = p.applications_count ?? 0;
            const limitReached = cap != null && count >= cap;
            const StatusIcon = meta.icon;
            return (
              <Card key={p.id} className="border-[#B89555]/30">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-[#1A1A1A]">{p.title}</h3>
                      <span
                        data-no-contrast-guard={status === "hidden" ? "" : undefined}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.pill}`}
                      >
                        <StatusIcon className={`w-3 h-3 ${status === "hidden" ? "allow-white" : ""}`} />
                        {meta.label}
                      </span>
                      {p.is_featured && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={{ backgroundColor: "#102540", color: "#FFFFFF", borderColor: "#B89555" }}
                          data-no-contrast-guard
                        >
                          <Star className="w-3 h-3 allow-white" style={{ color: "#FFFFFF" }} /> Featured
                        </span>
                      )}
                      {limitReached && (
                        <Badge variant="outline" className="border-[#1A1A1A]/40 text-[#1A1A1A]">
                          Application Limit Reached
                        </Badge>
                      )}
                      {p.ai_generated && (
                        <Badge variant="outline" className="border-[#B89555] text-[#1A1A1A]">
                          <Sparkles className="w-3 h-3 mr-1" /> AI drafted
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#1A1A1A]/70">
                      {p.department} • {p.location ?? "Dubai, UAE"} • {p.employment_type ?? "full_time"}
                      {p.seniority ? ` • ${p.seniority}` : ""}
                      {cap != null ? ` • ${count}/${cap} applicants` : count ? ` • ${count} applicants` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    <Select value={status} onValueChange={(v) => changeStatus(p, v as JobStatus)}>
                      <SelectTrigger className="h-9 w-[170px] border-[#B89555]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_META) as JobStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm" variant="outline" className="border-[#B89555]"
                      onClick={() => toggleFeatured(p)}
                      title={p.is_featured ? "Unfeature" : "Mark as Featured"}
                    >
                      <Star className={`w-3.5 h-3.5 mr-1 ${p.is_featured ? "fill-[#B89555] text-[#B89555]" : ""}`} />
                      {p.is_featured ? "Featured" : "Feature"}
                    </Button>
                    <Button size="sm" variant="outline" className="border-[#B89555]" onClick={() => openEdit(p)}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => remove(p)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}


      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit Position" : "New Position"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Job Title *</Label>
              <div className="flex gap-2">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Leasing Consultant" />
                <Button
                  type="button"
                  data-allow-dark-cta
                  data-no-contrast-guard
                  onClick={() => callAI("generate")}
                  disabled={!!aiBusy || !form.title.trim()}
                  className="shrink-0 bg-[#102540] hover:bg-[#1a3d63] text-white border border-[#B89555]"
                >
                  {aiBusy === "generate" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                  Generate with AI
                </Button>
              </div>
              <p className="text-xs text-[#1A1A1A]/60 mt-1">AI will draft a full description from the title and details below.</p>
            </div>

            <div>
              <Label>Department *</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Sales" />
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label>Employment Type</Label>
              <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full time</SelectItem>
                  <SelectItem value="part_time">Part time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Seniority</Label>
              <Select value={form.seniority || "unset"} onValueChange={(v) => setForm({ ...form, seniority: v === "unset" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">Unspecified</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Salary Band (optional)</Label>
              <Input value={form.salary_band} onChange={(e) => setForm({ ...form, salary_band: e.target.value })} placeholder="e.g. AED 15,000 – 22,000 / month" />
            </div>

            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label>Job Description</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="border-[#B89555]"
                    disabled={!!aiBusy || !form.title.trim()}
                    onClick={() => callAI("regenerate")}>
                    {aiBusy === "regenerate" ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                    Regenerate
                  </Button>
                </div>
              </div>
              <Textarea
                rows={10}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Write or generate the full job description…"
              />
              <p className="text-xs text-[#1A1A1A]/60">HTML allowed. Sanitized on the public page.</p>
            </div>

            <div className="md:col-span-2 rounded-lg border border-[#B89555]/40 p-3 bg-[#F7F2EA]/40">
              <Label className="flex items-center gap-1.5"><Wand2 className="w-4 h-4" /> Edit with AI</Label>
              <p className="text-xs text-[#1A1A1A]/70 mb-2">
                Tell the AI exactly what to change in the description above. It will rewrite only what you ask.
              </p>
              <div className="flex gap-2">
                <Input
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  placeholder='e.g. "make it more senior" or "add Arabic-language requirement"'
                />
                <Button type="button"
                  data-allow-dark-cta data-no-contrast-guard
                  disabled={!!aiBusy || !aiInstruction.trim() || !form.description.trim()}
                  onClick={() => callAI("edit")}
                  className="shrink-0 bg-[#102540] hover:bg-[#1a3d63] text-white border border-[#B89555]">
                  {aiBusy === "edit" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1.5" />}
                  Apply AI Edit
                </Button>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Requirements (one per line)</Label>
              <Textarea
                rows={5}
                value={(form.requirements ?? []).join("\n")}
                onChange={(e) => setForm({ ...form, requirements: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })}
                placeholder={"5+ years experience in Dubai real estate\nFluent English; Arabic a plus"}
              />
            </div>

            <div className="md:col-span-2 grid gap-3 md:grid-cols-3 rounded-lg border border-[#B89555]/40 p-3 bg-[#F7F2EA]/40">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as JobStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_META) as JobStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-[#1A1A1A]/60 mt-1">
                  Hidden removes the role from the public page entirely.
                </p>
              </div>
              <div>
                <Label>Application cap (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.application_cap}
                  onChange={(e) => setForm({ ...form, application_cap: e.target.value })}
                  placeholder="e.g. 50"
                />
                <p className="text-[11px] text-[#1A1A1A]/60 mt-1">
                  Auto-shows "Application Limit Reached" when met.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="is_featured"
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                />
                <Label htmlFor="is_featured" className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-[#B89555]" /> Featured
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} className="border-[#B89555]">Cancel</Button>
            <Button
              data-allow-dark-cta data-no-contrast-guard
              onClick={save} disabled={saving}
              className="bg-[#102540] hover:bg-[#1a3d63] text-white border border-[#B89555]"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              {form.id ? "Save changes" : "Create position"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
