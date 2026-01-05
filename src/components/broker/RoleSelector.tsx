import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
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
}

const ROLES = [
  {
    id: "broker" as UserRole,
    title: "Real Estate Broker",
    description: "Licensed broker working with clients to buy/sell properties",
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

export default function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">What best describes you?</h3>
        <p className="text-zinc-400 text-sm">Select your role to customize your experience</p>
      </div>
      
      <div className="grid gap-4">
        {ROLES.map((role) => (
          <motion.button
            key={role.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRoleChange(role.id)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
              selectedRole === role.id
                ? "border-gold bg-gold/10"
                : "border-zinc-700 hover:border-zinc-600 bg-zinc-900/50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedRole === role.id
                  ? "bg-gold/20"
                  : "bg-zinc-800"
              }`}>
                <role.icon className={`w-6 h-6 ${
                  selectedRole === role.id ? "text-gold" : "text-zinc-400"
                }`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">{role.title}</span>
                  {selectedRole === role.id && (
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                  )}
                </div>
                <p className="text-zinc-400 text-sm mb-3">{role.description}</p>
                <div className="flex flex-wrap gap-2">
                  {role.benefits.map((benefit, i) => (
                    <Badge 
                      key={i}
                      variant="outline" 
                      className={`text-xs ${
                        selectedRole === role.id
                          ? "border-gold/50 text-gold"
                          : "border-zinc-700 text-zinc-500"
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
