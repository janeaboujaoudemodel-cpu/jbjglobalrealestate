/**
 * DocumentStudio — Premium full-screen workspace
 * -----------------------------------------------
 * Replaces the previous cramped 3-column Dialog. Renders a true
 * full-screen overlay with:
 *   • Topbar (brand + close + step actions)
 *   • Stepper (1 Template · 2 Details · 3 Review & Send)
 *   • Left rail (template gallery on step 1, details form on step 2)
 *   • Center A4 preview (locked letterhead + contentEditable body
 *     with floating selection toolbar + zoom)
 *   • Right collapsible AI assistant (reuses AiEditChatPanel)
 *
 * Public API (Props) is UNCHANGED so DocumentStudioLauncher continues
 * to mount it without modification.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sparkles, Loader2, Wand2, Printer, Mail, FlaskConical, X, ChevronRight,
  ChevronLeft, ZoomIn, ZoomOut, Bold, Italic, List, Heading2, Search,
  PanelRightClose, PanelRightOpen, Check, Download, FileText, Stamp,
  PenLine, ChevronDown, Trash2, Maximize2, Minimize2, Plus, Globe,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DOMPurify from "dompurify";

import {
  getCatalogByAudience, getTemplateById,
  DocumentAudience, DocumentTemplate,
} from "@/config/documentCatalog";
import { DEPARTMENTS } from "@/hooks/useHRJobOffers";
import { stripChromeArtifacts } from "@/templates/jbjLockedChrome";
import { LockedLetterhead, LockedFooter } from "./LockedLetterhead";
import DraggableMark from "./DraggableMark";
import AiEditChatPanel, { LANGUAGES as AI_LANGUAGES } from "./AiEditChatPanel";
import AssetLibraryDialog from "./assets/AssetLibraryDialog";
import { useOwnerAssets, OwnerAsset, AssetKind } from "./assets/useOwnerAssets";
import { exportPdf, exportDocx, printDocument, DocumentMarks } from "./export/exporters";
import {
  compose as composeDocument,
  DEFAULT_BROKER_COMMISSIONS,
  type CommissionRow,
  type CustomField,
} from "@/templates/composers";
import { renderStandardBody } from "@/templates/composers/standardBody";

interface Props {
  catalog: DocumentAudience;
  trigger?: React.ReactNode;
  presetTemplateId?: string;
}

type Step = 1 | 2 | 3;
const OWNER_TEST_EMAIL = "infoo.jane@gmail.com";

export default function DocumentStudio({ catalog, trigger, presetTemplateId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span onClick={() => setOpen(true)} className="contents">
        {trigger || (
          <Button variant="primary">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Document
          </Button>
        )}
      </span>
      {open && (
        <StudioShell
          catalog={catalog}
          presetTemplateId={presetTemplateId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

/* ───────────────────────────── Shell ───────────────────────────── */

