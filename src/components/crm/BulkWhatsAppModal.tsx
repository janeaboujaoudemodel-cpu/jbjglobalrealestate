import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Users, Briefcase, Building, TrendingUp, ExternalLink, Copy, Check } from "lucide-react";

interface BulkWhatsAppModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  preSelectedLeadIds?: string[];
}

type ContactType = 'client' | 'broker' | 'developer' | 'investor' | 'vendor' | 'other';

interface Recipient {
  id: string;
  full_name: string;
  phone_e164: string;
  contact_type: string;
}

const CONTACT_TYPES: { value: ContactType; label: string; icon: React.ReactNode }[] = [
  { value: 'client', label: 'Clients', icon: <Users className="h-4 w-4" /> },
  { value: 'broker', label: 'Brokers', icon: <Briefcase className="h-4 w-4" /> },
  { value: 'developer', label: 'Developers', icon: <Building className="h-4 w-4" /> },
  { value: 'investor', label: 'Investors', icon: <TrendingUp className="h-4 w-4" /> },
];

const BulkWhatsAppModal = ({ open, onClose, userId, preSelectedLeadIds }: BulkWhatsAppModalProps) => {
  const [selectedTypes, setSelectedTypes] = useState<Set<ContactType>>(new Set(['client']));
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [message, setMessage] = useState(
    `Greetings from JBJ Global Real Estate! 🏠✨

We're excited to share exclusive updates on the latest luxury properties in Dubai.

Visit our website to explore:
🔗 https://jbj.ae

Looking forward to assisting you!

Best regards,
JBJ Global Real Estate Team`
  );

  useEffect(() => {
    if (open) {
      fetchRecipients();
    }
  }, [open, selectedTypes, preSelectedLeadIds]);

  const fetchRecipients = async () => {
    setLoading(true);
    let query = supabase
      .from("crm_leads")
      .select("id, full_name, phone_e164, contact_type")
      .eq("import_approval_status", "approved")
      .not("phone_e164", "is", null);

    if (preSelectedLeadIds && preSelectedLeadIds.length > 0) {
      query = query.in("id", preSelectedLeadIds);
    } else if (selectedTypes.size > 0) {
      query = query.in("contact_type", Array.from(selectedTypes));
    }

    const { data } = await query.limit(100);
    setRecipients((data || []) as Recipient[]);
    setLoading(false);
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

  const getWhatsAppUrl = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message);
    toast.success("Message copied to clipboard");
  };

  const openWhatsApp = (recipient: Recipient) => {
    window.open(getWhatsAppUrl(recipient.phone_e164), '_blank');
    
    // Log activity
    supabase.from("crm_activities").insert({
      lead_id: recipient.id,
      user_id: userId,
      activity_type: "whatsapp_click" as const,
      metadata: { message_preview: message.substring(0, 100) }
    });
  };

  const copyLink = (recipient: Recipient) => {
    navigator.clipboard.writeText(getWhatsAppUrl(recipient.phone_e164));
    setCopiedId(recipient.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("WhatsApp link copied");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Bulk WhatsApp Messages
          </DialogTitle>
          <DialogDescription>
            Send WhatsApp messages to your contacts via click-to-chat links
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
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
            </div>
          )}

          {preSelectedLeadIds && (
            <Badge variant="secondary">
              {preSelectedLeadIds.length} selected contacts
            </Badge>
          )}

          {/* Message Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Message Template</Label>
              <Button variant="ghost" size="sm" onClick={copyMessage}>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          {/* Recipients List */}
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <Label>Recipients ({recipients.length})</Label>
            </div>
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="divide-y">
                {recipients.map((recipient) => (
                  <div 
                    key={recipient.id} 
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{recipient.full_name}</p>
                      <p className="text-sm text-muted-foreground">{recipient.phone_e164}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyLink(recipient)}
                      >
                        {copiedId === recipient.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => openWhatsApp(recipient)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
                {recipients.length === 0 && !loading && (
                  <div className="p-8 text-center text-muted-foreground">
                    No contacts with phone numbers found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <p className="font-medium text-amber-800">💡 How it works:</p>
            <p className="text-amber-700">
              Click "Open" to open WhatsApp Web/App with the pre-filled message for each contact. 
              Messages are sent one by one to comply with WhatsApp policies.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkWhatsAppModal;
