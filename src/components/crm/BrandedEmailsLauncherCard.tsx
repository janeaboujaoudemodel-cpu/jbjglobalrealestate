/**
 * BrandedEmailsLauncherCard
 *
 * A compact champagne/emerald card that surfaces the JBJ Branded Email
 * Composer in any portal (Brokerage, Broker, Developer). Clicking the card
 * opens the full BrandedEmailComposer in a dialog — same locked identity
 * (contact@jbj.ae · "JBJ GLOBAL REAL ESTATE") and campaign flow used in CRM.
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Mail, Sparkles, Send } from "lucide-react";
import { BrandedEmailComposer } from "@/components/crm/BrandedEmailComposer";

type Variant = "owner" | "broker" | "developer";

const COPY: Record<Variant, { eyebrow: string; title: string; blurb: string }> = {
  owner: {
    eyebrow: "Owner Backend · Campaigns",
    title: "Branded Emails",
    blurb: "Send a JBJ-branded email or launch a campaign to any brokerage, broker or list. AI drafts subject + body, you approve, Test → Live use the exact same locked payload.",
  },
  broker: {
    eyebrow: "Broker Portal · Outreach",
    title: "Branded Emails",
    blurb: "Reach clients and partners with JBJ-branded templates. AI writes the first draft, you edit, and every send is tracked in your history.",
  },
  developer: {
    eyebrow: "Developer Portal · Campaigns",
    title: "Branded Emails",
    blurb: "Send launch announcements, brochures and briefing invites with JBJ's locked identity. AI drafts, you approve, Test → Live are byte-for-byte identical.",
  },
};

export default function BrandedEmailsLauncherCard({ variant = "owner" }: { variant?: Variant }) {
  const [open, setOpen] = useState(false);
  const c = COPY[variant];

  return (
    <>
      <Card className="relative overflow-hidden border border-[#B89555]/35 bg-[linear-gradient(135deg,#FDFBF7_0%,#F7F2EA_55%,#EFE6D6_100%)] shadow-[0_18px_45px_-34px_rgba(26,26,26,0.35)]">
        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
          <span data-surface="emerald" className="allow-white shrink-0 size-12 rounded-2xl jj-emerald-metallic flex items-center justify-center">
            <Mail className="size-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#B89555]">{c.eyebrow}</p>
            <h3 className="text-xl md:text-2xl font-black text-[#1A1A1A] tracking-tight">{c.title}</h3>
            <p className="text-sm text-[#1A1A1A]/75 mt-1 max-w-2xl">{c.blurb}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#1A1A1A]/70">
              <span className="inline-flex items-center gap-1"><Sparkles className="size-3.5 text-[#B89555]" /> AI drafts</span>
              <span className="inline-flex items-center gap-1"><Mail className="size-3.5 text-[#064E3B]" /> From contact@jbj.ae</span>
              <span className="inline-flex items-center gap-1"><Send className="size-3.5 text-[#064E3B]" /> Test → Live locked</span>
            </div>
          </div>
          <Button variant="gold" size="sm" onClick={() => setOpen(true)} className="shrink-0">
            <Mail className="size-4 mr-1" /> Open composer
          </Button>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] overflow-y-auto bg-[#FDFBF7] border border-[#B89555]/40">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">JBJ Branded Email Composer</DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/70">
              Draft, preview, test and send from contact@jbj.ae with your locked JBJ identity.
            </DialogDescription>
          </DialogHeader>
          <BrandedEmailComposer />
        </DialogContent>
      </Dialog>
    </>
  );
}
