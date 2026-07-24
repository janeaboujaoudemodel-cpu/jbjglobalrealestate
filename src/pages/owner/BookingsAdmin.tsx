import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Grid2X2,
  HelpCircle,
  Link2,
  List,
  Loader2,
  MoreVertical,
  Plus,
  QrCode,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";
import "./bookingsAdmin.css";

type Workspace = Database["public"]["Tables"]["jbj_booking_workspaces"]["Row"];
type EventType = Database["public"]["Tables"]["jbj_booking_event_types"]["Row"];
type BookingPage = Database["public"]["Tables"]["jbj_booking_pages"]["Row"];
type AppointmentStatus = Database["public"]["Enums"]["jbj_booking_status"];

type Appointment = Database["public"]["Tables"]["jbj_booking_appointments"]["Row"] & {
  workspace?: Pick<Workspace, "display_name" | "kind" | "host_name"> | null;
  event_type?: Pick<EventType, "name" | "duration_minutes" | "interval_minutes"> | null;
};

type EventWithRelations = EventType & { workspace?: Workspace | null; pages?: BookingPage[] };

type LegacyBreakfastBooking = {
  id: string;
  preferred_date: string;
  preferred_time: string;
  brokerage_name: string | null;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  attendee_count: number | null;
  briefing_topics: string | null;
  partnership_focus: string | null;
  status: string;
};

type UnifiedAppointment = {
  id: string;
  source: "native" | "breakfast";
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  eventName: string;
  workspaceName: string;
  startsAt: string;
  durationLabel: string;
  status: AppointmentStatus | string;
  guests?: number | null;
};

type ViewKey = "appointments" | "event-types" | "schedules" | "workflows" | "staff" | "booking-pages";
type DetailKey = "details" | "staff" | "availability" | "limits" | "rules" | "notifications" | "form" | "share";
type AppointmentBucket = "upcoming" | "past" | "custom";

const STATUS_STYLES: Partial<Record<AppointmentStatus | string, string>> = {
  pending: "is-pending",
  awaiting_email_verification: "is-verified",
  awaiting_approval: "is-pending",
  accepted: "is-confirmed",
  confirmed: "is-confirmed",
  completed: "is-completed",
  declined: "is-rejected",
  cancelled: "is-cancelled",
  rescheduled: "is-rescheduled",
  no_show: "is-no-show",
  Active: "is-confirmed",
  Merged: "is-confirmed",
};

const detailTabs: Array<{ key: DetailKey; label: string; description: string; icon: typeof FileText }> = [
  { key: "details", label: "Event Types Details", description: "Set the duration, payment type, and meeting mode.", icon: FileText },
  { key: "staff", label: "Assigned Sales & Trainers", description: "View Sales & Trainers who offer this event type.", icon: Users },
  { key: "availability", label: "Availability and Limits", description: "Set the date and time for this Event Types.", icon: Clock },
  { key: "rules", label: "Scheduling Rules", description: "Set buffers, notices, and intervals.", icon: CalendarDays },
  { key: "notifications", label: "Notification Preferences", description: "Configure email, SMS, and calendar notifications.", icon: Send },
  { key: "form", label: "Booking Form", description: "Collect Customer information during booking.", icon: Edit3 },
];

