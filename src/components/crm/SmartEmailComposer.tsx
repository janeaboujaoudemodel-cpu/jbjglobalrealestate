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
  Mail, Sparkles, Copy, Send, RefreshCw, Wand2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CrossChannelToggle } from "@/components/shared/CrossChannelToggle";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  nationality: string | null;
  preferred_language: string | null;
}

interface SmartEmailComposerProps {
  lead: Lead;
  onSend?: (email: { subject: string; body: string }) => void;
}

const EMAIL_TEMPLATES = [
  { id: "intro", label: "Introduction", prompt: "Write a professional introduction email" },
  { id: "followup", label: "Follow-up", prompt: "Write a polite follow-up email" },
  { id: "property", label: "Property Recommendation", prompt: "Write about a property recommendation" },
  { id: "meeting", label: "Meeting Request", prompt: "Request a meeting or call" },
  { id: "thankyou", label: "Thank You", prompt: "Write a thank you email after a meeting" },
  { id: "offer", label: "Special Offer", prompt: "Present a special offer or opportunity" },
];

const SmartEmailComposer = ({ lead, onSend }: SmartEmailComposerProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [template, setTemplate] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [alsoNotifyChat, setAlsoNotifyChat] = useState(false);

  const generateEmail = async () => {
    setLoading(true);
    try {
      const selectedTemplate = EMAIL_TEMPLATES.find(t => t.id === template);
      const prompt = customPrompt || selectedTemplate?.prompt || "Write a professional email";

      const { data, error } = await supabase.functions.invoke('ai-email-composer', {
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

      setSubject(data.subject || "");
      setBody(data.body || "");
      toast.success("Email generated successfully");
    } catch (err) {
      console.error("Failed to generate email:", err);
      // Fallback template
      const firstName = lead.full_name.split(" ")[0];
      setSubject(`Hello ${firstName} - Property Investment Opportunity`);
      setBody(
        `Dear ${firstName},\n\n` +
        `I hope this email finds you well. I'm reaching out regarding our exclusive property opportunities in Dubai.\n\n` +
        `As a valued client, I wanted to share some exciting new developments that may interest you.\n\n` +
        `Would you be available for a quick call to discuss your investment goals?\n\n` +
        `Best regards,\nJBJ Global Real Estate`
      );
      toast.info("Using template email");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    toast.success("Email copied to clipboard");
  };

  const handleSendEmail = () => {
    if (!lead.email_lower) {
      toast.error("No email address available");
      return;
    }

    const mailtoUrl = `mailto:${lead.email_lower}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_blank");
    onSend?.({ subject, body });
  };

  const regenerate = () => {
    generateEmail();
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          Smart Email Composer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Template Selection */}
        <div className="space-y-2">
          <Label>Email Template</Label>
          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_TEMPLATES.map((t) => (
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
            placeholder="E.g., mention the Palm Jumeirah villa..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateEmail} 
          disabled={loading}
          className="w-full bg-primary"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {loading ? "Generating..." : "Generate with AI"}
        </Button>

        {/* Email Content */}
        {(subject || body) && (
          <>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="resize-none"
              />
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
                onClick={handleSendEmail} 
                className="flex-1 bg-primary"
                disabled={!lead.email_lower}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>

            {/* Cross-channel toggle — shared component */}
            {lead.email_lower && (
              <CrossChannelToggle
                recipientEmail={lead.email_lower}
                channel="email-first"
                checked={alsoNotifyChat}
                onToggle={setAlsoNotifyChat}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartEmailComposer;
