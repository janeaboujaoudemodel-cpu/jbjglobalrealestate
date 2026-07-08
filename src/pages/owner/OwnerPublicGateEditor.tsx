import { useState } from "react";
import { usePublicGateSections, type GateSection, type GateSectionKind } from "@/hooks/usePublicGateSections";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Copy, Eye, EyeOff, Trash2, Pencil, Plus, ExternalLink } from "lucide-react";

const KINDS: GateSectionKind[] = ["hero", "overview", "video", "features", "solutions", "lead_cta", "login_signup"];

export default function OwnerPublicGateEditor() {
  const qc = useQueryClient();
  const { data: sections = [], isLoading, refetch } = usePublicGateSections({ includeHidden: true });
  const [editing, setEditing] = useState<GateSection | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["public_gate_sections"] });

  const move = async (s: GateSection, dir: -1 | 1) => {
    const sorted = [...sections].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex((x) => x.id === s.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await supabase.from("public_gate_sections").update({ position: swap.position }).eq("id", s.id);
    await supabase.from("public_gate_sections").update({ position: s.position }).eq("id", swap.id);
    refresh();
  };
  const toggleVisible = async (s: GateSection) => {
    await supabase.from("public_gate_sections").update({ visible: !s.visible }).eq("id", s.id);
    refresh();
  };
  const duplicate = async (s: GateSection) => {
    const { id, created_at, updated_at, position, ...rest } = s;
    await supabase.from("public_gate_sections").insert({ ...rest, position: (sections.at(-1)?.position ?? 0) + 1 });
    refresh();
  };
  const remove = async (s: GateSection) => {
    if (!confirm(`Delete "${s.title ?? s.kind}"?`)) return;
    await supabase.from("public_gate_sections").delete().eq("id", s.id);
    refresh();
  };
  const add = async (kind: GateSectionKind) => {
    const pos = (sections.at(-1)?.position ?? 0) + 1;
    await supabase.from("public_gate_sections").insert({
      kind, position: pos, visible: true, title: `New ${kind} section`, subtitle: "", body: "",
      media: {}, cta: {}, props: {},
    });
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A] p-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl text-[#0d3a2b]">Company Profile · Public Gate Page</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">Edit the landing page shown to visitors before they sign up.</p>
          </div>
          <a href="/access" target="_blank" rel="noopener">
            <Button variant="secondary" size="sm"><ExternalLink className="w-4 h-4 mr-1" />Preview live</Button>
          </a>
        </div>

        <div className="mb-4 rounded-xl border border-[#B89555]/25 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1A1A1A]/70 mb-2">Add section</p>
          <div className="flex flex-wrap gap-2">
            {KINDS.map((k) => (
              <Button key={k} variant="secondary" size="sm" onClick={() => add(k)}>
                <Plus className="w-3.5 h-3.5 mr-1" />{k}
              </Button>
            ))}
          </div>
        </div>

        {isLoading && <p className="text-[#1A1A1A]/50">Loading…</p>}

        <div className="space-y-3">
          {[...sections].sort((a, b) => a.position - b.position).map((s) => (
            <div key={s.id} className={`rounded-xl border p-4 bg-white ${s.visible ? "border-[#B89555]/25" : "border-dashed border-[#1A1A1A]/20 opacity-60"}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#064E3B] text-white font-semibold">{s.kind}</span>
                    <span className="text-xs text-[#1A1A1A]/50">pos {s.position}</span>
                  </div>
                  <h3 className="font-serif text-xl text-[#0d3a2b] truncate">{s.title || "(untitled)"}</h3>
                  {s.subtitle && <p className="text-sm text-[#1A1A1A]/70 truncate">{s.subtitle}</p>}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <IconBtn onClick={() => move(s, -1)}><ArrowUp className="w-4 h-4" /></IconBtn>
                  <IconBtn onClick={() => move(s, 1)}><ArrowDown className="w-4 h-4" /></IconBtn>
                  <IconBtn onClick={() => toggleVisible(s)}>{s.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</IconBtn>
                  <IconBtn onClick={() => duplicate(s)}><Copy className="w-4 h-4" /></IconBtn>
                  <IconBtn onClick={() => setEditing(s)}><Pencil className="w-4 h-4" /></IconBtn>
                  <IconBtn onClick={() => remove(s)} danger><Trash2 className="w-4 h-4" /></IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SectionEditSheet section={editing} onClose={() => { setEditing(null); refresh(); }} />
    </div>
  );
}

function IconBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`h-8 w-8 rounded-md border grid place-items-center transition-colors ${danger ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#F7F2EA]"}`}>
      {children}
    </button>
  );
}

function SectionEditSheet({ section, onClose }: { section: GateSection | null; onClose: () => void }) {
  const [local, setLocal] = useState<GateSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [propsText, setPropsText] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [mediaText, setMediaText] = useState("");

  const opened = !!section;
  if (section && local?.id !== section.id) {
    setLocal(section);
    setPropsText(JSON.stringify(section.props ?? {}, null, 2));
    setCtaText(JSON.stringify(section.cta ?? {}, null, 2));
    setMediaText(JSON.stringify(section.media ?? {}, null, 2));
  }

  const save = async () => {
    if (!local) return;
    setSaving(true);
    try {
      const props = safeJson(propsText, local.props);
      const cta = safeJson(ctaText, local.cta);
      const media = safeJson(mediaText, local.media);
      const { error } = await supabase.from("public_gate_sections").update({
        title: local.title, subtitle: local.subtitle, body: local.body,
        visible: local.visible, props, cta, media,
      }).eq("id", local.id);
      if (error) throw error;
      toast.success("Saved");
      setLocal(null);
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={opened} onOpenChange={(o) => !o && (setLocal(null), onClose())}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto bg-[#FDFBF7]">
        <SheetHeader>
          <SheetTitle className="font-serif text-2xl text-[#0d3a2b]">Edit section</SheetTitle>
        </SheetHeader>
        {local && (
          <div className="grid gap-4 mt-4">
            <div className="flex items-center gap-3">
              <Switch checked={local.visible} onCheckedChange={(v) => setLocal({ ...local, visible: v })} />
              <span className="text-sm">{local.visible ? "Visible on landing page" : "Hidden"}</span>
            </div>
            <Field label="Title">
              <Input value={local.title ?? ""} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
            </Field>
            <Field label="Subtitle">
              <Input value={local.subtitle ?? ""} onChange={(e) => setLocal({ ...local, subtitle: e.target.value })} />
            </Field>
            <Field label="Body">
              <Textarea rows={4} value={local.body ?? ""} onChange={(e) => setLocal({ ...local, body: e.target.value })} />
            </Field>
            <Field label="Media (JSON — { url, poster })">
              <Textarea rows={3} value={mediaText} onChange={(e) => setMediaText(e.target.value)} className="font-mono text-xs" />
            </Field>
            <Field label="CTA (JSON — { primary:{label,action}, secondary:{...} })">
              <Textarea rows={4} value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="font-mono text-xs" />
            </Field>
            <Field label="Props (JSON — items array etc.)">
              <Textarea rows={8} value={propsText} onChange={(e) => setPropsText(e.target.value)} className="font-mono text-xs" />
            </Field>
            <Button variant="primary" onClick={save} disabled={saving} className="w-full">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wide text-[#1A1A1A]/80">{label}</Label>
      {children}
    </div>
  );
}

function safeJson(text: string, fallback: any) {
  try { return JSON.parse(text); } catch { return fallback; }
}
