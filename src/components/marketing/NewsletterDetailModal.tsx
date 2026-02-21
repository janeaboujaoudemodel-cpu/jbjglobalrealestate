import { useState } from "react";
import { Loader2, User, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";

interface NewsletterDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (fullName: string, phone: string) => void;
  email: string;
}

const NewsletterDetailModal = ({ isOpen, onClose, onComplete, email }: NewsletterDetailModalProps) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setSubmitting(true);
    await onComplete(fullName.trim(), phone);
    setSubmitting(false);
    setFullName("");
    setPhone("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 max-w-md z-[10050]">
        <DialogHeader className="text-center space-y-3 pt-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center">
            <User className="w-8 h-8 text-gold" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Email Received Successfully
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
            <span className="font-medium text-foreground">{email}</span> has been registered.
            <br />To personalize what you receive, please add your details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="detail-name" className="flex items-center gap-2 text-foreground font-medium">
              <User className="h-4 w-4 text-gold" />
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="detail-name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="border-2 border-gold/50 focus:border-gold"
              required
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detail-phone" className="flex items-center gap-2 text-foreground font-medium">
              <Phone className="h-4 w-4 text-gold" />
              Phone Number
            </Label>
            <PhoneInput
              value={phone}
              onChange={(val) => setPhone(val || "")}
              placeholder="+971 50 123 4567"
              variant="light"
            />
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 bg-gold/5 rounded-lg border border-gold/20">
            <input type="checkbox" defaultChecked className="mt-0.5 accent-[hsl(var(--gold))]" />
            <span>
              I consent to receive marketing communications from JBJ Global Real Estate. 
              You can unsubscribe anytime from the email or from your Profile → Settings.
            </span>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-gold/40"
              onClick={onClose}
              disabled={submitting}
            >
              Skip
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={submitting || !fullName.trim()}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Complete
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewsletterDetailModal;
