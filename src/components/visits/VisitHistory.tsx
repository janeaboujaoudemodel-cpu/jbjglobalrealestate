import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Clock, Camera, Building2 } from "lucide-react";
import { format } from "date-fns";

interface VisitCheckin {
  id: string;
  developer_id: string;
  checkin_type: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_in_photo_url: string | null;
  selfie_url: string | null;
  check_in_time: string | null;
  notes: string | null;
  points_awarded: number | null;
  created_at: string;
  developers?: {
    name: string;
  } | null;
}

interface VisitHistoryProps {
  refreshTrigger?: number;
}

export function VisitHistory({ refreshTrigger }: VisitHistoryProps) {
  const { user } = useAuth();
  const [visits, setVisits] = useState<VisitCheckin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadVisits = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("developer_visit_checkins")
        .select(`
          id,
          developer_id,
          checkin_type,
          check_in_latitude,
          check_in_longitude,
          check_in_photo_url,
          selfie_url,
          check_in_time,
          notes,
          points_awarded,
          created_at,
          developers (name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading visits:", error);
      } else {
        setVisits((data as unknown as VisitCheckin[]) || []);
      }
      setIsLoading(false);
    };

    loadVisits();
  }, [user, refreshTrigger]);

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Visit History
        </CardTitle>
        <CardDescription>
          {visits.length} site visit{visits.length !== 1 ? "s" : ""} recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No site visits recorded yet</p>
            <p className="text-sm">Check in at a developer site to earn points</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {visits.map((visit) => {
                const photoUrl = visit.selfie_url || visit.check_in_photo_url;
                const checkInTime = visit.check_in_time || visit.created_at;
                const lat = visit.check_in_latitude;
                const lng = visit.check_in_longitude;

                return (
                  <div
                    key={visit.id}
                    className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      {photoUrl && (
                        <div className="flex-shrink-0">
                          <img
                            src={photoUrl}
                            alt="Visit selfie"
                            className="w-16 h-16 rounded-lg object-cover border border-border"
                            onError={(e) = loading="lazy" decoding="async"> {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-medium text-foreground">
                            {visit.developers?.name || "Unknown Developer"}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(checkInTime), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                          {lat != null && lng != null && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {Number(lat).toFixed(4)}, {Number(lng).toFixed(4)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {visit.points_awarded && visit.points_awarded > 0 && (
                            <Badge className="jj-surface-emerald-soft text-emerald-400 border-[color:var(--emerald-1)]/30/30">
                              +{visit.points_awarded} pts
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {visit.checkin_type === "gps_selfie" ? (
                              <>
                                <Camera className="h-3 w-3 mr-1" />
                                GPS + Selfie
                              </>
                            ) : (
                              "Manual"
                            )}
                          </Badge>
                        </div>

                        {visit.notes && (
                          <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                            {visit.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
