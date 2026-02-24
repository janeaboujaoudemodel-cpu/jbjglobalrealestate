import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Eye,
  ExternalLink,
  Instagram,
  Globe,
  Building2,
  XCircle,
  Loader2,
  RefreshCw,
  UserCheck,
  Shield,
  Crown,
  Send,
  MessageSquare,
  Edit3,
} from "lucide-react";

type PartnershipStage = "submitted" | "admin_review" | "senior_management_review" | "ceo_approval" | "approved" | "rejected";

interface PartnershipApplication {
  id: string;
  user_id: string | null;
  company_name: string;
  contact_person: string;
  position: string;
  email: string;
  phone: string;
  country: string;
  partnership_type: string;
  portfolio_size: string | null;
  company_profile: string | null;
  website_url: string | null;
  instagram_url: string | null;
  proposal: string;
  compliance_confirmed: boolean;
  stage: PartnershipStage;
  admin_notes: string | null;
  senior_mgmt_notes: string | null;
  ceo_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

const STAGE_CONFIG: Record<PartnershipStage, { label: string; color: string; icon: any }> = {
  submitted: { label: "Submitted", color: "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30", icon: Clock },
  admin_review: { label: "Admin Review", color: "bg-blue-50 text-blue-700 border-blue-300", icon: Eye },
  senior_management_review: { label: "Senior Mgmt Review", color: "bg-amber-50 text-amber-700 border-amber-300", icon: Shield },
  ceo_approval: { label: "CEO Approval", color: "bg-purple-50 text-purple-700 border-purple-300", icon: Crown },
  approved: { label: "Approved — Partner", color: "bg-green-50 text-green-700 border-green-300", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-300", icon: XCircle },
};

async function sendStatusNotification(
  app: PartnershipApplication,
  newStatus: string,
  statusLabel: string,
  adminMessage?: string,
  actionRequired?: boolean,
  actionLabel?: string
) {
  try {
    await supabase.functions.invoke("send-application-status-email", {
      body: {
        applicationType: "partnership",
        recipientEmail: app.email,
        recipientName: app.contact_person,
        applicationId: app.id,
        newStatus,
        statusLabel,
        adminMessage,
        applicationTitle: app.company_name,
        actionRequired,
        actionLabel,
        userId: app.user_id,
      },
    });
  } catch (e) {
    console.error("Notification send error:", e);
  }
}

export function PartnershipsDashboard() {
  const [applications, setApplications] = useState<PartnershipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<PartnershipApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [updating, setUpdating] = useState(false);
  const [messageMode, setMessageMode] = useState<"action" | "message" | "request_edit">("action");
  const [messageText, setMessageText] = useState("");

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("partnership_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load partnership applications");
      console.error(error);
    } else {
      setApplications((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const updateStage = async (id: string, newStage: PartnershipStage, noteField: string, noteValue: string) => {
    setUpdating(true);
    const updateData: any = { stage: newStage, [noteField]: noteValue || null };
    
    if (noteField === "admin_notes") updateData.admin_reviewed_at = new Date().toISOString();
    if (noteField === "senior_mgmt_notes") updateData.senior_reviewed_at = new Date().toISOString();
    if (noteField === "ceo_notes") updateData.ceo_reviewed_at = new Date().toISOString();

    const { error } = await supabase
      .from("partnership_applications")
      .update(updateData)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update application");
    } else {
      toast.success(`Application moved to ${STAGE_CONFIG[newStage].label}`);
      
      if (selectedApp) {
        await sendStatusNotification(
          selectedApp,
          newStage,
          STAGE_CONFIG[newStage].label,
          noteValue || undefined,
          false
        );
      }
      
      fetchApplications();
      setSelectedApp(null);
      setNotes("");
    }
    setUpdating(false);
  };

  const rejectApplication = async (id: string, reason: string) => {
    setUpdating(true);
    const { error } = await supabase
      .from("partnership_applications")
      .update({ stage: "rejected" as any, rejection_reason: reason })
      .eq("id", id);

    if (error) toast.error("Failed to reject");
    else {
      toast.success("Application rejected");
      
      if (selectedApp) {
        await sendStatusNotification(
          selectedApp,
          "rejected",
          "Rejected",
          reason || "Your application has been reviewed and unfortunately was not approved at this time.",
          false
        );
      }
      
      fetchApplications();
      setSelectedApp(null);
      setNotes("");
    }
    setUpdating(false);
  };

  const sendMessage = async () => {
    if (!selectedApp || !messageText.trim()) return;
    setUpdating(true);

    const isRequestEdit = messageMode === "request_edit";

    await sendStatusNotification(
      selectedApp,
      isRequestEdit ? "request_edit" : selectedApp.stage,
      isRequestEdit ? "Revision Requested" : "Message from JBJ Team",
      messageText,
      isRequestEdit,
      isRequestEdit ? "Please review and resubmit your partnership application" : undefined
    );

    toast.success(isRequestEdit ? "Edit request sent to applicant" : "Message sent to applicant");
    setMessageText("");
    setMessageMode("action");
    setUpdating(false);
  };

  const filtered = filterStage === "all" ? applications : applications.filter(a => a.stage === filterStage);

  const getNextAction = (stage: PartnershipStage) => {
    switch (stage) {
      case "submitted": return { label: "Start Admin Review", next: "admin_review" as PartnershipStage, noteField: "admin_notes" };
      case "admin_review": return { label: "Approve → Senior Management", next: "senior_management_review" as PartnershipStage, noteField: "admin_notes" };
      case "senior_management_review": return { label: "Approve → CEO Review", next: "ceo_approval" as PartnershipStage, noteField: "senior_mgmt_notes" };
      case "ceo_approval": return { label: "Final Approve — Welcome Onboard", next: "approved" as PartnershipStage, noteField: "ceo_notes" };
      default: return null;
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter(a => !["approved", "rejected"].includes(a.stage)).length,
    approved: applications.filter(a => a.stage === "approved").length,
    rejected: applications.filter(a => a.stage === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applications", value: stats.total, color: "text-black" },
          { label: "Pending Review", value: stats.pending, color: "text-amber-600" },
          { label: "Approved Partners", value: stats.approved, color: "text-green-600" },
          { label: "Rejected", value: stats.rejected, color: "text-red-500" },
        ].map(s => (
          <Card key={s.label} className="bg-white/80 border-[#C9A84C]/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-black">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter & Refresh */}
      <div className="flex items-center gap-3">
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[200px] border-[#C9A84C]/30 text-black">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchApplications} className="border-[#C9A84C]/30 text-black">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/80 border-[#C9A84C]/20">
          <CardContent className="p-12 text-center text-zinc-400">No partnership applications found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const stageInfo = STAGE_CONFIG[app.stage];
            const StageIcon = stageInfo.icon;
            return (
              <Card key={app.id} className="bg-white/80 border-[#C9A84C]/20 hover:border-[#C9A84C]/40 transition-colors cursor-pointer" onClick={() => { setSelectedApp(app); setNotes(""); setMessageMode("action"); setMessageText(""); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-[#C9A84C] flex-shrink-0" />
                        <h3 className="font-bold text-black truncate">{app.company_name}</h3>
                      </div>
                      <p className="text-sm text-zinc-500">{app.contact_person} · {app.position} · {app.partnership_type}</p>
                      <p className="text-xs text-zinc-400 mt-1">{new Date(app.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${stageInfo.color}`}>
                      <StageIcon className="w-3.5 h-3.5" />
                      {stageInfo.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) { setSelectedApp(null); setMessageMode("action"); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (() => {
            const stageInfo = STAGE_CONFIG[selectedApp.stage];
            const action = getNextAction(selectedApp.stage);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl text-black">{selectedApp.company_name}</DialogTitle>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold w-fit ${stageInfo.color}`}>
                    <stageInfo.icon className="w-3.5 h-3.5" />
                    {stageInfo.label}
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-zinc-400">Contact:</span> <span className="text-black font-medium">{selectedApp.contact_person}</span></div>
                    <div><span className="text-zinc-400">Position:</span> <span className="text-black font-medium">{selectedApp.position}</span></div>
                    <div><span className="text-zinc-400">Email:</span> <span className="text-black font-medium">{selectedApp.email}</span></div>
                    <div><span className="text-zinc-400">Phone:</span> <span className="text-black font-medium">{selectedApp.phone}</span></div>
                    <div><span className="text-zinc-400">Country:</span> <span className="text-black font-medium">{selectedApp.country}</span></div>
                    <div><span className="text-zinc-400">Type:</span> <span className="text-black font-medium">{selectedApp.partnership_type}</span></div>
                    {selectedApp.portfolio_size && <div><span className="text-zinc-400">Portfolio:</span> <span className="text-black font-medium">{selectedApp.portfolio_size}</span></div>}
                  </div>

                  {/* Links */}
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.website_url && (
                      <a href={selectedApp.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        <Globe className="w-3 h-3" /> Website <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedApp.instagram_url && (
                      <a href={selectedApp.instagram_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded-full">
                        <Instagram className="w-3 h-3" /> Instagram <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Company Profile */}
                  {selectedApp.company_profile && (
                    <div>
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Company Profile</p>
                      <p className="text-sm text-black bg-[#FDFBF7] border border-[#C9A84C]/20 p-3 rounded-lg">{selectedApp.company_profile}</p>
                    </div>
                  )}

                  {/* Proposal */}
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Proposal</p>
                    <p className="text-sm text-black bg-[#FDFBF7] border border-[#C9A84C]/20 p-3 rounded-lg whitespace-pre-wrap">{selectedApp.proposal}</p>
                  </div>

                  {/* Existing Notes */}
                  {selectedApp.admin_notes && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-500 font-semibold mb-1">Admin Notes</p>
                      <p className="text-sm text-blue-800">{selectedApp.admin_notes}</p>
                    </div>
                  )}
                  {selectedApp.senior_mgmt_notes && (
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <p className="text-xs text-amber-500 font-semibold mb-1">Senior Mgmt Notes</p>
                      <p className="text-sm text-amber-800">{selectedApp.senior_mgmt_notes}</p>
                    </div>
                  )}
                  {selectedApp.ceo_notes && (
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-purple-500 font-semibold mb-1">CEO Notes</p>
                      <p className="text-sm text-purple-800">{selectedApp.ceo_notes}</p>
                    </div>
                  )}
                  {selectedApp.rejection_reason && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-xs text-red-500 font-semibold mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-800">{selectedApp.rejection_reason}</p>
                    </div>
                  )}

                  {/* Message / Request Edit Tabs */}
                  <div className="border-t border-[#C9A84C]/20 pt-4">
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={messageMode === "action" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMessageMode("action")}
                        className={messageMode === "action" ? "bg-[#C9A84C] text-black" : "border-[#C9A84C]/30 text-black"}
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Actions
                      </Button>
                      <Button
                        variant={messageMode === "message" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMessageMode("message")}
                        className={messageMode === "message" ? "bg-blue-500 text-white" : "border-blue-300 text-blue-600"}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> Send Message
                      </Button>
                      <Button
                        variant={messageMode === "request_edit" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMessageMode("request_edit")}
                        className={messageMode === "request_edit" ? "bg-amber-500 text-white" : "border-amber-300 text-amber-600"}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" /> Request Edit
                      </Button>
                    </div>

                    {messageMode === "action" && action && (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add notes for this review stage..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                          className="border-[#C9A84C]/30"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateStage(selectedApp.id, action.next, action.noteField, notes)}
                            disabled={updating}
                            className="flex-1 bg-gradient-to-r from-[#C9A84C] to-amber-600 text-black font-semibold"
                          >
                            {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}
                            {action.label}
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => rejectApplication(selectedApp.id, notes || "Application rejected")}
                            disabled={updating}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {messageMode === "action" && !action && selectedApp.stage === "approved" && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-green-700 font-semibold">This partner has been approved and onboarded.</p>
                      </div>
                    )}

                    {(messageMode === "message" || messageMode === "request_edit") && (
                      <div className="space-y-3">
                        <div className={`p-3 rounded-lg border ${messageMode === "request_edit" ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"}`}>
                          <p className="text-xs font-semibold mb-1" style={{ color: messageMode === "request_edit" ? "#92400e" : "#1d4ed8" }}>
                            {messageMode === "request_edit" ? "⚠️ This will notify the applicant to edit & resubmit their application" : "📧 Send a direct message to the applicant"}
                          </p>
                        </div>
                        <Textarea
                          placeholder={messageMode === "request_edit" 
                            ? "Describe what needs to be edited (e.g., 'Please update your company profile and add financial documents')..." 
                            : "Type your message to the applicant..."}
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={4}
                          className="border-[#C9A84C]/30"
                        />
                        <Button
                          onClick={sendMessage}
                          disabled={updating || !messageText.trim()}
                          className={`w-full font-semibold ${messageMode === "request_edit" ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"}`}
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                          {messageMode === "request_edit" ? "Send Edit Request" : "Send Message"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
