import { CreditCard, Calendar, CheckCircle, Home, Percent } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
}

export default function PaymentPlanVisualization({
  paymentPlan,
  paymentBreakdown,
  handoverDate,
  downPaymentPercent,
  projectName,
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
      bgColor: "bg-emerald-500/20",
    });
  } else if (parsed || downPaymentPercent) {
    milestones.push({
      label: "On Booking",
      value: `${downPaymentPercent || parsed?.booking || 10}%`,
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/20",
    });
  }
  
  if (paymentBreakdown?.during_construction) {
    milestones.push({
      label: "During Construction",
      value: paymentBreakdown.during_construction,
      icon: Calendar,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
    });
  } else if (parsed?.construction) {
    milestones.push({
      label: "During Construction",
      value: `${parsed.construction}%`,
      icon: Calendar,
      color: "text-amber-400",
      bgColor: "bg-amber-500/20",
    });
  }
  
  if (paymentBreakdown?.on_completion) {
    milestones.push({
      label: "On Handover",
      value: paymentBreakdown.on_completion,
      icon: Home,
      color: "text-gold",
      bgColor: "bg-gold/20",
    });
  } else if (parsed?.handover) {
    milestones.push({
      label: "On Handover",
      value: `${parsed.handover}%`,
      icon: Home,
      color: "text-gold",
      bgColor: "bg-gold/20",
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

      {/* Payment Plan Summary */}
      {paymentPlan && (
        <div className="mb-6 p-4 rounded-xl border border-gold/30 bg-gold/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <Percent className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-lg font-bold text-gold">{paymentPlan}</p>
              <p className="text-sm text-muted-foreground">Flexible Payment Structure</p>
            </div>
          </div>
        </div>
      )}

      {/* Visual Progress Bar */}
      {total > 0 && (
        <div className="mb-6">
          <div className="h-4 rounded-full bg-muted overflow-hidden flex">
            {bookingPct > 0 && (
              <div 
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${(bookingPct / total) * 100}%` }}
              />
            )}
            {constructionPct > 0 && (
              <div 
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${(constructionPct / total) * 100}%` }}
              />
            )}
            {handoverPct > 0 && (
              <div 
                className="h-full bg-gold transition-all"
                style={{ width: `${(handoverPct / total) * 100}%` }}
              />
            )}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Booking</span>
            <span>Construction</span>
            <span>Handover {handoverDate && `(${handoverDate})`}</span>
          </div>
        </div>
      )}

      {/* Payment Milestones */}
      {milestones.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {milestones.map((milestone, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl border border-gold/20 bg-card hover:border-gold/40 transition-all"
            >
              <div className={`w-10 h-10 rounded-full ${milestone.bgColor} flex items-center justify-center mb-3`}>
                <milestone.icon className={`w-5 h-5 ${milestone.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{milestone.value}</p>
              <p className="text-sm text-muted-foreground">{milestone.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Benefit Statement */}
      {handoverDate && (
        <p className="mt-6 text-sm text-muted-foreground italic">
          Benefit from extended payment terms until {handoverDate} handover
        </p>
      )}
    </div>
  );
}
