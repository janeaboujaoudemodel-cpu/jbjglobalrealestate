/**
 * PublicBookingLanding — the standalone /book/:slug page.
 *
 * Design decisions:
 *  - Fully isolated: no header, no footer, no site nav. Renders inside StandaloneRoutes.
 *  - Emerald + white palette (brand tokens 3-stop gradient + Cormorant Garamond).
 *  - Two access modes:
 *      • booking_only         → after success, no site navigation is shown.
 *      • with_promotion       → after success, promo CTAs (e.g. "Explore Properties") appear.
 *  - Flow: pick date → pick slot → fill form (+ optional guests) → email verification → confirmed.
 *
 * All server logic (availability, verification, creation, conflict detection) lives in the
 * booking-public-availability and booking-public-create edge functions.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, CalendarDays, Clock, Mail, ArrowLeft, Plus, X } from "lucide-react";

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

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nextDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => new Date(today.getTime() + i * 86400_000));
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

  // Load available slots
  useEffect(() => {
    if (!page || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("booking-public-availability", {
          method: "GET" as any,
          body: undefined as any,
          headers: {},
        } as any);
        // supabase-js invoke doesn't support GET query; call raw fetch instead.
        void data; void error;
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-public-availability?slug=${encodeURIComponent(page.slug)}&date=${selectedDate}`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } });
        const json = await res.json();
        setSlots(json.slots ?? []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [page, selectedDate]);

  const days = useMemo(() => nextDays(page?.event_type.max_advance_days ?? 30).slice(0, 30), [page]);

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

  const isPersonal = page.event_type.workspace.kind === "personal";
  const brandName = isPersonal ? page.event_type.workspace.display_name : "JBJ Global Real Estate";

  function fmtSlot(iso: string): string {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: page!.event_type.workspace.timezone, hour: "numeric", minute: "2-digit",
    }).format(new Date(iso));
  }

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

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Emerald banner (brand-locked, no site nav) */}
      <div
        className="w-full text-white"
        style={{ background: "linear-gradient(135deg, #064E3B 0%, #042c1c 60%, #000000 100%)" }}
      >
        <div className="max-w-3xl mx-auto px-6 py-10 text-center">
          <div className="text-xs tracking-[0.35em] uppercase opacity-80">{isPersonal ? "Personal Meeting" : "Private Briefing"}</div>
          <h1
            className="mt-3 text-4xl md:text-5xl"
            style={{ fontFamily: "'Cormorant Garamond', 'Playfair Display', serif", fontWeight: 500 }}
          >
            {page.page_title ?? page.event_type.name}
          </h1>
          <div className="mt-3 text-sm opacity-85">{brandName}</div>
          <div className="mt-4 inline-flex items-center gap-4 text-xs tracking-wide opacity-90">
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {page.event_type.duration_minutes} min</span>
            <span>·</span>
            <span>{page.event_type.workspace.timezone}</span>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {step === "pick" && (
          <section>
            {page.event_type.description && (
              <p className="text-neutral-600 mb-8 text-center">{page.event_type.description}</p>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2 text-emerald-900 mb-3">
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm font-medium tracking-wide uppercase">Pick a date</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {days.map((d) => {
                  const key = toDateKey(d);
                  const active = key === selectedDate;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(key)}
                      className={`p-2 text-center rounded-lg border transition ${
                        active
                          ? "bg-emerald-900 text-white border-emerald-900"
                          : "bg-white text-neutral-700 border-neutral-200 hover:border-emerald-800"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider opacity-80">
                        {d.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className="text-base font-semibold">{d.getDate()}</div>
                      <div className="text-[10px] opacity-70">
                        {d.toLocaleDateString("en-US", { month: "short" })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-emerald-900 mb-3">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium tracking-wide uppercase">Available times</span>
              </div>
              {slotsLoading ? (
                <div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 text-emerald-800 animate-spin" /></div>
              ) : slots.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 border border-dashed border-neutral-300 rounded-lg">
                  No available times on this date. Please try another day.
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSlot(s); setStep("form"); }}
                      className="py-2 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-800 hover:border-emerald-800 hover:text-emerald-900 transition"
                    >
                      {fmtSlot(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {step === "form" && selectedSlot && (
          <section>
            <button
              onClick={() => setStep("pick")}
              className="mb-6 inline-flex items-center gap-1 text-sm text-emerald-900 hover:text-emerald-700"
            >
              <ArrowLeft className="w-4 h-4" /> Change time
            </button>
            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border-l-4 border-emerald-800">
              <div className="text-xs uppercase tracking-wider text-emerald-900/70">Selected</div>
              <div className="text-base font-semibold text-emerald-900 mt-0.5">
                {new Intl.DateTimeFormat("en-US", {
                  timeZone: page.event_type.workspace.timezone,
                  weekday: "long", month: "long", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                }).format(new Date(selectedSlot))} ({page.event_type.workspace.timezone})
              </div>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); void submitBooking(); }}
              className="space-y-4"
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

                <FieldRow key={f.key} label={f.label} required={f.required}>
                  {f.type === "textarea" ? (
                    <textarea
                      required={f.required}
                      className="input min-h-[90px]"
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
                <div>
                  <div className="text-sm font-medium text-neutral-800 mb-2">Invite guest(s)</div>
                  <div className="flex gap-2">
                    <input
                      type="email" placeholder="guest@email.com"
                      className="input flex-1"
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
                      className="px-3 py-2 rounded-lg bg-emerald-900 text-white text-sm inline-flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                  {guests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {guests.map((g) => (
                        <span key={g} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-900 text-xs">
                          {g}
                          <button type="button" onClick={() => setGuests(guests.filter((x) => x !== g))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {submitError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{submitError}</div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-lg text-white font-medium tracking-wide disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #064E3B 0%, #042c1c 60%, #000000 100%)" }}
              >
                {submitting ? "Submitting…" : "Request booking"}
              </button>
            </form>
          </section>
        )}

        {step === "verify" && (
          <section className="max-w-md mx-auto text-center">
            <Mail className="w-10 h-10 text-emerald-800 mx-auto mb-4" />
            <h2 className="text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Check your email</h2>
            <p className="text-neutral-600 mb-6 text-sm">
              We sent a 6-digit code to <b>{customer.email}</b>. Enter it below to confirm your booking.
            </p>
            <input
              inputMode="numeric" maxLength={6}
              className="input text-center text-2xl tracking-[10px]"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            {submitError && <div className="text-sm text-red-600 mt-3">{submitError}</div>}
            <button
              onClick={() => submitBooking(verifyCode)}
              disabled={verifyCode.length !== 6 || submitting}
              className="mt-4 w-full py-3 rounded-lg text-white font-medium disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #064E3B 0%, #042c1c 60%, #000000 100%)" }}
            >
              {submitting ? "Verifying…" : "Confirm booking"}
            </button>
          </section>
        )}

        {step === "done" && (
          <section className="max-w-lg mx-auto text-center">
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
          </section>
        )}
      </main>

      <footer className="max-w-3xl mx-auto px-6 py-8 text-center text-[11px] text-neutral-400">
        Powered by JBJ Bookings
      </footer>

      <style>{`
        .input {
          width: 100%; padding: 10px 12px; border-radius: 8px;
          border: 1px solid #E5E7EB; background: #fff; color: #111827;
          font-size: 14px; outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input:focus { border-color: #065F46; box-shadow: 0 0 0 3px rgba(6,95,70,0.15); }
      `}</style>
    </div>
  );
}

function FieldRow({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-neutral-800 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}
