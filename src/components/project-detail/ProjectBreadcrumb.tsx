import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface ProjectBreadcrumbProps {
  projectName: string;
  location?: string | null;
}

/**
 * Breadcrumb navigation for project detail pages.
 * Structure: Home / All Projects in Dubai / [Area] / [Project Name]
 */
export function ProjectBreadcrumb({ projectName, location }: ProjectBreadcrumbProps) {
  // Extract area from location (e.g., "Downtown Dubai" from "Downtown Dubai, Dubai")
  const area = location?.split(",")[0]?.trim() || null;
  
  // Generate area slug for filtering
  const areaSlug = area?.toLowerCase().replace(/\s+/g, "-") || null;

  return (
    <Breadcrumb className="py-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="text-muted-foreground hover:text-gold transition-colors">
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator className="text-muted-foreground/50" />
        
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/properties" className="text-muted-foreground hover:text-gold transition-colors">
              All Projects in Dubai
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {area && (
          <>
            <BreadcrumbSeparator className="text-muted-foreground/50" />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  to={`/properties?area=${areaSlug}`} 
                  className="text-muted-foreground hover:text-gold transition-colors"
                >
                  {area}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        
        <BreadcrumbSeparator className="text-muted-foreground/50" />
        
        <BreadcrumbItem>
          <BreadcrumbPage className="text-gold font-medium">
            {projectName}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default ProjectBreadcrumb;
