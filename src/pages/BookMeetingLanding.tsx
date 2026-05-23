/**
 * Public /book landing page — visitors request a meeting slot with Jane.
 *
 * Slot rules (enforced by `validate_meeting_booking_slot()`):
 *   • Tuesday → Friday, 11:00–17:00 Dubai time
 *   • ≥ 1 day in advance
 *   • Meeting must end by 17:00 Dubai time
 *
 * Submit pipeline: posts to the `submit-meeting-booking` edge function, which
 *   1) inserts into meeting_bookings
 *   2) mirrors to owner_calendar_events (drives reminders 24h / 1h / 15m)
 *   3) captures a CRM lead via `capture-lead`
 *   4) emails visitor + owner (with .ics)
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar, Clock, MapPin, Video, CheckCircle2, Loader2, UploadCloud, Globe, X,
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";

const TIME_SLOTS = ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const DURATIONS = [
  { v: 30, label: "30 min" },
  { v: 45, label: "45 min" },
  { v: 60, label: "60 min" },
  { v: 90, label: "90 min" },
];
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

/** Next N business days, Tue–Fri only, starting tomorrow (Dubai-local heuristic). */
function nextBookableDays(count: number) {
  const out: Date[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1); // ≥1 day in advance
  while (out.length < count) {
    const day = d.getDay(); // 0=Sun..6=Sat
    if (day >= 2 && day <= 5) out.push(new Date(d)); // Tue(2)..Fri(5)
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Filter slots so meeting end ≤ 17:00 given duration. */
function visibleSlots(durationMin: number) {
  return TIME_SLOTS.filter((t) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm + durationMin <= 17 * 60;
  });
}

export default function BookMeetingLanding() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const days = useMemo(() => nextBookableDays(20), []);

  const countries = useMemo(() => getCountryList(), []);
  const languages = useMemo(() => getLanguageList(), []);

  const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
  const [duration, setDuration] = useState<number>(60);
  const [selectedTime, setSelectedTime] = useState<string>("11:00");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("");
  const [language, setLanguage] = useState("en");
  const [company, setCompany] = useState("");

  const [website, setWebsite] = useState("");
  const [socials, setSocials] = useState<string[]>([""]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [locationType, setLocationType] = useState<"office" | "online">("online");
  const [platform, setPlatform] = useState<"zoom" | "google_meet">("google_meet");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { when: string }>(null);

  const slots = useMemo(() => visibleSlots(duration), [duration]);

  useEffect(() => {
    // If duration change pushes current slot out of range, snap back to first valid.
    if (!slots.includes(selectedTime) && slots.length) setSelectedTime(slots[0]);
  }, [duration]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.title = "Book a Meeting with Jane Bou Jaoude · JBJ GLOBAL REAL ESTATE";
    const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prev = meta?.content;
    if (meta) meta.content = "Schedule a private consultation with Jane Bou Jaoude, founder of JBJ GLOBAL REAL ESTATE. Tuesday to Friday, 11:00–17:00 Dubai time.";
    return () => { if (meta && prev !== undefined) meta.content = prev; };
  }, []);

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
        if (data.contact_name) setFullName(data.contact_name);
        if (data.contact_email) setEmail(data.contact_email);
        if (data.contact_company) setCompany(data.contact_company);
        if (data.default_language) setLanguage(data.default_language);
        if (data.default_location_type) setLocationType(data.default_location_type);
      }
    })();
  }, [token]);

  async function handleFile(f: File | null) {
    if (!f) { setFile(null); return; }
    if (f.size > MAX_ATTACHMENT_BYTES) {
      toast.error("File too large (max 10 MB).");
      return;
    }
    if (!ALLOWED_MIME.includes(f.type)) {
      toast.error("Only PDF, DOC, DOCX, JPG, PNG accepted.");
      return;
    }
    setFile(f);
  }

  async function uploadAttachment(): Promise<{ url: string; name: string } | null> {
    if (!file) return null;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
      const path = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("meeting-booking-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage
        .from("meeting-booking-attachments")
        .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
      return { url: signed?.signedUrl ?? "", name: file.name };
    } catch (e: any) {
      toast.error("Attachment upload failed: " + (e?.message ?? "unknown"));
      return null;
    } finally {
      setUploading(false);
    }
  }

  function validate(): string | null {
    if (fullName.trim().length < 2) return "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email.";
    if (phone.trim().length < 6) return "Please enter your phone number.";
    if (!nationality) return "Please select your nationality.";
    if (!language) return "Please select your preferred language.";
    if (company.trim().length < 1) return "Please enter your company name.";
    if (website && !/^https?:\/\//i.test(website)) return "Website must start with http(s)://";
    for (const s of socials) {
      if (s && !/^https?:\/\//i.test(s)) return "Social links must start with http(s)://";
    }
    return null;
  }

  const submit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setBusy(true);
    try {
      // Optional file upload first
      const att = file ? await uploadAttachment() : null;

      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      const bookedForAt = `${y}-${m}-${d}T${selectedTime}:00+04:00`;

      const cleanSocials = socials.map((s) => s.trim()).filter(Boolean);

      const { data, error } = await supabase.functions.invoke("submit-meeting-booking", {
        body: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          nationality,
          language,
          company: company.trim(),
          bookedForAt,
          durationMin: duration,
          locationType,
          onlinePlatform: locationType === "online" ? platform : null,
          notes: notes.trim() || null,
          websiteUrl: website.trim() || null,
          socialLinks: cleanSocials,
          attachmentUrl: att?.url ?? null,
          attachmentName: att?.name ?? null,
          refToken: token || null,
          source: token ? "branded_email" : "public_landing",
        },
      });
      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      setDone({
        when: selectedDate.toLocaleDateString("en-GB", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        }) + ` at ${selectedTime} (Dubai)`,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Booking failed");
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
            A confirmation has been emailed to you and to Jane personally.
            You'll receive reminders 24 hours, 1 hour, and 15 minutes before the meeting.
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
          A private consultation — investment briefing, off-market access, or a working session.
          Tuesday to Friday, 11:00–17:00 Dubai time. Office in Dubai or online (Zoom / Google Meet).
        </p>
      </section>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date + Duration + Time */}
          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[#B89555]" />
              <h2 className="font-semibold">Choose a date (Tue–Fri)</h2>
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
              <h2 className="font-semibold">Meeting length</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {DURATIONS.map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setDuration(opt.v)}
                  className={`py-2 rounded-lg text-sm border transition ${
                    duration === opt.v
                      ? "bg-[#EFE6D6] border-[#B89555]"
                      : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#B89555]" />
              <h2 className="font-semibold">Start time (Dubai)</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {slots.length === 0 && (
                <p className="col-span-4 text-xs text-[#1A1A1A]/70">No slots fit this duration. Try a shorter meeting.</p>
              )}
              {slots.map((t) => (
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
              <Label className="text-xs">Full name *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white" />
              </div>
              <div>
                <Label className="text-xs">Phone *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-white" placeholder="+971…" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nationality *</Label>
                <SearchableSelect
                  value={nationality}
                  onChange={setNationality}
                  options={countries}
                  placeholder="Select country"
                  searchPlaceholder="Search country…"
                />
              </div>
              <div>
                <Label className="text-xs">Preferred language *</Label>
                <SearchableSelect
                  value={language}
                  onChange={setLanguage}
                  options={languages}
                  placeholder="Select language"
                  searchPlaceholder="Search language…"
                />
              </div>

            </div>
            <div>
              <Label className="text-xs">Company name *</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} className="bg-white" />
            </div>

            <div className="pt-2 border-t border-[#B89555]/15">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#B89555] mb-2">Optional</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> Company website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-white" placeholder="https://" />
                </div>
                <div>
                  <Label className="text-xs">Social link</Label>
                  <Input
                    value={socials[0] ?? ""}
                    onChange={(e) => { const next = [...socials]; next[0] = e.target.value; setSocials(next); }}
                    className="bg-white"
                    placeholder="https://linkedin.com/in/…"
                  />
                </div>
              </div>

              <div className="mt-3">
                <Label className="text-xs flex items-center gap-1"><UploadCloud className="w-3 h-3" /> Company profile (PDF/DOC/JPG, ≤ 10 MB)</Label>
                {file ? (
                  <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-md bg-white border border-[#B89555]/30 text-xs">
                    <span className="truncate flex-1">{file.name}</span>
                    <button onClick={() => setFile(null)} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    className="bg-white"
                  />
                )}
              </div>
            </div>

            <div className="pt-2">
              <Label className="text-xs mb-1 block">Where would you like to meet?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType("office")}
                  className={`px-3 py-3 rounded-lg text-sm border flex items-center gap-2 justify-center ${
                    locationType === "office"
                      ? "bg-[#EFE6D6] border-[#B89555]"
                      : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                >
                  <MapPin className="w-4 h-4" /> Dubai office
                </button>
                <button
                  type="button"
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
                    type="button"
                    onClick={() => setPlatform("google_meet")}
                    className={`px-3 py-2 rounded-lg text-xs border ${
                      platform === "google_meet" ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20"
                    }`}
                  >Google Meet</button>
                  <button
                    type="button"
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

            <Button variant="gold" onClick={submit} disabled={busy || uploading} className="w-full mt-2">
              {(busy || uploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
