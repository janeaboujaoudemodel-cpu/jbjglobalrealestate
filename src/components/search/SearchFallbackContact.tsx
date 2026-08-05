/**
 * SearchFallbackContact — the last layer of the hero search router.
 *
 * When neither the catalogue, the local intent rules, nor the AI router can
 * answer the visitor's sentence, we do NOT dead-end: this sheet opens with
 * a message already written for them, our contact details visible, and a
 * single field for their own email address. Sending routes the enquiry to
 * the JBJ advisory desk (capture-lead → owner notification).
 */
import { useEffect, useState } from "react";
import { Mail, Phone, MessageCircle, Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { COMPANY_NAP } from "@/config/companyNAP";
import { openWhatsApp, openTel } from "@/utils/contactActions";
import { toast } from "sonner";

const EMERALD_PAIR = "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #010806 100%)";
const COMPANY_PHONE = "+974 15 15 015";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The visitor's original sentence. */
  query: string;
}

const buildMessage = (query: string) =>
  `Hello JBJ Global Real Estate,\n\nI searched for: "${query}"\n\nI could not find the answer on the website. Could an advisor guide me on this and share the best available options?\n\nThank you.`;

export default function SearchFallbackContact({ open, onOpenChange, query }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState(() => buildMessage(query));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setMessage(buildMessage(query));
  }, [open, query]);

  const send = async () => {
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!message.trim()) {
      toast.error("Please write a short message");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("capture-lead", {
        body: {
          email: trimmed.toLowerCase(),
          fullName: name.trim() || undefined,
          source: "hero-search-fallback",
          pageSource: window.location.pathname,
          contactType: "visitor",
          message: message.trim().slice(0, 2000),
          context: { searchQuery: query.slice(0, 300) },
        },
      });
      if (error) throw error;
      toast.success(`Sent to ${COMPANY_NAP.email} — our advisory desk will reply to ${trimmed}.`);
      onOpenChange(false);
      setEmail("");
      setName("");
    } catch (err) {
      console.error("[SearchFallbackContact] send failed", err);
      toast.error("Could not send right now — please WhatsApp or call us instead.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-surface="light">
        <DialogHeader>
          <DialogTitle>Let our advisory desk answer this</DialogTitle>
          <DialogDescription>
            We could not match “{query}” automatically. Your message is ready — just add your email
            and we will reply from {COMPANY_NAP.email}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={2000} />

          <Button
            type="button"
            onClick={send}
            disabled={sending}
            data-surface="emerald"
            className="h-12 w-full text-sm font-semibold"
            style={{ backgroundImage: EMERALD_PAIR, color: "#FFFFFF" }}
          >
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send to JBJ advisory desk
          </Button>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button variant="outline" className="h-10 text-xs" onClick={() => openWhatsApp(COMPANY_PHONE, message)}>
              <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
            </Button>
            <Button variant="outline" className="h-10 text-xs" onClick={() => openTel(COMPANY_PHONE)}>
              <Phone className="mr-1.5 h-4 w-4" /> {COMPANY_PHONE}
            </Button>
            <Button variant="outline" className="h-10 text-xs" asChild>
              <a href={`mailto:${COMPANY_NAP.email}`}>
                <Mail className="mr-1.5 h-4 w-4" /> Email us
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
