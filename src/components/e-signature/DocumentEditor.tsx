import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2, RotateCw, Copy, Plus, FileDown, Printer, Image as ImageIcon, GripVertical, Loader2 } from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import JSZip from "jszip";
import { toast } from "sonner";
import { loadPdfJs, renderPageThumbnail } from "./documentFieldTypes";
import type { SignatureField } from "./documentFieldTypes";

interface DocumentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfFile: File | null;
  pdfUrl: string;
  fields: SignatureField[];
  onApply: (newFile: File, fieldRemap: SignatureField[]) => void;
}

interface PageEntry {
  /** original 1-based page index in the source pdf */
  origIndex: number;
  /** current rotation in degrees, multiples of 90 */
  rotation: number;
  /** unique id for drag tracking */
  uid: string;
  thumb?: string;
}

export default function DocumentEditor({ open, onOpenChange, pdfFile, pdfUrl, fields, onApply }: DocumentEditorProps) {
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const insertRef = useRef<HTMLInputElement>(null);
  const insertedDocs = useRef<Record<string, PDFDocument>>({});
  const dragFrom = useRef<number | null>(null);

  // Load thumbnails when opened
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const pdfjsLib = await loadPdfJs();
        const doc = await pdfjsLib.getDocument(pdfUrl).promise;
        const count = doc.numPages;
        const list: PageEntry[] = [];
        for (let i = 1; i <= count; i++) {
          const canvas = document.createElement("canvas");
          await renderPageThumbnail(doc, i, canvas, 160);
          if (cancelled) return;
          list.push({ origIndex: i, rotation: 0, uid: `p-${i}-${Math.random().toString(36).slice(2, 7)}`, thumb: canvas.toDataURL("image/jpeg", 0.7) });
        }
        if (!cancelled) setPages(list);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load pages");
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, pdfUrl]);

  const move = (from: number, to: number) => {
    setPages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };
  const rotate = (idx: number) => setPages((p) => p.map((e, i) => (i === idx ? { ...e, rotation: (e.rotation + 90) % 360 } : e)));
  const remove = (idx: number) => setPages((p) => p.filter((_, i) => i !== idx));
  const duplicate = (idx: number) => setPages((p) => {
    const next = [...p];
    next.splice(idx + 1, 0, { ...p[idx], uid: `p-d-${Math.random().toString(36).slice(2, 7)}` });
    return next;
  });

  const insertFromFile = async (file: File) => {
    try {
      setWorking(true);
      const buf = await file.arrayBuffer();
      const inserted = await PDFDocument.load(buf, { ignoreEncryption: true });
      const pdfjsLib = await loadPdfJs();
      const blobUrl = URL.createObjectURL(file);
      const doc = await pdfjsLib.getDocument(blobUrl).promise;
      const newPages: PageEntry[] = [];
      for (let i = 1; i <= inserted.getPageCount(); i++) {
        const canvas = document.createElement("canvas");
        await renderPageThumbnail(doc, i, canvas, 160);
        newPages.push({
          origIndex: -i, // negative means "from inserted file"
          rotation: 0,
          uid: `ins-${i}-${Math.random().toString(36).slice(2, 7)}`,
          thumb: canvas.toDataURL("image/jpeg", 0.7),
        });
      }
      URL.revokeObjectURL(blobUrl);
      (insertedDocs.current as any)[file.name] = inserted;
      newPages.forEach((p) => ((p as any).source = file.name));
      setPages((p) => [...p, ...newPages]);
      toast.success(`Inserted ${newPages.length} page(s) from ${file.name}`);
    } catch (e: any) {
      toast.error(`Insert failed: ${e.message || e}`);
    } finally {
      setWorking(false);
    }
  };

  const buildFinalPdf = async (): Promise<{ pdfBytes: Uint8Array; remap: SignatureField[] }> => {
    const sourceBuf = pdfFile ? await pdfFile.arrayBuffer() : await fetch(pdfUrl).then((r) => r.arrayBuffer());
    const sourceDoc = await PDFDocument.load(sourceBuf, { ignoreEncryption: true });
    const out = await PDFDocument.create();

    const newToOrig: number[] = [];
    for (const entry of pages) {
      let copied;
      if (entry.origIndex > 0) {
        [copied] = await out.copyPages(sourceDoc, [entry.origIndex - 1]);
      } else {
        const src = (insertedDocs.current as any)[(entry as any).source];
        if (!src) continue;
        [copied] = await out.copyPages(src, [-entry.origIndex - 1]);
      }
      if (entry.rotation) copied.setRotation(degrees(entry.rotation));
      out.addPage(copied);
      newToOrig.push(entry.origIndex);
    }

    const remap: SignatureField[] = [];
    for (const f of fields) {
      const newIdx = newToOrig.findIndex((orig, i) => orig === f.pageNumber && pages[i].origIndex > 0);
      if (newIdx >= 0) remap.push({ ...f, pageNumber: newIdx + 1 });
    }

    const pdfBytes = await out.save();
    return { pdfBytes, remap };
  };

  const apply = async () => {
    setWorking(true);
    try {
      const { pdfBytes, remap } = await buildFinalPdf();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const file = new File([blob], pdfFile?.name || "document.pdf", { type: "application/pdf" });
      onApply(file, remap);
      onOpenChange(false);
      toast.success("Document updated");
    } catch (e: any) {
      toast.error(`Apply failed: ${e.message || e}`);
    } finally {
      setWorking(false);
    }
  };

  const exportAs = async (kind: "pdf" | "pdf-zip" | "png-zip" | "png-current") => {
    setWorking(true);
    try {
      if (kind === "pdf") {
        const { pdfBytes } = await buildFinalPdf();
        download(new Blob([pdfBytes as BlobPart], { type: "application/pdf" }), `${baseName()}.pdf`);
      } else if (kind === "pdf-zip") {
        const { pdfBytes } = await buildFinalPdf();
        const merged = await PDFDocument.load(pdfBytes);
        const zip = new JSZip();
        for (let i = 0; i < merged.getPageCount(); i++) {
          const single = await PDFDocument.create();
          const [p] = await single.copyPages(merged, [i]);
          single.addPage(p);
          const bytes = await single.save();
          zip.file(`${baseName()}-page-${i + 1}.pdf`, bytes);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        download(blob, `${baseName()}-pages.zip`);
      } else if (kind === "png-zip") {
        const zip = new JSZip();
        const pdfjsLib = await loadPdfJs();
        const { pdfBytes } = await buildFinalPdf();
        const blobUrl = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: "application/pdf" }));
        const doc = await pdfjsLib.getDocument(blobUrl).promise;
        for (let i = 1; i <= doc.numPages; i++) {
          const canvas = document.createElement("canvas");
          await renderPageThumbnail(doc, i, canvas, 1200);
          const dataUrl = canvas.toDataURL("image/png");
          zip.file(`${baseName()}-page-${i}.png`, dataUrl.split(",")[1], { base64: true });
        }
        URL.revokeObjectURL(blobUrl);
        const blob = await zip.generateAsync({ type: "blob" });
        download(blob, `${baseName()}-images.zip`);
      } else if (kind === "png-current") {
        const pdfjsLib = await loadPdfJs();
        const { pdfBytes } = await buildFinalPdf();
        const blobUrl = URL.createObjectURL(new Blob([pdfBytes as BlobPart], { type: "application/pdf" }));
        const doc = await pdfjsLib.getDocument(blobUrl).promise;
        const canvas = document.createElement("canvas");
        await renderPageThumbnail(doc, 1, canvas, 1600);
        canvas.toBlob((b) => b && download(b, `${baseName()}.png`), "image/png");
        URL.revokeObjectURL(blobUrl);
      }
      toast.success("Export ready");
    } catch (e: any) {
      toast.error(`Export failed: ${e.message || e}`);
    } finally {
      setWorking(false);
    }
  };

  const print = async () => {
    // Browsers block window.open() called after an await (loses user-gesture
    // chain → "popup blocked"). Download the PDF instead — user opens it
    // from their downloads bar and prints from there.
    const { pdfBytes } = await buildFinalPdf();
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
    download(blob, `${baseName()}.pdf`);
    toast.success("PDF downloaded — open the file and press Ctrl/⌘+P to print");
  };

  const baseName = () => (pdfFile?.name || "document").replace(/\.pdf$/i, "");
  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit document</SheetTitle>
          <SheetDescription>Reorder, rotate, delete, duplicate pages, merge another PDF, then export.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-wrap gap-2 mt-4">
          <input ref={insertRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => {
            const f = e.target.files?.[0]; if (f) insertFromFile(f);
            e.target.value = "";
          }} />
          <Button variant="outline" size="sm" onClick={() => insertRef.current?.click()} disabled={working}>
            <Plus className="w-4 h-4 mr-1" /> Merge PDF
          </Button>
          <Button variant="outline" size="sm" onClick={print} disabled={working || pages.length === 0}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={working || pages.length === 0}>
                <FileDown className="w-4 h-4 mr-1" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportAs("pdf")}>Single PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("pdf-zip")}>One PDF per page (zip)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("png-zip")}><ImageIcon className="w-4 h-4 mr-2" />PNG per page (zip)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportAs("png-current")}><ImageIcon className="w-4 h-4 mr-2" />First page as PNG</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="ml-auto" />
          <Button onClick={apply} disabled={working || pages.length === 0} className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white">
            {working ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Apply changes
          </Button>
        </div>

        {busy ? (
          <div className="py-12 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
            {pages.map((p, idx) => (
              <div
                key={p.uid}
                draggable
                onDragStart={() => (dragFrom.current = idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragFrom.current != null && dragFrom.current !== idx) move(dragFrom.current, idx);
                  dragFrom.current = null;
                }}
                className="relative group rounded-lg overflow-hidden border border-border bg-background"
              >
                <div className="absolute top-1 left-1 z-10 p-1 bg-background/80 rounded cursor-move opacity-0 group-hover:opacity-100">
                  <GripVertical className="w-3 h-3" />
                </div>
                <div className="aspect-[3/4] bg-muted flex items-center justify-center">
                  {p.thumb ? (
                    <img
                      src={p.thumb}
                      alt={`page ${idx + 1}`}
                      className="w-full h-full object-contain"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                     loading="lazy" decoding="async" />
                  ) : null}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-2 py-1 text-[10px] text-center font-semibold">
                  Page {idx + 1}
                </div>
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => rotate(idx)} className="p-1 bg-background/90 rounded hover:bg-background" title="Rotate"><RotateCw className="w-3 h-3" /></button>
                  <button onClick={() => duplicate(idx)} className="p-1 bg-background/90 rounded hover:bg-background" title="Duplicate"><Copy className="w-3 h-3" /></button>
                  <button onClick={() => remove(idx)} className="p-1 bg-background/90 rounded hover:bg-background text-red-500" title="Delete"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
