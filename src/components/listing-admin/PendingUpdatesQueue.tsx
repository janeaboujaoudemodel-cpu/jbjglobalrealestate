import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, AlertCircle, RefreshCw, Database } from "lucide-react";
import { format } from "date-fns";

interface PendingUpdate {
  id: string;
  listing_id: string;
  listing_table: string;
  field_name: string;
  current_value: string | null;
  proposed_value: string;
  change_type: string;
  confidence_score: number;
  match_method: string;
  status: string;
  created_at: string;
  source?: {
    name: string;
  };
}

interface PendingUpdatesQueueProps {
  onRefresh?: () => void;
}

export function PendingUpdatesQueue({ onRefresh }: PendingUpdatesQueueProps) {
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingUpdates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("listing_pending_updates")
        .select(`
          *,
          source:external_data_sources(name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching pending updates:", error);
      toast({
        title: "Error",
        description: "Failed to load pending updates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUpdates();
  }, []);

  const handleApprove = async (update: PendingUpdate) => {
    setProcessingId(update.id);
    try {
      // Apply the update to the actual listing
      const updateData: Record<string, any> = {};
      
      if (update.field_name === "amenities_additions") {
        // Special handling for amenities - merge arrays for projects table
        if (update.listing_table === "projects") {
          const { data: listing } = await supabase
            .from("projects")
            .select("amenities")
            .eq("id", update.listing_id)
            .single();
          
          const existingAmenities = (listing as any)?.amenities || [];
          const newAmenities = JSON.parse(update.proposed_value);
          updateData.amenities = [...existingAmenities, ...newAmenities];
        } else {
          // For other tables, just set the new value
          updateData[update.field_name] = update.proposed_value;
        }
      } else {
        updateData[update.field_name] = update.proposed_value;
      }

      // Update the listing based on table type
      let updateError: any = null;
      if (update.listing_table === "projects") {
        const result = await supabase
          .from("projects")
          .update(updateData)
          .eq("id", update.listing_id);
        updateError = result.error;
      } else if (update.listing_table === "rental_listings") {
        const result = await supabase
          .from("rental_listings")
          .update(updateData)
          .eq("id", update.listing_id);
        updateError = result.error;
      } else if (update.listing_table === "seller_listings") {
        const result = await supabase
          .from("seller_listings")
          .update(updateData)
          .eq("id", update.listing_id);
        updateError = result.error;
      }

      if (updateError) throw updateError;

      // Mark as approved
      const { error: statusError } = await supabase
        .from("listing_pending_updates")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", update.id);

      if (statusError) throw statusError;

      toast({
        title: "Update Approved",
        description: `${update.field_name} has been updated successfully`,
      });

      fetchPendingUpdates();
      onRefresh?.();
    } catch (error) {
      console.error("Error approving update:", error);
      toast({
        title: "Error",
        description: "Failed to apply update",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (update: PendingUpdate, reason?: string) => {
    setProcessingId(update.id);
    try {
      const { error } = await supabase
        .from("listing_pending_updates")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          review_notes: reason || "Rejected by admin",
        })
        .eq("id", update.id);

      if (error) throw error;

      toast({
        title: "Update Rejected",
        description: "The proposed change has been rejected",
      });

      fetchPendingUpdates();
    } catch (error) {
      console.error("Error rejecting update:", error);
      toast({
        title: "Error",
        description: "Failed to reject update",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.9) return <Badge className="bg-green-500">High ({Math.round(score * 100)}%)</Badge>;
    if (score >= 0.75) return <Badge className="bg-yellow-500">Medium ({Math.round(score * 100)}%)</Badge>;
    return <Badge className="bg-orange-500">Low ({Math.round(score * 100)}%)</Badge>;
  };

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Pending Updates Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Database className="h-5 w-5 text-gold" />
          Pending Updates Queue
          {updates.length > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">{updates.length}</Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchPendingUpdates} className="border-gold/30 hover:bg-gold/10">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mb-4 text-emerald-500" />
            <p className="text-lg font-medium text-foreground">All caught up!</p>
            <p className="text-sm">No pending updates require your review</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {updates.map((update) => (
                  <div
                    key={update.id}
                    className="border border-gold/20 rounded-lg p-4 bg-white/50 hover:bg-white/80 transition-colors"
                  >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-zinc-900">
                          {formatFieldName(update.field_name)}
                        </span>
                        {getConfidenceBadge(update.confidence_score)}
                      </div>
                      <p className="text-sm text-zinc-600">
                        Matched via: {update.match_method?.replace(/_/g, " ")}
                      </p>
                      {update.source?.name && (
                        <p className="text-xs text-zinc-500 mt-1">
                          Source: {update.source.name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {format(new Date(update.created_at), "MMM d, h:mm a")}
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Current Value</p>
                      <div className="bg-white border border-zinc-200 rounded p-2 text-sm min-h-[40px] text-zinc-900">
                        {update.current_value || (
                          <span className="text-zinc-400 italic">Empty</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Proposed Value</p>
                      <div className="bg-emerald-50 border border-emerald-200 rounded p-2 text-sm min-h-[40px] text-zinc-900">
                        {update.proposed_value}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(update)}
                      disabled={processingId === update.id}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(update)}
                      disabled={processingId === update.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
