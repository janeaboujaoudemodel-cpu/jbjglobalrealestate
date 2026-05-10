import { motion } from "framer-motion";
import { 
  Wrench, 
  GraduationCap, 
  Users, 
  Target,
  TrendingUp,
  ChevronRight
} from "lucide-react";

interface BrokerToolkitNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const SECTIONS = [
  { id: "tools", label: "Tools", icon: Wrench, activeColor: "from-purple-500 to-purple-600", activeBg: "bg-gradient-to-r from-purple-500 to-purple-600" },
  { id: "education", label: "Education", icon: GraduationCap, activeColor: "from-blue-500 to-blue-600", activeBg: "bg-gradient-to-r from-blue-500 to-blue-600" },
  { id: "support", label: "Support Team", icon: Users, activeColor: "from-pink-500 to-pink-600", activeBg: "bg-gradient-to-r from-pink-500 to-pink-600" },
  { id: "crm", label: "CRM & Leads", icon: Target, activeColor: "from-emerald-600 to-emerald-700", activeBg: "bg-gradient-to-r from-emerald-600 to-emerald-700" },
  { id: "growth", label: "Growth & Rewards", icon: TrendingUp, activeColor: "from-[#F7F1E6] to-[#ECE2D2]", activeBg: "bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]" },
];

export function BrokerToolkitNavigation({ activeSection, onSectionChange }: BrokerToolkitNavigationProps) {
  return (
    <section id="what-you-get" className="py-8 sticky top-16 z-40 bg-[#1A1A1A]/95 backdrop-blur-lg relative transform-gpu">
      {/* Bottom gold glow divider */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)',
          boxShadow: '0 0 20px rgba(212,175,55,0.4), 0 0 40px rgba(212,175,55,0.2)',
        }}
      />
      
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id;
            const isGrowth = section.id === "growth";
            
            return (
              <button
                key={section.id}
                onClick={() => {
                  onSectionChange(section.id);
                  document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? isGrowth
                      ? "bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] shadow-lg border border-[#B89555]/50"
                      : `${section.activeBg} text-white shadow-lg`
                    : "bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#1A1A1A] text-[#1A1A1A] hover:border-[#B89555]"
                }`}
              >
                <section.icon className={`w-4 h-4 ${isActive && isGrowth ? "text-[#1A1A1A]" : isActive ? "" : "text-[#1A1A1A]"}`} />
                <span className={`text-sm font-medium ${isActive && isGrowth ? "text-[#1A1A1A]" : ""}`}>{section.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
