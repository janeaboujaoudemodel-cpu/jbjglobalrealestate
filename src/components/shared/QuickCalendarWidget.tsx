import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface QuickCalendarWidgetProps {
  prefillTitle?: string;
  prefillDate?: string;
  source?: "email" | "chat";
  compact?: boolean;
}

export default function QuickCalendarWidget({
  prefillTitle = "",
  prefillDate,
  source = "email",
  compact = false,
}: QuickCalendarWidgetProps) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(prefillTitle);
  const [date, setDate] = useState(prefillDate || new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("10:00");

  const today = new Date();
  const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const handleQuickAdd = () => {
    if (!title.trim()) {
      toast.error("Please enter an event title");
      return;
    }
    navigate(`/ai-calendar?title=${encodeURIComponent(title)}&date=${date}&time=${time}`);
    toast.success("Opening calendar with event details");
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] border border-[#C9A84C]/20 text-black/60 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C]"
          onClick={() => {
            if (prefillTitle) {
              navigate(`/ai-calendar?title=${encodeURIComponent(prefillTitle)}&date=${date}`);
            } else {
              navigate("/ai-calendar");
            }
          }}
        >
          <Calendar className="w-3 h-3 mr-1" /> Add to Calendar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#C9A84C]" />
          <div>
            <p className="text-xs font-semibold text-black">{dayName}</p>
            <p className="text-[10px] text-black/50">{dateStr}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-[#C9A84C] hover:bg-[#C9A84C]/10"
          onClick={() => navigate("/ai-calendar")}
        >
          <ExternalLink className="w-3 h-3 mr-1" /> Open
        </Button>
      </div>

      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[10px] border-[#C9A84C]/20 text-black/60 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-3 h-3 mr-1" /> Quick Event
        </Button>
      ) : (
        <div className="space-y-1.5 bg-white/70 rounded-lg border border-[#C9A84C]/15 p-2">
          <Input
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 text-xs bg-transparent border-[#C9A84C]/15"
          />
          <div className="flex gap-1.5">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 text-xs bg-transparent border-[#C9A84C]/15 flex-1"
            />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-7 text-xs bg-transparent border-[#C9A84C]/15 w-24"
            />
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-6 text-[10px] flex-1 bg-gradient-to-r from-[#C9A84C] to-[#B8973F] text-white"
              onClick={handleQuickAdd}
            >
              <Clock className="w-3 h-3 mr-1" /> Add Event
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-black/40"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
