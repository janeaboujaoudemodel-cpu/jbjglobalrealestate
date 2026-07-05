/**
 * Public /book landing page — Phase 2.
 *
 * Adds: service type, mandatory meeting topic, proposal (typed or attached),
 * country-flag phone picker, structured social links, premium file drop,
 * and a "Booked" preview of all unavailable days until first availability.
 */
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calendar, Clock, MapPin, Video, CheckCircle2, Loader2, Globe, Lock,
  Briefcase, MessageSquare, Sparkles, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { PhoneInput } from "@/components/booking/PhoneInput";
import { SocialLinksField, type SocialLink } from "@/components/booking/SocialLinksField";
import { PremiumFileDrop } from "@/components/booking/PremiumFileDrop";
import { BookingAuthGate } from "@/components/booking/BookingAuthGate";
import { ConfirmTicketDialog, type ConfirmTicketSummary } from "@/components/booking/ConfirmTicketDialog";
import { useAuth } from "@/contexts/AuthContext";

const TIME_SLOTS = ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
const DURATIONS = [
  { v: 30, label: "30 min" },
  { v: 45, label: "45 min" },
  { v: 60, label: "60 min" },
  { v: 90, label: "90 min" },
];

const SERVICE_TYPES = [
  { v: "general_inquiry",     label: "General inquiry",     icon: MessageSquare },
  { v: "general_meeting",     label: "General meeting",     icon: Briefcase },
  { v: "partnership",         label: "Partnership",         icon: Sparkles },
  { v: "investment_briefing", label: "Investment briefing", icon: FileText },
  { v: "off_market_access",   label: "Off-market access",   icon: Lock },
  { v: "other",               label: "Other",               icon: Globe },
];

/** Returns booked-preview + bookable days starting today.
 *  Days from today until the first Tue–Fri slot (≥ 1 day in advance) are returned as `{date, bookable:false}`.
 *  Then bookable Tue–Fri days follow.
 */
function buildDayPanel(count: number) {
  const out: { date: Date; bookable: boolean }[] = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const earliest = new Date(today); earliest.setDate(earliest.getDate() + 1);
  let cursor = new Date(today);
  let bookableAdded = 0;
  while (bookableAdded < count) {
    const day = cursor.getDay();
    const isBookableDow = day >= 2 && day <= 5;
    const isLeadOk = cursor >= earliest;
    const bookable = isBookableDow && isLeadOk;
    if (bookable) bookableAdded++;
    out.push({ date: new Date(cursor), bookable });
    cursor.setDate(cursor.getDate() + 1);
    if (out.length > 90) break; // safety — allow full ~30-day preview incl. weekends/Mondays
  }
  return out;
}

function visibleSlots(durationMin: number) {
  return TIME_SLOTS.filter((t) => {
    const [hh, mm] = t.split(":").map(Number);
    return hh * 60 + mm + durationMin <= 17 * 60;
  });
}

