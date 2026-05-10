import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Loader2, ArrowRight, Upload, CheckCircle2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterBroker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [company, setCompany] = useState("");
  const [years, setYears] = useState("");
  const [rera, setRera] = useState("");
  const [brn, setBrn] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [languages, setLanguages] = useState("");
  const [areas, setAreas] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [bio, setBio] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    navigate("/auth?returnTo=/register/broker", { replace: true });
    return null;
  }

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim() || !company.trim()) {
      toast.error("Please fill in name, phone, and current company.");
      return;
    }
    setSubmitting(true);
    try {
      let cvUrl: string | null = null;
      if (cvFile) {
        const path = `${user.id}/cv-${Date.now()}-${cvFile.name}`;
        const { error: upErr } = await supabase.storage.from("broker-documents").upload(path, cvFile, { upsert: true });
        if (upErr) {
          // bucket may not exist for this account, fallback silently
          console.warn("CV upload failed:", upErr.message);
        } else {
          const { data: pub } = supabase.storage.from("broker-documents").getPublicUrl(path);
          cvUrl = pub.publicUrl;
        }
      }

      // Save identity
      await supabase.from("user_role_selections").upsert(
        {
          user_id: user.id,
          selected_role: "broker" as any,
          confirmed_accurate: true,
          email: user.email ?? null,
          full_name: fullName,
          phone_e164: phone,
          nationality: nationality || null,
        },
        { onConflict: "user_id" }
      );

      // Save broker profile
      const { error } = await supabase.from("broker_profiles").upsert(
        {
          user_id: user.id,
          display_name: fullName,
          email: user.email ?? null,
          phone,
          bio: bio || null,
          years_experience: years ? Number(years) : null,
          specializations: specializations ? specializations.split(",").map((s) => s.trim()).filter(Boolean) : null,
          languages: languages ? languages.split(",").map((s) => s.trim()).filter(Boolean) : null,
          custom_label: company,
          rera_card_url: cvUrl,
          broker_type: "external",
          is_active: true,
          is_public: false,
          verification_status: "pending",
        },
        { onConflict: "user_id" }
      );
      if (error) throw error;

      toast.success("Broker profile submitted for review!");
      navigate("/broker-dashboard", { replace: true });
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4">
      <SEOHead title="Broker Registration | JBJ Global" description="Register as a broker and access CRM, leads, and developer inventory." />
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]">Broker Registration</h1>
            <p className="text-[#1A1A1A]/80 text-sm">Tell us about your professional background</p>
          </div>
        </div>

        <section className="space-y-5 bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30 mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Personal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name *"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
            <Field label="Phone *"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+971..." /></Field>
            <Field label="Nationality"><Input value={nationality} onChange={(e) => setNationality(e.target.value)} /></Field>
            <Field label="LinkedIn URL"><Input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." /></Field>
          </div>
        </section>

        <section className="space-y-5 bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30 mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Professional</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Current Company / Brokerage *"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
            <Field label="Years of Experience"><Input type="number" value={years} onChange={(e) => setYears(e.target.value)} /></Field>
            <Field label="RERA Number"><Input value={rera} onChange={(e) => setRera(e.target.value)} /></Field>
            <Field label="BRN Number"><Input value={brn} onChange={(e) => setBrn(e.target.value)} /></Field>
            <Field label="Specializations (comma separated)" className="md:col-span-2"><Input value={specializations} onChange={(e) => setSpecializations(e.target.value)} placeholder="Off-plan, Luxury, Commercial" /></Field>
            <Field label="Languages (comma separated)"><Input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Arabic, Hindi" /></Field>
            <Field label="Preferred areas (comma separated)"><Input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Downtown, Marina" /></Field>
            <Field label="Short bio" className="md:col-span-2">
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A quick intro about you" />
            </Field>
          </div>
        </section>

        <section className="space-y-3 bg-[#F7F2EA] rounded-2xl p-6 border border-[#B89555]/30 mb-6">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">CV / Resume</h2>
          <p className="text-xs text-[#1A1A1A]/80">Optional — PDF or DOCX, max 10MB.</p>
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={() => cvInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" /> {cvFile ? "Change file" : "Upload CV"}
            </Button>
            {cvFile && (
              <span className="text-sm text-[#1A1A1A]/80 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> {cvFile.name}
              </span>
            )}
          </div>
        </section>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full h-14 text-base bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (<>Submit Registration <ArrowRight className="ml-2 w-5 h-5" /></>)}
        </Button>
        <p className="text-xs text-[#1A1A1A]/70 text-center mt-4 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Your details are reviewed by our team. You'll be notified once approved.
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
