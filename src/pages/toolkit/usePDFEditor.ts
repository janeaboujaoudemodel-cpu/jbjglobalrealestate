import { useState, useCallback, useRef, useEffect } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { PDFPage, LoadedPDF, HistoryEntry } from "./pdfEditorTypes";

export default function usePDFEditor() {
  const [projectName, setProjectName] = useState("PDF Project");
  const [loadedPDFs, setLoadedPDFs] = useState<LoadedPDF[]>([]);
  const [pages, setPages] = useState<PDFPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [signatureMode, setSignatureMode] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [previewPage, setPreviewPage] = useState<PDFPage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [watermarkText, setWatermarkText] = useState("");
  const [addPageNumbers, setAddPageNumbers] = useState(false);

  // Undo/Redo
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDrawingRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  const pushHistory = useCallback(
    (newPages: PDFPage[]) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIndex + 1);
        return [...trimmed, { pages: JSON.parse(JSON.stringify(newPages)) }];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setPages(prev.pages);
    setHistoryIndex((i) => i - 1);
    toast.success("Undone");
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setPages(next.pages);
    setHistoryIndex((i) => i + 1);
    toast.success("Redone");
  }, [history, historyIndex]);

  const updatePages = useCallback(
    (updater: (prev: PDFPage[]) => PDFPage[]) => {
      setPages((prev) => {
        const newPages = updater(prev);
        pushHistory(newPages);
        return newPages;
      });
    },
    [pushHistory]
  );

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf");
    if (!files.length) {
      toast.error("Please drop PDF files only");
      return;
    }
    await processFiles(files);
  }, []);

  const processFiles = async (files: File[]) => {
    setIsLoading(true);
    try {
      const startingPdfCount = loadedPDFs.length;
      const newPdfs: LoadedPDF[] = [];
      const allNewPages: Omit<PDFPage, "pageNumber">[] = [];

      for (const file of files) {
        if (file.type !== "application/pdf") {
          toast.error(`${file.name} is not a PDF file`);
          continue;
        }
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pageCount = pdfDoc.getPageCount();
        const newPdf: LoadedPDF = {
          id: crypto.randomUUID(),
          name: file.name,
          pageCount,
          data: new Uint8Array(arrayBuffer),
        };
        const pdfIndex = startingPdfCount + newPdfs.length;
        newPdfs.push(newPdf);
        for (let i = 0; i < pageCount; i++) {
          allNewPages.push({
            id: crypto.randomUUID(),
            originalPageNumber: i + 1,
            pdfIndex,
            selected: false,
            rotation: 0,
          });
        }
        toast.success(`Loaded ${file.name} (${pageCount} pages)`);
      }

      if (newPdfs.length === 0) return;
      setLoadedPDFs((prev) => [...prev, ...newPdfs]);
      setPages((prev) => {
        const base = prev.length;
        const newP = [
          ...prev,
          ...allNewPages.map((p, i) => ({ ...p, pageNumber: base + i + 1 })),
        ];
        pushHistory(newP);
        return newP;
      });
    } catch (error) {
      console.error("Error loading PDF:", error);
      toast.error("Failed to load PDF");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageSelection = (pageId: string) =>
    updatePages((prev) => prev.map((p) => (p.id === pageId ? { ...p, selected: !p.selected } : p)));
  const selectAllPages = () => updatePages((prev) => prev.map((p) => ({ ...p, selected: true })));
  const deselectAllPages = () => updatePages((prev) => prev.map((p) => ({ ...p, selected: false })));

  const movePageUp = (index: number) => {
    if (index <= 0) return;
    updatePages((prev) => {
      const n = [...prev];
      [n[index - 1], n[index]] = [n[index], n[index - 1]];
      return n.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const movePageDown = (index: number) => {
    if (index >= pages.length - 1) return;
    updatePages((prev) => {
      const n = [...prev];
      [n[index], n[index + 1]] = [n[index + 1], n[index]];
      return n.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    });
  };

  const rotatePage = (pageId: string) =>
    updatePages((prev) => prev.map((p) => (p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));

  const deleteSelectedPages = () => {
    const selectedCount = pages.filter((p) => p.selected).length;
    if (selectedCount === 0) {
      toast.error("No pages selected");
      return;
    }
    updatePages((prev) => prev.filter((p) => !p.selected).map((p, i) => ({ ...p, pageNumber: i + 1 })));
    setPreviewPage((prev) => {
      if (prev && !pages.find((p) => p.id === prev.id && !p.selected)) return null;
      return prev;
    });
    toast.success(`Deleted ${selectedCount} page(s)`);
  };

  const exportSelectedPages = async () => {
    const selectedPages = pages.filter((p) => p.selected);
    if (selectedPages.length === 0) {
      toast.error("No pages selected");
      return;
    }
    setIsSaving(true);
    try {
      const newPdf = await PDFDocument.create();
      for (const page of selectedPages) {
        const sourcePdf = loadedPDFs[page.pdfIndex];
        if (!sourcePdf) continue;
        const srcDoc = await PDFDocument.load(sourcePdf.data);
        const [copiedPage] = await newPdf.copyPages(srcDoc, [page.originalPageNumber - 1]);
        if (page.rotation !== 0) copiedPage.setRotation(degrees(page.rotation));
        newPdf.addPage(copiedPage);
      }
      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `extracted-pages-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${selectedPages.length} page(s)`);
    } catch {
      toast.error("Failed to export pages");
    } finally {
      setIsSaving(false);
    }
  };

  const exportMergedPDF = async () => {
    if (pages.length === 0) {
      toast.error("No pages to export");
      return;
    }
    setIsSaving(true);
    try {
      const newPdf = await PDFDocument.create();
      for (const page of pages) {
        const sourcePdf = loadedPDFs[page.pdfIndex];
        if (!sourcePdf) continue;
        const srcDoc = await PDFDocument.load(sourcePdf.data);
        const [copiedPage] = await newPdf.copyPages(srcDoc, [page.originalPageNumber - 1]);
        if (page.rotation !== 0) copiedPage.setRotation(degrees(page.rotation));
        newPdf.addPage(copiedPage);
      }
      const pdfBytes = await newPdf.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `merged-document-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Merged PDF exported");
    } catch {
      toast.error("Failed to merge PDF");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOCRExtract = async () => {
    if (!previewPage) {
      toast.error("Select a page first");
      return;
    }
    setOcrLoading(true);
    setOcrText(null);
    try {
      const sourcePdf = loadedPDFs[previewPage.pdfIndex];
      if (!sourcePdf) throw new Error("Source PDF not found");
      const srcDoc = await PDFDocument.load(sourcePdf.data);
      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(srcDoc, [previewPage.originalPageNumber - 1]);
      singleDoc.addPage(copied);
      const bytes = await singleDoc.save();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)));
      const { data, error } = await supabase.functions.invoke("document-ocr", {
        body: { file_base64: base64, file_type: "application/pdf", action: "extract" },
      });
      if (error) throw error;
      setOcrText(data?.text || "No text found");
      toast.success("Text extracted successfully");
    } catch (err: any) {
      toast.error(err?.message || "OCR extraction failed");
    } finally {
      setOcrLoading(false);
    }
  };

  // Signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !signatureCanvasRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e1b4b";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    if (signatureCanvasRef.current) setSignatureData(signatureCanvasRef.current.toDataURL());
  };

  const clearSignature = () => {
    if (!signatureCanvasRef.current) return;
    const ctx = signatureCanvasRef.current.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
    setSignatureData(null);
  };

  // Auto-select first page for preview
  useEffect(() => {
    if (pages.length > 0 && !previewPage) setPreviewPage({ ...pages[0] });
  }, [pages.length]);

  // Sync preview rotation
  useEffect(() => {
    if (!previewPage) return;
    const updated = pages.find((p) => p.id === previewPage.id);
    if (updated && updated.rotation !== previewPage.rotation) setPreviewPage({ ...updated });
  }, [pages]);

  // Render preview
  useEffect(() => {
    if (!previewPage) return;
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      try {
        const sourcePdf = loadedPDFs[previewPage.pdfIndex];
        if (!sourcePdf) return;
        const srcDoc = await PDFDocument.load(sourcePdf.data);
        const singleDoc = await PDFDocument.create();
        const [copied] = await singleDoc.copyPages(srcDoc, [previewPage.originalPageNumber - 1]);
        if (previewPage.rotation !== 0) copied.setRotation(degrees(previewPage.rotation));
        singleDoc.addPage(copied);
        const bytes = await singleDoc.save();
        if (cancelled) return;
        const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
      } catch (e) {
        console.error("Preview error", e);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [previewPage]);

  const selectedCount = pages.filter((p) => p.selected).length;

  const clearProject = () => {
    if (!confirm("Clear this project?")) return;
    setPages([]);
    setLoadedPDFs([]);
    setSignatureData(null);
    setPreviewPage(null);
    setProjectName("PDF Project");
    setOcrText(null);
    setHistory([]);
    setHistoryIndex(-1);
    toast.success("Project cleared");
  };

  const saveProject = () => {
    if (!pages.length) {
      toast.error("Nothing to save");
      return;
    }
    localStorage.setItem(
      `pdf-project-${Date.now()}`,
      JSON.stringify({ name: projectName, savedAt: new Date().toISOString() })
    );
    toast.success(`Project "${projectName}" saved!`);
  };

  return {
    // State
    projectName, loadedPDFs, pages, currentPage, isLoading, isSaving,
    signatureMode, signatureData, previewPage, previewUrl, previewLoading,
    ocrText, ocrLoading, watermarkText, addPageNumbers, history, historyIndex,
    selectedCount,
    // Setters
    setProjectName, setSignatureMode, setPreviewPage,
    // Actions
    undo, redo, handleFileUpload, handleDrop, togglePageSelection,
    selectAllPages, deselectAllPages, movePageUp, movePageDown, rotatePage,
    deleteSelectedPages, exportSelectedPages, exportMergedPDF, handleOCRExtract,
    startDrawing, draw, stopDrawing, clearSignature,
    clearProject, saveProject,
    // Refs
    canvasRef, signatureCanvasRef, fileInputRef,
  };
}
