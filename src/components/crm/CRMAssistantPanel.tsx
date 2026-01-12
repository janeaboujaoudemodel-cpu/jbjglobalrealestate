import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Bot, Send, Users, MessageSquare, Sparkles, 
  CheckCircle, Clock, X, User, Phone, Mail,
  Zap, FileText, RefreshCw, AlertCircle, Shield
} from "lucide-react";
import { useActiveLead } from "@/contexts/ActiveLeadContext";

interface AIEmployee {
  id: string;
  name: string;
  role: string;
  description: string;
  permissions: string[];
  is_active: boolean;
}

interface AIDraft {
  id: string;
  lead_id: string;
  ai_employee_id: string;
  draft_type: string;
  subject: string | null;
  content: string;
  status: string;
  created_at: string;
  lead?: {
    full_name: string;
    phone_e164: string | null;
    email_lower: string | null;
  };
  ai_employee?: {
    name: string;
    role: string;
  };
}

interface CRMAssistantPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Company contact info for drafts
const COMPANY_CONTACTS = {
  name: "JBJ Global Real Estate",
  phone: "+971 4 XXX XXXX",
  email: "info@jbjglobal.ae",
  website: "www.jbjglobal.ae",
  address: "Dubai, UAE"
};

const CRMAssistantPanel = ({ userId, isOpen, onClose }: CRMAssistantPanelProps) => {
  const { activeLead } = useActiveLead();
  const [command, setCommand] = useState("");
  const [processing, setProcessing] = useState(false);
  const [aiEmployees, setAIEmployees] = useState<AIEmployee[]>([]);
  const [drafts, setDrafts] = useState<AIDraft[]>([]);
  const [activeTab, setActiveTab] = useState("assistant");
  const [selectedDraft, setSelectedDraft] = useState<AIDraft | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAIEmployees();
      fetchDrafts();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const fetchAIEmployees = async () => {
    const { data, error } = await supabase
      .from("crm_ai_employees")
      .select("*")
      .eq("is_active", true);

    if (!error && data) {
      setAIEmployees(data);
    }
  };

  const fetchDrafts = async () => {
    const { data, error } = await supabase
      .from("crm_ai_drafts")
      .select(`
        *,
        lead:crm_leads(full_name, phone_e164, email_lower),
        ai_employee:crm_ai_employees(name, role)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setDrafts(data as AIDraft[]);
    }
  };

  const processCommand = async () => {
    if (!command.trim()) return;
    
    setProcessing(true);
    const cmd = command.toLowerCase();
    
    try {
      // Parse command intent
      if (cmd.includes("assign") && cmd.includes("lead")) {
        await handleAssignCommand(cmd);
      } else if (cmd.includes("welcome") || cmd.includes("whatsapp")) {
        await handleWelcomeCommand(cmd);
      } else if (cmd.includes("follow") || cmd.includes("reminder")) {
        await handleFollowUpCommand(cmd);
      } else if (cmd.includes("email") || cmd.includes("draft")) {
        await handleEmailDraftCommand(cmd);
      } else if (cmd.includes("vip")) {
        await handleVIPCommand(cmd);
      } else {
        toast.error("Command not recognized. Try: 'Assign this lead to Welcome Assistant' or 'Send welcome WhatsApp'");
      }
    } catch (err) {
      console.error("Command processing failed:", err);
      toast.error("Failed to process command");
    } finally {
      setProcessing(false);
      setCommand("");
    }
  };

  const handleAssignCommand = async (cmd: string) => {
    if (!activeLead) {
      toast.error("No lead selected. Select a lead first.");
      return;
    }

    // Find AI employee mentioned
    const employee = aiEmployees.find(e => 
      cmd.includes(e.name.toLowerCase()) || 
      cmd.includes(e.role.toLowerCase())
    );

    if (!employee) {
      toast.error("AI employee not found. Available: " + aiEmployees.map(e => e.name).join(", "));
      return;
    }

    // Assign lead to AI employee
    const { error } = await supabase
      .from("crm_leads")
      .update({ assigned_ai_employee_id: employee.id })
      .eq("id", activeLead.id);

    if (error) throw error;

    toast.success(`${activeLead.full_name} assigned to ${employee.name}`);
    
    // Create initial draft based on employee role
    if (employee.permissions.includes("send_whatsapp_template")) {
      await createDraft(activeLead.id, employee.id, "whatsapp", generateWelcomeMessage(activeLead.full_name));
    }
  };

  const handleWelcomeCommand = async (cmd: string) => {
    if (!activeLead) {
      toast.error("No lead selected. Select a lead first.");
      return;
    }

    const welcomeEmployee = aiEmployees.find(e => e.role === "welcome_assistant");
    if (!welcomeEmployee) {
      toast.error("Welcome Assistant not configured");
      return;
    }

    await createDraft(
      activeLead.id, 
      welcomeEmployee.id, 
      "whatsapp", 
      generateWelcomeMessage(activeLead.full_name)
    );
    
    toast.success("Welcome WhatsApp draft created for review");
    fetchDrafts();
  };

  const handleFollowUpCommand = async (cmd: string) => {
    if (!activeLead) {
      toast.error("No lead selected. Select a lead first.");
      return;
    }

    const followUpEmployee = aiEmployees.find(e => e.role === "follow_up_bot");
    if (!followUpEmployee) {
      toast.error("Follow-up Bot not configured");
      return;
    }

    await createDraft(
      activeLead.id, 
      followUpEmployee.id, 
      "whatsapp", 
      generateFollowUpMessage(activeLead.full_name)
    );
    
    toast.success("Follow-up message draft created for review");
    fetchDrafts();
  };

  const handleEmailDraftCommand = async (cmd: string) => {
    if (!activeLead) {
      toast.error("No lead selected. Select a lead first.");
      return;
    }

    const marketingEmployee = aiEmployees.find(e => e.role === "marketing_assistant");
    const employee = marketingEmployee || aiEmployees[0];
    
    if (!employee) {
      toast.error("No AI employee available");
      return;
    }

    await createDraft(
      activeLead.id, 
      employee.id, 
      "email", 
      generateEmailDraft(activeLead.full_name),
      "Property Investment Opportunity"
    );
    
    toast.success("Email draft created for review");
    fetchDrafts();
  };

  const handleVIPCommand = async (cmd: string) => {
    if (!activeLead) {
      toast.error("No lead selected. Select a lead first.");
      return;
    }

    const { error } = await supabase
      .from("crm_leads")
      .update({ 
        vip: true, 
        vip_tagged_at: new Date().toISOString(),
        vip_tagged_by: userId
      })
      .eq("id", activeLead.id);

    if (error) throw error;

    toast.success(`${activeLead.full_name} marked as VIP`);
  };

  const createDraft = async (
    leadId: string, 
    aiEmployeeId: string, 
    draftType: string, 
    content: string,
    subject?: string
  ) => {
    const { error } = await supabase
      .from("crm_ai_drafts")
      .insert({
        lead_id: leadId,
        ai_employee_id: aiEmployeeId,
        draft_type: draftType,
        subject: subject || null,
        content,
        status: "pending"
      });

    if (error) throw error;
  };

  const generateWelcomeMessage = (name: string) => {
    const firstName = name.split(" ")[0];
    return `Hello ${firstName}! 👋

Welcome to ${COMPANY_CONTACTS.name}. Thank you for your interest in Dubai real estate.

I'm here to help you find the perfect property that matches your requirements. Whether you're looking for an investment opportunity or a dream home, we have exclusive access to premium developments across Dubai.

How can I assist you today?

Best regards,
${COMPANY_CONTACTS.name}
📞 ${COMPANY_CONTACTS.phone}
🌐 ${COMPANY_CONTACTS.website}`;
  };

  const generateFollowUpMessage = (name: string) => {
    const firstName = name.split(" ")[0];
    return `Hi ${firstName},

I hope this message finds you well. I wanted to follow up on our previous conversation about your property requirements.

We have some exciting new developments that might interest you:
• Exclusive off-plan opportunities with flexible payment plans
• Premium ready-to-move properties in prime locations
• Investment options with guaranteed returns

Would you like to schedule a viewing or discuss your options?

Looking forward to hearing from you.

Best regards,
${COMPANY_CONTACTS.name}
📞 ${COMPANY_CONTACTS.phone}`;
  };

  const generateEmailDraft = (name: string) => {
    const firstName = name.split(" ")[0];
    return `Dear ${firstName},

I hope this email finds you well.

I wanted to reach out regarding exclusive investment opportunities in Dubai's premium real estate market. As a valued client of ${COMPANY_CONTACTS.name}, you have priority access to:

1. **Off-Plan Developments**: Starting from AED 800,000 with attractive payment plans
2. **Ready Properties**: Prime locations in Dubai Marina, Downtown, and Palm Jumeirah
3. **Investment Returns**: Properties with projected ROI of 8-12% annually

Our team of expert advisors is ready to guide you through the entire process, from property selection to documentation.

Would you be available for a consultation this week?

Best regards,

${COMPANY_CONTACTS.name}
${COMPANY_CONTACTS.phone}
${COMPANY_CONTACTS.email}`;
  };

  const handleApproveDraft = async (draft: AIDraft) => {
    // Update draft status
    await supabase
      .from("crm_ai_drafts")
      .update({ 
        status: "approved",
        reviewed_by_user_id: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", draft.id);

    // Log activity on the lead
    await supabase
      .from("crm_activities")
      .insert({
        lead_id: draft.lead_id,
        user_id: userId,
        activity_type: draft.draft_type === "whatsapp" ? "whatsapp_click" : "email_click",
        metadata: {
          ai_draft_id: draft.id,
          ai_employee_id: draft.ai_employee_id,
          content_preview: draft.content.substring(0, 100)
        }
      });

    // Open appropriate channel
    if (draft.draft_type === "whatsapp" && draft.lead?.phone_e164) {
      const phone = draft.lead.phone_e164.replace("+", "");
      const encodedMessage = encodeURIComponent(draft.content);
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
    } else if (draft.draft_type === "email" && draft.lead?.email_lower) {
      const subject = encodeURIComponent(draft.subject || "Property Inquiry");
      const body = encodeURIComponent(draft.content);
      window.open(`mailto:${draft.lead.email_lower}?subject=${subject}&body=${body}`, "_blank");
    }

    toast.success("Draft approved and sent!");
    setSelectedDraft(null);
    fetchDrafts();
  };

  const handleRejectDraft = async (draft: AIDraft) => {
    await supabase
      .from("crm_ai_drafts")
      .update({ 
        status: "rejected",
        reviewed_by_user_id: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", draft.id);

    toast.success("Draft rejected");
    setSelectedDraft(null);
    fetchDrafts();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-gold" />
            CRM Assistant
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-muted/50">
            <TabsTrigger value="assistant" className="flex-1">
              <Sparkles className="h-4 w-4 mr-2" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              AI Employees
            </TabsTrigger>
            <TabsTrigger value="drafts" className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              Drafts ({drafts.length})
            </TabsTrigger>
          </TabsList>

          {/* Assistant Tab */}
          <TabsContent value="assistant" className="space-y-4 mt-4">
            {/* Active Lead Context */}
            {activeLead ? (
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3 flex items-center gap-3">
                <User className="h-5 w-5 text-gold" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{activeLead.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeLead.phone || activeLead.email || "No contact"}
                  </p>
                </div>
                <Badge variant="outline" className="text-gold border-gold/50">Active</Badge>
              </div>
            ) : (
              <div className="bg-muted/30 border border-border rounded-lg p-3 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No lead selected. Select a lead from the table to use assistant commands.
                </p>
              </div>
            )}

            {/* Command Input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Type a command... e.g., 'Send welcome WhatsApp'"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && processCommand()}
                className="flex-1 bg-muted border-border text-white"
                disabled={processing}
              />
              <Button 
                onClick={processCommand} 
                disabled={processing || !command.trim()}
                className="bg-gold text-black hover:bg-gold/90"
              >
                {processing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Command Suggestions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Suggested commands:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Send welcome WhatsApp",
                  "Create follow-up reminder",
                  "Draft email",
                  "Mark as VIP",
                  "Assign to Welcome Assistant"
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setCommand(suggestion)}
                    disabled={!activeLead}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* AI Employees Tab */}
          <TabsContent value="employees" className="mt-4">
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {aiEmployees.map((employee) => (
                  <Card key={employee.id} className="bg-muted/30 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gold/20 rounded-lg">
                          <Bot className="h-5 w-5 text-gold" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{employee.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize mb-2">
                            {employee.role.replace(/_/g, " ")}
                          </p>
                          <p className="text-sm text-muted-foreground">{employee.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {employee.permissions.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm.replace(/_/g, " ")}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge className={employee.is_active ? "bg-green-600" : "bg-muted"}>
                          {employee.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="mt-4">
            <ScrollArea className="h-[300px]">
              {drafts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No pending drafts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => (
                    <Card 
                      key={draft.id} 
                      className="bg-muted/30 border-border cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedDraft(draft)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            draft.draft_type === "whatsapp" ? "bg-green-500/20" : "bg-blue-500/20"
                          }`}>
                            {draft.draft_type === "whatsapp" ? (
                              <MessageSquare className="h-4 w-4 text-green-400" />
                            ) : (
                              <Mail className="h-4 w-4 text-blue-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium truncate">
                                {draft.lead?.full_name || "Unknown Lead"}
                              </p>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {draft.ai_employee?.name}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {draft.content.substring(0, 60)}...
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(draft.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Draft Review Modal */}
        <Dialog open={!!selectedDraft} onOpenChange={() => setSelectedDraft(null)}>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-gold" />
                Review AI Draft
              </DialogTitle>
            </DialogHeader>

            {selectedDraft && (
              <div className="space-y-4">
                {/* Lead Info */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-white">{selectedDraft.lead?.full_name}</span>
                  </div>
                  {selectedDraft.lead?.phone_e164 && (
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedDraft.lead.phone_e164}</span>
                    </div>
                  )}
                </div>

                {/* Draft Type & Source */}
                <div className="flex items-center gap-2">
                  <Badge className={
                    selectedDraft.draft_type === "whatsapp" 
                      ? "bg-green-600" 
                      : "bg-blue-600"
                  }>
                    {selectedDraft.draft_type === "whatsapp" ? "WhatsApp" : "Email"}
                  </Badge>
                  <Badge variant="outline">
                    By: {selectedDraft.ai_employee?.name}
                  </Badge>
                </div>

                {/* Subject (for email) */}
                {selectedDraft.subject && (
                  <div>
                    <label className="text-xs text-muted-foreground">Subject</label>
                    <p className="text-white font-medium">{selectedDraft.subject}</p>
                  </div>
                )}

                {/* Content */}
                <div>
                  <label className="text-xs text-muted-foreground">Message Content</label>
                  <div className="bg-muted/30 rounded-lg p-3 mt-1 max-h-48 overflow-auto">
                    <pre className="text-sm text-white whitespace-pre-wrap font-sans">
                      {selectedDraft.content}
                    </pre>
                  </div>
                </div>

                {/* Security Note */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-green-300">
                    This message uses official JBJ Global Real Estate contact information only. 
                    No personal broker details are exposed.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/20"
                    onClick={() => handleRejectDraft(selectedDraft)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproveDraft(selectedDraft)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve & Send
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};

export default CRMAssistantPanel;