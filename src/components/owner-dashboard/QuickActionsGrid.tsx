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
  Building2,
  Mail,
  Kanban,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "+ Add Lead", icon: UserPlus, path: "/crm?action=new-lead", color: "text-emerald-400" },
  { label: "Calendar", icon: Calendar, path: "/crm/calendar", color: "text-blue-400" },
  { label: "Property Map", icon: Map, path: "/map", color: "text-amber-400" },
  { label: "AI Assistant", icon: Bot, path: "/founder-assistant", color: "text-purple-400" },
  { label: "Studio", icon: Video, path: "/studio", color: "text-pink-400" },
  { label: "Automations", icon: Zap, path: "/automations", color: "text-yellow-400" },
  { label: "Analytics", icon: BarChart3, path: "/jbj-analytics", color: "text-cyan-400" },
  { label: "Marketing", icon: Megaphone, path: "/admin/marketing-hub", color: "text-rose-400" },
];

export default function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
              "bg-zinc-800/50 border border-zinc-700",
              "hover:border-gold/50 hover:bg-gold/5 hover:-translate-y-0.5",
              "transition-all duration-200 cursor-pointer group"
            )}
          >
            <action.icon className={cn("h-6 w-6", action.color, "group-hover:text-gold transition-colors")} />
            <span className="text-xs text-zinc-400 group-hover:text-white transition-colors text-center whitespace-nowrap">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
