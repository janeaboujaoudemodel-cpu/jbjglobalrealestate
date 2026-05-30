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
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";
import { ListingModeCards } from "@/components/broker-portal/ListingModeCards";

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

      <ListingModeCards />
    </div>
  );
}