export default function BookMeetingLanding() {
  const [params] = useSearchParams();
  const token = params.get("t") || "";
  const { user, loading: authLoading } = useAuth();

  const dayPanel = useMemo(() => buildDayPanel(30), []);
  const countries = useMemo(() => getCountryList(), []);
  const languages = useMemo(() => getLanguageList(), []);

  const firstBookable = useMemo(() => dayPanel.find(d => d.bookable)?.date ?? new Date(), [dayPanel]);
  const [selectedDate, setSelectedDate] = useState<Date>(firstBookable);
  const [duration, setDuration] = useState<number>(60);
  const [selectedTime, setSelectedTime] = useState<string>("11:00");
  const slots = useMemo(() => visibleSlots(duration), [duration]);
  useEffect(() => {
    if (!slots.includes(selectedTime) && slots.length) setSelectedTime(slots[0]);
  }, [duration]); // eslint-disable-line react-hooks/exhaustive-deps

  // Required identity
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("AE");
  const [language, setLanguage] = useState("en");
  const [company, setCompany] = useState("");

  // Required workflow
  const [serviceType, setServiceType] = useState<string>("general_meeting");
  const [meetingTopic, setMeetingTopic] = useState("");

  // Optional / partnership
  const [website, setWebsite] = useState("");
  const [socials, setSocials] = useState<SocialLink[]>([{ platform: "linkedin", url: "" }]);
  const [proposalMode, setProposalMode] = useState<"attach" | "type">("attach");
  const [proposalText, setProposalText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [locationType, setLocationType] = useState<"office" | "online">("online");
  const [platform, setPlatform] = useState<"zoom" | "google_meet">("google_meet");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState<null | { when: string }>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Pre-fill email from authenticated account (once)
  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);


  useEffect(() => {
    document.title = "Book a Meeting with Jane Bou Jaoude · JBJ GLOBAL REAL ESTATE";
    const meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const prev = meta?.content;
    if (meta) meta.content = "Schedule a private consultation with Jane Bou Jaoude, founder of JBJ GLOBAL REAL ESTATE. Tuesday to Friday, 11:00–17:00 Dubai time.";
    return () => { if (meta && prev !== undefined) meta.content = prev; };
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data } = await (supabase as any)
        .rpc("get_booking_token", { _token: token });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        if (row.contact_name) setFullName(row.contact_name);
        if (row.contact_email) setEmail(row.contact_email);
        if (row.contact_company) setCompany(row.contact_company);
        if (row.default_language) setLanguage(row.default_language);
        if (row.default_location_type) setLocationType(row.default_location_type);
      }
    })();
  }, [token]);

  async function uploadAttachment(): Promise<{ url: string; name: string } | null> {
    if (!file) return null;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
      const path = `bookings/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("meeting-booking-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage
        .from("meeting-booking-attachments")
        .createSignedUrl(path, 60 * 60 * 24 * 30);
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
    if (phone.trim().length < 6) return "Please enter your phone number with country code.";
    if (!nationality) return "Please select your nationality.";
    if (!language) return "Please select your preferred language.";
    if (company.trim().length < 1) return "Please enter your company name.";
    if (!serviceType) return "Please choose the type of meeting.";
    if (meetingTopic.trim().length < 3) return "Please describe what you would like to discuss.";
    if (website && !/^https?:\/\//i.test(website)) return "Website must start with http(s)://";
    for (const s of socials) {
      if (s.url && !/^https?:\/\//i.test(s.url)) return "Social links must start with http(s)://";
    }
    if (serviceType === "partnership") {
      const hasFile = !!file;
      const hasText = proposalText.trim().length >= 10;
      if (!hasFile && !hasText) return "For partnerships, please attach a proposal or describe it in writing.";
    }
    return null;
  }

  const submit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setBusy(true);
    try {
      const att = file ? await uploadAttachment() : null;
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      const bookedForAt = `${y}-${m}-${d}T${selectedTime}:00+04:00`;
      const cleanSocials = socials.filter((s) => s.url.trim()).map((s) => ({ platform: s.platform, url: s.url.trim() }));

      const { data, error } = await supabase.functions.invoke("submit-meeting-booking", {
        body: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          nationality, language,
          company: company.trim(),
          serviceType,
          meetingTopic: meetingTopic.trim(),
          bookedForAt,
          durationMin: duration,
          locationType,
          onlinePlatform: locationType === "online" ? platform : null,
          notes: notes.trim() || null,
          proposalText: proposalText.trim() || null,
          websiteUrl: website.trim() || null,
          socialLinks: cleanSocials,
          attachmentUrl: att?.url ?? null,
          attachmentName: att?.name ?? null,
          refToken: token || null,
          source: token ? "branded_email" : "public_landing",
          authUserId: user?.id ?? null,
          agreedToCancellationTerms: true,
        },
      });
      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      setConfirmOpen(false);

      setDone({
        when: selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + ` at ${selectedTime} (Dubai)`,
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
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#B89555] mb-2">Status · Received</p>
          <h1 className="text-2xl font-semibold text-[#1A1A1A] mb-2">Greetings from JBJ Global Real Estate.</h1>
          <p className="text-[#1A1A1A]/80 mb-1">We have received your request. {done.when}</p>
          <p className="text-sm text-[#1A1A1A]/70 mt-4">
            Our team is reviewing your details now. A confirmation will arrive in your inbox shortly,
            and you'll receive reminders 24 hours and 30 minutes before the meeting once it's approved.
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
          A private consultation — investment briefing, off-market access, partnership, or a working session.
          Tuesday to Friday, 11:00–17:00 Dubai time.
        </p>
      </section>

      <main className="max-w-5xl mx-auto px-6 pb-20">
        {authLoading ? (
          <div className="text-center py-20 text-[#1A1A1A]/60">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-[#B89555]" />
            Preparing your private booking…
          </div>
        ) : !user ? (
          <BookingAuthGate />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date / duration / time */}
          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-[#B89555]" />
              <h2 className="font-semibold">Choose a date</h2>
              <span className="ml-auto text-[11px] text-[#1A1A1A]/60">Tue–Fri · Dubai</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6 max-h-[320px] overflow-y-auto pr-1">
              {dayPanel.map(({ date, bookable }) => {
                const sel = bookable && date.toDateString() === selectedDate.toDateString();
                const label = date.toLocaleDateString("en-GB", { weekday: "short" });
                const aria = bookable
                  ? `Select ${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}`
                  : `${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — booked`;
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    aria-label={aria}
                    aria-pressed={sel}
                    title={bookable ? "" : "Booked — first availability shown below"}
                    onClick={() => bookable && setSelectedDate(new Date(date))}
                    disabled={!bookable}
                    className={`px-2 py-3 rounded-lg text-xs border transition relative overflow-hidden ${
                      !bookable
                        ? "bg-[#FDFBF7] border-[#B89555]/15 text-[#1A1A1A]/30 cursor-not-allowed"
                        : sel
                          ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A] ring-1 ring-[#B89555]"
                          : "bg-white border-[#B89555]/20 text-[#1A1A1A]/80 hover:border-[#B89555]/60"
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-base">{date.getDate()}</div>
                    <div className="opacity-70">{date.toLocaleDateString("en-GB", { month: "short" })} {date.getFullYear()}</div>
                    {!bookable && (
                      <>
                        <span
                          aria-hidden
                          className="pointer-events-none absolute -right-7 top-2 rotate-45 bg-[#B89555]/85 text-[#FDFBF7] text-[8px] font-semibold uppercase tracking-[0.22em] px-7 py-[2px] shadow-sm"
                        >
                          Booked
                        </span>
                        <span className="sr-only">Booked</span>
                      </>
                    )}
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
                <button key={opt.v} onClick={() => setDuration(opt.v)}
                  className={`py-2 rounded-lg text-sm border transition ${
                    duration === opt.v ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                >{opt.label}</button>
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
                <button key={t} onClick={() => setSelectedTime(t)}
                  className={`py-2 rounded-lg text-sm border transition ${
                    selectedTime === t ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Visitor details */}
          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold mb-1">Your details</h2>

            <div>
              <Label className="text-xs">Full name *</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-white border-[#B89555]/30" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white border-[#B89555]/30" />
              </div>
              <div>
                <Label className="text-xs">Phone *</Label>
                <PhoneInput value={phone} onChange={(v) => setPhone(v)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nationality *</Label>
                <SearchableSelect value={nationality} onChange={setNationality} options={countries}
                  placeholder="Select country" searchPlaceholder="Search country…" />
              </div>
              <div>
                <Label className="text-xs">Preferred language *</Label>
                <SearchableSelect value={language} onChange={setLanguage} options={languages}
                  placeholder="Select language" searchPlaceholder="Search language…" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Company name *</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} className="bg-white border-[#B89555]/30" />
            </div>

            {/* Service type */}
            <div className="pt-2 border-t border-[#B89555]/15">
              <Label className="text-xs block mb-2">Type of meeting *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SERVICE_TYPES.map((s) => (
                  <button key={s.v} type="button" onClick={() => setServiceType(s.v)}
                    className={`px-3 py-2.5 rounded-lg text-xs border flex items-center gap-2 transition ${
                      serviceType === s.v ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                    }`}
                  ><s.icon className="w-3.5 h-3.5 text-[#B89555]" /> {s.label}</button>
                ))}
              </div>
            </div>

            {/* Meeting topic — mandatory */}
            <div>
              <Label className="text-xs">Meeting topic <span className="text-red-600">*</span></Label>
              <Textarea
                value={meetingTopic}
                onChange={(e) => setMeetingTopic(e.target.value)}
                className="bg-white border-[#B89555]/30 min-h-[80px]"
                placeholder="What would you like to discuss? Be as specific as possible."
              />
            </div>

            {/* Proposal (typed or attached) */}
            <div className="pt-2 border-t border-[#B89555]/15">
              <Label className="text-xs block mb-2">
                Proposal {serviceType === "partnership" ? <span className="text-red-600">*</span> : <span className="text-[#1A1A1A]/50">(optional)</span>}
              </Label>
              <Tabs value={proposalMode} onValueChange={(v) => setProposalMode(v as any)}>
                <TabsList className="bg-white border border-[#B89555]/20">
                  <TabsTrigger value="attach">Attach proposal</TabsTrigger>
                  <TabsTrigger value="type">Type proposal</TabsTrigger>
                </TabsList>
                <TabsContent value="attach" className="mt-3">
                  <PremiumFileDrop file={file} onChange={setFile} />
                </TabsContent>
                <TabsContent value="type" className="mt-3">
                  <Textarea
                    value={proposalText}
                    onChange={(e) => setProposalText(e.target.value)}
                    placeholder="Outline the partnership opportunity, scope, and what you propose…"
                    className="bg-white border-[#B89555]/30 min-h-[140px]"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Website + socials */}
            <div className="pt-2 border-t border-[#B89555]/15">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#B89555] mb-2">Company links (optional)</p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> Company website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)}
                    className="bg-white border-[#B89555]/30" placeholder="https://…" />
                </div>
                <div>
                  <Label className="text-xs">Social links</Label>
                  <SocialLinksField value={socials} onChange={setSocials} />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="pt-2 border-t border-[#B89555]/15">
              <Label className="text-xs mb-1 block">Where would you like to meet?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setLocationType("office")}
                  className={`px-3 py-3 rounded-lg text-sm border flex items-center gap-2 justify-center ${
                    locationType === "office" ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                ><MapPin className="w-4 h-4" /> Dubai office</button>
                <button type="button" onClick={() => setLocationType("online")}
                  className={`px-3 py-3 rounded-lg text-sm border flex items-center gap-2 justify-center ${
                    locationType === "online" ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20 hover:border-[#B89555]/60"
                  }`}
                ><Video className="w-4 h-4" /> Online</button>
              </div>
              {locationType === "online" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button type="button" onClick={() => setPlatform("google_meet")}
                    className={`px-3 py-2 rounded-lg text-xs border ${platform === "google_meet" ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20"}`}
                  >Google Meet</button>
                  <button type="button" onClick={() => setPlatform("zoom")}
                    className={`px-3 py-2 rounded-lg text-xs border ${platform === "zoom" ? "bg-[#EFE6D6] border-[#B89555]" : "bg-white border-[#B89555]/20"}`}
                  >Zoom</button>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">Additional notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="bg-white border-[#B89555]/30 min-h-[60px]"
                placeholder="Anything else Jane should know before the meeting?" />
            </div>

            <Button
              variant="gold"
              onClick={() => {
                const err = validate();
                if (err) { toast.error(err); return; }
                setConfirmOpen(true);
              }}
              disabled={busy || uploading}
              className="w-full mt-2"
            >
              {(busy || uploading) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Review &amp; request {selectedTime} on {selectedDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </Button>
            <p className="text-[11px] text-[#1A1A1A]/55 text-center">
              All meetings are subject to confirmation. Cancellations: 24 h before morning meetings, 6 h before afternoon meetings. Write to contact@jbj.ae for assistance.
            </p>
          </div>
        </div>
        )}
      </main>

      <ConfirmTicketDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        submitting={busy || uploading}
        onConfirm={submit}
        summary={user ? {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          company: company.trim(),
          serviceTypeLabel: (SERVICE_TYPES.find(s => s.v === serviceType)?.label) ?? serviceType,
          meetingTopic: meetingTopic.trim(),
          proposalPreview: proposalText.trim() || null,
          attachmentName: file?.name ?? null,
          date: selectedDate,
          time: selectedTime,
          durationMin: duration,
          locationLabel: locationType === "online"
            ? `Online · ${platform === "zoom" ? "Zoom" : "Google Meet"}`
            : "Dubai office",
        } : null}
      />
    </div>
  );
}

