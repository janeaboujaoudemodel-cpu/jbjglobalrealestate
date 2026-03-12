import React from "react";
import {
  Share2, Copy, ExternalLink, Printer, Wifi, Smartphone,
  CreditCard, Type, Globe, Check, Star, Sparkles,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { buildQrUrl } from "./businessCardTypes";

/* ── Share Modal ──────────────────────────────────────────────────── */
export function ShareModal({
  open, onOpenChange, shareToken, frontPrimary,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  shareToken: string; frontPrimary: string;
}) {
  const shareUrl = `${window.location.origin}/card/${shareToken}`;
  const qrUrl = buildQrUrl(shareUrl, frontPrimary, "#ffffff", 160);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 size={16} className="text-[hsl(var(--gold))]" />
            Share Your Card
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can view your card and save your contact
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm">
              <img src={qrUrl} alt="Share QR Code" className="w-40 h-40 rounded-lg" />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 h-9 px-3 text-xs rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] select-all focus:outline-none"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline" size="sm" className="h-9 gap-1.5 text-xs"
              onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); }}
            >
              <Copy size={12} /> Copy
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline" size="sm"
              className="h-9 gap-1.5 text-xs border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
              onClick={() => {
                const msg = encodeURIComponent(`Here's my digital business card: ${shareUrl}`);
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
            >
              💬 WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => window.open(shareUrl, "_blank")}>
              <ExternalLink size={12} /> Preview
            </Button>
          </div>

          <p className="text-[10px] text-center text-[hsl(var(--muted-foreground))]">
            Scan QR or share the link — recipients can tap "Save Contact" to add you instantly
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Batch Print Dialog ───────────────────────────────────────────── */
export function BatchPrintDialog({
  open, onOpenChange, count, setCount, onPrint,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  count: number; setCount: (v: number) => void; onPrint: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer size={16} className="text-[hsl(var(--gold))]" />
            Batch Print Layout
          </DialogTitle>
          <DialogDescription>
            Print multiple cards on a single A4 sheet for professional cutting.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[hsl(var(--muted-foreground))] mb-2 block">
              Cards per page: {count}
            </Label>
            <Slider min={2} max={10} step={2} value={[count]} onValueChange={([v]) => setCount(v)} />
            <p className="text-[9px] text-[hsl(var(--muted-foreground))] mt-1">Standard: 8 cards per A4 (2×4 grid)</p>
          </div>
          <div className="rounded-xl bg-[hsl(var(--muted))] p-3 text-[10px] text-[hsl(var(--muted-foreground))] space-y-1">
            <p className="font-semibold text-[hsl(var(--foreground))]">📐 Print Tips</p>
            <p>• Use thick cardstock (300gsm+) for professional results</p>
            <p>• Print at 100% scale — do not "Fit to page"</p>
            <p>• Cut along the borders with a paper trimmer</p>
          </div>
          <Button
            onClick={onPrint}
            className="w-full gap-2 font-semibold text-white"
            style={{ background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))" }}
          >
            <Printer size={14} /> Print {count} Cards
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── NFC Guide Modal ──────────────────────────────────────────────── */
export function NfcGuideDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Wifi size={20} className="text-[hsl(var(--gold))]" />
            NFC Tag Programming Guide
          </DialogTitle>
          <DialogDescription>
            Write your digital card URL to an NFC sticker so anyone can tap and view your card instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          <div className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--muted))]">
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
              <CreditCard size={14} className="text-[hsl(var(--gold))]" />
              What You Need
            </h4>
            <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1.5 list-disc pl-4">
              <li>An NFC sticker/card (NTAG213 or NTAG215 — available on Amazon for ~$1 each)</li>
              <li>A smartphone with NFC capability (most modern phones have it)</li>
              <li>A free NFC writer app (see below)</li>
              <li>Your shared card URL (from the Share button after saving)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Sparkles size={14} className="text-[hsl(var(--gold))]" />
              Step-by-Step Instructions
            </h4>

            {[
              { step: 1, title: "Download a Free NFC App", desc: 'Install "NFC Tools" (free on both iOS and Android) from the App Store or Google Play.', icon: <Smartphone size={16} /> },
              { step: 2, title: "Get Your Card URL", desc: 'Save your digital card, click "Share", and copy the public link (e.g., yoursite.com/card/abc123).', icon: <Copy size={16} /> },
              { step: 3, title: "Open NFC Tools → Write", desc: 'Open the app, tap the "Write" tab, then tap "Add a record" → select "URL/URI".', icon: <Type size={16} /> },
              { step: 4, title: "Paste Your Card URL", desc: "Paste your shared card URL into the URL field. Make sure it starts with https://.", icon: <Globe size={16} /> },
              { step: 5, title: "Hold Phone to NFC Tag", desc: 'Tap "Write", then hold the back of your phone against the NFC sticker until you see a success confirmation.', icon: <Wifi size={16} /> },
              { step: 6, title: "Test It!", desc: "Have someone tap their phone on the sticker — your digital card page opens instantly in their browser.", icon: <Check size={16} /> },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold))] flex items-center justify-center text-xs font-bold">
                  {step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
                    {icon} {title}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[hsl(var(--gold)/0.3)] p-4 bg-[hsl(var(--gold)/0.05)]">
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2">Recommended Free Apps</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: "NFC Tools", platform: "iOS & Android", note: "Most popular, clean UI" },
                { name: "NFC TagWriter", platform: "Android", note: "By NXP (chip maker)" },
                { name: "Simply NFC", platform: "iOS", note: "Minimal & fast" },
                { name: "TagInfo", platform: "Android", note: "Read & diagnose tags" },
              ].map(app => (
                <div key={app.name} className="p-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{app.name}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{app.platform}</p>
                  <p className="text-[10px] text-[hsl(var(--gold-dark))]">{app.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--muted))]">
            <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-2 flex items-center gap-2">
              <Star size={14} className="text-[hsl(var(--gold))]" />
              Pro Tips
            </h4>
            <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1.5 list-disc pl-4">
              <li>Stick NFC tags on the back of your physical business card, phone case, or portfolio</li>
              <li>NTAG215 tags hold more data and are compatible with more phones</li>
              <li>Lock the tag after writing to prevent others from overwriting your URL</li>
              <li>Test with multiple phones (iPhone & Android) before distributing</li>
              <li>Update your shared card anytime — the same URL always shows the latest version</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
