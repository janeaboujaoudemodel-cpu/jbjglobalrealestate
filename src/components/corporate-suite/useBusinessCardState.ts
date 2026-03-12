import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EMPTY_LANDING_PAGE, type LandingPageData } from "@/components/corporate-suite/DigitalLandingPageEditor";

import {
  type Template, type CardShape, type QrPosition, type QrContentType, type TextAlign,
  type GradientDirection, type FinishEffect, type MockupScene, type CardData,
  type BilingualMode, type BilingualLanguage, type FieldPos, type AiDesignData,
  BILINGUAL_LANGUAGES, COLOR_PRESETS, DEFAULT_FIELD_POSITIONS, DEFAULT_LOGO_POS,
  buildQrData,
} from "./businessCardTypes";
import { exportCardAsPDF, exportDigitalCardAsHtml } from "./businessCardExport";

export function useBusinessCardState() {
  // Per-side independent templates
  const [frontTemplate, setFrontTemplate] = useState<Template>("modern");
  const [backTemplate, setBackTemplate]   = useState<Template>("bold");

  // Per-side colors
  const [frontColorIdx, setFrontColorIdx] = useState(0);
  const [backColorIdx,  setBackColorIdx]  = useState(8);
  const [frontCustomColor, setFrontCustomColor] = useState("");
  const [backCustomColor,  setBackCustomColor]  = useState("");

  const [side, setSide]         = useState<"front" | "back">("front");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cardLicenseCode, setCardLicenseCode] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(true);
  const [logoUrl, setLogoUrl]   = useState("");
  const [logoSize, setLogoSize] = useState(60);
  const [logoPos, setLogoPos]   = useState({ ...DEFAULT_LOGO_POS });

  // Card shape
  const [cardShape, setCardShape] = useState<CardShape>("horizontal");
  const [shapeOpen, setShapeOpen] = useState(true);
  const [nfcGuideOpen, setNfcGuideOpen] = useState(false);

  // Drag-to-rearrange
  const [editLayout, setEditLayout] = useState(false);
  const [fieldPositions, setFieldPositions] = useState({ ...DEFAULT_FIELD_POSITIONS });

  // QR Code
  const [qrOpen, setQrOpen]             = useState(false);
  const [qrEnabled, setQrEnabled]       = useState(false);
  const [qrContentType, setQrContentType] = useState<QrContentType>("url");
  const [qrCustomContent, setQrCustomContent] = useState("");
  const [qrSize, setQrSize]             = useState(80);
  const [qrColor, setQrColor]           = useState("");
  const [qrBgColor, setQrBgColor]       = useState("#ffffff");
  const [qrPosition, setQrPosition]     = useState<QrPosition>("bottom-right");
  const [qrSide, setQrSide]             = useState<"front" | "back" | "both">("both");
  const [qrAiPrompt, setQrAiPrompt]     = useState("");
  const [isAiStylingQr, setIsAiStylingQr] = useState(false);

  // AI Design template
  const [aiDesignOpen, setAiDesignOpen] = useState(false);
  const [aiIndustry, setAiIndustry] = useState("real-estate");
  const [aiTone, setAiTone] = useState("modern");
  const [aiStyle, setAiStyle] = useState("geometric");
  const [aiDesignData, setAiDesignData] = useState<AiDesignData | null>(null);
  const [isGeneratingDesign, setIsGeneratingDesign] = useState(false);

  // Typography
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [cardFontFamily, setCardFontFamily] = useState("'Helvetica Neue', Arial, sans-serif");
  const [cardFontBold, setCardFontBold] = useState(false);
  const [cardFontItalic, setCardFontItalic] = useState(false);
  const [cardFontSize, setCardFontSize] = useState<number | null>(null);
  const [cardTextAlign, setCardTextAlign] = useState<TextAlign>("left");
  const [cardUnderline, setCardUnderline] = useState(false);
  const [cardLetterSpacing, setCardLetterSpacing] = useState(0);
  const [cardLineHeight, setCardLineHeight] = useState(1.2);

  // Gradient colors
  const [useGradient, setUseGradient] = useState(false);
  const [gradientEnd, setGradientEnd] = useState("#C8A766");
  const [gradientDirection, setGradientDirection] = useState<GradientDirection>("135deg");

  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryPrompt, setGalleryPrompt] = useState("");
  const [galleryDesigns, setGalleryDesigns] = useState<(AiDesignData & { id: string; name: string; category?: string })[]>([]);
  const [galleryFavorites, setGalleryFavorites] = useState<string[]>([]);
  const [isGeneratingGallery, setIsGeneratingGallery] = useState(false);
  const [galleryPage, setGalleryPage] = useState(0);
  const GALLERY_PER_PAGE = 12;

  // Trade license auto-fill
  const [tradeLicenseOpen, setTradeLicenseOpen] = useState(false);

  // Load saved designs
  const [loadSavedOpen, setLoadSavedOpen] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<{ id: string; name: string; created_at: string; metadata: any }[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isDeletingSaved, setIsDeletingSaved] = useState<string | null>(null);

  // PNG export
  const cardPreviewRef = useRef<HTMLDivElement>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Batch print
  const [batchPrintOpen, setBatchPrintOpen] = useState(false);
  const [batchPrintCount, setBatchPrintCount] = useState(8);

  const [data, setData] = useState<CardData>({
    name: "", title: "", company: "", phone: "", email: "", website: "", address: "",
  });

  // Bilingual
  const [bilingualMode, setBilingualMode] = useState<BilingualMode>("off");
  const [bilingualLang, setBilingualLang] = useState<BilingualLanguage>("ar");
  const [bilingualOpen, setBilingualOpen] = useState(false);
  const [secondaryData, setSecondaryData] = useState<CardData>({
    name: "", title: "", company: "", phone: "", email: "", website: "", address: "",
  });
  const bilingualDir = BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.dir || "ltr";

  // Inline editing
  const [inlineEditField, setInlineEditField] = useState<keyof CardData | null>(null);

  // Landing page data (Digital mode)
  const [landingPageData, setLandingPageData] = useState<LandingPageData>({ ...EMPTY_LANDING_PAGE });
  const [digitalTab, setDigitalTab] = useState<"card" | "landing">("card");

  // Finishing effects
  const [finishEffect, setFinishEffect] = useState<FinishEffect>("none");
  const [finishOpen, setFinishOpen] = useState(false);

  // Mockup previews
  const [mockupScene, setMockupScene] = useState<MockupScene>("none");
  const [mockupOpen, setMockupOpen] = useState(false);

  // ── Derived values ──────────────────────────────────────────
  const frontPreset = COLOR_PRESETS[frontColorIdx];
  const backPreset  = COLOR_PRESETS[backColorIdx];
  const frontPrimary   = frontCustomColor || frontPreset.primary;
  const frontSecondary = frontPreset.secondary;
  const frontAccent    = frontPreset.accent;
  const backPrimary    = backCustomColor  || backPreset.primary;
  const backSecondary  = backPreset.secondary;
  const backAccent     = backPreset.accent;

  const effectiveQrColor = qrColor || frontPrimary;

  const activeTemplate = side === "front" ? frontTemplate : backTemplate;
  const setActiveTemplate = (t: Template) => {
    if (side === "front") setFrontTemplate(t);
    else setBackTemplate(t);
  };

  const qrDataStr = buildQrData(qrContentType, data, qrCustomContent);

  // ── Handlers ────────────────────────────────────────────────
  const set = (k: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, [k]: e.target.value }));

  const handleExtractedCard = (extracted: Record<string, unknown>) => {
    setData(prev => ({
      ...prev,
      name:    extracted.name    ? String(extracted.name)    : prev.name,
      title:   extracted.title   ? String(extracted.title)   : prev.title,
      company: extracted.company ? String(extracted.company) : prev.company,
      phone:   extracted.phone   ? String(extracted.phone)   : prev.phone,
      email:   extracted.email   ? String(extracted.email)   : prev.email,
      website: extracted.website ? String(extracted.website) : prev.website,
      address: extracted.address ? String(extracted.address) : prev.address,
    }));
  };

  const handleFieldMove = (field: keyof typeof DEFAULT_FIELD_POSITIONS, pos: FieldPos) => {
    setFieldPositions(prev => ({ ...prev, [field]: pos }));
  };

  const handleAiQrStyle = async () => {
    if (!qrAiPrompt.trim()) return;
    setIsAiStylingQr(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          message: `You are a QR code designer. Based on this description: "${qrAiPrompt}", return ONLY valid JSON with these fields:
{
  "color": "#hexcolor",
  "bgColor": "#hexcolor",
  "size": <number between 50-200>,
  "position": "<one of: bottom-right, bottom-left, top-right, top-left, center>"
}
The current card primary color is ${frontPrimary}. Return only the JSON, no other text.`,
        },
      });
      if (error) throw error;
      const text = result?.reply || result?.message || result?.content || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.color)    setQrColor(parsed.color);
        if (parsed.bgColor)  setQrBgColor(parsed.bgColor);
        if (parsed.size)     setQrSize(Math.min(200, Math.max(50, parsed.size)));
        if (parsed.position) setQrPosition(parsed.position as QrPosition);
        toast.success("AI applied QR styling!");
      } else {
        toast.error("AI response wasn't in the expected format.");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI styling failed. Please try again.");
    } finally {
      setIsAiStylingQr(false);
    }
  };

  const handleGenerateDesign = async () => {
    setIsGeneratingDesign(true);
    const seed = Math.random().toString(36).slice(2, 8);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-card-design-generator", {
        body: { tone: aiTone, style: aiStyle, industry: aiIndustry, seed },
      });
      if (error) throw error;
      if (!result?.elements) throw new Error("No elements in response");
      const design: AiDesignData = { ...result, style: aiStyle, industry: aiIndustry };
      setAiDesignData(design);
      setActiveTemplate("ai-design");
      toast.success("AI design generated!");
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("Rate limit")) toast.error("Rate limit exceeded. Please try again in a moment.");
      else if (err?.message?.includes("credits")) toast.error("AI credits required. Please add credits to continue.");
      else toast.error("Design generation failed. Please try again.");
    } finally {
      setIsGeneratingDesign(false);
    }
  };

  const handleGenerateGallery = async () => {
    setIsGeneratingGallery(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("ai-card-gallery-generator", {
        body: { prompt: galleryPrompt, industry: aiIndustry, tone: aiTone, count: GALLERY_PER_PAGE },
      });
      if (error) throw error;
      if (!result?.designs) throw new Error("No designs returned");
      setGalleryDesigns(prev => [...prev, ...result.designs]);
      setGalleryPage(prev => prev + 1);
      toast.success(`${result.designs.length} designs generated!`);
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes("Rate limit")) toast.error("Rate limit exceeded. Please wait a moment.");
      else if (err?.message?.includes("credits")) toast.error("AI credits required.");
      else toast.error("Gallery generation failed. Please try again.");
    } finally {
      setIsGeneratingGallery(false);
    }
  };

  const toggleGalleryFavorite = (id: string) => {
    setGalleryFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : prev.length < 5 ? [...prev, id] : prev
    );
  };

  const applyGalleryDesign = (design: AiDesignData & { id: string; name: string }) => {
    setAiDesignData(design);
    setActiveTemplate("ai-design");
    toast.success(`Applied: ${design.name}`);
  };

  const handleTradeLicenseExtracted = (extracted: Record<string, unknown>) => {
    setData(prev => ({
      ...prev,
      name:    extracted.owner_name ? String(extracted.owner_name) : (extracted.name ? String(extracted.name) : prev.name),
      company: extracted.company_name ? String(extracted.company_name) : (extracted.company ? String(extracted.company) : prev.company),
      phone:   extracted.phone   ? String(extracted.phone)   : prev.phone,
      email:   extracted.email   ? String(extracted.email)   : prev.email,
      website: extracted.website ? String(extracted.website) : prev.website,
      address: extracted.address ? String(extracted.address) : prev.address,
      title:   extracted.position ? String(extracted.position) : (extracted.title ? String(extracted.title) : prev.title),
    }));
    toast.success("Trade license data extracted & applied!");
  };

  const handleLoadSavedDesigns = async () => {
    setIsLoadingSaved(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in to view saved cards."); return; }
      const { data: assets, error } = await supabase
        .from("design_assets")
        .select("id, name, created_at, metadata")
        .eq("user_id", user.id)
        .eq("asset_type", "business_card")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setSavedDesigns(assets || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load saved designs.");
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleRestoreSaved = (metadata: any) => {
    if (!metadata) return;
    if (metadata.data) setData(metadata.data);
    if (metadata.frontTemplate) setFrontTemplate(metadata.frontTemplate);
    if (metadata.backTemplate) setBackTemplate(metadata.backTemplate);
    if (metadata.frontColorIdx != null) setFrontColorIdx(metadata.frontColorIdx);
    if (metadata.backColorIdx != null) setBackColorIdx(metadata.backColorIdx);
    if (metadata.frontCustomColor != null) setFrontCustomColor(metadata.frontCustomColor);
    if (metadata.backCustomColor != null) setBackCustomColor(metadata.backCustomColor);
    if (metadata.cardShape) setCardShape(metadata.cardShape);
    if (metadata.qrEnabled != null) setQrEnabled(metadata.qrEnabled);
    if (metadata.qrContentType) setQrContentType(metadata.qrContentType);
    if (metadata.qrCustomContent != null) setQrCustomContent(metadata.qrCustomContent);
    if (metadata.qrSize) setQrSize(metadata.qrSize);
    if (metadata.qrColor != null) setQrColor(metadata.qrColor);
    if (metadata.qrBgColor) setQrBgColor(metadata.qrBgColor);
    if (metadata.qrPosition) setQrPosition(metadata.qrPosition);
    if (metadata.logoUrl != null) setLogoUrl(metadata.logoUrl);
    if (metadata.logoSize) setLogoSize(metadata.logoSize);
    if (metadata.logoPos) setLogoPos(metadata.logoPos);
    if (metadata.aiDesignData !== undefined) setAiDesignData(metadata.aiDesignData);
    toast.success("Card design restored!");
    setLoadSavedOpen(false);
  };

  const handleDeleteSaved = async (id: string) => {
    setIsDeletingSaved(id);
    try {
      const { error } = await supabase.from("design_assets").delete().eq("id", id);
      if (error) throw error;
      setSavedDesigns(prev => prev.filter(d => d.id !== id));
      toast.success("Design deleted.");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed.");
    } finally {
      setIsDeletingSaved(null);
    }
  };

  const handleExportPng = async () => {
    if (!cardPreviewRef.current) { toast.error("Preview not ready."); return; }
    setIsExportingPng(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardPreviewRef.current, {
        scale: 3, useCORS: true, backgroundColor: null, logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `business-card-${(data.name || "card").toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      toast.success("PNG exported at high resolution!");
    } catch (err) {
      console.error(err);
      toast.error("PNG export failed. Please try again.");
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleBatchPrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Pop-up blocked. Please allow pop-ups."); return; }
    const cardHtml = cardPreviewRef.current?.innerHTML || "";

    const cards = Array.from({ length: batchPrintCount }, () => `
      <div style="width:3.5in;height:2in;overflow:hidden;border:0.5px solid #ddd;border-radius:4px;box-sizing:border-box;flex-shrink:0;">
        ${cardHtml}
      </div>
    `).join("");

    printWindow.document.write(`<!DOCTYPE html>
<html><head><title>Print Business Cards</title>
<style>
  @page { size: A4; margin: 0.5in; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; }
  .grid { display: flex; flex-wrap: wrap; gap: 0.15in; justify-content: center; }
  .grid > div { page-break-inside: avoid; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head>
<body>
  <div class="grid">${cards}</div>
  <script>window.onload = () => { window.print(); }</script>
</body></html>`);
    printWindow.document.close();
    toast.success(`Print layout ready — ${batchPrintCount} cards on A4`);
  };

  const handleSaveCard = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in to save."); setIsSaving(false); return; }

      const companyName = data.company?.trim() || "";

      if (companyName) {
        const { data: available, error: rpcErr } = await supabase.rpc("check_name_available", {
          _company_name: companyName,
          _asset_type: "business_card",
          _requesting_user: user.id,
        });
        if (rpcErr) {
          if (rpcErr.message?.toLowerCase().includes("protected")) {
            toast.error("This company name is exclusively protected and cannot be used.");
            setIsSaving(false); return;
          }
        } else if (available === false) {
          toast.error("This company name is already licensed by another user.");
          setIsSaving(false); return;
        }
      }

      const cardState = {
        data, frontTemplate, backTemplate, frontColorIdx, backColorIdx, frontCustomColor, backCustomColor,
        cardShape, qrEnabled, qrContentType, qrCustomContent, qrSize, qrColor, qrBgColor, qrPosition,
        logoUrl, logoSize, logoPos, aiDesignData,
      };

      const { data: asset, error: assetErr } = await supabase.from("design_assets").insert({
        user_id: user.id, asset_type: "business_card", file_url: "",
        name: `Business Card — ${data.name || "Untitled"} — ${new Date().toLocaleDateString()}`,
        metadata: cardState as any,
      }).select("id").single();

      if (assetErr) throw assetErr;

      if (companyName && asset?.id) {
        const { data: lic, error: licErr } = await supabase.from("design_licenses").insert({
          user_id: user.id, asset_id: asset.id, asset_type: "business_card", company_name: companyName,
        }).select("license_code").single();

        if (licErr) {
          if (licErr.message?.toLowerCase().includes("protected")) {
            toast.error("This company name is exclusively protected and cannot be used.");
            setIsSaving(false); return;
          }
          console.warn("License insert warning:", licErr.message);
        } else if (lic?.license_code) {
          setCardLicenseCode(lic.license_code);
        }
      }

      toast.success("Card saved to Brand Assets!");
    } catch (err: any) {
      console.error(err);
      if (err?.message?.toLowerCase().includes("protected")) {
        toast.error("This company name is exclusively protected and cannot be used.");
      } else {
        toast.error("Save failed. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportCardAsPDF(
        data, frontTemplate, frontPrimary, frontSecondary, frontAccent,
        backPrimary, backSecondary,
        qrEnabled, qrDataStr, effectiveQrColor, qrBgColor, qrSize, qrPosition,
      );
      toast.success("Business card PDF exported!");
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportHtml = () => {
    setIsExportingHtml(true);
    try {
      exportDigitalCardAsHtml(
        data, frontTemplate, frontPrimary, frontSecondary, frontAccent,
        cardFontFamily,
        cardFontBold ? "bold" : "800",
        cardFontItalic ? "italic" : "normal",
        cardFontSize,
        landingPageData,
      );
      toast.success("Digital card HTML exported!");
    } catch (err) {
      console.error(err);
      toast.error("HTML export failed. Please try again.");
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleShareCard = async () => {
    setIsSharing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please sign in to share your card."); return; }

      const cardSnapshot = {
        data, frontTemplate, frontColorIdx, frontCustomColor, cardShape,
        logoUrl, logoSize, aiDesignData,
        fontFamily: cardFontFamily,
        fontWeight: cardFontBold ? "bold" : "800",
        fontStyle: cardFontItalic ? "italic" : "normal",
        nameFontSize: cardFontSize,
        frontPrimary, frontSecondary, frontAccent,
      };

      const { data: inserted, error } = await supabase
        .from("shared_business_cards")
        .insert({ user_id: user.id, card_data: cardSnapshot as any })
        .select("token")
        .single();

      if (error) throw error;
      setShareToken(inserted.token);
      setShareModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate share link. Please try again.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleResetLayout = () => {
    setFieldPositions({ ...DEFAULT_FIELD_POSITIONS });
    setLogoPos({ ...DEFAULT_LOGO_POS });
    if (!editLayout) setEditLayout(true);
    toast.success("Layout reset to defaults");
  };

  return {
    // State
    frontTemplate, setFrontTemplate, backTemplate, setBackTemplate,
    frontColorIdx, setFrontColorIdx, backColorIdx, setBackColorIdx,
    frontCustomColor, setFrontCustomColor, backCustomColor, setBackCustomColor,
    side, setSide,
    isExporting, isExportingHtml, isSaving, cardLicenseCode,
    isSharing, shareModalOpen, setShareModalOpen, shareToken,
    brandAssetOpen, setBrandAssetOpen, colorOpen, setColorOpen,
    logoUrl, setLogoUrl, logoSize, setLogoSize, logoPos, setLogoPos,
    cardShape, setCardShape, shapeOpen, setShapeOpen, nfcGuideOpen, setNfcGuideOpen,
    editLayout, setEditLayout, fieldPositions,
    qrOpen, setQrOpen, qrEnabled, setQrEnabled,
    qrContentType, setQrContentType, qrCustomContent, setQrCustomContent,
    qrSize, setQrSize, qrColor, setQrColor, qrBgColor, setQrBgColor,
    qrPosition, setQrPosition, qrSide, setQrSide,
    qrAiPrompt, setQrAiPrompt, isAiStylingQr,
    aiDesignOpen, setAiDesignOpen, aiIndustry, setAiIndustry,
    aiTone, setAiTone, aiStyle, setAiStyle,
    aiDesignData, setAiDesignData, isGeneratingDesign,
    typographyOpen, setTypographyOpen,
    cardFontFamily, setCardFontFamily, cardFontBold, setCardFontBold,
    cardFontItalic, setCardFontItalic, cardFontSize, setCardFontSize,
    cardTextAlign, setCardTextAlign, cardUnderline, setCardUnderline,
    cardLetterSpacing, setCardLetterSpacing, cardLineHeight, setCardLineHeight,
    useGradient, setUseGradient, gradientEnd, setGradientEnd,
    gradientDirection, setGradientDirection,
    galleryOpen, setGalleryOpen, galleryPrompt, setGalleryPrompt,
    galleryDesigns, setGalleryDesigns, galleryFavorites, setGalleryFavorites, isGeneratingGallery, galleryPage, setGalleryPage, GALLERY_PER_PAGE,
    tradeLicenseOpen, setTradeLicenseOpen,
    loadSavedOpen, setLoadSavedOpen, savedDesigns, isLoadingSaved, isDeletingSaved,
    cardPreviewRef, isExportingPng,
    batchPrintOpen, setBatchPrintOpen, batchPrintCount, setBatchPrintCount,
    data, setData,
    bilingualMode, setBilingualMode, bilingualLang, setBilingualLang,
    bilingualOpen, setBilingualOpen, secondaryData, setSecondaryData, bilingualDir,
    inlineEditField, setInlineEditField,
    landingPageData, setLandingPageData, digitalTab, setDigitalTab,
    finishEffect, setFinishEffect, finishOpen, setFinishOpen,
    mockupScene, setMockupScene, mockupOpen, setMockupOpen,

    // Derived
    frontPrimary, frontSecondary, frontAccent,
    backPrimary, backSecondary, backAccent,
    effectiveQrColor, activeTemplate, setActiveTemplate, qrDataStr,

    // Handlers
    set, handleExtractedCard, handleFieldMove,
    handleAiQrStyle, handleGenerateDesign,
    handleGenerateGallery, toggleGalleryFavorite, applyGalleryDesign,
    handleTradeLicenseExtracted,
    handleLoadSavedDesigns, handleRestoreSaved, handleDeleteSaved,
    handleExportPng, handleBatchPrint, handleSaveCard,
    handleExport, handleExportHtml, handleShareCard, handleResetLayout,
  };
}
