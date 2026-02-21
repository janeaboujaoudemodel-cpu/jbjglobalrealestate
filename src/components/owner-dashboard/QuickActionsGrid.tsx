import { useNavigate } from "react-router-dom";
import { 
  UserPlus, 
  Calendar, 
  Map, 
  Bot, 
  Video, 
  Zap, 
  BarChart3, 
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "+ Add Lead", icon: UserPlus, path: "/crm?action=new-lead", color: "text-emerald-600" },
  { label: "Calendar", icon: Calendar, path: "/crm/calendar", color: "text-blue-600" },
  { label: "Property Map", icon: Map, path: "/map", color: "text-amber-600" },
  { label: "AI Assistant", icon: Bot, path: "/founder-assistant", color: "text-purple-600" },
  { label: "Studio", icon: Video, path: "/studio", color: "text-pink-600" },
  { label: "Automations", icon: Zap, path: "/automations", color: "text-yellow-600" },
  { label: "Analytics", icon: BarChart3, path: "/jbj-analytics", color: "text-cyan-600" },
  { label: "Marketing", icon: Megaphone, path: "/admin/marketing-hub", color: "text-rose-600" },
];

export default function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div className="bg-white/70 border-2 border-[#C9A84C]/30 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-black mb-4">Quick Actions</h3>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
              "bg-[#FDFBF7] border border-[#C9A84C]/20",
              "hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/10 hover:-translate-y-0.5",
              "transition-all duration-200 cursor-pointer group"
            )}
          >
            <action.icon className={cn("h-6 w-6", action.color, "group-hover:text-[#C9A84C] transition-colors")} />
            <span className="text-xs text-zinc-600 group-hover:text-black transition-colors text-center whitespace-nowrap">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
