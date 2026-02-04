import { Link } from "react-router-dom";
import { Building2, ExternalLink, Award, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeveloperInfoCardProps {
  developer: {
    name: string;
    slug?: string | null;
    logo_url?: string | null;
    founded_year?: number | null;
    completed_projects?: number | null;
    offplan_projects?: number | null;
  } | null;
  projectName: string;
}

export default function DeveloperInfoCard({ developer, projectName }: DeveloperInfoCardProps) {
  if (!developer) return null;

  const stats = [
    { label: "Founded", value: developer.founded_year ? `${developer.founded_year}` : null },
    { label: "Completed Projects", value: developer.completed_projects ? `${developer.completed_projects}+` : null },
    { label: "Off-plan Projects", value: developer.offplan_projects ? `${developer.offplan_projects}+` : null },
  ].filter(s => s.value);

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <Building2 className="w-5 h-5 text-gold" />
        Developer
      </h3>

      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Developer Logo */}
        {developer.logo_url && (
          <div className="w-24 h-24 rounded-xl border border-gold/30 bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img 
              src={developer.logo_url} 
              alt={`${developer.name} logo`}
              className="w-20 h-20 object-contain"
            />
          </div>
        )}

        {/* Developer Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-xl font-bold text-foreground">{developer.name}</h4>
            <Award className="w-5 h-5 text-gold" />
          </div>
          
          <p className="text-muted-foreground text-sm mb-4">
            {projectName} is developed by {developer.name}, a trusted name in UAE real estate development.
          </p>

          {/* Developer Stats */}
          {stats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {stats.map((stat, idx) => (
                <div key={idx} className="p-3 rounded-lg border border-gold/20 bg-card">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-bold text-gold">{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* View Developer Button */}
          {developer.slug && (
            <Link to={`/developer/${developer.slug}`}>
              <Button variant="secondary" size="sm">
                <ExternalLink className="w-4 h-4" />
                View All Projects by {developer.name}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
