import { CreditCard, Calendar, CheckCircle, Home, Percent, Clock } from "lucide-react";

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
}

export default function PaymentPlanVisualization({
  paymentPlan,
  paymentBreakdown,
  handoverDate,
  downPaymentPercent,
  projectName,
  postHandoverYears,
}: PaymentPlanVisualizationProps) {
  // Parse payment plan percentages from string like "60/40", "70/30", "80/20"
  const parsePaymentPlan = (plan?: string | null): { booking: number; construction: number; handover: number } | null => {
    if (!plan) return null;
    
    // Try to extract percentages from common formats
    const match = plan.match(/(\d+)\s*[\/\-]\s*(\d+)/);
    if (match) {
      const first = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      
      // Assume first number is pre-handover, second is on/post handover
      if (first + second === 100) {
        // Common split: 10% booking + rest during construction + handover
        const booking = Math.min(first, 20); // Usually 10-20% booking
        const construction = first - booking;
        return { booking, construction, handover: second };
      }
    }
    
    return null;
  };

  const parsed = parsePaymentPlan(paymentPlan);
  
  // Build milestones from breakdown or parsed plan
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

  // Calculate visual progress segments
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

      {/* Payment Plan Summary - Premium Box */}
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
          
          {/* Post-Handover Badge */}
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

      {/* Visual Timeline with Connecting Line - 3 Color Premium */}
      {total > 0 && (
        <div className="mb-8">
          {/* Progress Bar */}
          <div className="h-6 rounded-full bg-muted overflow-hidden flex shadow-inner relative">
            {bookingPct > 0 && (
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all relative group flex items-center justify-center"
                style={{ width: `${(bookingPct / total) * 100}%` }}
              >
                <span className="text-[10px] font-bold text-white drop-shadow-sm">
                  {bookingPct}%
                </span>
              </div>
            )}
            {constructionPct > 0 && (
              <div 
                className="h-full bg-gradient-to-r from-gold to-amber-400 transition-all relative group flex items-center justify-center"
                style={{ width: `${(constructionPct / total) * 100}%` }}
              >
                <span className="text-[10px] font-bold text-black drop-shadow-sm">
                  {constructionPct}%
                </span>
              </div>
            )}
            {handoverPct > 0 && (
              <div 
                className="h-full bg-gradient-to-r from-champagne-dark to-champagne transition-all relative group flex items-center justify-center"
                style={{ width: `${(handoverPct / total) * 100}%` }}
              >
                <span className="text-[10px] font-bold text-black drop-shadow-sm">
                  {handoverPct}%
                </span>
              </div>
            )}
          </div>
          
          {/* Timeline Dots with Connecting Line */}
          <div className="relative mt-4">
            {/* Connecting Line */}
            <div className="absolute top-3 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-gold to-champagne-dark" />
            
            {/* Timeline Dots */}
            <div className="flex justify-between relative">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-card shadow-lg z-10" />
                <span className="mt-2 text-xs text-muted-foreground text-center">Booking</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-gold border-4 border-card shadow-lg z-10" />
                <span className="mt-2 text-xs text-muted-foreground text-center">Construction</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-champagne-dark border-4 border-card shadow-lg z-10" />
                <span className="mt-2 text-xs text-muted-foreground text-center">Handover{handoverDate && <br />}<span className="text-gold font-medium">{handoverDate}</span></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Milestones - Percentage Circles (Milestone-style) */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {milestones.map((milestone, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-xl border border-gold/20 bg-card hover:border-gold/40 transition-all text-center"
            >
              {/* Percentage Circle */}
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

      {/* Benefit Statement */}
      {handoverDate && (
        <p className="mt-6 text-sm text-muted-foreground italic text-center">
          Benefit from extended payment terms until {handoverDate} handover
        </p>
      )}

      {/* Report Issue Link */}
      <div className="mt-6 pt-4 border-t border-gold/10 text-center">
        <button className="text-xs text-muted-foreground hover:text-gold transition-colors">
          Notice something incorrect? Report an issue
        </button>
      </div>
    </div>
  );
}
