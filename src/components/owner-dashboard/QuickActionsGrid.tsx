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
  Users,
  Building2,
  FileText,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Lead", description: "Create a new CRM lead", icon: UserPlus, path: "/owner/crm?action=new-lead", color: "text-emerald-600" },
  { label: "Calendar", description: "View appointments & schedule", icon: Calendar, path: "/owner/crm/calendar", color: "text-blue-600" },
  { label: "Property Map", description: "Interactive UAE property map", icon: Map, path: "/owner/map", color: "text-amber-600" },
  { label: "AI Assistant", description: "Founder AI assistant", icon: Bot, path: "/owner/founder-assistant", color: "text-purple-600" },
  { label: "Studio", description: "Media & content studio", icon: Video, path: "/owner/studio", color: "text-pink-600" },
  { label: "Automations", description: "CRM automation rules", icon: Zap, path: "/owner/automations", color: "text-yellow-600" },
  { label: "Analytics", description: "Business analytics dashboard", icon: BarChart3, path: "/owner/analytics", color: "text-cyan-600" },
  { label: "Marketing", description: "Marketing hub & campaigns", icon: Megaphone, path: "/owner/marketing-hub", color: "text-rose-600" },
  { label: "Brokers", description: "Broker management", icon: Users, path: "/brokers", color: "text-indigo-600" },
  { label: "Employee Hub", description: "Team & HR management", icon: Building2, path: "/employee-hub", color: "text-teal-600" },
  { label: "Leads Inbox", description: "All CRM leads inbox", icon: FileText, path: "/owner/crm/leads", color: "text-orange-600" },
  { label: "CRM Chat", description: "Client communications", icon: MessageSquare, path: "/owner/crm", color: "text-violet-600" },
];

export default function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[#C9A84C]/30 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-black mb-4">Quick Actions</h3>
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Tooltip key={action.path}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(action.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl min-w-0",
                    "bg-white/70 border border-[#C9A84C]/20",
                    "hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/10 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#C9A84C]/10",
                    "transition-all duration-200 cursor-pointer group active:scale-95"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center group-hover:bg-[#C9A84C]/20 transition-colors">
                    <action.icon className={cn("h-5 w-5 flex-shrink-0", action.color, "group-hover:text-[#C9A84C] transition-colors")} />
                  </div>
                  <span className="text-xs text-black/80 group-hover:text-black transition-colors text-center font-medium leading-tight">
                    {action.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black text-white text-xs border-none">
                {action.description}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
