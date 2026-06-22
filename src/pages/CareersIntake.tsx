import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, Upload, Plus, Trash2, ShieldCheck, FileText } from "lucide-react";
import { toast } from "sonner";

type Passport = { country: string; number: string; file_url?: string };

const SECTION = "rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7] p-6 md:p-7";
const TITLE = "text-[11px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 font-semibold mb-4 flex items-center gap-2";
const FIELD = "border-2 border-[#0A0A0A] bg-white text-[#1A1A1A] focus-visible:ring-[#0A0A0A]/20";
const GOLD_FIELD = "border-2 border-[#B89555] bg-white text-[#1A1A1A] focus-visible:ring-[#B89555]/30";

async function uploadFile(userId: string, candidateId: string, file: File, label: string): Promise<string | null> {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${candidateId}/${Date.now()}-${label}-${safe}`;
  const { error } = await supabase.storage.from("candidate-intake").upload(path, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (error) {
    toast.error(`Upload failed (${label}): ${error.message}`);
    return null;
  }
  // Private bucket → signed URL (long expiry for staff review)
  const { data: signed } = await supabase.storage
    .from("candidate-intake")
    .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
  return signed?.signedUrl || null;
}

function FileBox({
  label,
  value,
  onPick,
  accept = "image/*,application/pdf",
}: {
  label: string;
  value?: File | null;
  onPick: (f: File | null) => void;
  accept?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-[#1A1A1A]/60 font-medium">{label}</span>
      <div className="mt-1 flex items-center gap-3 rounded-lg border border-dashed border-[#B89555]/50 bg-white px-3 py-2.5 hover:border-[#B89555] transition">
        <Upload className="h-4 w-4 text-[#0A0A0A] shrink-0" />
        <span className="text-sm text-[#1A1A1A] truncate flex-1">
          {value?.name || <span className="text-[#1A1A1A]/45">Choose file…</span>}
        </span>
        <input
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0] || null)}
        />
        <span className="text-xs text-[#0A0A0A] underline underline-offset-2">Browse</span>
      </div>
    </label>
  );
}

export default function CareersIntake() {
  const { token = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [emiratesIdNumber, setEmiratesIdNumber] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [years, setYears] = useState<number>(0);
  const [languages, setLanguages] = useState("English");
  const [nationalities, setNationalities] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");

  // Files
  const [photo, setPhoto] = useState<File | null>(null);
  const [eidFront, setEidFront] = useState<File | null>(null);
  const [eidBack, setEidBack] = useState<File | null>(null);
  const [reraCard, setReraCard] = useState<File | null>(null);
  const [passports, setPassports] = useState<Array<{ country: string; number: string; file: File | null }>>([
    { country: "", number: "", file: null },
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        if (cancelled) return;
        setAuthed(sess.session?.user?.id || null);

        // Validate token & prefill (read-only via single-row lookup)
        const { data, error } = await supabase
          .from("hr_candidates")
          .select(
            "id, candidate_name, email, phone, position_applied, department_category, intake_token_expires_at, intake_submitted_at, status",
          )
          .eq("intake_token", token)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (!data) {
          setError("This intake link is invalid or has been revoked.");
        } else if (data.intake_submitted_at) {
          setError("You have already submitted your onboarding documents. Our team will be in touch.");
        } else if (data.intake_token_expires_at && new Date(data.intake_token_expires_at) < new Date()) {
          setError("This intake link has expired. Please contact our HR team to receive a fresh link.");
        } else {
          setCandidate(data);
          setFullName(data.candidate_name || "");
          setPhone(data.phone || "");
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Unable to verify intake link.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authed) {
      toast.error("Please sign in to submit your documents.");
      return;
    }
    if (!candidate) return;
    if (!fullName.trim() || !phone.trim()) {
      toast.error("Full name and phone are required.");
      return;
    }
    if (passports.length === 0 || passports.some((p) => !p.country || !p.number)) {
      toast.error("Add at least one passport with country and number.");
      return;
    }

    setBusy(true);
    try {
      const userId = authed;
      // Upload all files in parallel
      const [photoUrl, eidFrontUrl, eidBackUrl, reraUrl, ...passUrls] = await Promise.all([
        photo ? uploadFile(userId, candidate.id, photo, "photo") : Promise.resolve(undefined),
        eidFront ? uploadFile(userId, candidate.id, eidFront, "eid-front") : Promise.resolve(undefined),
        eidBack ? uploadFile(userId, candidate.id, eidBack, "eid-back") : Promise.resolve(undefined),
        reraCard ? uploadFile(userId, candidate.id, reraCard, "rera") : Promise.resolve(undefined),
        ...passports.map((p, i) =>
          p.file ? uploadFile(userId, candidate.id, p.file, `passport-${i + 1}`) : Promise.resolve(undefined),
        ),
      ]);

      const payload = {
        intake_token: token,
        full_name: fullName.trim(),
        phone: phone.trim(),
        photo_url: photoUrl || undefined,
        emirates_id_number: emiratesIdNumber.trim() || undefined,
        emirates_id_front_url: eidFrontUrl || undefined,
        emirates_id_back_url: eidBackUrl || undefined,
        passports: passports.map((p, i) => ({
          country: p.country.trim(),
          number: p.number.trim(),
          file_url: passUrls[i] || undefined,
        })),
        rera_number: reraNumber.trim() || null,
        rera_card_url: reraUrl || null,
        languages: languages.split(",").map((s) => s.trim()).filter(Boolean),
        nationalities: nationalities.split(",").map((s) => s.trim()).filter(Boolean),
        current_company: currentCompany.trim() || null,
        total_years_experience: Number(years) || 0,
        date_of_birth: dob || null,
        gender: gender || null,
      };

      const { data, error } = await supabase.functions.invoke("hr-intake-submit", { body: payload });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSubmitted(true);
      toast.success("Documents submitted — thank you!");
    } catch (e: any) {
      toast.error(e?.message || "Submission failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#0A0A0A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Intake unavailable</h1>
          <p className="mt-3 text-[#1A1A1A]/70">{error}</p>
          <Link to="/careers" className="mt-6 inline-block text-[#0A0A0A] underline">
            Back to Careers
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <CheckCircle2 className="h-12 w-12 text-[color:var(--emerald-1)] mx-auto" />
          <h1 className="mt-4 text-2xl font-semibold text-[#1A1A1A]">Documents received</h1>
          <p className="mt-3 text-[#1A1A1A]/70">
            Thank you, {fullName.split(" ")[0]}. Our HR team will review your submission and send your formal job
            offer shortly.
          </p>
          <Link to="/" className="mt-6 inline-block text-[#0A0A0A] underline">
            Return to JBJ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F2EA] py-10 md:py-14">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[#0A0A0A] font-semibold">
            JBJ Global Real Estate · Applicant Intake
          </p>
          <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-[#1A1A1A]">
            Welcome, {candidate?.candidate_name?.split(" ")[0] || "candidate"}
          </h1>
          <p className="mt-3 text-[#1A1A1A]/70 max-w-2xl">
            Congratulations on being approved for{" "}
            <strong>{candidate?.position_applied || candidate?.department_category || "your role"}</strong>. Please
            complete the secure form below so we can issue your formal job offer.
          </p>
          {!authed && (
            <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You must be signed in to submit your documents.{" "}
              <Link to={`/auth?redirect=/careers/intake/${token}`} className="underline font-medium">
                Sign in to continue
              </Link>
              .
            </div>
          )}
        </header>

        <form onSubmit={onSubmit} className="space-y-5">
          <section className={SECTION}>
            <h3 className={TITLE}>
              <ShieldCheck className="h-3.5 w-3.5 text-[#0A0A0A]" /> Personal details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#1A1A1A]">Full name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={`mt-1 ${FIELD}`} required />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className={`mt-1 ${FIELD}`} required />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Date of birth</Label>
                <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={`mt-1 ${FIELD}`} />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Gender</Label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className={`mt-1 w-full h-10 rounded-md px-3 text-sm ${FIELD}`}
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-[#1A1A1A]">Nationalities (comma-separated)</Label>
                <Input
                  value={nationalities}
                  onChange={(e) => setNationalities(e.target.value)}
                  placeholder="e.g. United Arab Emirates, Lebanon"
                  className={`mt-1 ${GOLD_FIELD}`}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-[#1A1A1A]">Languages spoken (comma-separated)</Label>
                <Input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="e.g. English, Arabic, French"
                  className={`mt-1 ${GOLD_FIELD}`}
                  required
                />
              </div>
            </div>
          </section>

          <section className={SECTION}>
            <h3 className={TITLE}>
              <FileText className="h-3.5 w-3.5 text-[#0A0A0A]" /> Photo & Emirates ID
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileBox label="Professional photo" value={photo} onPick={setPhoto} accept="image/*" />
              <div>
                <Label className="text-[#1A1A1A]">Emirates ID number</Label>
                <Input
                  value={emiratesIdNumber}
                  onChange={(e) => setEmiratesIdNumber(e.target.value)}
                  placeholder="784-XXXX-XXXXXXX-X"
                  className={`mt-1 ${FIELD}`}
                />
              </div>
              <FileBox label="Emirates ID — front" value={eidFront} onPick={setEidFront} />
              <FileBox label="Emirates ID — back" value={eidBack} onPick={setEidBack} />
            </div>
          </section>

          <section className={SECTION}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${TITLE} mb-0`}>
                <FileText className="h-3.5 w-3.5 text-[#0A0A0A]" /> Passport(s)
              </h3>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPassports((arr) => [...arr, { country: "", number: "", file: null }])}
                className="border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add passport
              </Button>
            </div>
            <div className="space-y-4">
              {passports.map((p, i) => (
                <div key={i} className="rounded-lg border border-[#B89555]/25 bg-white p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[#1A1A1A]">Country</Label>
                    <Input
                      value={p.country}
                      onChange={(e) =>
                        setPassports((arr) => arr.map((x, j) => (j === i ? { ...x, country: e.target.value } : x)))
                      }
                      className={`mt-1 ${GOLD_FIELD}`}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-[#1A1A1A]">Passport #</Label>
                    <Input
                      value={p.number}
                      onChange={(e) =>
                        setPassports((arr) => arr.map((x, j) => (j === i ? { ...x, number: e.target.value } : x)))
                      }
                      className={`mt-1 ${FIELD}`}
                      required
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <FileBox
                        label="Passport scan"
                        value={p.file}
                        onPick={(f) =>
                          setPassports((arr) => arr.map((x, j) => (j === i ? { ...x, file: f } : x)))
                        }
                      />
                    </div>
                    {passports.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => setPassports((arr) => arr.filter((_, j) => j !== i))}
                        className="border-rose-400/40 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={SECTION}>
            <h3 className={TITLE}>
              <FileText className="h-3.5 w-3.5 text-[#0A0A0A]" /> Real estate experience
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-[#1A1A1A]">Current / last company</Label>
                <Input
                  value={currentCompany}
                  onChange={(e) => setCurrentCompany(e.target.value)}
                  className={`mt-1 ${FIELD}`}
                />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Total years in real estate</Label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={years}
                  onChange={(e) => setYears(parseInt(e.target.value || "0", 10))}
                  className={`mt-1 ${FIELD}`}
                />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">RERA number (if any)</Label>
                <Input value={reraNumber} onChange={(e) => setReraNumber(e.target.value)} className={`mt-1 ${GOLD_FIELD}`} />
              </div>
              <FileBox label="RERA card (if any)" value={reraCard} onPick={setReraCard} />
            </div>
          </section>

          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[#1A1A1A]/55 max-w-md">
              Your documents are encrypted at rest and accessible only to authorised JBJ HR personnel.
            </p>
            <Button
              type="submit"
              disabled={busy || !authed}
              className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white px-7 h-11"
              data-allow-dark-cta
            >
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Submit my documents
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
