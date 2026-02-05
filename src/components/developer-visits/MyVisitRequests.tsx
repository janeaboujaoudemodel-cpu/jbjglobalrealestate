import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, CheckCircle, XCircle, Building2 } from "lucide-react";
import { format } from "date-fns";

interface VisitRequest {
  id: string;
  developer_id: string;
  requested_date: string;
  requested_time: string | null;
  purpose: string;
  status: string;
  created_at: string;
  approved_at: string | null;
  developers?: {
    name: string;
  };
}

interface MyVisitRequestsProps {
  refreshTrigger?: number;
}

export function MyVisitRequests({ refreshTrigger }: MyVisitRequestsProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadRequests = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("developer_visit_requests")
        .select(`
          *,
          developers (name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading visit requests:", error);
      } else {
        setRequests(data || []);
      }
      setIsLoading(false);
    };

    loadRequests();
  }, [user, refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          My Visit Requests
        </CardTitle>
        <CardDescription>
          {requests.length} request{requests.length !== 1 ? "s" : ""} submitted
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No visit requests yet</p>
            <p className="text-sm">Request a developer visit to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">
                          {request.developers?.name || "Unknown Developer"}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.requested_date), "MMM d, yyyy")}
                        </span>
                        {request.requested_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {request.requested_time}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <Badge variant="outline" className="text-xs capitalize">
                          {request.purpose.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {request.status === "approved" && (
                    <p className="mt-2 text-xs text-green-400 border-t border-border pt-2">
                      ✓ Salesperson contact details unlocked
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
