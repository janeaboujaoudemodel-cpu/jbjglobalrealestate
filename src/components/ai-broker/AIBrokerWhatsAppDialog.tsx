import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, AlertTriangle, MessageSquare } from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  phone: string | null;
}

interface WhatsAppTemplate {
  id: string;
  template_name: string;
  content: string;
  template_type: string;
}

interface AIBrokerWhatsAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  brokerId: string;
  brokerName: string;
}

export function AIBrokerWhatsAppDialog({
  open,
  onOpenChange,
  lead,
  brokerId,
  brokerName,
}: AIBrokerWhatsAppDialogProps) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [filterWarning, setFilterWarning] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
      // Set a default greeting
      setMessage(`Hi ${lead.full_name},\n\nThis is ${brokerName} from JBJ Global Real Estate. How can I assist you today?`);
    }
  }, [open, lead.full_name, brokerName]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("broker_whatsapp_templates")
      .select("*")
      .eq("is_active", true)
      .order("template_name");

    setTemplates(data || []);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      let contentText = template.content;

      const replacements: Record<string, string> = {
        "{{client_name}}": lead.full_name,
        "{{broker_name}}": brokerName,
        "{{1}}": lead.full_name,
        "{{2}}": brokerName,
      };

      for (const [key, value] of Object.entries(replacements)) {
        contentText = contentText.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value);
      }

      setMessage(contentText);
    }
  };

  const checkContentFilter = async (text: string): Promise<boolean> => {
    const { data: filters } = await supabase
      .from("broker_message_filters")
      .select("*")
      .eq("is_active", true);

    if (filters) {
      for (const filter of filters) {
        if (text.toLowerCase().includes(filter.filter_value.toLowerCase())) {
          if (filter.severity === "block") {
            setFilterWarning(
              `Message contains restricted content: "${filter.filter_value}". Please rephrase.`
            );
            return false;
          }
        }
      }
    }

    setFilterWarning(null);
    return true;
  };

  const handleSend = async () => {
    if (!lead.phone) {
      toast.error("No phone number available");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // Check filter
    const isAllowed = await checkContentFilter(message);
    if (!isAllowed) return;

    setSending(true);

    try {
      // Format phone number for WhatsApp
      const cleanPhone = lead.phone.replace(/[^0-9+]/g, "");
      const whatsappNumber = cleanPhone.startsWith("+") 
        ? cleanPhone.slice(1) 
        : cleanPhone;

      // Encode message for URL
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      // Log the message in the database
      const { data: conversation } = await supabase
        .from("broker_conversations")
        .select("id")
        .eq("broker_id", brokerId)
        .eq("client_identifier", lead.phone)
        .eq("channel", "whatsapp")
        .eq("status", "active")
        .single();

      let conversationId = conversation?.id;

      if (!conversationId) {
        const { data: newConv } = await supabase
          .from("broker_conversations")
          .insert({
            broker_id: brokerId,
            lead_id: lead.id,
            channel: "whatsapp",
            client_identifier: lead.phone,
            status: "active",
          })
          .select("id")
          .single();

        conversationId = newConv?.id;
      }

      if (conversationId) {
        await supabase.from("broker_messages").insert({
          conversation_id: conversationId,
          broker_id: brokerId,
          direction: "outbound",
          content: message,
          content_type: "text",
          delivery_status: "pending",
        });

        // Update conversation
        await supabase
          .from("broker_conversations")
          .update({
            last_message_at: new Date().toISOString(),
            message_count: (conversation as any)?.message_count ? (conversation as any).message_count + 1 : 1,
          })
          .eq("id", conversationId);
      }

      // Update daily stats
      const today = new Date().toISOString().split("T")[0];
      const { data: existingStats } = await supabase
        .from("broker_daily_stats")
        .select("*")
        .eq("broker_id", brokerId)
        .eq("stat_date", today)
        .single();

      if (existingStats) {
        await supabase
          .from("broker_daily_stats")
          .update({ messages_sent: (existingStats.messages_sent || 0) + 1 })
          .eq("id", existingStats.id);
      } else {
        await supabase.from("broker_daily_stats").insert({
          broker_id: brokerId,
          stat_date: today,
          messages_sent: 1,
        });
      }

      // Open WhatsApp
      window.open(whatsappUrl, "_blank");

      toast.success(`Opening WhatsApp to ${lead.full_name}`);
      onOpenChange(false);
      
      // Reset form
      setMessage("");
      setSelectedTemplate("");
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      toast.error("Failed to log message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            WhatsApp to {lead.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {filterWarning && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{filterWarning}</p>
            </div>
          )}

          <div>
            <Label className="text-[#1A1A1A]/70">Use Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] border-[#1A1A1A]">
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-[#1A1A1A]/70">Phone</Label>
            <div className="bg-[#1A1A1A] border border-[#1A1A1A] rounded-md px-3 py-2 mt-1 text-[#1A1A1A]/70">
              {lead.phone || "N/A"}
            </div>
          </div>

          <div>
            <Label className="text-[#1A1A1A]/70">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1 min-h-[150px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#1A1A1A]">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#1A1A1A] text-[#1A1A1A]/70"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send via WhatsApp
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
