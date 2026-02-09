import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, AlertTriangle } from "lucide-react";

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  template_type: string;
}

interface AIBrokerEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  brokerId: string;
  brokerName: string;
}

export function AIBrokerEmailDialog({
  open,
  onOpenChange,
  lead,
  brokerId,
  brokerName,
}: AIBrokerEmailDialogProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [filterWarning, setFilterWarning] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("broker_email_templates")
      .select("*")
      .eq("is_active", true)
      .order("name");

    setTemplates(data || []);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // Replace placeholders
      let subjectText = template.subject;
      let contentText = template.html_content;

      const replacements: Record<string, string> = {
        "{{client_name}}": lead.full_name,
        "{{broker_name}}": brokerName,
      };

      for (const [key, value] of Object.entries(replacements)) {
        subjectText = subjectText.replace(new RegExp(key, "g"), value);
        contentText = contentText.replace(new RegExp(key, "g"), value);
      }

      setSubject(subjectText);
      setContent(contentText);
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
    if (!lead.email) {
      toast.error("No email address available");
      return;
    }

    if (!subject.trim() || !content.trim()) {
      toast.error("Please fill in subject and content");
      return;
    }

    // Check filter
    const combinedText = `${subject} ${content}`;
    const isAllowed = await checkContentFilter(combinedText);
    if (!isAllowed) return;

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("broker-send-email", {
        body: {
          broker_id: brokerId,
          lead_id: lead.id,
          to_email: lead.email,
          to_name: lead.full_name,
          subject,
          html_content: content,
        },
      });

      if (error) throw error;

      if (data?.filtered) {
        setFilterWarning(data.reason);
        return;
      }

      toast.success(`Email sent to ${lead.full_name}`);
      onOpenChange(false);
      
      // Reset form
      setSubject("");
      setContent("");
      setSelectedTemplate("");
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            Send Email to {lead.full_name}
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
            <Label className="text-gray-300">Use Template (Optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTriggerDark className="mt-1">
                <SelectValue placeholder="Select a template..." />
              </SelectTriggerDark>
              <SelectContentDark>
                {templates.map((template) => (
                  <SelectItemDark key={template.id} value={template.id}>
                    {template.name}
                  </SelectItemDark>
                ))}
              </SelectContentDark>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">To</Label>
            <Input
              value={lead.email || ""}
              disabled
              className="bg-zinc-800 border-zinc-700 text-gray-400 mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300">Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              className="bg-zinc-800 border-zinc-700 text-white mt-1"
            />
          </div>

          <div>
            <Label className="text-gray-300">Message</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your message..."
              className="bg-zinc-800 border-zinc-700 text-white mt-1 min-h-[200px]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-zinc-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !content.trim()}
              className="bg-gold text-black hover:bg-gold/90"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
