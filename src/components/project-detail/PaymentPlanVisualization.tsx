import { useState } from "react";
import { CreditCard, Calendar, CheckCircle, Home, Percent, Clock, Wallet, List, ShieldCheck } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PearlButton } from "@/components/ui/pearl-button";
import { formatPaymentPlanForDisplay } from "@/utils/paymentPlanPresentation";
import { formatDisplayDate } from "@/utils/formatDate";

interface PaymentMilestone {
  milestone: string;
  percentage: number;
  timing?: string;
  amount?: number | null;
  stage_type?: string;
}

interface PaymentBreakdownLegacy {
  down_payment?: string;
  during_construction?: string;
  on_completion?: string;
}

type PaymentBreakdownData = PaymentMilestone[] | PaymentBreakdownLegacy | null;

interface PaymentPlanVisualizationProps {
  paymentPlan?: string | null;
  paymentBreakdown?: PaymentBreakdownData;
  handoverDate?: string | null;
  downPaymentPercent?: number | null;
  projectName: string;
  postHandoverYears?: number | null;
  onRegisterInterest?: () => void;
  paymentPlanVerified?: boolean | null;
  paymentPlanVerifiedAt?: string | null;
}

export default function PaymentPlanVisualization({
  paymentPlan,
  paymentBreakdown,
  handoverDate,
  downPaymentPercent,
  projectName,
  postHandoverYears,
  onRegisterInterest,
  paymentPlanVerified,
  paymentPlanVerifiedAt,
}: PaymentPlanVisualizationProps) {

  // SAFETY: we no longer parse `payment_plan` text into booking/construction/handover
  // percentages. Strings like "10/90" or "90/10" are ambiguous and guessing
  // misrepresents the developer's official plan (legal risk). We only render
  // structured percentages from the authoritative `payment_breakdown` array
  // or legacy object. The raw `payment_plan` text is still shown verbatim.

  const isDetailedBreakdown = Array.isArray(paymentBreakdown);
  const detailedMilestones: PaymentMilestone[] = isDetailedBreakdown ? (paymentBreakdown as PaymentMilestone[]) : [];
  const legacyBreakdown = !isDetailedBreakdown ? (paymentBreakdown as PaymentBreakdownLegacy | null) : null;
  const premiumPlan = formatPaymentPlanForDisplay(paymentPlan, handoverDate);
  const cashPlan = {
    label: "100% on booking",
    note: "Cash discount applicable on full payment.",
  };

  const milestones = [];

  if (legacyBreakdown?.down_payment) {
    milestones.push({
      label: "On Booking",
      value: legacyBreakdown.down_payment,
      icon: CheckCircle,
      color: "text-[color:var(--emerald-1)]",
      bgColor: "jj-surface-emerald",
      lightBg: "jj-emerald-soft",
      ringColor: "ring-emerald-200",
    });
  } else if (isDetailedBreakdown && detailedMilestones.length > 0) {
    const first = detailedMilestones[0];
    milestones.push({
      label: first.milestone || "On Booking",
      value: `${first.percentage}%`,
      icon: CheckCircle,
      color: "text-[color:var(--emerald-1)]",
      bgColor: "jj-surface-emerald",
      lightBg: "jj-emerald-soft",
      ringColor: "ring-emerald-200",
    });
  }

  
  if (legacyBreakdown?.during_construction) {
    milestones.push({
      label: "During Construction",
      value: legacyBreakdown.during_construction,
      icon: Calendar,
      color: "text-amber-600",
      bgColor: "bg-amber-500",
      lightBg: "bg-amber-50",
      ringColor: "ring-amber-200",
    });
  } else if (isDetailedBreakdown && detailedMilestones.length > 2) {

    const middle = detailedMilestones.slice(1, -1);
    const constructionPct = middle.reduce((s, m) => s + m.percentage, 0);
    milestones.push({
      label: "During Construction",
      value: `${constructionPct}%`,
      icon: Calendar,
      color: "text-amber-600",
      bgColor: "bg-amber-500",
      lightBg: "bg-amber-50",
      ringColor: "ring-amber-200",
    });
  }
  
  const derivedPostHandoverMonths = (() => {
    if (postHandoverYears && postHandoverYears > 0) return postHandoverYears * 12;
    const raw = `${paymentPlan || ""} ${JSON.stringify(paymentBreakdown || "")}`;
    if (!/post[-\s]?handover|after\s+handover/i.test(raw)) return null;
    const monthMatch = raw.match(/(\d{1,3})\s*months?\s*post[-\s]?handover|post[-\s]?handover[^\d]{0,24}(\d{1,3})\s*months?/i);
    if (monthMatch) return Number(monthMatch[1] || monthMatch[2]);
    const yearMatch = raw.match(/(\d{1,2})\s*years?\s*post[-\s]?handover|post[-\s]?handover[^\d]{0,24}(\d{1,2})\s*years?/i);
    if (yearMatch) return Number(yearMatch[1] || yearMatch[2]) * 12;
    return null;
  })();
  const isPostHandover = !!(derivedPostHandoverMonths && derivedPostHandoverMonths > 0);
  const postHandoverYearLabel = derivedPostHandoverMonths ? derivedPostHandoverMonths / 12 : null;
  const handoverLabel = isPostHandover
    ? `Post-Handover${derivedPostHandoverMonths ? ` (${derivedPostHandoverMonths} months)` : ""}`
    : "On Handover";

  // For post-handover balances, the final installment is NOT due at handover —
  // it's due when the post-handover plan ends. Compute that end date so the
  // timeline reads "Due by <handover + N years>" instead of the handover date.
  const postHandoverEndDate: string | null = (() => {
    if (!isPostHandover || !handoverDate) return null;
    const d = new Date(handoverDate);
    if (Number.isNaN(d.getTime())) return null;
    d.setMonth(d.getMonth() + (derivedPostHandoverMonths || 0));
    return d.toISOString().slice(0, 10);
  })();
  const formattedHandoverDate = formatDisplayDate(handoverDate || "");
  const formattedPostHandoverEndDate = formatDisplayDate(postHandoverEndDate || "");

  if (legacyBreakdown?.on_completion) {
    milestones.push({
      label: handoverLabel,
      value: legacyBreakdown.on_completion,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      lightBg: "bg-blue-50",
      ringColor: "ring-blue-200",
    });
  } else if (isDetailedBreakdown && detailedMilestones.length > 1) {

    const last = detailedMilestones[detailedMilestones.length - 1];
    const rawLabel = last.milestone || handoverLabel;
    // Normalize any lingering "on handover" wording when we know it's actually post-handover
    const finalLabel = isPostHandover && /on\s*handover/i.test(rawLabel) ? handoverLabel : rawLabel;
    milestones.push({
      label: finalLabel,
      value: `${last.percentage}%`,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      lightBg: "bg-blue-50",
      ringColor: "ring-blue-200",
    });
  }

  const getPercentageValue = (str?: string): number => {
    if (!str) return 0;
    const match = str.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const bookingPct = getPercentageValue(milestones[0]?.value);
  const constructionPct = getPercentageValue(milestones[1]?.value);
  const handoverPct = getPercentageValue(milestones[2]?.value);
  const total = bookingPct + constructionPct + handoverPct;

  return (
    <div className="rounded-2xl bg-[#FDFBF7] border border-[#B89555]/30 shadow-sm overflow-hidden">
      {/* Emerald header band — approved palette, pure white title + icon */}
      <div
        data-surface="emerald"
        data-emerald="true"
        data-no-contrast-guard
        className="jj-cta-emerald flex flex-wrap items-center justify-between gap-3 px-6 md:px-8 py-4"
        style={{ backgroundImage: 'var(--jj-emerald-ombre)', color: '#FFFFFF' }}
      >
        <h3
          className="text-lg md:text-xl font-semibold flex items-center gap-2"
          style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
        >
          <CreditCard className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          Payment Plan
        </h3>
        {paymentPlanVerified && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 border border-white/40"
            style={{ color: '#FFFFFF' }}
            title={paymentPlanVerifiedAt ? `Verified ${new Date(paymentPlanVerifiedAt).toLocaleDateString()}` : "Verified by JBJ"}
          >
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            Verified by JBJ
          </span>
        )}
      </div>
      <div className="p-6 md:p-8">


      <Tabs defaultValue="installment" className="w-full">
          <TabsList data-project-payment-tabs className="w-full mb-6 bg-[#F7F2EA] border border-[#B89555]/30 p-1 rounded-xl gap-1">
          <TabsTrigger value="installment" data-emerald-active className="flex-1 h-12 rounded-lg text-[#1A1A1A]/70 data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=active]:[&_svg]:!text-white">
            <CreditCard className="w-4 h-4 mr-2" style={{ color: "currentColor", stroke: "currentColor" }} />
            Payment Plan {premiumPlan && `(${premiumPlan.badge})`}
          </TabsTrigger>
          <TabsTrigger value="full" data-emerald-active className="flex-1 h-12 rounded-lg text-[#1A1A1A]/70 data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=active]:[&_svg]:!text-white">
            <Wallet className="w-4 h-4 mr-2" style={{ color: "currentColor", stroke: "currentColor" }} />
            100% Payment
          </TabsTrigger>
        </TabsList>


        {/* Full Payment Tab */}
        <TabsContent value="full">
            <div className="p-6 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] text-center">
            <div data-emerald="true" data-icon-circle="true" className="jj-surface-emerald w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-[#064E3B]/10" style={{ backgroundImage: 'var(--jj-emerald-ombre)' }}>
              <Wallet className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A] mb-2">{cashPlan.label}</p>
            <p className="text-sm text-[#1A1A1A]/70">Pay the full amount upfront</p>
            <p className="text-xs text-[#1A1A1A]/70 mt-2">{cashPlan.note}</p>
          </div>
        </TabsContent>

        {/* Installment Tab */}
        <TabsContent value="installment">
          {premiumPlan && (
            <div className="mb-6 p-5 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div data-emerald="true" data-icon-circle="true" className="jj-surface-emerald w-14 h-14 rounded-full flex items-center justify-center ring-4 ring-[#064E3B]/10" style={{ backgroundImage: 'var(--jj-emerald-ombre)', ['--jj-icon-lock-size' as any]: '3.5rem' }}>
                  <Percent className="w-6 h-6" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{premiumPlan.headline}</p>
                  <p className="text-sm text-[#1A1A1A]/70">
                    {isPostHandover && handoverDate
                      ? `Handover: ${formattedHandoverDate || handoverDate} · Post-handover balance paid over ${derivedPostHandoverMonths} months`
                      : premiumPlan.summary}
                  </p>
                </div>
                </div>
                <div className="w-fit max-w-full rounded-full border border-[#064E3B]/30 bg-[#FDFBF7] px-4 py-2 text-sm font-bold text-[#064E3B] whitespace-nowrap shrink-0">
                  {premiumPlan.badge}
                </div>

              </div>
              {premiumPlan.stages.length > 0 && (
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {premiumPlan.stages.map((stage) => (
                    <div key={`${stage.label}-${stage.value}`} className="rounded-lg border border-[#B89555]/25 bg-[#FDFBF7] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-[#1A1A1A]/60 font-bold">{stage.label}</p>
                      <p className="mt-1 text-2xl font-bold text-[#064E3B]">{stage.value}</p>
                      {stage.detail && <p className="mt-1 text-xs text-[#1A1A1A]/70">{stage.detail}</p>}
                    </div>
                  ))}
                </div>
              )}
              
              {isPostHandover && (
                <div
                  data-emerald="true"
                  data-no-contrast-guard
                  data-on-dark
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg allow-white"
                  style={{
                    backgroundImage: 'var(--jj-emerald-ombre)',
                    backgroundColor: '#064E3B',
                    color: '#FFFFFF',
                    WebkitTextFillColor: '#FFFFFF',
                    boxShadow: '0 8px 20px -8px rgba(4,44,28,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',
                  }}
                >
                  <Clock className="w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                  <span
                    className="text-sm font-semibold allow-white"
                    style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                  >
                    Handover: {formattedHandoverDate || handoverDate}
                  </span>
                </div>
              )}


              {!isDetailedBreakdown && (!legacyBreakdown || (!legacyBreakdown.down_payment && !legacyBreakdown.during_construction && !legacyBreakdown.on_completion)) && (
                <p className="mt-4 text-xs text-[#1A1A1A]/70 italic">
                  {premiumPlan.note}
                </p>
              )}
            </div>
          )}



          {/* Visual Timeline with Progress Bar */}
          {total > 0 && (
            <div className="mb-8">
              <div data-payment-progress-bar className="h-6 rounded-full bg-[#F7F2EA] overflow-hidden flex shadow-inner relative">
                {bookingPct > 0 && (
                  <div
                    data-emerald="true" data-no-contrast-guard className="h-full transition-all flex items-center justify-center"
                    style={{ width: `${(bookingPct / total) * 100}%`, backgroundImage: 'var(--jj-emerald-ombre)', backgroundColor: '#064E3B' }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{bookingPct}%</span>
                  </div>
                )}
                {constructionPct > 0 && (
                  <div
                    data-emerald="true" data-no-contrast-guard className="h-full transition-all flex items-center justify-center"
                    style={{ width: `${(constructionPct / total) * 100}%`, backgroundImage: 'linear-gradient(135deg,#0B6E4F 0%,#0A5A3F 100%)' }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{constructionPct}%</span>
                  </div>
                )}
                {handoverPct > 0 && (
                  <div
                    data-emerald="true" data-no-contrast-guard className="h-full transition-all flex items-center justify-center"
                    style={{ width: `${(handoverPct / total) * 100}%`, backgroundImage: 'linear-gradient(135deg,#0E8A63 0%,#0A6647 100%)' }}
                  >
                    <span className="text-[10px] font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{handoverPct}%</span>
                  </div>
                )}
              </div>
              
              {/* Timeline Dots — anchored to the END of each stage bar so the circles
                  visually match the width of the corresponding segment (e.g. the "During
                  Construction" dot aligns with the end of its 60% bar, not the midpoint). */}
              <div className="relative mt-4 h-32 sm:h-24">
                <div className="absolute top-3 left-0 right-0 h-0.5" style={{ backgroundImage: 'linear-gradient(90deg,#064E3B 0%,#0B6E4F 50%,#0E8A63 100%)' }} />
                {(() => {
                  // Anchor each label to the MIDPOINT of its segment so it visually
                  // aligns under the correct bar (e.g. "During Construction" sits under 60%).
                  const bookingMid = total > 0 ? (bookingPct / 2 / total) * 100 : 0;
                  const constructionMid = total > 0 ? ((bookingPct + constructionPct / 2) / total) * 100 : 0;
                  const preHandoverEnd = total > 0 ? ((bookingPct + constructionPct) / total) * 100 : 70;
                  const postHandoverEnd = 98;
                  const dot = (leftPct: number, gradient: string, label: React.ReactNode, compact = false) => (
                    <div
                      className="absolute flex flex-col items-center"
                      style={{
                        left: `${leftPct}%`,
                        transform: "translateX(-50%)",
                      }}
                    >
                      <div data-emerald="true" data-no-contrast-guard className="w-6 h-6 rounded-full border-4 border-white shadow-lg z-10" style={{ backgroundImage: gradient, backgroundColor: '#064E3B' }} />
                      <span className={`mt-2 text-[11px] sm:text-xs text-[#1A1A1A]/70 text-center ${compact ? "whitespace-normal max-w-[118px] sm:max-w-[150px]" : "whitespace-normal max-w-[92px] sm:whitespace-nowrap sm:max-w-[180px]"}`}>
                        {label}
                      </span>
                    </div>
                  );
                  return (
                    <>
                      {bookingPct > 0 && dot(bookingMid, 'var(--jj-emerald-ombre)', <>On Booking</>)}
                      {constructionPct > 0 && dot(constructionMid, 'linear-gradient(135deg,#0B6E4F 0%,#0A5A3F 100%)', <>During Construction</>)}
                      {isPostHandover && handoverDate && dot(preHandoverEnd, 'linear-gradient(135deg,#0E8A63 0%,#0A6647 100%)', <>Handover<br /><span className="text-[#1A1A1A] font-medium">{formattedHandoverDate || handoverDate}</span></>, true)}
                      {handoverPct > 0 && isPostHandover && dot(postHandoverEnd, 'linear-gradient(135deg,#064E3B 0%,#000 100%)', <>Post-Handover ({derivedPostHandoverMonths} months)<br /><span className="text-[#1A1A1A] font-medium">Due by {formattedPostHandoverEndDate || postHandoverEndDate}</span></>, true)}
                      {handoverPct > 0 && !isPostHandover && dot(preHandoverEnd, 'linear-gradient(135deg,#0E8A63 0%,#0A6647 100%)', <>{handoverLabel}{handoverDate && <><br /><span className="text-[#1A1A1A] font-medium">{formattedHandoverDate || handoverDate}</span></>}</>, true)}
                    </>
                  );
                })()}

              </div>
            </div>
          )}

          {/* Milestone summary cards (Booking / During Construction / On Handover) */}
          {milestones.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {milestones.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div
                    key={`${m.label}-${idx}`}
                    className={cn(
                      "rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-5 text-center shadow-sm",
                    )}
                  >
                    <div
                      data-emerald="true"
                      data-icon-circle="true"
                      className="jj-surface-emerald w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-[#064E3B]/10"
                      style={{ backgroundImage: 'var(--jj-emerald-ombre)' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                    </div>
                    <p className="text-xs uppercase tracking-wider text-[#1A1A1A]/70 mb-1">{m.label}</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">{m.value}</p>
                  </div>
                );
              })}
            </div>
          )}



          {/* Detailed Payment Structure Card — only show if we actually have a granular
              monthly/multi-installment schedule (more than the standard booking/construction/handover trio),
              or any installment carries explicit timing info. Otherwise it just duplicates the timeline + cards above. */}
          {isDetailedBreakdown && (detailedMilestones.length > 3 || detailedMilestones.some(m => !!m.timing)) && (
            <details className="mt-6 rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] group">
              <summary className="cursor-pointer list-none p-5 flex items-center justify-between gap-2 select-none">
                <span className="flex items-center gap-2">
                  <List className="w-5 h-5 text-[#1A1A1A]" />
                  <h4 className="font-semibold text-[#1A1A1A]">Detailed Payment Structure</h4>
                </span>
                <span className="text-xs font-semibold text-[#064E3B] group-open:hidden">Show</span>
                <span className="text-xs font-semibold text-[#064E3B] hidden group-open:inline">Hide</span>
              </summary>
              <div className="px-5 pb-5">
                <div className="space-y-0">
                  {detailedMilestones.map((step, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === detailedMilestones.length - 1;
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-4 py-3 border-b border-[#B89555]/30 last:border-b-0"
                      >
                        <div
                          data-emerald="true"
                          data-icon-circle="true"
                          data-no-contrast-guard
                          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                          style={{ backgroundImage: 'var(--jj-emerald-ombre)', backgroundColor: '#064E3B', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{step.milestone}</p>
                          {step.timing && (
                            <p className="text-xs text-[#1A1A1A]/70">{step.timing}</p>
                          )}
                        </div>
                        <div className={cn(
                          "text-sm font-bold flex-shrink-0",
                          isFirst ? "text-[color:var(--emerald-1)]" :
                          isLast ? "text-[color:var(--emerald-1)]" :
                          "text-[#1A1A1A]"
                        )}>
                          {step.percentage}%
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-[#B89555]/30 flex items-center justify-between px-4">
                  <span className="text-sm font-semibold text-[#1A1A1A]">Total</span>
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {detailedMilestones.reduce((s, m) => s + m.percentage, 0)}%
                  </span>
                </div>
              </div>
            </details>
          )}

          {milestones.length === 0 && !paymentPlan && (
            <div className="p-8 rounded-xl border-2 border-dashed border-[#B89555]/30 bg-[#F7F2EA] text-center">
              <div className="w-20 h-20 rounded-full bg-[#F7F2EA] flex items-center justify-center mx-auto mb-5 ring-4 ring-[#B89555]/30">
                <CreditCard className="w-10 h-10 text-[#1A1A1A]" />
              </div>
              <p className="text-xl font-semibold text-[#1A1A1A] mb-2">Interested in {projectName}?</p>
              <p className="text-sm text-[#1A1A1A]/70 mb-6 max-w-md mx-auto">
                Register your interest to learn more about {projectName}. Our team will provide you with the latest details.
              </p>
              {onRegisterInterest && (
                <PearlButton
                  onClick={onRegisterInterest}
                  size="md"
                  leadingIcon={<CreditCard strokeWidth={2.2} />}
                >
                  Register Your Interest
                </PearlButton>
              )}

            </div>
          )}

          {handoverDate && (
            <p className="mt-6 text-sm text-[#1A1A1A]/70 italic text-center">
              {isPostHandover && postHandoverEndDate
                ? `Project handover: ${formattedHandoverDate || handoverDate}. The ${handoverPct || 30}% post-handover balance is mortgage-financeable after handover, subject to bank approval, and is fully settled by ${formattedPostHandoverEndDate || postHandoverEndDate}.`
                : `Benefit from extended payment terms until ${handoverDate} handover`}
            </p>
          )}

        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
