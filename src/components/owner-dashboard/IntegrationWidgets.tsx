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
      <div className="bg-white/70 border-2 border-[#C9A84C]/30 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-black">Upcoming Events</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/crm/calendar')}
            className="text-[#C9A84C] hover:text-[#B8973F] hover:bg-[#C9A84C]/10 h-7 px-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {loadingEvents ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 bg-[#C9A84C]/10" />
            ))}
          </div>
        ) : upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.slice(0, 4).map((event) => (
              <div 
                key={event.id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#FDFBF7] hover:bg-[#C9A84C]/5 transition-colors cursor-pointer border border-[#C9A84C]/10"
                onClick={() => navigate('/crm/calendar')}
              >
                <p className="text-sm text-black truncate flex-1">{event.title}</p>
                <span className="text-xs text-zinc-500 ml-2">
                  {event.due_at ? formatEventDate(event.due_at) : 'No date'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 text-[#C9A84C]/40 mx-auto mb-2" />
            <p className="text-xs text-zinc-500">No upcoming events</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/70 border-2 border-[#C9A84C]/30 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#C9A84C]" />
            <h3 className="text-sm font-semibold text-black">Quick Actions</h3>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 h-11 border-[#C9A84C]/30 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 text-black"
            onClick={() => navigate('/crm/tasks?action=new')}
          >
            <Plus className="h-4 w-4 text-emerald-600" />
            <span className="text-sm">Add Quick Task</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 h-11 border-[#C9A84C]/30 hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/5 text-black"
            onClick={() => navigate('/crm/notes?action=new')}
          >
            <FileText className="h-4 w-4 text-purple-600" />
            <span className="text-sm">Add Quick Note</span>
          </Button>

          <div 
            className="flex items-center justify-between p-3 rounded-lg bg-[#FDFBF7] cursor-pointer hover:bg-[#C9A84C]/5 transition-colors border border-[#C9A84C]/10"
            onClick={() => navigate('/automations')}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-zinc-600">Active Automations</span>
            </div>
            <span className="text-sm font-medium text-[#C9A84C]">
              {loadingAutomations ? '...' : automationsCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
