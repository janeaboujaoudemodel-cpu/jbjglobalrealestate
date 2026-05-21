import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { SearchableMultiSelect, type MultiOption } from "@/components/ui/searchable-multiselect";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Loader2 } from "lucide-react";
import { COUNTRIES, flagEmoji } from "@/lib/countries";

const LANGUAGES = [
  { name: "English", iso: "GB" },
  { name: "Arabic", iso: "AE" },
  { name: "French", iso: "FR" },
  { name: "Spanish", iso: "ES" },
  { name: "German", iso: "DE" },
  { name: "Italian", iso: "IT" },
  { name: "Portuguese", iso: "PT" },
  { name: "Dutch", iso: "NL" },
  { name: "Russian", iso: "RU" },
  { name: "Ukrainian", iso: "UA" },
  { name: "Polish", iso: "PL" },
  { name: "Czech", iso: "CZ" },
  { name: "Greek", iso: "GR" },
  { name: "Turkish", iso: "TR" },
  { name: "Hebrew", iso: "IL" },
  { name: "Persian", iso: "IR" },
  { name: "Urdu", iso: "PK" },
  { name: "Hindi", iso: "IN" },
  { name: "Bengali", iso: "BD" },
  { name: "Punjabi", iso: "IN" },
  { name: "Tamil", iso: "IN" },
  { name: "Telugu", iso: "IN" },
  { name: "Malayalam", iso: "IN" },
  { name: "Sinhala", iso: "LK" },
  { name: "Nepali", iso: "NP" },
  { name: "Thai", iso: "TH" },
  { name: "Vietnamese", iso: "VN" },
  { name: "Indonesian", iso: "ID" },
  { name: "Malay", iso: "MY" },
  { name: "Filipino", iso: "PH" },
  { name: "Chinese", iso: "CN" },
  { name: "Cantonese", iso: "HK" },
  { name: "Japanese", iso: "JP" },
  { name: "Korean", iso: "KR" },
  { name: "Swahili", iso: "KE" },
  { name: "Amharic", iso: "ET" },
  { name: "Hausa", iso: "NG" },
  { name: "Yoruba", iso: "NG" },
  { name: "Afrikaans", iso: "ZA" },
  { name: "Romanian", iso: "RO" },
  { name: "Hungarian", iso: "HU" },
  { name: "Bulgarian", iso: "BG" },
  { name: "Serbian", iso: "RS" },
  { name: "Croatian", iso: "HR" },
  { name: "Albanian", iso: "AL" },
  { name: "Armenian", iso: "AM" },
  { name: "Georgian", iso: "GE" },
  { name: "Azerbaijani", iso: "AZ" },
  { name: "Kazakh", iso: "KZ" },
  { name: "Uzbek", iso: "UZ" },
  { name: "Swedish", iso: "SE" },
  { name: "Norwegian", iso: "NO" },
  { name: "Danish", iso: "DK" },
  { name: "Finnish", iso: "FI" },
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
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [countryName, setCountryName] = useState<string>("United Arab Emirates");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState<Interest>("investing");
  const [invType, setInvType] = useState<InvType>("off_plan");
  const [details, setDetails] = useState("");
  const [consent, setConsent] = useState(false);

  const nationalityOptions: MultiOption[] = useMemo(
    () => COUNTRIES.map((c) => ({ value: c.name, label: `${flagEmoji(c.iso)}  ${c.name}` })),
    []
  );
  const languageOptions: MultiOption[] = useMemo(
    () => LANGUAGES.map((l) => ({ value: l.name, label: `${flagEmoji(l.iso)}  ${l.name}` })),
    []
  );
  const dialOptions = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        value: c.name,
        label: `${flagEmoji(c.iso)}  ${c.code}  ${c.name}`,
      })),
    []
  );
  const selectedCountry = useMemo(
    () => COUNTRIES.find((c) => c.name === countryName),
    [countryName]
  );
  const selectedDialCode = selectedCountry?.code ?? "+971";
  const selectedDialDisplay = selectedCountry
    ? `${flagEmoji(selectedCountry.iso)}  ${selectedCountry.code}`
    : "🇦🇪  +971";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nationalities.length === 0) {
      toast.error("Please select at least one nationality.");
      return;
    }
    if (languages.length === 0) {
      toast.error("Please select at least one language.");
      return;
    }
    if (!consent) {
      toast.error("Please agree to be contacted to continue.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-concierge-register-lead", {
        body: {
          full_name: fullName,
          email,
          nationality: nationalities.join(" | "),
          language: languages.join(" | "),
          phone_country_code: selectedDialCode,
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
              <Label>Nationality (select one or more)</Label>
              <SearchableMultiSelect
                label="Select nationality"
                placeholder="Search nationality…"
                options={nationalityOptions}
                selected={nationalities}
                onChange={setNationalities}
              />
            </div>
            <div>
              <Label>Languages you speak</Label>
              <SearchableMultiSelect
                label="Select languages"
                placeholder="Search languages…"
                options={languageOptions}
                selected={languages}
                onChange={setLanguages}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <div className="flex gap-2">
                <div className="w-48">
                  <SearchableSelect
                    value={countryName}
                    onChange={setCountryName}
                    options={phoneOptions}
                    placeholder="Country"
                    searchPlaceholder="Search country…"
                    priorityItem="United Arab Emirates"
                    flagType="country"
                  />
                </div>
                <div className="flex items-center px-2 rounded-md bg-white border border-input text-sm text-[#1A1A1A]/80 min-w-[64px] justify-center">
                  {selectedDialCode}
                </div>
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

            <label className="flex items-start gap-2 text-xs text-[#1A1A1A]/70 cursor-pointer">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(!!v)}
                className="mt-0.5 h-4 w-4 bg-white border border-[#B89555]/60 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:text-[#1A1A1A] data-[state=checked]:border-[#B89555]"
              />
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
