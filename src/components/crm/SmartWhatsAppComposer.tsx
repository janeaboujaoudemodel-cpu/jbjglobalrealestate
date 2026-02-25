import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSquare, Sparkles, Copy, Send, RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  full_name: string;
  phone_e164: string | null;
  preferred_language: string | null;
  nationality: string | null;
}

interface SmartWhatsAppComposerProps {
  lead: Lead;
  onSend?: (message: string) => void;
}

const MESSAGE_TEMPLATES = [
  { id: "greeting", label: "Initial Greeting", prompt: "Write a friendly WhatsApp greeting" },
  { id: "followup", label: "Follow-up", prompt: "Write a brief follow-up message" },
  { id: "property_alert", label: "Property Alert", prompt: "Alert about a new property listing" },
  { id: "viewing", label: "Viewing Invitation", prompt: "Invite to a property viewing" },
  { id: "document", label: "Document Request", prompt: "Request documents for processing" },
  { id: "reminder", label: "Appointment Reminder", prompt: "Remind about an upcoming appointment" },
];

const SmartWhatsAppComposer = ({ lead, onSend }: SmartWhatsAppComposerProps) => {
  const [message, setMessage] = useState("");
  const [template, setTemplate] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const generateMessage = async () => {
    setLoading(true);
    try {
      const selectedTemplate = MESSAGE_TEMPLATES.find(t => t.id === template);
      const prompt = customPrompt || selectedTemplate?.prompt || "Write a professional WhatsApp message";

      const { data, error } = await supabase.functions.invoke('ai-whatsapp-composer', {
        body: {
          lead: {
            name: lead.full_name,
            language: lead.preferred_language || 'en',
            nationality: lead.nationality
          },
          prompt,
          template: template
        }
      });

      if (error) throw error;

      setMessage(data.message || "");
      toast.success("Message generated successfully");
    } catch (err) {
      console.error("Failed to generate message:", err);
      // Fallback template
      const firstName = lead.full_name.split(" ")[0];
      const templates: Record<string, string> = {
        greeting: `Hello ${firstName}! 👋\n\nThis is your dedicated property consultant from JBJ Global Real Estate. I noticed you're interested in UAE real estate opportunities.\n\nWould you like to schedule a quick call to discuss your requirements? I'm here to help! 🏠`,
        followup: `Hi ${firstName},\n\nJust following up on our previous conversation. Have you had a chance to consider the properties we discussed?\n\nLet me know if you have any questions! 📱`,
        property_alert: `Hi ${firstName}! 🏠\n\nExciting news! We have a new property listing that matches your criteria.\n\nWould you like me to send you the details?`,
        viewing: `Hello ${firstName},\n\nI'd love to invite you for a private viewing of some exclusive properties.\n\nWhen would be a convenient time for you? 🗓️`,
        document: `Hi ${firstName},\n\nTo proceed with the next steps, we would need some documents from you.\n\nCan we schedule a call to discuss?`,
        reminder: `Hi ${firstName},\n\nJust a friendly reminder about our upcoming meeting.\n\nLooking forward to speaking with you! 🤝`
      };
      setMessage(templates[template] || templates.greeting);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success("Message copied to clipboard");
  };

  const handleSendWhatsApp = () => {
    if (!lead.phone_e164) {
      toast.error("No phone number available");
      return;
    }

    const phone = lead.phone_e164.replace("+", "");
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    onSend?.(message);
  };

  const regenerate = () => {
    generateMessage();
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-500" />
          Smart WhatsApp Composer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Message Template</Label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {MESSAGE_TEMPLATES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-2">
          <Label>Custom Instructions (optional)</Label>
          <Input
            placeholder="E.g., mention the meeting tomorrow..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateMessage} 
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {loading ? "Generating..." : "Generate with AI"}
        </Button>

        {/* Message Content */}
        {message && (
          <>
            <div className="space-y-2">
              <Label>Message Preview</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/1000 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={regenerate} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button 
                onClick={handleSendWhatsApp} 
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={!lead.phone_e164}
              >
                <Send className="h-4 w-4 mr-2" />
                Open WhatsApp
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartWhatsAppComposer;
