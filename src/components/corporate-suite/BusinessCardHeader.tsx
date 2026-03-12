import React from "react";
import {
  Download, CreditCard, RefreshCw, Lock, Unlock, RotateCcw,
  Save, Share2, Image, Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessCardHeaderProps {
  editLayout: boolean;
  setEditLayout: (v: boolean | ((prev: boolean) => boolean)) => void;
  onResetLayout: () => void;
  isSaving: boolean;
  onSave: () => void;
  cardLicenseCode: string | null;
  isSharing: boolean;
  onShare: () => void;
  cardShape: string;
  isExportingHtml: boolean;
  onExportHtml: () => void;
  isExportingPng: boolean;
  onExportPng: () => void;
  onBatchPrint: () => void;
  isExporting: boolean;
  onExportPdf: () => void;
}

export function BusinessCardHeader({
  editLayout, setEditLayout, onResetLayout,
  isSaving, onSave, cardLicenseCode,
  isSharing, onShare,
  cardShape, isExportingHtml, onExportHtml,
  isExportingPng, onExportPng,
  onBatchPrint,
  isExporting, onExportPdf,
}: BusinessCardHeaderProps) {
  return (
    <div className="sticky top-0 lg:top-[48px] z-20 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary))] flex items-center justify-center">
              <CreditCard size={13} className="text-[hsl(var(--primary-foreground))]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[hsl(var(--foreground))] leading-none">Business Card Designer</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Shapes · QR · Drag · AI</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setEditLayout(v => !v)}
            className={`gap-1.5 h-8 text-xs ${editLayout ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.08)] text-[hsl(var(--gold-dark))]" : ""}`}
          >
            {editLayout ? <Lock size={12} /> : <Unlock size={12} />}
            {editLayout ? "Lock Layout" : "Edit Layout"}
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={onResetLayout}
            className="h-8 text-xs gap-1.5 border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            title="Reset field & logo positions to defaults"
          >
            <RotateCcw size={12} /> Reset
          </Button>

          <div className="flex flex-col items-end gap-1">
            <Button
              onClick={onSave}
              disabled={isSaving}
              variant="outline"
              className="gap-1.5 h-8 text-xs font-semibold border-[#C9A84C]/60 text-[#C9A84C] hover:bg-[#C9A84C]/10"
            >
              {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
              {isSaving ? "Saving…" : "Save Card"}
            </Button>
            {cardLicenseCode && (
              <span className="text-[9px] font-mono font-bold text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                {cardLicenseCode}
              </span>
            )}
          </div>

          <Button
            onClick={onShare}
            disabled={isSharing}
            variant="outline"
            className="gap-1.5 h-8 text-xs font-semibold border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
          >
            {isSharing ? <RefreshCw size={12} className="animate-spin" /> : <Share2 size={12} />}
            {isSharing ? "Generating…" : "Share"}
          </Button>

          {cardShape === "digital" && (
            <Button
              onClick={onExportHtml}
              disabled={isExportingHtml}
              variant="outline"
              className="gap-1.5 h-8 text-xs font-semibold border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)]"
            >
              {isExportingHtml ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
              {isExportingHtml ? "Exporting…" : "Export HTML"}
            </Button>
          )}

          <Button
            onClick={onExportPng}
            disabled={isExportingPng}
            variant="outline"
            className="gap-1.5 h-8 text-xs font-semibold border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
          >
            {isExportingPng ? <RefreshCw size={12} className="animate-spin" /> : <Image size={12} />}
            {isExportingPng ? "…" : "PNG"}
          </Button>

          <Button
            onClick={onBatchPrint}
            variant="outline"
            className="gap-1.5 h-8 text-xs font-semibold border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <Printer size={12} />
            Print
          </Button>

          <Button
            onClick={onExportPdf}
            disabled={isExporting}
            className="gap-2 h-8 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}
          >
            {isExporting ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
            {isExporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}
