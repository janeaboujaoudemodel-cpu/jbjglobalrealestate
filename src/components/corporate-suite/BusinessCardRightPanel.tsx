import React from "react";
import {
  Palette, ImageIcon, Type, QrCode, Sparkles, Droplets, Sun, Diamond, Stamp,
  ChevronDown, Minus, AlignLeft, AlignCenter, AlignRight, Underline,
  RefreshCw, Eye, Check, Star,
} from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { BrandAssetLibrary } from "@/components/corporate-suite/BrandAssetLibrary";
import CardShareAnalytics from "@/components/corporate-suite/CardShareAnalytics";
import { ColorPickerSection } from "./BusinessCardColorPicker";
import { CardFace } from "./BusinessCardPreview";
import { DeskMockup, PocketMockup, StationeryMockup, HandMockup } from "./BusinessCardMockups";
import {
  type Template, type TextAlign, type GradientDirection, type FinishEffect,
  type MockupScene, type CardData, type QrPosition, type QrContentType,
  type AiDesignData, type CardShape,
  COLOR_PRESETS, getShapeStyle,
  buildQrData, buildQrUrl,
} from "./businessCardTypes";

interface BusinessCardRightPanelProps {
  // Color state
  colorOpen: boolean;
  setColorOpen: (v: boolean) => void;
  cardShape: string;
  frontColorIdx: number;
  setFrontColorIdx: (v: number) => void;
  frontCustomColor: string;
  setFrontCustomColor: (v: string) => void;
  backColorIdx: number;
  setBackColorIdx: (v: number) => void;
  backCustomColor: string;
  setBackCustomColor: (v: string) => void;
  frontPrimary: string;
  backPrimary: string;
  useGradient: boolean;
  setUseGradient: (v: boolean) => void;
  gradientEnd: string;
  setGradientEnd: (v: string) => void;
  gradientDirection: GradientDirection;
  setGradientDirection: (v: GradientDirection) => void;

  // Brand Assets
  brandAssetOpen: boolean;
  setBrandAssetOpen: (v: boolean) => void;
  logoUrl: string;
  setLogoUrl: (v: string) => void;
  logoSize: number;
  setLogoSize: (v: number) => void;

  // Typography
  typographyOpen: boolean;
  setTypographyOpen: (v: boolean) => void;
  cardFontFamily: string;
  setCardFontFamily: (v: string) => void;
  cardFontBold: boolean;
  setCardFontBold: (v: boolean | ((prev: boolean) => boolean)) => void;
  cardFontItalic: boolean;
  setCardFontItalic: (v: boolean | ((prev: boolean) => boolean)) => void;
  cardFontSize: number | null;
  setCardFontSize: (v: number | null | ((prev: number | null) => number | null)) => void;
  cardTextAlign: TextAlign;
  setCardTextAlign: (v: TextAlign) => void;
  cardUnderline: boolean;
  setCardUnderline: (v: boolean | ((prev: boolean) => boolean)) => void;
  cardLetterSpacing: number;
  setCardLetterSpacing: (v: number) => void;
  cardLineHeight: number;
  setCardLineHeight: (v: number) => void;

  // QR
  qrOpen: boolean;
  setQrOpen: (v: boolean) => void;
  qrEnabled: boolean;
  setQrEnabled: (v: boolean) => void;
  qrContentType: QrContentType;
  setQrContentType: (v: QrContentType) => void;
  qrCustomContent: string;
  setQrCustomContent: (v: string) => void;
  qrSize: number;
  setQrSize: (v: number) => void;
  qrColor: string;
  setQrColor: (v: string) => void;
  qrBgColor: string;
  setQrBgColor: (v: string) => void;
  qrPosition: QrPosition;
  setQrPosition: (v: QrPosition) => void;
  qrSide: "front" | "back" | "both";
  setQrSide: (v: "front" | "back" | "both") => void;
  qrAiPrompt: string;
  setQrAiPrompt: (v: string) => void;
  isAiStylingQr: boolean;
  handleAiQrStyle: () => void;
  effectiveQrColor: string;
  qrDataStr: string;
  data: CardData;

