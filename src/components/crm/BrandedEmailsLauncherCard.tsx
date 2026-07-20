/**
 * BrandedEmailsLauncherCard
 *
 * Hub-branded (emerald/white) card that opens the Branded Emails panel
 * IN PLACE — no redirect to the Relationships Hub. All template + audience
 * curation happens inside the current portal (Broker / Developer / Owner).
 */
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Send, Users } from "lucide-react";
import BrandedEmailsPanel, { type BrandedAudienceKind } from "./branded-emails/BrandedEmailsPanel";

type Variant = "owner" | "broker" | "developer";

const COPY: Record<Variant, {
  eyebrow: string;
  title: string;
  blurb: string;
  kind: BrandedAudienceKind;
  primaryLabel: string;
}> = {
  owner: {
    eyebrow: "Owner Backend · Campaigns",
    title: "Branded Emails",
    blurb: "Compose, curate audience and send JBJ-branded campaigns to developers or brokerages — templates, select-all with search-based include / exclude, live preview and test send, all in place.",
    kind: "developers",
    primaryLabel: "Open campaigns",
  },
  broker: {
    eyebrow: "Broker Portal · Outreach",
    title: "Branded Emails",
    blurb: "Reach brokerages with JBJ-branded templates. Select all, search to include or exclude, preview, and send a test — no redirects.",
    kind: "brokerages",
    primaryLabel: "Open campaigns",
  },
  developer: {
    eyebrow: "Developer Portal · Campaigns",
    title: "Branded Emails",
    blurb: "Reach developers with launch, briefing, and follow-up templates. Select all, search to include or exclude, preview, test then live — no redirects.",
    kind: "developers",
    primaryLabel: "Open campaigns",
  },
};

export default function BrandedEmailsLauncherCard({ variant = "owner" }: { variant?: Variant }) {
  const c = COPY[variant];
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<BrandedAudienceKind>(c.kind);

  const openWith = (k: BrandedAudienceKind) => {
    setKind(k);
    setOpen(true);
  };

  return (
    <>
      <Card
        data-surface="hub"
        className="relative overflow-hidden border border-emerald-900/15 bg-white shadow-[0_18px_45px_-34px_rgba(6,78,59,0.35)]"
      >
        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
          <span className="shrink-0 size-12 rounded-xl bg-[#064E3B] flex items-center justify-center">
            <Mail className="size-5 !text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#064E3B]">{c.eyebrow}</p>
            <h3 className="text-xl md:text-2xl font-black text-[#0F1A16] tracking-tight">{c.title}</h3>
            <p className="text-sm text-[#4B5D55] mt-1 max-w-2xl">{c.blurb}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#4B5D55]">
              <span className="inline-flex items-center gap-1"><Sparkles className="size-3.5 text-[#064E3B]" /> AI drafts</span>
              <span className="inline-flex items-center gap-1"><Mail className="size-3.5 text-[#064E3B]" /> From contact@jbj.ae</span>
              <span className="inline-flex items-center gap-1"><Send className="size-3.5 text-[#064E3B]" /> Test → Live locked</span>
              <span className="inline-flex items-center gap-1"><Users className="size-3.5 text-[#064E3B]" /> Select all · include · exclude</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {variant === "owner" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="border-[#064E3B]/40 text-[#064E3B] hover:bg-[#064E3B]/10"
                onClick={() => openWith("brokerages")}
              >
                Brokerages
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="bg-[#064E3B] hover:bg-[#053528] !text-white"
              onClick={() => openWith(c.kind)}
            >
              <Mail className="size-4 mr-1 !text-white" /> {c.primaryLabel}
            </Button>
          </div>
        </div>
      </Card>
      <BrandedEmailsPanel open={open} onOpenChange={setOpen} kind={kind} />
    </>
  );
}
