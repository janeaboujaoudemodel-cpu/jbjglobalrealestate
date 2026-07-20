/**
 * BrandedEmailsLauncherCard
 *
 * Wires the existing Relationships Hub branded-email infrastructure
 * (templates, campaigns, "registered / not registered" flows for brokerages
 * and developers) into any portal — Brokerage, Broker or Developer.
 *
 * Instead of duplicating the composer inside a dialog (which was rendering
 * the double "Founder & CEO" signature and broken layout), this card
 * navigates directly to /crm/relationship-hub with the correct tab focused,
 * so the user reuses the exact template + campaign UX we already built.
 */
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles, Send, ArrowRight, FileEdit } from "lucide-react";
import { Link } from "react-router-dom";

type Variant = "owner" | "broker" | "developer";

const COPY: Record<Variant, {
  eyebrow: string;
  title: string;
  blurb: string;
  hubTab: "brokerages" | "developers";
  primaryLabel: string;
}> = {
  owner: {
    eyebrow: "Owner Backend · Campaigns",
    title: "Branded Emails",
    blurb: "Open the Relationships Hub to send JBJ-branded emails and campaigns to brokerages, developers, or lists — using the exact template flow (Registered / Not registered, briefings, launches) already wired to contact@jbj.ae.",
    hubTab: "brokerages",
    primaryLabel: "Open Relationships Hub",
  },
  broker: {
    eyebrow: "Broker Portal · Outreach",
    title: "Branded Emails",
    blurb: "Send JBJ-branded emails to brokerages using the templates from the Relationships Hub — Registered / Not Registered follow-ups, brochure drops, and briefing invites.",
    hubTab: "brokerages",
    primaryLabel: "Open in Relationships Hub",
  },
  developer: {
    eyebrow: "Developer Portal · Campaigns",
    title: "Branded Emails",
    blurb: "Send launch announcements, briefing invites and status follow-ups to developers using the existing Relationships Hub templates and campaign workflow.",
    hubTab: "developers",
    primaryLabel: "Open in Relationships Hub",
  },
};

export default function BrandedEmailsLauncherCard({ variant = "owner" }: { variant?: Variant }) {
  const c = COPY[variant];
  // The real Relationships Hub route lives under /owner/crm/relationship-hub
  // (OwnerRoutes.tsx). The old /crm/... path falls through the CRM shell and
  // dumped users on the JBJ CRM home, which is why "Edit templates" was
  // redirecting to CRM.
  const hubHref = `/owner/crm/relationship-hub?tab=${c.hubTab}`;
  const templatesHref = `/owner/crm/relationship-hub?tab=${c.hubTab}&panel=templates`;


  return (
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
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]/70">
            <Link to={templatesHref}>
              <FileEdit className="size-4 mr-1" /> Edit templates
            </Link>
          </Button>
          <Button asChild variant="gold" size="sm">
            <Link to={hubHref}>
              <Mail className="size-4 mr-1" /> {c.primaryLabel} <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
