import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Link2,
  Mail,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

type Workspace = Database["public"]["Tables"]["jbj_booking_workspaces"]["Row"];
type EventType = Database["public"]["Tables"]["jbj_booking_event_types"]["Row"];
type BookingPage = Database["public"]["Tables"]["jbj_booking_pages"]["Row"];
type AppointmentStatus = Database["public"]["Enums"]["jbj_booking_status"];

type Appointment = Database["public"]["Tables"]["jbj_booking_appointments"]["Row"] & {
  workspace?: Pick<Workspace, "display_name" | "kind" | "host_name"> | null;
  event_type?: Pick<EventType, "name" | "duration_minutes" | "interval_minutes"> | null;
  booking_page?: Pick<BookingPage, "slug" | "page_title" | "access_mode"> | null;
};

type EventWithRelations = EventType & {
  workspace?: Workspace | null;
  pages?: BookingPage[];
};

type ViewKey = "appointments" | "event-types" | "schedules" | "workflows" | "staff" | "booking-pages";
type DetailKey = "details" | "staff" | "availability" | "limits" | "rules" | "notifications" | "form" | "share";

const WORKSPACE_LABELS: Record<Workspace["kind"], string> = {
  personal: "Personal Booking Workspace",
  business: "JBJ Business Booking Workspace",
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "is-pending",
  awaiting_email_verification: "is-verified",
  awaiting_approval: "is-pending",
  accepted: "is-confirmed",
  confirmed: "is-confirmed",
  declined: "is-rejected",
  cancelled: "is-cancelled",
  rescheduled: "is-rescheduled",
  completed: "is-completed",
  no_show: "is-no-show",
};

const bookingViews: Array<{ key: ViewKey; label: string; icon: typeof CalendarCheck }> = [
  { key: "appointments", label: "Appointments", icon: CalendarCheck },
  { key: "event-types", label: "Event Types", icon: FileText },
  { key: "schedules", label: "Schedules", icon: Clock },
  { key: "workflows", label: "Workflows", icon: SlidersHorizontal },
  { key: "staff", label: "Sales & Trainers", icon: Users },
  { key: "booking-pages", label: "Booking Pages", icon: Globe2 },
];

const detailTabs: Array<{ key: DetailKey; label: string; icon: typeof FileText }> = [
  { key: "details", label: "Details", icon: FileText },
  { key: "staff", label: "Assigned Staff", icon: UserRound },
  { key: "availability", label: "Availability", icon: CalendarCheck },
  { key: "limits", label: "Appointment Limits", icon: ShieldCheck },
  { key: "rules", label: "Scheduling Rules", icon: Settings },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "form", label: "Booking Form", icon: Edit3 },
  { key: "share", label: "Share", icon: Link2 },
];

const asArray = <T,>(value: Json | null): T[] => (Array.isArray(value) ? (value as T[]) : []);
const asRecord = (value: Json | null): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-AE", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const minutesToLabel = (minutes: number) => `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ""}`;

const buildBookingUrl = (slug?: string) => {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.jbj.ae";
  return `${origin}/book/${slug || "jane"}`;
};

const weekdayNames: Record<string, string> = {
  "0": "Sunday",
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
};

