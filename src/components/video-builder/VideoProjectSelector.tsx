import { useState } from "react";
import { Search, Building2, MapPin, DollarSign, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProjects, Project } from "@/hooks/useProjects";
import { formatPrice } from "@/lib/formatPrice";
import { toast } from "sonner";
import type { VideoProject } from "@/pages/VideoBuilder";

interface VideoProjectSelectorProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onNext: () => void;
}

const VideoProjectSelector = ({ project, onUpdate, onNext }: VideoProjectSelectorProps) => {
  const { data: projects, isLoading } = useProjects();
  const [search, setSearch] = useState("");

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase()) ||
    p.developer?.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleSelectProject = (selectedProperty: Project) => {
    const images = selectedProperty.images?.map(img => img.image_url) || [];
    
    onUpdate({
      ...project,
      name: `${selectedProperty.name} - Video`,
      property: {
        id: selectedProperty.id,
        name: selectedProperty.name,
        location: selectedProperty.location || "Dubai, UAE",
        price_from: selectedProperty.price_from || 0,
        developer: selectedProperty.developer?.name || "Developer",
        images,
      },
      media: images.map((url, index) => ({
        id: crypto.randomUUID(),
        type: "image" as const,
        url,
        order: index,
        startTime: index * 3,
        endTime: (index + 1) * 3,
        effects: {
          transition: "fade",
          filter: "none",
          zoom: true,
          pan: index % 2 === 0,
        },
      })),
      duration: images.length * 3,
    });
    
    toast.success(`Selected: ${selectedProperty.name}`);
  };

  const handleSkip = () => {
    onUpdate({
      ...project,
      name: "Custom Video Project",
    });
    onNext();
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Select Property
        </CardTitle>
        <CardDescription>
          Choose a property from your listings to auto-populate video content, or skip to upload custom media.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties by name, location, or developer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Property */}
        {project.property && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                {project.property.images[0] ? (
                  <img
                    src={project.property.images[0]}
                    alt={project.property.name}
                    className="w-full h-full object-cover"
                   loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-primary">{project.property.name}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {project.property.location}
                </p>
                <p className="text-sm text-muted-foreground">{project.property.developer}</p>
                <p className="text-sm font-medium mt-1" data-price data-price-size="sm">
                  {formatPrice(project.property.price_from)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Property List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading properties...</p>
          ) : filteredProjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No properties found</p>
          ) : (
            filteredProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProject(p)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left overflow-visible"
              >
                <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                  {p.images?.[0]?.image_url ? (
                    <img src={p.images[0].image_url} alt={p.name} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                  ) : (
                    <ImageIcon className="w-6 h-6 m-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p data-developer-name className="text-xs text-muted-foreground whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">{p.developer?.name || p.location}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {p.price_from && (
                      <span className="text-xs font-medium text-primary" data-price data-price-size="sm">
                        {formatPrice(p.price_from)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {p.images?.length || 0} images
                </div>
              </button>
            ))
          )}
        </div>

        {/* Skip Option */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Or create a custom video without a property listing
          </p>
          <Button variant="outline" onClick={handleSkip}>
            Skip & Upload Custom
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoProjectSelector;
