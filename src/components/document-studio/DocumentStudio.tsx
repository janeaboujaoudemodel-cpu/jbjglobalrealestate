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
  Copy,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { removeWhiteBackground } from "@/lib/removeWhiteBackground";
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
import { exportPdf, exportDocx, exportPng, printDocument, DocumentMarks } from "./export/exporters";
import {
  compose as composeDocument,
  DEFAULT_BROKER_COMMISSIONS,
  type CommissionRow,
  type CustomField,
} from "@/templates/composers";
import { renderStandardBody } from "@/templates/composers/standardBody";
import { useCrmDocuments, useSaveDocument } from "@/hooks/useCrmDocuments";

interface Props {
  catalog: DocumentAudience;
  trigger?: React.ReactNode;
  presetTemplateId?: string;
}

type Step = 1 | 2 | 3;
const OWNER_TEST_EMAIL = "infoo.jane@gmail.com";

export default function DocumentStudio({ catalog, trigger, presetTemplateId }: Props) {
  const [open, setOpen] = useState(false);

  // Auto-open when a one-shot prefill payload was dropped in sessionStorage
  // by an external bridge (e.g. CV Center "Open in Document Studio").
  useEffect(() => {
    try {
      const key = `jbj:doc-studio:prefill:${catalog}`;
      if (sessionStorage.getItem(key)) setOpen(true);
    } catch {}
  }, [catalog]);

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
  const isValidCatalogTemplate = (id?: string | null) => {
    if (!id) return false;
    return getTemplateById(id)?.audience === catalog;
  };
  const initialId =
    presetTemplateId && isValidCatalogTemplate(presetTemplateId)
      ? presetTemplateId
      : "";

  // ── Session persistence: survive refresh / tab-close / accidental logout.
  const SESSION_KEY = `jbj:doc-studio:session:${catalog}`;
  const hydratedRef = useRef(false);
  const restoredOnce = useRef(false);
  const readSnapshot = (): any => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const j = JSON.parse(raw);
      // Expire after 30 days.
      if (!j?.savedAt || (Date.now() - new Date(j.savedAt).getTime()) > 30 * 86400_000) return null;
      // If an old removed template (for example candidate_cv) was saved,
      // ignore that snapshot so the template sidebar opens normally.
      if (j.templateId && !isValidCatalogTemplate(j.templateId)) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return j;
    } catch { return null; }
  };
  const snap = readSnapshot();

  const [step, setStep] = useState<Step>(snap?.templateId ? (snap.step ?? 2) : (initialId ? 2 : 1));
  const [templateId, setTemplateId] = useState<string>(snap?.templateId || initialId);
  const template = useMemo(() => getTemplateById(templateId), [templateId]);


  // Custom departments (persisted locally so users can add/rename/delete their own).
  const DEPT_STORAGE_KEY = "jbj:doc-studio:custom-departments";
  const [customDepartments, setCustomDepartments] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(DEPT_STORAGE_KEY) || "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem(DEPT_STORAGE_KEY, JSON.stringify(customDepartments)); } catch {}
  }, [customDepartments]);
  const allDepartments = useMemo(
    () => Array.from(new Set([...(DEPARTMENTS as readonly string[]), ...customDepartments])),
    [customDepartments]
  );
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [editingDept, setEditingDept] = useState<string | null>(null);
  const [deptDraft, setDeptDraft] = useState("");
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

  // Auto-fit preview: scale the fixed 816-wide A4 page down to whatever
  // width the center pane has so it never overflows horizontally.
  //
  // Pagination model:
  //   • Preview renders separate fixed 816×1154 A4 sheets only — never one
  //     stretched PAGE_H * pageCount / natural-height canvas.
  //   • pageCount is derived from measured body content and is hard-capped at
  //     MAX_PAGES so any measurement glitch can never run away.
  //   • Page-break overlays snap UP to the nearest block bottom inside the
  //     body (paragraphs, tables, signature block) so a break never slices
  //     through content. SAFE_GUTTER also keeps content off the very top
  //     and bottom edges of each visual A4 page.
  //   • Owner can manually add extra blank A4 pages via the "+ Add page"
  //     button below the preview.
  const PAGE_W = 816;
  const PAGE_H = 1154; // A4 ratio @ 96dpi (one page)
  const MAX_PAGES = 3; // locked template pages: 1, 2, 3 only
  const SAFE_GUTTER = 48; // top/bottom breathing room on every visual page
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [sheetH, setSheetH] = useState(0);
  const [chromeHeights, setChromeHeights] = useState({ header: 180, footer: 86 });
  const [smartBreaks, setSmartBreaks] = useState<number[]>([]);
  const [manualPages, setManualPages] = useState<number>(0);
  useEffect(() => {
    const wrap = previewWrapRef.current;
    if (!wrap) return;
    const update = () => {
      const w = wrap.clientWidth;
      const padding = 48;
      const fit = Math.min(1, Math.max(0.3, (w - padding) / PAGE_W));
      setFitScale(fit);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);
  const effectiveScale = (zoom / 100) * fitScale;

  useEffect(() => {
    if (!open || !template) return;
    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const body = bodyRef.current;
        if (!body) return;

        const headerH = headerRef.current?.offsetHeight ?? 0;
        const footerH = footerRef.current?.offsetHeight ?? 0;
        const nextSheetH = Math.max(0, Math.ceil(body.scrollHeight));
        setSheetH((current) => (Math.abs(current - nextSheetH) > 1 ? nextSheetH : current));
        setChromeHeights((current) => {
          const next = { header: Math.max(1, Math.ceil(headerH)), footer: Math.max(1, Math.ceil(footerH)) };
          return Math.abs(current.header - next.header) > 1 || Math.abs(current.footer - next.footer) > 1 ? next : current;
        });

        const bodyTop = body.getBoundingClientRect().top;
        // Atomic blocks: never break inside these — only their outer bottom is a candidate.
        const atomicSelector = "[data-pdf-section],[data-signature-block]";
        const atomicEls = Array.from(body.querySelectorAll<HTMLElement>(atomicSelector));
        const atomicRanges = atomicEls.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: Math.round(r.top - bodyTop), bottom: Math.round(r.bottom - bodyTop) };
        });
        const insideAtomic = (y: number) =>
          atomicRanges.some((rg) => y > rg.top + 2 && y < rg.bottom - 2);

        const childBoundaries = Array.from(body.querySelectorAll<HTMLElement>("p,li,table,h1,h2,h3"))
          .map((el) => Math.round(el.getBoundingClientRect().bottom - bodyTop))
          .filter((y) => !insideAtomic(y));
        const atomicBoundaries = atomicRanges.map((rg) => rg.bottom);
        const all = [...childBoundaries, ...atomicBoundaries]
          .filter((y) => y > SAFE_GUTTER && y < nextSheetH - SAFE_GUTTER)
          .sort((a, b) => a - b);
        const unique = all.filter((y, index, arr) => index === 0 || Math.abs(y - arr[index - 1]) > 4);
        setSmartBreaks(unique);
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (bodyRef.current) ro.observe(bodyRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    if (footerRef.current) ro.observe(footerRef.current);
    return () => {
      window.cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [open, template, bodyHtml, manualPages]);




  // Owner-side signature defaults (editable from the left rail).
  const [ownerName, setOwnerName] = useState<string>("Jane Bou Jaoude");
  const [ownerTitle, setOwnerTitle] = useState<string>("Founder & CEO");
  const [ownerDate, setOwnerDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [applicantDate, setApplicantDate] = useState<string>(""); // blank by design

  // Additional signatories (beyond the default Owner + Counterparty).
  type ExtraSig = { id: string; name: string; title: string; date: string; label: string };
  const newSig = (): ExtraSig => ({ id: Math.random().toString(36).slice(2, 9), name: "", title: "", date: "", label: "" });
  const [extraSignatories, setExtraSignatories] = useState<ExtraSig[]>([]);
  const updateSig = (id: string, patch: Partial<ExtraSig>) =>
    setExtraSignatories((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSig = (id: string) => setExtraSignatories((p) => p.filter((s) => s.id !== id));
  const duplicateSig = (id: string) =>
    setExtraSignatories((p) => {
      const i = p.findIndex((s) => s.id === id);
      if (i < 0) return p;
      const copy = { ...p[i], id: Math.random().toString(36).slice(2, 9) };
      return [...p.slice(0, i + 1), copy, ...p.slice(i + 1)];
    });

  /** Scroll to and briefly highlight a signature cell in the preview. */
  const highlightSig = (sigId: string) => {
    const el = document.querySelector<HTMLElement>(`[data-sig-id="${sigId}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "outline-color 200ms, background-color 200ms";
    el.style.outline = "2px solid #B89555";
    el.style.outlineOffset = "4px";
    el.style.backgroundColor = "rgba(184,149,85,0.08)";
    window.setTimeout(() => {
      el.style.outline = "";
      el.style.outlineOffset = "";
      el.style.backgroundColor = "";
    }, 1400);
  };

  // Hide / restore the "Commission" and "Custom fields" rail cards.
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  const toggleSection = (id: string) =>
    setHiddenSections((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Per-field hide + rename for the template fields panel.
  const [hiddenFieldKeys, setHiddenFieldKeys] = useState<Set<string>>(new Set());
  const [fieldLabelOverrides, setFieldLabelOverrides] = useState<Record<string, string>>({});
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const hideField = (k: string) => setHiddenFieldKeys((s) => { const n = new Set(s); n.add(k); return n; });
  const restoreAllFields = () => setHiddenFieldKeys(new Set());

  // Save-as-Template state.
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  type SavedTpl = { id: string; name: string; base_template_id: string; payload: any; is_default: boolean };
  const [savedTemplates, setSavedTemplates] = useState<SavedTpl[]>([]);

  // Load saved templates for current audience.
  const reloadSavedTemplates = async () => {
    const { data, error } = await (supabase as any)
      .from("saved_document_templates")
      .select("id,name,base_template_id,payload,is_default")
      .eq("audience", catalog)
      .order("updated_at", { ascending: false });
    if (!error && Array.isArray(data)) setSavedTemplates(data as SavedTpl[]);
  };
  useEffect(() => { reloadSavedTemplates(); /* eslint-disable-next-line */ }, [catalog]);

  const applySavedTemplate = (s: SavedTpl) => {
    const p = s.payload || {};
    setTemplateId(s.base_template_id);
    if (p.fields) setFields(p.fields);
    if (p.department) setDepartment(p.department);
    if (p.commissionRows) setCommissionRows(p.commissionRows);
    if (p.customFields) setCustomFields(p.customFields);
    if (p.ownerName) setOwnerName(p.ownerName);
    if (p.ownerTitle) setOwnerTitle(p.ownerTitle);
    if (p.ownerDate) setOwnerDate(p.ownerDate);
    if (p.hiddenFieldKeys) setHiddenFieldKeys(new Set(p.hiddenFieldKeys));
    if (p.fieldLabelOverrides) setFieldLabelOverrides(p.fieldLabelOverrides);
    if (p.hiddenSections) setHiddenSections(new Set(p.hiddenSections));
    setStep(2);
    toast.success(`Loaded "${s.name}"`);
  };

  const deleteSavedTemplate = async (id: string) => {
    const { error } = await (supabase as any).from("saved_document_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setSavedTemplates((xs) => xs.filter((x) => x.id !== id));
    toast.success("Template deleted");
  };

  const handleSaveTemplate = async () => {
    if (!template) { toast.error("Pick a template first"); return; }
    const name = (saveName || `${template.label} — Custom`).trim();
    setSavingTemplate(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) throw new Error("Sign in required");
      const payload = {
        fields, department, commissionRows, customFields,
        ownerName, ownerTitle, ownerDate,
        hiddenFieldKeys: Array.from(hiddenFieldKeys),
        fieldLabelOverrides,
        hiddenSections: Array.from(hiddenSections),
      };
      const { error } = await (supabase as any).from("saved_document_templates").insert({
        owner_id: u.user.id,
        audience: catalog,
        base_template_id: template.id,
        name,
        is_default: saveAsDefault,
        payload,
      });
      if (error) throw error;
      toast.success(`Saved "${name}"`);
      setSaveDialogOpen(false);
      setSaveName("");
      setSaveAsDefault(false);
      reloadSavedTemplates();
    } catch (e: any) {
      toast.error(e?.message || "Save failed");
    } finally {
      setSavingTemplate(false);
    }
  };

  /* ── Generated Documents library (crm_documents) ─────────────────── */
  const { data: allDocs = [] } = useCrmDocuments("all");
  const saveDocMutation = useSaveDocument();
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(undefined);
  const docsForTemplate = useMemo(
    () => (template ? allDocs.filter((d) => d.template_id === template.id) : []),
    [allDocs, template],
  );

  const handleSaveDocument = async () => {
    if (!template) { toast.error("Pick a template first"); return; }
    // Derive booking id (chained, server-side) if not already in field_values.
    let booking_id = (fields.booking_id || fields.bookingRef || "").trim();
    if (!booking_id) {
      const prefix =
        template.id === "holiday_home_agreement" ? "JBJ-HH" :
        template.id === "commission_agreement"   ? "JBJ-CA" :
        template.id === "property_advertising_agreement" ? "JBJ-PAA" :
        "JBJ-DOC";
      try {
        const { data, error } = await (supabase as any).rpc("next_booking_id", { prefix });
        if (!error && data) booking_id = String(data);
      } catch { /* fall back to client gen below */ }
      if (!booking_id) booking_id = `${"JBJ-DOC"}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    }
    const nextFields = { ...fields, booking_id };
    setFields(nextFields);
    const title =
      (fields.guest_name || fields.client_name || fields.full_name || "Untitled") +
      ` — ${template.label} (${booking_id})`;
    try {
      const saved = await saveDocMutation.mutateAsync({
        id: currentDocId,
        template_id: template.id,
        title,
        field_values: nextFields,
        client_name: fields.guest_name || fields.client_name || null,
        client_email: fields.guest_email || fields.client_email || null,
        client_phone: fields.guest_phone || fields.client_phone || null,
      });
      setCurrentDocId(saved.id);
    } catch (e: any) {
      // toast already shown by hook
    }
  };

  const loadCrmDocument = (d: { id: string; field_values: Record<string, string>; template_id: string; title: string }) => {
    setTemplateId(d.template_id);
    setFields(d.field_values || {});
    setCurrentDocId(d.id);
    setStep(2);
    toast.success(`Loaded "${d.title}"`);
  };



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
  const [exporting, setExporting] = useState<null | "pdf" | "docx" | "png" | "both">(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch {} };

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
  // Stamp is stripped of any white background so it overlays cleanly.
  useEffect(() => {
    (async () => {
      let stampUrl = defaultStamp?.signedUrl;
      if (stampUrl) {
        try {
          // Fetch → dataURL → strip white → use stripped version
          const res = await fetch(stampUrl);
          const blob = await res.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(String(fr.result || ""));
            fr.readAsDataURL(blob);
          });
          const { result } = await removeWhiteBackground(dataUrl, 235);
          stampUrl = result;
        } catch { /* fall back to original signed URL */ }
      }
      setMarks((m) => {
        const next = { ...m };
        if (!next.signature && defaultSignature?.signedUrl) {
          next.signature = { url: defaultSignature.signedUrl, width: 200 };
        }
        if (!next.stamp && stampUrl) {
          next.stamp = { url: stampUrl, width: 180, rotation: -8 };
        }
        return next;
      });
    })();
  }, [defaultSignature?.signedUrl, defaultStamp?.signedUrl]);

  // Owner-date in the left rail is the single source of truth for the
  // preview date chip. Whenever it changes, propagate to marks.dateValue.
  useEffect(() => {
    setMarks((m) => ({ ...m, dateValue: ownerDate }));
  }, [ownerDate]);

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

  // ── Hydrate full session snapshot on mount (fields, body, signatories, marks, etc.)
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (!snap) return;
    try {
      if (snap.fields && typeof snap.fields === "object") setFields(snap.fields);
      if (typeof snap.bodyHtml === "string" && snap.bodyHtml) {
        setBodyHtml(snap.bodyHtml);
        if (snap.userEdited) { userEditedRef.current = true; setUserEdited(true); }
      }
      if (typeof snap.ownerName === "string") setOwnerName(snap.ownerName);
      if (typeof snap.ownerTitle === "string") setOwnerTitle(snap.ownerTitle);
      if (typeof snap.applicantDate === "string") setApplicantDate(snap.applicantDate);
      if (Array.isArray(snap.extraSignatories)) setExtraSignatories(snap.extraSignatories);
      if (Array.isArray(snap.hiddenFieldKeys)) setHiddenFieldKeys(new Set(snap.hiddenFieldKeys));
      if (snap.fieldLabelOverrides && typeof snap.fieldLabelOverrides === "object") setFieldLabelOverrides(snap.fieldLabelOverrides);
      if (Array.isArray(snap.hiddenSections)) setHiddenSections(new Set(snap.hiddenSections));
      if (Array.isArray(snap.customFields)) setCustomFields(snap.customFields);
      if (Array.isArray(snap.commissionRows)) setCommissionRows(snap.commissionRows);
      if (typeof snap.docLanguage === "string") setDocLanguage(snap.docLanguage);
      if (snap.marks && typeof snap.marks === "object") setMarks((m) => ({ ...m, ...snap.marks }));
      if (typeof snap.emailTo === "string") setEmailTo(snap.emailTo);
      if (!restoredOnce.current) {
        restoredOnce.current = true;
        toast.success("Draft restored", { description: "Your previous work was recovered." });
      }
    } catch {}

    // ── One-shot prefill from an external bridge.
    // Only valid, current templates may open Document Studio. Removed templates
    // are cleared so they cannot leave the left sidebar empty.
    try {
      const PREFILL_KEY = `jbj:doc-studio:prefill:${catalog}`;
      const raw = sessionStorage.getItem(PREFILL_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        const validPrefillTemplate = p?.templateId && getTemplateById(p.templateId)?.audience === catalog;
        if (validPrefillTemplate) {
          setTemplateId(p.templateId);
          if (p?.fields && typeof p.fields === "object") {
            setFields((cur) => ({ ...cur, ...p.fields }));
          }
          setStep(2);
          toast.success("Applicant loaded", { description: "Details pre-filled in the Studio." });
        } else {
          setTemplateId("");
          setStep(1);
        }
        sessionStorage.removeItem(PREFILL_KEY);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-save snapshot (debounced) to survive refresh / accidental close / logout.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const payload = {
      savedAt: new Date().toISOString(),
      step, templateId, fields, bodyHtml, userEdited,
      ownerName, ownerTitle, applicantDate,
      extraSignatories,
      hiddenFieldKeys: Array.from(hiddenFieldKeys),
      fieldLabelOverrides,
      hiddenSections: Array.from(hiddenSections),
      customFields, commissionRows, docLanguage,
      marks, emailTo,
    };
    const handle = setTimeout(() => {
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(payload)); } catch {}
    }, 400);
    const flush = () => {
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(payload)); } catch {}
    };
    window.addEventListener("beforeunload", flush);
    return () => { clearTimeout(handle); window.removeEventListener("beforeunload", flush); };
  }, [step, templateId, fields, bodyHtml, userEdited, ownerName, ownerTitle, applicantDate,
      extraSignatories, hiddenFieldKeys, fieldLabelOverrides, hiddenSections,
      customFields, commissionRows, docLanguage, marks, emailTo, SESSION_KEY]);


  useEffect(() => {
    if (!template) return;
    // Drop hidden field keys before rendering body.
    const visibleFields: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) {
      if (!hiddenFieldKeys.has(k)) visibleFields[k] = v;
    }
    const next = renderStandardBody({
      templateId: template.id,
      fields: visibleFields,
      department: template.needsPosition ? department : undefined,
      commissionRows: usesCommission && !hiddenSections.has("commission") ? commissionRows : undefined,
      customFields: hiddenSections.has("custom") ? [] : customFields,
      ownerName,
      ownerTitle,
      ownerDate,
      applicantDate,
      hideLetterDate: true,
      extraSignatories,
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
    JSON.stringify(Array.from(hiddenFieldKeys)),
    ownerName, ownerTitle, ownerDate, applicantDate,
    JSON.stringify(extraSignatories),
  ]);

  const resetToTemplate = () => {
    userEditedRef.current = false;
    setUserEdited(false);
    if (autoBodyRef.current) setBodyHtml(autoBodyRef.current);
  };

  const handleSelectTemplate = (id: string) => {
    // No-op if the same template is re-selected — never wipe an in-progress body.
    if (id === templateId) { setStep(2); return; }
    setTemplateId(id);
    setFields({});
    setExtraSignatories([]);
    autoBodyRef.current = "";
    userEditedRef.current = false;
    setUserEdited(false);
    setBodyHtml("");
    // Reset draggable mark positions so a new template starts clean
    // (prevents the date drifting onto the footer after a previous drag).
    setMarks((m) => ({
      ...m,
      dateXY: undefined,
      signatureXY: undefined,
      stampXY: undefined,
    }));
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
        extraSignatories,
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

  const handleExport = async (kind: "pdf" | "docx" | "png" | "both") => {
    if (!bodyHtml || !template) { toast.error("Nothing to export yet"); return; }
    setExporting(kind);
    try {
      const src = pageRef.current;
      if (kind === "pdf") await exportPdf(bodyHtml, marks, template, src);
      else if (kind === "docx") await exportDocx(bodyHtml, marks, template);
      else if (kind === "png") await exportPng(bodyHtml, marks, template, src);
      else if (kind === "both") {
        await exportPdf(bodyHtml, marks, template, src);
        await exportPng(bodyHtml, marks, template, src);
      }
      toast.success(`${kind.toUpperCase()} downloaded`);
    } catch (e: any) {
      console.error("[DocumentStudio] export failed", kind, e);
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
      const { data, error } = await supabase.functions.invoke("email-send-gateway", {
        body: {
          from: "JBJ Global Real Estate <contact@jbj.ae>",
          to,
          subject: template.emailSubject || template.label,
          html: fullHtml,
          reply_to: "contact@jbj.ae",
        },
      });
      if (error) throw error;
      if (data && data.ok === false) throw new Error(data.error || "Send failed");
      toast.success(recipientOverride ? `Test sent to ${recipientOverride}` : `Sent to ${to}`);
      if (!recipientOverride) clearSession();
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
          <div className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A]/70 border border-[#B89555] bg-[#F7F2EA] rounded-md pl-2 pr-1 py-0.5 focus-within:ring-1 focus-within:ring-[#B89555]">
            <Globe className="w-3.5 h-3.5 text-[#B89555]" />
            <Select value={docLanguage} onValueChange={setDocLanguage}>
              <SelectTrigger className="h-6 w-[112px] border-0 bg-transparent px-1.5 text-[12px] font-semibold text-[#1A1A1A] focus:ring-0 focus:ring-offset-0 focus:border-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[2147483647]">
                {AI_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => setAssetDialog("signature")} title="Signature">
            <PenLine className="w-4 h-4 lg:mr-1.5" />
            <span className="hidden lg:inline">Signature</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAssetDialog("stamp")} title="Stamp">
            <Stamp className="w-4 h-4 lg:mr-1.5" />
            <span className="hidden lg:inline">Stamp</span>
          </Button>
          {template && userEdited && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToTemplate}
              title="Discard edits and re-render from template"
            >
              <X className="w-4 h-4 lg:mr-1.5" />
              <span className="hidden lg:inline">Reset</span>
            </Button>
          )}
          {template && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSaveName(`${template.label} — Custom`); setSaveDialogOpen(true); }}
              title="Save current edits as a reusable template"
            >
              <Check className="w-4 h-4 lg:mr-1.5" />
              <span className="hidden lg:inline">Save Template</span>
            </Button>
          )}
          {template && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveDocument}
              disabled={saveDocMutation.isPending}
              title="Save this filled document to My Documents"
            >
              {saveDocMutation.isPending
                ? <Loader2 className="w-4 h-4 lg:mr-1.5 animate-spin" />
                : <FileText className="w-4 h-4 lg:mr-1.5" />}
              <span className="hidden lg:inline">{currentDocId ? "Update" : "Save Document"}</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 lg:mr-1.5" /> : <Maximize2 className="w-4 h-4 lg:mr-1.5" />}
            <span className="hidden lg:inline">{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAiOpen((v) => !v)} title={aiOpen ? "Hide AI" : "Show AI"}>
            {aiOpen ? <PanelRightClose className="w-4 h-4 lg:mr-1.5" /> : <PanelRightOpen className="w-4 h-4 lg:mr-1.5" />}
            <span className="hidden lg:inline">{aiOpen ? "Hide AI" : "Show AI"}</span>
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

      {saveDialogOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          style={{ zIndex: 2147483100 }}
          onClick={() => setSaveDialogOpen(false)}
        >
          <div
            className="bg-[#FDFBF7] rounded-xl border border-[#B89555]/40 p-5 w-[420px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[14px] font-semibold text-[#1A1A1A] mb-1">Save as Template</div>
            <div className="text-[11px] text-[#1A1A1A]/65 mb-4">
              Saves all current edits, hidden fields and renames so you can reuse this layout later.
            </div>
            <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 mb-1.5 block">Template name</Label>
            <Input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="My custom Job Offer"
              className="bg-[#FDFBF7] mb-3"
            />
            <label className="flex items-center gap-2 text-[12px] text-[#1A1A1A] mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
              />
              Set as my default for {catalog === "staff" ? "staff" : "client"} documents
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveTemplate} disabled={savingTemplate || !saveName.trim()}>
                {savingTemplate ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}


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
                    <div className="space-y-1.5">
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger className="bg-[#FDFBF7]"><SelectValue /></SelectTrigger>
                        <SelectContent className="z-[2147483647] bg-[#FDFBF7]">
                          {allDepartments.map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Custom departments — rename / delete */}
                      {customDepartments.length > 0 && (
                        <div className="space-y-1 pt-1">
                          {customDepartments.map((d) => (
                            <div key={d} className="flex items-center gap-1.5 text-[11px]">
                              {editingDept === d ? (
                                <Input
                                  autoFocus
                                  value={deptDraft}
                                  onChange={(e) => setDeptDraft(e.target.value)}
                                  onBlur={() => {
                                    const v = deptDraft.trim();
                                    if (v && v !== d) {
                                      setCustomDepartments((p) => p.map((x) => (x === d ? v : x)));
                                      if (department === d) setDepartment(v);
                                    }
                                    setEditingDept(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                    if (e.key === "Escape") setEditingDept(null);
                                  }}
                                  className="h-6 text-[11px] flex-1"
                                />
                              ) : (
                                <span className="flex-1 text-[#1A1A1A]/80 truncate">• {d}</span>
                              )}
                              <button
                                type="button"
                                onClick={() => { setEditingDept(d); setDeptDraft(d); }}
                                className="text-[#1A1A1A]/60 hover:text-[#B89555] p-0.5"
                                title="Rename"
                              >
                                <PenLine className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomDepartments((p) => p.filter((x) => x !== d));
                                  if (department === d) setDepartment(DEPARTMENTS[0]);
                                }}
                                className="text-[#1A1A1A]/60 hover:text-red-600 p-0.5"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const name = window.prompt("New department name");
                          const v = (name || "").trim();
                          if (!v) return;
                          if (allDepartments.includes(v)) { toast.error("Department already exists"); return; }
                          setCustomDepartments((p) => [...p, v]);
                          setDepartment(v);
                        }}
                        className="text-[11px] text-[#1A1A1A]/70 hover:text-[#B89555] underline underline-offset-2"
                      >
                        + Add custom department
                      </button>
                    </div>
                  </Field>
                )}

                {savedTemplates.filter((s) => s.base_template_id === template.id).length > 0 && (
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-1.5">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold mb-1">
                      My Saved Versions
                    </div>
                    {savedTemplates.filter((s) => s.base_template_id === template.id).map((s) => (
                      <div key={s.id} className="flex items-center gap-1.5 group">
                        <button
                          type="button"
                          onClick={() => applySavedTemplate(s)}
                          className="flex-1 text-left text-[12px] text-[#1A1A1A] hover:text-[#B89555] truncate"
                        >
                          {s.name}{s.is_default && <span className="text-[10px] text-[#B89555] ml-1">★ default</span>}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedTemplate(s.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#1A1A1A]/55 hover:text-red-600"
                          title="Delete saved template"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {template.fields.filter((f) => !hiddenFieldKeys.has(f.key)).map((f) => {
                  const label = fieldLabelOverrides[f.key] ?? f.label;
                  const isEditing = editingFieldKey === f.key;
                  return (
                    <div key={f.key}>
                      <div className="flex items-center gap-1 mb-1.5 group">
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={label}
                            onChange={(e) => setFieldLabelOverrides((p) => ({ ...p, [f.key]: e.target.value }))}
                            onBlur={() => setEditingFieldKey(null)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingFieldKey(null); }}
                            className="h-6 text-[10px] uppercase tracking-[0.18em] flex-1"
                          />
                        ) : (
                          <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 flex-1">
                            {label}
                            {f.required && <span className="text-red-600 ml-1">*</span>}
                          </Label>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingFieldKey(isEditing ? null : f.key)}
                          className="text-[#1A1A1A]/60 hover:text-[#B89555] p-0.5"
                          title="Rename field"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => hideField(f.key)}
                          className="text-[#1A1A1A]/60 hover:text-red-600 p-0.5"
                          title="Remove this field from document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
                    </div>
                  );
                })}

                {hiddenFieldKeys.size > 0 && (
                  <button
                    type="button"
                    onClick={restoreAllFields}
                    className="w-full text-[11px] text-[#1A1A1A]/70 hover:text-[#B89555] underline underline-offset-2"
                  >
                    + Restore hidden fields ({hiddenFieldKeys.size})
                  </button>
                )}


                {/* Unified Signatories panel — mirrors what's rendered in the preview */}
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                      Signatories ({2 + extraSignatories.length})
                    </div>
                    <button
                      type="button"
                      onClick={() => setExtraSignatories((p) => [...p, newSig()])}
                      className="text-[11px] text-[#1A1A1A]/70 hover:text-[#B89555] underline underline-offset-2"
                    >
                      + Add signatory
                    </button>
                  </div>

                  {/* 1 — Company (locked) */}
                  <div
                    className="rounded border border-[#B89555]/25 bg-[#FDFBF7] p-2 space-y-1.5 cursor-pointer hover:ring-1 hover:ring-[#B89555]/40"
                    onClick={() => highlightSig("owner")}
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                      1 — JBJ GLOBAL REAL ESTATE <span className="text-[#1A1A1A]/40 normal-case tracking-normal">(locked)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner Name" className="bg-[#FDFBF7] h-7 text-[11px]" />
                      <Input value={ownerTitle} onChange={(e) => setOwnerTitle(e.target.value)} placeholder="Title" className="bg-[#FDFBF7] h-7 text-[11px]" />
                    </div>
                    <Input type="date" value={ownerDate} onChange={(e) => setOwnerDate(e.target.value)} className="bg-[#FDFBF7] h-7 text-[11px]" />
                  </div>

                  {/* 2 — Recipient (locked) */}
                  <div
                    className="rounded border border-[#B89555]/25 bg-[#FDFBF7] p-2 space-y-1.5 cursor-pointer hover:ring-1 hover:ring-[#B89555]/40"
                    onClick={() => highlightSig("recipient")}
                  >
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold">
                      2 — Recipient / Counterparty <span className="text-[#1A1A1A]/40 normal-case tracking-normal">(locked)</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      <Input
                        value={fields.recipientName || ""}
                        onChange={(e) => setField("recipientName", e.target.value)}
                        placeholder="Recipient Name"
                        className="bg-[#FDFBF7] h-7 text-[11px]"
                      />
                    </div>
                    <Input type="date" value={applicantDate} onChange={(e) => setApplicantDate(e.target.value)} className="bg-[#FDFBF7] h-7 text-[11px]" />
                  </div>

                  {/* 3..N — Extras */}
                  {extraSignatories.map((s, idx) => (
                    <div
                      key={s.id}
                      className="rounded border border-[#B89555]/25 bg-[#FDFBF7] p-2 space-y-1.5 cursor-pointer hover:ring-1 hover:ring-[#B89555]/40"
                      onClick={() => highlightSig(`extra-${idx}`)}
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65 font-semibold whitespace-nowrap">
                          {idx + 3} —
                        </span>
                        <Input
                          value={s.label}
                          onChange={(e) => updateSig(s.id, { label: e.target.value })}
                          placeholder="Label (e.g. Witness)"
                          className="h-7 text-[11px] flex-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); duplicateSig(s.id); }}
                          className="text-[#1A1A1A]/60 hover:text-[#B89555] p-0.5"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeSig(s.id); }}
                          className="text-[#1A1A1A]/60 hover:text-red-600 p-0.5"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          value={s.name}
                          onChange={(e) => updateSig(s.id, { name: e.target.value })}
                          placeholder={`Name #${idx + 1}`}
                          className="h-7 text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Input
                          value={s.title}
                          onChange={(e) => updateSig(s.id, { title: e.target.value })}
                          placeholder="Title"
                          className="h-7 text-[11px]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <Input
                        type="date"
                        value={s.date}
                        onChange={(e) => updateSig(s.id, { date: e.target.value })}
                        className="h-7 text-[11px]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}
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
                              fieldKeys: template.fields.map((f) => f.key),
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
                              fieldKeys: template.fields.map((f) => f.key),
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
                <div className="flex w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-r-none border-r-0"
                    disabled={!!exporting}
                    onClick={() => handleExport("pdf")}
                    title="Download PDF immediately"
                  >
                    {exporting === "pdf" ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
                    Export PDF
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-l-none px-2" disabled={!!exporting} title="More export formats">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#FDFBF7] z-[2147483647]">
                      <DropdownMenuItem onClick={() => handleExport("pdf")}>
                        <FileText className="w-4 h-4 mr-2" /> Download PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("png")}>
                        <FileText className="w-4 h-4 mr-2" /> Download Image (PNG)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("docx")}>
                        <FileText className="w-4 h-4 mr-2" /> Download Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("both")}>
                        <FileText className="w-4 h-4 mr-2" /> Download PDF + PNG
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" /> Print
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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

        {/* CENTER — A4 PREVIEW (fixed A4 sheets, smart-cropped) */}
        <main ref={previewWrapRef} className="flex-1 min-w-0 bg-[#F0E8D8] overflow-auto relative">
          <div className="min-h-full flex justify-center py-10 px-4">
            {template ? (
              (() => {
                const BODY_PAD_X = 56;
                const FIRST_TOP = 28;
                const NEXT_TOP = 56;
                const BOTTOM_PAD = 28;
                const bodyWidth = PAGE_W - BODY_PAD_X * 2;

                // Parse the bodyHtml into [data-pdf-page] groups. If the
                // composer didn't emit explicit groups, fall back to a
                // single full-content page.
                const parsePageGroups = (html: string): string[] => {
                  if (!html) return [""];
                  if (typeof window === "undefined") return [html];
                  const tpl = document.createElement("template");
                  tpl.innerHTML = html;
                  const groups = Array.from(
                    tpl.content.querySelectorAll<HTMLElement>("[data-pdf-page]"),
                  ).map((el) => el.innerHTML);
                  return groups.length ? groups : [html];
                };

                const pageGroups = parsePageGroups(bodyHtml);
                const pageCount = Math.min(MAX_PAGES, Math.max(1, pageGroups.length));

                return (
                  <div className="flex flex-col items-center gap-4" style={{ width: PAGE_W * effectiveScale, flexShrink: 0 }}>
                    <div ref={pageRef} className="flex flex-col gap-7" data-document-pages="true">
                      <div aria-hidden className="fixed left-[-10000px] top-0 pointer-events-none opacity-0" style={{ width: PAGE_W }}>
                        <div ref={headerRef}><LockedLetterhead /></div>
                        <div ref={bodyRef} className="prose prose-sm max-w-none text-[#1A1A1A]" style={{ width: bodyWidth, fontFamily: "Inter, system-ui, sans-serif", lineHeight: 1.7, fontSize: 14 }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml || "") }} />
                        <div ref={footerRef}><LockedFooter /></div>
                      </div>

                      {Array.from({ length: pageCount }).map((_, pageIndex) => {
                        const isFirst = pageIndex === 0;
                        const isLast = pageIndex === pageCount - 1;
                        const topPad = isFirst ? FIRST_TOP : NEXT_TOP;
                        const groupHtml = pageGroups[pageIndex] ?? "";

                        return (
                          <div key={`page-${pageIndex}`} style={{ width: PAGE_W * effectiveScale, height: PAGE_H * effectiveScale, position: "relative" }}>
                            <div
                              data-document-page="true"
                              data-page-number={pageIndex + 1}
                              className="bg-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] rounded-md overflow-hidden border border-[#B89555]/20 relative"
                              style={{
                                width: PAGE_W,
                                height: PAGE_H,
                                transform: `scale(${effectiveScale})`,
                                transformOrigin: "top left",
                                background: "#FDFBF7",
                              }}
                            >
                              {/* Header — only on page 1 */}
                              {isFirst && <LockedLetterhead />}

                              {/* Body region — fills the remaining vertical space
                                  ABOVE the absolute-bottom footer */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: isFirst ? chromeHeights.header : 0,
                                  left: 0,
                                  right: 0,
                                  bottom: chromeHeights.footer,
                                  padding: `${topPad}px ${BODY_PAD_X}px ${BOTTOM_PAD}px`,
                                  boxSizing: "border-box",
                                  overflow: "hidden",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: isLast && pageIndex === 2 ? "center" : "flex-start",
                                }}
                              >
                                {groupHtml ? (
                                  <div
                                    className="prose prose-sm max-w-none text-[#1A1A1A]"
                                    style={{
                                      width: bodyWidth,
                                      fontFamily: "Inter, system-ui, sans-serif",
                                      lineHeight: 1.7,
                                      fontSize: 13,
                                      color: "#1A1A1A",
                                    }}
                                    contentEditable={isFirst}
                                    suppressContentEditableWarning
                                    onBlur={(e) => {
                                      if (!isFirst) return;
                                      // Sync first-page edits back into the master bodyHtml,
                                      // wrapping with the original page1 marker.
                                      const next = e.currentTarget.innerHTML;
                                      const others = pageGroups.slice(1)
                                        .map((g, i) => `<section data-pdf-page="${i + 2}">${g}</section>`)
                                        .join("");
                                      userEditedRef.current = true;
                                      setUserEdited(true);
                                      setBodyHtml(`<section data-pdf-page="1">${next}</section>${others}`);
                                    }}
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(groupHtml) }}
                                  />
                                ) : (
                                  <div className="text-[12px] text-[#1A1A1A]/40 italic">
                                    Empty — generate a document to populate this page.
                                  </div>
                                )}

                                {/* Signature/stamp/date marks only on the LAST page */}
                                {isLast && marks.showDate !== false && (
                                  <DraggableMark x={marks.dateXY?.x ?? 556} y={marks.dateXY?.y ?? 8} onChange={(x, y) => setMarks((m) => ({ ...m, dateXY: { x, y } }))} onRemove={() => removeMark("date")} ariaLabel="Date">
                                    <div className="text-[11px] uppercase" style={{ color: "#1A1A1A", opacity: 0.42, letterSpacing: "0.22em", fontVariantNumeric: "tabular-nums", textShadow: "0 1px 0 rgba(255,255,255,0.65)" }}>
                                      {new Date(marks.dateValue || ownerDate || new Date().toISOString().slice(0,10)).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                                    </div>
                                  </DraggableMark>
                                )}
                                {isLast && marks.signature && (
                                  <DraggableMark x={marks.signatureXY?.x ?? 40} y={marks.signatureXY?.y ?? 320} onChange={(x, y) => setMarks((m) => ({ ...m, signatureXY: { x, y } }))} onRemove={() => removeMark("signature")} ariaLabel="Authorised signature">
                                    <img src={marks.signature.url} alt="Signature" style={{ width: marks.signature.width, maxWidth: 240 }} className="block pointer-events-none" />
                                  </DraggableMark>
                                )}
                                {isLast && marks.stamp && (
                                  <DraggableMark x={marks.stampXY?.x ?? 320} y={marks.stampXY?.y ?? 320} onChange={(x, y) => setMarks((m) => ({ ...m, stampXY: { x, y } }))} onRemove={() => removeMark("stamp")} ariaLabel="Stamp">
                                    <img src={marks.stamp.url} alt="Stamp" style={{ width: marks.stamp.width, maxWidth: 220, transform: `rotate(${marks.stamp.rotation ?? -8}deg)`, background: "transparent" }} className="block pointer-events-none" />
                                  </DraggableMark>
                                )}
                              </div>

                              {/* Footer — absolute flush-bottom on EVERY page, edge-to-edge, no gap */}
                              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
                                <LockedFooter />
                              </div>
                              <div aria-hidden className="absolute right-3 top-3 px-2 py-[2px] rounded-sm text-[10px] font-semibold uppercase pointer-events-none" style={{ background: "#FDFBF7", color: "#1A1A1A", border: "1px solid #B89555", letterSpacing: "0.18em" }}>
                                Page {pageIndex + 1} / {pageCount}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()





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
        onInput={(e) => onChange(stripChromeArtifacts(e.currentTarget.innerHTML))}
        onBlur={(e) => onChange(stripChromeArtifacts(e.currentTarget.innerHTML))}
        onMouseUp={placeToolbar}
        onKeyUp={placeToolbar}
        className="prose prose-sm max-w-none text-[#1A1A1A] focus:outline-none rounded-md min-h-[500px] cursor-text"
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
