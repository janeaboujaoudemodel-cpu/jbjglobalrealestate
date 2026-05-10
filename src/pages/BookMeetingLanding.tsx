/**
 * Public /book landing page — visitors request a meeting slot with Jane.
 * Constraints: Mon–Fri, 10:00–17:00 Dubai time, ≥1 day in advance.
 * Office (One Central, DIFC area) or Online (Zoom / Google Meet).
 * Insert is validated server-side by validate_meeting_booking_slot().
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Video, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const LANGUAGES = [
  ["en", "English"], ["ar", "العربية"], ["fr", "Français"],
  ["es", "Español"], ["ru", "Русский"], ["zh", "中文"], ["de", "Deutsch"],
] as const;

function nextBusinessDays(count: number) {
  const out: Date[] = [];
  const now = new Date();
  let d = new Date(now);
  d.setDate(d.getDate() + 1); // ≥1 day in advance
  while (out.length < count) {
    const day = d.getDay(); // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) out.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export default function BookMeetingLanding() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const days = useMemo(() => nextBusinessDays(14), []);

  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
  const [selectedTime, setSelectedTime] = useState<string>("11:00");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [language, setLanguage] = useState("en");
  const [locationType, setLocationType] = useState<"office" | "online">("office");
  const [platform, setPlatform] = useState<"zoom" | "google_meet">("google_meet");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { when: string }>(null);

  // Token prefill
  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("meeting_booking_tokens")
        .select("contact_name, contact_email, contact_company, default_language, default_location_type")
        .eq("token", token)
        .maybeSingle();
      if (data) {
        if (data.contact_name) setName(data.contact_name);
        if (data.contact_email) setEmail(data.contact_email);
        if (data.contact_company) setCompany(data.contact_company);
        if (data.default_language) setLanguage(data.default_language);
        if (data.default_location_type) setLocationType(data.default_location_type);
      }
    })();
  }, [token]);

  const submit = async () => {
    if (!name.trim() || !email.includes("@")) {
      toast.error("Please enter your name and a valid email.");
      return;
    }
    setBusy(true);
    try {
      // Build a Dubai-local timestamp string then let Postgres parse it
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      const bookedFor = `${y}-${m}-${d}T${selectedTime}:00+04:00`;

      const { error } = await (supabase as any).from("meeting_bookings").insert({
        booked_for_at: bookedFor,
        duration_min: 60,
        visitor_name: name.trim(),
        visitor_email: email.trim().toLowerCase(),
        visitor_phone: phone.trim() || null,
        visitor_company: company.trim() || null,
        language,
        location_type: locationType,
        online_platform: locationType === "online" ? platform : null,
        notes: notes.trim() || null,
        source: token ? "branded_email" : "public_landing",
        ref_token: token || null,
      });
      if (error) throw error;
      setDone({
        when: selectedDate.toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        }) + ` at ${selectedTime} (Dubai)`,
      });
    } catch (e: any) {
      toast.error(e.message ?? "Booking failed");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        
        <div className="max-w-xl w-full bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-10 text-center">
          <CheckCircle2 className="w-14 h-14 text-[#B89555] mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Your request is in.</h1>
          <p className="text-[#1A1A1A]/80 mb-1">{done.when}</p>
          <p className="text-sm text-[#1A1A1A]/70 mt-4">
            You'll receive a confirmation email shortly. Jane will follow up personally with the exact location or meeting link.
          </p>
          <a href="/" className="inline-block mt-6 text-sm text-[#1A1A1A] underline underline-offset-4 decoration-[#B89555]">
            Return to JBJ GLOBAL REAL ESTATE
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">

      <header className="border-b border-[#B89555]/20 bg-[#FDFBF7]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="font-serif text-lg tracking-wide">JBJ GLOBAL REAL ESTATE</a>
          <span className="text-xs text-[#1A1A1A]/60 hidden sm:block">Private executive meeting · Dubai</span>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-12 pb-6 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[#B89555] mb-3">Founder Calendar</p>
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">Book a meeting with Jane Bou Jaoude</h1>
        <p className="text-[#1A1A1A]/75 max-w-2xl mx-auto">
          A private 60-minute consultation — investment briefing, off-market access, or a working session.
          Monday to Friday, 10:00–17:00 Dubai time. Office in Dubai or online (Zoom / Google Meet).
        </p>
      </section>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date + Time */}
          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[#B89555]" />
              <h2 className="font-semibold">Choose a date</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
              {days.map((d) => {
                const sel = d.toDateString() === selectedDate.toDateString();
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => setSelectedDate(d)}
                    className={`px-2 py-3 rounded-lg text-xs border transition ${
                      sel
                        ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A]"
                        : "bg-white border-[#B89555]/20 text-[#1A1A1A]/80 hover:border-[#B89555]/60"
                    }`}
                  >
                    <div className="font-medium">{d.toLocaleDateString("en-GB", { weekday: "short" })}</div>
                    <div className="text-base">{d.getDate()}</div>
                    <div className="opacity-70">{d.toLocaleDateString("en-GB", { month: "short" })}</div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#B89555]" />
              <h2 className="font-semibold">Choose a time (Dubai)</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTime(t)}
                  className={`py-2 rounded-lg text-sm border transition ${
                    selectedTime === t
                      ? "bg-[#EFE6D6] border-[#B89555]"
                      : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Visitor details */}
          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-6 space-y-3">
            <h2 className="font-semibold mb-1">Your details</h2>

            <div>
              <Label className="text-xs">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-white" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label className="text-xs">Phone (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Company (optional)</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label className="text-xs">Preferred language</Label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[#B89555]/30 bg-white text-sm"
                >
                  {LANGUAGES.map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">Where would you like to meet?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLocationType("office")}
                  className={`px-3 py-3 rounded-lg text-sm border flex items-center gap-2 justify-center ${
                    locationType === "office"
                      ? "bg-[#EFE6D6] border-[#B89555]"
                      : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                >
                  <MapPin className="w-4 h-4" /> At our Dubai office
                </button>
                <button
                  onClick={() => setLocationType("online")}
                  className={`px-3 py-3 rounded-lg text-sm border flex items-center gap-2 justify-center ${
                    locationType === "online"
                      ? "bg-[#EFE6D6] border-[#B89555]"
                      : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                >
                  <Video className="w-4 h-4" /> Online
                </button>
              </div>
              {locationType === "online" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => setPlatform("google_meet")}
                    className={`px-3 py-2 rounded-lg text-xs border ${
                      platform === "google_meet" ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20"
                    }`}
                  >Google Meet</button>
                  <button
                    onClick={() => setPlatform("zoom")}
                    className={`px-3 py-2 rounded-lg text-xs border ${
                      platform === "zoom" ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20"
                    }`}
                  >Zoom</button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">What would you like to discuss? (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white min-h-[80px]"
                placeholder="e.g. Branded residences under 15M AED, Golden Visa, off-market opportunities…"
              />
            </div>

            <Button variant="gold" onClick={submit} disabled={busy} className="w-full mt-2">
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Request {selectedTime} on {selectedDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </Button>
            <p className="text-[11px] text-[#1A1A1A]/55 text-center">
              All meetings are subject to confirmation. Bookings require at least 24 hours notice.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
