import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import amandaClarkeExecutiveAssistant from '@/assets/team/amanda-clarke-executive-assistant.png';
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Bot, Send, Users, MessageSquare, Sparkles, 
  CheckCircle, Clock, X, User, Phone, Mail,
  Zap, FileText, RefreshCw, AlertCircle, Shield, AlertTriangle,
  ListTodo, Video, Mic, Plus, Trash2, Calendar
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

interface AssistantTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
}

interface CRMAssistantPanelProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Company contact info for drafts - OFFICIAL NUMBERS ONLY
const COMPANY_CONTACTS = {
  name: "JBJ GLOBAL REAL ESTATE",
  phone: "+971 54 716 7107",
  email: "CONTACT@JBJ.AE",
  website: "WWW.JBJ.AE",
  address: "Dubai, UAE",
  founderPhone: "+971 54 716 7107"
};

const CRMAssistantPanel = ({ userId, isOpen, onClose }: CRMAssistantPanelProps) => {
  const { activeLead } = useActiveLead();
  const [command, setCommand] = useState("");
  const [processing, setProcessing] = useState(false);
  const [aiEmployees, setAIEmployees] = useState<AIEmployee[]>([]);
  const [drafts, setDrafts] = useState<AIDraft[]>([]);
  const [activeTab, setActiveTab] = useState("assistant");
  const [selectedDraft, setSelectedDraft] = useState<AIDraft | null>(null);
  const [tasks, setTasks] = useState<AssistantTask[]>([
    { id: '1', title: 'Follow up with VIP leads today', completed: false, priority: 'high', createdAt: new Date().toISOString() },
    { id: '2', title: 'Review pending proposals', completed: false, priority: 'medium', createdAt: new Date().toISOString() },
    { id: '3', title: 'Schedule property viewings for this week', completed: true, priority: 'low', createdAt: new Date().toISOString() },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
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
• Properties aligned with your investment goals

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

  // Task management functions
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: AssistantTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
      priority: 'medium',
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle("");
    toast.success("Task added");
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success("Task removed");
  };

  // Communication handlers
  const handleCallFounder = () => {
    window.location.href = `tel:${COMPANY_CONTACTS.founderPhone}`;
  };

  const handleWhatsAppFounder = () => {
    const phone = COMPANY_CONTACTS.founderPhone.replace(/\s+/g, '').replace('+', '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleVideoCall = () => {
    toast.info("Video call feature coming soon. Please use WhatsApp video call.");
    const phone = COMPANY_CONTACTS.founderPhone.replace(/\s+/g, '').replace('+', '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const ASSISTANT_IDENTITY = {
    name: "Amanda Clarke",
    avatar: amandaClarkeExecutiveAssistant,
    title: "Executive Assistant",
    description: "Your dedicated executive assistant",
    founderPhone: COMPANY_CONTACTS.founderPhone
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-[0_10px_40px_rgba(200,167,102,0.2)]">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-3">
            <div className="relative">
              {/* GLOBAL IMAGE RULE - LOCKED (FINAL): max zoom, crop from bottom */}
              <img 
                src={ASSISTANT_IDENTITY.avatar} 
                alt={ASSISTANT_IDENTITY.name}
                className="w-10 h-10 rounded-full border-2 border-[#B89555] bg-[#FDFBF7]"
                style={{ objectFit: "cover", objectPosition: "center 15%" }}
               loading="lazy" decoding="async" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 jj-surface-emerald rounded-full border-2 border-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#1A1A1A]">{ASSISTANT_IDENTITY.name}</span>
              <p className="text-xs text-[#1A1A1A]/70 font-normal">{ASSISTANT_IDENTITY.title}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-[#F7F2EA] border-2 border-[#B89555]/20 grid grid-cols-4">
            <TabsTrigger value="assistant" className="data-[state=active]:bg-[#EFE6D6] text-[#1A1A1A]">
              <Sparkles className="h-4 w-4 mr-1" />
              Assistant
            </TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-[#EFE6D6] text-[#1A1A1A]">
              <ListTodo className="h-4 w-4 mr-1" />
              Tasks ({tasks.filter(t => !t.completed).length})
            </TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:bg-[#EFE6D6] text-[#1A1A1A]">
              <Users className="h-4 w-4 mr-1" />
              Team
            </TabsTrigger>
            <TabsTrigger value="drafts" className="data-[state=active]:bg-[#EFE6D6] text-[#1A1A1A]">
              <FileText className="h-4 w-4 mr-1" />
              Drafts ({drafts.length})
            </TabsTrigger>
          </TabsList>

          {/* Assistant Tab */}
          <TabsContent value="assistant" className="space-y-4 mt-4">
            {/* Quick Communication Buttons */}
            <div className="grid grid-cols-4 gap-2">
              <Button
                variant="secondary"
                className="flex flex-col items-center gap-1 h-auto py-3 border-[color:var(--emerald-1)]/30 hover:jj-emerald-soft"
                onClick={handleWhatsAppFounder}
              >
                <MessageSquare className="h-5 w-5 text-[color:var(--emerald-1)]" />
                <span className="text-xs text-[color:var(--emerald-1)]">WhatsApp</span>
              </Button>
              <Button
                variant="secondary"
                className="flex flex-col items-center gap-1 h-auto py-3 border-blue-200 hover:bg-blue-50"
                onClick={handleCallFounder}
              >
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-blue-600">Call</span>
              </Button>
              <Button
                variant="secondary"
                className="flex flex-col items-center gap-1 h-auto py-3 border-purple-200 hover:bg-purple-50"
                onClick={handleVideoCall}
              >
                <Video className="h-5 w-5 text-purple-600" />
                <span className="text-xs text-purple-600">Video</span>
              </Button>
              <Button
                variant="secondary"
                className="flex flex-col items-center gap-1 h-auto py-3 border-amber-200 hover:bg-amber-50"
                onClick={() => toast.info("Voice note feature coming soon")}
              >
                <Mic className="h-5 w-5 text-amber-600" />
                <span className="text-xs text-amber-600">Voice</span>
              </Button>
            </div>

            {/* Safety Rule Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
              <Shield className="h-5 w-5 text-[#1A1A1A] shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-300">Safety Rule</p>
                <p className="text-xs text-amber-200/70">
                  Destructive actions (delete leads/tasks/CVs) require explicit click + 2-step confirmation.
                </p>
              </div>
            </div>

            {/* Active Lead Context */}
            {activeLead ? (
              <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg p-3 flex items-center gap-3">
                <User className="h-5 w-5 text-[#1A1A1A]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{activeLead.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {activeLead.phone || activeLead.email || "No contact"}
                  </p>
                </div>
                <Badge variant="outline" className="text-[#1A1A1A] border-[#B89555]/50">Active</Badge>
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
                variant="primary"
                onClick={processCommand} 
                disabled={processing || !command.trim()}
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

          {/* Tasks Tab - My Tasks Section */}
          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-4">
              {/* Add New Task */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  className="flex-1 bg-muted border-border text-white"
                />
                <Button 
                  variant="primary"
                  onClick={addTask} 
                  disabled={!newTaskTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Task List */}
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <ListTodo className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No tasks yet. Add your first task above.</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div 
                        key={task.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
 task.completed 
 ? "bg-muted/20 border-border opacity-60" 
 : task.priority === 'high' 
 ? "bg-red-500/10 border-red-500/30"
 : task.priority === 'medium'
 ? "bg-amber-500/10 border-amber-500/30"
 : "bg-muted/30 border-border"
 }`}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task.id)}
                          className="border-muted-foreground data-[state=checked]:jj-surface-emerald"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${task.completed ? "line-through text-muted-foreground" : "text-white"}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${
 task.priority === 'high' ? "border-red-500/50 text-red-400" :
 task.priority === 'medium' ? "border-amber-500/50 text-[#1A1A1A]" :
 "border-muted-foreground text-muted-foreground"
 }`}>
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(task.id)}
                          className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Task Summary */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span>{tasks.filter(t => !t.completed).length} tasks remaining</span>
                <span>{tasks.filter(t => t.completed).length} completed</span>
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
                        <div className="p-2 bg-[#EFE6D6]/20 rounded-lg">
                          <Bot className="h-5 w-5 text-[#1A1A1A]" />
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
                        <Badge className={employee.is_active ? "jj-surface-emerald" : "bg-muted"}>
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
 draft.draft_type === "whatsapp" ? "jj-surface-emerald-soft" : "bg-blue-500/20"
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
                          <Clock className="h-4 w-4 text-[#1A1A1A] shrink-0" />
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
          <DialogContent className="sm:max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#1A1A1A]" />
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
                      ? "jj-surface-emerald" 
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
                <div className="jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/30 rounded-lg p-3 flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-[color:var(--emerald-on)]">
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
                    className="flex-1 jj-surface-emerald hover:jj-surface-emerald"
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