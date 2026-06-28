import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  Home,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface JBJSidebarProps {
  brokerProfile: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    specialization?: string;
    status: string;
    capacity: number;
    active_leads: number;
  } | null;
  activePage: "leads" | "messages" | "reports" | "settings";
}

export function JBJSidebar({ brokerProfile, activePage }: JBJSidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const navItems = [
    { id: "leads", label: "My Leads", icon: Users, path: "/jbj-broker-dashboard" },
    { id: "messages", label: "Messages", icon: MessageSquare, path: "/jbj-broker-messages" },
    { id: "listings", label: "Listing Portal", icon: Upload, path: "/listing-portal" },
    { id: "reports", label: "Reports", icon: BarChart3, path: "/jbj-broker-reports" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside data-backend-sidebar="legacy-broker" className="w-64 bg-gradient-to-b from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] fixed h-screen flex flex-col border-r border-[#B89555]/30">
      {/* Header - Company Name on ONE LINE */}
      <div className="p-4 border-b border-[#B89555]/30">
        <h1 className="text-[#1A1A1A] font-bold tracking-wide text-lg">
          JBJ Global Real Estate
        </h1>
      </div>

      {/* Broker Profile */}
      {brokerProfile && (
        <div className="p-4 border-b border-[#B89555]/30">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-[#B89555]/40">
              <AvatarImage src={brokerProfile.avatar_url || undefined} />
              <AvatarFallback className="bg-[#EFE6D6]/20 text-[#1A1A1A] font-bold">
                {brokerProfile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-[#1A1A1A] font-medium whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15]">
                {brokerProfile.name}
              </p>
              <p className="text-[#1A1A1A]/60 text-xs whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15]">
                {brokerProfile.email}
              </p>
              <Badge
                variant="outline"
                className={`mt-1 text-xs ${
 brokerProfile.status === "active"
 ? "border-[color:var(--emerald-1)]/30 text-[color:var(--emerald-1)] jj-emerald-soft"
 : "border-amber-500 text-amber-700 bg-amber-50"
 }`}
              >
                {brokerProfile.status}
              </Badge>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[#1A1A1A]/60 mb-1">
              <span>Lead Capacity</span>
              <span>{brokerProfile.active_leads}/{brokerProfile.capacity}</span>
            </div>
            <div className="h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#EFE6D6] rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (brokerProfile.active_leads / brokerProfile.capacity) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => navigate(item.path)}
            className={`w-full justify-start gap-3 ${
 activePage === item.id
 ? "bg-[#EFE6D6]/20 text-[#1A1A1A] hover:bg-[#EFE6D6]/30"
 : "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
 }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15] text-left">{item.label}</span>
          </Button>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#B89555]/30 space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate("/jbj-broker-admin")}
          className="w-full justify-start gap-3 text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15] text-left">Owner Panel</span>
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="w-full justify-start gap-3 text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
        >
          <Home className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15] text-left">Back to Site</span>
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-[1.15] text-left">Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
