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
  Calendar as CalendarIcon, Plus, ArrowLeft, Clock, 
  Video, Phone, MapPin, Users
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time: string;
  type: 'viewing' | 'call' | 'meeting' | 'followup';
  leadName?: string;
}

const CRMCalendar = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    fetchEvents();
  }, [authLoading, user, navigate, currentMonth]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      // Fetch calls and activities as events
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data: calls } = await supabase
        .from("crm_calls")
        .select("id, started_at, notes, lead_id")
        .eq("user_id", user.id)
        .gte("started_at", monthStart.toISOString())
        .lte("started_at", monthEnd.toISOString());

      const calendarEvents: CalendarEvent[] = [];

      (calls || []).forEach(call => {
        calendarEvents.push({
          id: call.id,
          title: call.notes || 'Call',
          date: new Date(call.started_at),
          time: format(new Date(call.started_at), 'HH:mm'),
          type: 'call',
        });
      });

      setEvents(calendarEvents);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'viewing': return MapPin;
      case 'call': return Phone;
      case 'meeting': return Video;
      default: return Clock;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'viewing': return 'bg-purple-500';
      case 'call': return 'bg-green-500';
      case 'meeting': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  const todayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 lg:top-[48px] z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/crm">
              <Button variant="ghost" size="sm" className="text-zinc-600 hover:text-zinc-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <CalendarIcon className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-900">Calendar</h1>
                <p className="text-xs text-zinc-500">{events.length} events this month</p>
              </div>
            </div>
          </div>
          <Button variant="primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-2 border-zinc-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-zinc-900">
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-zinc-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24" />
                ))}
                
                {daysInMonth.map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`h-24 p-1 rounded-lg border transition-all text-left ${
                        isToday(day) 
                          ? 'border-gold bg-gold/5' 
                          : isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-transparent hover:bg-zinc-50'
                      }`}
                    >
                      <span className={`text-sm font-medium ${
                        isToday(day) ? 'text-gold' : 'text-zinc-900'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map(event => (
                          <div 
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded truncate text-white ${getEventColor(event.type)}`}
                          >
                            {event.time} {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-xs text-zinc-500">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar - Selected Day Events */}
          <Card className="border-zinc-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-zinc-900">
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a day'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-10 w-10 mx-auto mb-3 text-zinc-300" />
                  <p className="text-sm text-zinc-500">No events scheduled</p>
                </div>
              ) : (
                todayEvents.map(event => {
                  const Icon = getEventIcon(event.type);
                  return (
                    <div key={event.id} className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getEventColor(event.type)}/20`}>
                          <Icon className={`h-4 w-4 ${getEventColor(event.type).replace('bg-', 'text-')}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 truncate">{event.title}</p>
                          <p className="text-xs text-zinc-500">{event.time}</p>
                          {event.leadName && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {event.leadName}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CRMCalendar;
