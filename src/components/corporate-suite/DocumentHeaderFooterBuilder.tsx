/**
 * DocumentHeaderFooterBuilder — Header/footer editor with QR, copyright, links.
 */
import { useState } from "react";
import { LayoutTemplate, QrCode, Link2, Copyright, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface HeaderFooterSettings {
  showHeader: boolean;
  companyName: string;
  companyTagline: string;
  contactLine: string;
  showQrCode: boolean;
  qrUrl: string;
  showFooter: boolean;
  copyrightText: string;
  footerLinks: string;
  showBusinessCard: boolean;
  showPageNumbers: boolean;
}

interface Props {
  settings: HeaderFooterSettings;
  onChange: (s: HeaderFooterSettings) => void;
}

export default function DocumentHeaderFooterBuilder({ settings, onChange }: Props) {
  const set = (partial: Partial<HeaderFooterSettings>) => onChange({ ...settings, ...partial });

  const Toggle = ({ label, value, field }: { label: string; value: boolean; field: keyof HeaderFooterSettings }) => (
    <div className="flex items-center justify-between">
      <Label className="text-[10px] text-[hsl(var(--muted-foreground))]">{label}</Label>
      <button
        onClick={() => set({ [field]: !value })}
        className={`w-8 h-4 rounded-full transition-colors ${value ? "bg-[hsl(var(--gold))]" : "bg-[hsl(var(--muted))]"}`}
      >
        <div className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <LayoutTemplate size={12} className="text-[hsl(var(--gold))]" />
        <span className="text-xs font-bold text-[hsl(var(--foreground))]">Header & Footer</span>
      </div>

      {/* Header */}
      <Toggle label="Custom Header" value={settings.showHeader} field="showHeader" />
      {settings.showHeader && (
        <div className="space-y-2 pl-2 border-l-2 border-[hsl(var(--gold)/0.3)]">
          <div>
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Company Name</Label>
            <Input value={settings.companyName} onChange={e => set({ companyName: e.target.value })} className="h-7 text-xs" placeholder="JBJ Global Real Estate" />
          </div>
          <div>
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Tagline</Label>
            <Input value={settings.companyTagline} onChange={e => set({ companyTagline: e.target.value })} className="h-7 text-xs" placeholder="Premium Real Estate Services" />
          </div>
          <div>
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Contact Line</Label>
            <Input value={settings.contactLine} onChange={e => set({ contactLine: e.target.value })} className="h-7 text-xs" placeholder="+971 50 000 0000 | info@jbj.ae" />
          </div>
        </div>
      )}

      {/* QR Code */}
      <Toggle label="QR Code" value={settings.showQrCode} field="showQrCode" />
      {settings.showQrCode && (
        <div className="pl-2 border-l-2 border-[hsl(var(--gold)/0.3)]">
          <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">QR URL</Label>
          <Input value={settings.qrUrl} onChange={e => set({ qrUrl: e.target.value })} className="h-7 text-xs" placeholder="https://jbj.ae" />
        </div>
      )}

      {/* Footer */}
      <Toggle label="Custom Footer" value={settings.showFooter} field="showFooter" />
      {settings.showFooter && (
        <div className="space-y-2 pl-2 border-l-2 border-[hsl(var(--gold)/0.3)]">
          <div>
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Copyright</Label>
            <Input value={settings.copyrightText} onChange={e => set({ copyrightText: e.target.value })} className="h-7 text-xs" placeholder="© 2026 JBJ Global Real Estate" />
          </div>
          <div>
            <Label className="text-[9px] text-[hsl(var(--muted-foreground))]">Footer Links</Label>
            <Input value={settings.footerLinks} onChange={e => set({ footerLinks: e.target.value })} className="h-7 text-xs" placeholder="www.jbj.ae | Privacy Policy" />
          </div>
          <Toggle label="Page Numbers" value={settings.showPageNumbers} field="showPageNumbers" />
        </div>
      )}

      {/* Business Card */}
      <Toggle label="Embed Business Card" value={settings.showBusinessCard} field="showBusinessCard" />
      {settings.showBusinessCard && (
        <p className="text-[9px] text-[hsl(var(--muted-foreground))] pl-2">
          Your saved e-signature card will appear in the footer section.
        </p>
      )}
    </div>
  );
}
