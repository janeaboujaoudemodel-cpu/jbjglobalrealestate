/**
 * PublicBookingLanding — the standalone /book/:slug page.
 *
 * Design decisions:
 *  - Fully isolated: no header, no footer, no site nav. Renders inside StandaloneRoutes.
 *  - Emerald + white palette (brand tokens 3-stop gradient + Cormorant Garamond).
 *  - Smart layout (all devices):
 *      • lg+  → two columns: sticky meeting summary rail + scheduling surface.
 *      • md   → single column, wide date grid.
 *      • phone→ single column, horizontally scrollable month-grouped date rail.
 *  - Smart scheduling assist: availability for the whole visible window is prefetched,
 *    days with no capacity are dimmed/disabled, the earliest bookable day is auto-selected,
 *    and slots are grouped by Morning / Afternoon / Evening with a local-time hint.
 *  - Two access modes:
 *      • booking_only         → after success, no site navigation is shown.
 *      • with_promotion       → after success, promo CTAs (e.g. "Explore Properties") appear.
 *  - Flow: pick date → pick slot → fill form (+ optional guests) → email verification → confirmed.
 *
 * All server logic (availability, verification, creation, conflict detection) lives in the
 * booking-public-availability and booking-public-create edge functions.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2, CheckCircle2, CalendarDays, Clock, Mail, ArrowLeft, Plus, X,
  Sparkles, Globe2, Sunrise, Sun, Moon, ChevronRight, ShieldCheck, Video,
} from "lucide-react";

type FormField = { key: string; label: string; type: string; required?: boolean; placeholder?: string };
type PromoAction = { label: string; url: string };

type PageMeta = {
  id: string;
  slug: string;
  access_mode: "booking_only" | "with_promotion";
  page_title: string | null;
  confirmation_message: string | null;
  require_email_verification: boolean;
  form_fields: FormField[];
  promo_actions: PromoAction[];
  event_type: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    max_advance_days: number;
    workspace: {
      display_name: string;
      timezone: string;
      kind: "personal" | "business";
    };
  };
};

type Step = "pick" | "form" | "verify" | "done";

const EMERALD_GRADIENT = "linear-gradient(135deg, #064E3B 0%, #042c1c 60%, #000000 100%)";

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => new Date(today.getTime() + i * 86400_000));
}

/** Run promises with limited concurrency so prefetching 30 days never floods the network. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length) as R[];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export default function PublicBookingLanding() {
  const { slug } = useParams<{ slug: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<PageMeta | null>(null);

  const [step, setStep] = useState<Step>("pick");
  const [selectedDate, setSelectedDate] = useState<string>(() => toDateKey(new Date()));
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Smart availability map: dateKey → number of open slots (undefined = not probed yet).
  const [availability, setAvailability] = useState<Record<string, number>>({});
  const [probing, setProbing] = useState(false);
  const autoPickedRef = useRef(false);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [guests, setGuests] = useState<string[]>([]);
  const [newGuest, setNewGuest] = useState("");

  const [verifyCode, setVerifyCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Server tells us whether the appointment still needs owner approval, so the
  // success screen never claims "booked" for a pending request.
  const [awaitingApproval, setAwaitingApproval] = useState(false);

  // Load page metadata
  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("jbj_booking_pages")
        .select(
          "id, slug, access_mode, page_title, confirmation_message, require_email_verification, form_fields, promo_actions, is_active, jbj_booking_event_types!inner(id, name, description, duration_minutes, max_advance_days, is_active, jbj_booking_workspaces!inner(display_name, timezone, kind, is_active))"
        )
        .eq("slug", slug)
        .maybeSingle();
      if (error || !data || !data.is_active) {
        setError("This booking page is not available.");
        setLoading(false);
        return;
      }
      const evt: any = (data as any).jbj_booking_event_types;
      const ws: any = evt.jbj_booking_workspaces;
      if (!evt.is_active || !ws.is_active) {
        setError("This booking page is not available.");
        setLoading(false);
        return;
      }
      setPage({
        id: data.id,
        slug: data.slug,
        access_mode: data.access_mode,
        page_title: data.page_title,
        confirmation_message: data.confirmation_message,
        require_email_verification: data.require_email_verification,
        form_fields: (data.form_fields as unknown as FormField[]) ?? [],
        promo_actions: (data.promo_actions as unknown as PromoAction[]) ?? [],
        event_type: {
          id: evt.id,
          name: evt.name,
          description: evt.description,
          duration_minutes: evt.duration_minutes,
          max_advance_days: evt.max_advance_days,
          workspace: { display_name: ws.display_name, timezone: ws.timezone, kind: ws.kind },
        },
      });
      setLoading(false);
    })();
  }, [slug]);

  const fetchSlots = useCallback(async (pageSlug: string, dateKey: string): Promise<string[]> => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-public-availability?slug=${encodeURIComponent(pageSlug)}&date=${dateKey}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });
      const json = await res.json();
      return Array.isArray(json?.slots) ? json.slots : [];
    } catch {
      return [];
    }
  }, []);

  const days = useMemo(
    () => nextDays(Math.min(page?.event_type.max_advance_days ?? 30, 30)),
    [page],
  );

  // Smart prefetch: probe the whole visible window so the date rail can show real
  // capacity instead of forcing the guest to click every empty day.
  useEffect(() => {
    if (!page) return;
    let cancelled = false;
    setProbing(true);
    (async () => {
      const keys = days.map(toDateKey);
      const counts = await mapLimit(keys, 5, async (k) => (await fetchSlots(page.slug, k)).length);
      if (cancelled) return;
      const map: Record<string, number> = {};
      keys.forEach((k, i) => { map[k] = counts[i]; });
      setAvailability(map);
      setProbing(false);
      // Auto-select the earliest bookable day exactly once.
      if (!autoPickedRef.current) {
        autoPickedRef.current = true;
        if (!map[selectedDate]) {
          const firstOpen = keys.find((k) => map[k] > 0);
          if (firstOpen) setSelectedDate(firstOpen);
        }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, days, fetchSlots]);

  // Load available slots for the selected day
  useEffect(() => {
    if (!page || !selectedDate) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSelectedSlot(null);
    (async () => {
      const list = await fetchSlots(page.slug, selectedDate);
      if (cancelled) return;
      setSlots(list);
      setAvailability((prev) => ({ ...prev, [selectedDate]: list.length }));
      setSlotsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [page, selectedDate, fetchSlots]);

  const nextOpenDay = useMemo(() => {
    const keys = days.map(toDateKey);
    return keys.find((k) => k > selectedDate && (availability[k] ?? 0) > 0) ?? null;
  }, [days, availability, selectedDate]);

  const openDayCount = useMemo(
    () => Object.values(availability).filter((n) => n > 0).length,
    [availability],
  );

  // Name / email / phone are rendered hardcoded above, so any configured field
  // that repeats them is dropped — a guest must never see a field twice.
  const RESERVED_FIELD_KEYS = /^(full[_\s-]?name|name|your[_\s-]?name|e[-_\s]?mail|email|email[_\s-]?address|phone|phone[_\s-]?number|mobile|tel|telephone|whatsapp)$/i;
  const customFields = useMemo(() => {
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_").replace(/\*/g, "");
    return (page?.form_fields ?? []).filter(
      (f) =>
        f.type !== "guests" &&
        !RESERVED_FIELD_KEYS.test(norm(f.key ?? "")) &&
        !RESERVED_FIELD_KEYS.test(norm(f.label ?? "")),
    );
  }, [page]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-emerald-800 animate-spin" />
      </div>
    );
  }
  if (error || !page) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-3xl font-serif text-emerald-900 mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Not available</div>
          <p className="text-neutral-600">{error ?? "Booking unavailable."}</p>
        </div>
      </div>
    );
  }

  const tz = page.event_type.workspace.timezone;
  const isPersonal = page.event_type.workspace.kind === "personal";
  const brandName = isPersonal ? page.event_type.workspace.display_name : "JBJ Global Real Estate";
  const viewerTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzDiffers = viewerTz && viewerTz !== tz;

  function fmtSlot(iso: string, zone: string = tz): string {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  }

  function slotHour(iso: string): number {
    return Number(
      new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date(iso)),
    );
  }

  const slotGroups: Array<{ id: string; label: string; icon: typeof Sunrise; items: string[] }> = [
    { id: "morning", label: "Morning", icon: Sunrise, items: slots.filter((s) => slotHour(s) < 12) },
    { id: "afternoon", label: "Afternoon", icon: Sun, items: slots.filter((s) => slotHour(s) >= 12 && slotHour(s) < 17) },
    { id: "evening", label: "Evening", icon: Moon, items: slots.filter((s) => slotHour(s) >= 17) },
  ].filter((g) => g.items.length > 0);

  const prettyDate = (key: string) =>
    new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${key}T12:00:00`));

  async function submitBooking(codeOverride?: string) {
    if (!page || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { data, error } = await supabase.functions.invoke("booking-public-create", {
        body: {
          slug: page.slug,
          starts_at: selectedSlot,
          customer: { name: customer.name.trim(), email: customer.email.trim(), phone: customer.phone.trim() || null },
          form_data: formData,
          guests,
          code: codeOverride,
        },
      });
      if (error) {
        setSubmitError(error.message);
        return;
      }
      if ((data as any)?.step === "verify_email") setStep("verify");
      else if ((data as any)?.step === "confirmed") {
        setAwaitingApproval(
          (data as any)?.requires_approval === true || (data as any)?.status === "awaiting_approval",
        );
        setStep("done");
      }
      else setSubmitError((data as any)?.error ?? "Something went wrong.");
    } catch (e: any) {
      setSubmitError(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  }

  const stepIndex = step === "pick" ? 0 : step === "form" ? 1 : step === "verify" ? 2 : 3;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900">
      {/* Emerald banner (brand-locked, no site nav) */}
      <div
        className="w-full text-white"
        data-surface="emerald"
        style={{ background: EMERALD_GRADIENT, color: "#FFFFFF" }}
      >
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-10 py-8 sm:py-10 lg:py-12 text-center lg:text-left">
          <div className="text-[10px] sm:text-xs tracking-[0.32em] uppercase opacity-80">
            {isPersonal ? "Personal Meeting" : "Private Briefing"}
          </div>
          <h1
            className="mt-3 text-3xl sm:text-4xl lg:text-5xl leading-[1.1] text-balance"
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", fontWeight: 500 }}
          >
            {page.page_title ?? page.event_type.name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-[11px] sm:text-xs tracking-wide opacity-90">
            <span className="font-medium">{brandName}</span>
            <span className="hidden sm:inline opacity-50">·</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {page.event_type.duration_minutes} min</span>
            <span className="hidden sm:inline opacity-50">·</span>
            <span className="inline-flex items-center gap-1.5"><Globe2 className="w-3.5 h-3.5" /> {tz}</span>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-10 py-8 sm:py-10 lg:py-12">
        <div className="grid gap-6 lg:gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] items-start">
          {/* ── Summary rail ─────────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-10 rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 shadow-[0_10px_30px_-18px_rgba(6,78,59,0.35)]">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-emerald-900/70">
              <Sparkles className="w-3.5 h-3.5" /> Smart scheduling
            </div>
            <div
              className="mt-2 text-2xl leading-tight text-emerald-950"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {page.event_type.name}
            </div>
            {page.event_type.description && (
              <p className="mt-2 text-sm text-neutral-600">{page.event_type.description}</p>
            )}

            <ul className="mt-5 space-y-3 text-sm text-neutral-700">
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 mt-0.5 text-emerald-800 shrink-0" />
                <span>{page.event_type.duration_minutes} minutes, one-on-one</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Globe2 className="w-4 h-4 mt-0.5 text-emerald-800 shrink-0" />
                <span>
                  Times shown in {tz}
                  {tzDiffers && <span className="block text-xs text-neutral-500">Your device: {viewerTz}</span>}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CalendarDays className="w-4 h-4 mt-0.5 text-emerald-800 shrink-0" />
                <span>
                  {probing
                    ? "Scanning the calendar…"
                    : openDayCount > 0
                      ? `${openDayCount} open ${openDayCount === 1 ? "day" : "days"} in the next ${days.length} days`
                      : "No open days in this window"}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Video className="w-4 h-4 mt-0.5 text-emerald-800 shrink-0" />
                <span>Meeting details are emailed on confirmation</span>
              </li>
            </ul>

            {selectedSlot && (
              <div className="mt-5 rounded-xl p-4 text-white" style={{ background: EMERALD_GRADIENT }} data-surface="emerald">
                <div className="text-[10px] uppercase tracking-[0.2em] opacity-75">Your selection</div>
                <div className="mt-1 text-sm font-medium">
                  {prettyDate(selectedDate)} · {fmtSlot(selectedSlot)}
                </div>
                {tzDiffers && (
                  <div className="mt-1 text-[11px] opacity-80">{fmtSlot(selectedSlot, viewerTz)} your time</div>
                )}
              </div>
            )}

            <div className="mt-5 flex items-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
              Verified booking · your details stay private
            </div>

            {/* Progress stepper */}
            <ol className="mt-5 flex items-center gap-1.5" aria-label="Booking progress">
              {["Time", "Details", "Verify", "Done"].map((label, i) => (
                <li key={label} className="flex-1">
                  <div
                    className="h-1 rounded-full transition-colors"
                    style={{ background: i <= stepIndex ? "#064E3B" : "#E5E7EB" }}
                  />
                  <div className={`mt-1.5 text-[10px] uppercase tracking-wider ${i <= stepIndex ? "text-emerald-900" : "text-neutral-400"}`}>
                    {label}
                  </div>
                </li>
              ))}
            </ol>
          </aside>

          {/* ── Scheduling surface ──────────────────────────────────────── */}
          <section className="min-w-0 rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6 lg:p-8 shadow-[0_10px_30px_-20px_rgba(6,78,59,0.3)]">
            {step === "pick" && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-wide uppercase">Pick a date</span>
                  </div>
                  {nextOpenDay && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(nextOpenDay)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-900/25 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-50 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Next available
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Date rail — scroll-snap on phone, grid from sm up */}
                <div className="-mx-1 px-1 overflow-x-auto scrollbar-hide sm:overflow-visible">
                  <div className="flex gap-2 sm:grid sm:gap-2 sm:grid-cols-5 md:grid-cols-6 xl:grid-cols-7">
                    {days.map((d) => {
                      const key = toDateKey(d);
                      const active = key === selectedDate;
                      const count = availability[key];
                      const unavailable = count === 0;
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={unavailable}
                          onClick={() => setSelectedDate(key)}
                          aria-pressed={active}
                          className={[
                            "shrink-0 basis-[74px] sm:basis-auto snap-start rounded-xl border px-2 py-2.5 text-center transition",
                            active
                              ? "border-emerald-900 text-white shadow-[0_6px_18px_-10px_rgba(6,78,59,0.8)]"
                              : unavailable
                                ? "border-neutral-100 bg-neutral-50 text-neutral-300 cursor-not-allowed"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-emerald-800 hover:-translate-y-0.5",
                          ].join(" ")}
                          data-surface={active ? "emerald" : undefined}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1px",
                            ...(active
                              ? { background: EMERALD_GRADIENT, color: "#FFFFFF" }
                              : unavailable
                                ? { color: "#C7C7C7" }
                                : { color: "#374151" }),
                          }}
                        >
                          <span style={{ display: "block", fontSize: 10, lineHeight: 1.2, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.8 }}>
                            {d.toLocaleDateString("en-US", { weekday: "short" })}
                          </span>
                          <span style={{ display: "block", fontSize: 17, lineHeight: 1.15, fontWeight: 600 }}>{d.getDate()}</span>
                          <span style={{ display: "block", fontSize: 10, lineHeight: 1.2, opacity: 0.7 }}>
                            {d.toLocaleDateString("en-US", { month: "short" })}
                          </span>
                          <span style={{ display: "block", marginTop: 3, height: 3, width: count === undefined ? 3 : count > 0 ? 16 : 0, borderRadius: 999, background: count === undefined ? "#E5E7EB" : active ? "rgba(255,255,255,0.85)" : "#047857" }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-7">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 text-emerald-900">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium tracking-wide uppercase">Available times</span>
                    </div>
                    <div className="text-xs text-neutral-500">{prettyDate(selectedDate)}</div>
                  </div>

                  {slotsLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-11 rounded-xl bg-neutral-100 animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 px-4 py-8 text-center">
                      <p className="text-sm text-neutral-600">No open times on {prettyDate(selectedDate)}.</p>
                      {nextOpenDay ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDate(nextOpenDay)}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white"
                          style={{ background: EMERALD_GRADIENT }}
                          data-surface="emerald"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Jump to {prettyDate(nextOpenDay)}
                        </button>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-500">Please check back soon or try a later date.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {slotGroups.map((g) => {
                        const Icon = g.icon;
                        return (
                          <div key={g.id}>
                            <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                              <Icon className="w-3.5 h-3.5 text-emerald-800" /> {g.label}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
                              {g.items.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => { setSelectedSlot(s); setStep("form"); }}
                                  className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 transition hover:border-emerald-800 hover:-translate-y-0.5"
                                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}
                                >
                                  <span style={{ display: "block", whiteSpace: "nowrap", fontSize: 14, fontWeight: 500, color: "#111827" }}>{fmtSlot(s)}</span>
                                  {tzDiffers && (
                                    <span style={{ display: "block", whiteSpace: "nowrap", fontSize: 10, color: "#6B7280" }}>{fmtSlot(s, viewerTz)} local</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "form" && selectedSlot && (
              <div>
                <button
                  onClick={() => setStep("pick")}
                  className="mb-5 inline-flex items-center gap-1 text-sm text-emerald-900 hover:text-emerald-700"
                >
                  <ArrowLeft className="w-4 h-4" /> Change time
                </button>
                <div className="mb-6 rounded-xl bg-emerald-50 border-l-4 border-emerald-800 p-4">
                  <div className="text-xs uppercase tracking-wider text-emerald-900/70">Selected</div>
                  <div className="mt-0.5 text-sm sm:text-base font-semibold text-emerald-900">
                    {new Intl.DateTimeFormat("en-US", {
                      timeZone: tz,
                      weekday: "long", month: "long", day: "numeric",
                      hour: "numeric", minute: "2-digit",
                    }).format(new Date(selectedSlot))} ({tz})
                  </div>
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); void submitBooking(); }}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <FieldRow label="Full name" required>
                    <input
                      required maxLength={200}
                      className="input"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    />
                  </FieldRow>
                  <FieldRow label="Email" required>
                    <input
                      required type="email" maxLength={320}
                      className="input"
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                    />
                  </FieldRow>
                  <FieldRow label="Phone">
                    <input
                      type="tel" maxLength={60}
                      className="input"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    />
                  </FieldRow>

                  {customFields.map((f) => (
                    <FieldRow
                      key={f.key}
                      label={f.label}
                      required={f.required}
                      wide={f.type === "textarea"}
                    >
                      {f.type === "textarea" ? (
                        <textarea
                          required={f.required}
                          className="input min-h-[110px]"
                          placeholder={f.placeholder}
                          value={formData[f.key] ?? ""}
                          onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        />
                      ) : (
                        <input
                          required={f.required}
                          type={f.type === "email" ? "email" : f.type === "tel" ? "tel" : "text"}
                          className="input"
                          placeholder={f.placeholder}
                          value={formData[f.key] ?? ""}
                          onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                        />
                      )}
                    </FieldRow>
                  ))}

                  {page.form_fields.some((f) => f.type === "guests") && (
                    <div className="sm:col-span-2">
                      <div className="text-sm font-medium text-neutral-800 mb-2">Invite guest(s)</div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="email" placeholder="guest@email.com"
                          className="input sm:flex-1"
                          value={newGuest}
                          onChange={(e) => setNewGuest(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = newGuest.trim().toLowerCase();
                            if (v && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && !guests.includes(v)) {
                              setGuests([...guests, v]); setNewGuest("");
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2.5 text-sm text-white"
                          style={{ background: EMERALD_GRADIENT }}
                          data-surface="emerald"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>
                      {guests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {guests.map((g) => (
                            <span key={g} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-900 text-xs">
                              {g}
                              <button type="button" aria-label={`Remove ${g}`} onClick={() => setGuests(guests.filter((x) => x !== g))}>
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {submitError && (
                    <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:col-span-2 w-full py-3 rounded-xl text-white font-medium tracking-wide disabled:opacity-70"
                    style={{ background: EMERALD_GRADIENT }}
                    data-surface="emerald"
                  >
                    {submitting ? "Submitting…" : "Request booking"}
                  </button>
                </form>
              </div>
            )}

            {step === "verify" && (
              <div className="mx-auto max-w-md text-center py-4">
                <Mail className="w-10 h-10 text-emerald-800 mx-auto mb-4" />
                <h2 className="text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Check your email</h2>
                <p className="text-neutral-600 mb-6 text-sm">
                  We sent a 6-digit code to <b>{customer.email}</b>. Enter it below to confirm your booking.
                </p>
                <input
                  inputMode="numeric" maxLength={6}
                  aria-label="Verification code"
                  className="input text-center text-2xl tracking-[10px]"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                {submitError && <div className="text-sm text-red-600 mt-3">{submitError}</div>}
                <button
                  onClick={() => submitBooking(verifyCode)}
                  disabled={verifyCode.length !== 6 || submitting}
                  className="mt-4 w-full py-3 rounded-xl text-white font-medium disabled:opacity-70"
                  style={{ background: EMERALD_GRADIENT }}
                  data-surface="emerald"
                >
                  {submitting ? "Verifying…" : "Confirm booking"}
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="mx-auto max-w-lg text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto mb-4" />
                <h2 className="text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {awaitingApproval ? "Request received" : "You're booked"}
                </h2>
                <p className="text-neutral-600 text-sm">
                  {awaitingApproval
                    ? "Your requested time is reserved and awaiting confirmation by our team. You'll receive an email as soon as it is accepted."
                    : (page.confirmation_message ?? "Your booking has been submitted. You'll receive a confirmation email shortly.")}
                </p>
                {awaitingApproval && selectedSlot && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs tracking-wide uppercase border border-emerald-900/30 text-emerald-900">
                    Awaiting confirmation
                  </div>
                )}
                {page.access_mode === "with_promotion" && page.promo_actions.length > 0 && (
                  <div className="mt-8">
                    <div className="text-xs uppercase tracking-widest text-neutral-500 mb-3">While you're here</div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {page.promo_actions.map((a) => (
                        <a
                          key={a.url}
                          href={a.url}
                          className="px-4 py-2 rounded-lg border border-emerald-900 text-emerald-900 text-sm hover:bg-emerald-900 hover:text-white transition"
                        >
                          {a.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-5 sm:px-6 lg:px-10 py-8 text-center text-[11px] text-neutral-400">
        Powered by JBJ Bookings
      </footer>

      <style>{`
        .input {
          width: 100%; padding: 11px 12px; border-radius: 10px;
          border: 1px solid #E5E7EB; background: #fff; color: #111827;
          font-size: 15px; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        @media (min-width: 640px) { .input { font-size: 14px; } }
        .input:focus { border-color: #065F46; box-shadow: 0 0 0 3px rgba(6,95,70,0.15); }
      `}</style>
    </div>
  );
}

function FieldRow({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-sm font-medium text-neutral-800 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
