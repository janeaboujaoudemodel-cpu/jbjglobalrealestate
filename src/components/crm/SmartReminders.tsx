import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, Clock, Phone, MessageSquare, Calendar, CheckCircle, 
  AlertCircle, ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isPast, isToday, isTomorrow, addDays } from "date-fns";

interface SmartRemindersProps {
  userId: string;
  limit?: number;
}

interface Reminder {
  id: string;
  leadId: string;
  leadName: string;
  type: 'call' | 'whatsapp' | 'meeting' | 'followup' | 'overdue';
  dueAt: Date;
  priority: 'high' | 'medium' | 'low';
  message: string;
  completed: boolean;
}

const SmartReminders = ({ userId, limit = 5 }: SmartRemindersProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, [userId]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      // Fetch upcoming tasks
      const { data: tasks } = await supabase
        .from("crm_tasks")
        .select(`
          id,
          title,
          due_at,
          status,
          lead_id,
          crm_leads (full_name)
        `)
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("due_at", { ascending: true })
        .limit(20);

      // Fetch leads with stale activity
      const { data: states } = await supabase
        .from("crm_lead_state_per_user")
        .select(`
          lead_id,
          last_touch_at,
          next_followup_at,
          crm_leads (full_name)
        `)
        .eq("user_id", userId)
        .not("pipeline_status", "in", '("closed_won","closed_lost","junk","do_not_contact")')
        .order("last_touch_at", { ascending: true })
        .limit(20);

      const generatedReminders: Reminder[] = [];

      // Process tasks
      tasks?.forEach((task: any) => {
        if (task.due_at) {
          const dueDate = new Date(task.due_at);
          const isOverdue = isPast(dueDate) && !isToday(dueDate);
          
          generatedReminders.push({
            id: task.id,
            leadId: task.lead_id,
            leadName: task.crm_leads?.full_name || "Unknown",
            type: isOverdue ? 'overdue' : 'followup',
            dueAt: dueDate,
            priority: isOverdue ? 'high' : isToday(dueDate) ? 'high' : 'medium',
            message: task.title,
            completed: false
          });
        }
      });

      // Generate smart reminders for stale leads
      states?.forEach((state: any) => {
        if (!state.last_touch_at) return;
        
        const lastTouch = new Date(state.last_touch_at);
        const daysSinceTouch = Math.floor(
          (Date.now() - lastTouch.getTime()) / (1000 * 60 * 60 * 24)
        );

        // No contact in 7+ days
        if (daysSinceTouch >= 7) {
          generatedReminders.push({
            id: `stale-${state.lead_id}`,
            leadId: state.lead_id,
            leadName: state.crm_leads?.full_name || "Unknown",
            type: daysSinceTouch >= 14 ? 'overdue' : 'whatsapp',
            dueAt: addDays(lastTouch, 7),
            priority: daysSinceTouch >= 14 ? 'high' : 'medium',
            message: `No contact for ${daysSinceTouch} days - re-engage`,
            completed: false
          });
        }
      });

      // Sort by priority and due date
      generatedReminders.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.dueAt.getTime() - b.dueAt.getTime();
      });

      setReminders(generatedReminders.slice(0, limit));
    } catch (err) {
      console.error("Failed to fetch reminders:", err);
    } finally {
      setLoading(false);
    }
  };

  const completeReminder = async (reminder: Reminder) => {
    if (reminder.id.startsWith('stale-')) {
      // Mark as touched
      await supabase
        .from("crm_lead_state_per_user")
        .update({ last_touch_at: new Date().toISOString() })
        .eq("lead_id", reminder.leadId)
        .eq("user_id", userId);
    } else {
      // Complete task
      await supabase
        .from("crm_tasks")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", reminder.id);
    }

    toast.success("Reminder completed");
    fetchReminders();
  };

  const getTypeIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">Urgent</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">Soon</Badge>;
      default:
        return null;
    }
  };

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return `${formatDistanceToNow(date)} ago`;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card className="border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_8px_30px_rgba(200,167,102,0.18)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-black">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
            <Bell className="h-4 w-4 text-black" />
          </div>
          Smart Reminders
          {reminders.filter(r => r.priority === 'high').length > 0 && (
            <Badge className="bg-red-500/20 text-red-600 border-red-500/30 ml-auto">
              {reminders.filter(r => r.priority === 'high').length} urgent
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-black text-center py-4">Loading reminders...</p>
        ) : reminders.length === 0 ? (
          <div className="text-center py-6">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-black">All caught up!</p>
            <p className="text-xs text-zinc-600 mt-1">No pending reminders or overdue tasks</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border-2 transition-colors",
                  reminder.priority === 'high' 
                    ? "border-red-300/50 bg-gradient-to-br from-red-50 to-red-100/50" 
                    : "border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] hover:shadow-md"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full shrink-0",
                  reminder.type === 'overdue' ? "bg-red-100" : "bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]"
                )}>
                  {getTypeIcon(reminder.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-black truncate">
                      {reminder.leadName}
                    </span>
                    {getPriorityBadge(reminder.priority)}
                  </div>
                  <p className="text-sm text-zinc-700 truncate">
                    {reminder.message}
                  </p>
                  <p className={cn(
                    "text-xs mt-1",
                    isPast(reminder.dueAt) && !isToday(reminder.dueAt)
                      ? "text-red-600 font-medium"
                      : "text-zinc-600"
                  )}>
                    {formatDueDate(reminder.dueAt)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => completeReminder(reminder)}
                  className="shrink-0 text-black hover:text-emerald-600 hover:bg-emerald-50"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartReminders;
