import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PenTool, Trash2, User, Wand2, Loader2,
  ChevronLeft, ChevronRight, X, FileText, Pencil,
} from "lucide-react";
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
}: DocumentFieldPlacerProps) {
  const { user } = useAuth();
  const [selectedRecipient, setSelectedRecipient] = useState<string>(recipients[0]?.id || "");
  const [selectedFieldType, setSelectedFieldType] = useState<SignatureField["type"]>("signature");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  // Saved stamp SVG from user's stamp generator
  const [savedStampSvg, setSavedStampSvg] = useState<string | null>(null);
  // Saved signature image from AI Signature Designer
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);

  // Draw-in-field dialog
  const [drawingFieldId, setDrawingFieldId] = useState<string | null>(null);

  // Drag offset ref for precision dragging
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Thumbnail state
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [thumbsLoading, setThumbsLoading] = useState(false);
  const pdfJsDocRef = useRef<any>(null);

  // Load user's saved stamp from stamp_designs
  useEffect(() => {
    if (!user?.id) return;
    async function loadStamp() {
      const { data } = await supabase
        .from("stamp_designs")
        .select("svg_source")
        .eq("user_id", user!.id)
        .eq("is_favorite", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.svg_source) setSavedStampSvg(data.svg_source);
    }
    loadStamp();
  }, [user?.id]);

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

  // ── Click-to-place ──────────────────────────────────────────────────────
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedRecipient) {
        toast.error("Please select a recipient first");
        return;
      }
      if ((e.target as HTMLElement).closest("[data-field]")) return;

      const rect = overlayRef.current!.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width) * 100;
      const yPct = ((e.clientY - rect.top) / rect.height) * 100;

      const fieldConfig = fieldTypes.find((f) => f.type === selectedFieldType)!;
      const today = new Date().toLocaleDateString("en-AE");

      const newField: SignatureField = {
        id: crypto.randomUUID(),
        recipientId: selectedRecipient,
        type: selectedFieldType,
        pageNumber: currentPage,
        x: Math.max(0, Math.min(95, xPct)),
        y: Math.max(0, Math.min(95, yPct)),
        width: fieldConfig.defaultWidth,
        height: fieldConfig.defaultHeight,
        value:
          selectedFieldType === "date"
            ? today
            : selectedFieldType === "text"
            ? ""
            : selectedFieldType === "signature" && savedSignatureUrl
            ? savedSignatureUrl
            : undefined,
      };

      onFieldsChange([...fields, newField]);
      toast.success(`${fieldConfig.label} field added — drag to reposition`);
    },
    [selectedRecipient, selectedFieldType, currentPage, fields, onFieldsChange, recipients, savedSignatureUrl]
  );

  const removeField = (fieldId: string) => {
    onFieldsChange(fields.filter((f) => f.id !== fieldId));
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    onFieldsChange(fields.map((f) => (f.id === fieldId ? { ...f, value } : f)));
  };

  // ── Drag-to-reposition (with offset for precision) ─────────────────────
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const fieldId = e.dataTransfer.getData("fieldId");
      if (!fieldId || !overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left - dragOffsetRef.current.x) / rect.width) * 100;
      const y = ((e.clientY - rect.top - dragOffsetRef.current.y) / rect.height) * 100;
      onFieldsChange(
        fields.map((f) =>
          f.id === fieldId
            ? { ...f, x: Math.max(0, Math.min(95, x)), y: Math.max(0, Math.min(95, y)) }
            : f
        )
      );
    },
    [fields, onFieldsChange]
  );

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    e.dataTransfer.setData("fieldId", fieldId);
    // Calculate offset between cursor and field's top-left corner
    const fieldEl = (e.target as HTMLElement).closest("[data-field]") as HTMLElement;
    if (fieldEl) {
      const fieldRect = fieldEl.getBoundingClientRect();
      dragOffsetRef.current = {
        x: e.clientX - fieldRect.left,
        y: e.clientY - fieldRect.top,
      };
    }
  };

  // ── Auto-detect (send base64 if blob URL) ──────────────────────────────
  const handleAutoDetect = async () => {
    if (!selectedRecipient) {
      toast.error("Please select a recipient first");
      return;
    }
    setIsAutoDetecting(true);
    try {
      let bodyPayload: any = {
        recipientId: selectedRecipient,
        recipientName: recipients.find((r) => r.id === selectedRecipient)?.name || "",
      };

      // If pdfFile available, send as base64 instead of blob URL
      if (pdfFile) {
        const buffer = await pdfFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        bodyPayload.pdfBase64 = base64;
      } else if (pdfUrl && !pdfUrl.startsWith("blob:")) {
        bodyPayload.pdfUrl = pdfUrl;
      }

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
      toast.success(`Auto-detected ${detected.length} field(s) — review and adjust as needed`);
    } catch (err: any) {
      console.error("Auto-detect error:", err);
      toast.error("Auto-detect failed. Placing smart defaults instead.");
      const today = new Date().toLocaleDateString("en-AE");
      const recipientName = recipients.find((r) => r.id === selectedRecipient)?.name || "";
      const fallbackFields: SignatureField[] = [
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "text", pageNumber: currentPage, x: 10, y: 8, width: 160, height: 36, value: recipientName, label: "Name" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "text", pageNumber: currentPage, x: 55, y: 8, width: 160, height: 36, value: "", label: "Title" },
        { id: crypto.randomUUID(), recipientId: selectedRecipient, type: "date", pageNumber: currentPage, x: 10, y: 88, width: 140, height: 36, value: today, label: "Date" },
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
              onClick={() => setSelectedFieldType(type)}
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
                  />
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
                  className="relative w-full overflow-y-auto mx-auto"
                  style={{ maxHeight: "calc(100dvh - 220px)", minHeight: "500px", cursor: "crosshair", touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
                  onClick={handleOverlayClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <PdfPageCanvas pdfDoc={pdfJsDocRef.current} pageNumber={currentPage} pdfUrl={pdfUrl} />

                  {/* Field overlays */}
                  {pageFields.map((field) => {
                    const style = getRecipientStyle(field.recipientId);

                    return (
                      <div
                        key={field.id}
                        data-field="true"
                        draggable
                        onDragStart={(e) => handleDragStart(e, field.id)}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute z-20 rounded border-2 shadow-md ${style.border} ${style.light} group`}
                        style={{
                          left: `${field.x}%`,
                          top: `${field.y}%`,
                          width: `${field.width}px`,
                          height: `${field.height}px`,
                          cursor: "move",
                        }}
                      >
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeField(field.id);
                          }}
                          className="absolute -top-2.5 -right-2.5 z-30 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full items-center justify-center hidden group-hover:flex shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Field content */}
                        {renderFieldContent(field, style)}

                        {/* Recipient color bar */}
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-b ${style.bg}`} />
                      </div>
                    );
                  })}
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
    </div>
  );
}
