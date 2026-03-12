import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, Phone, Mail, Globe, Download,
  MapPin, Building2, RefreshCw, Eye, Layers, LayoutGrid,
  Check, ChevronDown, Move,
  Sparkles, RectangleHorizontal,
  Star, User,
  Share2, HelpCircle,
  FolderOpen, Trash2, Clock,
} from "lucide-react";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import DigitalLandingPageEditor from "@/components/corporate-suite/DigitalLandingPageEditor";

// ─── Extracted modules ────────────────────────────────────────────────────────
import {
  type CardData, type BilingualMode,
  BILINGUAL_LANGUAGES, TEMPLATES, COLOR_PRESETS, CARD_SHAPES,
  getShapeStyle, DEFAULT_FIELD_POSITIONS, DEFAULT_LOGO_POS,
  getFinishOverlayStyle,
} from "./businessCardTypes";
import { PhoneMockup } from "./BusinessCardMockups";
import { CardFace, CardCanvas } from "./BusinessCardPreview";
import { BusinessCardHeader } from "./BusinessCardHeader";
import { ShareModal, BatchPrintDialog, NfcGuideDialog } from "./BusinessCardDialogs";
import { BusinessCardRightPanel } from "./BusinessCardRightPanel";
import { useBusinessCardState } from "./useBusinessCardState";


