import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  Briefcase
} from "lucide-react";

export type UserRole = "broker" | "sales_agent" | "investor";

interface RoleSelectorProps {
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isLoading?: boolean;
}

const ROLES = [
  {
    id: "broker" as UserRole,
    title: "Real Estate Broker",
    description: "Licensed broker working with clients to buy, sell & rent properties",
    icon: Building2,
    benefits: [
      "Property presentation tools",
      "Client management features",
      "Commission tracking",
    ],
  },
  {
    id: "sales_agent" as UserRole,
    title: "Developer Sales Agent",
    description: "Sales professional working directly for property developers",
    icon: Briefcase,
    benefits: [
      "Developer project materials",
      "Off-plan sales training",
      "Inventory management",
    ],
  },
  {
    id: "investor" as UserRole,
    title: "Real Estate Investor",
    description: "Individual or institutional investor seeking market insights",
    icon: TrendingUp,
    benefits: [
      "Market analysis tools",
      "ROI calculators",
      "Portfolio tracking",
    ],
  },
];

export default function RoleSelector({ selectedRole, onRoleChange, isLoading = false }: RoleSelectorProps) {
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  const handleRoleClick = useCallback(async (roleId: UserRole) => {
    // Prevent double clicks
    if (isSelecting || isLoading) return;
    if (roleId === selectedRole) return;
    
    setIsSelecting(true);
    setPendingRole(roleId);
    
    try {
      // Call the parent handler
      await onRoleChange(roleId);
    } finally {
      // Small delay to show the selection was successful
      setTimeout(() => {
        setIsSelecting(false);
        setPendingRole(null);
      }, 300);
    }
  }, [isSelecting, isLoading, selectedRole, onRoleChange]);

  const isRoleActive = (roleId: UserRole) => {
    return pendingRole === roleId || (selectedRole === roleId && !pendingRole);
  };

  const isRoleLoading = (roleId: UserRole) => {
    return pendingRole === roleId && isSelecting;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">What best describes you?</h3>
        <p className="text-white/70 text-sm">Select your role to customize your experience</p>
      </div>
      
      <div className="grid gap-4">
        {ROLES.map((role) => (
          <motion.button
            key={role.id}
            whileHover={{ scale: isSelecting ? 1 : 1.02 }}
            whileTap={{ scale: isSelecting ? 1 : 0.98 }}
            onClick={() => handleRoleClick(role.id)}
            disabled={isSelecting || isLoading}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
              isRoleActive(role.id)
                ? "border-[#B89555] bg-[#EFE6D6]/10"
                : "border-[#1A1A1A] hover:border-[#1A1A1A] bg-[#FDFBF7]/50"
            } ${(isSelecting || isLoading) ? "cursor-wait" : "cursor-pointer"}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isRoleActive(role.id)
                  ? "bg-[#EFE6D6]/20"
                  : "bg-[#1A1A1A]"
              }`}>
                {isRoleLoading(role.id) ? (
                  <Loader2 className="w-6 h-6 text-[#1A1A1A] animate-spin" />
                ) : (
                  <role.icon className={`w-6 h-6 ${
                    isRoleActive(role.id) ? "text-[#1A1A1A]" : "text-white/70"
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{role.title}</span>
                  {isRoleActive(role.id) && !isRoleLoading(role.id) && (
                    <CheckCircle2 className="w-4 h-4 text-[#1A1A1A]" />
                  )}
                  {isRoleLoading(role.id) && (
                    <span className="text-xs text-[#1A1A1A]">Saving...</span>
                  )}
                </div>
                <p className="text-white/70 text-sm mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-2">
                  {role.benefits.map((benefit, i) => (
                    <Badge 
                      key={i}
                      variant="outline" 
                      className={`text-xs ${
                        isRoleActive(role.id)
                          ? "border-[#B89555]/50 text-[#1A1A1A]"
                          : "border-[#1A1A1A] text-white/90"
                      }`}
                    >
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
