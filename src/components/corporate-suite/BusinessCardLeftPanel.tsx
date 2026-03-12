import React from "react";
import {
  Phone, Mail, Globe, MapPin, Building2, RefreshCw,
  Layers, LayoutGrid, Check, ChevronDown,
  Sparkles, RectangleHorizontal, Star, User,
  HelpCircle, FolderOpen, Trash2, Clock, CreditCard,
} from "lucide-react";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import {
  type CardData, type BilingualMode, type BilingualLanguage, type CardShape,
  BILINGUAL_LANGUAGES, TEMPLATES, CARD_SHAPES,
} from "./businessCardTypes";
import { CardFace } from "./BusinessCardPreview";

interface BusinessCardLeftPanelProps {
  // Card Shape
  cardShape: CardShape;
  setCardShape: (v: CardShape) => void;
  shapeOpen: boolean;
  setShapeOpen: (v: boolean) => void;
  setNfcGuideOpen: (v: boolean) => void;
  // Template
  activeTemplate: string;
  setActiveTemplate: (v: string) => void;
  side: "front" | "back";
  // Extracted card
  handleExtractedCard: (d: any) => void;
  // Trade License
  tradeLicenseOpen: boolean;
  setTradeLicenseOpen: (v: boolean) => void;
  handleTradeLicenseExtracted: (d: any) => void;
  // Load Saved
  loadSavedOpen: boolean;
  setLoadSavedOpen: (v: boolean) => void;
  savedDesigns: any[];
  isLoadingSaved: boolean;
  isDeletingSaved: string | false;
  handleLoadSavedDesigns: () => void;
  handleRestoreSaved: (m: any) => void;
  handleDeleteSaved: (id: string) => void;
  // Bilingual
  bilingualOpen: boolean;
  setBilingualOpen: (v: boolean) => void;
  bilingualMode: BilingualMode;
  setBilingualMode: (v: BilingualMode) => void;
  bilingualLang: string;
  setBilingualLang: (v: string) => void;
  bilingualDir: "ltr" | "rtl";
  secondaryData: CardData;
  setSecondaryData: React.Dispatch<React.SetStateAction<CardData>>;
  // Gallery
  galleryOpen: boolean;
  setGalleryOpen: (v: boolean) => void;
  galleryPrompt: string;
  setGalleryPrompt: (v: string) => void;
  galleryDesigns: any[];
  setGalleryDesigns: (v: any[]) => void;
  galleryFavorites: string[];
  setGalleryFavorites: (v: string[]) => void;
  isGeneratingGallery: boolean;
  galleryPage: number;
  setGalleryPage: (v: number) => void;
  GALLERY_PER_PAGE: number;
  handleGenerateGallery: () => void;
  toggleGalleryFavorite: (id: string) => void;
  applyGalleryDesign: (d: any) => void;
  // Card info fields
  data: CardData;
  setData: React.Dispatch<React.SetStateAction<CardData>>;
  set: (key: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  // For gallery CardFace preview
  cardFontFamily: string;
  cardFontBold: boolean;
  cardFontItalic: boolean;
  cardFontSize: number;
}

const FIELDS: { key: keyof CardData; label: string; placeholder: string; icon: React.ReactNode; voiceKey?: boolean }[] = [
  { key: "name",    label: "Full Name",   placeholder: "Ahmed Al-Mansoori",            icon: <User size={12} />, voiceKey: true },
  { key: "title",   label: "Job Title",   placeholder: "Senior Real Estate Consultant",icon: <Building2 size={12} />, voiceKey: true },
  { key: "company", label: "Company",     placeholder: "Acme Corporation",             icon: <Building2 size={12} />, voiceKey: true },
  { key: "phone",   label: "Phone",       placeholder: "+971 50 123 4567",             icon: <Phone size={12} />, voiceKey: true },
  { key: "email",   label: "Email",       placeholder: "ahmed@company.ae",             icon: <Mail size={12} />, voiceKey: true },
  { key: "website", label: "Website",     placeholder: "www.company.ae",               icon: <Globe size={12} />, voiceKey: true },
  { key: "address", label: "Address",     placeholder: "Dubai, UAE",                   icon: <MapPin size={12} />, voiceKey: true },
];

export function BusinessCardLeftPanel(props: BusinessCardLeftPanelProps) {
  const {
    cardShape, setCardShape, shapeOpen, setShapeOpen, setNfcGuideOpen,
    activeTemplate, setActiveTemplate, side,
    handleExtractedCard,
    tradeLicenseOpen, setTradeLicenseOpen, handleTradeLicenseExtracted,
    loadSavedOpen, setLoadSavedOpen, savedDesigns, isLoadingSaved, isDeletingSaved,
    handleLoadSavedDesigns, handleRestoreSaved, handleDeleteSaved,
    bilingualOpen, setBilingualOpen, bilingualMode, setBilingualMode,
    bilingualLang, setBilingualLang, bilingualDir, secondaryData, setSecondaryData,
    galleryOpen, setGalleryOpen, galleryPrompt, setGalleryPrompt,
    galleryDesigns, setGalleryDesigns, galleryFavorites, setGalleryFavorites,
    isGeneratingGallery, setGalleryPage, GALLERY_PER_PAGE,
    handleGenerateGallery, toggleGalleryFavorite, applyGalleryDesign,
    data, setData, set,
    cardFontFamily, cardFontBold, cardFontItalic, cardFontSize,
  } = props;

  return (
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

      {/* Template picker */}
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

      {/* Scan Existing Card */}
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

      {/* Bilingual */}
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

      {/* Smart Gallery */}
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
              <div className="flex gap-1.5">
                <Input
                  value={galleryPrompt}
                  onChange={e => setGalleryPrompt(e.target.value)}
                  placeholder="e.g. Luxury gold real estate card with geometric patterns..."
                  className="h-8 text-xs flex-1"
                  onKeyDown={e => e.key === "Enter" && !isGeneratingGallery && handleGenerateGallery()}
                />
                <VoiceInputButton onTranscript={t => setGalleryPrompt(galleryPrompt ? `${galleryPrompt} ${t}` : t)} size="sm" />
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
                  <Button
                    onClick={handleGenerateGallery}
                    disabled={isGeneratingGallery}
                    variant="outline"
                    className="w-full h-8 text-[10px] gap-1.5"
                  >
                    {isGeneratingGallery ? <RefreshCw size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    Generate More Designs
                  </Button>
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
        {FIELDS.map(f => (
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
  );
}
