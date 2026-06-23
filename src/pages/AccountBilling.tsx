/**
 * Account → Billing & Subscriptions
 * Stub page wired to the sidebar entry. Real plan/payment data lands later;
 * for now this is a branded landing that explains current state and lists
 * placeholder cards (Current Plan, Payment Method, Invoices, Usage) so the
 * sidebar destination always resolves.
 */
import { CreditCard, Receipt, Gauge, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import IconTile from "@/components/ui/icon-tile";
import { SEOHead, pagesSEO } from "@/components/SEOHead";

export default function AccountBilling() {
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
            <IconTile icon={Shield} tone="emerald" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Current Plan</p>
              <p className="text-lg font-semibold text-[#1A1A1A] mt-1">Free</p>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">Upgrade to unlock premium tools, reports and broker features.</p>
              <Button className="mt-3 jj-cta-dark" data-cta="dark">Upgrade plan</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start gap-3">
            <IconTile icon={CreditCard} tone="emerald" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Payment Method</p>
              <p className="text-lg font-semibold text-[#1A1A1A] mt-1">None on file</p>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">Add a card or bank to enable subscriptions and one-off purchases.</p>
              <Button className="mt-3 jj-cta-emerald" data-cta="primary" data-surface="emerald">Add payment method</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start gap-3">
            <IconTile icon={Receipt} tone="emerald" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Invoices</p>
              <p className="text-lg font-semibold text-[#1A1A1A] mt-1">No invoices yet</p>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">Past invoices and receipts will appear here once you make a purchase.</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
          <div className="flex items-start gap-3">
            <IconTile icon={Gauge} tone="emerald" />
            <div className="flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60">Usage</p>
              <p className="text-lg font-semibold text-[#1A1A1A] mt-1">Within free limits</p>
              <p className="text-sm text-[#1A1A1A]/70 mt-1">AI tool, document and report usage will be tracked here.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
