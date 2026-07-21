/**
 * BrandedEmailsLauncherCard
 *
 * Hub-branded (emerald/white) card that opens the Branded Emails panel
 * IN PLACE — no redirect to the Relationships Hub. All template + audience
 * curation happens inside the current portal (Broker / Developer / Owner).
 */
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Mail } from "lucide-react";
import BrandedEmailsPanel, { preloadBrandedEmailsData, type BrandedAudienceKind } from "./branded-emails/BrandedEmailsPanel";

type Variant = "owner" | "broker" | "developer";

const COPY: Record<Variant, {
  eyebrow: string;
  title: string;
  blurb: string;
  kind: BrandedAudienceKind;
}> = {
  owner: {
    eyebrow: "Owner Backend · Campaigns",
    title: "Branded Emails",
    blurb: "Compose, curate audience and send JBJ-branded campaigns to developers or brokerages — in place.",
    kind: "developers",
  },
  broker: {
    eyebrow: "Broker Portal · Outreach",
    title: "Branded Emails",
    blurb: "Reach brokerages with JBJ-branded templates. Preview, test, then live — no redirects.",
    kind: "brokerages",
  },
  developer: {
    eyebrow: "Developer Portal · Campaigns",
    title: "Branded Emails",
    blurb: "Reach developers with registration and follow-up templates. Preview, test, then live — no redirects.",
    kind: "developers",
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

  const warm = (k: BrandedAudienceKind) => preloadBrandedEmailsData(k);

  useEffect(() => {
    warm(c.kind);
    if (variant === "owner") warm("brokerages");
  }, [c.kind, variant]);

  return (
    <>
      <Card
        data-surface="hub"
        data-branded-email-launcher-card="true"
        className="relative overflow-hidden border bg-white shadow-[0_18px_45px_-34px_rgba(6,78,59,0.35)] hover:bg-white"
        style={{ borderColor: "rgba(184,149,85,0.45)", backgroundColor: "#FFFFFF" }}
      >
        {[
          "left-2 top-2 border-l border-t",
          "right-2 top-2 border-r border-t",
          "bottom-2 left-2 border-b border-l",
          "bottom-2 right-2 border-b border-r",
        ].map((position) => (
          <span
            key={position}
            aria-hidden="true"
            className={`pointer-events-none absolute h-8 w-8 ${position}`}
            style={{ borderColor: "#B89555" }}
          />
        ))}
        {[
          "left-4 top-4 border-l border-t",
          "right-4 top-4 border-r border-t",
          "bottom-4 left-4 border-b border-l",
          "bottom-4 right-4 border-b border-r",
        ].map((position) => (
          <span
            key={position}
            aria-hidden="true"
            className={`pointer-events-none absolute h-5 w-5 ${position}`}
            style={{ borderColor: "rgba(184,149,85,0.62)" }}
          />
        ))}
        <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
          <span className="shrink-0 size-12 rounded-xl bg-[#064E3B] flex items-center justify-center">
            <Mail className="size-5 !text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[#064E3B]">{c.eyebrow}</p>
            <h3 className="text-xl md:text-2xl font-black text-[#0F1A16] tracking-tight">{c.title}</h3>
            <p className="text-sm text-[#4B5D55] mt-1 max-w-2xl">{c.blurb}</p>
          </div>
          <div data-branded-launcher-actions="true" className="flex flex-col sm:flex-row gap-2 shrink-0">
            {variant === "owner" && (
              <button
                type="button"
                data-branded-email-secondary-action="true"
                onPointerEnter={() => warm("brokerages")}
                onFocus={() => warm("brokerages")}
                onClick={() => openWith("brokerages")}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700,
                  background: "#FFFFFF", color: "#0F1A16",
                  border: "1px solid rgba(6,78,59,0.4)",
                  transform: "none", transition: "background-color 120ms ease",
                  cursor: "pointer", whiteSpace: "nowrap",
                }}
              >
                Brokerages
              </button>
            )}
            <button
              type="button"
              data-branded-email-launch-action="true"
              className="jbj-force-white-button"
              onPointerEnter={() => warm(c.kind)}
              onFocus={() => warm(c.kind)}
              onClick={() => openWith(c.kind)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
                padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700,
                background: "#064E3B", color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                border: "1px solid #064E3B",
                transform: "none", transition: "background-color 120ms ease",
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              <Mail className="size-4" style={{ color: "#FFFFFF" }} /> Send email
            </button>
          </div>
        </div>
      </Card>
      <BrandedEmailsPanel open={open} onOpenChange={setOpen} kind={kind} />
    </>
  );
}
