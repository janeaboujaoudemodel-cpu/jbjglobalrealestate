import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, AlertTriangle, CheckCircle2, XCircle, Info, Wrench } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ErrorAlert {
  id: string;
  function_name: string;
  error_type: string | null;
  created_at: string;
  suggestion?: string;
  fixAction?: string;
}

const ERROR_SUGGESTIONS: Record<string, { suggestion: string; fixAction: string }> = {
  "rate_limit_exceeded": {
    suggestion: "Increase the rate limit window or reduce request frequency.",
    fixAction: "Go to Rate Limits → Adjust the window for this function.",
  },
  "processing_error": {
    suggestion: "The AI model may have timed out. Retry with a shorter input or try again later.",
    fixAction: "Check AI Analytics → Recent Errors for details.",
  },
  "authentication_error": {
    suggestion: "The user's session expired or they lack permission.",
    fixAction: "Check Audit Logs → Filter by 'block' actions.",
  },
  "ip_blocked": {
    suggestion: "A blocked IP attempted access. Review if the block is still needed.",
    fixAction: "Go to IP Blocklist → Review recent blocks.",
  },
  "unknown": {
    suggestion: "An unexpected error occurred. Check the function logs for stack traces.",
    fixAction: "Go to AI Analytics → Recent Errors for the full trace.",
  },
};

export function AdminNotificationBell() {
  const [alerts, setAlerts] = useState<ErrorAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("id, function_name, error_type, created_at")
        .eq("success", false)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const enriched: ErrorAlert[] = (data || []).map((log) => {
        const key = log.error_type || "unknown";
        const info = ERROR_SUGGESTIONS[key] || ERROR_SUGGESTIONS["unknown"];
        return {
          ...log,
          suggestion: info.suggestion,
          fixAction: info.fixAction,
        };
      });

      setAlerts(enriched);
      setUnreadCount(enriched.filter(a => {
        const created = new Date(a.created_at);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return created > oneHourAgo;
      }).length);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleDismissAll = () => {
    setUnreadCount(0);
    toast.success("All alerts dismissed");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-black hover:text-gold hover:bg-gold/10 h-9 w-9"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-96 p-0 bg-white border-2 border-gold/30 shadow-xl"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 border-b border-gold/20 bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6]">
          <h3 className="text-black font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gold" />
            System Alerts
          </h3>
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissAll}
              className="text-xs text-black/50 hover:text-black h-7"
            >
              Dismiss all
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {alerts.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-black/60 text-sm">All systems operational</p>
              <p className="text-black/40 text-xs mt-1">No recent errors detected</p>
            </div>
          ) : (
            <div className="divide-y divide-gold/10">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-3 hover:bg-gold/5 transition-colors">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-black text-sm font-medium truncate">
                          {alert.function_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-red-200 text-red-600 flex-shrink-0">
                          {alert.error_type || "error"}
                        </Badge>
                      </div>
                      <p className="text-black/50 text-xs mt-0.5">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </p>
                      
                      {/* Suggestion */}
                      <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-start gap-1.5">
                          <Info className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-amber-800 text-xs leading-relaxed">{alert.suggestion}</p>
                        </div>
                      </div>
                      
                      {/* Fix action */}
                      <div className="mt-1.5 flex items-center gap-1 text-xs text-gold">
                        <Wrench className="w-3 h-3" />
                        <span>{alert.fixAction}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default AdminNotificationBell;
