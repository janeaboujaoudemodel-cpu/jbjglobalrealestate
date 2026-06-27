import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEsignTemplates, useCreateEnvelopeFromTemplate, type EsignTemplate } from "@/hooks/useEsignTemplates";
import { PAA_FIELD_GROUPS } from "@/templates/jbjPropertyAdvertisingAgreement";
import { useOwnerSignatureAssets } from "@/hooks/useOwnerSignatureAssets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FileText, Send, CheckCircle2, Clock, PenTool, Stamp, FileSignature, Loader2, Upload, Scale, Trash2, RotateCcw, FileEdit, Sparkles, Crown, MoreVertical, Star, Pencil, Archive, Download, Search, Briefcase, Building2, ReceiptText, Banknote } from "lucide-react";
import { buildSafeDownloadUrl } from "@/lib/buildSafeDownloadUrl";
import { maybeProxyStorageUrl } from "@/utils/downloadProxy";

/** Always route signed-PDF links through https://jbj.ae/d so they never expose
 *  the *.supabase.co host (which Chrome/uBlock blocks on desktop and which
 *  shows raw supabase.co in mobile save dialogs). */
function brandedDownloadHref(rawUrl: string | undefined, filename?: string): string {
  if (!rawUrl) return "#";
  return buildSafeDownloadUrl(rawUrl, filename) || maybeProxyStorageUrl(rawUrl, { filename, disposition: "attachment" });
}
import { toast } from "sonner";
import { SmartFillDropzone } from "@/components/e-signature/SmartFillDropzone";
import { AICommandPanel } from "@/components/owner/documents/AICommandPanel";
import { getCatalogByAudience, type DocumentTemplate } from "@/config/documentCatalog";
import { CandidateFoldersPanel } from "@/components/owner/documents/CandidateFoldersPanel";

let documentStudioPromise: Promise<typeof import("@/components/document-studio/DocumentStudio")> | null = null;
const loadDocumentStudio = () => {
  documentStudioPromise ||= import("@/components/document-studio/DocumentStudio");
  return documentStudioPromise;
};
const DocumentStudio = lazy(loadDocumentStudio);

type Cat = "all" | "leasing" | "selling";
type TemplateCategoryKey = "all" | "employees" | "client" | "forms" | "leasing" | "selling" | "after_sale" | "developer" | "finance";
type Bucket = "templates" | "documents" | "esign" | "drafts" | "generated" | "sent" | "submitted" | "signed" | "vault" | "candidates" | "folders" | "deleted" | "assets";
interface DocumentsFormsHubProps { initialTabOverride?: Bucket; }

const FEATURED_STUDIO_TEMPLATE_IDS = [
  // HR — offer letter FIRST (highest-use), then contract, then disciplinary.
  "job_offer",
  "employment_contract",
  "warning_letter",
  "termination_letter",
  "hr_letter",
  // RERA & brokerage
  "form_a",
  "form_b",
  "form_f",
  "form_i",
  "broker_referral",
  // Client & company
  "noc",
  "property_reservation",
  "mou",
  "ejari_tenancy",
  "custom_client",
  "jbj_branded_proposal_letterhead",
  // After-sale
  "facility_management_agreement",
  "maintenance_request",
  "interior_design_quotation",
  "service_bill",
  "client_quotation",
  // Developer & finance
  "developer_commission_invoice",
  "developer_payment_request",
  "developer_closing_notice",
  "commission_invoice",
  "ai_home_finder_report",
];

const TEMPLATE_CATEGORIES: Array<{ key: TemplateCategoryKey; label: string; description: string; icon: typeof FileText; ids?: string[] }> = [
  { key: "all", label: "All Forms", description: "Full JBJ library", icon: FileText },
  { key: "employees", label: "Employees", description: "Offer, contract, warning, termination, HR letters", icon: Briefcase, ids: ["job_offer", "employment_contract", "warning_letter", "termination_letter", "nda", "commission_agreement", "internship_agreement", "hr_letter", "partnership_referral", "custom_staff"] },
  { key: "client", label: "Client", description: "Client letters, proposals, NOC, reservations", icon: Crown, ids: ["ai_home_finder_report", "jbj_branded_proposal_letterhead", "custom_client", "mou", "property_reservation", "noc", "tenancy_addendum"] },
  { key: "forms", label: "Forms & Agreements", description: "RERA Forms A/B/F/I/U, A-to-A and agreements", icon: Stamp, ids: ["form_a", "form_b", "form_f", "form_i", "form_u", "broker_referral", "paa", "mou", "ejari_tenancy"] },
  { key: "leasing", label: "Leasing", description: "PAA, tenancy, holiday home and addenda", icon: FileSignature, ids: ["paa", "ejari_tenancy", "tenancy_addendum", "holiday_home_agreement"] },
  { key: "selling", label: "Selling", description: "Listing, buyer, MOU, cancellation and reservation", icon: Scale, ids: ["form_a", "form_b", "form_f", "form_i", "form_u", "broker_referral", "mou", "property_reservation"] },
  { key: "after_sale", label: "After-Sale", description: "Maintenance, interior, bills and quotations", icon: ReceiptText, ids: ["facility_management_agreement", "maintenance_request", "interior_design_quotation", "service_bill", "client_quotation"] },
  { key: "developer", label: "Developer", description: "Developer invoices, commission claims and closing notices", icon: Building2, ids: ["developer_commission_invoice", "developer_payment_request", "developer_closing_notice"] },
  { key: "finance", label: "Finance", description: "Broker & developer invoices, bills, quotations, commission claims", icon: Banknote, ids: ["commission_invoice", "developer_commission_invoice", "developer_payment_request", "developer_closing_notice", "service_bill", "client_quotation", "interior_design_quotation"] },
];

const templateFamilyLabel = (template: DocumentTemplate) => {
  if (["form_a", "form_b", "form_f", "form_i", "form_u"].includes(template.id)) return "RERA";
  if (["job_offer", "employment_contract", "warning_letter", "termination_letter", "hr_letter"].includes(template.id)) return "HR";
  if (["broker_referral", "partner_referral", "partner_marketing", "partner_investor", "partner_strategic", "partner_custom"].includes(template.id)) return "Brokerage";
  if (["ai_home_finder_report", "jbj_branded_proposal_letterhead", "custom_client"].includes(template.id)) return "Company";
  return template.audience === "client" ? "Real Estate" : "Legal";
};

