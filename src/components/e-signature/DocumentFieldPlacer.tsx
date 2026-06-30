import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PenTool, Trash2, User, Wand2, Loader2,
  ChevronLeft, ChevronRight, X, FileText, Pencil, Package, Edit3,
} from "lucide-react";
import AdoptAndSignDialog from "./AdoptAndSignDialog";
import DocumentEditor from "./DocumentEditor";
import StampManagerDialog from "./StampManagerDialog";
import { Stamp as StampIcon } from "lucide-react";
import { useOwnerSignatureAssets, useSaveSignatureAsset } from "@/hooks/useOwnerSignatureAssets";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PDFDocument } from "pdf-lib";
import ESignaturePad from "./ESignaturePad";
import PdfPageCanvas from "./PdfPageCanvas";
import FieldContentRenderer from "./FieldContentRenderer";
import { BrandAssetPicker } from "@/components/brand-assets/BrandAssetPicker";
import {
  type SignatureField, type DocumentFieldPlacerProps,
  fieldTypes, recipientColorStyles, getInitials, getRecipientStyle,
  loadPdfJs, renderPageThumbnail,
} from "./documentFieldTypes";
// ── Component ──────────────────────────────────────────────────────────────

export default function DocumentFieldPlacer({
  pdfUrl,
  pdfFile,
  recipients,
  fields,
  onFieldsChange,
  handoffStampSvg,
}: DocumentFieldPlacerProps & { handoffStampSvg?: string | null }) {
  const { user } = useAuth();
  const [selectedRecipient, setSelectedRecipient] = useState<string>(recipients[0]?.id || "");
  const [selectedFieldType, setSelectedFieldType] = useState<SignatureField["type"]>("signature");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState<{ w: number; h: number } | null>(null);

  // Saved stamp SVG from user's stamp generator
  const [savedStampSvg, setSavedStampSvg] = useState<string | null>(null);
  // Saved signature image from AI Signature Designer
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);

  // Draw-in-field dialog
  const [drawingFieldId, setDrawingFieldId] = useState<string | null>(null);

  // Drag offset ref for precision dragging
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const draggingIdRef = useRef<string | null>(null);
  const resizingRef = useRef<{ id: string; corner: "se" | "sw" | "ne" | "nw"; startX: number; startY: number; w: number; h: number; x: number; y: number } | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Thumbnail state
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const pdfJsDocRef = useRef<any>(null);

  // Brand asset picker state
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showStampManager, setShowStampManager] = useState(false);
  const [showAdopt, setShowAdopt] = useState(false);
  const [adoptForFieldId, setAdoptForFieldId] = useState<string | null>(null);
  const [showDocEditor, setShowDocEditor] = useState(false);
  const [workingPdfUrl, setWorkingPdfUrl] = useState<string>(pdfUrl);
  const [workingPdfFile, setWorkingPdfFile] = useState<File | null>(pdfFile || null);

  // Saved assets via owner_signature_assets — auto-apply on click
  const { data: sigAssets } = useOwnerSignatureAssets("signature");
  const { data: initAssets } = useOwnerSignatureAssets("initial");
  const saveAsset = useSaveSignatureAsset();
  const defaultSignatureUrl = sigAssets?.find((a) => a.is_default)?.image_url || sigAssets?.[0]?.image_url || null;
  const defaultInitialsUrl = initAssets?.find((a) => a.is_default)?.image_url || initAssets?.[0]?.image_url || null;

  useEffect(() => { setWorkingPdfUrl(pdfUrl); setWorkingPdfFile(pdfFile || null); }, [pdfUrl, pdfFile]);

  // Load stamp: prefer handoff, then brand_assets, then stamp_designs fallback
  useEffect(() => {
    if (handoffStampSvg) {
      setSavedStampSvg(handoffStampSvg);
      return;
    }
    if (!user?.id) return;
    loadDefaultStamp();
  }, [user?.id, handoffStampSvg]);

  async function loadDefaultStamp() {
    if (!user?.id) return;
    // 1) brand_assets: prefer is_default=true, else most recent
    const { data: stamps } = await supabase
      .from("brand_assets")
      .select("svg_content, thumbnail_url, metadata")
      .eq("user_id", user.id)
      .eq("asset_type", "stamp")
      .order("created_at", { ascending: false });
    if (stamps && stamps.length > 0) {
      const def = stamps.find((s: any) => s.metadata?.is_default) || stamps[0];
      const svg = (def as any).svg_content as string | null;
      const url = (def as any).thumbnail_url as string | null;
      if (svg) {
        setSavedStampSvg(svg);
        return;
      }
      if (url) {
        // Wrap raster image as inline SVG so existing renderer paths work uniformly
        setSavedStampSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"><image href="${url}" width="200" height="200" preserveAspectRatio="xMidYMid meet" /></svg>`);
        return;
      }
    }
    // 2) Fallback to legacy stamp_designs favourite
    const { data } = await supabase
      .from("stamp_designs")
      .select("svg_source")
      .eq("user_id", user.id)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.svg_source) setSavedStampSvg(data.svg_source);
  }

  // Load user's saved signature from ai_tool_projects (favorite signature)
  useEffect(() => {
    if (!user?.id) return;
    async function loadSignature() {
      const { data } = await supabase
        .from("ai_tool_projects")
        .select("project_data")
        .eq("user_id", user!.id)
        .eq("tool_type", "signature_designer")
        .order("updated_at", { ascending: false })
        .limit(10);
      if (!data || data.length === 0) return;
      // Find a favorite signature
      for (const row of data) {
        const pd = row.project_data as any;
        if (pd?.isFavorite && pd?.signatureDataUrl) {
          setSavedSignatureUrl(pd.signatureDataUrl);
          return;
        }
      }
      // Fallback: use the most recent one
      const first = data[0]?.project_data as any;
      if (first?.signatureDataUrl) {
        setSavedSignatureUrl(first.signatureDataUrl);
      }
    }
    loadSignature();
  }, [user?.id]);

  // ── Load PDF page count + thumbnails ──────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadThumbnails() {
      if (!pdfUrl) return;
      setThumbsLoading(true);
      try {
        let pageCount = 1;
        try {
          const source = pdfFile
            ? await pdfFile.arrayBuffer()
            : await fetch(pdfUrl).then((r) => r.arrayBuffer());
          const doc = await PDFDocument.load(source, { ignoreEncryption: true });
          pageCount = doc.getPageCount();
        } catch {
          // ignore
        }
        if (cancelled) return;
        setTotalPages(pageCount);

        const pdfjsLib = await loadPdfJs();
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdfJsDoc = await loadingTask.promise;
        if (cancelled) return;
        pdfJsDocRef.current = pdfJsDoc;

        const thumbUrls: string[] = [];
        for (let i = 1; i <= pageCount; i++) {
          if (cancelled) break;
          const canvas = document.createElement("canvas");
          await renderPageThumbnail(pdfJsDoc, i, canvas, 120);
          thumbUrls.push(canvas.toDataURL("image/jpeg", 0.7));
        }
        if (!cancelled) setThumbnails(thumbUrls);
      } catch (err) {
        console.warn("Thumbnail render failed:", err);
      } finally {
        if (!cancelled) setThumbsLoading(false);
      }
    }
    loadThumbnails();
    return () => { cancelled = true; };
  }, [pdfUrl, pdfFile]);

  // Scroll the strip so the active thumb is visible
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const active = strip.querySelector(`[data-page="${currentPage}"]`) as HTMLElement;
    if (active) active.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentPage]);

  const getRecipientStyle = (recipientId: string) => {
    const index = recipients.findIndex((r) => r.id === recipientId);
    return recipientColorStyles[index % recipientColorStyles.length];
  };

  const pageFields = fields.filter((f) => f.pageNumber === currentPage);

  // ── Click-to-place (coords are relative to PAGE, not scrollable overlay) ─
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedRecipient) {
        toast.error("Please select a recipient first");
        return;
      }
      if ((e.target as HTMLElement).closest("[data-field]")) return;
      const page = pageRef.current;
      if (!page) return;
      const rect = page.getBoundingClientRect();
      // Page hasn't laid out yet (PDF still loading) — bail with a hint
      if (rect.width < 20 || rect.height < 20) {
        toast.info("Page is still loading — try again in a second.");
        return;
      }
      // Ignore clicks outside the rendered page area
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

      // Special-case: user picked Stamp but has no saved stamp yet
      if (selectedFieldType === "stamp" && !savedStampSvg) {
        setShowStampManager(true);
        toast.info("Pick or upload a stamp first.");
        return;
      }

      const fieldConfig = fieldTypes.find((f) => f.type === selectedFieldType)!;
      const wPx = fieldConfig.defaultWidth;
      const hPx = fieldConfig.defaultHeight;
      // Center field on the actual click point
      const xPx = (e.clientX - rect.left) - wPx / 2;
      const yPx = (e.clientY - rect.top) - hPx / 2;
      const xPct = (xPx / rect.width) * 100;
      const yPct = (yPx / rect.height) * 100;
      const maxXPct = 100 - (wPx / rect.width) * 100;
      const maxYPct = 100 - (hPx / rect.height) * 100;
      // Date fields stay BLANK at placement time — the recipient's signing
      // date is auto-filled when they actually sign the document.
      const newField: SignatureField = {
        id: crypto.randomUUID(),
        recipientId: selectedRecipient,
        type: selectedFieldType,
        pageNumber: currentPage,
        x: Math.max(0, Math.min(maxXPct, xPct)),
        y: Math.max(0, Math.min(maxYPct, yPct)),
        width: wPx,
        height: hPx,
        value:
          selectedFieldType === "text"
            ? ""
            : selectedFieldType === "signature" && savedSignatureUrl
            ? savedSignatureUrl
            : selectedFieldType === "stamp" && savedStampSvg
            ? savedStampSvg
            : undefined,
      };

      onFieldsChange([...fields, newField]);
      toast.success(`${fieldConfig.label} placed — drag to fine-tune`);
    },
    [selectedRecipient, selectedFieldType, currentPage, fields, onFieldsChange, recipients, savedSignatureUrl, savedStampSvg]
  );

  const removeField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId));
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    onFieldsChange(fields.map((f) => (f.id === fieldId ? { ...f, value } : f)));
  };

  // ── Pointer-event drag + resize (precise, scroll-friendly) ────────────
  const handleFieldPointerDown = (e: React.PointerEvent, fieldId: string) => {
    if ((e.target as HTMLElement).dataset.handle) return; // resize handles handle their own
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    if (!overlayRef.current) return;
    const fieldEl = (e.currentTarget as HTMLElement);
    const fieldRect = fieldEl.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - fieldRect.left, y: e.clientY - fieldRect.top };
    draggingIdRef.current = fieldId;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleOverlayPointerMove = (e: React.PointerEvent) => {
    const overlay = overlayRef.current;
    const page = pageRef.current;
    if (!overlay || !page) return;

    // Auto-scroll near vertical edges of the SCROLL container
    const ov = overlay.getBoundingClientRect();
    const edge = 50;
    if (draggingIdRef.current || resizingRef.current) {
      if (e.clientY > ov.bottom - edge) overlay.scrollTop += 16;
      else if (e.clientY < ov.top + edge) overlay.scrollTop -= 16;
    }

    // All field math is relative to the rendered PAGE box
    const r = page.getBoundingClientRect();

    if (resizingRef.current) {
      const z = resizingRef.current;
      const dx = e.clientX - z.startX;
      const dy = e.clientY - z.startY;
      let newW = z.w, newH = z.h, newX = z.x, newY = z.y;
      const widthPct = (delta: number) => (delta / r.width) * 100;
      const heightPct = (delta: number) => (delta / r.height) * 100;
      if (z.corner === "se") { newW = Math.max(24, z.w + dx); newH = Math.max(20, z.h + dy); }
      else if (z.corner === "sw") { newW = Math.max(24, z.w - dx); newH = Math.max(20, z.h + dy); newX = z.x + widthPct(dx); }
      else if (z.corner === "ne") { newW = Math.max(24, z.w + dx); newH = Math.max(20, z.h - dy); newY = z.y + heightPct(dy); }
      else if (z.corner === "nw") { newW = Math.max(24, z.w - dx); newH = Math.max(20, z.h - dy); newX = z.x + widthPct(dx); newY = z.y + heightPct(dy); }
      onFieldsChange(fields.map((f) => f.id === z.id ? { ...f, width: newW, height: newH, x: newX, y: newY } : f));
      return;
    }

    const id = draggingIdRef.current;
    if (!id) return;
    const xPx = e.clientX - r.left - dragOffsetRef.current.x;
    const yPx = e.clientY - r.top - dragOffsetRef.current.y;
    const xPct = (xPx / r.width) * 100;
    const yPct = (yPx / r.height) * 100;
    const fld = fields.find((f) => f.id === id);
    if (!fld) return;
    const maxX = 100 - (fld.width / r.width) * 100;
    const maxY = 100 - (fld.height / r.height) * 100;
    onFieldsChange(fields.map((f) => f.id === id ? { ...f, x: Math.max(0, Math.min(maxX, xPct)), y: Math.max(0, Math.min(maxY, yPct)) } : f));
  };

  const handleOverlayPointerUp = () => {
    draggingIdRef.current = null;
    resizingRef.current = null;
  };

  const startResize = (e: React.PointerEvent, fieldId: string, corner: "se" | "sw" | "ne" | "nw") => {
    e.stopPropagation();
    const f = fields.find((x) => x.id === fieldId);
    if (!f) return;
    resizingRef.current = { id: fieldId, corner, startX: e.clientX, startY: e.clientY, w: f.width, h: f.height, x: f.x, y: f.y };
  };

  // ── Adopt-and-Sign click handler ──────────────────────────────────────
  // ALWAYS open the dialog so the user can confirm/redraw — no silent broadcast.
  const handleSignatureFieldClick = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    setAdoptForFieldId(fieldId);
    setShowAdopt(true);
  };

  const broadcastValue = (recipientId: string, type: SignatureField["type"], value: string) => {
    onFieldsChange(fields.map((f) => (f.recipientId === recipientId && f.type === type ? { ...f, value } : f)));
  };

  const handleAdoptResult = async (res: { signatureUrl: string; initialsUrl: string; broadcast: boolean; saveDefault: boolean }) => {
    const target = fields.find((f) => f.id === adoptForFieldId);
    if (!target) return;
    const recipientId = target.recipientId;
    if (res.saveDefault) {
      try {
        await Promise.all([
          saveAsset.mutateAsync({ kind: "signature", image_data_url: res.signatureUrl, makeDefault: true }),
          saveAsset.mutateAsync({ kind: "initial", image_data_url: res.initialsUrl, makeDefault: true }),
        ]);
      } catch (e) { console.warn("save asset failed", e); }
    }
    if (res.broadcast) {
      onFieldsChange(fields.map((f) => {
        if (f.recipientId !== recipientId) return f;
        if (f.type === "signature") return { ...f, value: res.signatureUrl };
        if (f.type === "initials") return { ...f, value: res.initialsUrl };
        return f;
      }));
    } else {
      const url = target.type === "signature" ? res.signatureUrl : res.initialsUrl;
      onFieldsChange(fields.map((f) => f.id === target.id ? { ...f, value: url } : f));
    }
    toast.success("Signature adopted and applied");
  };

  // ── Auto-detect (rasterize pages and use AI vision) ───────────────────
  const handleAutoDetect = async () => {
    if (!selectedRecipient) {
      toast.error("Please select a recipient first");
      return;
    }
    setIsAutoDetecting(true);
    try {
      // Rasterize up to first 6 pages to small JPEGs and send to vision model
      const pdfjsLib = await loadPdfJs();
      const doc = pdfJsDocRef.current || (await pdfjsLib.getDocument(workingPdfUrl).promise);
      const maxPages = Math.min(doc.numPages, 6);
      const pageImages: { pageNumber: number; image: string; width: number; height: number }[] = [];
      for (let i = 1; i <= maxPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        const targetW = 1100;
        const scale = targetW / viewport.width;
        const sv = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = sv.width; canvas.height = sv.height;
        await page.render({ canvasContext: canvas.getContext("2d")!, viewport: sv }).promise;
        pageImages.push({ pageNumber: i, image: canvas.toDataURL("image/jpeg", 0.7), width: sv.width, height: sv.height });
      }

      const recipient = recipients.find((r) => r.id === selectedRecipient);
      const bodyPayload: any = {
        recipientId: selectedRecipient,
        recipientName: recipient?.name || "",
        recipientEmail: recipient?.email || "",
        pageImages,
      };

      const { data, error } = await supabase.functions.invoke("esign-auto-detect-fields", {
        body: bodyPayload,
      });

      if (error) throw error;

      const detected: SignatureField[] = (data.fields || []).map((f: any) => ({
        id: crypto.randomUUID(),
        recipientId: selectedRecipient,
        type: f.type,
        pageNumber: f.pageNumber || currentPage,
        x: f.x,
        y: f.y,
        width: f.width || fieldTypes.find((ft) => ft.type === f.type)?.defaultWidth || 160,
        height: f.height || fieldTypes.find((ft) => ft.type === f.type)?.defaultHeight || 36,
        value: f.suggestedValue || undefined,
        label: f.label || undefined,
      }));

      onFieldsChange([...fields, ...detected]);
      if (detected.length > 0) {
        // Jump to the page of the first detected field so the user actually sees them
        const firstPage = Math.min(...detected.map((d) => d.pageNumber));
        if (firstPage && firstPage !== currentPage) setCurrentPage(firstPage);
        toast.success(`Auto-detected ${detected.length} field(s) — jumped to page ${firstPage}`);
      } else {
        toast.info("No signing fields detected on the first 6 pages.");
      }
    } catch (err: any) {
      console.error("Auto-detect error:", err);
      toast.error("Auto-detect failed. Placing smart defaults instead.");
      const recipientName = recipients.find((r) => r.id === selectedRecipient)?.name || "";
      const fallbackFields: SignatureField[] = [
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "text", pageNumber: currentPage, x: 10, y: 8, width: 160, height: 36, value: recipientName, label: "Name" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "text", pageNumber: currentPage, x: 55, y: 8, width: 160, height: 36, value: "", label: "Title" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "date", pageNumber: currentPage, x: 10, y: 88, width: 140, height: 36, value: "", label: "Date (auto on sign)" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "signature", pageNumber: currentPage, x: 55, y: 85, width: 180, height: 52, label: "Signature" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "initials", pageNumber: currentPage, x: 88, y: 88, width: 90, height: 40, label: "Initials" },
      ];
      onFieldsChange([...fields, ...fallbackFields]);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const clearAllFields = () => {
    onFieldsChange(fields.filter((f) => f.pageNumber !== currentPage));
    toast.info("All fields on this page cleared");
  };

  // Field counts per page for badge on thumbnails
  const fieldCountByPage = fields.reduce<Record<number, number>>((acc, f) => {
    acc[f.pageNumber] = (acc[f.pageNumber] || 0) + 1;
    return acc;
  }, {});
  // Field content is now rendered by FieldContentRenderer component

  return (
    <div className="space-y-4" style={{ overflowX: "hidden" }}>
      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/40 rounded-xl border">
        {/* Recipient selector */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={selectedRecipient} onValueChange={setSelectedRecipient}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              {recipients.map((recipient, index) => (
                <SelectItem key={recipient.id} value={recipient.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: recipientColorStyles[index % recipientColorStyles.length].hex }}
                    />
                    {recipient.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Field type buttons */}
        <div className="flex gap-1.5 flex-wrap">
          {fieldTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={selectedFieldType === type ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedFieldType(type);
                // If user picks Stamp and no stamp is loaded yet, open the manager
                if (type === "stamp" && !savedStampSvg) {
                  setShowStampManager(true);
                  toast.info("Upload or pick a stamp, then click on the document to place it.");
                }
              }}
              className={`h-9 gap-1.5 text-sm font-medium ${
                selectedFieldType === type
                  ? "bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white border-transparent"
                  : "hover:border-[hsl(var(--gold)/.5)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Button>
          ))}
          {/* Manage Stamps shortcut — always visible */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStampManager(true)}
            className="h-9 gap-1.5 text-sm font-medium border-[hsl(var(--gold)/.4)] hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.05)]"
            title="Upload, edit or delete saved stamps"
          >
            <StampIcon className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
            Manage Stamps
          </Button>
        </div>

        <div className="w-px h-8 bg-border" />

        {/* Auto Detect + Clear */}
        <Button
          onClick={handleAutoDetect}
          disabled={isAutoDetecting}
          size="sm"
          className="h-9 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white font-medium gap-1.5"
        >
          {isAutoDetecting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          {isAutoDetecting ? "Detecting…" : "Auto Detect Fields"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFields}
          className="h-9 text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Clear Page
        </Button>

        <div className="w-px h-8 bg-border" />

        {/* Brand Assets */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAssetPicker(true)}
          className="h-9 gap-1.5 text-sm font-medium border-[hsl(var(--gold)/.4)] hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.05)]"
        >
          <Package className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
          Brand Assets
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDocEditor(true)}
          className="h-9 gap-1.5 text-sm font-medium border-[hsl(var(--gold)/.4)] hover:border-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.05)]"
        >
          <Edit3 className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
          Edit Document
        </Button>
      </div>

      {/* Click-mode hint */}
      <div className="flex items-center gap-2 px-1">
        <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
          Tip: Click anywhere on the document to place the selected field type
        </Badge>
      </div>

      {/* ─── Main Layout: thumbnail strip + document + sidebar ─── */}
      <div className="flex gap-4">

        {/* ── Left: Page Thumbnail Strip ── */}
        <div
          ref={stripRef}
          className="hidden md:flex flex-col gap-2 w-[136px] shrink-0 overflow-y-auto pr-1"
          style={{ maxHeight: "830px", scrollbarWidth: "thin" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-1">
            Pages
          </p>
          {thumbsLoading && thumbnails.length === 0 ? (
            Array.from({ length: Math.min(totalPages, 3) }).map((_, i) => (
              <div
                key={i}
                className="w-full aspect-[3/4] rounded-lg bg-muted/60 animate-pulse border border-border"
              />
            ))
          ) : thumbnails.length > 0 ? (
            thumbnails.map((src, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              const count = fieldCountByPage[pageNum] || 0;
              return (
                <button
                  key={pageNum}
                  data-page={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))] ${
                    isActive
                      ? "border-[hsl(var(--gold))] shadow-[0_0_0_2px_hsl(var(--gold)/.2)] ring-0"
                      : "border-border hover:border-[hsl(var(--gold)/.5)]"
                  }`}
                >
                  <img
                    src={src}
                    alt={`Page ${pageNum}`}
                    className="w-full block object-cover"
                    draggable={false}
                   loading="lazy" decoding="async" />
                  {isActive && (
                    <div className="absolute inset-0 bg-[hsl(var(--gold)/.06)] pointer-events-none" />
                  )}
                  <div
                    className={`absolute bottom-0 left-0 right-0 text-center py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? "bg-[hsl(var(--gold))] text-white"
                        : "bg-background/80 text-muted-foreground"
                    }`}
                  >
                    {pageNum}
                  </div>
                  {count > 0 && (
                    <div className="absolute top-1 right-1 bg-[hsl(var(--gold))] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                      {count}
                    </div>
                  )}
                </button>
              );
            })
          ) : (
            Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = pageNum === currentPage;
              const count = fieldCountByPage[pageNum] || 0;
              return (
                <button
                  key={pageNum}
                  data-page={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`relative flex flex-col items-center justify-center rounded-lg border-2 transition-all aspect-[3/4] text-sm font-semibold focus:outline-none ${
                    isActive
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/.1)] text-[hsl(var(--gold))]"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-[hsl(var(--gold)/.5)]"
                  }`}
                >
                  <FileText className="w-5 h-5 mb-1 opacity-60" />
                  <span className="text-xs">{pageNum}</span>
                  {count > 0 && (
                    <div className="absolute top-1 right-1 bg-[hsl(var(--gold))] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                      {count}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* ── Center + Right: document + sidebar ── */}
        <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Document + Overlay */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  ref={overlayRef}
                  className="w-full overflow-y-auto select-none flex justify-center"
                  style={{ maxHeight: "calc(100dvh - 220px)", minHeight: "500px", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
                  onPointerMove={handleOverlayPointerMove}
                  onPointerUp={handleOverlayPointerUp}
                  onPointerLeave={handleOverlayPointerUp}
                >
                  {/* Page-sized positioned box: ALL field % coords are relative to this. */}
                  <div
                    ref={pageRef}
                    className="relative"
                    style={{
                      width: pageSize ? `${pageSize.w}px` : "100%",
                      height: pageSize ? `${pageSize.h}px` : "auto",
                      cursor: "crosshair",
                    }}
                    onClick={handleOverlayClick}
                  >
                    <PdfPageCanvas
                      pdfDoc={pdfJsDocRef.current}
                      pageNumber={currentPage}
                      pdfUrl={workingPdfUrl}
                      onSizeChange={(s) => setPageSize(s)}
                    />

                    {/* Field overlays */}
                    {pageFields.map((field) => {
                      const style = getRecipientStyle(field.recipientId);
                      const isSelected = selectedFieldId === field.id;

                      return (
                        <div
                          key={field.id}
                          data-field="true"
                          onPointerDown={(e) => handleFieldPointerDown(e, field.id)}
                          onClick={(e) => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                          className={`absolute z-20 rounded border-2 shadow-md ${style.border} ${style.light} group ${isSelected ? "ring-2 ring-[hsl(var(--gold))]" : ""}`}
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            width: `${field.width}px`,
                            height: `${field.height}px`,
                            cursor: "move",
                            touchAction: "none",
                          }}
                        >
                          {/* Always-visible action bar (delete + edit) */}
                          <div className="absolute -top-3 -right-3 z-40 flex items-center gap-1">
                            {(field.type === "signature" || field.type === "initials" || field.type === "stamp") && (
                              <button
                                type="button"
                                aria-label="Edit / draw signature"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSignatureFieldClick(field.id);
                                }}
                                className="w-6 h-6 bg-[#EFE6D6] hover:bg-[#F7F2EA]/85 text-[#1A1A1A] rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
                                title="Draw / edit signature"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              aria-label="Delete field"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                              className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md ring-2 ring-white"
                              title="Remove field"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Field content */}
                          <FieldContentRenderer
                            field={field}
                            style={style}
                            recipients={recipients}
                            savedStampSvg={savedStampSvg}
                            savedSignatureUrl={defaultSignatureUrl || savedSignatureUrl}
                            onUpdateValue={updateFieldValue}
                            onOpenDraw={(id) => handleSignatureFieldClick(id)}
                          />

                          {/* Resize handles (corners) — visible when field is selected or hovered */}
                          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                            <div
                              key={corner}
                              data-handle={corner}
                              onPointerDown={(e) => startResize(e, field.id, corner)}
                              className={`absolute w-3 h-3 bg-white border-2 ${style.border} z-30 ${isSelected ? "block" : "hidden group-hover:block"}`}
                              style={{
                                [corner.includes("n") ? "top" : "bottom"]: -6,
                                [corner.includes("w") ? "left" : "right"]: -6,
                                cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize",
                              }}
                            />
                          ))}

                          {/* Recipient color bar */}
                          <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b ${style.bg}`} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Page navigation bar */}
                <div className="flex items-center justify-center gap-4 px-4 py-2 border-t bg-muted/30">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: fields list + legend */}
          <div className="space-y-4">
            {/* Placed Fields */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center justify-between">
                  Placed Fields
                  <Badge variant="secondary">{fields.length}</Badge>
                </h3>
                {fields.length === 0 ? (
                  <div className="text-center py-8">
                    <PenTool className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      Click on the document to place fields
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                    {fields.map((field) => {
                      const recipient = recipients.find((r) => r.id === field.recipientId);
                      const fieldConfig = fieldTypes.find((f) => f.type === field.type);
                      const Icon = fieldConfig?.icon || PenTool;
                      const style = getRecipientStyle(field.recipientId);
                      const isOnCurrentPage = field.pageNumber === currentPage;

                      return (
                        <div
                          key={field.id}
                          className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                            isOnCurrentPage
                              ? "bg-muted/70 ring-1 ring-[hsl(var(--gold)/.3)]"
                              : "bg-muted/40 hover:bg-muted/60 opacity-60"
                          }`}
                          onClick={() => !isOnCurrentPage && setCurrentPage(field.pageNumber)}
                          title={!isOnCurrentPage ? `Jump to page ${field.pageNumber}` : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: style.hex }}
                            />
                            <Icon className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">
                                {field.label || fieldConfig?.label}
                                {field.type === "initials" ? ` — ${getInitials(recipient?.name || "")}` : ""}
                                {field.type !== "initials" && field.type !== "signature" && field.value ? ` — ${field.value}` : ""}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {recipient?.name} · p{field.pageNumber}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recipients legend */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Recipients</h3>
                <div className="space-y-2">
                  {recipients.map((recipient, index) => {
                    const style = recipientColorStyles[index % recipientColorStyles.length];
                    const count = fields.filter((f) => f.recipientId === recipient.id).length;
                    return (
                      <div key={recipient.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: style.hex }}
                          />
                          <span className="text-sm truncate">{recipient.name}</span>
                        </div>
                        <Badge variant={count > 0 ? "default" : "outline"} className="text-xs">
                          {count} field{count !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-2">How to place fields</h4>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Select the recipient above</li>
                  <li>Choose a field type (Signature, Initials, Date, Text)</li>
                  <li>Click on a thumbnail to switch pages</li>
                  <li>Click on the document to place a field</li>
                  <li>Drag placed fields to reposition them</li>
                  <li>Click a signature field to draw directly</li>
                  <li>Or use <strong>Auto Detect</strong> for AI placement</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ─── Draw Signature Dialog ─── */}
      <Dialog open={!!drawingFieldId} onOpenChange={(open) => !open && setDrawingFieldId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              Draw Your Signature
            </DialogTitle>
          </DialogHeader>
          <ESignaturePad
            onSignatureChange={(dataUrl) => {
              if (dataUrl && drawingFieldId) {
                updateFieldValue(drawingFieldId, dataUrl);
                setDrawingFieldId(null);
                toast.success("Signature applied to field");
              }
            }}
            height={180}
          />
        </DialogContent>
      </Dialog>

      {/* ─── Brand Asset Picker ─── */}
      {showAssetPicker && (
        <BrandAssetPicker
          onSelect={(asset) => {
            if (asset.asset_type === 'stamp' && asset.svg_content) {
              setSavedStampSvg(asset.svg_content);
              toast.success(`Stamp "${asset.name}" loaded — select Stamp field type and click to place`);
            } else if (asset.asset_type === 'signature') {
              const url = asset.thumbnail_url || (asset.svg_content
                ? `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(asset.svg_content)))}`
                : null);
              if (url) {
                setSavedSignatureUrl(url);
                toast.success(`Signature "${asset.name}" loaded`);
              }
            } else if (asset.asset_type === 'logo' && asset.thumbnail_url) {
              setSavedSignatureUrl(asset.thumbnail_url);
              toast.success(`Logo "${asset.name}" loaded as overlay`);
            }
            setShowAssetPicker(false);
          }}
          onClose={() => setShowAssetPicker(false)}
        />
      )}

      {/* ─── Stamp Manager ─── */}
      <StampManagerDialog
        open={showStampManager}
        onOpenChange={setShowStampManager}
        onUse={(s) => {
          if (s.svg) {
            setSavedStampSvg(s.svg);
          } else if (s.imageUrl) {
            // Wrap raster image so the existing SVG-based renderer paths work
            setSavedStampSvg(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"><image href="${s.imageUrl}" width="200" height="200" preserveAspectRatio="xMidYMid meet" /></svg>`
            );
          }
          setSelectedFieldType("stamp");
          toast.success(`Stamp "${s.name}" ready — click on the document to place it`);
        }}
      />

      {/* ─── Adopt & Sign ─── */}
      <AdoptAndSignDialog
        open={showAdopt}
        onOpenChange={(o) => { setShowAdopt(o); if (!o) setAdoptForFieldId(null); }}
        recipientName={recipients.find((r) => r.id === fields.find((f) => f.id === adoptForFieldId)?.recipientId)?.name || ""}
        fieldType={(fields.find((f) => f.id === adoptForFieldId)?.type as any) || "signature"}
        onAdopt={handleAdoptResult}
      />

      {/* ─── Document Editor ─── */}
      <DocumentEditor
        open={showDocEditor}
        onOpenChange={setShowDocEditor}
        pdfFile={workingPdfFile}
        pdfUrl={workingPdfUrl}
        fields={fields}
        onApply={(newFile, remap) => {
          const url = URL.createObjectURL(newFile);
          setWorkingPdfFile(newFile);
          setWorkingPdfUrl(url);
          onFieldsChange(remap);
        }}
      />
    </div>
  );
}
