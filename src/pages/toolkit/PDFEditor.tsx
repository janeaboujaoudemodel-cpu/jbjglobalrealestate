import React from "react";
import { Link } from "react-router-dom";
import { SaveProjectBar, ToolContentWrapper } from "@/components/toolkit/SaveProjectBar";
import {
  ArrowLeft, Upload, Download, FileText, Trash2, Plus, Merge, Split, Pen, Save,
  Check, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Eye,
  Sparkles, ScanLine, Wand2, Hash, Droplets, Undo, Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import usePDFEditor from "./usePDFEditor";
import { G } from "./pdfEditorTypes";

interface PDFEditorProps { embedded?: boolean; }

export default function PDFEditor({ embedded = false }: PDFEditorProps) {
  const ed = usePDFEditor();

  return (
    <div style={{ background: G.surface, minHeight: "100vh" }}>
      <input ref={ed.fileInputRef} type="file" accept=".pdf" multiple onChange={ed.handleFileUpload} className="hidden" />

      {!embedded && (
        <header style={{ borderBottom: `1px solid ${G.border}`, background: G.bg }}>
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/toolkit" className="flex items-center gap-2 transition-colors rounded-lg px-3 py-2"
              style={{ color: "rgba(255,255,255,0.45)", border: `1px solid ${G.border}` }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#fff")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)")}>
              <ArrowLeft className="h-5 w-5" /><span>Back to Royal Tools Hub</span>
            </Link>
            <Button variant="outline" size="sm" onClick={() => ed.fileInputRef.current?.click()} disabled={ed.isLoading}
              style={{ borderColor: G.border, color: "rgba(255,255,255,0.65)", background: "transparent" }}>
              <Plus className="h-4 w-4 mr-2" />Add PDF
            </Button>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: G.bg, border: `1px solid ${G.border}`, boxShadow: `0 0 32px ${G.glow}` }}>
            <FileText className="h-8 w-8" style={{ color: G.gold }} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">PDF Editor</h1>
          <p style={{ color: "rgba(255,255,255,0.4)" }}>Upload, reorder, merge, split PDFs · AI OCR · Signatures</p>
        </div>

        <div className="mb-5">
          <SaveProjectBar
            projectName={ed.projectName}
            onNameChange={ed.setProjectName}
            onSave={ed.saveProject}
            onClear={ed.clearProject}
            canSave={ed.pages.length > 0}
            accentColor={G.gold}
            accentBorder={G.border}
          />
        </div>

        <ToolContentWrapper accentColor={G.gold}>
        {ed.pages.length === 0 ? (
          <div
            className="max-w-2xl mx-auto rounded-2xl p-12 text-center cursor-pointer transition-all duration-300"
            style={{ border: `2px dashed ${G.border}`, background: G.bg }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = G.borderHover; (e.currentTarget as HTMLElement).style.background = G.bgHover; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = G.border; (e.currentTarget as HTMLElement).style.background = G.bg; }}
            onClick={() => ed.fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={ed.handleDrop}
          >
            {ed.isLoading ? (
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" style={{ color: G.gold }} />
            ) : (
              <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: G.goldDim }} />
            )}
            <p className="text-white font-semibold text-lg mb-2">{ed.isLoading ? "Loading PDF..." : "Drop your PDF files here"}</p>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>or click to browse your files</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: G.btnGradient, color: "#0E1018", boxShadow: G.btnShadow }}>
              <Upload className="h-4 w-4" />Browse PDF Files
            </div>
            <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>Supports multiple PDFs · All processing is local in your browser</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[240px_1fr_320px] gap-5">

            {/* ── Column 1: Page Thumbnails ── */}
            <div>
              <div className="rounded-2xl overflow-hidden" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(200,167,102,0.12)" }}>
                  <h3 className="text-sm font-semibold text-white">Pages ({ed.pages.length})</h3>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={ed.selectAllPages} className="h-7 text-xs text-white"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>All</Button>
                    <Button size="sm" variant="ghost" onClick={ed.deselectAllPages} className="h-7 text-xs text-white"
                      style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>None</Button>
                  </div>
                </div>
                <ScrollArea className="h-[600px]">
                  <div className="p-2 space-y-2">
                    {ed.pages.map((page, index) => {
                      const isPreviewing = ed.previewPage?.id === page.id;
                      return (
                        <div key={page.id}
                          className="rounded-xl cursor-pointer transition-all overflow-hidden"
                          style={{
                            background: isPreviewing ? G.bgHover : page.selected ? G.bg : "rgba(255,255,255,0.03)",
                            border: `${isPreviewing || page.selected ? "2px" : "1px"} solid ${isPreviewing ? G.borderHover : page.selected ? G.border : "rgba(255,255,255,0.07)"}`,
                            boxShadow: isPreviewing ? `0 0 20px ${G.glow}` : "none",
                          }}
                          onClick={() => { ed.togglePageSelection(page.id); ed.setPreviewPage({ ...page }); }}>
                          <div className="p-3 flex items-center gap-2">
                            <Checkbox checked={page.selected} onClick={(e) => e.stopPropagation()}
                              onCheckedChange={() => ed.togglePageSelection(page.id)}
                              className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                                  style={{ background: isPreviewing || page.selected ? G.bg : "rgba(255,255,255,0.08)", color: isPreviewing || page.selected ? G.gold : "rgba(255,255,255,0.55)" }}>
                                  #{page.pageNumber}
                                </span>
                                <p className="text-sm font-medium text-white">Page {page.pageNumber}</p>
                                {isPreviewing && <Eye className="h-3 w-3 shrink-0" style={{ color: G.gold }} />}
                              </div>
                              <p className="text-[10px] truncate mt-0.5" style={{ color: "rgba(255,255,255,0.32)" }}>
                                {ed.loadedPDFs[page.pdfIndex]?.name || "Unknown"}
                              </p>
                            </div>
                            <div className="flex gap-0.5 shrink-0">
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); ed.movePageUp(index); }} disabled={index === 0}
                                className="h-7 w-7 p-0 rounded-lg disabled:opacity-30"
                                style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)" }}>
                                <ChevronLeft className="h-3.5 w-3.5 rotate-90" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); ed.movePageDown(index); }} disabled={index === ed.pages.length - 1}
                                className="h-7 w-7 p-0 rounded-lg disabled:opacity-30"
                                style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)" }}>
                                <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); ed.rotatePage(page.id); }}
                                className="h-7 w-7 p-0 rounded-lg"
                                style={{ color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)" }}>
                                <RotateCw className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          {page.rotation !== 0 && (
                            <div className="px-3 pb-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: G.bg, color: G.gold }}>↻ {page.rotation}°</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* ── Column 2: Actions Panel ── */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={ed.undo} disabled={ed.historyIndex <= 0}
                    style={{ borderColor: G.border, color: "#fff", background: G.bg }}>
                    <Undo className="h-4 w-4 mr-1" />Undo
                  </Button>
                  <Button variant="outline" size="sm" onClick={ed.redo} disabled={ed.historyIndex >= ed.history.length - 1}
                    style={{ borderColor: G.border, color: "#fff", background: G.bg }}>
                    <Redo className="h-4 w-4 mr-1" />Redo
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => ed.fileInputRef.current?.click()} disabled={ed.isLoading}
                  style={{ borderColor: G.borderHover, color: "#fff", background: G.bg }}>
                  <Plus className="h-4 w-4 mr-2" />Add More PDFs
                </Button>
              </div>

              <div className="rounded-2xl p-6" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant="outline" onClick={ed.exportSelectedPages} disabled={ed.selectedCount === 0 || ed.isSaving}
                    className="text-white transition-all" style={{ borderColor: G.borderHover, background: G.bg }}>
                    <Split className="h-4 w-4 mr-2" />Extract ({ed.selectedCount})
                  </Button>
                  <Button variant="outline" onClick={ed.exportMergedPDF} disabled={ed.pages.length === 0 || ed.isSaving}
                    className="text-white transition-all" style={{ borderColor: G.borderHover, background: G.bg }}>
                    <Merge className="h-4 w-4 mr-2" />Merge All
                  </Button>
                  <Button variant="outline" onClick={ed.deleteSelectedPages} disabled={ed.selectedCount === 0}
                    className="text-red-300 border-red-500/60 bg-red-500/20 hover:bg-red-500/30">
                    <Trash2 className="h-4 w-4 mr-2" />Delete Selected
                  </Button>
                  <Button variant="outline" onClick={() => ed.setSignatureMode(!ed.signatureMode)}
                    style={{ borderColor: ed.signatureMode ? G.borderHover : G.border, color: "white", background: ed.signatureMode ? G.bgHover : G.bg }}>
                    <Pen className="h-4 w-4 mr-2" />{ed.signatureMode ? "Close Signature" : "Add Signature"}
                  </Button>
                </div>
              </div>

              {/* AI Tools */}
              <div className="rounded-2xl p-6" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" style={{ color: G.gold }} />AI Tools
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Button variant="outline" onClick={ed.handleOCRExtract} disabled={!ed.previewPage || ed.ocrLoading}
                    className="text-white transition-all" style={{ borderColor: G.border, background: G.bg }}>
                    {ed.ocrLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ScanLine className="h-4 w-4 mr-2" />}
                    AI OCR Extract
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Watermark coming soon")}
                    className="text-white transition-all" style={{ borderColor: G.border, background: G.bg }}>
                    <Droplets className="h-4 w-4 mr-2" />Add Watermark
                  </Button>
                </div>

                {ed.ocrText && (
                  <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(0,0,0,0.3)", border: `1px solid ${G.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: G.gold }}>Extracted Text</span>
                      <button onClick={() => { navigator.clipboard.writeText(ed.ocrText!); toast.success("Copied to clipboard"); }}
                        className="text-xs px-2 py-1 rounded-lg transition-colors" style={{ background: G.bg, color: G.gold, border: `1px solid ${G.border}` }}>
                        Copy
                      </button>
                    </div>
                    <pre className="text-xs text-white whitespace-pre-wrap max-h-60 overflow-y-auto" style={{ fontFamily: "monospace", lineHeight: "1.5" }}>
                      {ed.ocrText}
                    </pre>
                  </div>
                )}
              </div>

              {/* Signature Panel */}
              {ed.signatureMode && (
                <div className="rounded-2xl p-6" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                  <h3 className="text-lg font-semibold text-white mb-4">Draw Signature</h3>
                  <div className="bg-white rounded-xl p-2 mb-4">
                    <canvas ref={ed.signatureCanvasRef} width={400} height={150}
                      className="rounded cursor-crosshair w-full border border-gray-200"
                      onMouseDown={ed.startDrawing} onMouseMove={ed.draw} onMouseUp={ed.stopDrawing} onMouseLeave={ed.stopDrawing} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={ed.clearSignature} className="text-white" style={{ borderColor: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.12)" }}>Clear</Button>
                    <Button disabled={!ed.signatureData} style={{ background: G.btnGradient, color: "#0E1018", opacity: ed.signatureData ? 1 : 0.4 }}>
                      <Check className="h-4 w-4 mr-2" />Apply to Selected Pages
                    </Button>
                  </div>
                </div>
              )}

              {/* Loaded Files */}
              <div className="rounded-2xl p-6" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <h3 className="text-lg font-semibold text-white mb-4">Loaded PDFs ({ed.loadedPDFs.length})</h3>
                <div className="space-y-2">
                  {ed.loadedPDFs.map((pdf) => (
                    <div key={pdf.id} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <FileText className="h-5 w-5" style={{ color: G.gold }} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{pdf.name}</p>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{pdf.pageCount} pages</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl text-center" style={{ background: G.bg, border: "1px solid rgba(200,167,102,0.1)" }}>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>All processing is done locally in your browser · No files are uploaded to servers</p>
              </div>
            </div>

            {/* ── Column 3: Live Page Preview ── */}
            <div className="hidden lg:block">
              <div className="sticky top-6 rounded-2xl overflow-hidden" style={{ background: G.bg, border: `1px solid ${G.border}` }}>
                <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(200,167,102,0.12)" }}>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" style={{ color: G.gold }} />
                    <h3 className="text-sm font-semibold text-white">Live Preview</h3>
                  </div>
                  {ed.previewPage && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: G.bg, color: G.gold }}>Page {ed.previewPage.pageNumber}</span>
                  )}
                </div>

                <div className="p-3">
                  {!ed.previewPage ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-3" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <Eye className="h-10 w-10 opacity-30" /><p className="text-xs text-center">Click a page to preview it here</p>
                    </div>
                  ) : ed.previewLoading ? (
                    <div className="flex flex-col items-center justify-center h-80 gap-3">
                      <Loader2 className="h-8 w-8 animate-spin" style={{ color: G.gold }} />
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Rendering preview…</p>
                    </div>
                  ) : ed.previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(200,167,102,0.15)", background: "#fff" }}>
                      <iframe key={ed.previewUrl} src={`${ed.previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                        className="w-full" style={{ height: "420px", border: "none", display: "block" }}
                        title={`Preview page ${ed.previewPage.pageNumber}`} />
                      {ed.previewPage.rotation !== 0 && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                          style={{ background: "rgba(200,167,102,0.85)", color: "#0E1018", backdropFilter: "blur(4px)" }}>
                          <RotateCw className="h-3 w-3" />{ed.previewPage.rotation}°
                        </div>
                      )}
                    </div>
                  ) : null}

                  {ed.previewPage && !ed.previewLoading && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span>Source file</span>
                        <span className="truncate max-w-[160px] text-right" style={{ color: "rgba(255,255,255,0.65)" }}>
                          {ed.loadedPDFs[ed.previewPage.pdfIndex]?.name || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span>Original page</span>
                        <span style={{ color: "rgba(255,255,255,0.65)" }}>#{ed.previewPage.originalPageNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        <span>Rotation</span>
                        <span style={{ color: ed.previewPage.rotation !== 0 ? G.gold : "rgba(255,255,255,0.65)" }}>{ed.previewPage.rotation}°</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </ToolContentWrapper>
      </main>
    </div>
  );
}
