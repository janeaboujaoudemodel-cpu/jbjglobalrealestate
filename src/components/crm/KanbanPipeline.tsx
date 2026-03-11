import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { GripVertical, Phone, Mail, MessageSquare, Eye, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PIPELINE_STATUSES, getStatusInfo } from "./LeadStatusBadge";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  nationality: string | null;
  created_at: string;
  state?: {
    pipeline_status: string;
    last_touch_at: string | null;
    next_followup_at: string | null;
  };
}

interface KanbanPipelineProps {
  userId: string;
  onRefresh: () => void;
}

const KanbanPipeline = ({ userId, onRefresh }: KanbanPipelineProps) => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);

  // Define visible pipeline stages for kanban — grouped by category
  const kanbanStages = PIPELINE_STATUSES.filter(s => 
    ["new", "assigned", "contacted", "interested", "qualified", "viewing", "viewing_done", "negotiation", "offer_sent", "closed_won", "followup", "callback", "no_answer", "on_hold", "not_interested", "closed_lost", "archived"].includes(s.value)
  );

  useEffect(() => {
    fetchLeads();
  }, [userId]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Fetch assigned leads
      const { data: assignments } = await supabase
        .from("crm_lead_assignments")
        .select("lead_id")
        .eq("assigned_to_user_id", userId)
        .is("unassigned_at", null);

      const assignedIds = assignments?.map(a => a.lead_id) || [];

      if (assignedIds.length === 0) {
        setLeads([]);
        setLoading(false);
        return;
      }

      const { data: leadsData } = await supabase
        .from("crm_leads")
        .select("*")
        .in("id", assignedIds);

      // Fetch states
      const { data: statesData } = await supabase
        .from("crm_lead_state_per_user")
        .select("*")
        .eq("user_id", userId)
        .in("lead_id", assignedIds);

      const statesMap = new Map(statesData?.map(s => [s.lead_id, s]) || []);

      const leadsWithState = leadsData?.map(lead => ({
        ...lead,
        state: statesMap.get(lead.id)
      })) || [];

      setLeads(leadsWithState);
    } catch (err) {
      console.error("Failed to fetch leads for kanban:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetStatus: string) => {
    if (!draggedLead) return;

    const currentStatus = draggedLead.state?.pipeline_status || "new";
    if (currentStatus === targetStatus) {
      setDraggedLead(null);
      return;
    }

    try {
      await supabase
        .from("crm_lead_state_per_user")
        .upsert(
          {
            lead_id: draggedLead.id,
            user_id: userId,
            pipeline_status: targetStatus as any,
            last_touch_at: new Date().toISOString()
          },
          { onConflict: "lead_id,user_id" }
        );

      await supabase.from("crm_activities").insert({
        lead_id: draggedLead.id,
        user_id: userId,
        activity_type: "status_change",
        metadata: { from: currentStatus, to: targetStatus }
      });

      toast.success(`Moved to ${targetStatus}`);
      fetchLeads();
      onRefresh();
    } catch (err) {
      toast.error("Failed to move lead");
    } finally {
      setDraggedLead(null);
    }
  };

  const getLeadsForStage = (status: string) => {
    return leads.filter(l => (l.state?.pipeline_status || "new") === status);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading pipeline...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-white font-bold flex items-center gap-2">
          <GripVertical className="h-5 w-5" />
          Visual Pipeline (Drag & Drop)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-w-max">
            {kanbanStages.map((stage) => {
              const stageLeads = getLeadsForStage(stage.value);
              const statusInfo = getStatusInfo(stage.value);
              
              return (
                <div
                  key={stage.value}
                  className="w-64 flex-shrink-0"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(stage.value)}
                >
                  <div className={`rounded-t-lg px-3 py-2 ${stage.color} bg-opacity-20`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">{stage.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {stageLeads.length}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 rounded-b-lg min-h-[300px] p-2 space-y-2">
                    {stageLeads.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        Drop leads here
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => handleDragStart(lead)}
                          className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-all ${
                            draggedLead?.id === lead.id ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-medium text-sm text-foreground truncate flex-1">
                              {lead.full_name}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 -mr-1 -mt-1"
                              onClick={() => navigate(`/crm/lead/${lead.id}`)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2">
                            {lead.nationality || "Unknown"}
                          </p>
                          
                          <div className="flex items-center gap-1">
                            {lead.phone_e164 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => window.open(`https://wa.me/${lead.phone_e164?.replace("+", "")}`, "_blank")}
                              >
                                <MessageSquare className="h-3 w-3 text-green-500" />
                              </Button>
                            )}
                            {lead.email_lower && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => window.open(`mailto:${lead.email_lower}`, "_blank")}
                              >
                                <Mail className="h-3 w-3 text-blue-500" />
                              </Button>
                            )}
                            {lead.state?.next_followup_at && (
                              <div className="ml-auto flex items-center gap-1 text-xs text-amber-400">
                                <Calendar className="h-3 w-3" />
                                {formatDate(lead.state.next_followup_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default KanbanPipeline;
