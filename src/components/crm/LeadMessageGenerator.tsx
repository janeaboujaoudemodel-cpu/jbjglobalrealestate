import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Copy, MessageSquare, Mail, Loader2 } from "lucide-react";

interface LeadLike {
  id?: string;
  full_name?: string;
  lead_type?: string;
  email_lower?: string | null;
  phone_e164?: string | null;
  whatsapp_e164?: string | null;
  preferred_language?: string | null;
  preferred_project?: string | null;
  preferred_location?: string | null;
  pipeline_stage?: string | null;
  notes?: string | null;
  nationality?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_currency?: string | null;
}

const MESSAGE_TYPES = [
  "First Contact",
  "Follow-up",
  "Project Introduction",
  "Meeting Invitation",
  "Site Visit Invitation",
  "Payment Reminder",
  "Document Request",
  "Re-engagement",
  "Custom",
];
const CHANNELS = ["WhatsApp", "Email", "SMS"] as const;
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
];
const TONES = ["Professional", "Friendly", "Luxury", "Direct", "Formal"];

interface Props {
  lead: LeadLike;
}

export default function LeadMessageGenerator({ lead }: Props) {
  const [messageType, setMessageType] = useState("First Contact");
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("WhatsApp");
  const [language, setLanguage] = useState<string>(lead.preferred_language || "en");
  const [tone, setTone] = useState("Professional");
  const [custom, setCustom] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setOutput("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-lead-message", {
        body: {
          lead,
          message_type: messageType,
          channel,
          language,
          tone,
          custom_instruction: custom || undefined,
        },
      });
      if (error) throw error;
      if (!data?.message) throw new Error("No message returned");
      setOutput(data.message);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to generate message");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  };

  const sendWhatsApp = () => {
    if (!output) return;
    const phone = (lead.whatsapp_e164 || lead.phone_e164 || "").replace(/[^\d]/g, "");
    if (!phone) {
      toast.error("No WhatsApp/phone number on this lead");
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(output)}`, "_blank", "noopener");
  };

  const sendEmail = () => {
    if (!output) return;
    if (!lead.email_lower) {
      toast.error("No email on this lead");
      return;
    }
    let subject = "";
    let body = output;
    const m = output.match(/^Subject:\s*(.+)\n([\s\S]+)$/i);
    if (m) {
      subject = m[1].trim();
      body = m[2].trim();
    }
    window.open(
      `mailto:${lead.email_lower}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      "_blank",
      "noopener",
    );
  };

  return (
    <Card className="bg-[#FDFBF7] border border-[#1A1A1A]/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#1A1A1A] text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Message Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Message Type</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] z-[200]">
                {MESSAGE_TYPES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] z-[200]">
                {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] z-[200]">
                {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#FDFBF7] z-[200]">
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {messageType === "Custom" && (
          <div>
            <Label className="text-xs">Custom instruction</Label>
            <Textarea
              rows={2}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="What should the message say?"
            />
          </div>
        )}

        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Message
        </Button>

        {output && (
          <div className="space-y-2">
            <Textarea
              rows={8}
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="font-mono text-sm"
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={copy}>
                <Copy className="w-3.5 h-3.5 mr-1.5" />Copy
              </Button>
              <Button size="sm" variant="outline" onClick={sendWhatsApp}>
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Send via WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={sendEmail}>
                <Mail className="w-3.5 h-3.5 mr-1.5" />Send via Email
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
