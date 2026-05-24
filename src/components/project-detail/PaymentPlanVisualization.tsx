import { useState } from "react";
import { CreditCard, Calendar, CheckCircle, Home, Percent, Clock, Wallet, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PearlButton } from "@/components/ui/pearl-button";

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
}

export default function PaymentPlanVisualization({
  paymentPlan,
  paymentBreakdown,
  handoverDate,
  downPaymentPercent,
  projectName,
  postHandoverYears,
  onRegisterInterest,
}: PaymentPlanVisualizationProps) {
  const parsePaymentPlan = (plan?: string | null): { booking: number; construction: number; handover: number } | null => {
    if (!plan) return null;
    const match = plan.match(/(\d+)\s*[\/\-]\s*(\d+)/);
    if (match) {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      if (first + second === 100) {
        const booking = Math.min(first, 20);
        const construction = first - booking;
        return { booking, construction, handover: second };
      }
    }
    return null;
  };

  const parsed = parsePaymentPlan(paymentPlan);

  const isDetailedBreakdown = Array.isArray(paymentBreakdown);
  const detailedMilestones: PaymentMilestone[] = isDetailedBreakdown ? (paymentBreakdown as PaymentMilestone[]) : [];
  const legacyBreakdown = !isDetailedBreakdown ? (paymentBreakdown as PaymentBreakdownLegacy | null) : null;
  
  const milestones = [];
  
  if (legacyBreakdown?.down_payment) {
    milestones.push({
      label: "On Booking",
      value: legacyBreakdown.down_payment,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500",
      lightBg: "bg-emerald-50",
      ringColor: "ring-emerald-200",
    });
  } else if (!isDetailedBreakdown && (parsed || downPaymentPercent)) {
    milestones.push({
      label: "On Booking",
      value: `${downPaymentPercent || parsed?.booking || 10}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500",
      lightBg: "bg-emerald-50",
      ringColor: "ring-emerald-200",
    });
  } else if (isDetailedBreakdown && detailedMilestones.length > 0) {
    const first = detailedMilestones[0];
    milestones.push({
      label: first.milestone || "On Booking",
      value: `${first.percentage}%`,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500",
      lightBg: "bg-emerald-50",
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
  } else if (!isDetailedBreakdown && parsed?.construction) {
    milestones.push({
      label: "During Construction",
      value: `${parsed.construction}%`,
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
  
  if (legacyBreakdown?.on_completion) {
    milestones.push({
      label: "On Handover",
      value: legacyBreakdown.on_completion,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      lightBg: "bg-blue-50",
      ringColor: "ring-blue-200",
    });
  } else if (!isDetailedBreakdown && parsed?.handover) {
    milestones.push({
      label: "On Handover",
      value: `${parsed.handover}%`,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      lightBg: "bg-blue-50",
      ringColor: "ring-blue-200",
    });
  } else if (isDetailedBreakdown && detailedMilestones.length > 1) {
    const last = detailedMilestones[detailedMilestones.length - 1];
    milestones.push({
      label: last.milestone || "On Handover",
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
    <div className="rounded-2xl bg-[#FDFBF7] border border-[#B89555]/30 p-6 md:p-8 shadow-sm">
      <h3 className="text-h3-sm font-medium text-[#1A1A1A] flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-[#1A1A1A]" />
        Payment Plan
      </h3>

      <Tabs defaultValue="installment" className="w-full">
        <TabsList className="w-full mb-6 bg-[#F7F2EA] border border-[#B89555]/30">
          <TabsTrigger value="installment" className="flex-1 text-[#1A1A1A]/70 data-[state=active]:bg-[#FDFBF7] data-[state=active]:text-[#1A1A1A] data-[state=active]:border data-[state=active]:border-[#B89555]/30 data-[state=active]:shadow-sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment Plan {paymentPlan && `(${paymentPlan})`}
          </TabsTrigger>
          <TabsTrigger value="full" className="flex-1 text-[#1A1A1A]/70 data-[state=active]:bg-[#FDFBF7] data-[state=active]:text-[#1A1A1A] data-[state=active]:border data-[state=active]:border-[#B89555]/30 data-[state=active]:shadow-sm">
            <Wallet className="w-4 h-4 mr-2" />
            100% Payment
          </TabsTrigger>
        </TabsList>

        {/* Full Payment Tab */}
        <TabsContent value="full">
          <div className="p-6 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] text-center">
            <div className="w-16 h-16 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center mx-auto mb-4 ring-4 ring-black/5">
              <Wallet className="w-8 h-8 text-[#1A1A1A]" />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A] mb-2">100%</p>
            <p className="text-sm text-[#1A1A1A]/70">Pay full amount upfront</p>
            <p className="text-xs text-[#1A1A1A]/70 mt-2">Contact us for special discounts on full payment</p>
          </div>
        </TabsContent>

        {/* Installment Tab */}
        <TabsContent value="installment">
          {paymentPlan && (
            <div className="mb-6 p-5 rounded-xl border border-[#B89555]/30 bg-[#F7F2EA]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1A1A1A]/10 flex items-center justify-center ring-4 ring-black/5">
                  <Percent className="w-7 h-7 text-[#1A1A1A]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{paymentPlan}</p>
                  <p className="text-sm text-[#1A1A1A]/70">Flexible Payment Structure</p>
                </div>
              </div>
              
              {postHandoverYears && postHandoverYears > 0 && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg w-fit">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    {postHandoverYears} {postHandoverYears === 1 ? 'Year' : 'Years'} Post-Handover
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Visual Timeline with Progress Bar */}
          {total > 0 && (
            <div className="mb-8">
              <div className="h-6 rounded-full bg-[#F7F2EA] overflow-hidden flex shadow-inner relative">
                {bookingPct > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all flex items-center justify-center"
                    style={{ width: `${(bookingPct / total) * 100}%` }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">{bookingPct}%</span>
                  </div>
                )}
                {constructionPct > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all flex items-center justify-center"
                    style={{ width: `${(constructionPct / total) * 100}%` }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">{constructionPct}%</span>
                  </div>
                )}
                {handoverPct > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all flex items-center justify-center"
                    style={{ width: `${(handoverPct / total) * 100}%` }}
                  >
                    <span className="text-[10px] font-bold text-white drop-shadow-sm">{handoverPct}%</span>
                  </div>
                )}
              </div>
              
              {/* Timeline Dots */}
              <div className="relative mt-4">
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-blue-500" />
                <div className="flex justify-between relative">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow-lg z-10" />
                    <span className="mt-2 text-xs text-[#1A1A1A]/70 text-center">On Booking</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500 border-4 border-white shadow-lg z-10" />
                    <span className="mt-2 text-xs text-[#1A1A1A]/70 text-center">During Construction</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500 border-4 border-white shadow-lg z-10" />
                    <span className="mt-2 text-xs text-[#1A1A1A]/70 text-center">
                      On Handover{handoverDate && <><br /><span className="text-[#1A1A1A] font-medium">{handoverDate}</span></>}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Milestones Cards */}
          {milestones.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {milestones.map((milestone, idx) => (
                <div 
                  key={idx}
                  className={cn("p-5 rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] hover:border-[#B89555]/30 hover:shadow-md transition-all text-center", milestone.lightBg)}
                >
                  <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ring-4", milestone.lightBg, milestone.ringColor)}>
                    <span className={cn("text-xl font-bold", milestone.color)}>
                      {getPercentageValue(milestone.value)}%
                    </span>
                  </div>
                  <milestone.icon className={cn("w-5 h-5 mx-auto mb-2", milestone.color)} />
                  <p className="text-sm font-medium text-[#1A1A1A]/70">{milestone.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Detailed Payment Structure Card — only show if we actually have a granular
              monthly/multi-installment schedule (more than the standard booking/construction/handover trio),
              or any installment carries explicit timing info. Otherwise it just duplicates the timeline + cards above. */}
          {isDetailedBreakdown && (detailedMilestones.length > 3 || detailedMilestones.some(m => !!m.timing)) && (
            <div className="mt-6 p-5 rounded-xl border border-[#B89555]/30 bg-[#FDFBF7]">
              <div className="flex items-center gap-2 mb-4">
                <List className="w-5 h-5 text-[#1A1A1A]" />
                <h4 className="font-semibold text-[#1A1A1A]">Detailed Payment Structure</h4>
              </div>
              <div className="space-y-0">
                {detailedMilestones.map((step, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === detailedMilestones.length - 1;
                  return (
                    <div 
                      key={idx}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 border-b border-[#B89555]/30 last:border-b-0",
                        isFirst && "bg-emerald-50/50",
                        isLast && "bg-blue-50/50",
                      )}
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold",
                        isFirst ? "bg-emerald-100 text-emerald-700" :
                        isLast ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
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
                        isFirst ? "text-emerald-600" :
                        isLast ? "text-blue-600" :
                        "text-amber-600"
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
              Benefit from extended payment terms until {handoverDate} handover
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
