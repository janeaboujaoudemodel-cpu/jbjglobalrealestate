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
      data-surface="emerald"
      data-premium-navigator
      className="bg-[image:var(--jj-emerald-ombre)] backdrop-blur-sm border border-white/15 rounded-xl p-4 sticky top-20 z-10 shadow-[0_18px_40px_rgba(0,0,0,0.24)]"
    >
      <p className="text-white/90 text-xs uppercase tracking-wider mb-3 font-medium">Quick Navigation</p>
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
              activeSection === section.id
                ? "bg-white/12 text-white border border-white/15"
                : "bg-black/15 text-white hover:text-white hover:bg-white/10 border border-white/10"
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
