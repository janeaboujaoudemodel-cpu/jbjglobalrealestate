import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { 
  Clock, MapPin, FileText, MousePointer, 
  ArrowRight, Globe, Eye, Timer
} from "lucide-react";

interface JourneyEvent {
  id: string;
  event_type: string;
  page_path: string;
  created_at: string;
  event_data?: {
    time_spent?: number;
    scroll_depth?: number;
    pages_visited?: string[];
    form_source?: string;
    [key: string]: any;
  };
  device_type?: string;
  referrer?: string;
}

interface LeadJourneyTrackerProps {
  events: JourneyEvent[];
  entryTime?: string;
  totalTimeSpent?: number;
  pagesVisited?: string[];
  lastInteraction?: string;
  source?: string;
}

const LeadJourneyTracker = ({
  events = [],
  entryTime,
  totalTimeSpent,
  pagesVisited = [],
  lastInteraction,
  source
}: LeadJourneyTrackerProps) => {
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "page_view": return <Eye className="w-3 h-3" />;
      case "form_submission": return <FileText className="w-3 h-3" />;
      case "click": return <MousePointer className="w-3 h-3" />;
      default: return <ArrowRight className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "page_view": return "text-blue-400";
      case "form_submission": return "text-green-400";
      case "click": return "text-amber-400";
      case "inquiry": return "text-purple-400";
      default: return "text-white/70";
    }
  };

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1A1A1A]" />
          Lead Journey & Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {/* Entry Time */}
          <div className="p-3 bg-[#F7F2EA]/50 rounded-lg">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Clock className="w-3 h-3" />
              Entry Time
            </div>
            <p className="text-white text-sm font-medium">
              {entryTime ? format(new Date(entryTime), "MMM d, h:mm a") : "N/A"}
            </p>
          </div>

          {/* Time Spent */}
          <div className="p-3 bg-[#F7F2EA]/50 rounded-lg">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Timer className="w-3 h-3" />
              Time on Site
            </div>
            <p className="text-white text-sm font-medium">
              {totalTimeSpent ? formatDuration(totalTimeSpent) : "N/A"}
            </p>
          </div>

          {/* Pages Visited */}
          <div className="p-3 bg-[#F7F2EA]/50 rounded-lg">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Eye className="w-3 h-3" />
              Pages Visited
            </div>
            <p className="text-white text-sm font-medium">
              {pagesVisited.length || events.filter(e => e.event_type === 'page_view').length} pages
            </p>
          </div>

          {/* Source */}
          <div className="p-3 bg-[#F7F2EA]/50 rounded-lg">
            <div className="flex items-center gap-2 text-white/70 text-xs mb-1">
              <Globe className="w-3 h-3" />
              Source
            </div>
            <p className="text-white text-sm font-medium truncate">
              {source || "Direct"}
            </p>
          </div>
        </div>

        {/* Last Interaction */}
        {lastInteraction && (
          <div className="p-3 bg-[#EFE6D6]/10 border border-[#B89555]/20 rounded-lg">
            <p className="text-xs text-[#1A1A1A]/70 mb-1">Last Interaction</p>
            <p className="text-white text-sm">
              {format(new Date(lastInteraction), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}

        {/* Pages Visited List */}
        {pagesVisited.length > 0 && (
          <div>
            <p className="text-xs text-white/90 mb-2">Pages Viewed</p>
            <div className="flex flex-wrap gap-1">
              {pagesVisited.slice(0, 6).map((page, i) => (
                <Badge 
                  key={i} 
                  variant="outline" 
                  className="text-xs border-[#1A1A1A] text-white/70"
                >
                  {page === "/" ? "Home" : page.replace("/", "")}
                </Badge>
              ))}
              {pagesVisited.length > 6 && (
                <Badge variant="outline" className="text-xs border-[#1A1A1A] text-white/70">
                  +{pagesVisited.length - 6} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Recent Events Timeline */}
        {events.length > 0 && (
          <div>
            <p className="text-xs text-white/90 mb-2">Recent Activity</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {events.slice(0, 5).map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center gap-2 text-xs"
                >
                  <span className={getEventColor(event.event_type)}>
                    {getEventIcon(event.event_type)}
                  </span>
                  <span className="text-white/70 flex-1 truncate">
                    {event.event_type.replace(/_/g, ' ')} - {event.page_path}
                  </span>
                  <span className="text-[#1A1A1A]/70">
                    {format(new Date(event.created_at), "h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadJourneyTracker;