/** Single query for the entire hub — much faster than four parallel queries. */
function useAllEnvelopes() {
  return useQuery({
    queryKey: ["esign_envelopes_hub_all"],
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("esign_envelopes")
        .select("id,name,status,category,created_at,deleted_at,signed_document_url,document_url,document_filename,template_key,template_field_values,metadata,esign_recipients(name,email,phone,metadata,status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function clientNameOf(e: any): string {
  const v = (e?.template_field_values as any) || {};
  if (v.landlord_name) return String(v.landlord_name);
  const recs: any[] = e?.esign_recipients || [];
  const client = recs.find((r) => r?.metadata?.role === "client") || recs[0];
  return client?.name || "Unnamed client";
}
function clientInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "—";
}
function clientContactOf(e: any): { phone: string; email: string } {
  const v = (e?.template_field_values as any) || {};
  const recs: any[] = e?.esign_recipients || [];
  const client = recs.find((r) => r?.metadata?.role === "client") || recs[0] || {};
  return {
    phone: v.mobile_number || client?.phone || "",
    email: v.email_address || client?.email || "",
  };
}
function propertyOf(e: any): string {
  const v = (e?.template_field_values as any) || {};
  const parts = [v.property_type, v.building_name || v.community || v.street_name, v.unit_number ? `Unit ${v.unit_number}` : ""].filter(Boolean);
  return parts.join(" · ");
}
function sizeOf(e: any): string {
  const v = (e?.template_field_values as any) || {};
  const beds = v.bedrooms ? (/^stu/i.test(String(v.bedrooms)) || String(v.bedrooms) === "0" ? "Studio" : `${v.bedrooms} bed`) : "";
  const bua = v.bua_sqft ? `${v.bua_sqft} sqft` : "";
  return [beds, bua].filter(Boolean).join(" · ");
}
function docNumberOf(e: any): string {
  return (e?.metadata as any)?.doc_number || (e?.template_field_values as any)?.doc_number || "";
}
function kindLabelOf(e: any): string {
  if (["jbj-property-advertising-agreement", "jbj-paa-leasing", "jbj-letterhead-leasing"].includes(e?.template_key)) return "Leasing";
  if (e?.template_key === "jbj-listing-authorisation-selling") return "Selling";
  return e?.category ? String(e.category) : "";
}

/**
 * Classification rule:
 *  - status=draft AND template has at least a client name = "Forms Generated"
 *  - status=draft with no client name (truly empty) = "Draft Applications"
 *  - status=sent / partially_signed / viewed = "Pending Signature"
 *  - status=completed = "Signed"
 */
function isCompleteEnoughToBeGenerated(e: any): boolean {
  const v = (e?.template_field_values as any) || {};
  const recs: any[] = e?.esign_recipients || [];
  const client = recs.find((r) => r?.metadata?.role === "client") || recs[0];
  const hasClientName = !!(v.landlord_name || client?.name);
  const hasContact = !!(v.mobile_number || v.email_address || client?.email || client?.phone);
  return hasClientName && hasContact;
}

const VALID_TABS: Bucket[] = ["templates","documents","esign","drafts","generated","sent","submitted","signed","vault","candidates","folders","deleted","assets"];
// `folders` is the canonical key; `candidates` is kept as a legacy alias.
const normalizeTabKey = (t: string | null | undefined): Bucket => {
  if (!t) return "templates";
  if (t === "candidates") return "folders";
  return (VALID_TABS as string[]).includes(t) ? (t as Bucket) : "templates";
};

// Lazy-loaded so the Vault payload (developer combobox + signed-document query) only
// loads when the owner opens the tab.
const ContractVaultEmbedded = lazy(() => import("@/pages/owner/contracts/ContractVault"));

export default function DocumentsFormsHub({ initialTabOverride }: DocumentsFormsHubProps = {}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (() => {
    if (initialTabOverride && VALID_TABS.includes(initialTabOverride)) return normalizeTabKey(initialTabOverride);
    return normalizeTabKey(searchParams.get("tab"));
  })();
  const [tab, setTab] = useState<Bucket>(initialTab);
  const [cat, setCat] = useState<Cat>("all");
  // Keep ?tab= in sync with the active tab so legacy /e-signature?tab=... links land correctly.
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== tab) {
      const next = new URLSearchParams(searchParams);
      if (tab === "templates") next.delete("tab"); else next.set("tab", tab);
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  // URL → tab sync so client-side navigation (e.g. the Folders shortcut in
  // Document Studio) switches the active tab without a page reload.
  useEffect(() => {
    const next = normalizeTabKey(searchParams.get("tab"));
    if (next !== tab) setTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const { data: templates = [], isLoading: tplLoading } = useEsignTemplates(cat);
  const studioTemplates = useMemo(() => {
    const all = getCatalogByAudience("all");
    const featured = FEATURED_STUDIO_TEMPLATE_IDS
      .map((id) => all.find((template) => template.id === id))
      .filter(Boolean) as DocumentTemplate[];
    const rest = all.filter((template) => !FEATURED_STUDIO_TEMPLATE_IDS.includes(template.id));
    return [...featured, ...rest];
  }, []);
  const { data: allEnvelopes = [], isLoading: envLoading, refetch } = useAllEnvelopes();
  const { data: signatures = [] } = useOwnerSignatureAssets("signature");
  const { data: stamps = [] } = useOwnerSignatureAssets("stamp");
  const createFromTpl = useCreateEnvelopeFromTemplate();

  const [picker, setPicker] = useState<EsignTemplate | null>(null);
  const [client, setClient] = useState({ name: "", email: "", phone: "" });
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});
  const [showDetails, setShowDetails] = useState(false);
  const [includeJbjBlock, setIncludeJbjBlock] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templateSearch, setTemplateSearch] = useState("");
  const [activeTemplateCategory, setActiveTemplateCategory] = useState<TemplateCategoryKey>("all");
  const [selectedStudioTemplate, setSelectedStudioTemplate] = useState<DocumentTemplate | null>(null);
  const [studioOpen, setStudioOpen] = useState(false);
  const [manageKind, setManageKind] = useState<"signature" | "stamp" | null>(null);
  const sigFileRef = useRef<HTMLInputElement>(null);
  const stampFileRef = useRef<HTMLInputElement>(null);

  // Warm the editor chunk while the hub is visible. Clicking Offer Letter (or
  // any template) should open the editor immediately, not flash the full app
  // loader and feel like the backend kicked the user back to the hub.
  useEffect(() => {
    if (typeof globalThis === "undefined") return;
    const preload = () => { void loadDocumentStudio(); };
    const host = globalThis as any;
    const idle = typeof host.requestIdleCallback === "function"
      ? host.requestIdleCallback(preload, { timeout: 1200 })
      : host.setTimeout(preload, 350);
    return () => {
      if (typeof idle === "number") host.clearTimeout(idle);
      else if (typeof host.cancelIdleCallback === "function") host.cancelIdleCallback(idle);
    };
  }, []);

  // Hide DB blank-letter rows from the templates grid — the studio is opened by routing.
  const isBlankLetterKey = (k: string) => k === "jbj-blank-letter" || k === "jbj-letterhead-blank";
  const blankLetterTemplate = templates.find(t => isBlankLetterKey(t.key)) || null;
  const standardLetterheadName = blankLetterTemplate?.name || "Standard JBJ Letterhead";

  const categoryFilteredStudioTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    const category = TEMPLATE_CATEGORIES.find((item) => item.key === activeTemplateCategory);
    const filtered = studioTemplates.filter((template) => {
      const inCategory = !category?.ids || category.ids.includes(template.id);
      const matchesSearch = !q || [template.label, template.description, templateFamilyLabel(template), template.audience]
        .join(" ")
        .toLowerCase()
        .includes(q);
      return inCategory && matchesSearch;
    });
    // Preserve the curated order declared in TEMPLATE_CATEGORIES.ids
    // (e.g. HR/Employees → job_offer FIRST, then warning_letter, etc.)
    if (category?.ids?.length) {
      const order = new Map(category.ids.map((id, idx) => [id, idx]));
      filtered.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
    }
    return filtered;
  }, [activeTemplateCategory, studioTemplates, templateSearch]);

  const categorizedEsignTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    const matches = (t: EsignTemplate) => !q || [t.name, t.category, t.key].join(" ").toLowerCase().includes(q);
    if (activeTemplateCategory === "leasing") return templates.filter((t) => !isBlankLetterKey(t.key) && t.category === "leasing" && matches(t));
    if (activeTemplateCategory === "selling") return templates.filter((t) => !isBlankLetterKey(t.key) && t.category === "selling" && matches(t));
    if (activeTemplateCategory === "all" || activeTemplateCategory === "forms") return templates.filter((t) => !isBlankLetterKey(t.key) && matches(t));
    return [];
  }, [activeTemplateCategory, templateSearch, templates]);

  // Bucket envelopes.
  // RULE: an envelope that has a client filled in is ALWAYS a "Forms Generated"
  // entry, regardless of whether it is later sent / signed. Pending and Signed
  // tabs additionally surface the same envelope based on lifecycle status.
  const buckets = useMemo(() => {
    const drafts: any[] = [];
    const generated: any[] = [];
    const sent: any[] = [];
    const submitted: any[] = [];
    const signed: any[] = [];
    const deleted: any[] = [];
    for (const e of allEnvelopes) {
      if ((e as any).deleted_at) { deleted.push(e); continue; }
      const s = (e as any).status;
      const generatedReady = isCompleteEnoughToBeGenerated(e);
      const recs: any[] = (e as any).esign_recipients || [];
      const anyAwaitingReturn = recs.some((r) => r?.status === "awaiting_signed_return");
      const anyPendingSignature = recs.some((r) => ["sent", "delivered", "viewed"].includes(r?.status));

      if (s === "completed") signed.push(e);
      else if (s === "awaiting_signed_return" || s === "pending_owner_review" || anyAwaitingReturn) submitted.push(e);
      else if (s === "sent" || s === "viewed" || s === "partially_signed" || anyPendingSignature) sent.push(e);
      else if (s === "draft" && !generatedReady) drafts.push(e);

      if (generatedReady) generated.push(e);
    }
    return { drafts, generated, sent, submitted, signed, deleted };
  }, [allEnvelopes]);

  const handleUseTemplate = async () => {
    if (!picker) return;
    if (!client.name.trim()) {
      toast.error("Enter at least a client name");
      return;
    }
    // Email is optional now — required only at send-time
    try {
      const hiddenFields = includeJbjBlock ? [] : ["jbj_signature_name", "jbj_signature_date"];
      const env = await createFromTpl.mutateAsync({ template: picker, client, values: extraValues, hiddenFields });
      toast.success("Draft created — review fields and send");
      qc.invalidateQueries({ queryKey: ["esign_envelopes_hub_all"] });
      navigate(`/owner/documents/forms/${env.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create envelope");
    }
  };

  // Hide blank-letter rows from the grid (the Standard Letterhead opens its own studio).
  const filteredTemplates = templates.filter(t => !isBlankLetterKey(t.key) && (cat === "all" ? true : t.category === cat));

  // ── Asset management helpers (Manage dropdown / sheet) ─────────────
  const handleAssetUpload = async (kind: "signature" | "stamp", e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error("Not signed in");
        const blob = await (await fetch(String(reader.result))).blob();
        const path = `${userId}/${kind}-${Date.now()}.png`;
        const { error: upErr } = await supabase.storage
          .from("owner-signature-assets")
          .upload(path, blob, { contentType: "image/png", upsert: true });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage
          .from("owner-signature-assets")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        const existing = kind === "signature" ? signatures : stamps;
        const { error: insErr } = await supabase.from("owner_signature_assets" as any).insert({
          user_id: userId, kind, label: file.name, image_url: signed?.signedUrl,
          storage_path: path, is_default: existing.length === 0,
        });
        if (insErr) throw insErr;
        toast.success(`${kind === "signature" ? "Signature" : "Stamp"} uploaded`);
        qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
      } catch (err: any) { toast.error(err.message || "Upload failed"); }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = "";
  };
  const setAssetDefault = async (kind: "signature" | "stamp", id: string) => {
    await supabase.from("owner_signature_assets" as any).update({ is_default: false }).eq("kind", kind);
    await supabase.from("owner_signature_assets" as any).update({ is_default: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
    toast.success("Default updated");
  };
  const renameAsset = async (id: string) => {
    const next = window.prompt("New label");
    if (!next) return;
    await supabase.from("owner_signature_assets" as any).update({ label: next }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
  };
  const deleteAsset = async (id: string) => {
    if (!confirm("Delete this asset?")) return;
    await supabase.from("owner_signature_assets" as any).delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
    toast.success("Deleted");
  };

  // Open the right surface for a chosen template (studio for blank, dialog for the rest).
  const openTemplate = (t: EsignTemplate) => {
    if (isBlankLetterKey(t.key)) {
      navigate("/owner/documents/forms/blank-letter");
      return;
    }
    setPicker(t);
    setClient({ name: "", email: "", phone: "" });
  };

  const openStudioTemplate = (template: DocumentTemplate) => {
    // Close the template picker first, then mount the already-preloaded studio
    // on the next frame. This avoids Radix Dialog focus teardown racing the
    // full-screen portal and causing the brief loader/back-to-hub flash.
    setSelectedStudioTemplate(template);
    requestAnimationFrame(() => setStudioOpen(true));
  };

  const showCategory = (key: TemplateCategoryKey) => {
    setActiveTemplateCategory(key);
    setCat(key === "leasing" || key === "selling" ? key : "all");
    setTab("templates");
    requestAnimationFrame(() => document.getElementById("jj-template-library")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  // Bulk actions on the visible bucket
  const visibleIds = (() => {
    if (tab === "drafts") return buckets.drafts.map((e: any) => e.id);
    if (tab === "generated") return buckets.generated.map((e: any) => e.id);
    if (tab === "sent") return buckets.sent.map((e: any) => e.id);
    if (tab === "signed") return buckets.signed.map((e: any) => e.id);
    if (tab === "deleted") return buckets.deleted.map((e: any) => e.id);
    return [];
  })();

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selected.size === visibleIds.length) setSelected(new Set());
    else setSelected(new Set(visibleIds));
  };

  const bulkSoftDelete = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("esign_envelopes")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} moved to Recently Deleted`);
    setSelected(new Set());
    refetch();
  };
  const bulkRestore = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("esign_envelopes")
      .update({ deleted_at: null })
      .in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`${ids.length} restored`);
    setSelected(new Set());
    refetch();
  };

  // Phase G: bulk Resend reminder on pending envelopes — sequential to respect
  // the global Resend quota (2 req/s) and surface partial-failure detail.
  const [bulkBusy, setBulkBusy] = useState(false);
  const bulkResendReminder = async () => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    setBulkBusy(true);
    let ok = 0; let fail = 0;
    for (const envelope_id of ids) {
      try {
        const { error } = await supabase.functions.invoke("esign-send-reminder", { body: { envelope_id } });
        if (error) fail++; else ok++;
      } catch { fail++; }
      // light pacing
      await new Promise((r) => setTimeout(r, 550));
    }
    setBulkBusy(false);
    setSelected(new Set());
    refetch();
    if (fail === 0) toast.success(`Reminder sent to ${ok} ${ok === 1 ? "signer" : "signers"}`);
    else toast.warning(`${ok} sent · ${fail} failed`);
  };

  // Phase G: bulk Export PDFs — opens each signed document in a new tab via the
  // branded /d proxy so jbj.ae is the visible host.
  const bulkExportPdfs = () => {
    if (!selected.size) return;
    const rows = buckets.signed.filter((e: any) => selected.has(e.id) && e.signed_document_url);
    if (!rows.length) { toast.info("None of the selected items have a signed PDF yet."); return; }
    rows.forEach((e: any, i: number) => {
      const href = brandedDownloadHref(e.signed_document_url, e.document_filename || `${e.name || "document"}.pdf`);
      // Stagger window.open calls so popup blockers don't suppress later ones.
      setTimeout(() => window.open(href, "_blank", "noopener,noreferrer"), i * 120);
    });
    toast.success(`Opening ${rows.length} signed PDF${rows.length === 1 ? "" : "s"}…`);
  };


  const renderBucketCards = (rows: any[], emptyText: string, mode: "drafts" | "generated" | "sent" | "submitted" | "signed" | "deleted") => {
    if (envLoading) return <div className="text-sm text-[#1A1A1A]/60 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>;
    if (!rows.length) return <div className="text-sm text-[#1A1A1A]/60">{emptyText}</div>;
    return (
      <>
        {(mode === "drafts" || mode === "generated" || mode === "deleted" || mode === "sent" || mode === "signed") && rows.length > 0 && (
          <div className="flex items-center gap-3 mb-3 p-2 rounded-md bg-white/60 border border-[#B89555]/20">
            <Checkbox
              checked={selected.size > 0 && selected.size === visibleIds.length}
              onCheckedChange={toggleSelectAll}
              aria-label="Select all"
            />
            <span className="text-xs text-[#1A1A1A]/70">
              {selected.size ? `${selected.size} selected` : `Select all (${rows.length})`}
            </span>
            <div className="ml-auto flex gap-2 flex-wrap">
              {mode === "sent" && (
                <Button size="sm" variant="gold" disabled={!selected.size || bulkBusy} onClick={bulkResendReminder}>
                  {bulkBusy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                  Resend reminder
                </Button>
              )}
              {mode === "signed" && (
                <Button size="sm" variant="gold" disabled={!selected.size} onClick={bulkExportPdfs}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export PDFs
                </Button>
              )}
              {mode === "deleted" ? (
                <Button size="sm" variant="outline" disabled={!selected.size} onClick={bulkRestore}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={!selected.size} onClick={bulkSoftDelete}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Move to Recently Deleted
                </Button>
              )}
            </div>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((e: any) => {
            const cName = clientNameOf(e);
            const initials = clientInitials(cName);
            const property = propertyOf(e);
            const size = sizeOf(e);
            const dn = docNumberOf(e);
            const kind = kindLabelOf(e);
            const { phone, email } = clientContactOf(e);
            const selectable = mode === "drafts" || mode === "generated" || mode === "deleted" || mode === "sent" || mode === "signed";
            // Phase G: follow-up intelligence — flag pending envelopes that have
            // been waiting on the signer for 3+ days so the owner can act.
            const ageDays = Math.floor((Date.now() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24));
            const needsFollowUp = mode === "sent" && ageDays >= 3;
            const sLabel =
              mode === "signed" ? "Signed"
              : mode === "submitted" ? "Submitted — Pending Review"
              : mode === "sent" ? "Pending Signature"
              : mode === "deleted" ? "Recently Deleted"
              : mode === "generated" ? "Forms Generated"
              : "Draft Application";
            const sCls =
              mode === "signed" ? "jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30"
              : mode === "submitted" ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
              : mode === "sent" ? "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/60"
              : mode === "deleted" ? "bg-red-50 text-red-800 border-red-200"
              : mode === "generated" ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60"
              : "bg-[#F7F2EA] text-[#1A1A1A]/80 border-[#B89555]/30";
            return (
              <Card key={e.id} className="p-4 bg-[#F7F2EA] border-[#B89555]/30">
                <div className="flex items-start gap-3">
                  {selectable && (
                    <Checkbox
                      className="mt-1"
                      checked={selected.has(e.id)}
                      onCheckedChange={() => toggleSelect(e.id)}
                      aria-label={`Select ${cName}`}
                    />
                  )}
                  <div className="shrink-0 w-10 h-10 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center text-sm font-semibold text-[#1A1A1A]">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {dn && <span className="text-[10px] tracking-[0.16em] uppercase text-[#1A1A1A]/80 border border-[#B89555]/40 rounded px-2 py-0.5 bg-white/70">{dn}</span>}
                      {kind && <span className="text-[10px] tracking-[0.14em] uppercase text-[#1A1A1A] border border-[#B89555]/40 rounded px-2 py-0.5 bg-[#EFE6D6]">{kind}</span>}
                      <span className={`text-[10px] tracking-[0.14em] uppercase rounded px-2 py-0.5 border ${sCls}`}>{sLabel}</span>
                      {needsFollowUp && (
                        <span className="text-[10px] tracking-[0.14em] uppercase rounded px-2 py-0.5 border bg-amber-50 text-amber-800 border-amber-200">
                          Follow up · {ageDays}d
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-[#1A1A1A] truncate">{cName}</div>
                    {property && <div className="text-xs text-[#1A1A1A]/80 truncate">{property}</div>}
                    {size && <div className="text-[11px] text-[#1A1A1A]/70 truncate">{size}</div>}
                    {(phone || email) && (
                      <div className="text-[11px] text-[#1A1A1A]/70 mt-1 truncate">
                        {[phone, email].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    <div className="text-[11px] text-[#1A1A1A]/55 mt-0.5">{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col gap-2 items-end shrink-0">
                    <Button size="sm" variant="gold" onClick={() => navigate(`/owner/documents/forms/${e.id}`)}>Open</Button>
                    {e.signed_document_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={brandedDownloadHref(e.signed_document_url, e.document_filename || `${e.name || "document"}.pdf`)} target="_blank" rel="noreferrer">
                          <Download className="w-3 h-3 mr-1" /> Download document
                        </a>
                      </Button>
                    )}
                    {mode === "submitted" && (
                      <>
                        <Button
                          size="sm"
                          variant="gold"
                          onClick={async () => {
                            const { error } = await supabase
                              .from("esign_envelopes")
                              .update({
                                status: "completed",
                                completed_at: new Date().toISOString(),
                                metadata: { ...(e.metadata || {}), owner_review: { decision: "approved", at: new Date().toISOString() } },
                              })
                              .eq("id", e.id);
                            if (error) { toast.error(error.message); return; }
                            // Fire-and-forget thank-you
                            try {
                              await supabase.functions.invoke("esign-send-signer-thanks", {
                                body: { envelope_id: e.id, variant: "approved" },
                              });
                            } catch { /* best-effort */ }
                            toast.success("Approved — client notified");
                            refetch();
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const reason = window.prompt("Reason for rejecting this signed document? (will be emailed to the client)");
                            if (!reason || !reason.trim()) return;
                            const { error } = await supabase
                              .from("esign_envelopes")
                              .update({
                                status: "declined",
                                metadata: { ...(e.metadata || {}), owner_review: { decision: "rejected", reason: reason.trim(), at: new Date().toISOString() } },
                              })
                              .eq("id", e.id);
                            if (error) { toast.error(error.message); return; }
                            try {
                              await supabase.functions.invoke("esign-send-signer-thanks", {
                                body: { envelope_id: e.id, variant: "rejected", rejection_reason: reason.trim() },
                              });
                            } catch { /* best-effort */ }
                            toast.success("Marked as rejected — client notified");
                            refetch();
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {mode === "signed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!confirm("Mark this envelope as NOT signed and return it to drafts?\n\nUse this only for test signatures. The signed copy reference will be cleared.")) return;
                          const { error } = await supabase
                            .from("esign_envelopes")
                            .update({ status: "draft", signed_document_url: null })
                            .eq("id", e.id);
                          if (error) { toast.error(error.message); return; }
                          toast.success("Reverted to draft");
                          refetch();
                        }}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" /> Mark not signed
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div
      data-studio-surface="champagne"
      data-studio-workspace
      className="min-h-screen bg-[#FDFBF7] px-4 py-5 sm:px-6 lg:p-10 overflow-x-hidden"
    >
      <div className="max-w-[1440px] mx-auto min-w-0">

        <header className="mb-6 rounded-xl border border-[#B89555]/25 bg-[#F7F2EA] px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between min-w-0 overflow-hidden">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Owner</div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">Documents & Forms</h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">Unified hub — templates, document editor, e-signature, agreements, signatures & stamps. All in one place.</p>
          </div>
          <Button variant="primary" onClick={() => showCategory("all")} className="h-11 px-5 w-full sm:w-auto self-stretch sm:self-start lg:self-auto shrink-0">
            <Sparkles className="w-4 h-4 mr-2" /> Generate Document
          </Button>
        </header>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as Bucket); setSelected(new Set()); }}>
          <TabsList className="w-full justify-start bg-[#F7F2EA] border border-[#B89555]/30 flex-wrap h-auto gap-1 p-1 overflow-x-auto">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="documents">Live Editor</TabsTrigger>
            <TabsTrigger value="esign">E-signature</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({buckets.drafts.length})</TabsTrigger>
            <TabsTrigger value="generated">Generated ({buckets.generated.length})</TabsTrigger>
            <TabsTrigger value="sent">Pending ({buckets.sent.length})</TabsTrigger>
            <TabsTrigger value="folders">📁 Folders</TabsTrigger>
            <TabsTrigger value="submitted">Review ({buckets.submitted.length})</TabsTrigger>
            <TabsTrigger value="signed">Signed ({buckets.signed.length})</TabsTrigger>
            <TabsTrigger value="vault">Contract Vault</TabsTrigger>
            <TabsTrigger value="deleted">Deleted ({buckets.deleted.length})</TabsTrigger>
            <TabsTrigger value="assets">Stamps & Signatures</TabsTrigger>
          </TabsList>

          {/* TEMPLATES */}
          <TabsContent value="templates" className="mt-4">
            <div id="jj-template-library" className="mb-5 grid gap-3 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-4 scroll-mt-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/60">Document Studio</div>
                  <h2 className="text-lg font-semibold text-[#1A1A1A]">Generate document library</h2>
                </div>
                <div className="text-xs font-semibold text-[#1A1A1A]/70">{categoryFilteredStudioTemplates.length + categorizedEsignTemplates.length} visible · {studioTemplates.length + filteredTemplates.length} total</div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/55" />
                <Input
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Search any template, form, employee letter, developer invoice…"
                  className="pl-9 bg-[#FDFBF7]"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {TEMPLATE_CATEGORIES.map((item) => {
                  const Icon = item.icon;
                  const active = activeTemplateCategory === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => showCategory(item.key)}
                      data-surface={active ? "emerald" : "champagne"}
                      className={["text-left rounded-lg border px-3 py-3 transition min-w-0", active ? "border-transparent bg-[var(--jj-emerald-ombre)] shadow-lg" : "border-[#B89555]/35 bg-[#FDFBF7] hover:bg-[#EFE6D6]"].join(" ")}
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <Icon className={active ? "w-4 h-4 shrink-0 text-[#FFFFFF]" : "w-4 h-4 shrink-0 text-[#1A1A1A]"} />
                        <div className="min-w-0">
                          <div className={active ? "text-sm font-semibold text-[#FFFFFF]" : "text-sm font-semibold text-[#1A1A1A]"}>{item.label}</div>
                          <div className={active ? "text-[11px] text-[#FFFFFF]/85 leading-tight mt-0.5" : "text-[11px] text-[#1A1A1A]/65 leading-tight mt-0.5"}>{item.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3" data-studio-card-grid>
                {categoryFilteredStudioTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card key={template.id} data-studio-card className="p-4 bg-[#FDFBF7] border-[#B89555]/35 flex flex-col gap-3 min-h-[178px] overflow-hidden">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="shrink-0 w-10 h-10 rounded-lg border border-[#B89555]/40 bg-[#EFE6D6] flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 border border-[#B89555]/35 rounded px-1.5 py-0.5">{templateFamilyLabel(template)}</span>
                            <span className="text-[9px] uppercase tracking-[0.16em] text-[#1A1A1A]/65 border border-[#B89555]/35 rounded px-1.5 py-0.5">{template.audience}</span>
                          </div>
                          <div className="font-semibold text-[#1A1A1A] mt-1 leading-tight break-words">{template.label}</div>
                        </div>
                      </div>
                      <p className="text-xs text-[#1A1A1A]/70 leading-relaxed line-clamp-3 flex-1">{template.description}</p>
                      <Button size="sm" variant="primary" className="w-full min-w-0" onClick={() => openStudioTemplate(template)}>Open in Editor</Button>
                    </Card>
                  );
                })}

                {/* Standard JBJ Letterhead — always first, opens the branded letter studio */}
                {(activeTemplateCategory === "all" || activeTemplateCategory === "client") && (
                  <Card data-studio-card className="p-5 bg-[#F7F2EA] border-[#B89555]/30 overflow-hidden">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">JBJ Standard</div>
                        <div className="font-semibold text-[#1A1A1A] mt-1">{standardLetterheadName}</div>
                      </div>
                      <span className="text-[9px] px-2 py-0.5 border border-[#B89555]/40 rounded text-[#1A1A1A]/70">SYSTEM</span>
                    </div>
                    <p className="text-xs text-[#1A1A1A]/70 mt-2">
                      Branded A4 letter — type, drag your signature & stamp, download PDF.
                    </p>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="primary" onClick={() => navigate("/owner/documents/forms/blank-letter")}>
                        Use template
                      </Button>
                    </div>
                  </Card>
                )}

                {tplLoading ? <div className="text-sm text-[#1A1A1A]/70 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading signature templates…</div> : categorizedEsignTemplates.map(t => (
                    <Card key={t.id} data-studio-card className="p-5 bg-[#F7F2EA] border-[#B89555]/30 overflow-hidden flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">{t.category}</div>
                          <div className="font-semibold text-[#1A1A1A] mt-1">{t.name}</div>
                        </div>
                        {t.is_system && <span className="text-[9px] px-2 py-0.5 border border-[#B89555]/40 rounded text-[#1A1A1A]/70">SYSTEM</span>}
                      </div>
                      <p className="text-xs text-[#1A1A1A]/70 flex-1">
                        {(t as any).description || "Pre-built JBJ signature template — opens with client details and brand."}
                      </p>
                      <Button size="sm" variant="primary" onClick={() => openTemplate(t)}>Use template</Button>
                    </Card>
                  ))}
                {categoryFilteredStudioTemplates.length === 0 && categorizedEsignTemplates.length === 0 && !tplLoading && (
                  <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-5 text-sm text-[#1A1A1A]/70">No templates match this category/search.</div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* DOCUMENT EDITOR */}
          <TabsContent value="documents" className="mt-4">
            <Card className="p-6 bg-[#F7F2EA] border-[#B89555]/30">
              <div className="flex flex-col sm:flex-row items-start gap-4 min-w-0">
                <div className="shrink-0 w-12 h-12 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
                  <FileEdit className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1A1A1A]">Premium Document Editor</div>
                  <p className="text-sm text-[#1A1A1A]/70 mt-1">
                    Full-page rich editor with templates (Offer Letter, MOU, NOC, Tenancy, Invoice, Handover…),
                    OCR scanner, find & replace, AI prompt edit, QR codes, gradients, stamp/signature insertion.
                  </p>
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <Button variant="gold" onClick={() => navigate("/owner/documents/editor")}>Open Document Editor</Button>
                    <Button variant="outline" onClick={() => setTab("templates")}>Browse Standard Templates</Button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* E-SIGNATURE — three uniform cards */}
          <TabsContent value="esign" className="mt-4">
            <div className="grid md:grid-cols-3 gap-4 items-stretch">
              {[
                { icon: Upload, title: "Upload & Send for Signature", desc: "Upload PDF/Word/photos — auto-converted to a signable envelope.", cta: "Create Envelope", onClick: () => navigate("/owner/documents/forms/create") },
                { icon: PenTool, title: "Signature Studio", desc: "Draw, upload or generate your owner signature, initials and stamp.", cta: "Open Studio", onClick: () => navigate("/owner/documents/forms/signature-studio") },
                { icon: Scale, title: "AI Contract Review", desc: "Lawyer-grade clause-by-clause analysis of any contract.", cta: "Open Review", onClick: () => navigate("/owner/documents/forms/contract-review") },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <Card key={c.title} className="p-5 bg-[#F7F2EA] border-[#B89555]/30 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#1A1A1A]" />
                      </div>
                      <div className="font-semibold text-[#1A1A1A] text-sm leading-tight">{c.title}</div>
                    </div>
                    <p className="text-xs text-[#1A1A1A]/70 flex-1">{c.desc}</p>
                    <Button size="sm" variant="gold" className="mt-4 self-start" onClick={c.onClick}>{c.cta}</Button>
                  </Card>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => setTab("sent")}>Pending Signature ({buckets.sent.length})</Button>
              <Button variant="outline" onClick={() => setTab("submitted")}>Submitted — Review ({buckets.submitted.length})</Button>
              <Button variant="outline" onClick={() => setTab("signed")}>Signed ({buckets.signed.length})</Button>
              <Button variant="outline" onClick={() => setTab("assets")}>Stamps & Signatures</Button>
            </div>
          </TabsContent>

          <TabsContent value="drafts" className="mt-4">
            {renderBucketCards(buckets.drafts, "No draft applications. Empty templates with no client info land here.", "drafts")}
          </TabsContent>
          <TabsContent value="generated" className="mt-4">
            {renderBucketCards(buckets.generated, "No completed forms yet. Once a draft has client name + contact, it lands here.", "generated")}
          </TabsContent>
          <TabsContent value="sent" className="mt-4">
            {renderBucketCards(buckets.sent, "Nothing awaiting signature.", "sent")}
          </TabsContent>
          <TabsContent value="submitted" className="mt-4">
            {renderBucketCards(buckets.submitted, "Nothing pending your review. When a client emails the signed copy back, it lands here.", "submitted")}
          </TabsContent>
          <TabsContent value="signed" className="mt-4">
            {renderBucketCards(buckets.signed, "No signed contracts yet.", "signed")}
          </TabsContent>
          <TabsContent value="candidates" className="mt-4">
            <CandidateFoldersPanel onOpenDoc={(id) => navigate(`/owner/documents/forms?openDoc=${id}`)} />
          </TabsContent>
          <TabsContent value="vault" className="mt-4">
            <Suspense fallback={<div className="flex items-center gap-2 text-sm text-[#1A1A1A]/70"><Loader2 className="w-4 h-4 animate-spin" /> Loading Contract Vault…</div>}>
              <ContractVaultEmbedded />
            </Suspense>
          </TabsContent>
          <TabsContent value="deleted" className="mt-4">
            <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              Items here are permanently removed after 30 days. You can restore them anytime.
            </div>
            {renderBucketCards(buckets.deleted, "Nothing in Recently Deleted.", "deleted")}
          </TabsContent>

          {/* ASSETS */}
          <TabsContent value="assets" className="mt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {(["signature","stamp"] as const).map((kind) => {
                const list = kind === "signature" ? signatures : stamps;
                const Icon = kind === "signature" ? FileSignature : Stamp;
                const fileRef = kind === "signature" ? sigFileRef : stampFileRef;
                const title = kind === "signature" ? "Saved Signatures" : "Saved Stamps";
                return (
                  <Card key={kind} className="p-5 bg-[#F7F2EA] border-[#B89555]/30 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-[#1A1A1A] flex items-center gap-2"><Icon className="w-4 h-4" /> {title}</div>
                      <div className="flex gap-2">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAssetUpload(kind, e)} />
                        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                          <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setManageKind(kind)}>Manage</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {list.map((s: any) => (
                        <div key={s.id} className="border border-[#B89555]/30 rounded p-2 bg-white relative group">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="absolute top-1 right-1 p-1 rounded hover:bg-[#F7F2EA] opacity-60 group-hover:opacity-100" aria-label="Asset actions">
                                <MoreVertical className="w-3.5 h-3.5 text-[#1A1A1A]" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white">
                              <DropdownMenuItem onClick={() => setAssetDefault(kind, s.id)}><Star className="w-3.5 h-3.5 mr-2" /> Set as default</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => renameAsset(s.id)}><Pencil className="w-3.5 h-3.5 mr-2" /> Rename</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => deleteAsset(s.id)} className="text-red-600 focus:text-red-700"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <img src={s.image_url} alt={s.label || title} className="h-16 w-full object-contain" />
                          {s.is_default && <div className="text-[9px] text-center mt-1 text-[#1A1A1A]/70">DEFAULT</div>}
                          {s.label && <div className="text-[10px] text-center mt-0.5 text-[#1A1A1A]/60 truncate">{s.label}</div>}
                        </div>
                      ))}
                      {!list.length && <div className="text-xs text-[#1A1A1A]/60 col-span-3">No saved {kind}s yet. Click Upload to add one.</div>}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Use template dialog — email is now optional */}
      <Dialog open={!!picker} onOpenChange={(o) => { if (!o) { setPicker(null); setExtraValues({}); setShowDetails(false); setIncludeJbjBlock(false); } }}>
        <DialogContent className="bg-[#FDFBF7] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">{picker?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Client Name <span className="text-red-600">*</span></Label>
              <Input value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} placeholder="Required" />
            </div>
            <div>
              <Label>Client Email <span className="text-[#1A1A1A]/50 text-xs">(optional — required only when sending by email)</span></Label>
              <Input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="Leave empty to share via WhatsApp / link" />
            </div>
            <div>
              <Label>Client Phone (optional)</Label>
              <Input value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} />
            </div>

            {picker?.category === "leasing" && (
              <SmartFillDropzone
                schemaHint="jbj_paa_leasing"
                onExtracted={(fields) => {
                  setClient((prev) => ({
                    name: prev.name || fields.landlord_name || "",
                    email: prev.email || fields.email_address || "",
                    phone: prev.phone || fields.mobile_number || "",
                  }));
                  setExtraValues((prev) => ({ ...prev, ...fields }));
                  setShowDetails(true);
                }}
              />
            )}

            <button
              type="button"
              onClick={() => setShowDetails(s => !s)}
              className="text-xs uppercase tracking-[0.16em] text-[#1A1A1A]/70 underline underline-offset-4"
            >
              {showDetails ? "Hide property & contract details" : "Add property & contract details (optional)"}
            </button>

            {showDetails && (
              <div className="border-t border-[#B89555]/30 pt-3 space-y-4">
                {PAA_FIELD_GROUPS.filter(g => g.title !== "Signatures").map(group => (
                  <div key={group.title}>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 mb-2">{group.title}</div>
                    <div className="grid grid-cols-2 gap-3">
                      {group.fields.map(f => {
                        if (f.key === "landlord_name" || f.key === "email_address" || f.key === "mobile_number") return null;
                        const val = extraValues[f.key] ?? "";
                        const onChange = (v: string) => setExtraValues(prev => ({ ...prev, [f.key]: v }));
                        if (f.type === "select" && f.options) {
                          return (
                            <div key={f.key}>
                              <Label className="text-xs">{f.label}</Label>
                              <select
                                value={val}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-full h-9 px-2 rounded border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]"
                              >
                                <option value="">—</option>
                                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            </div>
                          );
                        }
                        if (f.type === "textarea") {
                          return (
                            <div key={f.key} className="col-span-2">
                              <Label className="text-xs">{f.label}</Label>
                              <textarea
                                value={val}
                                onChange={(e) => onChange(e.target.value)}
                                rows={2}
                                className="w-full px-2 py-1 rounded border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]"
                              />
                            </div>
                          );
                        }
                        return (
                          <div key={f.key}>
                            <Label className="text-xs">{f.label}</Label>
                            <Input
                              type={f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                              value={val}
                              onChange={(e) => onChange(e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-3 rounded-md border border-[#B89555]/30 bg-[#F7F2EA]/60 px-3 py-2.5">
              <Checkbox
                id="include-jbj-block"
                checked={includeJbjBlock}
                onCheckedChange={(v) => setIncludeJbjBlock(v === true)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label htmlFor="include-jbj-block" className="text-sm font-semibold text-[#1A1A1A] cursor-pointer">
                  Add JBJ company signature & stamp
                </Label>
                <p className="text-[11px] text-[#1A1A1A]/70 mt-0.5">
                  Off by default — only the landlord signs. Turn on if your client requires our company signature & stamp on the agreement.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#1A1A1A]/70">
              We'll generate the agreement, place name and date fields for the landlord, and open the envelope so you can review before sending. The client signs directly when they open the link.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPicker(null); setExtraValues({}); setShowDetails(false); setIncludeJbjBlock(false); }}>Cancel</Button>
            <Button variant="gold" onClick={handleUseTemplate} disabled={createFromTpl.isPending}>
              {createFromTpl.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Envelope
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Singleton Document Studio — prevents the slow/reloading page caused by mounting every editor at once. */}
      {selectedStudioTemplate && (
        <Suspense fallback={<div className="fixed inset-0 z-[2147483000] bg-[#FDFBF7] pointer-events-none" aria-label="Opening Document Studio" />}>
          <DocumentStudio
            key={`${selectedStudioTemplate.audience}:${selectedStudioTemplate.id}`}
            catalog={selectedStudioTemplate.audience}
            presetTemplateId={selectedStudioTemplate.id}
            trigger={null}
            open={studioOpen}
            onOpenChange={(open) => {
              setStudioOpen(open);
              if (!open) window.setTimeout(() => setSelectedStudioTemplate(null), 250);
            }}
          />
        </Suspense>
      )}

      {/* Manage Sheet — full asset list with per-row actions */}
      <Sheet open={!!manageKind} onOpenChange={(o) => !o && setManageKind(null)}>
        <SheetContent side="right" className="bg-[#FDFBF7] w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[#1A1A1A]">
              Manage {manageKind === "signature" ? "Signatures" : "Stamps"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            <Button
              variant="gold"
              size="sm"
              onClick={() => (manageKind === "signature" ? sigFileRef : stampFileRef).current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-2" /> Upload new
            </Button>
            <div className="space-y-2 mt-3">
              {(manageKind === "signature" ? signatures : manageKind === "stamp" ? stamps : []).map((s: any) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded border border-[#B89555]/30 bg-white">
                  <img src={s.image_url} alt={s.label || ""} className="h-12 w-20 object-contain bg-[#FDFBF7] rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#1A1A1A] truncate">{s.label || "Untitled"}</div>
                    {s.is_default && <div className="text-[10px] text-[#1A1A1A]/60">DEFAULT</div>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost"><MoreVertical className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem onClick={() => setAssetDefault(manageKind!, s.id)}><Star className="w-3.5 h-3.5 mr-2" /> Set as default</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => renameAsset(s.id)}><Pencil className="w-3.5 h-3.5 mr-2" /> Rename</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteAsset(s.id)} className="text-red-600 focus:text-red-700"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {!((manageKind === "signature" ? signatures : stamps) || []).length && (
                <div className="text-xs text-[#1A1A1A]/60 p-3">No {manageKind}s saved yet.</div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Phase F — Docked AI command panel for bulk document actions */}
      <AICommandPanel
        buckets={buckets as any}
        setTab={(t) => { setTab(t); setSelected(new Set()); }}
        setSelected={setSelected}
        runBulkResendReminder={bulkResendReminder}
        runBulkExportPdfs={bulkExportPdfs}
        brandedHref={brandedDownloadHref}
      />
    </div>
  );
}
