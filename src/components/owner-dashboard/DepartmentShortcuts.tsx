import { useNavigate } from "react-router-dom";
import { 
  Users, 
  ClipboardList, 
  ShieldAlert,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentCard {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
  color: string;
}

const DEPARTMENTS: DepartmentCard[] = [
  { 
    label: "Admin Panel", 
    description: "HR, IT, Support, All Departments", 
    icon: ShieldAlert, 
    path: "/admin", 
    color: "text-[#C9A84C]" 
  },
  { 
    label: "CRM Dashboard", 
    description: "Manage leads & deals", 
    icon: Users, 
    path: "/crm", 
    color: "text-emerald-600" 
  },
  { 
    label: "Listing Admin", 
    description: "Property listings", 
    icon: ClipboardList, 
    path: "/listing-admin", 
    color: "text-amber-600" 
  },
  { 
    label: "Security Console", 
    description: "Access & audit", 
    icon: ShieldAlert, 
    path: "/owner/safety", 
    color: "text-red-600" 
  },
];

export default function DepartmentShortcuts() {
  const navigate = useNavigate();

  return (
    <div className="bg-white/70 border-2 border-[#C9A84C]/30 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-black mb-4">Departments & Admin</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.path}
            onClick={() => navigate(dept.path)}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-left",
              "bg-[#FDFBF7] border border-[#C9A84C]/20",
              "hover:border-[#C9A84C]/50 hover:bg-[#C9A84C]/10",
              "transition-all duration-200 cursor-pointer group"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center",
              "group-hover:bg-[#C9A84C]/20 transition-colors"
            )}>
              <dept.icon className={cn("h-5 w-5", dept.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black group-hover:text-[#C9A84C] transition-colors truncate">
                {dept.label}
              </p>
              <p className="text-xs text-zinc-600 truncate">
                {dept.description}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:text-[#C9A84C] transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
