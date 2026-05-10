import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Phone, Mail, MessageSquare, Clock, CheckCircle, 
  FileText, AlertCircle, Calendar, User, ArrowRight
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  activity_type: string;
  metadata: any;
  created_at: string;
  lead_id: string;
  lead_name?: string;
}

interface ActivityTimelineProps {
  userId: string;
  leadId?: string;
  limit?: number;
  showLeadName?: boolean;
}

const ActivityTimeline = ({ userId, leadId, limit = 20, showLeadName = true }: ActivityTimelineProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId, leadId]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("crm_activities")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (leadId) {
        query = query.eq("lead_id", leadId);
      }

      const { data: activitiesData } = await query;

      if (activitiesData && activitiesData.length > 0) {
        // Fetch lead names if showing lead names
        if (showLeadName) {
          const leadIds = [...new Set(activitiesData.map(a => a.lead_id))];
          const { data: leadsData } = await supabase
            .from("crm_leads")
            .select("id, full_name")
            .in("id", leadIds);

          const leadMap = new Map(leadsData?.map(l => [l.id, l.full_name]) || []);
          
          const enrichedActivities = activitiesData.map(a => ({
            ...a,
            lead_name: leadMap.get(a.lead_id) || "Unknown Lead"
          }));
          
          setActivities(enrichedActivities);
        } else {
          setActivities(activitiesData);
        }
      } else {
        setActivities([]);
      }
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4 text-blue-400" />;
      case "whatsapp_click":
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "email_click":
        return <Mail className="h-4 w-4 text-purple-400" />;
      case "status_change":
        return <ArrowRight className="h-4 w-4 text-orange-400" />;
      case "note":
        return <FileText className="h-4 w-4 text-[#1A1A1A]/70" />;
      case "followup_created":
        return <Calendar className="h-4 w-4 text-[#1A1A1A]" />;
      case "followup_completed":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "lead_created":
        return <User className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (activity: Activity) => {
    const metadata = activity.metadata || {};
    
    switch (activity.activity_type) {
      case "call":
        return `Called for ${metadata.duration || 0}s - ${metadata.outcome || "No outcome"}`;
      case "whatsapp_click":
        return "Opened WhatsApp chat";
      case "email_click":
        return "Sent email";
      case "status_change":
        return `Status: ${metadata.from || "new"} → ${metadata.to || metadata.new_status || "unknown"}`;
      case "note":
        return `Added note: "${metadata.preview || "..."}"`;
      case "followup_created":
        return `Created follow-up: ${metadata.title || "Task"}`;
      case "followup_completed":
        return "Completed follow-up task";
      case "lead_created":
        return "Lead was created";
      case "voice_note":
        return `Added voice note (${metadata.duration || 0}s)`;
      default:
        return activity.activity_type.replace(/_/g, " ");
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "call":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "whatsapp_click":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "email_click":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "status_change":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "followup_completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="py-4 text-center text-muted-foreground">
          Loading timeline...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-white font-bold text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ScrollArea className="h-[200px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activities yet
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
              
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={`text-xs capitalize ${getActivityBadgeColor(activity.activity_type)}`}
                        >
                          {activity.activity_type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {showLeadName && activity.lead_name && (
                        <p className="text-sm font-medium text-foreground mb-1">
                          {activity.lead_name}
                        </p>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        {getActivityLabel(activity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;
