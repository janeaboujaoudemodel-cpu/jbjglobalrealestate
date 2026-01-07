import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Send, Users, Briefcase, Building, TrendingUp, Loader2, Eye } from "lucide-react";

// Security: HTML escape function to prevent XSS/injection
const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Security: URL sanitization to block dangerous protocols
const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();
  // Block dangerous protocols
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return '#';
  }
  // Ensure http/https only for external links
  if (trimmed && !trimmed.match(/^https?:\/\//i)) {
    return 'https://' + trimmed;
  }
  return trimmed;
};

interface BulkEmailModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  preSelectedLeadIds?: string[];
}

type ContactType = 'client' | 'broker' | 'developer' | 'investor' | 'vendor' | 'other';

const CONTACT_TYPES: { value: ContactType; label: string; icon: React.ReactNode }[] = [
  { value: 'client', label: 'Clients', icon: <Users className="h-4 w-4" /> },
  { value: 'broker', label: 'Brokers', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'developer', label: 'Developers', icon: <Building className="h-4 w-4" /> },
  { value: 'investor', label: 'Investors', icon: <TrendingUp className="h-4 w-4" /> },
];

const BulkEmailModal = ({ open, onClose, userId, preSelectedLeadIds }: BulkEmailModalProps) => {
  const [step, setStep] = useState<"compose" | "preview" | "sending" | "complete">("compose");
  const [selectedTypes, setSelectedTypes] = useState<Set<ContactType>>(new Set(['client']));
  const [recipientCount, setRecipientCount] = useState(0);
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState({
    campaignName: "",
    subject: "",
    greeting: "Greetings from JJ Global Capital,",
    body: "",
    ctaText: "Visit Our Website",
    ctaUrl: "https://jjglobalcapital.com",
    closing: "Best regards,\nJJ Global Capital Team",
  });

  useEffect(() => {
    if (open) {
      fetchRecipientCount();
    }
  }, [open, selectedTypes, preSelectedLeadIds]);

  const fetchRecipientCount = async () => {
    let query = supabase
      .from("crm_leads")
      .select("id", { count: "exact", head: true })
      .eq("import_approval_status", "approved")
      .not("email_lower", "is", null);

    if (preSelectedLeadIds && preSelectedLeadIds.length > 0) {
      query = query.in("id", preSelectedLeadIds);
    } else if (selectedTypes.size > 0) {
      query = query.in("contact_type", Array.from(selectedTypes));
    }

    const { count } = await query;
    setRecipientCount(count || 0);
  };

  const toggleType = (type: ContactType) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  const generateEmailHtml = () => {
    // Security: Escape all user-provided content to prevent HTML injection
    const safeGreeting = escapeHtml(formData.greeting);
    const safeBody = escapeHtml(formData.body);
    const safeCtaText = escapeHtml(formData.ctaText);
    const safeCtaUrl = sanitizeUrl(formData.ctaUrl);
    const safeClosing = escapeHtml(formData.closing);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center;">
            <h1 style="color: #d4af37; margin: 0; font-size: 24px; letter-spacing: 2px;">JJ GLOBAL CAPITAL</h1>
            <p style="color: #cccccc; margin: 5px 0 0 0; font-size: 12px;">Real Estate Brokerage</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">${safeGreeting}</p>
            <div style="color: #333; font-size: 16px; line-height: 1.8; margin-bottom: 30px; white-space: pre-line;">${safeBody}</div>
            
            ${safeCtaUrl && safeCtaUrl !== '#' ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${safeCtaUrl}" style="display: inline-block; background: linear-gradient(135deg, #d4af37 0%, #b8962e 100%); color: #1a1a2e; padding: 15px 40px; text-decoration: none; font-weight: bold; border-radius: 5px; font-size: 14px; letter-spacing: 1px;">${safeCtaText}</a>
            </div>
            ` : ''}
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 30px; white-space: pre-line;">${safeClosing}</p>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #1a1a2e; padding: 25px; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0 0 10px 0;">
              JJ Global Capital | Real Estate Brokerage<br>
              Dubai, United Arab Emirates
            </p>
            <p style="color: #666; font-size: 10px; margin: 0;">
              © ${new Date().getFullYear()} JJ Global Capital. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSend = async () => {
    if (!formData.subject || !formData.body) {
      toast.error("Please fill in subject and body");
      return;
    }

    setSending(true);
    setStep("sending");

    try {
      // Create campaign record
      const { data: campaign, error: campaignError } = await supabase
        .from("crm_email_campaigns")
        .insert({
          user_id: userId,
          name: formData.campaignName || formData.subject,
          subject: formData.subject,
          html_content: generateEmailHtml(),
          target_contact_types: Array.from(selectedTypes),
          target_lead_ids: preSelectedLeadIds || null,
          status: "sending"
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Fetch recipients
      let query = supabase
        .from("crm_leads")
        .select("id, email_lower, full_name")
        .eq("import_approval_status", "approved")
        .not("email_lower", "is", null);

      if (preSelectedLeadIds && preSelectedLeadIds.length > 0) {
        query = query.in("id", preSelectedLeadIds);
      } else if (selectedTypes.size > 0) {
        query = query.in("contact_type", Array.from(selectedTypes));
      }

      const { data: recipients } = await query;

      if (!recipients || recipients.length === 0) {
        throw new Error("No recipients found");
      }

      // Call edge function to send emails
      const { error: sendError } = await supabase.functions.invoke("send-bulk-email", {
        body: {
          campaignId: campaign.id,
          subject: formData.subject,
          htmlContent: generateEmailHtml(),
          recipients: recipients.map(r => ({
            leadId: r.id,
            email: r.email_lower,
            name: r.full_name
          }))
        }
      });

      if (sendError) throw sendError;

      toast.success(`Sending emails to ${recipients.length} recipients`);
      setStep("complete");
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error(error.message || "Failed to send emails");
      setStep("compose");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Bulk Email Campaign
          </DialogTitle>
          <DialogDescription>
            Send professional emails to your contacts
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="compose" disabled={step === "sending"}>Compose</TabsTrigger>
            <TabsTrigger value="preview" disabled={step === "sending"}>Preview</TabsTrigger>
            <TabsTrigger value="complete" disabled={step !== "complete"}>Complete</TabsTrigger>
          </TabsList>

          <TabsContent value="compose" className="flex-1 overflow-auto space-y-4 mt-4">
            {/* Recipients Selection */}
            {!preSelectedLeadIds && (
              <div className="space-y-2">
                <Label>Send to contact types:</Label>
                <div className="flex flex-wrap gap-2">
                  {CONTACT_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={selectedTypes.has(type.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleType(type.value)}
                      className="gap-2"
                    >
                      {type.icon}
                      {type.label}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {recipientCount} recipients with email addresses
                </p>
              </div>
            )}

            {preSelectedLeadIds && (
              <Badge variant="secondary">
                Sending to {preSelectedLeadIds.length} selected contacts
              </Badge>
            )}

            {/* Email Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name (internal)</Label>
                <Input
                  id="campaignName"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                  placeholder="e.g., New Launch Announcement - Jan 2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g., Exclusive New Launch: Luxury Waterfront Residences"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="greeting">Greeting</Label>
                <Input
                  id="greeting"
                  value={formData.greeting}
                  onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body *</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Write your email content here..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ctaText">Button Text</Label>
                  <Input
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaUrl">Button Link</Label>
                  <Input
                    id="ctaUrl"
                    value={formData.ctaUrl}
                    onChange={(e) => setFormData({ ...formData, ctaUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="closing">Closing</Label>
                <Textarea
                  id="closing"
                  value={formData.closing}
                  onChange={(e) => setFormData({ ...formData, closing: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 flex items-center justify-between">
                <span className="text-sm font-medium">Preview</span>
                <Badge variant="outline">{recipientCount} recipients</Badge>
              </div>
              <div className="bg-gray-100 p-4">
                <div 
                  className="bg-white shadow-lg mx-auto max-w-[600px]"
                  dangerouslySetInnerHTML={{ __html: generateEmailHtml() }}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sending" className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <p className="text-lg font-medium">Sending emails...</p>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </div>
          </TabsContent>

          <TabsContent value="complete" className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Campaign Sent!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Emails are being delivered to {recipientCount} recipients
              </p>
              <Button onClick={onClose}>Close</Button>
            </div>
          </TabsContent>
        </Tabs>

        {step === "compose" && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="outline" onClick={() => setStep("preview")}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </DialogFooter>
        )}

        {step === "preview" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep("compose")}>Back</Button>
            <Button onClick={handleSend} disabled={sending || recipientCount === 0}>
              <Send className="h-4 w-4 mr-2" />
              Send to {recipientCount} recipients
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkEmailModal;
