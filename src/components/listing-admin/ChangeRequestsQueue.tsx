import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Check, X, Clock, RefreshCw, GitCompare, Eye, ChevronRight, ArrowRight,
} from "lucide-react";

interface ChangeRequest {
  id: string;
  project_id: string;
  requested_by: string;
  status: string;
  changes: Record<string, { before: string; after: string }>;
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  slug: string;
}

export function ChangeRequestsQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<(ChangeRequest & { project?: ProjectInfo })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<(ChangeRequest & { project?: ProjectInfo }) | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("project_change_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch project names
      const projectIds = [...new Set((data || []).map((r: any) => r.project_id))];
      const { data: projects } = await supabase
        .from("projects")
        .select("id, name, slug")
        .in("id", projectIds);

      const projectMap = new Map((projects || []).map((p) => [p.id, p]));

      setRequests(
        (data || []).map((r: any) => ({
          ...r,
          changes: r.changes || {},
          project: projectMap.get(r.project_id),
        }))
      );
    } catch (err) {
      console.error("Error fetching change requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async () => {
    if (!selectedRequest || !user) return;
    setIsProcessing(true);

    try {
      // Apply changes to the project
      const updateData: Record<string, any> = {};
      Object.entries(selectedRequest.changes).forEach(([key, val]) => {
        if (key === "price_from" || key === "price_to") {
          updateData[key] = val.after ? Number(val.after) : null;
        } else {
          updateData[key] = val.after || null;
        }
      });

      if (Object.keys(updateData).length > 0) {
        // Get before state for audit
        const { data: beforeProject } = await supabase
          .from("projects")
          .select("*")
          .eq("id", selectedRequest.project_id)
          .single();

        // Apply update
        const { error: updateErr } = await supabase
          .from("projects")
          .update({ ...updateData, updated_at: new Date().toISOString() })
          .eq("id", selectedRequest.project_id);

        if (updateErr) throw updateErr;

        // Audit log
        await supabase.from("project_audit_logs").insert({
          project_id: selectedRequest.project_id,
          action: "change_request_approved",
          changed_by: user.id,
          changed_by_email: user.email,
          before_data: beforeProject,
          after_data: updateData,
          change_request_id: selectedRequest.id,
        });
      }

      // Update request status
      await supabase
        .from("project_change_requests")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", selectedRequest.id);

      toast({ title: "Approved", description: "Changes applied to the project" });
      setSelectedRequest(null);
      setReviewNotes("");
      fetchRequests();
    } catch (err) {
      toast({ title: "Error", description: "Failed to approve change request", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !user) return;
    setIsProcessing(true);

    try {
      await supabase
        .from("project_change_requests")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || "Rejected by owner",
        })
        .eq("id", selectedRequest.id);

      toast({ title: "Rejected", description: "Change request has been rejected" });
      setSelectedRequest(null);
      setReviewNotes("");
      fetchRequests();
    } catch (err) {
      toast({ title: "Error", description: "Failed to reject", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <GitCompare className="h-5 w-5" />
            Developer Change Requests
            {pendingCount > 0 && (
              <Badge className="bg-amber-500 text-white">{pendingCount} pending</Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchRequests} className="border-[#B89555]/30">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No change requests yet</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {requests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setReviewNotes("");
                    }}
                    className="w-full flex items-center justify-between p-3 border rounded-lg text-sm hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{req.project?.name || "Unknown Project"}</p>
                      <p className="text-xs text-muted-foreground">
                        {Object.keys(req.changes).length} field(s) • {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "secondary"
                        }
                      >
                        {req.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Diff View Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Change Request: {selectedRequest?.project?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Diff view */}
              <div className="space-y-3">
                {Object.entries(selectedRequest.changes).map(([field, val]) => (
                  <div key={field} className="p-3 border rounded-lg">
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{field.replace(/_/g, " ")}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                        <p className="text-[10px] text-red-500 font-medium mb-1">Before</p>
                        <p className="text-foreground line-clamp-3">{val.before || <span className="italic text-muted-foreground">Empty</span>}</p>
                      </div>
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-sm">
                        <p className="text-[10px] text-emerald-600 font-medium mb-1">After</p>
                        <p className="text-foreground line-clamp-3">{val.after || <span className="italic text-muted-foreground">Empty</span>}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Review notes */}
              {selectedRequest.status === "pending" && (
                <div>
                  <p className="text-sm font-medium mb-1">Review Notes (optional)</p>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes for the developer..."
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.status === "pending" ? (
              <>
                <Button variant="outline" onClick={handleReject} disabled={isProcessing} className="border-red-300 text-red-600">
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={handleApprove} disabled={isProcessing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="h-4 w-4 mr-2" />
                  Approve & Apply
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
