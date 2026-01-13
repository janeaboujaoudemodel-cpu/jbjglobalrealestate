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
    { id: "reports", label: "Reports", icon: BarChart3, path: "/jbj-broker-reports" },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="w-64 bg-black fixed h-screen flex flex-col border-r border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <h1 className="text-gold font-bold tracking-wide text-lg">
          JBJ GLOBAL
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">REAL ESTATE</p>
      </div>

      {/* Broker Profile */}
      {brokerProfile && (
        <div className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-gold/30">
              <AvatarImage src={brokerProfile.avatar_url || undefined} />
              <AvatarFallback className="bg-gold/20 text-gold">
                {brokerProfile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {brokerProfile.name}
              </p>
              <p className="text-gray-400 text-xs truncate">
                {brokerProfile.email}
              </p>
              <Badge
                variant="outline"
                className={`mt-1 text-xs ${
                  brokerProfile.status === "active"
                    ? "border-green-500 text-green-400"
                    : "border-amber-500 text-amber-400"
                }`}
              >
                {brokerProfile.status}
              </Badge>
            </div>
          </div>

          {/* Capacity Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Lead Capacity</span>
              <span>{brokerProfile.active_leads}/{brokerProfile.capacity}</span>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gold rounded-full transition-all"
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
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            onClick={() => navigate(item.path)}
            className={`w-full justify-start gap-3 ${
              activePage === item.id
                ? "bg-gold/20 text-gold hover:bg-gold/30"
                : "text-gray-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-zinc-800 space-y-1">
        <Button
          variant="ghost"
          onClick={() => navigate("/jbj-broker-admin")}
          className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-zinc-800"
        >
          <Settings className="h-5 w-5" />
          Admin Panel
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-zinc-800"
        >
          <Home className="h-5 w-5" />
          Back to Site
        </Button>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
