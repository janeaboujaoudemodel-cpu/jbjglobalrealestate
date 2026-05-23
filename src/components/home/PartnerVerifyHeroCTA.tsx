import { Link } from "react-router-dom";
import { Handshake, ArrowRight, BadgeCheck } from "lucide-react";
import { usePartnerRegistration } from "@/hooks/usePartnerRegistration";

/**
 * Slim hero-adjacent CTA shown ONLY to users who have already registered
 * as a partner (mortgage / legal / company-setup / visa / referral).
 * Invites them to complete verification and access the Partner Portal.
 * Renders nothing for the general public.
 */
export default function PartnerVerifyHeroCTA() {
  const { data, isLoading } = usePartnerRegistration();
  if (isLoading || !data?.registered) return null;

  const verified = data.verified;
  const label = verified
    ? "Open your Partner Portal"
    : "Get verified — complete your Partner Portal setup";
  const sub = verified
    ? "Your application is approved. Access your Partner Portal."
    : "Your partner application is pending. Finish verification to unlock the portal.";

  return (
    <section
      aria-label="Partner verification call to action"
      className="relative z-10 mx-auto max-w-6xl px-4 -mt-6 mb-8"
    >
      <div
        className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl px-5 py-4 sm:py-3 bg-[#F7F2EA] border border-[#B89555]/40"
        data-gold-hairline
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center shrink-0">
            {verified ? (
              <BadgeCheck className="w-5 h-5 text-[#1A1A1A]" />
            ) : (
              <Handshake className="w-5 h-5 text-[#1A1A1A]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[#1A1A1A] font-semibold text-sm sm:text-base truncate">
              {label}
            </p>
            <p className="text-[#1A1A1A]/70 text-xs sm:text-sm truncate">{sub}</p>
          </div>
        </div>
        <Link
          to="/partners"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EFE6D6] text-[#1A1A1A] text-sm font-semibold border border-[#B89555]/50 hover:bg-[#E5D8BD] transition-colors shrink-0"
        >
          {verified ? "Open Portal" : "Get Verified"}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
