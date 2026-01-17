import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageCircle, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

interface ChatTrackerProps {
  leadId?: string;
  phoneNumber?: string;
  onChatLogged?: () => void;
}

const ChatTracker = ({ leadId, phoneNumber: initialPhone, onChatLogged }: ChatTrackerProps) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [contactNumber, setContactNumber] = useState(initialPhone || "");
  const [platform, setPlatform] = useState("whatsapp");
  const [messageCount, setMessageCount] = useState(1);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const openWhatsApp = () => {
    if (contactNumber) {
      const cleanNumber = contactNumber.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanNumber}`, '_blank');
    }
  };

  const saveChatLog = async () => {
    if (!user || !contactNumber) {
      toast.error("Contact number is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('broker_chat_logs').insert({
        user_id: user.id,
        lead_id: leadId || null,
        platform,
        contact_number: contactNumber,
        message_count: messageCount,
        last_message_at: new Date().toISOString(),
        notes: notes || null
      });

      if (error) throw error;

      // Update activity stats
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('broker_activity_stats').upsert({
        user_id: user.id,
        date: today,
        chats_sent: messageCount
      }, { 
        onConflict: 'user_id,date',
        ignoreDuplicates: false 
      });

      // Award points
      await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: 5,
        transaction_type: 'chat_logged',
        description: 'Logged a chat',
        reference_type: 'chat'
      });

      toast.success("Chat logged successfully! +5 points");
      setIsOpen(false);
      resetForm();
      onChatLogged?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to log chat");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setPlatform("whatsapp");
    setMessageCount(1);
    setNotes("");
    if (!initialPhone) setContactNumber("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <MessageCircle className="h-4 w-4 mr-1" />
          Log Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Track Chat Activity</DialogTitle>
          <DialogDescription>
            Log your messaging activity for this lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Contact Number */}
          <div>
            <Label htmlFor="contact">Contact Number</Label>
            <div className="flex gap-2">
              <Input
                id="contact"
                type="tel"
                placeholder="+971 XX XXX XXXX"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant="secondary" 
                size="icon"
                onClick={openWhatsApp}
                disabled={!contactNumber}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Platform */}
          <div>
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message Count */}
          <div>
            <Label htmlFor="count">Number of Messages</Label>
            <Input
              id="count"
              type="number"
              min="1"
              value={messageCount}
              onChange={(e) => setMessageCount(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes / Summary</Label>
            <Textarea
              id="notes"
              placeholder="Chat summary..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={openWhatsApp}
              disabled={!contactNumber}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Open WhatsApp
            </Button>
            <Button 
              className="flex-1"
              onClick={saveChatLog}
              disabled={saving || !contactNumber}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Log"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatTracker;
