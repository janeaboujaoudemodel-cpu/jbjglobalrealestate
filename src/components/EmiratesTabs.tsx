import { useMemo } from "react";
import type { Project } from "@/hooks/useProjects";

interface EmiratesTabsProps {
  projects: Project[] | undefined;
  selectedEmirate: string | null;
  onEmirateSelect: (emirate: string | null) => void;
}

const ALL_EMIRATES = [
  "Dubai",
  "Abu Dhabi", 
  "Sharjah",
  "Ras Al Khaimah",
  "Ajman",
  "Fujairah",
  "Umm Al Quwain",
  // International priority countries
  "Cyprus",
  "Indonesia",
  "Oman",
  "Thailand",
];

const EmiratesTabs = ({ projects, selectedEmirate, onEmirateSelect }: EmiratesTabsProps) => {
  // Get emirates where this developer has projects
  const activeEmirates = useMemo(() => {
    if (!projects?.length) return [];
    
    const emiratesWithProjects = new Set<string>();
    projects.forEach((project) => {
      if (project.emirate) {
        emiratesWithProjects.add(project.emirate);
      }
    });
    
    return ALL_EMIRATES.filter((emirate) => emiratesWithProjects.has(emirate));
  }, [projects]);

  if (activeEmirates.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <p className="text-foreground/60 text-sm mb-3 uppercase tracking-wider font-medium">
        Active in
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onEmirateSelect(null)}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
            selectedEmirate === null
              ? "bg-gold/10 text-gold border-gold shadow-[0_4px_12px_rgba(200,167,102,0.15)]"
              : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-foreground border-gold/40 hover:border-gold hover:shadow-[0_4px_12px_rgba(200,167,102,0.25)]"
          }`}
        >
          All Locations
        </button>
        {activeEmirates.map((emirate) => {
          const projectCount = projects?.filter((p) => p.emirate === emirate).length || 0;
          return (
            <button
              key={emirate}
              onClick={() => onEmirateSelect(emirate)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 border-2 ${
                selectedEmirate === emirate
                  ? "bg-gold/10 text-gold border-gold shadow-[0_4px_12px_rgba(200,167,102,0.15)]"
                  : "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-foreground border-gold/40 hover:border-gold hover:shadow-[0_4px_12px_rgba(200,167,102,0.25)]"
              }`}
            >
              {emirate}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedEmirate === emirate
                  ? "bg-gold/20 text-gold"
                  : "bg-gold/20 text-foreground/80"
              }`}>
                {projectCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EmiratesTabs;
