/**
 * Breakfast Booking — public scheduling page for brokerage channel partners
 *
 * Reached via the {{booking_url}} link embedded in the breakfast outreach
 * email. The token in the URL identifies the brokerage and the placeholder
 * meeting_requests row that this booking confirms.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, Users, Check, Loader2, AlertCircle, ArrowRight, MapPin, Phone, Download, Copy, CalendarPlus } from "lucide-react";
// html2canvas is lazy-loaded inside downloadPng to keep the initial booking page lean.
import { supabase } from "@/integrations/supabase/client";
import { edgeFnUrl, anonHeaders } from "@/config/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const HOST_NAME = "Jane Bou Jaoude";
const HOST_PHONE = "+971 54 716 7107";
const HOST_PHONE_TEL = "+971547167107";
const OFFICE_LOCATION = "Citi Developers Sales and Experience Center, Dubai";

interface Slot {
  id: string;
  slot_at: string;
  capacity: number;
  notes: string | null;
}

interface LookupResult {
  preview?: boolean;
  brokerageName: string;
  status: string;
  chosen?: { date: string; time: string; attendeeCount?: number } | null;
  slots: Slot[];
}

interface AttendeeRow { name: string; phone: string; email: string }

export default function BreakfastBooking() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LookupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [slotId, setSlotId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [attendeeMode, setAttendeeMode] = useState<"count" | "list">("count");
  const [attendeeCount, setAttendeeCount] = useState("2");
  const [attendees, setAttendees] = useState<AttendeeRow[]>([{ name: "", phone: "", email: "" }]);
  const [briefingTopics, setBriefingTopics] = useState("");
  const [partnershipFocus, setPartnershipFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ slotAt: string } | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token. Please use the link from your invitation email.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const r = await fetch(
          `${edgeFnUrl("breakfast-booking-lookup")}?token=${encodeURIComponent(token)}`,
          { headers: anonHeaders() },
        );
        const json = await r.json();
        if (!r.ok) throw new Error(json?.error || "Failed to load invitation");
        setData(json as LookupResult);
      } catch (e: any) {
        setError(e?.message || "Could not load invitation");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const grouped = useMemo(() => {
    const groups: Record<string, Slot[]> = {};
    (data?.slots || []).forEach((s) => {
      const day = s.slot_at.slice(0, 10);
      (groups[day] ||= []).push(s);
    });
    return groups;
  }, [data]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotId) { toast.error("Please pick a breakfast time"); return; }
    if (!consent) { toast.error("Please confirm the consent checkbox"); return; }
    setSubmitting(true);
    try {
      const { data: res, error: confErr } = await supabase.functions.invoke(
        "breakfast-booking-confirm",
        {
          body: {
            token,
            slotId,
            fullName,
            email,
            phone,
            attendeeCount: Number(attendeeCount) || 1,
            briefingTopics,
            partnershipFocus,
            notes,
            consent,
          },
        },
      );
      if (confErr) throw confErr;
      if ((res as any)?.error) throw new Error((res as any).error);
      const slot = data?.slots.find((s) => s.id === slotId);
      setConfirmed({ slotAt: slot?.slot_at || new Date().toISOString() });
    } catch (e: any) {
      toast.error(e?.message || "Could not confirm booking");
    } finally {
      setSubmitting(false);
    }
  };

  const cardRef = useRef<HTMLDivElement>(null);

  const buildIcs = () => {
    if (!confirmed) return "";
    const dt = new Date(confirmed.slotAt);
    const dtEnd = new Date(dt.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const desc = `Private partnership briefing & breakfast.\\nHost on arrival: ${HOST_NAME} — ${HOST_PHONE}\\nLocation: ${OFFICE_LOCATION}`;
    return [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//JBJ Global Real Estate//Breakfast//EN",
      "BEGIN:VEVENT", `UID:${token}@jbj.ae`, `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(dt)}`, `DTEND:${fmt(dtEnd)}`,
      "SUMMARY:Private Partnership Breakfast — JBJ Global Real Estate",
      `DESCRIPTION:${desc}`, `LOCATION:${OFFICE_LOCATION}`,
      `ORGANIZER;CN=${HOST_NAME}:mailto:contact@jbj.ae`,
      "END:VEVENT","END:VCALENDAR",
    ].join("\r\n");
  };

  const downloadIcs = () => {
    const ics = buildIcs(); if (!ics) return;
    const blob = new Blob([ics], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "jbj-breakfast.ics"; a.click();
  };

  const openGoogleCalendar = () => {
    if (!confirmed) return;
    const dt = new Date(confirmed.slotAt);
    const dtEnd = new Date(dt.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Private Breakfast — JBJ Global Real Estate")}&dates=${fmt(dt)}/${fmt(dtEnd)}&details=${encodeURIComponent(`Host on arrival: ${HOST_NAME} — ${HOST_PHONE}\nLocation: ${OFFICE_LOCATION}`)}&location=${encodeURIComponent(OFFICE_LOCATION)}`;
    window.open(url, "_blank");
  };

  const downloadPng = async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#FDFBF7", scale: 2 });
      const a = document.createElement("a");
      a.download = "jbj-breakfast-invitation.png";
      a.href = canvas.toDataURL("image/png");
      a.click();
    } catch { toast.error("Could not export image"); }
  };

  const copyText = () => {
    if (!confirmed) return;
    const dt = new Date(confirmed.slotAt);
    const text = `Private Partnership Breakfast — JBJ Global Real Estate
${format(dt, "EEEE, d MMMM yyyy")} at ${format(dt, "HH:mm")}
Location: ${OFFICE_LOCATION}
Host on arrival: ${HOST_NAME} — ${HOST_PHONE}
When you reach the building, call or WhatsApp ${HOST_NAME.split(" ")[0]} on the number above and she'll meet you.`;
    navigator.clipboard.writeText(text).then(() => toast.success("Invitation copied"));
  };

  // ─── render ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center bg-card border border-border rounded-2xl p-8">
          <AlertCircle className="h-8 w-8 mx-auto text-foreground/70 mb-3" />
          <h1 className="text-xl font-bold text-foreground mb-2">Invitation unavailable</h1>
          <p className="text-sm text-foreground/70 mb-6">{error}</p>
          <Button asChild variant="gold"><Link to="/">Return home</Link></Button>
        </div>
      </div>
    );
  }
  if (confirmed) {
    const dt = new Date(confirmed.slotAt);
    return (
      <div className="min-h-screen bg-[#F7F2EA] px-4 py-12" style={{ background: "linear-gradient(180deg,#FDFBF7 0%,#F7F2EA 100%)" }}>
        <div className="max-w-lg w-full mx-auto">
          <div ref={cardRef} className="bg-white border border-[#B89555] rounded-2xl p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[#EFE6D6] mb-4">
              <Check className="h-6 w-6 text-[#1A1A1A]" />
            </div>
            <div className="text-[11px] tracking-[3px] uppercase text-[#B89555] font-bold mb-2">JBJ Global Real Estate</div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-3">Thank you — your seat is reserved</h1>
            <p className="text-[#1A1A1A] font-medium">{format(dt, "EEEE, d MMMM yyyy")}</p>
            <p className="text-[#1A1A1A]/70 mb-6">{format(dt, "HH:mm")} (GST)</p>

            <div className="text-left bg-[#FDFBF7] border border-[#1A1A1A]/10 border-l-4 border-l-[#B89555] rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2 text-sm text-[#1A1A1A] mb-2">
                <MapPin className="h-4 w-4 text-[#B89555] mt-0.5 shrink-0" />
                <div><div className="text-[10px] uppercase tracking-wider text-[#B89555] font-bold">Location</div>{OFFICE_LOCATION}</div>
              </div>
              <div className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                <Phone className="h-4 w-4 text-[#B89555] mt-0.5 shrink-0" />
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#B89555] font-bold">Your host on arrival</div>
                  <div>{HOST_NAME}</div>
                  <a href={`tel:${HOST_PHONE_TEL}`} className="text-[#1A1A1A] underline">{HOST_PHONE}</a>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#1A1A1A]/70 italic mb-2">
              When you reach the building, call or WhatsApp Jane on the number above and she'll meet you.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <Button onClick={openGoogleCalendar} variant="gold" className="w-full"><CalendarPlus className="h-4 w-4 mr-1" />Google Calendar</Button>
            <Button onClick={downloadIcs} variant="outline" className="w-full"><Calendar className="h-4 w-4 mr-1" />Apple/Outlook (.ics)</Button>
            <Button onClick={downloadPng} variant="outline" className="w-full"><Download className="h-4 w-4 mr-1" />Download as PNG</Button>
            <Button onClick={copyText} variant="outline" className="w-full"><Copy className="h-4 w-4 mr-1" />Copy invitation</Button>
          </div>
          <div className="text-center mt-4">
            <Button asChild variant="ghost"><Link to="/">Back to JBJ</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-[11px] tracking-[3px] uppercase text-primary font-bold mb-2">
          JBJ Global Real Estate
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Private Partnership Breakfast
        </h1>
        <p className="text-foreground/70 mt-2">
          Reserved invitation for <strong>{data?.brokerageName || "your brokerage"}</strong>
          {data?.preview && <span className="ml-2 text-xs text-foreground/50">(preview)</span>}
        </p>

        {data?.chosen && (
          <div className="mt-4 bg-card border border-border rounded-xl p-4 text-sm text-foreground/80">
            You already confirmed <strong>{data?.chosen?.date}</strong> at <strong>{data?.chosen?.time}</strong>.
            Submitting the form below will update your details.
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 space-y-8 bg-card border border-border rounded-2xl p-6 sm:p-10">
          {/* Slot picker */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Pick a breakfast time</h2>
            </div>
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-foreground/60">
                No upcoming slots are open right now — please reply to the invitation email and we'll arrange one.
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([day, slots]) => (
                  <div key={day}>
                    <div className="text-sm font-medium text-foreground/70 mb-2">
                      {format(parseISO(day), "EEEE, d MMMM yyyy")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => {
                        const active = slotId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSlotId(s.id)}
                            className={[
                              "inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition",
                              active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background text-foreground border-border hover:border-primary",
                            ].join(" ")}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            {format(new Date(s.slot_at), "HH:mm")}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="h-px bg-border" />

          {/* Attendee details */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fullName">Your name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="attendeeCount">
                <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />Attendees</span>
              </Label>
              <Input
                id="attendeeCount"
                type="number"
                min={1}
                max={6}
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(e.target.value)}
                required
              />
            </div>
          </section>

          {/* Briefing context */}
          <section className="space-y-4">
            <div>
              <Label htmlFor="briefing">What would you like briefed at breakfast?</Label>
              <Textarea
                id="briefing"
                rows={3}
                placeholder="e.g. current Q-pipeline, exclusive inventory routes, off-plan launches"
                value={briefingTopics}
                onChange={(e) => setBriefingTopics(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="focus">Partnership topics you want to discuss</Label>
              <Textarea
                id="focus"
                rows={3}
                placeholder="e.g. commission framework, co-brokerage on signature towers, lead-share arrangement"
                value={partnershipFocus}
                onChange={(e) => setPartnershipFocus(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Anything else?</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </section>

          <div className="flex items-start gap-3">
            <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(!!v)} />
            <Label htmlFor="consent" className="text-sm text-foreground/80 leading-relaxed cursor-pointer">
              I confirm the details above are accurate and consent to JBJ Global Real Estate contacting
              me about this private breakfast and ongoing partnership matters.
            </Label>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="gold" disabled={submitting || !slotId || data?.preview} className="w-full sm:w-auto">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
              Confirm my breakfast seat
            </Button>
            {data?.preview && (
              <p className="text-xs text-foreground/50 mt-2">Preview link — confirmation is disabled.</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