export default function BookingsAdmin() {
  const [view, setView] = useState<ViewKey>("appointments");
  const [detailTab, setDetailTab] = useState<DetailKey>("details");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [workspaceFilter, setWorkspaceFilter] = useState<"all" | Workspace["kind"]>("all");
  const [query, setQuery] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<EventWithRelations[]>([]);
  const [pages, setPages] = useState<BookingPage[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [workspaceRes, pageRes, eventRes, appointmentRes] = await Promise.all([
      supabase.from("jbj_booking_workspaces").select("*").order("kind"),
      supabase.from("jbj_booking_pages").select("*").order("created_at", { ascending: true }),
      supabase
        .from("jbj_booking_event_types")
        .select("*, workspace:jbj_booking_workspaces(*)")
        .order("created_at", { ascending: true }),
      supabase
        .from("jbj_booking_appointments")
        .select(
          "*, workspace:jbj_booking_workspaces(display_name, kind, host_name), event_type:jbj_booking_event_types(name, duration_minutes, interval_minutes), booking_page:jbj_booking_pages(slug, page_title, access_mode)",
        )
        .order("starts_at", { ascending: true }),
    ]);

    if (workspaceRes.error || pageRes.error || eventRes.error || appointmentRes.error) {
      toast.error("Bookings could not load");
    }

    const nextPages = pageRes.data ?? [];
    const nextEvents = (eventRes.data ?? []).map((event) => ({
      ...(event as EventWithRelations),
      pages: nextPages.filter((page) => page.event_type_id === event.id),
    }));

    setWorkspaces(workspaceRes.data ?? []);
    setPages(nextPages);
    setEvents(nextEvents);
    setAppointments((appointmentRes.data ?? []) as Appointment[]);
    setActiveEventId((current) => current ?? nextEvents[0]?.id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activeEvent = useMemo(
    () => events.find((event) => event.id === activeEventId) ?? events[0],
    [activeEventId, events],
  );

  const activePage = activeEvent?.pages?.[0] ?? pages.find((page) => page.event_type_id === activeEvent?.id);
  const availability = asRecord(activeEvent?.weekly_availability ?? null);
  const formFields = asArray<{ key?: string; label?: string; type?: string; required?: boolean }>(activePage?.form_fields ?? null);
  const promoActions = asArray<{ label?: string; url?: string }>(activePage?.promo_actions ?? null);

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    const matchesWorkspace = workspaceFilter === "all" || appointment.workspace?.kind === workspaceFilter;
    const haystack = `${appointment.customer_name} ${appointment.customer_email} ${appointment.event_type?.name ?? ""}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query.toLowerCase());
    return matchesStatus && matchesWorkspace && matchesQuery;
  });

  const counts = useMemo(() => {
    const upcoming = appointments.filter((item) => new Date(item.starts_at).getTime() >= Date.now()).length;
    const pending = appointments.filter((item) => item.status === "pending" || item.status === "awaiting_email_verification" || item.status === "awaiting_approval").length;
    return {
      upcoming,
      pending,
      confirmed: appointments.filter((item) => item.status === "confirmed").length,
      pages: pages.filter((page) => page.is_active).length,
    };
  }, [appointments, pages]);

  const runAppointmentAction = async (appointmentId: string, action: "confirm" | "reject" | "cancel") => {
    setActionId(appointmentId);
    const { error } = await supabase.functions.invoke("booking-admin-action", {
      body: { appointment_id: appointmentId, action },
    });
    if (error) {
      toast.error("Booking action failed");
    } else {
      toast.success(action === "confirm" ? "Email sent automatically" : "Booking updated");
      await loadData();
    }
    setActionId(null);
  };

  const copyPageLink = async (slug?: string) => {
    const link = buildBookingUrl(slug);
    await navigator.clipboard.writeText(link);
    toast.success("Booking link copied");
  };

  return (
    <main className="jbj-bookings" data-jbj-bookings>
      <section className="jbj-bookings__topbar">
        <div>
          <p className="jbj-bookings__eyebrow">JBJ Bookings</p>
          <h1>Booking Calendar</h1>
          <p className="jbj-bookings__subtitle">One canonical system for public booking pages, private appointments, event types, forms, schedules, workflows, and sharing.</p>
        </div>
        <div className="jbj-bookings__actions">
          <Button type="button" variant="outline" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button type="button" onClick={() => setView("event-types")}>
            <Plus className="h-4 w-4" /> New Event Type
          </Button>
        </div>
      </section>

      <section className="jbj-bookings__metrics" aria-label="Booking metrics">
        <Metric label="Upcoming" value={counts.upcoming} />
        <Metric label="Needs action" value={counts.pending} />
        <Metric label="Confirmed" value={counts.confirmed} />
        <Metric label="Active pages" value={counts.pages} />
      </section>

      <section className="jbj-bookings__shell">
        <aside className="jbj-bookings__side" aria-label="JBJ booking sections">
          {bookingViews.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.key} type="button" className="jbj-bookings__nav" data-active={view === item.key} onClick={() => setView(item.key)}>
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            );
          })}
        </aside>

        <div className="jbj-bookings__content">
          {view === "appointments" && (
            <AppointmentsView
              appointments={filteredAppointments}
              statusFilter={statusFilter}
              workspaceFilter={workspaceFilter}
              query={query}
              loading={loading}
              actionId={actionId}
              onStatusFilter={setStatusFilter}
              onWorkspaceFilter={setWorkspaceFilter}
              onQuery={setQuery}
              onAction={runAppointmentAction}
            />
          )}

          {view === "event-types" && (
            <EventTypesView
              events={events}
              activeEvent={activeEvent}
              activePage={activePage}
              detailTab={detailTab}
              availability={availability}
              formFields={formFields}
              promoActions={promoActions}
              onSelectEvent={setActiveEventId}
              onDetailTab={setDetailTab}
              onCopy={copyPageLink}
            />
          )}

          {view === "schedules" && <SchedulesView workspaces={workspaces} events={events} />}
          {view === "workflows" && <WorkflowsView events={events} />}
          {view === "staff" && <StaffView workspaces={workspaces} />}
          {view === "booking-pages" && <BookingPagesView pages={pages} events={events} onCopy={copyPageLink} />}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="jbj-bookings__metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AppointmentsView({
  appointments,
  statusFilter,
  workspaceFilter,
  query,
  loading,
  actionId,
  onStatusFilter,
  onWorkspaceFilter,
  onQuery,
  onAction,
}: {
  appointments: Appointment[];
  statusFilter: "all" | AppointmentStatus;
  workspaceFilter: "all" | Workspace["kind"];
  query: string;
  loading: boolean;
  actionId: string | null;
  onStatusFilter: (value: "all" | AppointmentStatus) => void;
  onWorkspaceFilter: (value: "all" | Workspace["kind"]) => void;
  onQuery: (value: string) => void;
  onAction: (id: string, action: "confirm" | "reject" | "cancel") => Promise<void>;
}) {
  const statuses: Array<"all" | AppointmentStatus> = ["all", "pending", "awaiting_email_verification", "awaiting_approval", "accepted", "confirmed", "rescheduled", "cancelled", "declined"];
  return (
    <div className="jbj-bookings__panel">
      <div className="jbj-bookings__panel-head">
        <div>
          <h2>Appointments</h2>
          <p>Operational queue for all personal and JBJ Business bookings.</p>
        </div>
        <div className="jbj-bookings__search">
          <Search className="h-4 w-4" />
          <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search appointments" />
        </div>
      </div>
      <div className="jbj-bookings__filters">
        {statuses.map((status) => (
          <button key={status} type="button" data-active={statusFilter === status} onClick={() => onStatusFilter(status)}>
            {status.replace("_", " ")}
          </button>
        ))}
        <button type="button" data-active={workspaceFilter === "all"} onClick={() => onWorkspaceFilter("all")}>All workspaces</button>
        <button type="button" data-active={workspaceFilter === "personal"} onClick={() => onWorkspaceFilter("personal")}>Personal</button>
        <button type="button" data-active={workspaceFilter === "business"} onClick={() => onWorkspaceFilter("business")}>JBJ Business</button>
      </div>
      <div className="jbj-bookings__table" role="table" aria-label="Appointments">
        <div className="jbj-bookings__row is-head" role="row">
          <span>Customer</span><span>Event</span><span>Date & time</span><span>Status</span><span>Actions</span>
        </div>
        {loading ? (
          <div className="jbj-bookings__empty">Loading bookings…</div>
        ) : appointments.length === 0 ? (
          <div className="jbj-bookings__empty">No bookings in this bucket.</div>
        ) : appointments.map((appointment) => (
          <div key={appointment.id} className="jbj-bookings__row" role="row">
            <span>
              <strong>{appointment.customer_name}</strong>
              <small>{appointment.customer_email}</small>
            </span>
            <span>
              <strong>{appointment.event_type?.name ?? "Booking"}</strong>
              <small>{appointment.workspace?.display_name ?? "JBJ Bookings"}</small>
            </span>
            <span>
              <strong>{formatDateTime(appointment.starts_at)}</strong>
              <small>{minutesToLabel(Math.round((new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime()) / 60000))}</small>
            </span>
            <span><Badge status={appointment.status} /></span>
            <span className="jbj-bookings__row-actions">
              <Button type="button" size="sm" variant="outline" disabled={actionId === appointment.id} onClick={() => void onAction(appointment.id, "confirm")}><Check className="h-4 w-4" />Confirm</Button>
              <Button type="button" size="sm" variant="ghost" disabled={actionId === appointment.id} onClick={() => void onAction(appointment.id, "cancel")}><X className="h-4 w-4" />Cancel</Button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ status }: { status: AppointmentStatus }) {
  return <span className={`jbj-bookings__badge ${STATUS_STYLES[status]}`}>{status.replace("_", " ")}</span>;
}

function EventTypesView({
  events,
  activeEvent,
  activePage,
  detailTab,
  availability,
  formFields,
  promoActions,
  onSelectEvent,
  onDetailTab,
  onCopy,
}: {
  events: EventWithRelations[];
  activeEvent?: EventWithRelations;
  activePage?: BookingPage;
  detailTab: DetailKey;
  availability: Record<string, unknown>;
  formFields: Array<{ key?: string; label?: string; type?: string; required?: boolean }>;
  promoActions: Array<{ label?: string; url?: string }>;
  onSelectEvent: (id: string) => void;
  onDetailTab: (key: DetailKey) => void;
  onCopy: (slug?: string) => Promise<void>;
}) {
  return (
    <div className="jbj-bookings__split">
      <div className="jbj-bookings__list-panel">
        <div className="jbj-bookings__panel-head is-compact">
          <div>
            <h2>Active Event Types</h2>
            <p>Zoho-style event catalogue.</p>
          </div>
          <Button type="button" size="sm"><Plus className="h-4 w-4" />Add</Button>
        </div>
        {events.map((event) => (
          <button key={event.id} type="button" className="jbj-bookings__event-card" data-active={activeEvent?.id === event.id} onClick={() => onSelectEvent(event.id)}>
            <span>
              <strong>{event.name}</strong>
              <small>{event.workspace?.display_name ?? "JBJ Bookings"}</small>
            </span>
            <span className="jbj-bookings__event-meta">{event.duration_minutes} min</span>
          </button>
        ))}
      </div>
      <div className="jbj-bookings__detail">
        {activeEvent ? (
          <>
            <div className="jbj-bookings__detail-head">
              <div>
                <p className="jbj-bookings__eyebrow">Event Type Details</p>
                <h2>{activeEvent.name}</h2>
                <p>{activeEvent.description ?? "Private scheduling page"}</p>
              </div>
              <div className="jbj-bookings__actions">
                <Button type="button" variant="outline" onClick={() => void onCopy(activePage?.slug)}><Copy className="h-4 w-4" />Copy Link</Button>
                <Button type="button" asChild><a href={buildBookingUrl(activePage?.slug)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Open</a></Button>
              </div>
            </div>
            <div className="jbj-bookings__detail-grid">
              <aside className="jbj-bookings__detail-tabs">
                {detailTabs.map((tab) => {
                  const Icon = tab.icon;
                  return <button key={tab.key} type="button" data-active={detailTab === tab.key} onClick={() => onDetailTab(tab.key)}><Icon className="h-4 w-4" />{tab.label}</button>;
                })}
              </aside>
              <div className="jbj-bookings__detail-body">
                {detailTab === "details" && <DetailsTab event={activeEvent} page={activePage} />}
                {detailTab === "staff" && <StaffAssignmentTab event={activeEvent} />}
                {detailTab === "availability" && <AvailabilityTab availability={availability} />}
                {detailTab === "limits" && <LimitsTab />}
                {detailTab === "rules" && <RulesTab event={activeEvent} />}
                {detailTab === "notifications" && <NotificationsTab event={activeEvent} />}
                {detailTab === "form" && <FormTab fields={formFields} />}
                {detailTab === "share" && <ShareTab page={activePage} promoActions={promoActions} onCopy={onCopy} />}
              </div>
            </div>
          </>
        ) : <div className="jbj-bookings__empty">No event types configured.</div>}
      </div>
    </div>
  );
}

function DetailsTab({ event, page }: { event: EventWithRelations; page?: BookingPage }) {
  return (
    <div className="jbj-bookings__settings-grid">
      <Setting label="Event Name" value={event.name} />
      <Setting label="Duration" value={`${event.duration_minutes} minutes`} />
      <Setting label="Price" value="Free" />
      <Setting label="Visibility" value={event.is_active ? "Active" : "Inactive"} />
      <Setting label="Page Mode" value={page?.access_mode === "with_promotion" ? "Booking Plus Website Promotion" : "Booking Only"} />
      <Setting label="Email Verification" value={page?.require_email_verification ? "Required" : "Optional"} />
    </div>
  );
}

function StaffAssignmentTab({ event }: { event: EventWithRelations }) {
  return (
    <div className="jbj-bookings__staff-card">
      <div className="jbj-bookings__avatar"><UserRound className="h-5 w-5" /></div>
      <div><strong>{event.workspace?.host_name ?? "Jane Bou Jaoude"}</strong><small>{event.workspace?.kind === "personal" ? "Personal host" : "JBJ Business host"}</small></div>
      <span>Assigned</span>
    </div>
  );
}

function AvailabilityTab({ availability }: { availability: Record<string, unknown> }) {
  const entries = Object.entries(availability);
  return (
    <div className="jbj-bookings__availability">
      <div className="jbj-bookings__section-title"><CalendarCheck className="h-4 w-4" />User Working Hours</div>
      {entries.length === 0 ? <div className="jbj-bookings__empty">No availability configured.</div> : entries.map(([day, slots]) => (
        <div key={day} className="jbj-bookings__availability-row">
          <strong>{weekdayNames[day] ?? day}</strong>
          <span>{Array.isArray(slots) ? slots.map((slot) => {
            const item = asRecord(slot as Json);
            return `${item.start ?? "09:00"} - ${item.end ?? "17:00"}`;
          }).join(", ") : "Closed"}</span>
        </div>
      ))}
    </div>
  );
}

function LimitsTab() {
  return (
    <div className="jbj-bookings__settings-grid">
      <Setting label="Slots per Event Type" value="1 per interval" />
      <Setting label="Slots per Customer" value="5 bookings / 24h" />
      <Setting label="IP Protection" value="10 bookings / hour" />
      <Setting label="Overlap Guard" value="Enabled" />
    </div>
  );
}

function RulesTab({ event }: { event: EventWithRelations }) {
  return (
    <div className="jbj-bookings__settings-grid">
      <Setting label="Buffer Before" value="0 minutes" />
      <Setting label="Buffer After" value="0 minutes" />
      <Setting label="Minimum Notice" value={`${event.min_notice_hours} hours`} />
      <Setting label="Slot Interval" value={`${event.interval_minutes} minutes`} />
      <Setting label="Maximum Advance" value={`${event.max_advance_days} days`} />
    </div>
  );
}

function NotificationsTab({ event }: { event: EventWithRelations }) {
  return (
    <div className="jbj-bookings__notification-list">
      <Setting label="Customer Email" value={`From ${event.workspace?.sender_email ?? "contact@jbj.ae"}`} />
      <Setting label="Host Alert" value={event.workspace?.notification_email ?? "contact@jbj.ae"} />
      <Setting label="Confirmation" value="Email sent automatically after approval" />
      <Setting label="Reminder" value="Prepared for booking reminders" />
    </div>
  );
}

function FormTab({ fields }: { fields: Array<{ key?: string; label?: string; type?: string; required?: boolean }> }) {
  return (
    <div className="jbj-bookings__form-list">
      {fields.map((field, index) => (
        <div key={field.key ?? index} className="jbj-bookings__form-field">
          <span>{index + 1}</span>
          <div><strong>{field.label ?? field.key ?? "Field"}</strong><small>{field.type ?? "text"}{field.required ? " · required" : " · optional"}</small></div>
          <Eye className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}

function ShareTab({ page, promoActions, onCopy }: { page?: BookingPage; promoActions: Array<{ label?: string; url?: string }>; onCopy: (slug?: string) => Promise<void> }) {
  const url = buildBookingUrl(page?.slug);
  return (
    <div className="jbj-bookings__share">
      <div className="jbj-bookings__share-link"><Link2 className="h-4 w-4" /><span>{url}</span><Button type="button" size="sm" onClick={() => void onCopy(page?.slug)}><Copy className="h-4 w-4" />Copy</Button></div>
      <div className="jbj-bookings__qr"><QrCode className="h-20 w-20" /><span>QR ready for this booking page</span></div>
      {promoActions.length > 0 && <div className="jbj-bookings__promo-actions">{promoActions.map((action, index) => <a key={`${action.label}-${index}`} href={action.url} target="_blank" rel="noreferrer">{action.label}<ExternalLink className="h-3 w-3" /></a>)}</div>}
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return <div className="jbj-bookings__setting"><span>{label}</span><strong>{value}</strong></div>;
}

function SchedulesView({ workspaces, events }: { workspaces: Workspace[]; events: EventWithRelations[] }) {
  return <SimplePanel title="Schedules" subtitle="Workspace calendars and weekly working-hour profiles.">{workspaces.map((workspace) => <Setting key={workspace.id} label={WORKSPACE_LABELS[workspace.kind]} value={`${workspace.timezone} · ${events.filter((event) => event.workspace_id === workspace.id).length} event type(s)`} />)}</SimplePanel>;
}

function WorkflowsView({ events }: { events: EventWithRelations[] }) {
  return <SimplePanel title="Workflows" subtitle="Approval, verification, notification, and calendar-sync workflow map.">{events.map((event) => <Setting key={event.id} label={event.name} value="Request → verify email → owner review → email confirmation → calendar sync" />)}</SimplePanel>;
}

function StaffView({ workspaces }: { workspaces: Workspace[] }) {
  return <SimplePanel title="Sales & Trainers" subtitle="Hosts are isolated by booking workspace identity.">{workspaces.map((workspace) => <Setting key={workspace.id} label={workspace.host_name} value={`${WORKSPACE_LABELS[workspace.kind]} · ${workspace.sender_email}`} />)}</SimplePanel>;
}

function BookingPagesView({ pages, events, onCopy }: { pages: BookingPage[]; events: EventWithRelations[]; onCopy: (slug?: string) => Promise<void> }) {
  return (
    <div className="jbj-bookings__panel">
      <div className="jbj-bookings__panel-head"><div><h2>Booking Pages</h2><p>Canonical public landing pages generated by JBJ Bookings.</p></div></div>
      <div className="jbj-bookings__page-grid">
        {pages.map((page) => {
          const event = events.find((item) => item.id === page.event_type_id);
          return <div key={page.id} className="jbj-bookings__page-card"><Globe2 className="h-5 w-5" /><div><strong>{page.page_title ?? event?.name ?? page.slug}</strong><small>{buildBookingUrl(page.slug)}</small></div><Button type="button" size="sm" variant="outline" onClick={() => void onCopy(page.slug)}><Copy className="h-4 w-4" />Copy</Button></div>;
        })}
      </div>
    </div>
  );
}

function SimplePanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="jbj-bookings__panel"><div className="jbj-bookings__panel-head"><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="jbj-bookings__settings-grid">{children}</div></div>;
}