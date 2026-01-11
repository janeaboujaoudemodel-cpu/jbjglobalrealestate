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
  { id: "tools", label: "Tools", icon: Wrench, color: "from-purple-500 to-purple-600" },
  { id: "education", label: "Education", icon: GraduationCap, color: "from-blue-500 to-blue-600" },
  { id: "support", label: "Support Team", icon: Users, color: "from-pink-500 to-pink-600" },
  { id: "crm", label: "CRM & Leads", icon: Target, color: "from-green-500 to-green-600" },
  { id: "growth", label: "Growth & Rewards", icon: TrendingUp, color: "from-gold to-gold-dark" },
];

export function BrokerToolkitNavigation({ activeSection, onSectionChange }: BrokerToolkitNavigationProps) {
  return (
    <section id="what-you-get" className="py-8 sticky top-16 z-40 bg-[hsl(var(--premium-bg))]/95 backdrop-blur-lg border-b border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                onSectionChange(section.id);
                document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                  : "bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              <section.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
