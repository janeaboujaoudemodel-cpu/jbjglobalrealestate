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
  FileSignature,
  Bell,
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
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Add Lead", description: "Create a new CRM lead", icon: UserPlus, path: "/owner/crm?action=new-lead" },
  { label: "Calendar", description: "View appointments & schedule", icon: Calendar, path: "/owner/crm/calendar" },
  { label: "Property Map", description: "Interactive UAE property map", icon: Map, path: "/owner/map" },
  { label: "AI Assistant", description: "Founder AI assistant", icon: Bot, path: "/owner/founder-assistant" },
  { label: "Studio", description: "Media & content studio", icon: Video, path: "/owner/studio" },
  { label: "Automations", description: "CRM automation rules", icon: Zap, path: "/owner/automations" },
  { label: "Analytics", description: "Business analytics dashboard", icon: BarChart3, path: "/owner/analytics" },
  { label: "Marketing", description: "Marketing hub & campaigns", icon: Megaphone, path: "/owner/marketing-hub" },
  
  { label: "Employee Hub", description: "Team & HR management", icon: Building2, path: "/employee-hub" },
  { label: "Leads Inbox", description: "All CRM leads inbox", icon: FileText, path: "/owner/crm/leads" },
  { label: "CRM Chat", description: "Client communications", icon: MessageSquare, path: "/owner/crm" },
  { label: "Contract Vault", description: "Developer agreements & AI contract upload", icon: FileSignature, path: "/owner/contracts" },
  { label: "Agency Activity", description: "Reminders, calls & notes logged on UAE agencies", icon: Bell, path: "/owner/crm/relationships/activity" },
  { label: "Brokers Registry", description: "Every broker & company they work for", icon: Users, path: "/owner/crm/brokers" },
];

export default function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div data-surface="champagne" className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Quick Actions</h3>
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Tooltip key={action.path}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(action.path)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-xl min-w-0",
                    "bg-[#FDFBF7]/70 border border-[#B89555]/20",
                    "hover:border-[#B89555]/50 hover:bg-[#B89555]/10 hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#B89555]/10",
                    "transition-all duration-200 cursor-pointer group active:scale-95"
                  )}
                >
                  <div data-backend-icon-tile="emerald-soft" className="w-10 h-10 rounded-lg bg-[#064E3B]/10 border border-[#064E3B]/15 flex items-center justify-center group-hover:bg-[#064E3B]/15 group-hover:border-[#064E3B]/35 transition-colors">
                    <action.icon className={cn("h-5 w-5 flex-shrink-0 text-[#064E3B] group-hover:text-[#042C1C] transition-colors")} strokeWidth={2.15} />
                  </div>
                  <span className="text-xs text-[#1A1A1A]/80 group-hover:text-[#1A1A1A] transition-colors text-center font-medium leading-tight">
                    {action.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-[#1A1A1A] text-xs border border-[#B89555]/40 [&_*]:!text-[#FDFBF7] !text-[#FDFBF7]"
              >
                {action.description}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