function StudioShell({
  catalog,
  presetTemplateId,
  onClose,
}: {
  catalog: DocumentAudience;
  presetTemplateId?: string;
  onClose: () => void;
}) {
  const templates = useMemo(() => getCatalogByAudience(catalog), [catalog]);
  const initialId =
    presetTemplateId && getTemplateById(presetTemplateId)?.audience === catalog
      ? presetTemplateId
      : "";

  const [step, setStep] = useState<Step>(initialId ? 2 : 1);
  const [templateId, setTemplateId] = useState<string>(initialId);
  const template = useMemo(() => getTemplateById(templateId), [templateId]);

  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [bodyHtml, setBodyHtml] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Commission rows — pre-seeded for broker/HR templates
  const usesCommission =
    !!template &&
    (template.id === "job_offer" ||
      template.id === "commission_agreement" ||
      template.id === "employment_contract" ||
      template.id === "partnership_referral");
  const [commissionRows, setCommissionRows] = useState<CommissionRow[]>(DEFAULT_BROKER_COMMISSIONS);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const [emailTo, setEmailTo] = useState("");
  const [sending, setSending] = useState(false);

  const [zoom, setZoom] = useState(100);
  const [aiOpen, setAiOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [pages, setPages] = useState<number | "auto">("auto");

  // Owner-side signature defaults (editable from the left rail).
  const [ownerName, setOwnerName] = useState<string>("Jane Bou Jaude");
  const [ownerTitle, setOwnerTitle] = useState<string>("Founder & CEO");
  const [ownerDate, setOwnerDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [applicantDate, setApplicantDate] = useState<string>(""); // blank by design

  // Hide / restore the "Commission" and "Custom fields" rail cards.
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) =>
    setHiddenSections((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // AI auto-fill from pasted details / attached document.
  const [autoFillText, setAutoFillText] = useState("");
  const [autoFillBusy, setAutoFillBusy] = useState(false);
  const autoFillFileRef = useRef<HTMLInputElement>(null);

  // Document language (drives translation + AI replies + STT).
  const [docLanguage, setDocLanguage] = useState<string>("English");

  // Signature + stamp placement (with x/y positions for free dragging)
  const { defaultSignature, defaultStamp } = useOwnerAssets();
  const [marks, setMarks] = useState<DocumentMarks & {
    signatureXY?: { x: number; y: number };
    signatureBXY?: { x: number; y: number };
    stampXY?: { x: number; y: number };
    dateXY?: { x: number; y: number };
    dateValue?: string;
    signatureB?: { url: string; width: number };
    showDate?: boolean;
    showSigB?: boolean;
  }>({ showDate: true, showSigB: true, dateValue: new Date().toISOString().slice(0, 10) });
  const [assetDialog, setAssetDialog] = useState<null | AssetKind>(null);
  const [exporting, setExporting] = useState<null | "pdf" | "docx">(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Some browsers block fullscreen; ignore silently.
    }
  };

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Auto-attach owner's default signature & stamp the first time they exist.
  useEffect(() => {
    setMarks((m) => {
      const next = { ...m };
      if (!next.signature && defaultSignature?.signedUrl) {
        next.signature = { url: defaultSignature.signedUrl, width: 200 };
      }
      if (!next.stamp && defaultStamp?.signedUrl) {
        next.stamp = { url: defaultStamp.signedUrl, width: 130, rotation: -8 };
      }
      return next;
    });
  }, [defaultSignature?.signedUrl, defaultStamp?.signedUrl]);

  const pickAsset = (asset: OwnerAsset) => {
    if (!asset.signedUrl) return;
    if (asset.kind === "signature") {
      setMarks((m) => ({ ...m, signature: { url: asset.signedUrl!, width: m.signature?.width || 200 } }));
    } else {
      setMarks((m) => ({ ...m, stamp: { url: asset.signedUrl!, width: m.stamp?.width || 130, rotation: m.stamp?.rotation ?? -8 } }));
    }
    toast.success(`${asset.kind === "signature" ? "Signature" : "Stamp"} placed`);
  };
  const removeMark = (kind: "signature" | "signatureB" | "stamp" | "date") =>
    setMarks((m) => {
      const n: any = { ...m };
      if (kind === "date") n.showDate = false;
      else if (kind === "signatureB") n.showSigB = false;
      else n[kind] = undefined;
      return n;
    });

  // Lock body scroll while overlay is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setField = (k: string, v: string) => setFields((p) => ({ ...p, [k]: v }));

  // Auto-render locked standard body whenever template / fields / commissions /
  // owner-signature state change. We force-rerender every time UNLESS the user
  // has explicitly hand-edited the body via EditableBody (tracked by
  // userEditedRef). When that flag is set, a "Reset to template" pill appears
  // above the page so re-syncing is one click.
  const autoBodyRef = useRef<string>("");
  const userEditedRef = useRef<boolean>(false);
  const [userEdited, setUserEdited] = useState(false);

  useEffect(() => {
    if (!template) return;
    const next = renderStandardBody({
      templateId: template.id,
      fields,
      department: template.needsPosition ? department : undefined,
      commissionRows: usesCommission && !hiddenSections.has("commission") ? commissionRows : undefined,
      customFields: hiddenSections.has("custom") ? [] : customFields,
      ownerName,
      ownerTitle,
      ownerDate,
      applicantDate,
      hideLetterDate: true, // the draggable date chip is the visible date
    });
    autoBodyRef.current = next;
    if (!userEditedRef.current) setBodyHtml(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    template?.id,
    JSON.stringify(fields),
    department,
    JSON.stringify(commissionRows),
    JSON.stringify(customFields),
    JSON.stringify(Array.from(hiddenSections)),
    ownerName, ownerTitle, ownerDate, applicantDate,
  ]);

  const resetToTemplate = () => {
    userEditedRef.current = false;
    setUserEdited(false);
    if (autoBodyRef.current) setBodyHtml(autoBodyRef.current);
  };

  const handleSelectTemplate = (id: string) => {
    setTemplateId(id);
    setFields({});
    autoBodyRef.current = "";
    userEditedRef.current = false;
    setUserEdited(false);
    setBodyHtml("");
    setStep(2);
  };

  const buildPrompt = (t: DocumentTemplate): string => {
    const filled = t.fields
      .map((f) => `${f.label}: ${fields[f.key] || "(not provided)"}`)
      .join("\n");
    const positionLine = t.needsPosition ? `Department: ${department}` : "";
    return [
      t.aiInstructions,
      "",
      "Render the body as 2–6 short paragraphs separated by blank lines.",
      "Do NOT include letterhead, address, phone, signature block, or any header/footer — those are appended automatically.",
      "",
      "Details supplied by the owner:",
      positionLine,
      filled,
    ].filter(Boolean).join("\n");
  };

  const handleGenerate = async () => {
    if (!template) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
        body: {
          prompt: buildPrompt(template),
          tone: "formal",
          language: "English",
          recipient: fields.recipientName || "",
        },
      });
      if (error) throw error;
      const text: string = (data?.body_text || "").trim();
      if (!text) throw new Error("Empty AI response");
      // Split AI narrative into intro/closing halves and let the composer
      // build the premium structure (terms table + signature block).
      const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      const mid = Math.max(1, Math.ceil(parts.length * 0.6));
      const aiIntro = parts.slice(0, mid).join("\n\n");
      const aiClosing = parts.slice(mid).join("\n\n");
      const html = composeDocument({
        templateId: template.id,
        fields,
        department: template.needsPosition ? department : undefined,
        aiIntro,
        aiClosing,
        ownerTitle: "Director",
        commissionRows: usesCommission ? commissionRows : undefined,
        customFields,
      });
      setBodyHtml(html);
      toast.success("Document generated");
    } catch (e: any) {
      toast.error(e?.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    if (!bodyHtml) return;
    printDocument(bodyHtml, marks);
  };

  const handleExport = async (kind: "pdf" | "docx") => {
    if (!bodyHtml || !template) return;
    setExporting(kind);
    try {
      if (kind === "pdf") await exportPdf(bodyHtml, marks, template);
      else await exportDocx(bodyHtml, marks, template);
      toast.success(`${kind.toUpperCase()} downloaded`);
    } catch (e: any) {
      toast.error(e?.message || `${kind.toUpperCase()} export failed`);
    } finally {
      setExporting(null);
    }
  };

  const handleSend = async (recipientOverride?: string) => {
    if (!bodyHtml || !template) return;
    const to = (recipientOverride || emailTo).trim();
    if (!to) { toast.error("Enter a recipient email"); return; }
    setSending(true);
    try {
      const { buildPrintableHtml } = await import("./export/exporters");
      const fullHtml = buildPrintableHtml(bodyHtml, marks);
      const { error } = await supabase.functions.invoke("compose-branded-email", {
        body: {
          to, subject: template.emailSubject, body_html: fullHtml,
          send: true, source: "document-studio",
          documentType: template.id, audience: catalog,
        },
      });
      if (error) throw error;
      toast.success(recipientOverride ? `Test sent to ${recipientOverride}` : `Sent to ${to}`);
    } catch (e: any) {
      toast.error(e?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
    );
  }, [templates, search]);

  const requiredOk = useMemo(() => {
    if (!template) return false;
    return template.fields.every((f) => !f.required || (fields[f.key] || "").trim());
  }, [template, fields]);

  const overlay = (
    <div
      data-no-contrast-guard
      data-document-studio-overlay
      className="fixed inset-0 bg-[#FDFBF7] flex flex-col"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        zIndex: 2147483000,
        isolation: "isolate",
      }}
    >
      {/* ─── Topbar ─── */}
      <div className="shrink-0 h-14 border-b border-[#B89555]/30 bg-[#FDFBF7] flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md border border-[#B89555]/40 bg-[#F7F2EA] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#B89555]" />
          </div>
          <div className="leading-tight">
            <div className="text-[13px] font-semibold text-[#1A1A1A]">Document Studio</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">
              {catalog === "staff" ? "Careers · Staff" : "Client · Real Estate"}
            </div>
          </div>
        </div>

        <Stepper step={step} setStep={(s) => {
          if (s === 2 && !templateId) return;
          if (s === 3 && !bodyHtml) return;
          setStep(s);
        }} hasTemplate={!!templateId} hasBody={!!bodyHtml} />

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A]/70 border border-[#B89555]/30 bg-[#F7F2EA] rounded-md pl-2 pr-1 py-0.5">
            <Globe className="w-3.5 h-3.5" />
            <span className="uppercase tracking-[0.14em]">Lang</span>
            <Select value={docLanguage} onValueChange={setDocLanguage}>
              <SelectTrigger className="h-6 w-[112px] border-0 bg-transparent px-1.5 text-[12px] font-semibold text-[#1A1A1A] focus:ring-0 focus:ring-offset-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2147483647]">
                {AI_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A]/70 border border-[#B89555]/30 bg-[#F7F2EA] rounded-md pl-2 pr-1 py-0.5">
            <span className="uppercase tracking-[0.14em]">Pages</span>
            <Select
              value={String(pages)}
              onValueChange={(v) => setPages(v === "auto" ? "auto" : Number(v))}
            >
              <SelectTrigger className="h-6 w-[72px] border-0 bg-transparent px-1.5 text-[12px] font-semibold text-[#1A1A1A] focus:ring-0 focus:ring-offset-0 shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2147483647]">
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAssetDialog("signature")}>
            <PenLine className="w-4 h-4 mr-1.5" /> Signature
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAssetDialog("stamp")}>
            <Stamp className="w-4 h-4 mr-1.5" /> Stamp
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 mr-1.5" /> : <Maximize2 className="w-4 h-4 mr-1.5" />}
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAiOpen((v) => !v)}>
            {aiOpen ? <PanelRightClose className="w-4 h-4 mr-1.5" /> : <PanelRightOpen className="w-4 h-4 mr-1.5" />}
            {aiOpen ? "Hide AI" : "Show AI"}
          </Button>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center text-[#1A1A1A]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AssetLibraryDialog
        open={assetDialog !== null}
        onOpenChange={(v) => !v && setAssetDialog(null)}
        initialTab={assetDialog || "signature"}
        onPick={pickAsset}
      />

      {/* ─── Body ─── */}
      <div className="flex-1 min-h-0 flex">
        {/* LEFT RAIL */}
        <aside className="w-[340px] shrink-0 border-r border-[#B89555]/25 bg-[#FDFBF7] flex flex-col">
          {step === 1 && (
            <>
              <div className="p-4 border-b border-[#B89555]/20">
                <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55 mb-2">
                  Step 1 — Choose a template
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/50" />
                  <Input
                    placeholder="Search templates…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-[#FDFBF7]"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredTemplates.map((t) => {
                  const Icon = t.icon;
                  const selected = t.id === templateId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id)}
                      className={[
                        "w-full text-left rounded-xl border px-3 py-3 transition-all flex gap-3 items-start",
                        selected
                          ? "border-[#B89555] bg-[#EFE6D6]"
                          : "border-[#B89555]/25 bg-[#F7F2EA] hover:bg-[#EFE6D6]/60",
                      ].join(" ")}
                    >
                      <div className="w-8 h-8 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-[#1A1A1A]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-semibold text-[#1A1A1A] leading-tight">{t.label}</div>
                        <div className="text-[11px] text-[#1A1A1A]/65 mt-0.5 line-clamp-2">{t.description}</div>
                      </div>
                    </button>
                  );
                })}
                {filteredTemplates.length === 0 && (
                  <div className="text-center text-xs text-[#1A1A1A]/55 py-8">No templates match.</div>
                )}
              </div>
            </>
          )}

          {step === 2 && template && (
            <>
              <div className="p-4 border-b border-[#B89555]/20 flex items-center gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="h-7 w-7 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center"
                  aria-label="Back to templates"
                >
                  <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
                </button>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">Step 2 — Details</div>
                  <div className="text-[13px] font-semibold text-[#1A1A1A] truncate">{template.label}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {template.needsPosition && (
                  <Field label="Department">
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger className="bg-[#FDFBF7]"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[2147483647] bg-[#FDFBF7]">
                        {DEPARTMENTS.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                {template.fields.map((f) => (
                  <Field key={f.key} label={f.label} required={f.required}>
                    {f.type === "textarea" ? (
                      <Textarea
                        value={fields[f.key] || ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        rows={3}
                        className="bg-[#FDFBF7] resize-none"
                      />
                    ) : f.type === "select" ? (
                      <Select value={fields[f.key] || ""} onValueChange={(v) => setField(f.key, v)}>
                        <SelectTrigger className="bg-[#FDFBF7]"><SelectValue placeholder="Select…" /></SelectTrigger>
                        <SelectContent className="z-[2147483647] bg-[#FDFBF7]">
                          {f.options?.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                        value={fields[f.key] || ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="bg-[#FDFBF7]"
                      />
                    )}
                  </Field>
                ))}

                {/* Applicant ID + Owner signature defaults */}
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold mb-1">
                    Signatories
                  </div>
                  <Field label="Applicant / Recipient ID No.">
                    <Input
                      value={fields.idNumber || ""}
                      onChange={(e) => setField("idNumber", e.target.value)}
                      placeholder="Emirates ID / Passport"
                      className="bg-[#FDFBF7] h-8 text-[12px]"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Owner Name">
                      <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="bg-[#FDFBF7] h-8 text-[12px]" />
                    </Field>
                    <Field label="Owner Title">
                      <Input value={ownerTitle} onChange={(e) => setOwnerTitle(e.target.value)} className="bg-[#FDFBF7] h-8 text-[12px]" />
                    </Field>
                  </div>
                  <Field label="Owner Sign Date">
                    <Input type="date" value={ownerDate} onChange={(e) => setOwnerDate(e.target.value)} className="bg-[#FDFBF7] h-8 text-[12px]" />
                  </Field>
                </div>

                {/* AI auto-fill from pasted details / attached document */}
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                    Auto-fill with AI
                  </div>
                  <Textarea
                    value={autoFillText}
                    onChange={(e) => setAutoFillText(e.target.value)}
                    placeholder="Paste a bio, CV, email, or any details — AI will extract names, dates, salary, etc."
                    rows={3}
                    className="bg-[#FDFBF7] resize-none text-[12px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-[11px]"
                      disabled={autoFillBusy || (!autoFillText.trim())}
                      onClick={async () => {
                        if (!template) return;
                        setAutoFillBusy(true);
                        try {
                          const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
                            body: {
                              mode: "extract-fields",
                              templateId: template.id,
                              fieldKeys: template.fields.map((f) => f.key).concat(["idNumber"]),
                              source: autoFillText,
                            },
                          });
                          if (error) throw error;
                          const parsed = (data as any)?.fields || {};
                          if (parsed && typeof parsed === "object") {
                            setFields((p) => ({ ...p, ...parsed }));
                            toast.success("Fields filled from your text");
                          } else {
                            toast.info("Nothing extractable found");
                          }
                        } catch (e: any) {
                          toast.error(e?.message || "AI auto-fill failed");
                        } finally {
                          setAutoFillBusy(false);
                        }
                      }}
                    >
                      {autoFillBusy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      Auto-fill fields
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-[11px]"
                      onClick={() => autoFillFileRef.current?.click()}
                      disabled={autoFillBusy}
                    >
                      <FileText className="w-3 h-3 mr-1" /> Attach
                    </Button>
                    <input
                      ref={autoFillFileRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file || !template) return;
                        if (file.size > 8 * 1024 * 1024) { toast.error("Max 8MB"); return; }
                        setAutoFillBusy(true);
                        try {
                          const b64 = await new Promise<string>((res, rej) => {
                            const r = new FileReader();
                            r.onload = () => res(String(r.result || ""));
                            r.onerror = rej;
                            r.readAsDataURL(file);
                          });
                          const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
                            body: {
                              mode: "extract-fields",
                              templateId: template.id,
                              fieldKeys: template.fields.map((f) => f.key).concat(["idNumber"]),
                              attachment: { name: file.name, type: file.type, dataUrl: b64 },
                            },
                          });
                          if (error) throw error;
                          const parsed = (data as any)?.fields || {};
                          if (parsed && typeof parsed === "object") {
                            setFields((p) => ({ ...p, ...parsed }));
                            toast.success(`Fields filled from ${file.name}`);
                          } else {
                            toast.info("Nothing extractable found in attachment");
                          }
                        } catch (err: any) {
                          toast.error(err?.message || "Attachment processing failed");
                        } finally {
                          setAutoFillBusy(false);
                        }
                      }}
                    />
                  </div>
                </div>

                {usesCommission && !hiddenSections.has("commission") && (

                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                        Commission Structure
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCommissionRows((rs) => [...rs, { label: "", rate: "", trigger: "", notes: "" }])}
                          className="text-[11px] text-[#1A1A1A] hover:text-[#B89555] inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add tier
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSection("commission")}
                          className="text-[#1A1A1A]/55 hover:text-red-600"
                          title="Hide this section from the document"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {commissionRows.map((r, i) => (
                        <div key={i} className="grid grid-cols-12 gap-1.5 items-start">
                          <Input
                            placeholder="Tier (e.g. Direct deals)"
                            value={r.label || ""}
                            onChange={(e) => setCommissionRows((rs) => rs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                            className="col-span-5 h-8 text-[12px] bg-[#FDFBF7]"
                          />
                          <Input
                            placeholder="Rate"
                            value={r.rate || ""}
                            onChange={(e) => setCommissionRows((rs) => rs.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))}
                            className="col-span-3 h-8 text-[12px] bg-[#FDFBF7]"
                          />
                          <Input
                            placeholder="Trigger"
                            value={r.trigger || ""}
                            onChange={(e) => setCommissionRows((rs) => rs.map((x, j) => j === i ? { ...x, trigger: e.target.value } : x))}
                            className="col-span-3 h-8 text-[12px] bg-[#FDFBF7]"
                          />
                          <button
                            type="button"
                            onClick={() => setCommissionRows((rs) => rs.filter((_, j) => j !== i))}
                            className="col-span-1 h-8 flex items-center justify-center text-[#1A1A1A]/55 hover:text-red-600"
                            title="Remove tier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#1A1A1A]/55 mt-2">Empty rows are skipped — only filled tiers appear in the document.</p>
                  </div>
                )}

                {!hiddenSections.has("custom") && (
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                        Custom Fields
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomFields((cs) => [...cs, { label: "", value: "" }])}
                          className="text-[11px] text-[#1A1A1A] hover:text-[#B89555] inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add field
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSection("custom")}
                          className="text-[#1A1A1A]/55 hover:text-red-600"
                          title="Hide this section from the document"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {customFields.length === 0 ? (
                      <p className="text-[10px] text-[#1A1A1A]/55">Add any extra clause — e.g. "Sign-on bonus", "Car allowance".</p>
                    ) : (
                      <div className="space-y-2">
                        {customFields.map((c, i) => (
                          <div key={i} className="grid grid-cols-12 gap-1.5">
                            <Input
                              placeholder="Field name"
                              value={c.label}
                              onChange={(e) => setCustomFields((cs) => cs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                              className="col-span-5 h-8 text-[12px] bg-[#FDFBF7]"
                            />
                            <Input
                              placeholder="Value"
                              value={c.value}
                              onChange={(e) => setCustomFields((cs) => cs.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                              className="col-span-6 h-8 text-[12px] bg-[#FDFBF7]"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomFields((cs) => cs.filter((_, j) => j !== i))}
                              className="col-span-1 h-8 flex items-center justify-center text-[#1A1A1A]/55 hover:text-red-600"
                              title="Remove field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {hiddenSections.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setHiddenSections(new Set())}
                    className="w-full text-[11px] text-[#1A1A1A]/70 hover:text-[#B89555] underline underline-offset-2"
                  >
                    + Restore hidden sections ({hiddenSections.size})
                  </button>
                )}
              </div>
              <div className="p-3 border-t border-[#B89555]/20 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => setStep(3)}>
                  Continue to Review & Send <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <p className="text-[10px] text-[#1A1A1A]/55 text-center">
                  Tip: use the AI assistant on the right to draft the body, or type directly into the page.
                </p>
              </div>
            </>
          )}

          {step === 3 && template && (
            <>
              <div className="p-4 border-b border-[#B89555]/20 flex items-center gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="h-7 w-7 rounded-md border border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] flex items-center justify-center"
                  aria-label="Back to details"
                >
                  <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
                </button>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/55">Step 3 — Review & Send</div>
                  <div className="text-[13px] font-semibold text-[#1A1A1A]">{template.label}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <Field label="Subject">
                  <Input value={template.emailSubject} readOnly className="bg-[#F7F2EA]" />
                </Field>
                <Field label="Recipient email">
                  <Input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="recipient@example.com"
                    className="bg-[#FDFBF7]"
                  />
                </Field>
                <div className="rounded-lg border border-[#B89555]/25 bg-[#F7F2EA] p-3 text-[11px] text-[#1A1A1A]/70 leading-relaxed">
                  <Check className="w-3 h-3 inline-block mr-1 text-[#1A1A1A]" />
                  Locked letterhead + footer are applied automatically before sending.
                </div>
              </div>
              <div className="p-3 border-t border-[#B89555]/20 space-y-2">
                <Button onClick={() => handleSend()} disabled={sending || !emailTo} className="w-full">
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send via Branded Email
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full" disabled={!!exporting}>
                      {exporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                      Export <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#FDFBF7]">
                    <DropdownMenuItem onClick={() => handleExport("pdf")}>
                      <FileText className="w-4 h-4 mr-2" /> Download PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("docx")}>
                      <FileText className="w-4 h-4 mr-2" /> Download Word (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="w-4 h-4 mr-2" /> Print
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline" size="sm" className="w-full"
                  onClick={() => handleSend(OWNER_TEST_EMAIL)}
                  disabled={sending}
                  title={`Send a test copy to ${OWNER_TEST_EMAIL}`}
                >
                  <FlaskConical className="w-4 h-4 mr-1.5" /> Send Test to {OWNER_TEST_EMAIL}
                </Button>
              </div>
            </>
          )}
        </aside>

        {/* CENTER — A4 PREVIEW */}
        <main className="flex-1 min-w-0 bg-[#F0E8D8] overflow-auto relative">
          <div className="min-h-full flex justify-center py-10 px-6">
            {template ? (
              <div
                className="bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] rounded-md overflow-hidden border border-[#B89555]/20"
                style={{
                  width: 816,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                }}
              >
                <LockedLetterhead />
                <div
                  className="relative px-12 py-10 bg-[#FDFBF7]"
                  style={
                    pages === "auto"
                      ? {}
                      : { minHeight: 1056 * (pages as number) - 260 }
                  }
                >
                  {bodyHtml ? (
                    <>
                      <EditableBody
                        html={bodyHtml}
                        onChange={(next) => { userEditedRef.current = true; setUserEdited(true); setBodyHtml(next); }}
                      />
                      {userEdited && (
                        <button
                          type="button"
                          onClick={resetToTemplate}
                          className="absolute top-2 right-2 z-20 text-[10px] uppercase tracking-[0.16em] bg-[#F7F2EA] border border-[#B89555]/40 text-[#1A1A1A] rounded-full px-2.5 py-1 hover:bg-[#EFE6D6]"
                        >
                          Reset to template
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-[12px] text-[#1A1A1A]/40 italic">
                      Empty document — type here or use the AI assistant on the right to draft the body.
                    </div>
                  )}

                  {marks.showDate !== false && (
                    <DraggableMark
                      x={marks.dateXY?.x ?? 560}
                      y={marks.dateXY?.y ?? 0}
                      onChange={(x, y) => setMarks((m) => ({ ...m, dateXY: { x, y } }))}
                      onRemove={() => removeMark("date")}
                      ariaLabel="Date"
                    >
                      <label className="block cursor-text">
                        <span className="text-[12px] text-[#1A1A1A] font-medium border-b border-[#1A1A1A]/40 pb-1 pr-6 inline-block">
                          {new Date(marks.dateValue || new Date().toISOString().slice(0,10))
                            .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                        </span>
                        <input
                          type="date"
                          value={marks.dateValue || ""}
                          onPointerDown={(e) => e.stopPropagation()}
                          onChange={(e) => setMarks((m) => ({ ...m, dateValue: e.target.value }))}
                          className="block mt-1 text-[10px] bg-transparent border-none p-0 outline-none text-[#1A1A1A]/60"
                        />
                      </label>
                    </DraggableMark>
                  )}

                  {marks.signature && (
                    <DraggableMark
                      x={marks.signatureXY?.x ?? 0}
                      y={marks.signatureXY?.y ?? 420}
                      onChange={(x, y) => setMarks((m) => ({ ...m, signatureXY: { x, y } }))}
                      onRemove={() => removeMark("signature")}
                      ariaLabel="Party A signature"
                    >
                      <img src={marks.signature.url} alt="Signature" style={{ width: marks.signature.width, maxWidth: 240 }} className="block pointer-events-none" />
                      <div className="border-t border-[#1A1A1A] mt-1 pt-1 text-[10px] text-[#1A1A1A]/70" style={{ width: 220 }}>Authorised signature (Party A)</div>
                    </DraggableMark>
                  )}

                  {marks.showSigB !== false && (
                    <DraggableMark
                      x={marks.signatureBXY?.x ?? 460}
                      y={marks.signatureBXY?.y ?? 420}
                      onChange={(x, y) => setMarks((m) => ({ ...m, signatureBXY: { x, y } }))}
                      onRemove={() => removeMark("signatureB")}
                      ariaLabel="Party B signature"
                    >
                      {marks.signatureB ? (
                        <img src={marks.signatureB.url} alt="Signature B" style={{ width: marks.signatureB.width, maxWidth: 240 }} className="block pointer-events-none" />
                      ) : (
                        <div style={{ width: 220, height: 40 }} />
                      )}
                      <div className="border-t border-[#1A1A1A] mt-1 pt-1 text-[10px] text-[#1A1A1A]/70" style={{ width: 220 }}>Applicant signature (Party B)</div>
                    </DraggableMark>
                  )}

                  {marks.stamp && (
                    <DraggableMark
                      x={marks.stampXY?.x ?? 260}
                      y={marks.stampXY?.y ?? 440}
                      onChange={(x, y) => setMarks((m) => ({ ...m, stampXY: { x, y } }))}
                      onRemove={() => removeMark("stamp")}
                      ariaLabel="Stamp"
                    >
                      <img src={marks.stamp.url} alt="Stamp" style={{ width: marks.stamp.width, maxWidth: 180, transform: `rotate(${marks.stamp.rotation ?? -8}deg)`, opacity: 0.92 }} className="block pointer-events-none" />
                    </DraggableMark>
                  )}
                </div>
                <LockedFooter />
              </div>
            ) : (
              <div className="self-center max-w-md text-center bg-[#FDFBF7] border border-[#B89555]/25 rounded-xl p-10 mt-20">
                <Wand2 className="w-10 h-10 mx-auto mb-3 text-[#B89555]" />
                <div className="text-base font-semibold text-[#1A1A1A]">Choose a template to begin</div>
                <p className="text-sm text-[#1A1A1A]/65 mt-2">
                  Pick from {templates.length} {catalog === "staff" ? "staff" : "client"} document templates in the left panel.
                </p>
              </div>
            )}
          </div>

          {/* Zoom controls */}
          {template && (
            <div className="sticky bottom-4 float-right mr-4 -mt-12 inline-flex items-center gap-1 bg-[#FDFBF7] border border-[#B89555]/30 rounded-full px-2 py-1 shadow-sm">
              <button
                onClick={() => setZoom((z) => Math.max(60, z - 10))}
                className="h-7 w-7 rounded-full hover:bg-[#EFE6D6] flex items-center justify-center"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5 text-[#1A1A1A]" />
              </button>
              <div className="text-[11px] font-medium text-[#1A1A1A] w-10 text-center tabular-nums">{zoom}%</div>
              <button
                onClick={() => setZoom((z) => Math.min(150, z + 10))}
                className="h-7 w-7 rounded-full hover:bg-[#EFE6D6] flex items-center justify-center"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#1A1A1A]" />
              </button>
            </div>
          )}
        </main>

        {/* RIGHT — AI ASSISTANT */}
        {aiOpen && (
          <aside className="w-[360px] shrink-0 border-l border-[#B89555]/25 bg-[#FDFBF7] p-3">
            <AiEditChatPanel
              currentBody={bodyHtml}
              language={docLanguage}
              aiInstructions={template?.aiInstructions || ""}
              onApply={(next) => setBodyHtml(next)}
            />
          </aside>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

/* ───────────────────────── Sub-components ───────────────────────── */

function Stepper({
  step, setStep, hasTemplate, hasBody,
}: {
  step: Step; setStep: (s: Step) => void;
  hasTemplate: boolean; hasBody: boolean;
}) {
  const items: { n: Step; label: string; enabled: boolean }[] = [
    { n: 1, label: "Template", enabled: true },
    { n: 2, label: "Details", enabled: hasTemplate },
    { n: 3, label: "Review & Send", enabled: hasBody },
  ];
  return (
    <div className="hidden md:flex items-center gap-1 ml-6">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <div key={it.n} className="flex items-center">
            <button
              disabled={!it.enabled}
              onClick={() => setStep(it.n)}
              className={[
                "flex items-center gap-2 h-9 px-3 rounded-full text-[12px] font-medium border transition-colors",
                active
                  ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
                  : done
                    ? "bg-[#F7F2EA] border-[#B89555]/40 text-[#1A1A1A]"
                    : "bg-transparent border-[#B89555]/25 text-[#1A1A1A]/60 hover:text-[#1A1A1A]",
                it.enabled ? "cursor-pointer" : "opacity-50 cursor-not-allowed",
              ].join(" ")}
            >
              <span
                className={[
                  "w-5 h-5 rounded-full text-[10px] flex items-center justify-center border",
                  active || done
                    ? "bg-[#FDFBF7] border-[#B89555] text-[#1A1A1A]"
                    : "border-[#B89555]/40 text-[#1A1A1A]/60",
                ].join(" ")}
              >
                {done ? <Check className="w-3 h-3" /> : it.n}
              </span>
              {it.label}
            </button>
            {i < items.length - 1 && (
              <ChevronRight className="w-3.5 h-3.5 mx-1 text-[#1A1A1A]/30" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 mb-1.5 block">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}

function EmptyBody({
  onGenerate, canGenerate, generating,
}: { onGenerate: () => void; canGenerate: boolean; generating: boolean }) {
  return (
    <div className="text-center py-20 text-[#1A1A1A]/60">
      <div className="w-14 h-14 mx-auto rounded-full bg-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center mb-4">
        <Wand2 className="w-6 h-6 text-[#B89555]" />
      </div>
      <p className="font-medium text-[#1A1A1A]">Fill in the details on the left.</p>
      <p className="text-xs mt-1 text-[#1A1A1A]/60">
        Click <strong>Generate with AI</strong> to draft this document. The locked letterhead and footer are added automatically.
      </p>
      <Button
        size="sm"
        className="mt-5"
        onClick={onGenerate}
        disabled={!canGenerate || generating}
      >
        {generating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
        ) : (
          <><Wand2 className="w-4 h-4 mr-2" /> Generate with AI</>
        )}
      </Button>
    </div>
  );
}

/**
 * Editable preview body with a floating selection mini-toolbar.
 * Uses execCommand for direct, predictable inline edits — same as
 * Notion / Google Docs / Linear-style block editors.
 */
function EditableBody({
  html, onChange,
}: { html: string; onChange: (next: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [toolbar, setToolbar] = useState<{ top: number; left: number } | null>(null);

  // Initial paint
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = DOMPurify.sanitize(html);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  const placeToolbar = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !ref.current) { setToolbar(null); return; }
    const range = sel.getRangeAt(0);
    if (!ref.current.contains(range.commonAncestorContainer)) { setToolbar(null); return; }
    const rect = range.getBoundingClientRect();
    const host = ref.current.getBoundingClientRect();
    setToolbar({
      top: rect.top - host.top - 44,
      left: Math.max(0, rect.left - host.left + rect.width / 2 - 110),
    });
  };

  useEffect(() => {
    const onSel = () => placeToolbar();
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const cmd = (c: string, v?: string) => {
    document.execCommand(c, false, v);
    ref.current && onChange(stripChromeArtifacts(ref.current.innerHTML));
    placeToolbar();
  };

  return (
    <div className="relative">
      {toolbar && (
        <div
          className="absolute z-10 inline-flex items-center gap-0.5 bg-[#1A1A1A] text-white rounded-md shadow-lg px-1 py-1"
          style={{ top: toolbar.top, left: toolbar.left }}
        >
          <ToolBtn onClick={() => cmd("bold")} title="Bold"><Bold className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn onClick={() => cmd("italic")} title="Italic"><Italic className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn onClick={() => cmd("formatBlock", "<h2>")} title="Heading"><Heading2 className="w-3.5 h-3.5" /></ToolBtn>
          <ToolBtn onClick={() => cmd("insertUnorderedList")} title="List"><List className="w-3.5 h-3.5" /></ToolBtn>
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        spellCheck
        onBlur={(e) => onChange(stripChromeArtifacts(e.currentTarget.innerHTML))}
        onMouseUp={placeToolbar}
        onKeyUp={placeToolbar}
        className="prose prose-sm max-w-none text-[#1A1A1A] focus:outline-none rounded-md min-h-[500px]"
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1.7,
          fontSize: 14,
        }}
      />
    </div>
  );
}

function ToolBtn({
  onClick, children, title,
}: { onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      // mousedown to avoid losing the selection
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="h-7 w-7 rounded hover:bg-white/15 flex items-center justify-center text-white"
      data-allow-dark-cta
      data-no-contrast-guard
    >
      {children}
    </button>
  );
}
