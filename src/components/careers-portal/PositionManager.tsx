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
  Sparkles, Plus, Pencil, Trash2, Archive, RefreshCw, Wand2, Eye, EyeOff, Loader2,
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
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setPositions((data as unknown as Position[]) ?? []);
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
      is_active: !!p.is_active,
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
      is_active: form.is_active,
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

  const archive = async (p: Position) => {
    if (!confirm(`Archive "${p.title}"? It will be hidden from the public Careers page but kept for audit.`)) return;
    const { error } = await supabase
      .from("open_positions")
      .update({ is_active: false, archived_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Position archived");
    refresh();
  };

  const unarchive = async (p: Position) => {
    const { error } = await supabase
      .from("open_positions")
      .update({ is_active: true, archived_at: null })
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Position restored");
    refresh();
  };

  const remove = async (p: Position) => {
    if (!confirm(`Permanently delete "${p.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("open_positions").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Position deleted");
    refresh();
  };

  const visible = positions.filter((p) => showArchived ? !p.is_active : p.is_active);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-[#1A1A1A]">Open Positions</h2>
          <p className="text-sm text-[#1A1A1A]/70">
            Add, edit, archive or remove roles. Use AI to draft and refine the job description.
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
            {showArchived ? "Showing archived" : "Show archived"}
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
          {showArchived ? "No archived positions." : "No active positions yet. Click \"New Position\" to add one."}
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {visible.map((p) => (
            <Card key={p.id} className="border-[#B89555]/30">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3 justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[#1A1A1A]">{p.title}</h3>
                    {p.ai_generated && (
                      <Badge variant="outline" className="border-[#B89555] text-[#1A1A1A]">
                        <Sparkles className="w-3 h-3 mr-1" /> AI drafted
                      </Badge>
                    )}
                    {!p.is_active && <Badge variant="secondary">Archived</Badge>}
                  </div>
                  <p className="text-sm text-[#1A1A1A]/70">
                    {p.department} • {p.location ?? "Dubai, UAE"} • {p.employment_type ?? "full_time"}
                    {p.seniority ? ` • ${p.seniority}` : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="border-[#B89555]" onClick={() => openEdit(p)}>
                    <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                  {p.is_active ? (
                    <Button size="sm" variant="outline" className="border-[#B89555]" onClick={() => archive(p)}>
                      <Archive className="w-3.5 h-3.5 mr-1" /> Archive
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="border-[#B89555]" onClick={() => unarchive(p)}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Restore
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => remove(p)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <Label htmlFor="is_active">Active (visible on public Careers page)</Label>
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
