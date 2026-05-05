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
import html2canvas from "html2canvas";
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
  const [attendeeCount, setAttendeeCount] = useState("2");
  const [briefingTopics, setBriefingTopics] = useState("");
  const [partnershipFocus, setPartnershipFocus] = useState("");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ slotAt: string } | null>(null);

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

  const downloadIcs = () => {
    if (!confirmed) return;
    const dt = new Date(confirmed.slotAt);
    const dtEnd = new Date(dt.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//JBJ Global Real Estate//Breakfast//EN",
      "BEGIN:VEVENT",
      `UID:${token}@jbj.ae`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(dt)}`,
      `DTEND:${fmt(dtEnd)}`,
      "SUMMARY:Private Partnership Breakfast — JBJ Global Real Estate",
      "DESCRIPTION:Briefing and partnership discussion at the JBJ Dubai office.",
      "LOCATION:JBJ Global Real Estate, Dubai",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "jbj-breakfast.ics";
    a.click();
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-10 text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/15 mb-4">
            <Check className="h-6 w-6 text-primary" />
          </div>
          <div className="text-[11px] tracking-[3px] uppercase text-primary font-bold mb-2">JBJ Global Real Estate</div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Your seat is reserved</h1>
          <p className="text-foreground/80 mb-1">
            {format(new Date(confirmed.slotAt), "EEEE, d MMMM yyyy")}
          </p>
          <p className="text-foreground/60 mb-6">
            {format(new Date(confirmed.slotAt), "HH:mm")} · JBJ Dubai office
          </p>
          <p className="text-sm text-foreground/70 mb-8">
            We'll follow up by email with the full address, parking, and the briefing agenda.
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={downloadIcs} variant="gold">Add to calendar</Button>
            <Button asChild variant="outline"><Link to="/">Back to JBJ</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const isAlreadyBooked = data?.chosen && data?.status === "pending";

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

        {isAlreadyBooked && (
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
