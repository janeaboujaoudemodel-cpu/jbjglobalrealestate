import {
  Plus, Trash2, ChevronLeft, ChevronRight, Play, Download,
  FileText, Presentation, Palette, AlignLeft, AlignCenter, AlignRight,
  Save, Share2, X, Sparkles, LayoutGrid, FileDown, Copy,
  ArrowLeft, Layers, Wand2, Zap, BookOpen, Target, TrendingUp, Users, Building2,
  BarChart3, List, Quote, Table, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  usePresentations, TEMPLATES, FONT_OPTIONS, AI_SLIDE_PRESETS,
  isLightBg, type Slide,
} from "@/pages/usePresentations";

/* ── Icon map for AI presets ──────────────────────────── */
const PRESET_ICONS: Record<string, React.FC<{ className?: string }>> = {
  intro: BookOpen, agenda: List, stats: BarChart3, quote: Quote,
  comparison: Table, team: Users, market: TrendingUp, property: Building2,
  cta: Target, global: Globe,
};

/* ── SlideCanvas ──────────────────────────────────────── */
const SlideCanvas = ({ s, slideIndex, totalSlides }: { s: Slide; slideIndex: number; totalSlides: number }) => {
  const isTitle = s.layout === "title";
  const isQuote = s.layout === "quote";

  return (
    <div style={{
      width: "1920px", height: "1080px", backgroundColor: s.backgroundColor, color: s.textColor, fontFamily: s.fontFamily,
      display: "flex", flexDirection: "column",
      alignItems: isTitle || isQuote ? "center" : "flex-start",
      justifyContent: isTitle || isQuote ? "center" : "flex-start",
      padding: "80px", position: "relative", boxSizing: "border-box", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "6px", background: s.accentColor }} />
      {isQuote ? (
        <div style={{ textAlign: "center", maxWidth: "1200px" }}>
          <div style={{ fontSize: "120px", lineHeight: 0.8, opacity: 0.15, color: s.accentColor, fontFamily: "Georgia, serif" }}>"</div>
          <p style={{ fontSize: `${s.titleSize}px`, fontWeight: 600, lineHeight: 1.4, fontStyle: "italic", color: s.textColor, margin: "0 0 32px" }}>{s.title}</p>
          <div style={{ width: "60px", height: "3px", background: s.accentColor, margin: "0 auto 16px" }} />
          <p style={{ fontSize: `${s.contentSize}px`, opacity: 0.7, color: s.textColor }}>{s.content}</p>
        </div>
      ) : isTitle ? (
        <div style={{ textAlign: "center", maxWidth: "1400px" }}>
          <div style={{ width: "60px", height: "4px", background: s.accentColor, margin: "0 auto 24px", borderRadius: "2px" }} />
          <h1 style={{ fontSize: `${s.titleSize}px`, fontWeight: 800, lineHeight: 1.2, margin: "0 0 24px", color: s.textColor }}>{s.title}</h1>
          <p style={{ fontSize: `${s.contentSize}px`, opacity: 0.75, lineHeight: 1.6, maxWidth: "1000px", margin: "0 auto", color: s.textColor }}>{s.content}</p>
        </div>
      ) : (
        <div style={{ flex: 1, width: "100%", paddingTop: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
            <div style={{ width: "6px", height: "48px", background: s.accentColor, borderRadius: "3px", flexShrink: 0 }} />
            <h2 style={{ fontSize: `${s.titleSize * 0.75}px`, fontWeight: 700, lineHeight: 1.2, margin: 0, textAlign: s.textAlign, color: s.textColor }}>{s.title}</h2>
          </div>
          <p style={{ fontSize: `${s.contentSize}px`, lineHeight: 1.7, opacity: 0.85, textAlign: s.textAlign, maxWidth: "1600px", whiteSpace: "pre-wrap", color: s.textColor }}>{s.content}</p>
        </div>
      )}
      <div style={{ position: "absolute", bottom: "30px", right: "60px", fontSize: "14px", opacity: 0.35, color: s.textColor }}>{slideIndex + 1} / {totalSlides}</div>
    </div>
  );
};

/* ── Main Component ───────────────────────────────────── */
const Presentations = () => {
  const h = usePresentations();
  const previewScale = 0.48;

  /* Grid View */
  if (h.showGrid) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <div className="border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between bg-zinc-900/90 backdrop-blur flex-shrink-0">
          <div className="flex items-center gap-3"><Presentation className="w-5 h-5 text-[#C9A84C]" /><span className="text-base font-semibold">{h.presentationTitle}</span></div>
          <Button variant="outline" size="sm" onClick={() => h.setShowGrid(false)} className="border-zinc-700 text-zinc-300"><X className="w-3.5 h-3.5 mr-1.5" /> Close Grid</Button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {h.slides.map((s, index) => (
              <div key={s.id} className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:shadow-lg ${index === h.currentSlide ? "border-[#C9A84C] shadow-lg shadow-[#C9A84C]/20" : "border-zinc-700 hover:border-zinc-500"}`} onClick={() => { h.setCurrentSlide(index); h.setShowGrid(false); }}>
                <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: s.backgroundColor }}>
                  <div style={{ transform: "scale(0.14)", transformOrigin: "top left", width: "1920px", height: "1080px", pointerEvents: "none" }}><SlideCanvas s={s} slideIndex={index} totalSlides={h.slides.length} /></div>
                </div>
                <div className="bg-zinc-900 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{index + 1}. {s.title.slice(0, 30)}</span>
                  <button className="p-1 text-red-400 hover:bg-red-900/30 rounded transition-colors" onClick={(e) => { e.stopPropagation(); h.deleteSlide(index); }}><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
            <div className="cursor-pointer rounded-xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 flex items-center justify-center aspect-video transition-all" onClick={h.addSlide}>
              <div className="text-center"><Plus className="w-6 h-6 text-zinc-500 mx-auto mb-2" /><span className="text-xs text-zinc-500">Add Slide</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* Fullscreen presentation */
  if (h.isPresenting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={(e) => { if (e.clientX > window.innerWidth / 2) h.nextSlide(); else h.prevSlide(); }} onKeyDown={(e) => { if (e.key === "Escape") h.exitPresentation(); if (e.key === "ArrowRight" || e.key === " ") h.nextSlide(); if (e.key === "ArrowLeft") h.prevSlide(); if (e.key === "g") h.setShowGrid(true); }} tabIndex={0} autoFocus>
        <div style={{ transform: `scale(${Math.min(window.innerWidth / 1920, window.innerHeight / 1080)})`, transformOrigin: "center center" }}><SlideCanvas s={h.slide} slideIndex={h.currentSlide} totalSlides={h.slides.length} /></div>
        <button onClick={(e) => { e.stopPropagation(); h.exitPresentation(); }} className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors z-10"><X className="w-5 h-5 text-white" /></button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-sm px-5 py-2.5 rounded-full">
          <span className="text-white/70 text-sm font-medium">{h.currentSlide + 1} / {h.slides.length}</span>
          <span className="text-white/40 text-xs">Click or arrow keys to navigate</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between bg-zinc-900/90 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/ai-hub" className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"><ArrowLeft className="w-4 h-4 text-zinc-400" /></Link>
          <Presentation className="w-5 h-5 text-[#C9A84C]" />
          <input value={h.presentationTitle} onChange={(e) => h.setPresentationTitle(e.target.value)} className="bg-transparent border-none text-base font-semibold text-white w-56 focus:outline-none focus:ring-0 placeholder:text-zinc-500" />
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => h.setShowGrid(!h.showGrid)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"><LayoutGrid className="w-3.5 h-3.5" /> Grid</button>
          <button onClick={() => h.setShowAIPanel(!h.showAIPanel)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-lg transition-all border border-[#C9A84C]/30"><Wand2 className="w-3.5 h-3.5" /> AI Generate</button>
          <button onClick={h.saveToStorage} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"><Save className="w-3.5 h-3.5" /> Save</button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"><Share2 className="w-3.5 h-3.5" /> Share</button>
          <div className="relative">
            <button onClick={() => h.setShowExportMenu(!h.showExportMenu)} disabled={h.isExporting} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all border border-[#C9A84C]/60 disabled:opacity-50" style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)", color: "#1e293b" }}>
              {h.isExporting ? <span className="animate-pulse">Exporting...</span> : <><FileDown className="w-3.5 h-3.5" /> Export</>}
            </button>
            {h.showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-50 min-w-[160px]">
                <button onClick={h.exportAsPDF} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"><FileText className="w-4 h-4 text-red-400" /> Export PDF</button>
              </div>
            )}
          </div>
          <button onClick={h.startPresentation} className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all border border-[#C9A84C]/60" style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)", color: "#1e293b" }}><Play className="w-3.5 h-3.5" /> Present</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slide Thumbnails */}
        <div className="w-44 border-r border-zinc-800 bg-zinc-900/50 overflow-y-auto flex-shrink-0 p-2 space-y-2">
          {h.slides.map((s, index) => (
            <div key={s.id} className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all group ${index === h.currentSlide ? "border-[#C9A84C] shadow-lg shadow-[#C9A84C]/20" : "border-zinc-700 hover:border-zinc-500"}`} onClick={() => h.setCurrentSlide(index)}>
              <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: s.backgroundColor }}>
                <div style={{ transform: "scale(0.085)", transformOrigin: "top left", width: "1920px", height: "1080px", pointerEvents: "none" }}><SlideCanvas s={s} slideIndex={index} totalSlides={h.slides.length} /></div>
              </div>
              <div className="absolute bottom-0.5 left-1 text-[9px] font-medium" style={{ color: isLightBg(s.backgroundColor) ? "#374151" : "#a1a1aa" }}>{index + 1}</div>
              <button className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600/90 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" onClick={(e) => { e.stopPropagation(); h.deleteSlide(index); }}><X className="w-2.5 h-2.5 text-white" /></button>
            </div>
          ))}
          <button onClick={h.addSlide} className="w-full py-2 text-xs text-zinc-400 hover:text-white border border-dashed border-zinc-700 hover:border-zinc-500 rounded-lg flex items-center justify-center gap-1 transition-all"><Plus className="w-3 h-3" /> Add Slide</button>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 overflow-auto flex flex-col items-center p-6 bg-zinc-950">
          {/* AI Panel */}
          {h.showAIPanel && (
            <div className="w-full mb-5 bg-zinc-900/80 border border-[#C9A84C]/30 rounded-2xl p-5" style={{ maxWidth: `${1920 * previewScale + 40}px` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Wand2 className="w-4 h-4 text-[#C9A84C]" /><h3 className="text-sm font-semibold text-zinc-200">AI Slide Generator</h3></div>
                <button onClick={() => h.setShowAIPanel(false)} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-4">
                {AI_SLIDE_PRESETS.map(preset => {
                  const Icon = PRESET_ICONS[preset.id] || Sparkles;
                  return (
                    <button key={preset.id} onClick={() => h.generateLocalAISlide(preset.prompt)} disabled={h.isAIGenerating} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-zinc-700 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 transition-all text-center disabled:opacity-50">
                      <Icon className="w-4 h-4 text-[#C9A84C]" /><span className="text-[10px] text-zinc-400">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mb-3">
                <Textarea value={h.aiPrompt} onChange={(e) => h.setAiPrompt(e.target.value)} placeholder="Describe the slide you want to create..." className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-200 text-sm resize-none min-h-[60px]" rows={2} />
                <div className="flex flex-col gap-1.5">
                  <Button size="sm" onClick={() => h.generateAISlide(h.aiPrompt)} disabled={!h.aiPrompt.trim() || h.isAIGenerating} className="bg-[#C9A84C] text-black hover:bg-[#b8963d] text-xs">
                    {h.isAIGenerating ? <Zap className="w-3.5 h-3.5 animate-pulse" /> : <Sparkles className="w-3.5 h-3.5" />} Generate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => h.generateFullDeck(h.aiPrompt || h.presentationTitle)} disabled={h.isAIGenerating} className="border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/10 text-xs"><Layers className="w-3.5 h-3.5" /> Full Deck</Button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500">Tip: Use "Full Deck" to generate a complete 7-slide presentation instantly.</p>
            </div>
          )}

          {/* Controls */}
          <div className="w-full flex items-center justify-between mb-4" style={{ maxWidth: `${1920 * previewScale + 40}px` }}>
            <div className="flex items-center gap-2 text-xs text-zinc-400"><Layers className="w-3.5 h-3.5" /><span>Slide {h.currentSlide + 1} of {h.slides.length}</span></div>
            <div className="flex items-center gap-2">
              <button onClick={() => h.setShowNotes(!h.showNotes)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"><FileText className="w-3.5 h-3.5" />{h.showNotes ? "Hide Notes" : "Notes"}</button>
              <button onClick={() => h.setShowTemplates(!h.showTemplates)} className="flex items-center gap-1.5 text-xs font-medium text-[#C9A84C] hover:text-[#b8963d] transition-colors"><Palette className="w-3.5 h-3.5" />{h.showTemplates ? "Hide Templates" : "Choose Template"}</button>
            </div>
          </div>

          {/* Template Gallery */}
          {h.showTemplates && (
            <div className="w-full mb-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5" style={{ maxWidth: `${1920 * previewScale + 40}px` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-zinc-200">Templates</h3>
                <div className="flex items-center gap-1">
                  {h.categories.map(cat => (
                    <button key={cat} onClick={() => h.setTemplateFilter(cat)} className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${h.templateFilter === cat ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"}`}>{cat}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                {h.filteredTemplates.map(t => (
                  <div key={t.id} className="group cursor-pointer" onClick={() => h.applyTemplate(t)}>
                    <div className="aspect-video rounded-xl overflow-hidden border-2 border-zinc-700/60 group-hover:border-[#C9A84C] transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-[#C9A84C]/10 relative">
                      <div className="w-full h-full flex flex-col p-2.5 relative" style={{ backgroundColor: t.bg }}>
                        <div style={{ height: "2px", background: t.accent, marginBottom: "6px", borderRadius: "1px" }} />
                        <div className="text-[8px] font-bold leading-tight" style={{ color: t.text }}>{t.name}</div>
                        <div className="text-[6px] mt-0.5 opacity-60" style={{ color: t.text }}>{t.preview}</div>
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-end justify-center pb-1.5 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); h.applyTemplateToAll(t); }} className="text-[8px] px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors backdrop-blur-sm">Apply to all</button>
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 text-center mt-1.5 truncate group-hover:text-zinc-200 transition-colors">{t.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Slide Preview */}
          <div className="relative rounded-xl overflow-hidden shadow-2xl border border-zinc-700/50 mb-4" style={{ width: `${1920 * previewScale}px`, height: `${1080 * previewScale}px` }}>
            <div ref={h.slideRef} style={{ transform: `scale(${previewScale})`, transformOrigin: "top left", width: "1920px", height: "1080px" }}><SlideCanvas s={h.slide} slideIndex={h.currentSlide} totalSlides={h.slides.length} /></div>
            <div className="absolute inset-0 flex flex-col" style={{ padding: `${80 * previewScale}px`, paddingTop: `${86 * previewScale}px`, fontFamily: h.slide.fontFamily, color: h.slide.textColor, alignItems: h.slide.layout === "title" || h.slide.layout === "quote" ? "center" : "flex-start", justifyContent: h.slide.layout === "title" || h.slide.layout === "quote" ? "center" : "flex-start" }}>
              {h.slide.layout === "title" || h.slide.layout === "quote" ? (
                <div className="text-center w-full">
                  <input value={h.slide.title} onChange={(e) => h.updateSlide("title", e.target.value)} className="bg-transparent border-none outline-none font-extrabold text-center w-full placeholder:opacity-40 cursor-text" style={{ fontSize: `${h.slide.titleSize * previewScale}px`, color: h.slide.textColor }} placeholder="Slide Title" />
                  <textarea value={h.slide.content} onChange={(e) => h.updateSlide("content", e.target.value)} className="bg-transparent border-none outline-none text-center w-full resize-none mt-2 placeholder:opacity-40 cursor-text" style={{ fontSize: `${h.slide.contentSize * previewScale}px`, color: h.slide.textColor, opacity: 0.8 }} placeholder="Subtitle..." rows={3} />
                </div>
              ) : (
                <div className="w-full flex-1" style={{ paddingTop: `${20 * previewScale}px` }}>
                  <input value={h.slide.title} onChange={(e) => h.updateSlide("title", e.target.value)} className="bg-transparent border-none outline-none font-bold w-full placeholder:opacity-40 cursor-text block" style={{ fontSize: `${h.slide.titleSize * 0.75 * previewScale}px`, color: h.slide.textColor, textAlign: h.slide.textAlign, paddingLeft: `${22 * previewScale}px` }} placeholder="Slide Title" />
                  <textarea value={h.slide.content} onChange={(e) => h.updateSlide("content", e.target.value)} className="bg-transparent border-none outline-none w-full resize-none mt-4 placeholder:opacity-40 cursor-text" style={{ fontSize: `${h.slide.contentSize * previewScale}px`, color: h.slide.textColor, opacity: 0.85, textAlign: h.slide.textAlign, minHeight: "200px", lineHeight: 1.7 }} placeholder="Add content..." rows={6} />
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button onClick={h.prevSlide} disabled={h.currentSlide === 0} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg transition-all text-zinc-300"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-zinc-400 text-sm min-w-[80px] text-center">{h.currentSlide + 1} / {h.slides.length}</span>
            <button onClick={h.nextSlide} disabled={h.currentSlide === h.slides.length - 1} className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg transition-all text-zinc-300"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {/* Speaker Notes */}
          {h.showNotes && (
            <div className="w-full mt-4 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4" style={{ maxWidth: `${1920 * previewScale + 40}px` }}>
              <div className="flex items-center gap-2 mb-2"><FileText className="w-3.5 h-3.5 text-zinc-400" /><span className="text-xs font-medium text-zinc-400">Speaker Notes</span></div>
              <Textarea value={h.slide.notes || ""} onChange={(e) => h.updateSlide("notes", e.target.value)} placeholder="Add speaker notes for this slide..." className="bg-zinc-800 border-zinc-700 text-zinc-300 text-sm resize-none min-h-[80px]" rows={3} />
            </div>
          )}
        </div>

        {/* Properties Panel */}
        <div className="w-60 border-l border-zinc-800 bg-zinc-900/50 overflow-y-auto flex-shrink-0 p-3 space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Slide Properties</h3>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Layout</label>
            <div className="grid grid-cols-2 gap-1">
              {(["title", "content", "two-column", "blank", "quote", "stats"] as const).map(layout => (
                <button key={layout} className={`py-1.5 text-xs rounded-lg capitalize transition-all ${h.slide.layout === layout ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/50 font-semibold" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-transparent"}`} onClick={() => h.updateSlide("layout", layout)}>{layout}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Font</label>
            <select value={h.slide.fontFamily} onChange={(e) => h.updateSlide("fontFamily", e.target.value)} className="w-full bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:outline-none focus:border-[#C9A84C]">
              {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">Alignment</label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map(align => (
                <button key={align} onClick={() => h.updateSlide("textAlign", align)} className={`flex-1 py-1.5 rounded-lg flex items-center justify-center transition-all ${h.slide.textAlign === align ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/50" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-transparent"}`}>
                  {align === "left" && <AlignLeft className="w-3 h-3" />}{align === "center" && <AlignCenter className="w-3 h-3" />}{align === "right" && <AlignRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wide">Title Size: {h.slide.titleSize}px</label>
            <input type="range" min={24} max={96} value={h.slide.titleSize} onChange={(e) => h.updateSlide("titleSize", +e.target.value)} className="w-full accent-[#C9A84C]" />
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 mb-1 block uppercase tracking-wide">Content Size: {h.slide.contentSize}px</label>
            <input type="range" min={14} max={48} value={h.slide.contentSize} onChange={(e) => h.updateSlide("contentSize", +e.target.value)} className="w-full accent-[#C9A84C]" />
          </div>
          {[
            { label: "Background", field: "backgroundColor" as const },
            { label: "Text Color", field: "textColor" as const },
            { label: "Accent Color", field: "accentColor" as const },
          ].map(c => (
            <div key={c.field}>
              <label className="text-[10px] text-zinc-500 mb-1.5 block uppercase tracking-wide">{c.label}</label>
              <div className="flex items-center gap-2">
                <input type="color" value={h.slide[c.field]} onChange={(e) => h.updateSlide(c.field, e.target.value)} className="w-8 h-8 rounded-lg border border-zinc-600 cursor-pointer bg-transparent" />
                <span className="text-xs text-zinc-400 font-mono">{h.slide[c.field]}</span>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <button onClick={h.duplicateSlide} className="w-full py-2 text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all flex items-center justify-center gap-1.5"><Copy className="w-3 h-3" /> Duplicate Slide</button>
            <button onClick={() => h.deleteSlide(h.currentSlide)} className="w-full py-2 text-xs text-red-400 hover:text-red-300 bg-zinc-800 hover:bg-red-900/30 rounded-lg transition-all flex items-center justify-center gap-1.5"><Trash2 className="w-3 h-3" /> Delete Slide</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Presentations;
