/**
 * /broker/listings/new — In-portal "Submit a New Listing" picker.
 *
 * Two-card chooser (Manual / AI). Both cards route to wizards mounted INSIDE
 * the broker portal shell so the broker never leaves the back-end:
 *   - /broker/listings/new/manual → SellerListing wizard
 *   - /broker/listings/new/ai     → ListingPortalSubmit (AI wizard)
 *
 * No redirect to public /list-property or /listing-portal/submit.
 */
import { Link } from "react-router-dom";
import { ClipboardCheck, Wand2, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";

const GOLD = "#B89555";
const INK = "#1A1A1A";

export default function BrokerListingNew() {
  return (
    <div className="space-y-8">
      <SEOHead title="Submit a New Listing | Broker Portal | JBJ" noIndex />

      <header className="space-y-2">
        <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
          <ShieldCheck className="w-3 h-3 mr-1" /> Broker Portal
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight">
          Submit a New Listing
        </h1>
        <p className="text-[#1A1A1A]/70 max-w-2xl">
          Choose how you want to add this property to JBJ. Both options stay
          inside your broker workspace — your draft is auto-saved and you can
          come back to it at any time.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <ListingModeCard
          to="/broker/listings/new/manual"
          icon={<ClipboardCheck className="w-6 h-6" style={{ color: INK }} />}
          eyebrow="Full Control"
          title="List Manually"
          description="Fill in every field yourself — price, location, photos, amenities and contact preferences. Best when you already have the full property details ready."
          tag="≈ 4–6 minutes"
        />
        <ListingModeCard
          to="/broker/listings/new/ai"
          icon={<Wand2 className="w-6 h-6" style={{ color: GOLD }} />}
          eyebrow="AI-Assisted"
          title="List with AI"
          description="Paste any portal link, brochure or short description. Our AI auto-fills the listing in seconds — you only review and confirm before submitting."
          tag="≈ 60 seconds"
          accent
        />
      </div>
    </div>
  );
}

function ListingModeCard({
  to,
  icon,
  eyebrow,
  title,
  description,
  tag,
  accent,
}: {
  to: string;
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  tag: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col rounded-2xl bg-gradient-to-br from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] border border-[#B89555]/55 hover:border-[#B89555] p-6 md:p-7 transition-all hover:shadow-[0_14px_30px_rgba(184,149,85,0.22)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#FDFBF7] border border-[#B89555]/60 grid place-items-center shadow-[0_4px_10px_rgba(184,149,85,0.18)]">
          {icon}
        </div>
        {accent && (
          <span
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] font-bold px-2 py-0.5 rounded-full bg-[#FDFBF7] border"
            style={{ color: GOLD, borderColor: GOLD }}
          >
            <Sparkles className="w-3 h-3" /> Recommended
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="text-[10px] uppercase tracking-[0.22em] font-semibold text-[#1A1A1A]/55">
          {eyebrow}
        </div>
        <h2 className="mt-1 text-xl md:text-2xl font-bold text-[#1A1A1A] leading-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[#1A1A1A]/75 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#1A1A1A]/65 bg-[#FDFBF7] border border-[#B89555]/40 rounded-md px-2 py-1">
          {tag}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A1A1A] group-hover:gap-2 transition-all"
          data-no-contrast-guard
        >
          Start
          <ArrowRight className="w-4 h-4" style={{ color: INK }} />
        </span>
      </div>
    </Link>
  );
}
