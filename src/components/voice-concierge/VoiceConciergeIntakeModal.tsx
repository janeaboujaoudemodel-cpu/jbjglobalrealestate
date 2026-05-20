import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Loader2 } from "lucide-react";

const COUNTRIES = [
  { name: "United Arab Emirates", code: "+971" },
  { name: "Saudi Arabia", code: "+966" },
  { name: "Qatar", code: "+974" },
  { name: "Kuwait", code: "+965" },
  { name: "Oman", code: "+968" },
  { name: "Bahrain", code: "+973" },
  { name: "United Kingdom", code: "+44" },
  { name: "United States", code: "+1" },
  { name: "India", code: "+91" },
  { name: "Pakistan", code: "+92" },
  { name: "Egypt", code: "+20" },
  { name: "Jordan", code: "+962" },
  { name: "Lebanon", code: "+961" },
  { name: "Türkiye", code: "+90" },
  { name: "France", code: "+33" },
  { name: "Germany", code: "+49" },
  { name: "Italy", code: "+39" },
  { name: "Spain", code: "+34" },
  { name: "Russia", code: "+7" },
  { name: "China", code: "+86" },
  { name: "Singapore", code: "+65" },
  { name: "Hong Kong", code: "+852" },
  { name: "Australia", code: "+61" },
  { name: "Canada", code: "+1" },
  { name: "South Africa", code: "+27" },
  { name: "Nigeria", code: "+234" },
];

type Interest = "investing" | "partnering" | "careers" | "other";
type InvType = "off_plan" | "secondary";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (leadId: string) => void;
}

export default function VoiceConciergeIntakeModal({ open, onOpenChange, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<Interest>("investing");
  const [invType, setInvType] = useState<InvType>("off_plan");
  const [details, setDetails] = useState("");
  const [consent, setConsent] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-concierge-register-lead", {
        body: {
          full_name: fullName,
          email,
          nationality,
          phone_country_code: countryCode,
          phone_number: phone,
          interest,
          investment_type: interest === "investing" ? invType : null,
          details: interest === "investing" ? null : details,
          consent_marketing: consent,
        },
      });
      if (error || !data?.lead_id) {
        throw new Error(error?.message || data?.error || "Failed to register");
      }
      try {
        localStorage.setItem(
          "voice_concierge_lead",
          JSON.stringify({ id: data.lead_id, at: Date.now() })
        );
      } catch {}
      toast.success("Connecting your concierge…");
      onSuccess(data.lead_id);
    } catch (err: any) {
      toast.error(err?.message || "Could not start. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle className="font-semibold text-xl flex items-center gap-2">
            <Phone className="w-5 h-5" /> Speak with our Concierge
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            A few details, and your private line opens instantly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="vc-name">Full name</Label>
              <Input id="vc-name" required minLength={2} value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white" />
            </div>
            <div>
              <Label htmlFor="vc-email">Email</Label>
              <Input id="vc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white" />
            </div>
            <div>
              <Label htmlFor="vc-nat">Nationality</Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {COUNTRIES.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-32 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((c) => <SelectItem key={c.name + c.code} value={c.code}>{c.code} {c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input required inputMode="tel" pattern="[0-9 ]{5,}" placeholder="50 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white flex-1" />
              </div>
            </div>
            <div>
              <Label>Your interest</Label>
              <RadioGroup value={interest} onValueChange={(v) => setInterest(v as Interest)} className="grid grid-cols-2 gap-2 mt-1">
                {(["investing", "partnering", "careers", "other"] as Interest[]).map((v) => (
                  <label key={v} className="flex items-center gap-2 bg-white border border-[#B89555]/30 rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value={v} /> <span className="capitalize text-sm">{v}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {interest === "investing" && (
              <div>
                <Label>Investment type</Label>
                <RadioGroup value={invType} onValueChange={(v) => setInvType(v as InvType)} className="grid grid-cols-2 gap-2 mt-1">
                  <label className="flex items-center gap-2 bg-white border border-[#B89555]/30 rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="off_plan" /> <span className="text-sm">Off-plan</span>
                  </label>
                  <label className="flex items-center gap-2 bg-white border border-[#B89555]/30 rounded-md px-3 py-2 cursor-pointer">
                    <RadioGroupItem value="secondary" /> <span className="text-sm">Secondary</span>
                  </label>
                </RadioGroup>
              </div>
            )}

            {interest !== "investing" && (
              <div>
                <Label htmlFor="vc-details">
                  {interest === "partnering" ? "Tell us about your proposal" : interest === "careers" ? "Role or area of interest" : "How can we help?"}
                </Label>
                <Textarea id="vc-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} className="bg-white" />
              </div>
            )}

            <label className="flex items-start gap-2 text-xs text-[#1A1A1A]/70">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
              <span>I agree to be contacted by JBJ GLOBAL REAL ESTATE about my enquiry.</span>
            </label>
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
            {submitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening line…</>) : (<>Start the call</>)}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
