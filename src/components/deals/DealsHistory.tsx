import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCheck, Clock, CheckCircle, XCircle, Building2 } from "lucide-react";
import { format } from "date-fns";

interface Deal {
  id: string;
  unit_number: string;
  client_name: string;
  deal_value_aed: number;
  developer_name: string;
  deal_status: string;
  submitted_at: string;
  verified_at: string | null;
  notes: string | null;
}

interface DealsHistoryProps {
  refreshTrigger?: number;
}

export function DealsHistory({ refreshTrigger }: DealsHistoryProps) {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadDeals = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .eq("broker_user_id", user.id)
        .order("submitted_at", { ascending: false });

      if (error) {
        console.error("Error loading deals:", error);
      } else {
        setDeals(data || []);
      }
      setIsLoading(false);
    };

    loadDeals();
  }, [user, refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
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
          <FileCheck className="h-5 w-5 text-primary" />
          My Deals
        </CardTitle>
        <CardDescription>
          {deals.length} deal{deals.length !== 1 ? "s" : ""} registered
        </CardDescription>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No deals registered yet</p>
            <p className="text-sm">Submit your first deal above</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {deals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground truncate">
                          {deal.developer_name}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          Unit {deal.unit_number}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Client: {deal.client_name}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-primary">
                          {formatCurrency(deal.deal_value_aed)}
                        </span>
                        <span className="text-muted-foreground">
                          {format(new Date(deal.submitted_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(deal.deal_status)}
                    </div>
                  </div>
                  {deal.notes && (
                    <p className="mt-2 text-xs text-muted-foreground border-t border-border pt-2">
                      {deal.notes}
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
