import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Move, RefreshCw, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DigitalLandingPageEditor from "@/components/corporate-suite/DigitalLandingPageEditor";
import {
  type CardData, type BilingualMode, type Template, type FinishEffect,
  BILINGUAL_LANGUAGES, TEMPLATES, CARD_SHAPES,
  getFinishOverlayStyle,
} from "./businessCardTypes";
import { PhoneMockup } from "./BusinessCardMockups";
import { CardFace, CardCanvas } from "./BusinessCardPreview";

interface BusinessCardCenterPanelProps {
  side: "front" | "back";
  setSide: (v: "front" | "back") => void;
  editLayout: boolean;
  setEditLayout: (v: boolean | ((prev: boolean) => boolean)) => void;
  isSharing: boolean;
  handleShareCard: () => void;
  cardShape: string;
  cardPreviewRef: React.RefObject<HTMLDivElement | null>;
  // Card canvas props
  data: CardData;
  frontTemplate: Template;
  backTemplate: Template;
  frontPrimary: string;
  frontSecondary: string;
  frontAccent: string;
  backPrimary: string;
  backSecondary: string;
  backAccent: string;
  fieldPositions: any;
  handleFieldMove: (field: string, pos: { x: number; y: number }) => void;
  qrEnabled: boolean;
  qrDataStr: string;
  qrSize: number;
  effectiveQrColor: string;
  qrBgColor: string;
  qrPosition: string;
  qrSide: string;
  logoUrl: string;
  logoSize: number;
  logoPos: { x: number; y: number };
  setLogoPos: (v: { x: number; y: number }) => void;
  aiDesignData: any;
  cardFontFamily: string;
  cardFontBold: boolean;
  cardFontItalic: boolean;
  cardFontSize: number;
  bilingualMode: BilingualMode;
  bilingualDir: "ltr" | "rtl";
  secondaryData: CardData;
  setInlineEditField: (v: keyof CardData | null) => void;
  inlineEditField: keyof CardData | null;
  setData: React.Dispatch<React.SetStateAction<CardData>>;
  finishEffect: string;
  // Template grid
  frontColorIdx: number;
  backColorIdx: number;
  setFrontTemplate: (v: string) => void;
  setBackTemplate: (v: string) => void;
  // Digital mode
  landingPageData: any;
  setLandingPageData: (v: any) => void;
  digitalTab: "card" | "landing";
  setDigitalTab: (v: "card" | "landing") => void;
  isExportingHtml: boolean;
  handleExportHtml: () => void;
  bilingualLang: string;
}

export function BusinessCardCenterPanel(props: BusinessCardCenterPanelProps) {
  const {
    side, setSide, editLayout, setEditLayout, isSharing, handleShareCard,
    cardShape, cardPreviewRef,
    data, frontTemplate, backTemplate,
    frontPrimary, frontSecondary, frontAccent,
    backPrimary, backSecondary, backAccent,
    fieldPositions, handleFieldMove,
    qrEnabled, qrDataStr, qrSize, effectiveQrColor, qrBgColor, qrPosition, qrSide,
    logoUrl, logoSize, logoPos, setLogoPos,
    aiDesignData, cardFontFamily, cardFontBold, cardFontItalic, cardFontSize,
    bilingualMode, bilingualDir, secondaryData, setInlineEditField, inlineEditField, setData,
    finishEffect, frontColorIdx, backColorIdx, setFrontTemplate, setBackTemplate,
    landingPageData, setLandingPageData, digitalTab, setDigitalTab,
    isExportingHtml, handleExportHtml, bilingualLang,
  } = props;

  const canvasProps = {
    data,
    template: frontTemplate,
    backTemplate,
    primary: frontPrimary,
    secondary: frontSecondary,
    accent: frontAccent,
    backPrimary,
    backSecondary,
    backAccent,
    side,
    cardShape,
    editLayout,
    fieldPositions,
    onFieldMove: handleFieldMove,
    qrEnabled,
    qrData: qrDataStr,
    qrSize,
    qrColor: effectiveQrColor,
    qrBgColor,
    qrPosition,
    qrSide,
    logoUrl,
    logoSize,
    logoPos,
    onLogoMove: setLogoPos,
    aiDesignData,
    fontFamily: cardFontFamily,
    fontWeight: cardFontBold ? ("bold" as const) : undefined,
    fontStyle: cardFontItalic ? ("italic" as const) : undefined,
    nameFontSize: cardFontSize,
    bilingualMode,
    bilingualDir,
    secondaryData,
    onInlineEdit: (field: keyof CardData) => setInlineEditField(field),
  };

  return (
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
            <CardCanvas {...canvasProps} />
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
                  <CardCanvas {...canvasProps} />
                  {finishEffect !== "none" && <div style={getFinishOverlayStyle(finishEffect)} />}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Inline edit input */}
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

        {/* Digital mode tabs + landing page editor */}
        {cardShape === "digital" && (
          <div className="w-full space-y-3">
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
  );
}
