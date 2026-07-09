/**
 * Account → Billing & Subscriptions
 * Wired to the JBJ subscriptions table + Stripe billing portal.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Receipt, Gauge, Shield, ExternalLink, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import IconTile from "@/components/ui/icon-tile";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useStripeSubscription } from "@/hooks/useStripeSubscription";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import {
  INVESTOR_TIERS,
  ACADEMY_BUNDLES,
  AGENCY_PACKAGES,
} from "@/content/pricing";
import { toast } from "sonner";

const ALL_TIERS = [...INVESTOR_TIERS, ...ACADEMY_BUNDLES, ...AGENCY_PACKAGES];

function tierLabelFromPriceId(priceId?: string | null): { name: string; interval: string } | null {
  if (!priceId) return null;
  for (const tier of ALL_TIERS) {
    const price = tier.prices.find((p) => p.priceId === priceId);
    if (price) return { name: tier.name, interval: price.label };
  }
  return null;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function AccountBilling() {
  const { user } = useAuth();
  const { subscription, isActive, loading } = useStripeSubscription(user?.id);
  const [openingPortal, setOpeningPortal] = useState(false);

  const tierInfo = useMemo(
    () => tierLabelFromPriceId(subscription?.price_id),
    [subscription?.price_id],
  );

  const openPortal = async () => {
    if (!isPaymentsConfigured()) {
      toast.error("Payments are not yet configured for this environment.");
      return;
    }
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/account/billing`,
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed to open portal");
      window.open(data.url as string, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Failed to open billing portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  const planName = tierInfo?.name ?? (subscription ? "Active subscription" : "Free");
  const statusPill = subscription ? subscription.status : "free";
  const nextRenewal = subscription?.current_period_end;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <SEOHead {...pagesSEO.accountBilling} />
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#1A1A1A]/60">My Account</p>
        <h1 className="text-3xl font-semibold text-[#1A1A1A]">Billing & Subscriptions</h1>
        <p className="text-[15px] text-[#1A1A1A]/70 max-w-2xl">
          Manage your plan, payment method, invoices and usage. All charges run through JBJ GLOBAL REAL ESTATE.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start gap-3">
            <IconTile icon={Shield} tone="gold" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg font-semibold text-[#1A1A1A]">{loading ? "Loading…" : planName}</p>
                <span
                  className={`text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border ${
                    isActive
                      ? "bg-[#064E3B]/10 text-[#064E3B] border-[#064E3B]/30"
                      : "bg-[#1A1A1A]/5 text-[#1A1A1A]/60 border-[#1A1A1A]/15"
                  }`}
                >
                  {statusPill}
                </span>
              </div>
              {tierInfo ? (
                <p className="text-sm text-[#1A1A1A]/70 mt-1">Billed {tierInfo.interval}</p>
              ) : (
                <p className="text-sm text-[#1A1A1A]/70 mt-1">
                  Upgrade to unlock premium tools, reports and broker features.
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild variant="primary">
                  <Link to="/membership">{subscription ? "Change plan" : "Choose a plan"}</Link>
                </Button>
                {subscription ? (
                  <Button variant="secondary" onClick={openPortal} disabled={openingPortal}>
                    {openingPortal ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening…
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" /> Manage billing
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start gap-3">
            <IconTile icon={CreditCard} tone="gold" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Payment Method</p>
              <p className="text-lg font-semibold text-[#1A1A1A] mt-1">
                {subscription ? "Managed via Stripe" : "None on file"}
              </p>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">
                {subscription
                  ? "Update your card, VAT ID or billing address in the secure Stripe portal."
                  : "Add a card at checkout to enable subscriptions and one-off purchases."}
              </p>
              {subscription ? (
                <Button variant="secondary" className="mt-3" onClick={openPortal} disabled={openingPortal}>
                  {openingPortal ? "Opening…" : "Open billing portal"}
                </Button>
              ) : null}
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start gap-3">
            <IconTile icon={Receipt} tone="gold" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Next Renewal</p>
              <p className="text-lg font-semibold text-[#1A1A1A] mt-1">{formatDate(nextRenewal)}</p>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">
                {subscription?.cancel_at_period_end
                  ? "Your subscription is scheduled to end on this date."
                  : subscription
                    ? "Your next invoice will be issued on this date."
                    : "No active subscription."}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start gap-3">
            <IconTile icon={Gauge} tone="gold" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Usage</p>
              <p className="text-lg font-semibold text-[#1A1A1A] mt-1">
                {isActive ? "Premium tier active" : "Within free limits"}
              </p>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">
                AI tool, document and report usage is tracked automatically.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {!subscription && !loading ? (
        <Card className="p-6 bg-white border border-[#B89555]/30">
          <h2 className="font-cormorant text-2xl text-[#1A1A1A] mb-2">Explore JBJ plans</h2>
          <p className="text-sm text-[#1A1A1A]/70 mb-4">
            Investor Memberships, Broker Academy bundles, or Agency Packages — find the plan that fits.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="primary">
              <Link to="/membership">Investor Memberships</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/academy">Broker Academy</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/agencies">Agency Packages</Link>
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
