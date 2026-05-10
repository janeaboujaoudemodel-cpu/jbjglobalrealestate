import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

type Intent = "currently_invested" | "looking_to_buy";

interface OwnedProperty {
  project_name: string;
  unit_number: string;
  purchase_price: string;
  purchase_date: string;
}

const emptyOwned: OwnedProperty = {
  project_name: "",
  unit_number: "",
  purchase_price: "",
  purchase_date: "",
};

export default function RegisterInvestor() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [intent, setIntent] = useState<Intent>("looking_to_buy");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [residency, setResidency] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [areas, setAreas] = useState("");
  const [unitTypes, setUnitTypes] = useState("");
  const [timeline, setTimeline] = useState("");
  const [financing, setFinancing] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [owned, setOwned] = useState<OwnedProperty[]>([{ ...emptyOwned }]);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    navigate("/auth?returnTo=/register/investor", { replace: true });
    return null;
  }

  const updateOwned = (i: number, field: keyof OwnedProperty, value: string) => {
    setOwned((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));
  };

  const addOwned = () => setOwned((prev) => [...prev, { ...emptyOwned }]);
  const removeOwned = (i: number) => setOwned((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim()) {
      toast.error("Please provide your full name and phone number.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save core identity to user_role_selections
      await supabase.from("user_role_selections").upsert(
        {
          user_id: user.id,
          selected_role: "investor" as any,
          confirmed_accurate: true,
          email: user.email ?? null,
          full_name: fullName,
          phone_e164: phone,
          nationality: nationality || null,
        },
        { onConflict: "user_id" }
      );

      // 2. Save intake preferences
      const { error: intakeErr } = await supabase.from("investor_intake").insert({
        user_id: user.id,
        intent,
        full_name: fullName,
        phone_e164: phone,
        nationality: nationality || null,
        residency_status: residency || null,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        preferred_areas: areas ? areas.split(",").map((s) => s.trim()).filter(Boolean) : null,
        unit_types: unitTypes ? unitTypes.split(",").map((s) => s.trim()).filter(Boolean) : null,
        timeline: timeline || null,
        financing: financing || null,
        investment_goal: goal || null,
        notes: notes || null,
      });
      if (intakeErr) throw intakeErr;

      // 3. If currently invested, save each property to client_investors
      if (intent === "currently_invested") {
        const validOwned = owned.filter((o) => o.project_name.trim());
        if (validOwned.length > 0) {
          await supabase.from("client_investors").insert(
            validOwned.map((o) => ({
              client_name: fullName,
              email: user.email ?? null,
              phone,
              project_name: o.project_name,
              unit_number: o.unit_number || null,
              purchase_price: o.purchase_price ? Number(o.purchase_price) : null,
              purchase_date: o.purchase_date || null,
            }))
          );
        }
      }

      toast.success("Investor profile saved!");
      navigate("/my-dashboard", { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4">
      <SEOHead title="Investor Registration | JBJ Global" description="Complete your investor profile to access tailored properties and intelligence." />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Investor Registration</h1>
            <p className="text-[#1A1A1A]/80 text-sm">Tell us about your investment profile</p>
          </div>
        </div>

        <section className="space-y-5 bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30 mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name *"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="As on passport" /></Field>
            <Field label="Phone (with country code) *"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971..." /></Field>
            <Field label="Nationality"><Input value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder="e.g. Indian" /></Field>
            <Field label="Residency Status">
              <Select value={residency} onValueChange={setResidency}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uae_resident">UAE Resident</SelectItem>
                  <SelectItem value="overseas">Overseas</SelectItem>
                  <SelectItem value="visiting">Visiting</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section className="space-y-5 bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30 mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Your Status</h2>
          <RadioGroup value={intent} onValueChange={(v) => setIntent(v as Intent)} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className={`p-4 rounded-xl border-2 cursor-pointer ${intent === "looking_to_buy" ? "border-[#1A1A1A] bg-[#FDFBF7]" : "border-[#B89555]/30 bg-[#FDFBF7]"}`}>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="looking_to_buy" />
                <div>
                  <div className="font-semibold text-[#1A1A1A]">Looking to buy</div>
                  <div className="text-xs text-[#1A1A1A]/80">I'm searching for properties to invest in</div>
                </div>
              </div>
            </label>
            <label className={`p-4 rounded-xl border-2 cursor-pointer ${intent === "currently_invested" ? "border-[#1A1A1A] bg-[#FDFBF7]" : "border-[#B89555]/30 bg-[#FDFBF7]"}`}>
              <div className="flex items-start gap-3">
                <RadioGroupItem value="currently_invested" />
                <div>
                  <div className="font-semibold text-[#1A1A1A]">Currently invested</div>
                  <div className="text-xs text-[#1A1A1A]/80">I already own one or more properties</div>
                </div>
              </div>
            </label>
          </RadioGroup>
        </section>

        {intent === "looking_to_buy" && (
          <section className="space-y-5 bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30 mb-6">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">What are you looking for?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Budget Min (AED)"><Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="500000" /></Field>
              <Field label="Budget Max (AED)"><Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="3000000" /></Field>
              <Field label="Preferred Areas (comma separated)"><Input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Downtown, Marina, JVC" /></Field>
              <Field label="Unit Types (comma separated)"><Input value={unitTypes} onChange={(e) => setUnitTypes(e.target.value)} placeholder="1BR, 2BR, Townhouse" /></Field>
              <Field label="Timeline">
                <Select value={timeline} onValueChange={setTimeline}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (0-30 days)</SelectItem>
                    <SelectItem value="3m">Within 3 months</SelectItem>
                    <SelectItem value="6m">Within 6 months</SelectItem>
                    <SelectItem value="12m">Within 12 months</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Financing">
                <Select value={financing} onValueChange={setFinancing}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="payment_plan">Developer payment plan</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Investment Goal" className="md:col-span-2">
                <Select value={goal} onValueChange={setGoal}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rental_yield">Rental yield</SelectItem>
                    <SelectItem value="capital_growth">Capital growth</SelectItem>
                    <SelectItem value="golden_visa">Golden Visa qualification</SelectItem>
                    <SelectItem value="primary_residence">Primary residence</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>
        )}

        {intent === "currently_invested" && (
          <section className="space-y-5 bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Your properties</h2>
              <Button type="button" variant="outline" size="sm" onClick={addOwned}>+ Add property</Button>
            </div>
            {owned.map((p, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#FDFBF7] rounded-xl border border-[#B89555]/30 relative">
                <Field label="Project name *"><Input value={p.project_name} onChange={(e) => updateOwned(i, "project_name", e.target.value)} /></Field>
                <Field label="Unit number"><Input value={p.unit_number} onChange={(e) => updateOwned(i, "unit_number", e.target.value)} /></Field>
                <Field label="Purchase price (AED)"><Input type="number" value={p.purchase_price} onChange={(e) => updateOwned(i, "purchase_price", e.target.value)} /></Field>
                <Field label="Purchase date"><Input type="date" value={p.purchase_date} onChange={(e) => updateOwned(i, "purchase_date", e.target.value)} /></Field>
                {owned.length > 1 && (
                  <button type="button" onClick={() => removeOwned(i)} className="absolute top-2 right-2 text-xs text-red-600 hover:underline">Remove</button>
                )}
              </div>
            ))}
          </section>
        )}

        <section className="space-y-5 bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30 mb-6">
          <Field label="Notes / specific requirements">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Anything else our advisors should know" />
          </Field>
        </section>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full h-14 text-base bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Submit & Continue <ArrowRight className="ml-2 w-5 h-5" /></>)}
        </Button>
        <p className="text-xs text-[#1A1A1A]/70 text-center mt-4 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Your information is securely stored in your private account.
        </p>
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-sm text-[#1A1A1A]/80">{label}</Label>
      {children}
    </div>
  );
}
