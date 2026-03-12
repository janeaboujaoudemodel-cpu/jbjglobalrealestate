import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ─────────────────────────────────────────────── */
export interface Slide {
  id: string;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  layout: "title" | "content" | "two-column" | "blank" | "image-left" | "image-right" | "stats" | "quote";
  textAlign: "left" | "center" | "right";
  fontFamily: string;
  titleSize: number;
  contentSize: number;
  notes?: string;
}

/* ── Templates ─────────────────────────────────────────── */
export const TEMPLATES = [
  { id: "corporate", name: "Corporate Gold", bg: "#1e293b", text: "#f1f5f9", accent: "#C9A84C", category: "Business", preview: "Premium corporate style" },
  { id: "business", name: "Business Blue", bg: "#0f172a", text: "#f8fafc", accent: "#3b82f6", category: "Business", preview: "Professional dark" },
  { id: "pitch", name: "Pitch Deck", bg: "#1a0a2e", text: "#f8fafc", accent: "#8b5cf6", category: "Startup", preview: "Investor-ready" },
  { id: "minimal", name: "Minimal White", bg: "#ffffff", text: "#1e293b", accent: "#64748b", category: "Minimal", preview: "Clean and modern" },
  { id: "light", name: "Light Slate", bg: "#f8fafc", text: "#0f172a", accent: "#1e40af", category: "Minimal", preview: "Bright professional" },
  { id: "bold", name: "Bold Red", bg: "#7f1d1d", text: "#fef2f2", accent: "#fbbf24", category: "Creative", preview: "High-impact" },
  { id: "nature", name: "Forest", bg: "#064e3b", text: "#d1fae5", accent: "#34d399", category: "Creative", preview: "Calm natural" },
  { id: "sunset", name: "Sunset Warm", bg: "#431407", text: "#fff7ed", accent: "#fb923c", category: "Creative", preview: "Warm inviting" },
  { id: "ocean", name: "Deep Ocean", bg: "#0c4a6e", text: "#e0f2fe", accent: "#38bdf8", category: "Creative", preview: "Cool professional" },
  { id: "portfolio", name: "Dark Portfolio", bg: "#18181b", text: "#fafafa", accent: "#a78bfa", category: "Creative", preview: "Showcase work" },
  { id: "cream", name: "Warm Cream", bg: "#fdf6e3", text: "#3c3836", accent: "#b57614", category: "Minimal", preview: "Solarized warm" },
  { id: "midnight", name: "Midnight", bg: "#020617", text: "#e2e8f0", accent: "#06b6d4", category: "Business", preview: "Dark elegant" },
  { id: "champagne", name: "Champagne Gold", bg: "#FDFBF7", text: "#1e293b", accent: "#C9A84C", category: "Business", preview: "Luxury premium" },
  { id: "emerald", name: "Emerald Night", bg: "#022c22", text: "#d1fae5", accent: "#10b981", category: "Creative", preview: "Dark emerald" },
  { id: "slate", name: "Modern Slate", bg: "#334155", text: "#f1f5f9", accent: "#f59e0b", category: "Business", preview: "Clean executive" },
  { id: "rose", name: "Rose Quartz", bg: "#fff1f2", text: "#1e293b", accent: "#e11d48", category: "Creative", preview: "Soft elegance" },
];

