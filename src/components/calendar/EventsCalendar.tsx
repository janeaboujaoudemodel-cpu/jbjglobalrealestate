import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Building2 } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from "date-fns";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: "briefing" | "launch" | "event" | "visit";
  location?: string;
  developer?: string;
}

interface EventsCalendarProps {
  events?: CalendarEvent[];
}

export function EventsCalendar({ events = [] }: EventsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day offset (0 = Sunday)
  const startDayOffset = monthStart.getDay();
  const prefixDays = Array(startDayOffset).fill(null);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), date));
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const getEventTypeColor = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "launch":
        return "bg-amber-500";
      case "briefing":
        return "bg-blue-500";
      case "event":
        return "bg-purple-500";
      case "visit":
        return "bg-emerald-500";
      default:
        return "bg-primary";
    }
  };

  const getEventTypeBadge = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "launch":
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30 text-xs">Launch</Badge>;
      case "briefing":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Briefing</Badge>;
      case "event":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">Event</Badge>;
      case "visit":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Visit</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Calendar className="h-4 w-4 text-primary" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {prefixDays.map((_, i) => (
            <div key={`prefix-${i}`} className="h-8" />
          ))}
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const hasEvents = dayEvents.length > 0;
            const isSelected = selectedDate && isSameDay(day, selectedDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`h-9 rounded-md text-sm relative transition-colors border ${
                  isToday(day)
                    ? "bg-[#1A1A1A] text-[#FDFBF7] font-semibold border-[#1A1A1A]"
                    : isSelected
                    ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
                    : hasEvents
                    ? "bg-[#EFE6D6]/70 text-[#1A1A1A] border-[#B89555]/50 font-semibold hover:bg-[#EFE6D6]"
                    : "border-transparent text-[#1A1A1A] hover:bg-[#F7F2EA]"
                } ${!isSameMonth(day, currentMonth) ? "opacity-40" : ""}`}
              >
                {format(day, "d")}
                {hasEvents && (
                  <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className={`h-1 w-1 rounded-full ${getEventTypeColor(event.type)}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected date events — only after the user clicks a day */}
        {selectedDate && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-foreground">
                {format(selectedDate, "EEEE, MMMM d")}
              </h4>
              <Button variant="ghost" size="icon" className="h-6 w-6"
                      onClick={() => setSelectedDate(null)}>
                <span className="sr-only">Close</span>×
              </Button>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events scheduled</p>
            ) : (
              <ScrollArea className="h-[120px]">
                <div className="space-y-2 pr-4">
                  {selectedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-2 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {event.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {event.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {event.time}
                              </span>
                            )}
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                            {event.developer && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {event.developer}
                              </span>
                            )}
                          </div>
                        </div>
                        {getEventTypeBadge(event.type)}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
