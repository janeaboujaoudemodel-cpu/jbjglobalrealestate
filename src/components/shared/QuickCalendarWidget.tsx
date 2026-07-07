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
      <div className="flex items-center gap-1" data-chat-compact-action>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Add to calendar"
          title="Add to calendar"
          className="h-8 w-8 min-w-8 rounded-lg border border-[#B89555]/25 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6]/40"
          onClick={() => {
            if (prefillTitle) {
              navigate(`/ai-calendar?title=${encodeURIComponent(prefillTitle)}&date=${date}`);
            } else {
              navigate("/ai-calendar");
            }
          }}
        >
          <Calendar className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#B89555]" />
          <div>
            <p className="text-xs font-semibold text-[#1A1A1A]">{dayName}</p>
            <p className="text-[10px] text-[#1A1A1A]/50">{dateStr}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-[#B89555] hover:bg-[#B89555]/10"
          onClick={() => navigate("/ai-calendar")}
        >
          <ExternalLink className="w-3 h-3 mr-1" /> Open
        </Button>
      </div>

      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[10px] border-[#B89555]/20 text-[#1A1A1A]/60 hover:border-[#B89555]/40 hover:text-[#B89555]"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-3 h-3 mr-1" /> Quick Event
        </Button>
      ) : (
        <div className="space-y-1.5 bg-[#FDFBF7]/70 rounded-lg border border-[#B89555]/15 p-2">
          <Input
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-7 text-xs bg-transparent border-[#B89555]/15"
          />
          <div className="flex gap-1.5">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-7 text-xs bg-transparent border-[#B89555]/15 flex-1"
            />
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-7 text-xs bg-transparent border-[#B89555]/15 w-24"
            />
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              className="h-6 text-[10px] flex-1 bg-gradient-to-r from-[#B89555] to-[#A68444] text-white"
              onClick={handleQuickAdd}
            >
              <Clock className="w-3 h-3 mr-1" /> Add Event
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] text-[#1A1A1A]/40"
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
