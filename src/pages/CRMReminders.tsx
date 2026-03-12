import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Bell, Plus, ArrowLeft, Clock, CheckCircle, 
  AlertTriangle, Calendar, X
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  is_completed: boolean;
  priority: 'low' | 'medium' | 'high';
  lead_id?: string;
  lead_name?: string;
}

const CRMReminders = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    loadReminders();
  }, [authLoading, user, navigate]);

  const loadReminders = () => {
    // Load from localStorage for demo - in production, use Supabase
    const savedReminders = localStorage.getItem(`crm_reminders_${user?.id}`);
    if (savedReminders) {
      try {
        setReminders(JSON.parse(savedReminders));
      } catch (e) {
        console.error('Failed to parse reminders');
      }
    } else {
      // Default demo reminders
      const demoReminders: Reminder[] = [
        {
          id: 'r1',
          title: 'Follow up with John Smith',
          description: 'Discuss property viewing options',
          due_date: addDays(new Date(), -1).toISOString(),
          is_completed: false,
          priority: 'high',
          lead_name: 'John Smith'
        },
        {
          id: 'r2',
          title: 'Send property brochure',
          description: 'Palm Jumeirah properties catalog',
          due_date: new Date().toISOString(),
          is_completed: false,
          priority: 'medium',
          lead_name: 'Sarah Johnson'
        },
        {
          id: 'r3',
          title: 'Schedule viewing',
          description: 'Downtown Dubai apartment',
          due_date: addDays(new Date(), 2).toISOString(),
          is_completed: false,
          priority: 'low',
        },
      ];
      setReminders(demoReminders);
      localStorage.setItem(`crm_reminders_${user?.id}`, JSON.stringify(demoReminders));
    }
    setLoading(false);
  };

  const toggleComplete = (reminderId: string) => {
    const updated = reminders.map(r => 
      r.id === reminderId ? { ...r, is_completed: !r.is_completed } : r
    );
    setReminders(updated);
    localStorage.setItem(`crm_reminders_${user?.id}`, JSON.stringify(updated));
    
    const reminder = updated.find(r => r.id === reminderId);
    toast.success(reminder?.is_completed ? 'Reminder completed' : 'Reminder reopened');
  };

  const deleteReminder = (reminderId: string) => {
    const updated = reminders.filter(r => r.id !== reminderId);
    setReminders(updated);
    localStorage.setItem(`crm_reminders_${user?.id}`, JSON.stringify(updated));
    toast.success('Reminder deleted');
  };

  const getFilteredReminders = () => {
    let filtered = reminders.filter(r => !r.is_completed);
    
    switch (filter) {
      case 'overdue':
        return filtered.filter(r => isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date)));
      case 'today':
        return filtered.filter(r => isToday(new Date(r.due_date)));
      case 'upcoming':
        return filtered.filter(r => !isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date)));
      default:
        return filtered;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      case 'low': return 'bg-green-500/20 text-green-600 border-green-500/30';
      default: return 'bg-zinc-500/20 text-zinc-600';
    }
  };

  const getDueLabel = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return { label: 'Overdue', color: 'text-red-600' };
    }
    if (isToday(date)) {
      return { label: 'Today', color: 'text-amber-600' };
    }
    if (isTomorrow(date)) {
      return { label: 'Tomorrow', color: 'text-blue-600' };
    }
    return { label: format(date, 'MMM d'), color: 'text-zinc-600' };
  };

  const filteredReminders = getFilteredReminders();
  const overdueCount = reminders.filter(r => !r.is_completed && isPast(new Date(r.due_date)) && !isToday(new Date(r.due_date))).length;
  const todayCount = reminders.filter(r => !r.is_completed && isToday(new Date(r.due_date))).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 lg:top-[48px] z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/20">
                <Bell className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Smart Reminders</h1>
                <p className="text-xs text-zinc-500">
                  {overdueCount > 0 && <span className="text-red-600">{overdueCount} overdue</span>}
                  {overdueCount > 0 && todayCount > 0 && ' • '}
                  {todayCount > 0 && <span className="text-amber-600">{todayCount} due today</span>}
                  {overdueCount === 0 && todayCount === 0 && 'All caught up!'}
                </p>
              </div>
            </div>
          </div>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'overdue', label: 'Overdue', count: overdueCount },
            { key: 'today', label: 'Today', count: todayCount },
            { key: 'upcoming', label: 'Upcoming' },
          ].map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? "primary" : "secondary"}
              size="sm"
              onClick={() => setFilter(f.key as typeof filter)}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <Badge variant="secondary" className="ml-2 bg-white/20">
                  {f.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Reminders List */}
        <div className="space-y-3">
          {filteredReminders.length === 0 ? (
            <Card className="border-zinc-200 bg-white">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                <p className="text-zinc-600 font-medium">All Caught Up!</p>
                <p className="text-sm text-zinc-400 mt-1">
                  {filter === 'all' 
                    ? "No pending reminders" 
                    : `No ${filter} reminders`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReminders.map(reminder => {
              const dueInfo = getDueLabel(reminder.due_date);
              return (
                <Card 
                  key={reminder.id}
                  className={`border-zinc-200 bg-white transition-all ${
                    dueInfo.label === 'Overdue' ? 'border-l-4 border-l-red-500' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleComplete(reminder.id)}
                          className="mt-0.5 p-1 rounded-full hover:bg-zinc-100 transition-colors"
                        >
                          {reminder.is_completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : dueInfo.label === 'Overdue' ? (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-zinc-400" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-medium text-zinc-900">{reminder.title}</h3>
                          {reminder.description && (
                            <p className="text-sm text-zinc-500 mt-0.5">{reminder.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs font-medium ${dueInfo.color}`}>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {dueInfo.label}
                            </span>
                            {reminder.lead_name && (
                              <Badge variant="outline" className="text-xs">
                                {reminder.lead_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getPriorityColor(reminder.priority)}>
                          {reminder.priority}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteReminder(reminder.id)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Completed Section */}
        {reminders.some(r => r.is_completed) && (
          <div className="pt-4">
            <h3 className="text-sm font-semibold text-zinc-500 mb-3">Completed</h3>
            <div className="space-y-2">
              {reminders.filter(r => r.is_completed).map(reminder => (
                <Card key={reminder.id} className="border-zinc-200 bg-zinc-50 opacity-60">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleComplete(reminder.id)}>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        </button>
                        <span className="text-sm text-zinc-500 line-through">{reminder.title}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteReminder(reminder.id)}
                        className="h-6 w-6 p-0 text-zinc-400 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CRMReminders;
