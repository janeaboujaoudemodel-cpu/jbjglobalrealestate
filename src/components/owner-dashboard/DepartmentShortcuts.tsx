import { useNavigate } from "react-router-dom";
import { 
  Users, 
  ClipboardList, 
  ShieldAlert,
  ChevronRight,
  Building,
  Network,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentCard {
  label: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const DEPARTMENTS: DepartmentCard[] = [
  { 
    label: "Admin Panel", 
    description: "HR, IT, Support, All Departments", 
    icon: ShieldAlert, 
    path: "/owner/admin", 
  },
  { 
    label: "CRM Dashboard", 
    description: "Manage leads & deals", 
    icon: Users, 
    path: "/owner/crm", 
  },
  { 
    label: "Relationship Hub", 
    description: "Investors, developers, brokers & agencies", 
    icon: Network, 
    path: "/owner/crm/relationship-hub", 
  },
  { 
    label: "Listing Admin", 
    description: "Property listings management", 
    icon: ClipboardList, 
    path: "/owner/listing-admin", 
  },
  { 
    label: "Developer Hub", 
    description: "Developer portal & change requests", 
    icon: Building, 
    path: "/developer-portal", 
  },
  { 
    label: "Security Console", 
    description: "Access & audit controls", 
    icon: ShieldAlert, 
    path: "/owner/safety", 
  },
];

export default function DepartmentShortcuts() {
  const navigate = useNavigate();

  return (
    <div data-surface="champagne" className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/30 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">Departments & Admin</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {DEPARTMENTS.map((dept) => (
          <button
            key={dept.path}
            onClick={() => navigate(dept.path)}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl text-left",
              "bg-[#FDFBF7] border border-[#B89555]/20",
              "hover:border-[#B89555]/50 hover:bg-[#B89555]/10 hover:shadow-md hover:shadow-[#B89555]/10",
              "transition-all duration-200 cursor-pointer group"
            )}
          >
            <div data-backend-icon-tile="emerald" className={cn(
              "allow-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              "transition-colors"
            )}>
              <dept.icon className="allow-white h-5 w-5 text-white" strokeWidth={2.1} style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#B89555] transition-colors">
                {dept.label}
              </p>
              <p className="text-xs text-[#1A1A1A]/70 leading-snug">
                {dept.description}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#1A1A1A]/70 group-hover:text-[#B89555] transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
