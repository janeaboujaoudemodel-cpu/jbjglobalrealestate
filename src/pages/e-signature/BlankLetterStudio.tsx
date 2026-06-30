/**
 * Blank Letter Studio — generate a JBJ letter with AI on a branded A4 sheet.
 *
 * v3 (this revision):
 *  • Body is a plain-text textarea (NOT HTML code). The user types it like
 *    a normal letter; line breaks become paragraph breaks in the rendered
 *    preview / PDF.
 *  • Signer title defaults to "Founder & CEO".
 *  • Date is always editable in its own field on the right.
 *  • Saved signatures and stamps are shown as thumbnails — uploads land
 *    instantly, with a "default" selector and delete control.
 *  • Signature & stamp can be dragged on the live preview; X removes the
 *    placement, "Reset placement" returns to the standard (signature
 *    bottom-left over a line, stamp bottom-right).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Sparkles, Download, Loader2, ArrowLeft, Stamp as StampIcon, PenTool,
  Calendar, Save, Trash2, RotateCcw, Star, X, FileSignature,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { renderHtmlToPdfBlob, allocateDocNumber, useEsignTemplates, useCreateEnvelopeFromTemplate } from "@/hooks/useEsignTemplates";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { FileText, ChevronDown } from "lucide-react";
import { buildBlankLetterHtml, BLANK_LETTER_TEMPLATE_KEY, type BlankLetterValues } from "@/templates/jbjBlankLetter";
import {
  useOwnerSignatureAssets,
  useSaveSignatureAsset,
  type OwnerSignatureAsset,
} from "@/hooks/useOwnerSignatureAssets";
import { useQueryClient } from "@tanstack/react-query";

const PRESETS = [
  { id: "offer", label: "Job Offer", prompt: "Write a formal job offer letter for [Name] for the position of [Title], salary AED [amount]/month, start date [date], 6-month probation, 30 days annual leave." },
  { id: "warning", label: "Warning Letter", prompt: "Write a formal HR warning letter to [Name] regarding [issue]. Reference company policy and request corrective action within [N] days." },
  { id: "vat", label: "VAT Exemption", prompt: "Write a VAT exemption confirmation letter for [client/property] in accordance with UAE FTA guidance for [reason]." },
  { id: "noc", label: "NOC", prompt: "Write a No-Objection Certificate (NOC) authorising [Name] to [action] on behalf of JBJ Global Real Estate." },
  { id: "salary", label: "Salary Certificate", prompt: "Write a salary certificate for employee [Name], position [Title], confirming gross monthly salary AED [amount] for [purpose]." },
  { id: "termination", label: "Termination", prompt: "Write a respectful employment termination letter for [Name] effective [date], referencing notice period and final settlement." },
  { id: "reference", label: "Reference Letter", prompt: "Write a professional reference letter for [Name] who served as [Title] from [date] to [date]." },
];

const categoryKeyFromPrompt = (prompt: string) => {
  const text = prompt.toLowerCase();
  if (/offer|job offer/.test(text)) return "offer";
  if (/warning/.test(text)) return "warning";
  if (/vat/.test(text)) return "vat";
  if (/\bnoc\b|no-objection/.test(text)) return "noc";
  if (/salary/.test(text)) return "salary";
  if (/termination/.test(text)) return "termination";
  if (/reference/.test(text)) return "reference";
  return "letterhead";
};

export default function BlankLetterStudio() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const sigInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [docNumber, setDocNumber] = useState("");
  const [prompt, setPrompt] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("Founder & CEO");
  const [date, setDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [placedSig, setPlacedSig] = useState<{ x: number; y: number } | null>(null);
  const [placedStamp, setPlacedStamp] = useState<{ x: number; y: number } | null>(null);
  const [activeSigId, setActiveSigId] = useState<string | null>(null);
  const [activeStampId, setActiveStampId] = useState<string | null>(null);

  const { data: signatures = [] } = useOwnerSignatureAssets("signature");
  const { data: stamps = [] } = useOwnerSignatureAssets("stamp");
  const saveAsset = useSaveSignatureAsset();
  const { data: allTemplates = [] } = useEsignTemplates("all");
  const createFromTemplate = useCreateEnvelopeFromTemplate();
  const [switchingTemplate, setSwitchingTemplate] = useState<string | null>(null);

  const handlePickTemplate = async (tpl: any) => {
    if (tpl.key === BLANK_LETTER_TEMPLATE_KEY || tpl.key === "jbj-letterhead-blank") return;
    setSwitchingTemplate(tpl.key);
    try {
      const env = await createFromTemplate.mutateAsync({ template: tpl });
      toast.success(`Opened ${tpl.name}`);
      navigate(`/owner/documents/forms/${env.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to open template");
    } finally {
      setSwitchingTemplate(null);
    }
  };

  const activeSignature: OwnerSignatureAsset | undefined = useMemo(
    () => signatures.find(s => s.id === activeSigId) || signatures.find(s => s.is_default) || signatures[0],
    [signatures, activeSigId],
  );
  const activeStamp: OwnerSignatureAsset | undefined = useMemo(
    () => stamps.find(s => s.id === activeStampId) || stamps.find(s => s.is_default) || stamps[0],
    [stamps, activeStampId],
  );

  // Allocate a doc number on mount + load owner name
  useEffect(() => {
    (async () => {
      try {
        const dn = await allocateDocNumber(`${BLANK_LETTER_TEMPLATE_KEY}:letterhead`);
        setDocNumber(dn);
      } catch {
        setDocNumber(`JBJ-LTR-${Date.now().toString().slice(-6)}`);
      }
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (u) {
        setSignerName(((u.user_metadata as any)?.full_name) || u.email || "");
      }
    })();
  }, []);

  const values: BlankLetterValues = useMemo(() => ({
    doc_number: docNumber,
    subject,
    date,
    recipient,
    body_text: bodyText,
    signer_name: signerName,
    signer_title: signerTitle,
    placed_signature_x: placedSig ? String(placedSig.x) : "",
    placed_signature_y: placedSig ? String(placedSig.y) : "",
    placed_stamp_x: placedStamp ? String(placedStamp.x) : "",
    placed_stamp_y: placedStamp ? String(placedStamp.y) : "",
  }), [docNumber, subject, date, recipient, bodyText, signerName, signerTitle, placedSig, placedStamp]);

  const previewHtml = useMemo(() => buildBlankLetterHtml(values, {
    ownerSignatureUrl: activeSignature?.image_url || null,
    ownerStampUrl: activeStamp?.image_url || null,
    renderMode: "edit",
  }), [values, activeSignature?.image_url, activeStamp?.image_url]);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Type what the letter should say"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
        body: { prompt, recipient },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const r: any = data;
      const categoryKey = categoryKeyFromPrompt(prompt);
      const nextDocNumber = await allocateDocNumber(`${BLANK_LETTER_TEMPLATE_KEY}:${categoryKey}`);
      setDocNumber(nextDocNumber);
      if (r?.subject) setSubject(r.subject);
      if (r?.recipient) setRecipient(r.recipient);
      if (r?.body_text) setBodyText(r.body_text);
      if (r?.signer_title) setSignerTitle(r.signer_title);
      if (r?.date && !date) setDate(r.date);
      toast.success("Letter drafted with category numbering — edit it like normal text");
    } catch (e: any) {
      toast.error(e?.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleUpload = async (kind: "signature" | "stamp", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await saveAsset.mutateAsync({
          kind,
          image_data_url: String(reader.result),
          label: file.name,
          // First upload becomes default. Otherwise just save without overriding default.
          makeDefault: (kind === "signature" ? signatures.length === 0 : stamps.length === 0),
        });
      } catch {/* toast in hook */}
    };
    reader.readAsDataURL(file);
    if (kind === "signature" && sigInputRef.current) sigInputRef.current.value = "";
    if (kind === "stamp" && stampInputRef.current) stampInputRef.current.value = "";
  };

  const setDefaultAsset = async (kind: "signature" | "stamp", id: string) => {
    try {
      await supabase.from("owner_signature_assets" as any).update({ is_default: false }).eq("kind", kind);
      await supabase.from("owner_signature_assets" as any).update({ is_default: true }).eq("id", id);
      qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
      toast.success("Default updated");
    } catch (e: any) { toast.error(e?.message || "Failed to update default"); }
  };

  const deleteAsset = async (id: string) => {
    if (!confirm("Delete this asset?")) return;
    try {
      await supabase.from("owner_signature_assets" as any).delete().eq("id", id);
      qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
      toast.success("Deleted");
    } catch (e: any) { toast.error(e?.message || "Failed to delete"); }
  };

  const handleInsertDate = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
  };

  // ── Drag handling on the preview ─────────────────────────────────────
  const startDrag = (kind: "sig" | "stamp", evt: React.MouseEvent) => {
    evt.preventDefault();
    const container = previewRef.current?.firstElementChild as HTMLElement | null;
    if (!container) return;
    const move = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;
      const clamped = { x: Math.max(0, Math.min(95, xPct)), y: Math.max(0, Math.min(95, yPct)) };
      if (kind === "sig") setPlacedSig(clamped);
      else setPlacedStamp(clamped);
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const buildFinalHtml = () => buildBlankLetterHtml(values, {
    ownerSignatureUrl: activeSignature?.image_url || null,
    ownerStampUrl: activeStamp?.image_url || null,
    renderMode: "final",
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const html = buildFinalHtml();
      const { blob } = await renderHtmlToPdfBlob(html);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docNumber || "JBJ-Letter"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Letter downloaded");
    } catch (e: any) {
      toast.error(e?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!subject && !bodyText) { toast.error("Nothing to save yet"); return; }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Not signed in");
      const html = buildFinalHtml();
      const { blob } = await renderHtmlToPdfBlob(html);
      const filename = `${user.id}/${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("esign-documents")
        .upload(filename, blob, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("esign-documents").getPublicUrl(filename);
      const { data: env, error: envErr } = await supabase
        .from("esign_envelopes")
        .insert({
          name: `${docNumber} — ${subject || "Letter"}`,
          description: "AI-drafted letter",
          document_url: urlData.publicUrl,
          document_filename: `${docNumber}.pdf`,
          document_size_bytes: blob.size,
          page_count: 1,
          sender_id: user.id,
          sender_email: user.email!,
          sender_name: ((user.user_metadata as any)?.full_name) || user.email,
          status: "draft",
          email_subject: subject || `Letter ${docNumber}`,
          category: "other",
          template_key: BLANK_LETTER_TEMPLATE_KEY,
          template_html: html,
          template_field_values: values as any,
          metadata: { doc_number: docNumber, cc_emails: [] },
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();
      if (envErr) throw envErr;
      toast.success("Letter saved to your library");
      navigate(`/owner/documents/forms/${env.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Auto-scale: measure available preview area and scale the 794×1123 A4 page to fit.
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  useEffect(() => {
    const recompute = () => {
      const el = previewBoxRef.current;
      if (!el) return;
      const w = el.clientWidth - 24;
      const h = el.clientHeight - 24;
      const s = Math.min(w / 794, h / 1123);
      if (isFinite(s) && s > 0.2) setScale(Math.min(s, 1.2));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (previewBoxRef.current) ro.observe(previewBoxRef.current);
    window.addEventListener("resize", recompute);
    return () => { ro.disconnect(); window.removeEventListener("resize", recompute); };
  }, []);

  // Collapsible top control panels — closed by default so the A4 page is the hero.
  const [openAI, setOpenAI] = useState(false);
  const [openFields, setOpenFields] = useState(true);
  const [openAssets, setOpenAssets] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);

  const SectionToggle = ({ open, onToggle, label, icon: Icon }: any) => (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
        open ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]" : "bg-white border-[#EFE6D6] text-[#1A1A1A]/80 hover:border-[#B89555]/60"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Top toolbar — sticky so controls are always reachable */}
      <div className="sticky top-0 z-30 bg-[#FDFBF7]/95 backdrop-blur border-b border-[#EFE6D6]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/owner/documents/forms")} className="text-[#1A1A1A]">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight text-[#1A1A1A] truncate">Standard JBJ Letterhead</h1>
              <p className="text-[11px] text-[#1A1A1A]/70 truncate">Branded A4 · {docNumber}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2 border-[#B89555]/40 text-[#1A1A1A]">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  Templates
                  <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72 bg-[#FDFBF7] border-[#B89555]/40">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60">
                  Switch document template
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTemplates.length === 0 && (
                  <div className="px-2 py-3 text-[11px] text-[#1A1A1A]/60">No templates yet.</div>
                )}
                {allTemplates.map((tpl) => {
                  const isCurrent = tpl.key === BLANK_LETTER_TEMPLATE_KEY || tpl.key === "jbj-letterhead-blank";
                  const isLoading = switchingTemplate === tpl.key;
                  return (
                    <DropdownMenuItem
                      key={tpl.id}
                      disabled={isCurrent || isLoading}
                      onSelect={(e) => { e.preventDefault(); if (!isCurrent) handlePickTemplate(tpl); }}
                      className="flex items-start gap-2 cursor-pointer focus:bg-[#EFE6D6]"
                    >
                      <FileText className="w-4 h-4 mt-0.5 text-[#B89555] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                          {tpl.name}
                          {isCurrent && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EFE6D6] text-[#1A1A1A]/70">Current</span>}
                          {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                        </div>
                        <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mt-0.5">
                          {tpl.category}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <SectionToggle open={openAI} onToggle={() => setOpenAI(v => !v)} label="AI Prompt" icon={Sparkles} />
            <SectionToggle open={openFields} onToggle={() => setOpenFields(v => !v)} label="Fields" icon={FileSignature} />
            <SectionToggle open={openAssets} onToggle={() => setOpenAssets(v => !v)} label="Signature & Stamp" icon={PenTool} />
            <div className="w-px h-6 bg-[#EFE6D6] mx-1" />
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Save
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={downloading} className="bg-[#EFE6D6] hover:bg-[#F7F2EA]/90 text-[#1A1A1A]">
              {downloading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Download className="w-3.5 h-3.5 mr-1.5" />}
              Download PDF
            </Button>
          </div>
        </div>

        {/* Collapsible AI prompt */}
        {openAI && (
          <div className="border-t border-[#EFE6D6] bg-white/60">
            <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button key={p.id} onClick={() => setPrompt(p.prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#EFE6D6] hover:border-[#B89555] text-[#1A1A1A] bg-[#FDFBF7]">
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={2}
                  placeholder="e.g. Write a job offer letter for Jane Doe as Senior Broker, AED 18,000/month, start 1 June 2026."
                  className="text-sm resize-none flex-1" />
                <Button onClick={handleGenerate} disabled={generating}
                  data-cta="dark" className="jj-cta-dark self-stretch">
                  {generating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                  Generate
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible field editor */}
        {openFields && (
          <div className="border-t border-[#EFE6D6] bg-white/60">
            <div className="max-w-[1400px] mx-auto px-4 py-3 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Subject</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Letter subject" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Recipient</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Mr. John Doe" className="h-8 text-sm" />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Date</Label>
                <div className="flex gap-1">
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-sm" />
                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleInsertDate} title="Today">
                    <Calendar className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="md:col-span-4">
                <Label className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Body (plain text — line breaks preserved)</Label>
                <Textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={5} className="text-sm leading-relaxed"
                  placeholder={`Dear Mr. Doe,\n\nWe are pleased to confirm…\n\nYours sincerely,`} />
              </div>
              <div className="md:col-span-2">
                <Label className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Signer Name</Label>
                <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/70">Title</Label>
                <Input value={signerTitle} onChange={(e) => setSignerTitle(e.target.value)} placeholder="Founder & CEO" className="h-8 text-sm" />
              </div>
            </div>
          </div>
        )}

        {/* Collapsible signature & stamp library */}
        {openAssets && (
          <div className="border-t border-[#EFE6D6] bg-white/60">
            <div className="max-w-[1400px] mx-auto px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-[#B89555]" /> Signatures
                  </Label>
                  <input ref={sigInputRef} type="file" accept="image/*" onChange={(e) => handleUpload("signature", e)} className="hidden" />
                  <Button size="sm" variant="outline" className="h-7" onClick={() => sigInputRef.current?.click()}>Upload</Button>
                </div>
                {signatures.length === 0 ? (
                  <p className="text-[11px] text-[#1A1A1A]/60">No signatures yet — upload one.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {signatures.map(s => {
                      const isActive = (activeSignature?.id === s.id);
                      return (
                        <div key={s.id} onClick={() => setActiveSigId(s.id)}
                          className={`relative cursor-pointer border-2 rounded p-1 bg-[#F7F2EA] ${isActive ? "border-[#B89555]" : "border-transparent hover:border-[#B89555]/40"}`}>
                          <img src={s.image_url} alt={s.label || "Signature"} className="h-10 w-full object-contain"  loading="lazy" decoding="async" />
                          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); setDefaultAsset("signature", s.id); }} title="Set as default"
                              className={`w-4 h-4 rounded-full flex items-center justify-center ${s.is_default ? "bg-[#B89555] text-white" : "bg-white/80 text-[#1A1A1A]/60"}`}>
                              <Star className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteAsset(s.id); }} title="Delete"
                              className="w-4 h-4 rounded-full bg-red-500/90 text-white flex items-center justify-center">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                    <StampIcon className="w-3.5 h-3.5 text-[#B89555]" /> Stamps
                  </Label>
                  <input ref={stampInputRef} type="file" accept="image/*" onChange={(e) => handleUpload("stamp", e)} className="hidden" />
                  <Button size="sm" variant="outline" className="h-7" onClick={() => stampInputRef.current?.click()}>Upload</Button>
                </div>
                {stamps.length === 0 ? (
                  <p className="text-[11px] text-[#1A1A1A]/60">No stamps yet.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {stamps.map(s => {
                      const isActive = (activeStamp?.id === s.id);
                      return (
                        <div key={s.id} onClick={() => setActiveStampId(s.id)}
                          className={`relative cursor-pointer border-2 rounded p-1 bg-[#F7F2EA] ${isActive ? "border-[#B89555]" : "border-transparent hover:border-[#B89555]/40"}`}>
                          <img src={s.image_url} alt={s.label || "Stamp"} className="h-10 w-full object-contain"  loading="lazy" decoding="async" />
                          <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); setDefaultAsset("stamp", s.id); }} title="Set as default"
                              className={`w-4 h-4 rounded-full flex items-center justify-center ${s.is_default ? "bg-[#B89555] text-white" : "bg-white/80 text-[#1A1A1A]/60"}`}>
                              <Star className="w-2.5 h-2.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); deleteAsset(s.id); }} title="Delete"
                              className="w-4 h-4 rounded-full bg-red-500/90 text-white flex items-center justify-center">
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="md:col-span-2 flex items-center justify-between pt-2 border-t border-[#EFE6D6]">
                <span className="text-[11px] text-[#1A1A1A]/70">
                  {placementMode ? "Drag the signature/stamp on the page" : "Standard placement (auto: under the body, above footer)"}
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setPlacementMode(v => !v)}>
                    {placementMode ? "Done" : "Custom placement"}
                  </Button>
                  {(placedSig || placedStamp) && (
                    <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { setPlacedSig(null); setPlacedStamp(null); setPlacementMode(false); }}>
                      <RotateCcw className="w-3 h-3 mr-1" /> Reset
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CENTERED A4 PREVIEW — the hero */}
      <div ref={previewBoxRef} className="w-full" style={{ height: "calc(100vh - 88px)", overflow: "auto" }}>
        <div className="w-full h-full flex items-start justify-center py-6">
          <div
            className="relative shrink-0"
            style={{
              width: 794 * scale,
              height: 1123 * scale,
            }}
          >
            <div
              className="relative origin-top-left"
              style={{
                width: 794,
                height: 1123,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <div ref={previewRef} className="relative">
                <div
                  className="bg-white shadow-2xl mx-auto relative"
                  style={{ width: 794, minHeight: 1123 }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
                {placementMode && activeSignature && placedSig && (
                  <div onMouseDown={(e) => startDrag("sig", e)}
                    style={{ position: "absolute", left: `${placedSig.x}%`, top: `${placedSig.y}%`, width: 220, height: 88 }}
                    className="cursor-move ring-2 ring-[#B89555]/60 ring-offset-1 rounded">
                    <button onClick={() => setPlacedSig(null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                      title="Remove placement"><X className="w-3 h-3" /></button>
                  </div>
                )}
                {placementMode && activeStamp && placedStamp && (
                  <div onMouseDown={(e) => startDrag("stamp", e)}
                    style={{ position: "absolute", left: `${placedStamp.x}%`, top: `${placedStamp.y}%`, width: 130, height: 130 }}
                    className="cursor-move ring-2 ring-[#B89555]/60 ring-offset-1 rounded">
                    <button onClick={() => setPlacedStamp(null)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow"
                      title="Remove placement"><X className="w-3 h-3" /></button>
                  </div>
                )}
                {placementMode && (
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 bg-white/95 backdrop-blur border border-[#B89555]/30 rounded-lg p-2 shadow">
                    <p className="text-[9px] uppercase tracking-wider text-[#1A1A1A]/60">Place on page</p>
                    {activeSignature && !placedSig && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setPlacedSig({ x: 8, y: 78 })}>
                        <PenTool className="w-3 h-3 mr-1" /> Add signature
                      </Button>
                    )}
                    {activeStamp && !placedStamp && (
                      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setPlacedStamp({ x: 70, y: 75 })}>
                        <StampIcon className="w-3 h-3 mr-1" /> Add stamp
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
