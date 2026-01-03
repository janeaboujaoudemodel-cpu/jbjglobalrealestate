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
      <p className="text-zinc-500 text-sm mb-3 uppercase tracking-wider font-medium">
        Active in
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onEmirateSelect(null)}
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedEmirate === null
              ? "bg-gold text-black"
              : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-700/50"
          }`}
        >
          All Emirates
        </button>
        {activeEmirates.map((emirate) => {
          const projectCount = projects?.filter((p) => p.emirate === emirate).length || 0;
          return (
            <button
              key={emirate}
              onClick={() => onEmirateSelect(emirate)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                selectedEmirate === emirate
                  ? "bg-gold text-black"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-700/50"
              }`}
            >
              {emirate}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedEmirate === emirate
                  ? "bg-black/20 text-black"
                  : "bg-zinc-700 text-zinc-400"
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
