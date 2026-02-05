import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTierProgress } from "@/hooks/useTierProgress";
import { Loader2, TrendingUp, TrendingDown, Award, Briefcase, BookOpen, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PointsActivityProps {
  className?: string;
  limit?: number;
}

const EVENT_ICONS: Record<string, typeof Award> = {
  'deal_closed': Briefcase,
  'deal_closed_premium': Briefcase,
  'training_module_complete': BookOpen,
  'certification_earned': Award,
  'developer_visit_checkin': MapPin,
  'daily_login': Calendar,
  'referral_broker_signup': TrendingUp,
  'referral_broker_first_deal': TrendingUp,
};

export function PointsActivity({ className, limit = 10 }: PointsActivityProps) {
  const { recentPoints, isLoading } = useTierProgress();

  if (isLoading) {
    return (
      <Card className={cn("bg-black/40 border-white/10", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const displayedPoints = recentPoints.slice(0, limit);

  return (
    <Card className={cn("bg-black/40 border-white/10 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold" />
          Points Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedPoints.length === 0 ? (
          <div className="text-center text-white/60 py-6">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No points activity yet</p>
            <p className="text-xs mt-1">Complete activities to earn points!</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-3">
            <div className="space-y-3">
              {displayedPoints.map((entry) => {
                const Icon = EVENT_ICONS[entry.event_type] || Award;
                const isPositive = entry.points_delta > 0;

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      isPositive ? "bg-emerald-500/20" : "bg-red-500/20"
                    )}>
                      <Icon className={cn(
                        "w-4 h-4",
                        isPositive ? "text-emerald-400" : "text-red-400"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-white truncate">
                          {entry.event_description || formatEventType(entry.event_type)}
                        </span>
                        <span className={cn(
                          "text-sm font-semibold whitespace-nowrap",
                          isPositive ? "text-emerald-400" : "text-red-400"
                        )}>
                          {isPositive ? '+' : ''}{entry.points_delta}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/40 mt-0.5">
                        <span>{formatEventType(entry.event_type)}</span>
                        <span>{formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function formatEventType(eventType: string): string {
  return eventType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