// ─── Main Component ───────────────────────────────────────────────────────────
export default function BusinessCardDesigner() {
  const s = useBusinessCardState();
  const {
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
    frontPrimary, frontSecondary, frontAccent,
    backPrimary, backSecondary, backAccent,
    effectiveQrColor, activeTemplate, setActiveTemplate, qrDataStr,
    set, handleExtractedCard, handleFieldMove,
    handleAiQrStyle, handleGenerateDesign,
    handleGenerateGallery, toggleGalleryFavorite, applyGalleryDesign,
    handleTradeLicenseExtracted,
    handleLoadSavedDesigns, handleRestoreSaved, handleDeleteSaved,
    handleExportPng, handleBatchPrint, handleSaveCard,
    handleExport, handleExportHtml, handleShareCard, handleResetLayout,
  } = s;

  const fields: { key: keyof CardData; label: string; placeholder: string; icon: React.ReactNode; voiceKey?: boolean }[] = [
    { key: "name",    label: "Full Name",   placeholder: "Ahmed Al-Mansoori",            icon: <User size={12} />, voiceKey: true },
    { key: "title",   label: "Job Title",   placeholder: "Senior Real Estate Consultant",icon: <Building2 size={12} />, voiceKey: true },
    { key: "company", label: "Company",     placeholder: "Acme Corporation",             icon: <Building2 size={12} />, voiceKey: true },
    { key: "phone",   label: "Phone",       placeholder: "+971 50 123 4567",             icon: <Phone size={12} />, voiceKey: true },
    { key: "email",   label: "Email",       placeholder: "ahmed@company.ae",             icon: <Mail size={12} />, voiceKey: true },
    { key: "website", label: "Website",     placeholder: "www.company.ae",               icon: <Globe size={12} />, voiceKey: true },
    { key: "address", label: "Address",     placeholder: "Dubai, UAE",                   icon: <MapPin size={12} />, voiceKey: true },
  ];

  return (
    <>
    <div className="min-h-screen" style={{ background: "hsl(var(--pearl-1,48 30% 97%))" }}>
      <BusinessCardHeader
        editLayout={editLayout}
        setEditLayout={setEditLayout}
        onResetLayout={handleResetLayout}
        isSaving={isSaving}
        onSave={handleSaveCard}
        cardLicenseCode={cardLicenseCode}
        isSharing={isSharing}
        onShare={handleShareCard}
        cardShape={cardShape}
        isExportingHtml={isExportingHtml}
        onExportHtml={handleExportHtml}
        isExportingPng={isExportingPng}
        onExportPng={handleExportPng}
        onBatchPrint={() => setBatchPrintOpen(true)}
        isExporting={isExporting}
        onExportPdf={handleExport}
      />

      {shareToken && (
        <ShareModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          shareToken={shareToken}
          frontPrimary={frontPrimary}
        />
      )}

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-5">

        {/* ── Left panel ──────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Card Shape */}
          <Collapsible open={shapeOpen} onOpenChange={setShapeOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <RectangleHorizontal size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Card Shape</span>
                    <span className="text-[9px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">
                      {CARD_SHAPES.find(s => s.id === cardShape)?.label}
                    </span>
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${shapeOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <div className="grid grid-cols-4 gap-2 pt-3">
                    {CARD_SHAPES.map(s => (
                      <div key={s.id} className="relative">
                        <button
                          onClick={() => setCardShape(s.id)}
                          className={`w-full flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all ${
                            cardShape === s.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]"
                              : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          <span className={cardShape === s.id ? "text-[hsl(var(--gold))]" : "text-[hsl(var(--muted-foreground))]"}>{s.icon}</span>
                          <span className={`text-[9px] font-semibold leading-none ${cardShape === s.id ? "text-[hsl(var(--gold-dark))]" : "text-[hsl(var(--muted-foreground))]"}`}>{s.label}</span>
                        </button>
                        {s.id === "digital" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setNfcGuideOpen(true); }}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[hsl(var(--gold))] text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                            title="NFC Programming Guide"
                          >
                            <HelpCircle size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Template picker — applies to active side */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-1 block flex items-center gap-1.5">
              <Layers size={11} /> Template
              <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[hsl(var(--gold)/0.12)] text-[hsl(var(--gold-dark))]">
                Editing: {side === "front" ? "Front" : "Back"}
              </span>
            </Label>
            <p className="text-[9px] text-[hsl(var(--muted-foreground))] mb-3">Click Front/Back toggle above to switch sides independently.</p>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTemplate(t.id)}
                  className={`relative py-2.5 px-3 rounded-xl text-left border transition-all duration-200 ${
                    activeTemplate === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  {activeTemplate === t.id && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </span>
                  )}
                  <p className={`text-xs font-semibold leading-none mb-0.5 ${activeTemplate === t.id ? "text-[hsl(var(--gold-dark))]" : "text-[hsl(var(--foreground))]"}`}>
                    {t.label}
                  </p>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scan Existing Card — AI pre-fill */}
          <DocumentExtractorUpload
            extractionType="business_card"
            onExtracted={handleExtractedCard}
            label="Scan Existing Card"
            hint="Upload a photo or PDF of a business card to pre-fill all fields instantly."
          />

          {/* Trade License Auto-Fill */}
          <Collapsible open={tradeLicenseOpen} onOpenChange={setTradeLicenseOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Trade License</span>
                    <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">Auto-Fill</span>
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${tradeLicenseOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] py-2">
                    Upload your trade license to auto-fill company name, address, and contact details.
                  </p>
                  <DocumentExtractorUpload
                    extractionType="company_profile"
                    onExtracted={handleTradeLicenseExtracted}
                    label="Upload Trade License"
                    hint="PDF or photo of your trade license — extracts company info automatically."
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Load Saved Designs */}
          <Collapsible open={loadSavedOpen} onOpenChange={(open) => { setLoadSavedOpen(open); if (open) handleLoadSavedDesigns(); }}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Load Saved</span>
                    {savedDesigns.length > 0 && (
                      <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">
                        {savedDesigns.length}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${loadSavedOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-2 pt-3">
                  {isLoadingSaved ? (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <RefreshCw size={14} className="animate-spin text-[hsl(var(--gold))]" />
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Loading saved designs…</span>
                    </div>
                  ) : savedDesigns.length === 0 ? (
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center py-4">No saved designs yet. Save a card to see it here.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                      {savedDesigns.map(design => (
                        <div
                          key={design.id}
                          className="flex items-center gap-2 p-2.5 rounded-xl border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--muted)/0.5)] transition-all cursor-pointer group"
                          onClick={() => handleRestoreSaved(design.metadata)}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gold)/0.1)] flex items-center justify-center flex-shrink-0">
                            <CreditCard size={12} className="text-[hsl(var(--gold))]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] truncate">{design.name}</p>
                            <p className="text-[9px] text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                              <Clock size={8} />
                              {new Date(design.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSaved(design.id); }}
                            disabled={isDeletingSaved === design.id}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            {isDeletingSaved === design.id ? <RefreshCw size={10} className="animate-spin" /> : <Trash2 size={10} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    onClick={handleLoadSavedDesigns}
                    disabled={isLoadingSaved}
                    variant="outline"
                    className="w-full h-7 text-[9px] gap-1.5"
                  >
                    <RefreshCw size={9} className={isLoadingSaved ? "animate-spin" : ""} /> Refresh
                  </Button>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
          <Collapsible open={bilingualOpen} onOpenChange={setBilingualOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Bilingual</span>
                    {bilingualMode !== "off" && (
                      <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">
                        {BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split(" ")[0]}
                      </span>
                    )}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${bilingualOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Add a second language to your card. Choose between showing both languages on one card or separate front/back sides.
                  </p>

                  {/* Mode selector */}
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Mode</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { id: "off" as BilingualMode, label: "Off" },
                        { id: "dual-side" as BilingualMode, label: "Front/Back" },
                        { id: "single-card" as BilingualMode, label: "Both Sides" },
                      ]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setBilingualMode(opt.id)}
                          className={`text-[10px] py-2 px-1 rounded-lg border font-semibold transition-all ${
                            bilingualMode === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">
                      {bilingualMode === "dual-side" ? "English on front, second language on back" : bilingualMode === "single-card" ? "Both languages shown together on each side" : "Single-language card"}
                    </p>
                  </div>

                  {bilingualMode !== "off" && (
                    <>
                      {/* Language picker */}
                      <div>
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Second Language</Label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {BILINGUAL_LANGUAGES.map(lang => (
                            <button
                              key={lang.id}
                              onClick={() => setBilingualLang(lang.id)}
                              className={`text-[10px] py-1.5 px-1 rounded-lg border font-semibold transition-all truncate ${
                                bilingualLang === lang.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              }`}
                            >
                              {lang.label.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Secondary language fields */}
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] block">
                          {BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split("(")[1]?.replace(")", "") || "Secondary"} Text
                        </Label>
                        {(["name", "title", "company"] as (keyof CardData)[]).map(key => (
                          <div key={key}>
                            <Label className="text-[9px] text-[hsl(var(--muted-foreground))] mb-0.5 block capitalize">{key}</Label>
                            <div className="flex gap-1.5">
                              <Input
                                value={secondaryData[key]}
                                onChange={e => setSecondaryData(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder={`${key} in ${BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split("(")[1]?.replace(")", "") || "other language"}...`}
                                className="h-8 text-xs flex-1"
                                dir={bilingualDir}
                              />
                              <VoiceInputButton
                                onTranscript={t => setSecondaryData(prev => ({ ...prev, [key]: t }))}
                                size="sm"
                              />
                            </div>
                          </div>
                        ))}
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-lg px-2 py-1.5">
                          💡 Use voice input to speak in {BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split("(")[1]?.replace(")", "") || "the second language"} — it auto-transcribes.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          <Collapsible open={galleryOpen} onOpenChange={setGalleryOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <LayoutGrid size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Smart Gallery</span>
                    <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">AI</span>
                    {galleryFavorites.length > 0 && (
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                        {galleryFavorites.length}/5 ★
                      </span>
                    )}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${galleryOpen ? "rotate-180" : ""}`} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    Describe your ideal business card or company style. AI generates multiple designs — favorite up to 5, then apply or merge.
                  </p>

                  {/* Prompt input */}
                  <div className="flex gap-1.5">
                    <Input
                      value={galleryPrompt}
                      onChange={e => setGalleryPrompt(e.target.value)}
                      placeholder="e.g. Luxury gold real estate card with geometric patterns..."
                      className="h-8 text-xs flex-1"
                      onKeyDown={e => e.key === "Enter" && !isGeneratingGallery && handleGenerateGallery()}
                    />
                    <VoiceInputButton onTranscript={t => setGalleryPrompt(prev => prev ? `${prev} ${t}` : t)} size="sm" />
                  </div>

                  <Button
                    onClick={() => { setGalleryDesigns([]); setGalleryPage(0); handleGenerateGallery(); }}
                    disabled={isGeneratingGallery}
                    className="w-full h-9 text-xs gap-2 font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}
                  >
                    {isGeneratingGallery ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                    {isGeneratingGallery ? "Generating Designs…" : galleryDesigns.length > 0 ? "Regenerate Gallery" : "Generate Gallery"}
                  </Button>

                  {/* Gallery grid */}
                  {galleryDesigns.length > 0 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {galleryDesigns.map((design) => {
                          const isFav = galleryFavorites.includes(design.id);
                          return (
                            <div key={design.id} className="relative group">
                              <div
                                className={`rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                                  isFav ? "border-amber-400 shadow-md" : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)]"
                                }`}
                                onClick={() => applyGalleryDesign(design)}
                              >
                                {/* Mini card preview */}
                                <CardFace
                                  data={data}
                                  template="ai-design"
                                  primary={design.bgColor}
                                  secondary={design.textColor}
                                  accent={design.accentColor || design.colors?.[0] || "#C8A766"}
                                  side="front"
                                  scale={0.35}
                                  shapeStyle={{ aspectRatio: "3.5 / 2", borderRadius: 0 }}
                                  aiDesignData={design}
                                  fontFamily={cardFontFamily}
                                  fontWeight={cardFontBold ? "bold" : undefined}
                                  fontStyle={cardFontItalic ? "italic" : undefined}
                                  nameFontSize={cardFontSize}
                                />
                                <p className="text-[8px] font-semibold text-center py-1 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] truncate px-1">
                                  {design.name}
                                </p>
                              </div>
                              {/* Favorite button */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleGalleryFavorite(design.id); }}
                                className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all ${
                                  isFav ? "bg-amber-400 text-white" : "bg-white/80 text-[hsl(var(--muted-foreground))] hover:bg-amber-100"
                                }`}
                              >
                                <Star size={10} fill={isFav ? "currentColor" : "none"} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Load more */}
                      <Button
                        onClick={handleGenerateGallery}
                        disabled={isGeneratingGallery}
                        variant="outline"
                        className="w-full h-8 text-[10px] gap-1.5"
                      >
                        {isGeneratingGallery ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                        Generate More Designs
                      </Button>

                      {/* Favorites summary */}
                      {galleryFavorites.length > 0 && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                          <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
                            <Star size={10} fill="currentColor" /> {galleryFavorites.length} Favorited
                          </p>
                          <div className="flex gap-1 flex-wrap">
                            {galleryFavorites.map(fId => {
                              const d = galleryDesigns.find(g => g.id === fId);
                              return d ? (
                                <button
                                  key={fId}
                                  onClick={() => applyGalleryDesign(d)}
                                  className="text-[8px] bg-white border border-amber-300 rounded-lg px-2 py-1 font-semibold text-amber-700 hover:bg-amber-100 transition-colors truncate max-w-[120px]"
                                >
                                  {d.name}
                                </button>
                              ) : null;
                            })}
                          </div>
                          <Button
                            onClick={() => { setGalleryFavorites([]); toast.success("Favorites cleared"); }}
                            variant="outline"
                            className="w-full h-7 text-[9px] border-amber-300 text-amber-700 hover:bg-amber-100"
                          >
                            Clear Favorites
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {isGeneratingGallery && galleryDesigns.length === 0 && (
                    <div className="flex items-center gap-2 p-3 bg-[hsl(var(--muted))] rounded-xl">
                      <RefreshCw size={14} className="animate-spin text-[hsl(var(--gold))]" />
                      <div>
                        <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Generating gallery…</p>
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Creating {GALLERY_PER_PAGE} unique card designs</p>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Card info fields */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm space-y-3.5">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] block">
              Card Information
            </Label>
            {fields.map(f => (
              <div key={f.key}>
                <Label className="text-[11px] text-[hsl(var(--muted-foreground))] mb-1 flex items-center gap-1.5">
                  <span className="text-[hsl(var(--muted-foreground))]">{f.icon}</span>
                  {f.label}
                </Label>
                <div className="flex gap-1.5">
                  <Input
                    value={data[f.key]}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    className="h-8 text-xs flex-1"
                  />
                  {f.voiceKey && (
                    <VoiceInputButton
                      onTranscript={t => setData(prev => ({ ...prev, [f.key]: t }))}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Center panel: Preview ─────────────────────────────── */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
              <Eye size={11} /> Live Preview
              {editLayout && (
                <span className="ml-2 text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Move size={9} /> Drag fields/logo to rearrange
                </span>
              )}
            </Label>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Edit Layout toggle — always visible on mobile */}
            <button
              onClick={() => setEditLayout(v => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors border ${
                editLayout
                  ? "bg-amber-100 text-amber-700 border-amber-300"
                  : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]"
              }`}
              title={editLayout ? "Exit layout edit mode" : "Enter layout edit mode to drag fields"}
            >
              <Move size={11} />
              {editLayout ? "Done" : "Edit Layout"}
            </button>
            {/* Share button — visible in preview area for easy mobile access */}
            <button
              onClick={handleShareCard}
              disabled={isSharing}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60"
              title="Share card and get a shareable link"
            >
              {isSharing ? <RefreshCw size={11} className="animate-spin" /> : <Share2 size={11} />}
              {isSharing ? "…" : "Share"}
            </button>
            <div className="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden text-xs">
              {(["front", "back"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  className={`px-3 py-1.5 font-medium capitalize transition-colors flex items-center gap-1.5 ${
                    side === s
                      ? "bg-[hsl(var(--foreground))] text-white"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: s === "front" ? frontPrimary : backPrimary }} />
                  {s}
                </button>
              ))}
            </div>
          </div>
          
          </div>

          {/* Card preview */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-8 shadow-sm flex flex-col items-center gap-4" style={cardShape === "digital" ? { background: "linear-gradient(160deg,#0f0f0f 0%,#1a1a1a 60%,#111 100%)" } : {}}>
            {cardShape === "digital" ? (
              <PhoneMockup>
                <CardCanvas
                  data={data}
                  template={frontTemplate}
                  backTemplate={backTemplate}
                  primary={frontPrimary}
                  secondary={frontSecondary}
                  accent={frontAccent}
                  backPrimary={backPrimary}
                  backSecondary={backSecondary}
                  backAccent={backAccent}
                  side={side}
                  cardShape={cardShape}
                  editLayout={editLayout}
                  fieldPositions={fieldPositions}
                  onFieldMove={handleFieldMove}
                  qrEnabled={qrEnabled}
                  qrData={qrDataStr}
                  qrSize={qrSize}
                  qrColor={effectiveQrColor}
                  qrBgColor={qrBgColor}
                  qrPosition={qrPosition}
                  qrSide={qrSide}
                  logoUrl={logoUrl}
                  logoSize={logoSize}
                  logoPos={logoPos}
                  onLogoMove={setLogoPos}
                  aiDesignData={aiDesignData}
                  fontFamily={cardFontFamily}
                  fontWeight={cardFontBold ? "bold" : undefined}
                  fontStyle={cardFontItalic ? "italic" : undefined}
                  nameFontSize={cardFontSize}
                  bilingualMode={bilingualMode}
                  bilingualDir={bilingualDir}
                  secondaryData={secondaryData}
                  onInlineEdit={(field) => setInlineEditField(field)}
                />
              </PhoneMockup>
            ) : (
              <div className="w-full max-w-[400px]" ref={cardPreviewRef}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${frontTemplate}-${backTemplate}-${frontColorIdx}-${backColorIdx}-${side}-${cardShape}`}
                    initial={{ opacity: 0, rotateY: side === "back" ? -15 : 15, scale: 0.96 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    style={{ perspective: 800 }}
                  >
                    <div className="relative">
                      <CardCanvas
                        data={data}
                        template={frontTemplate}
                        backTemplate={backTemplate}
                        primary={frontPrimary}
                        secondary={frontSecondary}
                        accent={frontAccent}
                        backPrimary={backPrimary}
                        backSecondary={backSecondary}
                        backAccent={backAccent}
                        side={side}
                        cardShape={cardShape}
                        editLayout={editLayout}
                        fieldPositions={fieldPositions}
                        onFieldMove={handleFieldMove}
                        qrEnabled={qrEnabled}
                        qrData={qrDataStr}
                        qrSize={qrSize}
                        qrColor={effectiveQrColor}
                        qrBgColor={qrBgColor}
                        qrPosition={qrPosition}
                        qrSide={qrSide}
                        logoUrl={logoUrl}
                        logoSize={logoSize}
                        logoPos={logoPos}
                        onLogoMove={setLogoPos}
                        aiDesignData={aiDesignData}
                        fontFamily={cardFontFamily}
                        fontWeight={cardFontBold ? "bold" : undefined}
                        fontStyle={cardFontItalic ? "italic" : undefined}
                        nameFontSize={cardFontSize}
                        bilingualMode={bilingualMode}
                        bilingualDir={bilingualDir}
                        secondaryData={secondaryData}
                        onInlineEdit={(field) => setInlineEditField(field)}
                      />
                      {finishEffect !== "none" && <div style={getFinishOverlayStyle(finishEffect)} />}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Inline edit input — appears when clicking a field on the card */}
            {inlineEditField && (
              <div className="w-full max-w-[400px] mx-auto mt-2">
                <div className="flex gap-2 items-center bg-[hsl(var(--muted))] rounded-xl p-2 border border-[hsl(var(--gold)/0.3)]">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))] whitespace-nowrap min-w-[60px]">
                    {inlineEditField}
                  </Label>
                  <Input
                    autoFocus
                    value={data[inlineEditField]}
                    onChange={e => setData(prev => ({ ...prev, [inlineEditField]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setInlineEditField(null); }}
                    className="h-8 text-xs flex-1"
                    placeholder={`Edit ${inlineEditField}...`}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setInlineEditField(null)}
                    className="h-8 text-xs"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}

            <div className={`flex items-center gap-3 text-[10px] ${cardShape === "digital" ? "text-white/40" : "text-[hsl(var(--muted-foreground))]"}`}>
              <span>{CARD_SHAPES.find(s => s.id === cardShape)?.label} · {CARD_SHAPES.find(s => s.id === cardShape)?.ratio}</span>
              <span>·</span>
              <span>F: {TEMPLATES.find(t => t.id === frontTemplate)?.label} · B: {TEMPLATES.find(t => t.id === backTemplate)?.label}</span>
              {qrEnabled && <span>· QR on both sides</span>}
              {logoUrl && <span>· Logo on both sides</span>}
              {bilingualMode !== "off" && <span>· Bilingual ({BILINGUAL_LANGUAGES.find(l => l.id === bilingualLang)?.label?.split(" ")[0]})</span>}
              {finishEffect !== "none" && <span>· {finishEffect.charAt(0).toUpperCase() + finishEffect.slice(1)} finish</span>}
            </div>

            {/* Digital mode tabs + landing page editor + export */}
            {cardShape === "digital" && (
              <div className="w-full space-y-3">
                {/* Tab switcher */}
                <div className="flex rounded-xl border border-[hsl(var(--border))] overflow-hidden">
                  {(["card", "landing"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDigitalTab(tab)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-all ${
                        digitalTab === tab
                          ? "bg-blue-600/30 text-blue-100 border-b-2 border-blue-400"
                          : "bg-[#ffffff08] text-white/50 hover:text-white/70"
                      }`}
                    >
                      {tab === "card" ? "📇 Card" : "📄 Landing Page"}
                    </button>
                  ))}
                </div>

                {digitalTab === "landing" && (
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[#ffffff08] p-4">
                    <DigitalLandingPageEditor
                      data={landingPageData}
                      onChange={setLandingPageData}
                      primaryColor={frontPrimary}
                    />
                  </div>
                )}

                {digitalTab === "card" && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-200 space-y-1">
                    <p className="font-semibold text-blue-100 flex items-center gap-1.5">📱 NFC / Digital Card Mode</p>
                    <p>Export as HTML to host your digital card page on any web host (Netlify, GitHub Pages, etc.).</p>
                    <p className="opacity-70">Program that URL into an NFC sticker with any free NFC writer app — tap the sticker → phone opens your card → visitor taps Save Contact.</p>
                  </div>
                )}

                <button
                  onClick={handleExportHtml}
                  disabled={isExportingHtml}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-blue-400/40 bg-blue-600/20 text-blue-200 hover:bg-blue-600/30 transition-colors disabled:opacity-60"
                >
                  {isExportingHtml ? <RefreshCw size={13} className="animate-spin" /> : <Download size={13} />}
                  {isExportingHtml ? "Exporting…" : "Export HTML — Host as Digital Card"}
                </button>
              </div>
            )}
          </div>

          {/* All templates mini grid */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <Label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[hsl(var(--muted-foreground))] mb-4 block">
              All Templates Preview — click to set for {side === "front" ? "Front" : "Back"} side
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TEMPLATES.map(t => (
                <div key={t.id} className="relative group">
                  <div
                    className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      frontTemplate === t.id || backTemplate === t.id
                        ? "border-[hsl(var(--gold))] shadow-md"
                        : "border-transparent hover:border-[hsl(var(--border))]"
                    }`}
                  >
                    <CardFace
                      data={data}
                      template={t.id}
                      primary={frontPrimary}
                      secondary={frontSecondary}
                      accent={frontAccent}
                      side="front"
                      scale={0.45}
                      shapeStyle={{ aspectRatio: "3.5 / 2", borderRadius: 0 }}
                      aiDesignData={t.id === "ai-design" ? aiDesignData : null}
                      fontFamily={cardFontFamily}
                      fontWeight={cardFontBold ? "bold" : undefined}
                      fontStyle={cardFontItalic ? "italic" : undefined}
                      nameFontSize={cardFontSize}
                    />
                    {/* F/B badges */}
                    <div className="absolute top-1 left-1 flex gap-0.5">
                      {frontTemplate === t.id && (
                        <span className="text-[8px] font-bold bg-[hsl(var(--gold))] text-white px-1 rounded">F</span>
                      )}
                      {backTemplate === t.id && (
                        <span className="text-[8px] font-bold bg-[hsl(var(--foreground))] text-[hsl(var(--background))] px-1 rounded">B</span>
                      )}
                    </div>
                    {t.badge && (
                      <div className="absolute top-1 right-1 text-[10px]">{t.badge}</div>
                    )}
                    <p className="absolute bottom-0 left-0 right-0 text-center text-[9px] font-semibold py-1 bg-black/40 text-white">
                      {t.label}
                    </p>
                    {/* Hover overlay with Set Front / Set Back */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                      <button
                        onClick={() => setFrontTemplate(t.id)}
                        className="text-[9px] font-bold bg-[hsl(var(--gold))] text-white px-2 py-1 rounded-full hover:opacity-90"
                      >
                        Set Front
                      </button>
                      <button
                        onClick={() => setBackTemplate(t.id)}
                        className="text-[9px] font-bold bg-white text-black px-2 py-1 rounded-full hover:opacity-90"
                      >
                        Set Back
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[hsl(var(--gold)/0.06)] border border-[hsl(var(--gold)/0.2)] rounded-2xl p-4 text-xs text-[hsl(var(--muted-foreground))] space-y-1.5">
            <p className="font-semibold text-[hsl(var(--foreground))] text-[13px]">Tips</p>
            <p><span className="font-medium text-[hsl(var(--foreground))]">Per-Side Colors</span> — Set different colors for Front and Back using the Colors panel.</p>
            <p><span className="font-medium text-[hsl(var(--foreground))]">Logo</span> — Upload in Brand Assets. Appears on both sides. Enable "Edit Layout" to drag it.</p>
            <p><span className="font-medium text-[hsl(var(--foreground))]">QR Code</span> — Enable QR and it shows on both Front and Back automatically.</p>
            <p><span className="font-medium text-[hsl(var(--foreground))]">AI Design</span> — Pick Tone + Industry + Pattern Style, then click Generate. The design appears instantly on the card. Regenerate for variety.</p>
          </div>
        </div>

        {/* ── Right panel: Style Controls ──────────────────────── */}
        <BusinessCardRightPanel
          colorOpen={colorOpen}
          setColorOpen={setColorOpen}
          cardShape={cardShape}
          frontColorIdx={frontColorIdx}
          setFrontColorIdx={setFrontColorIdx}
          frontCustomColor={frontCustomColor}
          setFrontCustomColor={setFrontCustomColor}
          backColorIdx={backColorIdx}
          setBackColorIdx={setBackColorIdx}
          backCustomColor={backCustomColor}
          setBackCustomColor={setBackCustomColor}
          frontPrimary={frontPrimary}
          backPrimary={backPrimary}
          useGradient={useGradient}
          setUseGradient={setUseGradient}
          gradientEnd={gradientEnd}
          setGradientEnd={setGradientEnd}
          gradientDirection={gradientDirection}
          setGradientDirection={setGradientDirection}
          brandAssetOpen={brandAssetOpen}
          setBrandAssetOpen={setBrandAssetOpen}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          logoSize={logoSize}
          setLogoSize={setLogoSize}
          typographyOpen={typographyOpen}
          setTypographyOpen={setTypographyOpen}
          cardFontFamily={cardFontFamily}
          setCardFontFamily={setCardFontFamily}
          cardFontBold={cardFontBold}
          setCardFontBold={setCardFontBold}
          cardFontItalic={cardFontItalic}
          setCardFontItalic={setCardFontItalic}
          cardFontSize={cardFontSize}
          setCardFontSize={setCardFontSize}
          cardTextAlign={cardTextAlign}
          setCardTextAlign={setCardTextAlign}
          cardUnderline={cardUnderline}
          setCardUnderline={setCardUnderline}
          cardLetterSpacing={cardLetterSpacing}
          setCardLetterSpacing={setCardLetterSpacing}
          cardLineHeight={cardLineHeight}
          setCardLineHeight={setCardLineHeight}
          qrOpen={qrOpen}
          setQrOpen={setQrOpen}
          qrEnabled={qrEnabled}
          setQrEnabled={setQrEnabled}
          qrContentType={qrContentType}
          setQrContentType={setQrContentType}
          qrCustomContent={qrCustomContent}
          setQrCustomContent={setQrCustomContent}
          qrSize={qrSize}
          setQrSize={setQrSize}
          qrColor={qrColor}
          setQrColor={setQrColor}
          qrBgColor={qrBgColor}
          setQrBgColor={setQrBgColor}
          qrPosition={qrPosition}
          setQrPosition={setQrPosition}
          qrSide={qrSide}
          setQrSide={setQrSide}
          qrAiPrompt={qrAiPrompt}
          setQrAiPrompt={setQrAiPrompt}
          isAiStylingQr={isAiStylingQr}
          handleAiQrStyle={handleAiQrStyle}
          effectiveQrColor={effectiveQrColor}
          qrDataStr={qrDataStr}
          data={data}
          aiDesignOpen={aiDesignOpen}
          setAiDesignOpen={setAiDesignOpen}
          aiTone={aiTone}
          setAiTone={setAiTone}
          aiIndustry={aiIndustry}
          setAiIndustry={setAiIndustry}
          aiStyle={aiStyle}
          setAiStyle={setAiStyle}
          aiDesignData={aiDesignData}
          setAiDesignData={setAiDesignData}
          isGeneratingDesign={isGeneratingDesign}
          handleGenerateDesign={handleGenerateDesign}
          activeTemplate={activeTemplate}
          setActiveTemplate={setActiveTemplate}
          frontSecondary={frontSecondary}
          frontAccent={frontAccent}
          finishOpen={finishOpen}
          setFinishOpen={setFinishOpen}
          finishEffect={finishEffect}
          setFinishEffect={setFinishEffect}
          mockupOpen={mockupOpen}
          setMockupOpen={setMockupOpen}
          mockupScene={mockupScene}
          setMockupScene={setMockupScene}
          frontTemplate={frontTemplate}
        />
      </div>
    </div>

      <BatchPrintDialog
        open={batchPrintOpen}
        onOpenChange={setBatchPrintOpen}
        count={batchPrintCount}
        setCount={setBatchPrintCount}
        onPrint={handleBatchPrint}
      />

      <NfcGuideDialog open={nfcGuideOpen} onOpenChange={setNfcGuideOpen} />
    </>
  );
}