const asArray = <T,>(value: Json | null): T[] => (Array.isArray(value) ? (value as T[]) : []);
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const minutesToLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} Minutes`;
  return `${hours} Hour${hours > 1 ? "s" : ""}${remainder ? ` ${remainder} Minutes` : ""}`;
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-AE", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const buildBookingUrl = (slug?: string) => `${typeof window !== "undefined" ? window.location.origin : "https://www.jbj.ae"}/book/${slug || "jane"}`;
const buildLegacyBreakfastUrl = () => `${typeof window !== "undefined" ? window.location.origin : "https://www.jbj.ae"}/breakfast-booking?token={{invite_token}}`;
const bookingInitials = (name?: string | null) => (name?.trim() || "JBJ").split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

const weekdayNames: Record<string, string> = {
  "0": "Sunday", "1": "Monday", "2": "Tuesday", "3": "Wednesday", "4": "Thursday", "5": "Friday", "6": "Saturday",
};

export default function BookingsAdmin() {
  const [view, setView] = useState<ViewKey>("appointments");
  const [detailTab, setDetailTab] = useState<DetailKey>("details");
  const [appointmentBucket, setAppointmentBucket] = useState<AppointmentBucket>("upcoming");
  const [query, setQuery] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [legacyBreakfastBookings, setLegacyBreakfastBookings] = useState<LegacyBreakfastBooking[]>([]);
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [pages, setPages] = useState<BookingPage[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [workspaceRes, pageRes, eventRes, appointmentRes, breakfastRes] = await Promise.all([
      supabase.from("jbj_booking_workspaces").select("*").order("kind"),
      supabase.from("jbj_booking_pages").select("*").order("created_at", { ascending: true }),
      supabase.from("jbj_booking_event_types").select("*, workspace:jbj_booking_workspaces(*)").order("created_at", { ascending: true }),
      supabase.from("jbj_booking_appointments").select("*, workspace:jbj_booking_workspaces(display_name, kind, host_name), event_type:jbj_booking_event_types(name, duration_minutes, interval_minutes)").order("starts_at", { ascending: true }),
      supabase.from("meeting_requests").select("id, preferred_date, preferred_time, brokerage_name, requester_name, requester_email, requester_phone, attendee_count, briefing_topics, partnership_focus, status").eq("booking_kind", "brokerage_breakfast").in("status", ["pending", "completed"]).order("preferred_date", { ascending: true }),
    ]);

    if (workspaceRes.error || pageRes.error || eventRes.error || appointmentRes.error) toast.error("Bookings could not load");
    const nextPages = pageRes.data ?? [];
    const nextEvents = (eventRes.data ?? []).map((event) => ({ ...(event as EventWithRelations), pages: nextPages.filter((page) => page.event_type_id === event.id) }));

    setWorkspaces(workspaceRes.data ?? []);
    setPages(nextPages);
    setEvents(nextEvents);
    setAppointments((appointmentRes.data ?? []) as Appointment[]);
    setLegacyBreakfastBookings((breakfastRes.data ?? []) as LegacyBreakfastBooking[]);
    setActiveEventId((current) => current ?? nextEvents[0]?.id ?? null);
    setLoading(false);
  };

  useEffect(() => { void loadData(); }, []);

  const activeEvent = useMemo(() => events.find((event) => event.id === activeEventId) ?? events[0], [activeEventId, events]);
  const activePage = activeEvent?.pages?.[0] ?? pages.find((page) => page.event_type_id === activeEvent?.id);
  const availability = asRecord(activeEvent?.weekly_availability ?? null);
  const formFields = asArray<{ key?: string; label?: string; type?: string; required?: boolean }>(activePage?.form_fields ?? null);
  const promoActions = asArray<{ label?: string; url?: string }>(activePage?.promo_actions ?? null);

  const unifiedAppointments = useMemo<UnifiedAppointment[]>(() => {
    const native = appointments.map((appointment) => ({
      id: appointment.id,
      source: "native" as const,
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      customerPhone: appointment.customer_phone,
      eventName: appointment.event_type?.name ?? "Booking",
      workspaceName: appointment.workspace?.display_name ?? "JBJ Bookings",
      startsAt: appointment.starts_at,
      durationLabel: minutesToLabel(Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60000)),
      status: appointment.status,
      guests: Array.isArray(appointment.guest_emails) ? appointment.guest_emails.length : 0,
    }));
    const breakfast = legacyBreakfastBookings.map((booking) => ({
      id: booking.id,
      source: "breakfast" as const,
      customerName: booking.requester_name,
      customerEmail: booking.requester_email,
      customerPhone: booking.requester_phone,
      eventName: "Private Breakfast Briefing",
      workspaceName: booking.brokerage_name ?? "Brokerage Breakfast",
      startsAt: `${booking.preferred_date}T${booking.preferred_time || "09:00"}:00`,
      durationLabel: "1 Hour",
      status: booking.status,
      guests: booking.attendee_count,
    }));
    return [...native, ...breakfast].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [appointments, legacyBreakfastBookings]);

  const filteredAppointments = unifiedAppointments.filter((appointment) => {
    const starts = new Date(appointment.startsAt).getTime();
    const matchesBucket = appointmentBucket === "custom" || (appointmentBucket === "upcoming" ? starts >= Date.now() : starts < Date.now());
    const haystack = `${appointment.customerName} ${appointment.customerEmail} ${appointment.eventName} ${appointment.workspaceName}`.toLowerCase();
    return matchesBucket && (!query || haystack.includes(query.toLowerCase()));
  });

  const runAppointmentAction = async (appointment: UnifiedAppointment, action: "confirm" | "reject" | "cancel") => {
    if (appointment.source !== "native") {
      toast.info("Legacy breakfast bookings are confirmed from their invite workflow.");
      return;
    }
    setActionId(appointment.id);
    const { error } = await supabase.functions.invoke("booking-admin-action", { body: { appointment_id: appointment.id, action } });
    if (error) toast.error("Booking action failed");
    else {
      toast.success(action === "confirm" ? "Email sent automatically" : "Booking updated");
      await loadData();
    }
    setActionId(null);
  };

  const copyPageLink = async (slug?: string) => {
    await navigator.clipboard.writeText(buildBookingUrl(slug));
    toast.success("Booking link copied");
  };

  const navItems: Array<{ key: ViewKey; label: string; icon: typeof CalendarCheck }> = [
    { key: "appointments", label: "Appointments", icon: CalendarCheck },
    { key: "event-types", label: activeEvent?.name ?? "Event Types", icon: Globe2 },
    { key: "schedules", label: "Schedules", icon: Clock },
    { key: "workflows", label: "Workflows", icon: SlidersHorizontal },
    { key: "staff", label: "Sales & Trainers", icon: Users },
    { key: "booking-pages", label: "Booking Pages", icon: FileText },
  ];

  return (
    <main className="booking-console" data-jbj-bookings>
      <header className="booking-console__topbar">
        <div className="booking-console__brand"><span className="booking-console__brand-mark">✓</span><strong>Bookings</strong></div>
        <div className="booking-console__top-actions"><span>JBJ Booking Workspace</span><Button type="button" size="icon" onClick={() => setView("event-types")}><Plus className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon"><CalendarDays className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon"><Settings className="h-4 w-4" /></Button><div className="booking-console__profile">JB</div></div>
      </header>
      <aside className="booking-console__sidebar" aria-label="JBJ Bookings navigation">
        <button type="button" className="booking-console__workspace"><span>JB</span><strong>Jane Bou Jaoude</strong><ChevronDown className="h-4 w-4" /></button>
        <nav>{navItems.map((item) => { const Icon = item.icon; return <button key={item.key} type="button" className="booking-console__nav-item" data-active={view === item.key && !detailOpen} onClick={() => { setView(item.key); setDetailOpen(false); }}><Icon className="h-4 w-4" /><span>{item.label}</span></button>; })}</nav>
      </aside>
      <section className="booking-console__content">
        {detailOpen && activeEvent ? <EventDetailWorkspace event={activeEvent} page={activePage} detailTab={detailTab} setDetailTab={setDetailTab} availability={availability} formFields={formFields} promoActions={promoActions} editing={editingDetails} setEditing={setEditingDetails} onClose={() => setDetailOpen(false)} onShare={() => setShareOpen(true)} /> : <>
          {view === "appointments" && <AppointmentsWorkspace appointments={filteredAppointments} totalCount={unifiedAppointments.length} bucket={appointmentBucket} setBucket={setAppointmentBucket} query={query} setQuery={setQuery} loading={loading} actionId={actionId} onAction={runAppointmentAction} />}
          {view === "event-types" && <EventTypesWorkspace events={events} activeEvent={activeEvent} onSelectEvent={(eventId) => { setActiveEventId(eventId); setDetailOpen(true); setDetailTab("details"); }} onShare={() => setShareOpen(true)} />}
          {view === "schedules" && <SchedulesWorkspace workspaces={workspaces} events={events} />}
          {view === "workflows" && <WorkflowsWorkspace events={events} />}
          {view === "staff" && <StaffWorkspace workspaces={workspaces} />}
          {view === "booking-pages" && <BookingPagesWorkspace pages={pages} events={events} onCopy={copyPageLink} />}
        </>}
      </section>
      {shareOpen && <ShareDialog title={activeEvent?.name ?? "JBJ Booking"} url={buildBookingUrl(activePage?.slug)} onClose={() => setShareOpen(false)} onCopy={() => void copyPageLink(activePage?.slug)} />}
    </main>
  );
}

function AppointmentsWorkspace({ appointments, totalCount, bucket, setBucket, query, setQuery, loading, actionId, onAction }: { appointments: UnifiedAppointment[]; totalCount: number; bucket: AppointmentBucket; setBucket: (value: AppointmentBucket) => void; query: string; setQuery: (value: string) => void; loading: boolean; actionId: string | null; onAction: (appointment: UnifiedAppointment, action: "confirm" | "reject" | "cancel") => Promise<void> }) {
  return <div className="booking-console__page booking-console__page--appointments"><div className="booking-console__page-head"><div><h1>Appointments</h1><p>{totalCount} booking record{totalCount === 1 ? "" : "s"} across native booking pages and the breakfast invitation calendar.</p></div><HelpCircle className="h-4 w-4" /></div><div className="booking-console__toolbar"><div className="booking-console__tabs"><button type="button" data-active={bucket === "upcoming"} onClick={() => setBucket("upcoming")}>Upcoming</button><button type="button" data-active={bucket === "past"} onClick={() => setBucket("past")}>Past</button><button type="button" data-active={bucket === "custom"} onClick={() => setBucket("custom")}>Custom Date</button></div><label className="booking-console__search"><Search className="h-4 w-4" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></label></div>{loading ? <div className="booking-console__empty"><Loader2 className="h-6 w-6 animate-spin" /> Loading appointments…</div> : appointments.length === 0 ? <div className="booking-console__empty is-large"><CalendarCheck className="h-16 w-16" /><h2>No upcoming appointments</h2><p>Organize your schedule by adding appointments here.</p><Button type="button"><Plus className="h-4 w-4" /> New Appointment</Button></div> : <div className="booking-console__appointment-list">{appointments.map((appointment) => <article key={`${appointment.source}-${appointment.id}`} className="booking-console__appointment-card"><div><strong>{appointment.customerName}</strong><small>{appointment.customerEmail}</small>{appointment.customerPhone && <small>{appointment.customerPhone}</small>}</div><div><strong>{appointment.eventName}</strong><small>{appointment.workspaceName}</small>{appointment.source === "breakfast" && <small>Legacy breakfast calendar merged into JBJ Bookings</small>}</div><div><strong>{formatDateTime(appointment.startsAt)}</strong><small>{appointment.durationLabel}{appointment.guests ? ` · ${appointment.guests} guest(s)` : ""}</small></div><BookingBadge status={appointment.status} /><div className="booking-console__row-actions"><Button type="button" size="sm" variant="outline" disabled={actionId === appointment.id} onClick={() => void onAction(appointment, "confirm")}><Check className="h-4 w-4" /> Confirm</Button><Button type="button" size="sm" variant="ghost" disabled={actionId === appointment.id} onClick={() => void onAction(appointment, "cancel")}><X className="h-4 w-4" /> Cancel</Button></div></article>)}</div>}</div>;
}

function EventTypesWorkspace({ events, activeEvent, onSelectEvent, onShare }: { events: EventWithRelations[]; activeEvent?: EventWithRelations; onSelectEvent: (id: string) => void; onShare: () => void }) {
  return <div className="booking-console__page"><div className="booking-console__event-list-head"><div><h1>Active {activeEvent?.name ?? "Event Types"}</h1><span>{events.filter((event) => event.is_active).length}</span><ChevronDown className="h-4 w-4" /></div><div className="booking-console__event-actions"><label className="booking-console__search is-compact"><Search className="h-4 w-4" /><input placeholder={`Search ${activeEvent?.name ?? "Event Types"}`} /></label><Button type="button" variant="outline" size="icon"><Grid2X2 className="h-4 w-4" /></Button><Button type="button" variant="outline" size="icon"><List className="h-4 w-4" /></Button><Button type="button"><Plus className="h-4 w-4" /> New Event Types</Button><HelpCircle className="h-4 w-4" /></div></div><div className="booking-console__event-grid">{events.map((event) => <button key={event.id} type="button" className="booking-console__event-card" onClick={() => onSelectEvent(event.id)}><span className="booking-console__event-mark">{bookingInitials(event.name)}</span><span className="booking-console__event-main"><strong>{event.name}</strong><small>{minutesToLabel(event.duration_minutes)} <span>|</span> One-on-One</small></span><span className="booking-console__event-footer"><UserRound className="h-5 w-5" /><strong>{event.workspace?.display_name ?? "JBJ Global Real Estate"}</strong><span className="booking-console__share-pill" onClick={(eventClick) => { eventClick.stopPropagation(); onShare(); }}><Send className="h-3.5 w-3.5" /> Share</span></span></button>)}</div></div>;
}

function EventDetailWorkspace({ event, page, detailTab, setDetailTab, availability, formFields, promoActions, editing, setEditing, onClose, onShare }: { event: EventWithRelations; page?: BookingPage; detailTab: DetailKey; setDetailTab: (tab: DetailKey) => void; availability: Record<string, unknown>; formFields: Array<{ key?: string; label?: string; type?: string; required?: boolean }>; promoActions: Array<{ label?: string; url?: string }>; editing: boolean; setEditing: (value: boolean) => void; onClose: () => void; onShare: () => void }) {
  return <div className="booking-console__detail-page"><header className="booking-console__detail-top"><div className="booking-console__event-identity"><span className="booking-console__event-mark is-large">{bookingInitials(event.name)}</span><div><h1>{event.name}</h1><p>One-on-One</p></div></div><div className="booking-console__detail-actions"><Button type="button" variant="outline" onClick={onShare}><Send className="h-4 w-4" /> Share</Button><Button type="button" variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></div></header><div className="booking-console__detail-shell"><aside className="booking-console__detail-nav">{detailTabs.map((tab) => { const Icon = tab.icon; return <button key={tab.key} type="button" data-active={detailTab === tab.key} onClick={() => { setDetailTab(tab.key); setEditing(false); }}><Icon className="h-5 w-5" /><span><strong>{tab.label}</strong><small>{tab.description}</small></span>{tab.key === "availability" && <ChevronDown className="h-4 w-4" />}</button>; })}</aside><section className="booking-console__detail-card">{detailTab === "details" && <DetailsPane event={event} page={page} editing={editing} setEditing={setEditing} />}{detailTab === "staff" && <StaffPane event={event} />}{detailTab === "availability" && <AvailabilityPane availability={availability} />}{detailTab === "limits" && <LimitsPane />}{detailTab === "rules" && <RulesPane event={event} />}{detailTab === "notifications" && <NotificationsPane event={event} />}{detailTab === "form" && <FormPane fields={formFields} />}{detailTab === "share" && <SharePane page={page} promoActions={promoActions} />}</section></div></div>;
}

function DetailsPane({ event, page, editing, setEditing }: { event: EventWithRelations; page?: BookingPage; editing: boolean; setEditing: (value: boolean) => void }) {
  if (editing) return <div className="booking-console__settings-pane"><PaneHead title="Event Types Details" actions={<><Button type="button" size="sm" onClick={() => setEditing(false)}>Save</Button><Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></>} /><div className="booking-console__edit-form"><Field label="Event Type Name" value={event.name} required /><Field label="Duration" value={minutesToLabel(event.duration_minutes)} /><Segment label="Price" options={["Paid", "Free"]} active="Free" /><Segment label="Meeting Mode" options={["Online", "Offline"]} active="Offline" /><Segment label="Visibility" options={["Public", "Private"]} active="Public" /><Segment label="Status" options={["Active", "Inactive"]} active={event.is_active ? "Active" : "Inactive"} /><label className="booking-console__text-area"><span>Description</span><textarea /></label><Field label="Calendar Assist" value="Not Integrated" disabled /></div></div>;
  return <div className="booking-console__settings-pane"><PaneHead title="Event Types Details" actions={<Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}><Edit3 className="h-4 w-4" /> Edit</Button>} /><div className="booking-console__event-summary"><span className="booking-console__event-mark is-medium">{bookingInitials(event.name)}</span><h2>{event.name}</h2></div><div className="booking-console__two-col"><Setting label="Event Type Name" value={event.name} /><Setting label="Duration" value={minutesToLabel(event.duration_minutes)} /><Setting label="Price" value="Free" /><Setting label="Meeting Mode" value="-" /><Setting label="Visibility" value={page?.access_mode === "booking_only" ? "Public" : "Public"} /><Setting label="Status" value={event.is_active ? "Active" : "Inactive"} /><Setting label="Description" value={event.description ?? "-"} /><Setting label="Calendar Assist" value="Not Integrated" /></div></div>;
}

function StaffPane({ event }: { event: EventWithRelations }) { return <div className="booking-console__settings-pane"><PaneHead title="Assigned Sales & Trainers" actions={<Button type="button" size="sm" variant="outline"><Plus className="h-4 w-4" /> Assign</Button>} /><article className="booking-console__staff-row"><span className="booking-console__profile">JB</span><div><strong>{event.workspace?.host_name ?? "Jane Bou Jaoude"}</strong><small>{event.workspace?.sender_email ?? "contact@jbj.ae"}</small></div><BookingBadge status="Active" /></article></div>; }

function AvailabilityPane({ availability }: { availability: Record<string, unknown> }) { const entries = Object.entries(availability); return <div className="booking-console__settings-pane"><PaneHead title="Event Types Availability" /><section className="booking-console__availability-box"><div><ChevronDown className="h-4 w-4" /><span><strong>Default Hours</strong><small>Set availability specific to this event type.</small></span><Button type="button" size="sm" variant="outline"><Edit3 className="h-4 w-4" /> Customize</Button></div><Setting label="Schedule Based On" value="User Working Hours" /><Setting label="Available Dates" value="Forever" /><label className="booking-console__checkbox"><input type="checkbox" /> Override User-specific Hours</label>{entries.map(([day, slots]) => <div key={day} className="booking-console__hours-row"><strong>{weekdayNames[day] ?? day}</strong><span>{Array.isArray(slots) ? slots.map((slot) => { const item = asRecord(slot); return `${item.start ?? "09:00"} - ${item.end ?? "17:00"}`; }).join(", ") : "Closed"}</span></div>)}</section><section className="booking-console__availability-box is-collapsed"><div><ChevronDown className="h-4 w-4" /><span><strong>User-specific Hours</strong><small>Set different availability for specific Sales & Trainers.</small></span><Button type="button" size="sm" variant="outline"><Plus className="h-4 w-4" /> Add Working Hours</Button></div></section></div>; }

function LimitsPane() { return <div className="booking-console__settings-pane"><PaneHead title="Appointment Limits" /><div className="booking-console__stacked-form"><Field label="Slots per Event Type" value="No limit" /><Field label="Slots per Customer" value="One active appointment" /><section className="booking-console__custom-limit"><strong>Custom Date Limits</strong><p>Set booking limits for a specific date or date range.</p><div><Field label="Select Date Range" value="" /><Field label="Slots per Event Type" value="No limit" /><Field label="Slots per Customer" value="No limit" /></div><Button type="button" size="sm">Save</Button></section></div></div>; }

function RulesPane({ event }: { event: EventWithRelations }) { return <div className="booking-console__settings-pane"><PaneHead title="Scheduling Rules" /><div className="booking-console__rule-grid"><RuleCard title="Pre-buffer" subtitle="Extra time added before an appointment" value="0 Hours · 0 Minutes" /><RuleCard title="Post-buffer" subtitle="Extra time added after an appointment" value="0 Hours · 0 Minutes" /><RuleCard title="Minimum Booking Notice" subtitle="Shortest notice required to avoid last-minute bookings" value={`${Math.max(1, Math.round(event.min_notice_hours / 24))} Days · 0 Hours · 0 Minutes`} /><RuleCard title="Maximum Booking Notice" subtitle="How far in advance an appointment can be booked" value={`${event.max_advance_days} Days · 0 Hours · 0 Minutes`} /><RuleCard title="Scheduling Interval" subtitle="The interval between each appointment's start time." value={`Adjusted Slots · ${minutesToLabel(event.interval_minutes)}`} wide /></div></div>; }

function NotificationsPane({ event }: { event: EventWithRelations }) { return <div className="booking-console__settings-pane"><PaneHead title="Email Notifications and Reminders" /><div className="booking-console__tabs is-inline"><button type="button" data-active="true">To Customer</button><button type="button">To User</button></div><h3>Notifications</h3><div className="booking-console__notification-grid">{[["Booked", CalendarCheck], ["Rescheduled", Clock], ["Canceled", X], ["Completed", Check], ["No Show", Eye]].map(([label, Icon]) => { const NotificationIcon = Icon as typeof CalendarCheck; return <article key={String(label)}><MoreVertical className="h-4 w-4" /><NotificationIcon className="h-5 w-5" /><strong>{String(label)}</strong></article>; })}</div><h3>Reminders</h3><div className="booking-console__reminder-grid"><ReminderCard value="30" unit="Minutes" /><ReminderCard value="1" unit="Days" /><ReminderCard value="3" unit="Hours" /></div><div className="booking-console__three-col"><Setting label="Send from" value={event.workspace?.sender_email ?? "contact@jbj.ae"} /><Setting label="Reply To" value={event.workspace?.notification_email ?? "helpdesk@jbj.ae"} /><Setting label="Copy(Cc)" value="Select Copy (Cc)" /></div></div>; }

function FormPane({ fields }: { fields: Array<{ key?: string; label?: string; type?: string; required?: boolean }> }) { const effectiveFields = fields.length > 0 ? fields : [{ label: "Company Name", required: true }, { label: "Company Email", required: true }, { label: "Company Number", required: true }, { label: "Admin Name", required: true }, { label: "Broker Email", required: true }, { label: "Broker Number", required: true }, { label: "Invite Guest(s)", required: false }]; return <div className="booking-console__settings-pane"><PaneHead title="Booking Form" actions={<Button type="button" size="sm" variant="outline"><Plus className="h-4 w-4" /> Add Field</Button>} /><h3>Fields</h3><div className="booking-console__field-list">{effectiveFields.map((field, index) => <div key={field.key ?? field.label ?? index}><span>⋮⋮</span><strong>{field.label ?? field.key ?? "Field"}{field.required && <b>*</b>}</strong>{String(field.label ?? field.key).toLowerCase().includes("email") && <small>Verification enabled</small>}</div>)}</div><h3>Consent and Verification</h3><div className="booking-console__field-list is-small"><div><span>⋮⋮</span><strong>Terms and Conditions</strong><i /></div><div><span>⋮⋮</span><strong>CAPTCHA</strong><i /></div></div><h3>Booking Confirmation Button</h3><div className="booking-console__two-col"><Setting label="Free Appointments" value="Schedule Appointment" /><Setting label="Paid Appointments" value="Pay and Schedule Appointment" /></div></div>; }

function SharePane({ page, promoActions }: { page?: BookingPage; promoActions: Array<{ label?: string; url?: string }> }) { return <div className="booking-console__settings-pane"><PaneHead title="Sharing" /><div className="booking-console__share-line"><Link2 className="h-4 w-4" /><span>{buildBookingUrl(page?.slug)}</span><Button type="button" size="sm"><Copy className="h-4 w-4" /> Copy</Button></div><div className="booking-console__share-line"><Link2 className="h-4 w-4" /><span>{buildLegacyBreakfastUrl()}</span><small>Legacy invite-token calendar preserved</small></div><div className="booking-console__qr"><QrCode className="h-20 w-20" /><span>QR ready for this booking page</span></div>{promoActions.length > 0 && <div className="booking-console__promo-actions">{promoActions.map((action, index) => <a key={`${action.label}-${index}`} href={action.url} target="_blank" rel="noreferrer">{action.label}<ExternalLink className="h-3 w-3" /></a>)}</div>}</div>; }

function SchedulesWorkspace({ workspaces, events }: { workspaces: Workspace[]; events: EventWithRelations[] }) { return <SimpleWorkspace title="Schedules" subtitle="Workspace calendars and weekly working-hour profiles.">{workspaces.map((workspace) => <Setting key={workspace.id} label={workspace.display_name} value={`${workspace.timezone} · ${events.filter((event) => event.workspace_id === workspace.id).length} event type(s)`} />)}</SimpleWorkspace>; }
function WorkflowsWorkspace({ events }: { events: EventWithRelations[] }) { return <SimpleWorkspace title="Workflows" subtitle="Approval, verification, notification, and calendar-sync workflow map.">{events.map((event) => <Setting key={event.id} label={event.name} value="Request → verify email → owner review → email confirmation → calendar sync" />)}</SimpleWorkspace>; }
function StaffWorkspace({ workspaces }: { workspaces: Workspace[] }) { return <SimpleWorkspace title="Sales & Trainers" subtitle="Hosts are isolated by booking workspace identity.">{workspaces.map((workspace) => <Setting key={workspace.id} label={workspace.host_name} value={`${workspace.kind === "personal" ? "Personal" : "JBJ Business"} · ${workspace.sender_email}`} />)}</SimpleWorkspace>; }
function BookingPagesWorkspace({ pages, events, onCopy }: { pages: BookingPage[]; events: EventWithRelations[]; onCopy: (slug?: string) => Promise<void> }) { return <div className="booking-console__page"><div className="booking-console__page-head"><div><h1>Booking Pages</h1><p>Canonical public pages and the preserved invite-token breakfast calendar.</p></div></div><div className="booking-console__page-grid">{pages.map((page) => { const event = events.find((item) => item.id === page.event_type_id); return <article key={page.id} className="booking-console__booking-page-card"><Globe2 className="h-5 w-5" /><div><strong>{page.page_title ?? event?.name ?? page.slug}</strong><small>{buildBookingUrl(page.slug)}</small></div><Button type="button" size="sm" variant="outline" onClick={() => void onCopy(page.slug)}><Copy className="h-4 w-4" />Copy</Button></article>; })}<article className="booking-console__booking-page-card"><CalendarCheck className="h-5 w-5" /><div><strong>Private Breakfast Invitation Calendar</strong><small>{buildLegacyBreakfastUrl()}</small></div><BookingBadge status="Merged" /></article></div></div>; }

function ShareDialog({ title, url, onClose, onCopy }: { title: string; url: string; onClose: () => void; onCopy: () => void }) { return <div className="booking-console__modal-backdrop" role="dialog" aria-modal="true"><div className="booking-console__modal"><header><h2>Share - {title}</h2><Button type="button" variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button></header><div className="booking-console__copy-box"><span>{url}</span><Button type="button" onClick={onCopy}>Copy</Button><Button type="button" variant="outline" size="icon" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button></div><section className="booking-console__qr-panel"><QrCode className="h-20 w-20" /><p>Share this QR code to open the booking page instantly on any device.</p><Button type="button" variant="ghost"><Copy className="h-4 w-4" /> Download QR</Button></section><div className="booking-console__tabs is-inline"><button type="button" data-active="true">Shorten Link</button><button type="button">One time Link</button><button type="button">Embed as Widget</button><button type="button">Copy Time Slots</button></div><Button type="button" variant="outline">Generate Shortened URL</Button></div></div>; }

function PaneHead({ title, actions }: { title: string; actions?: ReactNode }) { return <header className="booking-console__pane-head"><h2>{title}</h2><div>{actions}<HelpCircle className="h-4 w-4" /></div></header>; }
function Setting({ label, value }: { label: string; value: string }) { return <div className="booking-console__setting"><span>{label}</span><strong>{value}</strong></div>; }
function Field({ label, value, required, disabled }: { label: string; value: string; required?: boolean; disabled?: boolean }) { return <label className="booking-console__field"><span>{label}{required && <b>*</b>}</span><input value={value} readOnly disabled={disabled} /></label>; }
function Segment({ label, options, active }: { label: string; options: string[]; active: string }) { return <div className="booking-console__segment"><span>{label}</span><div>{options.map((option) => <button key={option} type="button" data-active={option === active}>{option}</button>)}</div></div>; }
function RuleCard({ title, subtitle, value, wide }: { title: string; subtitle: string; value: string; wide?: boolean }) { return <article className="booking-console__rule-card" data-wide={wide ? "true" : "false"}><strong>{title}</strong><p>{subtitle}</p><span>{value}</span></article>; }
function ReminderCard({ value, unit }: { value: string; unit: string }) { return <article className="booking-console__reminder-card"><MoreVertical className="h-4 w-4" /><span>Before</span><div><strong>{value}</strong><small>{unit}</small></div></article>; }
function BookingBadge({ status }: { status: AppointmentStatus | string }) { const style = STATUS_STYLES[status] ?? "is-pending"; return <span className={`booking-console__badge ${style}`}>{String(status).replace(/_/g, " ")}</span>; }
function SimpleWorkspace({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) { return <div className="booking-console__page"><div className="booking-console__page-head"><div><h1>{title}</h1><p>{subtitle}</p></div></div><div className="booking-console__settings-grid">{children}</div></div>; }