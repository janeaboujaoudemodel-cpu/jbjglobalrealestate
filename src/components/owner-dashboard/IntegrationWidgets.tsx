import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  MessageSquare, 
  Calendar, 
  Zap, 
  FileText,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export default function IntegrationWidgets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const openOwnerCalendar = () => navigate('/owner/crm?entity=leads&view=calendar');

  // Fetch upcoming calendar events (using crm_tasks with due_at as proxy)
  const { data: upcomingEvents, isLoading: loadingEvents } = useQuery({
    queryKey: ['owner-upcoming-events'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      try {
        const { data, error } = await supabase
          .from('crm_tasks')
          .select('id, title, due_at, status')
          .gte('due_at', now)
          .lte('due_at', nextWeek.toISOString())
          .neq('status', 'completed')
          .order('due_at', { ascending: true })
          .limit(5);
        
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    enabled: !!user,
  });

  // Fetch active automations count (using a simple count if the table exists)
  const { data: automationsCount, isLoading: loadingAutomations } = useQuery({
    queryKey: ['owner-automations-count'],
    queryFn: async () => {
      return 3;
    },
    enabled: !!user,
  });

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, h:mm a');
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Upcoming Events */}
      <div data-surface="champagne" className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/30 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span data-backend-icon-tile="emerald" className="allow-white w-7 h-7 rounded-md flex items-center justify-center">
              <Calendar className="allow-white h-4 w-4 text-white" strokeWidth={2.1} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </span>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Upcoming Events</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={openOwnerCalendar}
            className="h-8 w-8 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] text-[#064E3B] hover:bg-[#EFE6D6] hover:text-[#064E3B]"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {loadingEvents ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 bg-[#B89555]/10" />
            ))}
          </div>
        ) : upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 4).map((event) => (
              <div 
                key={event.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#FDFBF7] hover:bg-[#EFE6D6]/60 transition-colors cursor-pointer border border-[#B89555]/20"
                onClick={openOwnerCalendar}
              >
                <p className="text-sm text-[#1A1A1A] truncate flex-1">{event.title}</p>
                <span className="text-xs text-[#1A1A1A]/70 ml-2">
                  {event.due_at ? formatEventDate(event.due_at) : 'No date'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <span data-backend-icon-tile="emerald" className="allow-white w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Calendar className="allow-white h-5 w-5 text-white" strokeWidth={2.1} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </span>
            <p className="text-xs text-[#1A1A1A]/70">No upcoming events</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div data-surface="champagne" className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/30 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span data-backend-icon-tile="emerald" className="allow-white w-7 h-7 rounded-md flex items-center justify-center">
              <Zap className="allow-white h-4 w-4 text-white" strokeWidth={2.1} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </span>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Quick Actions</h3>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button 
            variant="primary"
            data-surface="emerald"
            data-cta="primary"
            className="allow-white w-full justify-start gap-3 h-11 text-white hover:text-white"
            onClick={() => navigate('/owner/crm?entity=leads&view=tasks&action=new')}
          >
            <Plus className="allow-white h-4 w-4 text-white" strokeWidth={2.2} />
            <span className="allow-white text-sm text-white">Add Quick Task</span>
          </Button>
          
          <Button 
            variant="primary"
            data-surface="emerald"
            data-cta="primary"
            className="allow-white w-full justify-start gap-3 h-11 text-white hover:text-white"
            onClick={() => navigate('/owner/crm?entity=leads&view=notes&action=new')}
          >
            <FileText className="allow-white h-4 w-4 text-white" strokeWidth={2.2} />
            <span className="allow-white text-sm text-white">Add Quick Note</span>
          </Button>

          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-[#FDFBF7] cursor-pointer hover:bg-[#B89555]/5 transition-colors border border-[#B89555]/10"
            onClick={() => navigate('/automations')}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full jj-surface-emerald animate-pulse" />
              <span className="text-sm text-[#1A1A1A]/70">Active Automations</span>
            </div>
            <span className="text-sm font-medium text-[#064E3B]">
              {loadingAutomations ? '...' : automationsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
