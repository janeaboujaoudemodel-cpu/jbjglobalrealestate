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
  emirate?: string | null;
  surface?: "light" | "dark";
}

/**
 * Breadcrumb navigation for project detail pages.
 * Structure: Home / All Projects in [Emirate] / [Area] / [Project Name]
 */
export function ProjectBreadcrumb({ projectName, location, emirate, surface = "light" }: ProjectBreadcrumbProps) {
  const area = location?.split(",")[0]?.trim() || null;
  const areaSlug = area?.toLowerCase().replace(/\s+/g, "-") || null;
  const emirateLabel = emirate?.trim() || "the UAE";
  const emirateSlug = emirate?.toLowerCase().replace(/\s+/g, "-") || null;

  const isDark = surface === "dark";

  const linkStyle: React.CSSProperties = isDark
    ? { color: 'rgba(255,255,255,0.85)' }
    : {};
  const sepStyle: React.CSSProperties = isDark ? { color: 'rgba(255,255,255,0.45)' } : {};
  const currentStyle: React.CSSProperties = isDark
    ? { color: '#FDE68A', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.6)' }
    : {};

  return (
    <Breadcrumb className="py-4" {...(isDark ? { "data-surface": "dark" as const } : {})}>
      <BreadcrumbList style={isDark ? { color: 'rgba(255,255,255,0.85)' } : undefined}>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" style={linkStyle} className="hover:opacity-100 transition-opacity">
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator style={sepStyle} />

        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={emirateSlug ? `/properties?emirate=${emirateSlug}` : "/properties"} style={linkStyle} className="hover:opacity-100 transition-opacity">
              All Projects in {emirateLabel}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {area && (
          <>
            <BreadcrumbSeparator style={sepStyle} />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/properties?area=${areaSlug}`} style={linkStyle} className="hover:opacity-100 transition-opacity">
                  {area}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        <BreadcrumbSeparator style={sepStyle} />

        <BreadcrumbItem>
          <BreadcrumbPage style={currentStyle} className={cn(!isDark && "text-[#1A1A1A] font-medium")}>
            {projectName}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default ProjectBreadcrumb;