  // AI Design
  aiDesignOpen: boolean;
  setAiDesignOpen: (v: boolean) => void;
  aiTone: string;
  setAiTone: (v: string) => void;
  aiIndustry: string;
  setAiIndustry: (v: string) => void;
  aiStyle: string;
  setAiStyle: (v: string) => void;
  aiDesignData: AiDesignData | null;
  setAiDesignData: (v: AiDesignData | null) => void;
  isGeneratingDesign: boolean;
  handleGenerateDesign: () => void;
  activeTemplate: Template;
  setActiveTemplate: (v: Template) => void;
  frontSecondary: string;
  frontAccent: string;

  // Finishing Effects
  finishOpen: boolean;
  setFinishOpen: (v: boolean) => void;
  finishEffect: FinishEffect;
  setFinishEffect: (v: FinishEffect) => void;

  // Mockups
  mockupOpen: boolean;
  setMockupOpen: (v: boolean) => void;
  mockupScene: MockupScene;
  setMockupScene: (v: MockupScene) => void;
  frontTemplate: Template;
}

export function BusinessCardRightPanel(props: BusinessCardRightPanelProps) {
  const {
    colorOpen, setColorOpen, cardShape,
    frontColorIdx, setFrontColorIdx, frontCustomColor, setFrontCustomColor,
    backColorIdx, setBackColorIdx, backCustomColor, setBackCustomColor,
    frontPrimary, backPrimary,
    useGradient, setUseGradient, gradientEnd, setGradientEnd,
    gradientDirection, setGradientDirection,
    brandAssetOpen, setBrandAssetOpen, logoUrl, setLogoUrl, logoSize, setLogoSize,
    typographyOpen, setTypographyOpen,
    cardFontFamily, setCardFontFamily, cardFontBold, setCardFontBold,
    cardFontItalic, setCardFontItalic, cardFontSize, setCardFontSize,
    cardTextAlign, setCardTextAlign, cardUnderline, setCardUnderline,
    cardLetterSpacing, setCardLetterSpacing, cardLineHeight, setCardLineHeight,
    qrOpen, setQrOpen, qrEnabled, setQrEnabled,
    qrContentType, setQrContentType, qrCustomContent, setQrCustomContent,
    qrSize, setQrSize, qrColor, setQrColor, qrBgColor, setQrBgColor,
    qrPosition, setQrPosition, qrSide, setQrSide,
    qrAiPrompt, setQrAiPrompt, isAiStylingQr, handleAiQrStyle,
    effectiveQrColor, qrDataStr, data,
    aiDesignOpen, setAiDesignOpen, aiTone, setAiTone,
    aiIndustry, setAiIndustry, aiStyle, setAiStyle,
    aiDesignData, setAiDesignData, isGeneratingDesign, handleGenerateDesign,
    activeTemplate, setActiveTemplate, frontSecondary, frontAccent,
    finishOpen, setFinishOpen, finishEffect, setFinishEffect,
    mockupOpen, setMockupOpen, mockupScene, setMockupScene, frontTemplate,
  } = props;

  return (
    <div className="space-y-4">
      {/* Per-Side Color System */}
      <Collapsible open={colorOpen} onOpenChange={setColorOpen}>
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <div className="flex items-center gap-2">
                <Palette size={13} className="text-[hsl(var(--gold))]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Colors</span>
                <div className="flex gap-1">
                  <div className="w-3.5 h-3.5 rounded-full border border-white shadow-sm" style={{ background: frontPrimary }} title="Front" />
                  <div className="w-3.5 h-3.5 rounded-full border border-white shadow-sm" style={{ background: backPrimary }} title="Back" />
                </div>
              </div>
              <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${colorOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-3">
              {cardShape === "email-signature" && (
                <p className="text-[9px] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] px-2 py-1.5 rounded-lg font-semibold">
                  ✨ Colors apply to your Email Signature border & accents
                </p>
              )}
              {cardShape === "ticket" && (
                <p className="text-[9px] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] px-2 py-1.5 rounded-lg font-semibold">
                  🎫 Colors apply to your Ticket stub & accents
                </p>
              )}
              <ColorPickerSection
                label={cardShape === "email-signature" ? "Signature Color" : cardShape === "ticket" ? "Ticket Color" : "Front Color"}
                colorIdx={frontColorIdx}
                customColor={frontCustomColor}
                onPresetChange={setFrontColorIdx}
                onCustomChange={setFrontCustomColor}
              />

              {/* Gradient / Ombre option */}
              <div className="border-t border-[hsl(var(--border))] pt-3">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                    <Palette size={10} /> Gradient / Ombré
                  </Label>
                  <Switch checked={useGradient} onCheckedChange={setUseGradient} />
                </div>
                {useGradient && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label className="text-[9px] text-[hsl(var(--muted-foreground))] mb-1 block">Start</Label>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-md border border-[hsl(var(--border))]" style={{ background: frontPrimary }} />
                          <span className="text-[9px] text-[hsl(var(--muted-foreground))]">Primary</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-3">→</span>
                      <div className="flex-1">
                        <Label className="text-[9px] text-[hsl(var(--muted-foreground))] mb-1 block">End</Label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={gradientEnd}
                            onChange={e => setGradientEnd(e.target.value)}
                            className="w-6 h-6 rounded-md border border-[hsl(var(--border))] cursor-pointer p-0"
                          />
                          <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{gradientEnd}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {([
                        { id: "135deg" as GradientDirection, label: "↘ Diagonal" },
                        { id: "45deg" as GradientDirection, label: "↗ Reverse" },
                        { id: "to right" as GradientDirection, label: "→ Horizontal" },
                        { id: "to bottom" as GradientDirection, label: "↓ Vertical" },
                        { id: "to left" as GradientDirection, label: "← Left" },
                        { id: "to top" as GradientDirection, label: "↑ Up" },
                      ]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setGradientDirection(opt.id)}
                          className={`text-[9px] py-1 px-1 rounded-lg border font-semibold transition-all text-center ${
                            gradientDirection === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div
                      className="h-6 rounded-lg border border-[hsl(var(--border))]"
                      style={{ background: `linear-gradient(${gradientDirection}, ${frontPrimary}, ${gradientEnd})` }}
                    />
                  </div>
                )}
              </div>

              {cardShape !== "email-signature" && (
                <>
                  <div className="border-t border-[hsl(var(--border))]" />
                  <ColorPickerSection
                    label="Back Color"
                    colorIdx={backColorIdx}
                    customColor={backCustomColor}
                    onPresetChange={setBackColorIdx}
                    onCustomChange={setBackCustomColor}
                  />
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Brand Assets */}
      <Collapsible open={brandAssetOpen} onOpenChange={setBrandAssetOpen}>
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <div className="flex items-center gap-2">
                <ImageIcon size={13} className="text-[hsl(var(--gold))]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Brand Assets</span>
                {logoUrl && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
              </div>
              <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${brandAssetOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] py-2">Upload logos, monograms, signatures — shown on BOTH sides. Drag to reposition (Enable Edit Layout).</p>
              <BrandAssetLibrary
                assetTypes={["monogram", "logo", "signature"]}
                selectedUrl={logoUrl}
                onSelect={asset => setLogoUrl(asset.file_url)}
                showSizeControl
                sizeValue={logoSize}
                onSizeChange={setLogoSize}
                sizeLabel="Logo Size"
                sizeMin={30}
                sizeMax={140}
              />
              {logoUrl && (
                <button
                  onClick={() => setLogoUrl("")}
                  className="mt-2 text-[10px] text-red-500 hover:underline"
                >
                  Remove logo from card
                </button>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Typography panel */}
      <Collapsible open={typographyOpen} onOpenChange={setTypographyOpen}>
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <div className="flex items-center gap-2">
                <Type size={13} className="text-[hsl(var(--gold))]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Typography</span>
                {(cardFontBold || cardFontItalic || cardFontSize != null) && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
              </div>
              <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${typographyOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-3">
              {/* Style toggles */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Style</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCardFontBold(v => !v)}
                    className={`w-10 h-10 rounded-lg border-2 font-bold text-sm transition-all ${cardFontBold ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onClick={() => setCardFontItalic(v => !v)}
                    className={`w-10 h-10 rounded-lg border-2 italic font-semibold text-sm transition-all ${cardFontItalic ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    onClick={() => setCardUnderline(v => !v)}
                    className={`w-10 h-10 rounded-lg border-2 text-sm transition-all flex items-center justify-center ${cardUnderline ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"}`}
                    title="Underline"
                  >
                    <Underline size={14} />
                  </button>
                </div>
              </div>

              {/* Text Alignment */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Alignment</Label>
                <div className="flex gap-1.5">
                  {([
                    { id: "left" as TextAlign, icon: <AlignLeft size={13} /> },
                    { id: "center" as TextAlign, icon: <AlignCenter size={13} /> },
                    { id: "right" as TextAlign, icon: <AlignRight size={13} /> },
                  ]).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setCardTextAlign(opt.id)}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                        cardTextAlign === opt.id
                          ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                          : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                      }`}
                    >
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">Font Size</Label>
                  <div className="flex items-center gap-1.5">
                    {cardFontSize != null && (
                      <button onClick={() => setCardFontSize(null)} className="text-[9px] text-[hsl(var(--muted-foreground))] underline hover:text-[hsl(var(--foreground))]">Auto</button>
                    )}
                    <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{cardFontSize != null ? `${cardFontSize}pt` : "Auto"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCardFontSize(v => Math.max(8, (v ?? 18) - 0.5))}
                    className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:border-[hsl(var(--gold)/0.5)] transition-colors"
                  ><Minus size={12} /></button>
                  <div className="flex-1">
                    <Slider
                      min={8} max={18} step={0.5}
                      value={[cardFontSize ?? 18]}
                      onValueChange={([v]) => setCardFontSize(v)}
                    />
                  </div>
                  <button
                    onClick={() => setCardFontSize(v => Math.min(18, (v ?? 18) + 0.5))}
                    className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center hover:border-[hsl(var(--gold)/0.5)] transition-colors"
                  >
                    <span className="text-xs font-bold">A</span>
                  </button>
                </div>
              </div>

              {/* Letter Spacing */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">Letter Spacing</Label>
                  <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{cardLetterSpacing}px</span>
                </div>
                <Slider min={-1} max={6} step={0.5} value={[cardLetterSpacing]} onValueChange={([v]) => setCardLetterSpacing(v)} />
              </div>

              {/* Line Height */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">Line Height</Label>
                  <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{cardLineHeight}</span>
                </div>
                <Slider min={0.8} max={2} step={0.1} value={[cardLineHeight]} onValueChange={([v]) => setCardLineHeight(v)} />
              </div>

              {/* Font Family */}
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Font Family</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "'Helvetica Neue', Arial, sans-serif", label: "Helvetica" },
                    { id: "'Georgia', 'Times New Roman', serif", label: "Georgia" },
                    { id: "'Courier New', monospace", label: "Courier" },
                    { id: "'Trebuchet MS', sans-serif", label: "Trebuchet" },
                    { id: "'Palatino Linotype', 'Book Antiqua', serif", label: "Palatino" },
                    { id: "'Segoe UI', Tahoma, sans-serif", label: "Segoe UI" },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setCardFontFamily(opt.id)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all text-left ${
                        cardFontFamily === opt.id
                          ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                          : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                      }`}
                      style={{ fontFamily: opt.id }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* QR Code */}
      <Collapsible open={qrOpen} onOpenChange={setQrOpen}>
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <div className="flex items-center gap-2">
                <QrCode size={13} className="text-[hsl(var(--gold))]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">QR Code</span>
                {qrEnabled && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
              </div>
              <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${qrOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))]">Enable QR</Label>
                <Switch checked={qrEnabled} onCheckedChange={setQrEnabled} />
              </div>

              {qrEnabled && (
                <>
                  {/* QR Side selector */}
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Show QR On</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { id: "both" as const, label: "Both Sides" },
                        { id: "front" as const, label: "Front Only" },
                        { id: "back" as const, label: "Back Only" },
                      ]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setQrSide(opt.id)}
                          className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                            qrSide === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">QR Content Type</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { id: "url", label: "URL" }, { id: "vcard", label: "vCard" }, { id: "text", label: "Text" },
                        { id: "email", label: "Email" }, { id: "phone", label: "Phone" },
                      ] as { id: QrContentType; label: string }[]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setQrContentType(opt.id);
                            setQrCustomContent("");
                            if (opt.id === "url" && data.website) setQrCustomContent(data.website);
                            if (opt.id === "email" && data.email) setQrCustomContent(data.email);
                            if (opt.id === "phone" && data.phone) setQrCustomContent(data.phone);
                          }}
                          className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                            qrContentType === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {(qrContentType === "url" || qrContentType === "text" || qrContentType === "email" || qrContentType === "phone") && (
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 block">
                        {qrContentType === "url" ? "URL / Link" :
                         qrContentType === "email" ? "Email Address" :
                         qrContentType === "phone" ? "Phone Number" :
                         "Custom Text"}
                      </Label>
                      <Input
                        value={qrCustomContent}
                        onChange={e => setQrCustomContent(e.target.value)}
                        placeholder={
                          qrContentType === "url" ? "https://yourwebsite.com" :
                          qrContentType === "email" ? data.email || "email@example.com" :
                          qrContentType === "phone" ? data.phone || "+971 50 123 4567" :
                          "Custom message..."
                        }
                        className="h-8 text-xs"
                      />
                      {(qrContentType === "email" || qrContentType === "phone") && !qrCustomContent && (
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">
                          Using card {qrContentType} · Type above to override
                        </p>
                      )}
                    </div>
                  )}
                  {qrContentType === "vcard" && (
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-lg px-3 py-2">
                      vCard QR uses your card info (name, phone, email, company) automatically.
                    </p>
                  )}

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 block">QR Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={effectiveQrColor}
                        onChange={e => setQrColor(e.target.value)}
                        className="w-10 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer p-0.5"
                      />
                      <div className="flex-1">
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                          {qrColor ? "Custom color" : `Auto-synced to Front color`}
                        </p>
                      </div>
                      {qrColor && (
                        <button onClick={() => setQrColor("")} className="text-[9px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] underline">Reset</button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 block">Background</Label>
                    <div className="flex gap-2">
                      {["#ffffff", "#f5f5f5", "#000000"].map(bg => (
                        <button
                          key={bg}
                          onClick={() => setQrBgColor(bg)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${qrBgColor === bg ? "border-[hsl(var(--gold))] scale-105" : "border-[hsl(var(--border))]"}`}
                          style={{ background: bg }}
                          title={bg}
                        />
                      ))}
                      <input
                        type="color"
                        value={qrBgColor}
                        onChange={e => setQrBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] cursor-pointer p-0.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Size: {qrSize}px</Label>
                    <Slider min={40} max={180} step={4} value={[qrSize]} onValueChange={([v]) => setQrSize(v)} />
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Placement</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {([
                        { id: "top-left", label: "↖ Top Left" }, { id: "top-right", label: "Top Right ↗" },
                        { id: "center", label: "⊙ Center" },
                        { id: "bottom-left", label: "↙ Bot Left" }, { id: "bottom-right", label: "Bot Right ↘" },
                      ] as { id: QrPosition; label: string }[]).map(opt => (
                        <button
                          key={opt.id}
                          onClick={() => setQrPosition(opt.id)}
                          className={`text-[9px] py-1.5 px-1 rounded-lg border font-semibold transition-all text-center ${
                            qrPosition === opt.id
                              ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                              : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-1.5 flex items-center gap-1 block">
                      <Sparkles size={10} /> Smart Style QR
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={qrAiPrompt}
                        onChange={e => setQrAiPrompt(e.target.value)}
                        placeholder="e.g. dark blue, large, bottom right..."
                        className="h-8 text-xs flex-1"
                        onKeyDown={e => e.key === "Enter" && handleAiQrStyle()}
                      />
                      <VoiceInputButton onTranscript={t => setQrAiPrompt(prev => prev ? `${prev} ${t}` : t)} size="sm" />
                      <Button
                        size="sm"
                        onClick={handleAiQrStyle}
                        disabled={isAiStylingQr || !qrAiPrompt.trim()}
                        className="h-8 text-xs gap-1"
                        style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))", color: "white" }}
                      >
                        {isAiStylingQr ? <RefreshCw size={11} className="animate-spin" /> : <Sparkles size={11} />}
                        {isAiStylingQr ? "..." : "Apply"}
                      </Button>
                    </div>
                  </div>

                  {qrDataStr && (
                    <div className="flex items-center gap-3 p-3 bg-[hsl(var(--muted))] rounded-xl">
                      <img
                        src={buildQrUrl(qrDataStr, effectiveQrColor, qrBgColor, qrSize)}
                        alt="QR Preview"
                        className="rounded"
                        style={{ width: 56, height: 56 }}
                      />
                      <div>
                        <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">QR Preview</p>
                        <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-0.5">
                          {qrContentType.toUpperCase()} · {qrSize}px · {qrPosition}
                        </p>
                        <p className="text-[9px] text-green-600 mt-0.5">
                          Shows on: {qrSide === "both" ? "Front & Back" : qrSide === "front" ? "Front only" : "Back only"}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Smart Design Generator */}
      <Collapsible open={aiDesignOpen} onOpenChange={setAiDesignOpen}>
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[hsl(var(--gold))]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Smart Design Generator</span>
                {aiDesignData && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                {activeTemplate === "ai-design" && aiDesignData && (
                  <span className="text-[9px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold">Active</span>
                )}
              </div>
              <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${aiDesignOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Generate geometric shapes, triangles, lines, circles and architectural patterns for a unique business card.
              </p>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Tone</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "modern",  label: "Modern"  },
                    { id: "luxe",    label: "Luxe"    },
                    { id: "tech",    label: "Tech"    },
                    { id: "minimal", label: "Minimal" },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setAiTone(opt.id)}
                      className={`text-[10px] py-2 px-1 rounded-lg border font-semibold transition-all ${
                        aiTone === opt.id
                          ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                          : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Industry</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "real-estate",  label: "Real Estate" },
                    { id: "technology",   label: "Technology" },
                    { id: "fashion",      label: "Fashion" },
                    { id: "finance",      label: "Finance" },
                    { id: "healthcare",   label: "Healthcare" },
                    { id: "creative",     label: "Creative" },
                    { id: "law",          label: "Law" },
                    { id: "hospitality",  label: "Hospitality" },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setAiIndustry(opt.id)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all text-left ${
                        aiIndustry === opt.id
                          ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                          : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">Pattern Style</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "geometric",  label: "Geometric" },
                    { id: "lines",      label: "Lines" },
                    { id: "futuristic", label: "Futuristic" },
                    { id: "organic",    label: "Organic" },
                    { id: "abstract",   label: "Abstract" },
                    { id: "waves",      label: "Waves" },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setAiStyle(opt.id)}
                      className={`text-[10px] py-1.5 px-2 rounded-lg border font-semibold transition-all ${
                        aiStyle === opt.id
                          ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                          : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateDesign}
                  disabled={isGeneratingDesign}
                  className="flex-1 h-9 text-xs gap-2 font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}
                >
                  {isGeneratingDesign ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {isGeneratingDesign ? "Generating…" : (aiDesignData ? "Regenerate" : "Generate Design")}
                </Button>
                {aiDesignData && (
                  <Button
                    onClick={() => { setAiDesignData(null); if (activeTemplate === "ai-design") setActiveTemplate("modern"); }}
                    disabled={isGeneratingDesign}
                    variant="outline"
                    className="h-9 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {aiDesignData && (
                <div className="rounded-xl overflow-hidden border border-[hsl(var(--gold)/0.3)] shadow-sm">
                  <div className="bg-[hsl(var(--muted))] px-3 py-1.5 flex items-center justify-between">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--muted-foreground))]">Live Preview</p>
                    <p className="text-[9px] text-[hsl(var(--gold-dark))]">{aiDesignData.industry || aiIndustry} · {aiDesignData.style || aiStyle}</p>
                  </div>
                  <CardFace
                    data={data}
                    template="ai-design"
                    primary={frontPrimary}
                    secondary={frontSecondary}
                    accent={frontAccent}
                    side="front"
                    scale={0.5}
                    shapeStyle={{ aspectRatio: "3.5 / 2", borderRadius: 0 }}
                    aiDesignData={aiDesignData}
                    fontFamily={cardFontFamily}
                    fontWeight={cardFontBold ? "bold" : undefined}
                    fontStyle={cardFontItalic ? "italic" : undefined}
                    nameFontSize={cardFontSize}
                  />
                  <div className="bg-[hsl(var(--muted))] px-3 py-1.5 text-center">
                    <button
                      onClick={() => setActiveTemplate("ai-design")}
                      className="text-[9px] font-semibold text-[hsl(var(--gold-dark))] hover:underline"
                    >
                      {activeTemplate === "ai-design" ? "✓ Applied to card" : "→ Apply to card"}
                    </button>
                  </div>
                </div>
              )}

              {isGeneratingDesign && (
                <div className="flex items-center gap-2 p-3 bg-[hsl(var(--muted))] rounded-xl">
                  <RefreshCw size={14} className="animate-spin text-[hsl(var(--gold))]" />
                  <div>
                    <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Generating design…</p>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Creating {aiTone} {aiStyle} patterns for {aiIndustry}</p>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Finishing Effects */}
      <Collapsible open={finishOpen} onOpenChange={setFinishOpen}>
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <div className="flex items-center gap-2">
                <Droplets size={13} className="text-[hsl(var(--gold))]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Finishing Effects</span>
                {finishEffect !== "none" && (
                  <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold capitalize">{finishEffect}</span>
                )}
              </div>
              <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${finishOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Simulate print finishing effects on your card preview to visualise the final product.
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { id: "none" as FinishEffect, label: "None", icon: <Minus size={12} /> },
                  { id: "matte" as FinishEffect, label: "Matte", icon: <Sun size={12} /> },
                  { id: "glossy" as FinishEffect, label: "Glossy", icon: <Droplets size={12} /> },
                  { id: "spot-uv" as FinishEffect, label: "Spot UV", icon: <Diamond size={12} /> },
                  { id: "embossed" as FinishEffect, label: "Emboss", icon: <Stamp size={12} /> },
                ]).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFinishEffect(opt.id)}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all ${
                      finishEffect === opt.id
                        ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]"
                        : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                    }`}
                  >
                    {opt.icon}
                    <span className="text-[8px] font-semibold leading-none">{opt.label}</span>
                  </button>
                ))}
              </div>
              {finishEffect !== "none" && (
                <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-[10px] text-[hsl(var(--muted-foreground))]">
                  {finishEffect === "matte" && "🖨️ Matte — Soft, non-reflective finish. Elegant and smudge-resistant."}
                  {finishEffect === "glossy" && "✨ Glossy — High-shine reflective coating. Vibrant colors pop."}
                  {finishEffect === "spot-uv" && "💎 Spot UV — Selective gloss areas create depth and contrast."}
                  {finishEffect === "embossed" && "🔳 Embossed — Raised texture for a tactile, premium feel."}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Mockup Previews */}
      <Collapsible open={mockupOpen} onOpenChange={setMockupOpen}>
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <div className="flex items-center gap-2">
                <ImageIcon size={13} className="text-[hsl(var(--gold))]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Mockup Preview</span>
                {mockupScene !== "none" && (
                  <span className="text-[8px] bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] px-1.5 py-0.5 rounded-full font-semibold capitalize">{mockupScene}</span>
                )}
              </div>
              <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${mockupOpen ? "rotate-180" : ""}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                Preview your card in realistic scenes to see how it looks in real life.
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  { id: "none" as MockupScene, label: "None" },
                  { id: "desk" as MockupScene, label: "Desk" },
                  { id: "pocket" as MockupScene, label: "Pocket" },
                  { id: "stationery" as MockupScene, label: "Kit" },
                  { id: "hand" as MockupScene, label: "Hand" },
                ]).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setMockupScene(opt.id)}
                    className={`text-[9px] py-2 px-1 rounded-xl border font-semibold transition-all ${
                      mockupScene === opt.id
                        ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]"
                        : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {mockupScene !== "none" && (
                <div className="rounded-xl overflow-hidden border border-[hsl(var(--border))] shadow-sm">
                  {mockupScene === "desk" && (
                    <DeskMockup finishEffect={finishEffect}>
                      <CardFace data={data} template={frontTemplate} primary={frontPrimary} secondary={frontSecondary} accent={frontAccent} side="front" scale={0.7} shapeStyle={getShapeStyle(cardShape)} aiDesignData={aiDesignData} cardShape={cardShape} fontFamily={cardFontFamily} fontWeight={cardFontBold ? "bold" : undefined} fontStyle={cardFontItalic ? "italic" : undefined} nameFontSize={cardFontSize} />
                    </DeskMockup>
                  )}
                  {mockupScene === "pocket" && (
                    <PocketMockup finishEffect={finishEffect}>
                      <CardFace data={data} template={frontTemplate} primary={frontPrimary} secondary={frontSecondary} accent={frontAccent} side="front" scale={0.6} shapeStyle={getShapeStyle(cardShape)} aiDesignData={aiDesignData} cardShape={cardShape} fontFamily={cardFontFamily} fontWeight={cardFontBold ? "bold" : undefined} fontStyle={cardFontItalic ? "italic" : undefined} nameFontSize={cardFontSize} />
                    </PocketMockup>
                  )}
                  {mockupScene === "stationery" && (
                    <StationeryMockup data={data} primary={frontPrimary} finishEffect={finishEffect}>
                      <CardFace data={data} template={frontTemplate} primary={frontPrimary} secondary={frontSecondary} accent={frontAccent} side="front" scale={0.6} shapeStyle={getShapeStyle(cardShape)} aiDesignData={aiDesignData} cardShape={cardShape} fontFamily={cardFontFamily} fontWeight={cardFontBold ? "bold" : undefined} fontStyle={cardFontItalic ? "italic" : undefined} nameFontSize={cardFontSize} />
                    </StationeryMockup>
                  )}
                  {mockupScene === "hand" && (
                    <HandMockup finishEffect={finishEffect}>
                      <CardFace data={data} template={frontTemplate} primary={frontPrimary} secondary={frontSecondary} accent={frontAccent} side="front" scale={0.7} shapeStyle={getShapeStyle(cardShape)} aiDesignData={aiDesignData} cardShape={cardShape} fontFamily={cardFontFamily} fontWeight={cardFontBold ? "bold" : undefined} fontStyle={cardFontItalic ? "italic" : undefined} nameFontSize={cardFontSize} />
                    </HandMockup>
                  )}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Share Analytics */}
      <Collapsible>
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
              <div className="flex items-center gap-2">
                <Eye size={13} className="text-[hsl(var(--gold))]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Share Analytics</span>
              </div>
              <ChevronDown size={13} className="text-[hsl(var(--muted-foreground))]" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
              <div className="pt-3">
                <CardShareAnalytics />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
