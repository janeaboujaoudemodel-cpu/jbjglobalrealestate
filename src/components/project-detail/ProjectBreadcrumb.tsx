import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

interface ProjectBreadcrumbProps {
  projectName: string;
  location?: string | null;
  surface?: "light" | "dark";
}

/**
 * Breadcrumb navigation for project detail pages.
 * Structure: Home / All Projects in Dubai / [Area] / [Project Name]
 *
 * `surface="dark"` renders white/amber tones for use over dark hero imagery.
 */
export function ProjectBreadcrumb({ projectName, location, surface = "light" }: ProjectBreadcrumbProps) {
  const area = location?.split(",")[0]?.trim() || null;
  const areaSlug = area?.toLowerCase().replace(/\s+/g, "-") || null;

  const isDark = surface === "dark";

  const linkClass = isDark
    ? "text-white/80 hover:text-white transition-colors"
    : "text-muted-foreground hover:text-gold transition-colors";

  const separatorClass = isDark ? "text-white/40" : "text-muted-foreground/50";

  const currentClass = isDark
    ? "text-amber-200 font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
    : "text-gold font-medium";

  return (
    <Breadcrumb className="py-4" {...(isDark ? { "data-surface": "dark" as const } : {})}>
      <BreadcrumbList className={isDark ? "text-white/80" : undefined}>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className={linkClass}>
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator className={separatorClass} />

        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/properties" className={linkClass}>
              All Projects in Dubai
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {area && (
          <>
            <BreadcrumbSeparator className={separatorClass} />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/properties?area=${areaSlug}`} className={linkClass}>
                  {area}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        <BreadcrumbSeparator className={separatorClass} />

        <BreadcrumbItem>
          <BreadcrumbPage className={cn(currentClass)}>
            {projectName}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default ProjectBreadcrumb;
