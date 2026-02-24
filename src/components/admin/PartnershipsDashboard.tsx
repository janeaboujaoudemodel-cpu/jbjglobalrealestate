import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";

type PartnershipStage = "submitted" | "admin_review" | "senior_management_review" | "ceo_approval" | "approved" | "rejected";

interface PartnershipApplication {
  id: string;
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
  submitted: { label: "Submitted", color: "bg-zinc-100 text-zinc-700 border-zinc-300", icon: Clock },
  admin_review: { label: "Admin Review", color: "bg-blue-50 text-blue-700 border-blue-300", icon: Eye },
  senior_management_review: { label: "Senior Mgmt Review", color: "bg-amber-50 text-amber-700 border-amber-300", icon: Shield },
  ceo_approval: { label: "CEO Approval", color: "bg-purple-50 text-purple-700 border-purple-300", icon: Crown },
  approved: { label: "Approved — Partner", color: "bg-green-50 text-green-700 border-green-300", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-300", icon: XCircle },
};

export function PartnershipsDashboard() {
  const [applications, setApplications] = useState<PartnershipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<PartnershipApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [updating, setUpdating] = useState(false);

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
      fetchApplications();
      setSelectedApp(null);
      setNotes("");
    }
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
          <Card key={s.label} className="bg-white/80 border-gold/30">
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
          <SelectTrigger className="w-[200px] border-gold/30 text-black">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {Object.entries(STAGE_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchApplications} className="border-gold/30 text-black">
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold" /></div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white/80 border-gold/20">
          <CardContent className="p-12 text-center text-zinc-400">No partnership applications found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const stageInfo = STAGE_CONFIG[app.stage];
            const StageIcon = stageInfo.icon;
            return (
              <Card key={app.id} className="bg-white/80 border-gold/20 hover:border-gold/40 transition-colors cursor-pointer" onClick={() => { setSelectedApp(app); setNotes(""); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-gold flex-shrink-0" />
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
      <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
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
                      <p className="text-sm text-black bg-zinc-50 p-3 rounded-lg">{selectedApp.company_profile}</p>
                    </div>
                  )}

                  {/* Proposal */}
                  <div>
                    <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Proposal</p>
                    <p className="text-sm text-black bg-zinc-50 p-3 rounded-lg whitespace-pre-wrap">{selectedApp.proposal}</p>
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

                  {/* Action Area */}
                  {action && (
                    <div className="border-t border-gold/20 pt-4 space-y-3">
                      <Textarea
                        placeholder="Add notes for this review stage..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateStage(selectedApp.id, action.next, action.noteField, notes)}
                          disabled={updating}
                          className="flex-1 bg-gradient-to-r from-gold to-amber-600 text-black font-semibold"
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

                  {selectedApp.stage === "approved" && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-green-700 font-semibold">This partner has been approved and onboarded.</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