export const FONT_OPTIONS = [
  { label: "Sans Serif", value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Mono", value: "'Courier New', Courier, monospace" },
  { label: "Rounded", value: "'Trebuchet MS', sans-serif" },
  { label: "Modern", value: "'Segoe UI', Tahoma, sans-serif" },
];

export const AI_SLIDE_PRESETS = [
  { id: "intro", name: "Introduction", prompt: "Create a compelling introduction slide" },
  { id: "agenda", name: "Agenda", prompt: "Create an agenda slide with key topics" },
  { id: "stats", name: "Key Statistics", prompt: "Create a data-driven statistics slide" },
  { id: "quote", name: "Quote Slide", prompt: "Create an inspirational quote slide" },
  { id: "comparison", name: "Comparison", prompt: "Create a comparison table slide" },
  { id: "team", name: "Team Slide", prompt: "Create a team introduction slide" },
  { id: "market", name: "Market Overview", prompt: "Create a market overview slide" },
  { id: "property", name: "Property Feature", prompt: "Create a property feature highlight" },
  { id: "cta", name: "Call to Action", prompt: "Create a strong call-to-action closing slide" },
  { id: "global", name: "Global Reach", prompt: "Create a global presence slide" },
];

export const createSlide = (overrides: Partial<Slide> = {}): Slide => ({
  id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
  title: "New Slide",
  content: "Add your content here",
  backgroundColor: "#1e293b",
  textColor: "#f1f5f9",
  accentColor: "#C9A84C",
  layout: "content",
  textAlign: "left",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  titleSize: 48,
  contentSize: 24,
  notes: "",
  ...overrides,
});

export function hexLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const toLinear = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function isLightBg(hex: string): boolean {
  try { return hexLuminance(hex) > 0.45; } catch { return false; }
}

/* ── Hook ──────────────────────────────────────────────── */
export function usePresentations() {
  const [slides, setSlides] = useState<Slide[]>([
    createSlide({ id: "1", title: "Welcome to Your Presentation", content: "Choose a template below to get started", layout: "title", textAlign: "center" }),
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationTitle, setPresentationTitle] = useState("Untitled Presentation");
  const [showTemplates, setShowTemplates] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<string>("All");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("jbj-presentation");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.slides?.length) { setSlides(data.slides); setPresentationTitle(data.title || "Untitled Presentation"); }
      }
    } catch { /* ignore */ }
  }, []);

  const slide = slides[currentSlide];

  const addSlide = () => {
    const cur = slides[currentSlide];
    const ns = createSlide({ backgroundColor: cur.backgroundColor, textColor: cur.textColor, accentColor: cur.accentColor, fontFamily: cur.fontFamily });
    const arr = [...slides]; arr.splice(currentSlide + 1, 0, ns); setSlides(arr); setCurrentSlide(currentSlide + 1);
  };

  const deleteSlide = (index: number) => {
    if (slides.length === 1) { toast.error("Cannot delete the last slide"); return; }
    setSlides(prev => prev.filter((_, i) => i !== index));
    setCurrentSlide(i => Math.min(i, slides.length - 2));
  };

  const updateSlide = useCallback(<K extends keyof Slide>(field: K, value: Slide[K]) => {
    setSlides(prev => prev.map((s, i) => i === currentSlide ? { ...s, [field]: value } : s));
  }, [currentSlide]);

  const applyTemplate = (t: typeof TEMPLATES[0]) => {
    setSlides(prev => prev.map((s, i) => i === currentSlide ? { ...s, backgroundColor: t.bg, textColor: t.text, accentColor: t.accent } : s));
    toast.success(`Applied "${t.name}"`);
  };

  const applyTemplateToAll = (t: typeof TEMPLATES[0]) => {
    setSlides(prev => prev.map(s => ({ ...s, backgroundColor: t.bg, textColor: t.text, accentColor: t.accent })));
    toast.success(`Applied "${t.name}" to all slides`);
  };

  const nextSlide = () => setCurrentSlide(i => Math.min(i + 1, slides.length - 1));
  const prevSlide = () => setCurrentSlide(i => Math.max(i - 1, 0));

  const startPresentation = () => { setIsPresenting(true); document.documentElement.requestFullscreen?.(); };
  const exitPresentation = () => { setIsPresenting(false); document.exitFullscreen?.(); };

  const generateLocalAISlide = (prompt: string) => {
    const lowerPrompt = prompt.toLowerCase();
    let newSlide: Partial<Slide> = {
      backgroundColor: slide.backgroundColor, textColor: slide.textColor,
      accentColor: slide.accentColor, fontFamily: slide.fontFamily,
    };

    if (lowerPrompt.includes("intro") || lowerPrompt.includes("welcome")) {
      newSlide = { ...newSlide, title: "Introduction", content: "Welcome to this presentation.\n\nToday we will cover key insights, market analysis, and strategic opportunities.", layout: "title", textAlign: "center" };
    } else if (lowerPrompt.includes("agenda") || lowerPrompt.includes("outline")) {
      newSlide = { ...newSlide, title: "Agenda", content: "1. Market Overview & Current Trends\n2. Investment Opportunities\n3. Property Analysis & Insights\n4. Financial Projections\n5. Strategic Recommendations\n6. Next Steps & Action Items", layout: "content" };
    } else if (lowerPrompt.includes("stat") || lowerPrompt.includes("data") || lowerPrompt.includes("number")) {
      newSlide = { ...newSlide, title: "Key Statistics", content: "Total Transactions: 18,500+\nAverage ROI: 8.2%\nMarket Growth: 12% YoY\nActive Investors: 4,200+\nProperties Managed: 850+\nClient Satisfaction: 97%", layout: "stats" };
    } else if (lowerPrompt.includes("quote")) {
      newSlide = { ...newSlide, title: "Real estate cannot be lost or stolen, nor can it be carried away.", content: "— Franklin D. Roosevelt", layout: "quote", textAlign: "center" };
    } else if (lowerPrompt.includes("team")) {
      newSlide = { ...newSlide, title: "Our Team", content: "Jane Bou Jaoude — Founder & CEO\nAmanda Clarke — Executive Assistant\nSarah Williams — Head of Sales\nMichael Chen — Head of Marketing\nDavid Park — Chief Technology Officer", layout: "content" };
    } else if (lowerPrompt.includes("market")) {
      newSlide = { ...newSlide, title: "Market Overview", content: "Dubai's real estate market continues to demonstrate exceptional growth:\n\n• Transaction volumes up 25% year-over-year\n• Premium segment outperforming at 18% appreciation\n• Off-plan sales dominating with 60% market share\n• International buyer interest at all-time high", layout: "content" };
    } else if (lowerPrompt.includes("property") || lowerPrompt.includes("listing")) {
      newSlide = { ...newSlide, title: "Featured Property", content: "Location: Dubai Marina\nType: Luxury Penthouse\nSize: 4,200 sq ft\nBedrooms: 4 | Bathrooms: 5\nPrice: AED 12,500,000\n\nPanoramic sea views with premium finishes throughout.", layout: "content" };
    } else if (lowerPrompt.includes("thank") || lowerPrompt.includes("cta") || lowerPrompt.includes("contact") || lowerPrompt.includes("closing")) {
      newSlide = { ...newSlide, title: "Thank You", content: "Let's discuss how we can help you achieve your real estate goals.\n\nJBJ Global Real Estate\n+971 56 591 1000\nCONTACT@JBJ.AE", layout: "title", textAlign: "center" };
    } else if (lowerPrompt.includes("comparison") || lowerPrompt.includes("vs")) {
      newSlide = { ...newSlide, title: "Comparison Analysis", content: "Off-Plan vs. Ready Properties:\n\n• Payment Plans: 60/40 vs Full Payment\n• ROI Potential: Higher vs Stable\n• Availability: Wider Selection vs Limited\n• Customization: High vs Low\n• Risk Level: Moderate vs Low", layout: "two-column" };
    } else {
      newSlide = { ...newSlide, title: prompt.slice(0, 60), content: "Add your detailed content here to expand on this topic.\n\nInclude key points, data, and supporting information.", layout: "content" };
    }

    const ns = createSlide(newSlide);
    const arr = [...slides]; arr.splice(currentSlide + 1, 0, ns);
    setSlides(arr); setCurrentSlide(currentSlide + 1);
    toast.success("Slide generated");
  };

  const generateAISlide = async (prompt: string) => {
    setIsAIGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-generate-presentation-slide', {
        body: { prompt, currentTemplate: { bg: slide.backgroundColor, text: slide.textColor, accent: slide.accentColor } }
      });
      if (error) throw error;
      if (data?.slides) {
        const newSlides = data.slides.map((s: any) => createSlide({
          title: s.title || "AI Generated Slide", content: s.content || "",
          layout: s.layout || "content", textAlign: s.textAlign || "left",
          backgroundColor: slide.backgroundColor, textColor: slide.textColor,
          accentColor: slide.accentColor, fontFamily: slide.fontFamily,
        }));
        const arr = [...slides]; arr.splice(currentSlide + 1, 0, ...newSlides);
        setSlides(arr); setCurrentSlide(currentSlide + 1);
        toast.success(`Generated ${newSlides.length} slide(s)`);
      } else {
        generateLocalAISlide(prompt);
      }
    } catch {
      generateLocalAISlide(prompt);
    } finally {
      setIsAIGenerating(false); setAiPrompt("");
    }
  };

  const generateFullDeck = async (topic: string) => {
    setIsAIGenerating(true);
    const base = { backgroundColor: slide.backgroundColor, textColor: slide.textColor, accentColor: slide.accentColor, fontFamily: slide.fontFamily };
    const deckSlides = [
      createSlide({ ...base, title: topic || "Presentation", content: "Prepared by JBJ Global Real Estate", layout: "title", textAlign: "center" }),
      createSlide({ ...base, title: "Agenda", content: "1. Introduction & Context\n2. Market Analysis\n3. Key Findings\n4. Opportunities\n5. Recommendations\n6. Next Steps", layout: "content" }),
      createSlide({ ...base, title: "Market Overview", content: "Dubai's real estate sector continues to attract global investors with:\n\n• Record transaction volumes\n• Strong rental yields averaging 6-8%\n• Government initiatives supporting growth\n• World-class infrastructure development", layout: "content" }),
      createSlide({ ...base, title: "Key Statistics", content: "Total Market Value: AED 528 Billion\nAnnual Growth: 15.2%\nForeign Investment: 42%\nNew Launches: 200+ Projects\nAverage Yield: 7.1%\nOccupancy Rate: 89%", layout: "stats" }),
      createSlide({ ...base, title: "Investment is not about timing the market, but time in the market.", content: "— JBJ Global Real Estate", layout: "quote", textAlign: "center" }),
      createSlide({ ...base, title: "Strategic Recommendations", content: "Based on our analysis, we recommend:\n\n1. Diversify across premium locations\n2. Consider off-plan for higher returns\n3. Focus on high-demand unit types\n4. Leverage payment plan structures\n5. Monitor regulatory developments", layout: "content" }),
      createSlide({ ...base, title: "Thank You", content: "Let us help you make informed investment decisions.\n\nJBJ Global Real Estate\n+971 56 591 1000\nCONTACT@JBJ.AE", layout: "title", textAlign: "center" }),
    ];
    setSlides(deckSlides); setCurrentSlide(0);
    setPresentationTitle(topic || "AI Generated Presentation");
    setIsAIGenerating(false);
    toast.success("Full presentation deck generated with 7 slides");
  };

  const exportAsPDF = async () => {
    setIsExporting(true); setShowExportMenu(false);
    try {
      const jsPDF = (await import("jspdf")).jsPDF;
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] });
      const offscreen = document.createElement("div");
      offscreen.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:1920px;height:1080px;overflow:hidden;z-index:-1;";
      document.body.appendChild(offscreen);

      for (let i = 0; i < slides.length; i++) {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "width:1920px;height:1080px;";
        offscreen.innerHTML = "";
        offscreen.appendChild(wrapper);
        const s = slides[i];
        const isTitle = s.layout === "title";
        wrapper.style.backgroundColor = s.backgroundColor;
        wrapper.style.color = s.textColor;
        wrapper.style.fontFamily = s.fontFamily;
        wrapper.style.padding = "80px";
        wrapper.style.boxSizing = "border-box";
        wrapper.style.position = "relative";
        wrapper.style.display = "flex";
        wrapper.style.flexDirection = "column";
        wrapper.style.alignItems = isTitle ? "center" : "flex-start";
        wrapper.style.justifyContent = isTitle ? "center" : "flex-start";

        const bar = document.createElement("div");
        bar.style.cssText = `position:absolute;top:0;left:0;right:0;height:6px;background:${s.accentColor};`;
        wrapper.appendChild(bar);

        if (isTitle) {
          const inner = document.createElement("div");
          inner.style.cssText = "text-align:center;max-width:1400px;";
          inner.innerHTML = `
            <div style="width:60px;height:4px;background:${s.accentColor};margin:0 auto 24px;border-radius:2px;"></div>
            <h1 style="font-size:${s.titleSize}px;font-weight:800;line-height:1.2;margin:0 0 24px;color:${s.textColor};">${s.title}</h1>
            <p style="font-size:${s.contentSize}px;opacity:0.75;line-height:1.6;max-width:1000px;margin:0 auto;color:${s.textColor};">${s.content}</p>`;
          wrapper.appendChild(inner);
        } else {
          const inner = document.createElement("div");
          inner.style.cssText = "flex:1;width:100%;padding-top:20px;";
          inner.innerHTML = `
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
              <div style="width:6px;height:48px;background:${s.accentColor};border-radius:3px;flex-shrink:0;"></div>
              <h2 style="font-size:${s.titleSize * 0.75}px;font-weight:700;line-height:1.2;margin:0;text-align:${s.textAlign};color:${s.textColor};">${s.title}</h2>
            </div>
            <p style="font-size:${s.contentSize}px;line-height:1.7;opacity:0.85;text-align:${s.textAlign};max-width:1600px;white-space:pre-wrap;color:${s.textColor};">${s.content}</p>`;
          wrapper.appendChild(inner);
        }

        const num = document.createElement("div");
        num.style.cssText = `position:absolute;bottom:30px;right:60px;font-size:14px;opacity:0.35;color:${s.textColor};`;
        num.textContent = `${i + 1} / ${slides.length}`;
        wrapper.appendChild(num);

        await new Promise(r => setTimeout(r, 100));
        const canvas = await html2canvas(wrapper, { scale: 1, useCORS: true, backgroundColor: s.backgroundColor, width: 1920, height: 1080 });
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, 1920, 1080);
      }

      document.body.removeChild(offscreen);
      pdf.save(`${presentationTitle}.pdf`);
      toast.success("PDF exported successfully");
    } catch (e) {
      console.error("Export error:", e);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem("jbj-presentation", JSON.stringify({ title: presentationTitle, slides }));
      toast.success("Saved to browser storage");
    } catch { toast.error("Save failed"); }
  };

  const categories = ["All", ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const filteredTemplates = templateFilter === "All" ? TEMPLATES : TEMPLATES.filter(t => t.category === templateFilter);

  const duplicateSlide = () => {
    const arr = [...slides];
    arr.splice(currentSlide + 1, 0, { ...slide, id: Date.now().toString() });
    setSlides(arr); setCurrentSlide(currentSlide + 1);
    toast.success("Slide duplicated");
  };

  return {
    slides, setSlides, currentSlide, setCurrentSlide, slide, slideRef,
    isPresenting, presentationTitle, setPresentationTitle,
    showTemplates, setShowTemplates, isExporting,
    showExportMenu, setShowExportMenu,
    templateFilter, setTemplateFilter,
    showAIPanel, setShowAIPanel, aiPrompt, setAiPrompt, isAIGenerating,
    showNotes, setShowNotes, showGrid, setShowGrid,
    // Actions
    addSlide, deleteSlide, updateSlide,
    applyTemplate, applyTemplateToAll,
    nextSlide, prevSlide, startPresentation, exitPresentation,
    generateAISlide, generateLocalAISlide, generateFullDeck,
    exportAsPDF, saveToStorage, duplicateSlide,
    // Derived
    categories, filteredTemplates,
  };
}
