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
import { Copy, Eye, EyeOff, Trash2, Pencil, Plus, ExternalLink, GripVertical, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const KINDS: GateSectionKind[] = ["hero", "overview", "video", "features", "solutions", "lead_cta", "login_signup"];

export default function OwnerPublicGateEditor() {
  const qc = useQueryClient();
  const { data: sections = [], isLoading } = usePublicGateSections({ includeHidden: true });
  const [editing, setEditing] = useState<GateSection | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["public_gate_sections"] });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sorted = [...sections].sort((a, b) => a.position - b.position);

  const onDragEnd = async (evt: DragEndEvent) => {
    const { active, over } = evt;
    if (!over || active.id === over.id) return;
    const oldIdx = sorted.findIndex((s) => s.id === active.id);
    const newIdx = sorted.findIndex((s) => s.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(sorted, oldIdx, newIdx);
    // Persist new positions (1-indexed sequential)
    await Promise.all(
      reordered.map((s, i) =>
        supabase.from("public_gate_sections").update({ position: i + 1 }).eq("id", s.id)
      )
    );
    refresh();
    toast.success("Reordered");
  };

  const toggleVisible = async (s: GateSection) => {
    await supabase.from("public_gate_sections").update({ visible: !s.visible }).eq("id", s.id);
    refresh();
  };
  const duplicate = async (s: GateSection) => {
    const { id, created_at, updated_at, position, ...rest } = s;
    await supabase.from("public_gate_sections").insert({ ...rest, position: (sections.at(-1)?.position ?? 0) + 1 });
    refresh();
    toast.success("Duplicated");
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
            <p className="text-sm text-[#1A1A1A]/70 mt-1">Edit the landing page shown to visitors. Drag rows to reorder.</p>
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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sorted.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sorted.map((s) => (
                <SortableRow
                  key={s.id}
                  section={s}
                  onEdit={() => setEditing(s)}
                  onToggle={() => toggleVisible(s)}
                  onDuplicate={() => duplicate(s)}
                  onRemove={() => remove(s)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <SectionEditSheet section={editing} onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["public_gate_sections"] }); }} />
    </div>
  );
}

function SortableRow({
  section: s, onEdit, onToggle, onDuplicate, onRemove,
}: {
  section: GateSection;
  onEdit: () => void; onToggle: () => void; onDuplicate: () => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  const hasMedia = s.media?.url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-4 bg-white transition-shadow ${s.visible ? "border-[#B89555]/25" : "border-dashed border-[#1A1A1A]/20 opacity-70"} ${isDragging ? "shadow-[0_20px_40px_-10px_rgba(6,78,59,0.35)]" : "hover:shadow-sm"}`}
    >
      <div className="flex items-start gap-3 flex-wrap">
        <button
          {...attributes} {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-[#1A1A1A]/40 hover:text-[#064E3B] p-1"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#064E3B] text-white font-semibold">{s.kind}</span>
            <span className="text-xs text-[#1A1A1A]/50">pos {s.position}</span>
            {hasMedia && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#B89555]">
                {s.kind === "video" ? <VideoIcon className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                media
              </span>
            )}
          </div>
          <h3 className="font-serif text-xl text-[#0d3a2b] truncate">{s.title || "(untitled)"}</h3>
          {s.subtitle && <p className="text-sm text-[#1A1A1A]/70 truncate">{s.subtitle}</p>}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <IconBtn onClick={onToggle} label={s.visible ? "Hide" : "Show"}>{s.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</IconBtn>
          <IconBtn onClick={onDuplicate} label="Duplicate"><Copy className="w-4 h-4" /></IconBtn>
          <IconBtn onClick={onEdit} label="Edit"><Pencil className="w-4 h-4" /></IconBtn>
          <IconBtn onClick={onRemove} danger label="Delete"><Trash2 className="w-4 h-4" /></IconBtn>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, danger, label }: { children: React.ReactNode; onClick: () => void; danger?: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`h-8 w-8 rounded-md border grid place-items-center transition-all active:scale-95 ${danger ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#F7F2EA] hover:border-[#064E3B]"}`}
    >
      {children}
    </button>
  );
}

function SectionEditSheet({ section, onClose }: { section: GateSection | null; onClose: () => void }) {
  const [local, setLocal] = useState<GateSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [propsText, setPropsText] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaPoster, setMediaPoster] = useState("");

  const opened = !!section;
  if (section && local?.id !== section.id) {
    setLocal(section);
    setPropsText(JSON.stringify(section.props ?? {}, null, 2));
    setCtaText(JSON.stringify(section.cta ?? {}, null, 2));
    setMediaUrl((section.media?.url as string) ?? "");
    setMediaPoster((section.media?.poster as string) ?? "");
  }

  const save = async () => {
    if (!local) return;
    setSaving(true);
    try {
      const props = safeJson(propsText, local.props);
      const cta = safeJson(ctaText, local.cta);
      const media = { ...(local.media || {}), url: mediaUrl || undefined, poster: mediaPoster || undefined };
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
            <div className="flex items-center gap-3 rounded-md border border-[#B89555]/25 bg-white px-3 py-2">
              <Switch checked={local.visible} onCheckedChange={(v) => setLocal({ ...local, visible: v })} />
              <span className="text-sm">{local.visible ? "Visible on landing page" : "Hidden"}</span>
            </div>
            <FieldRow label="Title">
              <Input value={local.title ?? ""} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
            </FieldRow>
            <FieldRow label="Subtitle">
              <Input value={local.subtitle ?? ""} onChange={(e) => setLocal({ ...local, subtitle: e.target.value })} />
            </FieldRow>
            <FieldRow label="Body">
              <Textarea rows={4} value={local.body ?? ""} onChange={(e) => setLocal({ ...local, body: e.target.value })} />
            </FieldRow>

            <div className="rounded-lg border border-[#B89555]/25 bg-white p-3 grid gap-3">
              <p className="text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A]/70 font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Media
              </p>
              <FieldRow label={local.kind === "video" ? "Video URL (mp4)" : "Image URL"}>
                <Input placeholder="https://…" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
              </FieldRow>
              {local.kind === "video" && (
                <FieldRow label="Poster (thumbnail image URL)">
                  <Input placeholder="https://…" value={mediaPoster} onChange={(e) => setMediaPoster(e.target.value)} />
                </FieldRow>
              )}
              {mediaUrl && (
                <div className="rounded-md overflow-hidden border border-[#B89555]/20 bg-[#F7F2EA]">
                  {local.kind === "video" ? (
                    <video src={mediaUrl} poster={mediaPoster || undefined} controls className="w-full h-40 object-cover" />
                  ) : (
                    <img src={mediaUrl} alt="preview" className="w-full h-40 object-cover" />
                  )}
                </div>
              )}
            </div>

            <FieldRow label="CTA (JSON — { primary:{label,action}, secondary:{...} })">
              <Textarea rows={4} value={ctaText} onChange={(e) => setCtaText(e.target.value)} className="font-mono text-xs" />
            </FieldRow>
            <FieldRow label="Props (JSON — items array etc.)">
              <Textarea rows={8} value={propsText} onChange={(e) => setPropsText(e.target.value)} className="font-mono text-xs" />
            </FieldRow>
            <Button variant="primary" onClick={save} disabled={saving} className="w-full h-11 transition-all active:scale-[0.98]">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-[11px] tracking-[0.18em] font-semibold uppercase text-[#1A1A1A]/70">{label}</Label>
      {children}
    </div>
  );
}

function safeJson(text: string, fallback: any) {
  try { return JSON.parse(text); } catch { return fallback; }
}
