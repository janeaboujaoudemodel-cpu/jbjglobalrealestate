import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, MapPin, Calendar, Eye } from "lucide-react";

interface Developer {
  id: string;
  name: string;
  logo_url: string | null;
}

interface DeveloperListProps {
  onSelectDeveloper: (developer: Developer) => void;
  onRequestVisit: (developer: Developer) => void;
  onCheckIn: (developer: Developer) => void;
}

export function DeveloperList({ onSelectDeveloper, onRequestVisit, onCheckIn }: DeveloperListProps) {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadDevelopers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, logo_url")
        .order("name");

      if (error) {
        console.error("Error loading developers:", error);
      } else {
        setDevelopers(data || []);
      }
      setIsLoading(false);
    };

    loadDevelopers();
  }, []);

  const filteredDevelopers = developers.filter((dev) =>
    dev.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search developers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Developer Cards */}
      {filteredDevelopers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No developers found</p>
          {search && <p className="text-sm">Try a different search term</p>}
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredDevelopers.map((developer) => (
            <Card
              key={developer.id}
              className="bg-card border-border hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Logo */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white border border-gold/20 flex items-center justify-center overflow-hidden">
                    {developer.logo_url ? (
                      <img
                        src={developer.logo_url}
                        alt={developer.name}
                        className="max-h-10 max-w-[90%] object-contain"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {developer.name}
                    </h3>
                    <Badge variant="outline" className="text-xs mt-1">
                      Developer
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectDeveloper(developer)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestVisit(developer)}
                      title="Request Visit"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onCheckIn(developer)}
                      title="Check In"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
