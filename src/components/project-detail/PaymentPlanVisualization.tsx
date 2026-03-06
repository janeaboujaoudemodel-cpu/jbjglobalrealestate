import { useState } from "react";
import { CreditCard, Calendar, CheckCircle, Home, Percent, Clock, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentBreakdown {
  down_payment?: string;
  during_construction?: string;
  on_completion?: string;
}

interface PaymentPlanVisualizationProps {
  paymentPlan?: string | null;
  paymentBreakdown?: PaymentBreakdown | null;
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
  
  const milestones = [];
  
  if (paymentBreakdown?.down_payment) {
    milestones.push({
      label: "On Booking",
      value: paymentBreakdown.down_payment,
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500",
      ringColor: "ring-emerald-500/30",
    });
  } else if (parsed || downPaymentPercent) {
    milestones.push({
      label: "On Booking",
      value: `${downPaymentPercent || parsed?.booking || 10}%`,
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500",
      ringColor: "ring-emerald-500/30",
    });
  }
  
  if (paymentBreakdown?.during_construction) {
    milestones.push({
      label: "During Construction",
      value: paymentBreakdown.during_construction,
      icon: Calendar,
      color: "text-gold",
      bgColor: "bg-gold",
      ringColor: "ring-gold/30",
    });
  } else if (parsed?.construction) {
    milestones.push({
      label: "During Construction",
      value: `${parsed.construction}%`,
      icon: Calendar,
      color: "text-gold",
      bgColor: "bg-gold",
      ringColor: "ring-gold/30",
    });
  }
  
  if (paymentBreakdown?.on_completion) {
    milestones.push({
      label: "On Handover",
      value: paymentBreakdown.on_completion,
      icon: Home,
      color: "text-champagne-dark",
      bgColor: "bg-champagne-dark",
      ringColor: "ring-champagne-dark/30",
    });
  } else if (parsed?.handover) {
    milestones.push({
      label: "On Handover",
      value: `${parsed.handover}%`,
      icon: Home,
      color: "text-champagne-dark",
      bgColor: "bg-champagne-dark",
      ringColor: "ring-champagne-dark/30",
    });
  }

  const getPercentageValue = (str?: string): number => {
    if (!str) return 0;
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const bookingPct = getPercentageValue(milestones[0]?.value);
  const constructionPct = getPercentageValue(milestones[1]?.value);
  const handoverPct = getPercentageValue(milestones[2]?.value);
  const total = bookingPct + constructionPct + handoverPct;

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-gold" />
        Payment Plan
      </h3>

      {/* Two-Tab Layout: 100% vs Installment */}
      <Tabs defaultValue="installment" className="w-full">
        <TabsList className="w-full mb-6 bg-muted/50 border border-gold/20">
          <TabsTrigger value="installment" className="flex-1 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-[#C8A766]/60">
            <CreditCard className="w-4 h-4 mr-2" />
            Payment Plan {paymentPlan && `(${paymentPlan})`}
          </TabsTrigger>
          <TabsTrigger value="full" className="flex-1 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border data-[state=active]:border-[#C8A766]/60">
            <Wallet className="w-4 h-4 mr-2" />
            100% Payment
          </TabsTrigger>
        </TabsList>

        {/* Full Payment Tab */}
        <TabsContent value="full">
          <div className="p-6 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 to-gold/10 text-center">
            <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4 ring-4 ring-gold/10">
              <Wallet className="w-8 h-8 text-gold" />
            </div>
            <p className="text-2xl font-bold text-gold mb-2">100%</p>
            <p className="text-sm text-muted-foreground">Pay full amount upfront</p>
            <p className="text-xs text-muted-foreground mt-2">Contact us for special discounts on full payment</p>
          </div>
        </TabsContent>

        {/* Installment Tab */}
        <TabsContent value="installment">
          {/* Payment Plan Summary */}
          {paymentPlan && (
            <div className="mb-6 p-5 rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 to-gold/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center ring-4 ring-gold/10">
                  <Percent className="w-7 h-7 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold">{paymentPlan}</p>
                  <p className="text-sm text-muted-foreground">Flexible Payment Structure</p>
                </div>
              </div>
              
              {postHandoverYears && postHandoverYears > 0 && (
                <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg w-fit">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-400">
                    {postHandoverYears} {postHandoverYears === 1 ? 'Year' : 'Years'} Post-Handover
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Visual Timeline with Progress Bar */}
          {total > 0 && (
            <div className="mb-8">
              <div className="h-6 rounded-full bg-muted overflow-hidden flex shadow-inner relative">
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
                    className="h-full bg-gradient-to-r from-gold to-amber-400 transition-all flex items-center justify-center"
                    style={{ width: `${(constructionPct / total) * 100}%` }}
                  >
                    <span className="text-[10px] font-bold text-black drop-shadow-sm">{constructionPct}%</span>
                  </div>
                )}
                {handoverPct > 0 && (
                  <div 
                    className="h-full bg-gradient-to-r from-champagne-dark to-champagne transition-all flex items-center justify-center"
                    style={{ width: `${(handoverPct / total) * 100}%` }}
                  >
                    <span className="text-[10px] font-bold text-black drop-shadow-sm">{handoverPct}%</span>
                  </div>
                )}
              </div>
              
              {/* Timeline Dots */}
              <div className="relative mt-4">
                <div className="absolute top-3 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-gold to-champagne-dark" />
                <div className="flex justify-between relative">
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-card shadow-lg z-10" />
                    <span className="mt-2 text-xs text-muted-foreground text-center">On Booking</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-gold border-4 border-card shadow-lg z-10" />
                    <span className="mt-2 text-xs text-muted-foreground text-center">During Construction</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-6 h-6 rounded-full bg-champagne-dark border-4 border-card shadow-lg z-10" />
                    <span className="mt-2 text-xs text-muted-foreground text-center">
                      On Handover{handoverDate && <><br /><span className="text-gold font-medium">{handoverDate}</span></>}
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
                  className="p-5 rounded-xl border border-gold/20 bg-card hover:border-gold/40 transition-all text-center"
                >
                  <div className={`w-16 h-16 rounded-full ${milestone.bgColor}/20 flex items-center justify-center mx-auto mb-3 ring-4 ${milestone.ringColor}`}>
                    <span className={`text-xl font-bold ${milestone.color}`}>
                      {getPercentageValue(milestone.value)}%
                    </span>
                  </div>
                  <milestone.icon className={`w-5 h-5 ${milestone.color} mx-auto mb-2`} />
                  <p className="text-sm font-medium text-muted-foreground">{milestone.label}</p>
                </div>
              ))}
            </div>
          )}

          {milestones.length === 0 && !paymentPlan && (
            <div className="p-8 rounded-xl border-2 border-dashed border-gold/40 bg-gradient-to-br from-gold/5 via-transparent to-gold/10 text-center">
              <div className="w-20 h-20 rounded-full bg-gold/15 flex items-center justify-center mx-auto mb-5 ring-4 ring-gold/10">
                <CreditCard className="w-10 h-10 text-gold" />
              </div>
              <p className="text-xl font-semibold text-foreground mb-2">Payment Plan Details</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Register your interest to receive the exclusive payment plan details for {projectName} directly from our team.
              </p>
              {onRegisterInterest && (
                <button
                  onClick={onRegisterInterest}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-r from-gold to-amber-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Register Your Interest
                </button>
              )}
            </div>
          )}

          {handoverDate && (
            <p className="mt-6 text-sm text-muted-foreground italic text-center">
              Benefit from extended payment terms until {handoverDate} handover
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
