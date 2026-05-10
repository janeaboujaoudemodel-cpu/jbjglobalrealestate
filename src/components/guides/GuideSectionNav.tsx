import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: LucideIcon;
}

interface GuideSectionNavProps {
  sections: Section[];
  activeSection?: string;
}

export const GuideSectionNav = ({ sections, activeSection }: GuideSectionNavProps) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FDFBF7]/80 backdrop-blur-sm border border-[#1A1A1A] rounded-xl p-4 sticky top-20 z-10"
    >
      <p className="text-white/90 text-xs uppercase tracking-wider mb-3 font-medium">Quick Navigation</p>
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              activeSection === section.id
                ? "bg-[#EFE6D6]/20 text-[#1A1A1A] border border-[#B89555]/30"
                : "bg-[#1A1A1A]/50 text-white/70 hover:text-white hover:bg-[#1A1A1A] border border-transparent"
            }`}
          >
            <section.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{section.title}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default GuideSectionNav;
