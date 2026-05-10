import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTierProgress } from "@/hooks/useTierProgress";
import { Loader2, TrendingUp, TrendingDown, Award, Briefcase, BookOpen, MapPin, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PointsActivityProps {
  className?: string;
  limit?: number;
}

const EVENT_ICONS: Record<string, typeof Award> = {
  'deal_closed': Briefcase,
  'deal_closed_premium': Briefcase,
  'deal_closed_standard': Briefcase,
  'deal_closed_premium_tier': Briefcase,
  'deal_closed_ultra': Briefcase,
  'deal_closed_elite': Briefcase,
  'training_module_complete': BookOpen,
  'certification_earned': Award,
  'developer_visit_checkin': MapPin,
  'daily_login': Calendar,
  'referral_broker_signup': Users,
  'referral_broker_first_deal': Users,
};

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
  'deal': { label: 'Deal', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  'training': { label: 'Training', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  'check_in': { label: 'Check-in', className: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  'referral': { label: 'Referral', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  'activity': { label: 'Activity', className: 'bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30/30' },
};

export function PointsActivity({ className, limit = 10 }: PointsActivityProps) {
  const { recentPoints, isLoading } = useTierProgress();

  if (isLoading) {
    return (
      <Card className={cn("bg-[#1A1A1A]/40 border-white/10", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#1A1A1A] animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const displayedPoints = recentPoints.slice(0, limit);

  // Helper to determine category from event type
  const getCategory = (eventType: string, category?: string | null): string => {
    if (category) return category;
    const type = eventType.toLowerCase();
    if (type.includes('deal')) return 'deal';
    if (type.includes('training') || type.includes('module')) return 'training';
    if (type.includes('checkin') || type.includes('check_in') || type.includes('visit')) return 'check_in';
    if (type.includes('referral')) return 'referral';
    return 'activity';
  };

  return (
    <Card className={cn("bg-[#1A1A1A]/40 border-white/10 backdrop-blur-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#1A1A1A]" />
          Points Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {displayedPoints.length === 0 ? (
          <div className="text-center text-white/90 py-6">
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
                const category = getCategory(entry.event_type, (entry as any).category);
                const categoryBadge = CATEGORY_BADGES[category] || CATEGORY_BADGES['activity'];

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#FDFBF7]/5 transition-colors"
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
                      <div className="flex items-center justify-between text-xs text-white/85 mt-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("text-[10px] py-0 h-5", categoryBadge.className)}>
                            {categoryBadge.label}
                          </Badge>
                        </div>
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
