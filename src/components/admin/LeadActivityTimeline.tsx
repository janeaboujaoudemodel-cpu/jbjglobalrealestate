import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow } from "date-fns";
import {
  Eye,
  Download,
  Brain,
  Clock,
  MousePointer,
  Search,
  FileText,
  MapPin,
  Home,
  Zap,
  Activity,
  AlertCircle,
} from "lucide-react";

interface ActivityEvent {
  id: string;
  event_type: string;
  activity_type: string;
  page_path: string | null;
  activity_data: Record<string, unknown> | null;
  tool_name: string | null;
  created_at: string;
  lead_email: string | null;
}

// Map event types to icons, colors, and human-readable labels
const EVENT_CONFIG: Record<
  string,
  { icon: React.FC<{ className?: string }>; color: string; label: string; bg: string }
> = {
  page_view: {
    icon: Eye,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    label: "Viewed page",
  },
  book_download: {
    icon: Download,
    color: "text-gold",
    bg: "bg-amber-500/10 border-amber-500/30",
    label: "Downloaded book",
  },
  time_on_page: {
    icon: Clock,
    color: "text-zinc-400",
    bg: "bg-zinc-700/30 border-zinc-600/30",
    label: "Time on page",
  },
  tool_use: {
    icon: Brain,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
    label: "Used AI tool",
  },
  search: {
    icon: Search,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    label: "Searched",
  },
  inquiry: {
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    label: "Submitted inquiry",
  },
  property_view: {
    icon: Home,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    label: "Viewed property",
  },
  community_view: {
    icon: MapPin,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/30",
    label: "Viewed community",
  },
  click: {
    icon: MousePointer,
    color: "text-zinc-300",
    bg: "bg-zinc-700/30 border-zinc-600/30",
    label: "Clicked",
  },
  form_submission: {
    icon: FileText,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    label: "Form submitted",
  },
  role_selection: {
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
    label: "Selected role",
  },
};

const DEFAULT_EVENT = {
  icon: Activity,
  color: "text-zinc-400",
  bg: "bg-zinc-700/30 border-zinc-600/30",
  label: "Activity",
};

function getEventConfig(eventType: string) {
  return EVENT_CONFIG[eventType] ?? DEFAULT_EVENT;
}

/** Strip the origin from a URL so we show just the path */
function cleanPath(raw: string | null): string {
  if (!raw) return "—";
  try {
    const url = new URL(raw);
    return url.pathname || raw;
  } catch {
    return raw;
  }
}

/** Pull a meaningful detail string from activity_data */
function getEventDetail(event: ActivityEvent): string | null {
  const d = event.activity_data;
  if (!d) return null;
  if (event.event_type === "time_on_page") {
    const secs = d.duration_seconds as number | undefined;
    if (secs != null) return `${secs}s on page`;
  }
  if (event.event_type === "search") {
    const q = d.search_query as string | undefined;
    if (q) return `"${q}"`;
  }
  if (event.event_type === "tool_use") {
    return (d.tool_name as string) || event.tool_name || null;
  }
  if (event.event_type === "book_download") {
    return (d.form_source as string) === "returning_lead" ? "Returning user" : "New user";
  }
  if (event.event_type === "property_view") {
    return (d.property_name as string) || (d.property_id as string) || null;
  }
  if (event.event_type === "community_view") {
    return (d.community_name as string) || (d.community as string) || null;
  }
  if (event.event_type === "click") {
    return (d.element as string) || null;
  }
  if (event.event_type === "role_selection") {
    return (d.selected_role as string) || null;
  }
  if (event.event_type === "form_submission") {
    return (d.form_name as string) || null;
  }
  return null;
}

interface LeadActivityTimelineProps {
  email: string | null;
}

export default function LeadActivityTimeline({ email }: LeadActivityTimelineProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    setIsLoading(true);
    setError(null);

    supabase
      .from("user_activity_log")
      .select("id, event_type, activity_type, page_path, activity_data, tool_name, created_at, lead_email")
      .eq("lead_email", email)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (err) {
          setError("Failed to load activity");
        } else {
          setEvents((data as ActivityEvent[]) || []);
        }
        setIsLoading(false);
      });
  }, [email]);

  // Summary counts
  const summary = {
    pageViews: events.filter((e) => e.event_type === "page_view").length,
    downloads: events.filter((e) => e.event_type === "book_download").length,
    aiTools: events.filter((e) => e.event_type === "tool_use").length,
    inquiries: events.filter(
      (e) => e.event_type === "inquiry" || e.event_type === "form_submission"
    ).length,
  };

  const uniquePages = new Set(
    events.filter((e) => e.event_type === "page_view").map((e) => cleanPath(e.page_path))
  ).size;

  if (!email) {
    return (
      <div className="flex items-center justify-center py-16 text-zinc-500">
        <AlertCircle className="w-5 h-5 mr-2" />
        No email address — cannot look up activity.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Page Views", value: summary.pageViews, sub: `${uniquePages} unique`, color: "border-blue-500/40 text-blue-400" },
          { label: "Downloads", value: summary.downloads, sub: "Book", color: "border-amber-500/40 text-amber-400" },
          { label: "AI Tools", value: summary.aiTools, sub: "Used", color: "border-purple-500/40 text-purple-400" },
          { label: "Inquiries", value: summary.inquiries, sub: "Submitted", color: "border-emerald-500/40 text-emerald-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`bg-zinc-950 border rounded-xl p-3 text-center ${stat.color}`}
          >
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-zinc-600">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-3 pt-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48 bg-zinc-800" />
                <Skeleton className="h-3 w-32 bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-10 text-red-400 gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
          <Activity className="w-8 h-8 text-zinc-700" />
          <p className="text-sm">No activity recorded yet for this lead.</p>
          <p className="text-xs text-zinc-600">Activity is tracked after form submission.</p>
        </div>
      ) : (
        <ScrollArea className="h-[380px] pr-2">
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-zinc-800" />

            <div className="space-y-2">
              {events.map((event, idx) => {
                const cfg = getEventConfig(event.event_type);
                const Icon = cfg.icon;
                const detail = getEventDetail(event);
                const path = cleanPath(event.page_path);
                const isLast = idx === events.length - 1;

                return (
                  <div key={event.id} className="flex items-start gap-3 pl-1">
                    {/* Icon node */}
                    <div
                      className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${cfg.bg}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>

                    {/* Content */}
                    <div
                      className={`flex-1 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 ${
                        isLast ? "" : "mb-0"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-medium">{cfg.label}</span>
                          {detail && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-zinc-700 text-zinc-300 font-normal"
                            >
                              {detail}
                            </Badge>
                          )}
                        </div>
                        <time
                          className="text-zinc-500 text-[11px] flex-shrink-0"
                          title={format(new Date(event.created_at), "PPpp")}
                        >
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                        </time>
                      </div>
                      {path !== "—" && (
                        <p
                          className="text-zinc-500 text-[11px] mt-1 font-mono truncate max-w-[340px]"
                          title={path}
                        >
                          {path}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
