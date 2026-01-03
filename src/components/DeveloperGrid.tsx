import { Link } from "react-router-dom";
import { useDevelopers, useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const DeveloperGrid = () => {
  const { data: developers, isLoading: loadingDevelopers } = useDevelopers();
  const { data: projects, isLoading: loadingProjects } = useProjects();

  if (loadingDevelopers || loadingProjects) {
    return (
      <div className="space-y-16">
        {[...Array(3)].map((_, i) => (
          <div key={i}>
            <Skeleton className="h-14 w-48 mb-8 bg-[#1a1a1a]" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, j) => (
                <Skeleton key={j} className="aspect-[4/3] rounded-lg bg-[#1a1a1a]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Group projects by developer
  const projectsByDeveloper = developers?.map((developer) => ({
    developer,
    projects: projects?.filter((p) => p.developer?.id === developer.id) || [],
  })).filter((group) => group.projects.length > 0);

  return (
    <div className="space-y-20">
      {projectsByDeveloper?.map(({ developer, projects: devProjects }) => (
        <div key={developer.id}>
          <Link
            to={`/developer/${developer.slug}`}
            className="inline-block group"
          >
            <h2
              className="text-white font-semibold mb-10 group-hover:text-[#D4A017] transition-colors"
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "56px",
                lineHeight: "1.2",
              }}
            >
              {developer.name}
            </h2>
          </Link>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {devProjects.slice(0, 12).map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.slug}`}
                className="group relative overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4A017]/50 transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={project.images?.[0]?.image_url || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h4
                    className="text-white text-lg font-semibold mb-1 line-clamp-1"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {project.name}
                  </h4>
                  {project.location && (
                    <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {project.location}
                    </p>
                  )}
                  {project.bedrooms_min && (
                    <p className="text-gray-500 text-sm mb-2">
                      {project.bedrooms_min === project.bedrooms_max
                        ? `${project.bedrooms_min} Bedrooms`
                        : `${project.bedrooms_min}-${project.bedrooms_max} Bedrooms`}
                    </p>
                  )}
                  {project.price_from && (
                    <p className="text-[#D4A017] font-semibold text-lg">
                      From AED {(project.price_from / 1000000).toFixed(1)}M
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {(!projectsByDeveloper || projectsByDeveloper.length === 0) && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
            No projects available yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default DeveloperGrid;
