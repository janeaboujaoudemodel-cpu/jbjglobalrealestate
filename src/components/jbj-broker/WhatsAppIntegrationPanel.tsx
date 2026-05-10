import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  MessageCircle, 
  Send, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface WhatsAppTemplate {
  id: string;
  template_name: string;
  template_type: string;
  content: string;
  variables: string[] | null;
  approval_status: string | null;
  is_active: boolean | null;
}

interface WhatsAppIntegrationPanelProps {
  leadId?: string;
  leadName?: string;
  leadPhone?: string;
  brokerId?: string;
  onMessageSent?: () => void;
}

export function WhatsAppIntegrationPanel({
  leadId,
  leadName,
  leadPhone,
  brokerId,
  onMessageSent
}: WhatsAppIntegrationPanelProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  useEffect(() => {
    fetchTemplates();
    if (leadId) {
      fetchRecentMessages();
    }
  }, [leadId]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("broker_whatsapp_templates")
        .select("*")
        .eq("is_active", true)
        .order("template_type");

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMessages = async () => {
    try {
      // Get conversation for this lead
      const { data: conversations, error: convError } = await supabase
        .from("broker_conversations")
        .select("id")
        .eq("lead_id", leadId)
        .eq("channel", "whatsapp")
        .limit(1);

      if (convError || !conversations?.length) return;

      // Get recent messages
      const { data: messages, error: msgError } = await supabase
        .from("broker_messages")
        .select("*")
        .eq("conversation_id", conversations[0].id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (msgError) throw msgError;
      setRecentMessages(messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      // Replace variables with placeholders
      let message = template.content;
      if (leadName) {
        message = message.replace(/\{name\}/g, leadName);
        message = message.replace(/\{client_name\}/g, leadName);
      }
      setCustomMessage(message);
    }
  };

  const sendMessage = async () => {
    if (!leadPhone) {
      toast.error("No phone number available for this lead");
      return;
    }

    if (!customMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setSending(true);

    try {
      // Call broker-chat function to send WhatsApp message
      const { data, error } = await supabase.functions.invoke("broker-chat", {
        body: {
          broker_id: brokerId,
          lead_id: leadId,
          phone_number: leadPhone,
          message: customMessage,
          template_id: selectedTemplate || undefined
        }
      });

      if (error) throw error;

      toast.success("Message sent successfully");
      setSendDialogOpen(false);
      setCustomMessage("");
      setSelectedTemplate("");
      
      if (onMessageSent) {
        onMessageSent();
      }
      
      fetchRecentMessages();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Approved</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Pending</Badge>;
      default:
        return <Badge className="bg-[#B89555]/20 text-[#1A1A1A]/70 border-[#B89555]/30">Draft</Badge>;
    }
  };

  return (
    <>
      <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white">WhatsApp Integration</CardTitle>
                <p className="text-[#1A1A1A]/70 text-sm mt-1">
                  Send templated or custom messages
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">
              Meta API Required
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Send Button */}
          <Button
            onClick={() => setSendDialogOpen(true)}
            disabled={!leadPhone}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12"
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            Send WhatsApp Message
          </Button>

          {/* Templates Overview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[#1A1A1A]/70">Available Templates</h4>
            <div className="grid grid-cols-2 gap-2">
              {templates.slice(0, 4).map((template) => (
                <div
                  key={template.id}
                  className="p-3 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm font-medium capitalize">
                      {template.template_type.replace("_", " ")}
                    </p>
                    {getStatusBadge(template.approval_status)}
                  </div>
                  <p className="text-[#1A1A1A]/70 text-xs truncate">{template.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Messages */}
          {recentMessages.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-[#1A1A1A]/70">Recent Messages</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-lg text-sm ${
                      msg.direction === "outbound"
                        ? "bg-emerald-500/10 border border-emerald-500/20 ml-4"
                        : "bg-[#1A1A1A] border border-[#1A1A1A] mr-4"
                    }`}
                  >
                    <p className={msg.direction === "outbound" ? "text-emerald-300" : "text-white"}>
                      {msg.content.substring(0, 80)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-[#1A1A1A]/70" />
                      <span className="text-xs text-[#1A1A1A]/70">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                      {msg.delivery_status === "delivered" && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration Status */}
          <div className="p-3 rounded-lg bg-[#1A1A1A]/50 border border-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#1A1A1A]" />
              <span className="text-sm text-[#1A1A1A]/70">
                Connect WhatsApp Business API for live messaging
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Message Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-400" />
              Send WhatsApp Message
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A]">
              <p className="text-sm text-[#1A1A1A]/70">Sending to:</p>
              <p className="text-white font-medium">{leadName || "Lead"}</p>
              <p className="text-emerald-400 text-sm">{leadPhone}</p>
            </div>

            <div>
              <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Select Template (Optional)</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white">
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A]">
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name} ({template.template_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-[#1A1A1A]/70 mb-2 block">Message</label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your message..."
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white min-h-[120px]"
              />
              <p className="text-xs text-[#1A1A1A]/70 mt-1">
                Messages are filtered for restricted content before sending
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialogOpen(false)}
              className="border-[#1A1A1A] text-[#1A1A1A]/70"
            >
              Cancel
            </Button>
            <Button
              onClick={sendMessage}
              disabled={sending || !customMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
