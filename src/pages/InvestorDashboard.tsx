import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InvestorDocumentVault from "@/components/investor/InvestorDocumentVault";
import { useMyEventInvitations } from "@/hooks/useEventManagement";
import { getUserInitials } from "@/lib/userInitials";
import { toast } from "sonner";
import {
  LayoutDashboard, Building2, FileText, TrendingUp, Bell, User, Heart, Search, ListChecks,
  Calendar, Shield, MessageCircle, BarChart3, Briefcase, Clock, MapPin, Eye, CheckCircle2,
  Mail, Phone, Globe, Languages, Stamp, ImageIcon, CreditCard, Star, History, StickyNote,
  FileEdit, Bot, Plus, Send, Link2, ClipboardList
} from "lucide-react";
import { format } from "date-fns";

const TAB_STYLE = "text-[10px] md:text-xs font-semibold data-[state=active]:bg-[image:var(--jj-emerald-ombre)] data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-transparent rounded-lg";

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

type InvestorListingSummary = {
  id: string;
  title: string;
  status: string;
  approvalStatus: string;
  createdAt: string;
  price?: number | null;
  location?: string | null;
  source: "portal" | "seller";
};

type InvestorCalendarEvent = {
  id: string;
  dbEventId?: string;
  title: string;
  date: string;
  time: string;
  type: string;
  location: string;
  notes: string;
  emailReminder: boolean;
};

type InvestorTask = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};

const formatLocalDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const buildCalendarDays = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days: Array<Date | null> = [];
  for (let i = 0; i < first.getDay(); i += 1) days.push(null);
  for (let d = 1; d <= last.getDate(); d += 1) days.push(new Date(month.getFullYear(), month.getMonth(), d));
  return days;
};

const dubaiDateTimeToIso = (date: string, time: string) => new Date(`${date}T${time || "00:00"}:00+04:00`).toISOString();

const getDubaiParts = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const pick = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return {
    date: `${pick("year")}-${pick("month")}-${pick("day")}`,
    time: `${pick("hour")}:${pick("minute")}`,
  };
};

const mapDbCalendarEvent = (event: any): InvestorCalendarEvent => {
  const parts = getDubaiParts(event.start_at);
  const metadata = event.metadata || {};
  return {
    id: event.id,
    dbEventId: event.id,
    title: event.title || "Investor booking",
    date: parts.date,
    time: parts.time,
    type: metadata.type || metadata.portal_type || "Property viewing",
    location: event.location || "",
    notes: event.description || metadata.notes || "",
    emailReminder: metadata.email_reminder !== false,
  };
};

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isOwner, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [stats, setStats] = useState({ watchlist: 0, savedSearches: 0, reports: 0, requests: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [submittedListings, setSubmittedListings] = useState<InvestorListingSummary[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState<InvestorCalendarEvent[]>([]);
  const [tasks, setTasks] = useState<InvestorTask[]>([]);
  const [taskDraft, setTaskDraft] = useState("");
  const [assistantPrompt, setAssistantPrompt] = useState("");
  const [eventForm, setEventForm] = useState({
    title: "",
    date: formatLocalDate(new Date()),
    time: "12:00",
    type: "Property viewing",
    location: "",
    notes: "",
    emailReminder: true,
  });
  const { invitations, respondToInvitation } = useMyEventInvitations();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "", nationality: "", phone_number: "", email: "",
    languages: "", gender: "", experience_years: "", bio: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/investor-dashboard");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    try {
      const events = localStorage.getItem(`jj_investor_calendar_${user.id}`);
      const savedTasks = localStorage.getItem(`jj_investor_tasks_${user.id}`);
      if (events) setCalendarEvents(JSON.parse(events));
      if (savedTasks) setTasks(JSON.parse(savedTasks));
    } catch (error) {
      console.error("Failed to load investor calendar data", error);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) {
        setProfile(p);
        setProfileForm({
          full_name: p.full_name || "", nationality: (p as any).nationality || "",
          phone_number: p.phone_number || "", email: user.email || "",
          languages: "", gender: "", experience_years: "", bio: "",
        });
      }

      const { data: favs } = await supabase.from("favorites").select("id, project_id, created_at").eq("user_id", user.id).limit(50);
      if (favs) {
        // Enrich with project name + slug so the card is meaningful and links to the real detail page
        const ids = Array.from(new Set(favs.map((f: any) => f.project_id).filter(Boolean)));
        let projectMap: Record<string, { name: string; slug: string; cover_image_url: string | null }> = {};
        if (ids.length) {
          const { data: projects } = await supabase
            .from("projects")
            .select("id, name, slug, cover_image_url, is_published")
            .in("id", ids);
          if (projects) {
            projectMap = projects.reduce((acc: any, p: any) => {
              acc[p.id] = { name: p.name, slug: p.slug, cover_image_url: p.cover_image_url, is_published: p.is_published };
              return acc;
            }, {});
          }
        }
        // Drop favorites whose project no longer exists / is unpublished so we never link to "Project not found"
        const enriched = favs
          .map((f: any) => ({ ...f, project: projectMap[f.project_id] }))
          .filter((f: any) => f.project && f.project.slug && f.project.is_published !== false);
        setFavorites(enriched);
        setStats(prev => ({ ...prev, watchlist: enriched.length }));
      }

      const { data: tickets } = await supabase
        .from("chat_conversations").select("id, status, created_at, service_type")
        .eq("user_email", user.email).order("created_at", { ascending: false }).limit(10);
      if (tickets) {
        setActivities(tickets.map((t: any) => ({
          id: t.id, message: `${t.service_type || "General"} — ${t.status}`, created_at: t.created_at,
        })));
        setStats(prev => ({ ...prev, requests: tickets.filter((t: any) => t.status !== "closed").length }));
      }

      const [portalResult, sellerResult] = await Promise.all([
        (supabase as any)
          .from("portal_listings")
          .select("id,title,status,approval_status,created_at,approved_at,listing_type,price,location")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(25),
        (supabase as any)
          .from("seller_listings")
          .select("id,property_location,property_type,status,approval_status,submitted_at,created_at,target_selling_price")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(25),
      ]);

      const { data: dbEvents } = await (supabase as any)
        .from("owner_calendar_events")
        .select("id,title,description,location,start_at,end_at,metadata,created_at")
        .eq("owner_id", user.id)
        .eq("metadata->>portal", "investor")
        .order("start_at", { ascending: true })
        .limit(100);

      if (dbEvents) {
        setCalendarEvents(dbEvents.map(mapDbCalendarEvent));
      }

      const portalListings: InvestorListingSummary[] = (portalResult.data || []).map((listing: any) => ({
        id: listing.id,
        title: listing.title || listing.listing_type || "Submitted listing",
        status: listing.status || "submitted",
        approvalStatus: listing.approval_status || listing.status || "submitted",
        createdAt: listing.created_at,
        price: listing.price,
        location: listing.location,
        source: "portal" as const,
      }));

      const sellerListings: InvestorListingSummary[] = (sellerResult.data || []).map((listing: any) => ({
        id: listing.id,
        title: `${listing.property_type || "Property"} · ${listing.property_location || "Submitted listing"}`,
        status: listing.status || "submitted",
        approvalStatus: listing.approval_status || listing.status || "submitted",
        createdAt: listing.submitted_at || listing.created_at,
        price: listing.target_selling_price,
        location: listing.property_location,
        source: "seller" as const,
      }));

      setSubmittedListings([...portalListings, ...sellerListings]);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const persistCalendar = (next: InvestorCalendarEvent[]) => {
    setCalendarEvents(next);
    if (user) localStorage.setItem(`jj_investor_calendar_${user.id}`, JSON.stringify(next));
  };

  const persistTasks = (next: InvestorTask[]) => {
    setTasks(next);
    if (user) localStorage.setItem(`jj_investor_tasks_${user.id}`, JSON.stringify(next));
  };

  const sendBookingConfirmation = async (event: InvestorCalendarEvent) => {
    if (!user?.email || !event.emailReminder) return;
    try {
      await supabase.functions.invoke("email-send-gateway", {
        body: {
          from: "JBJ GLOBAL REAL ESTATE <bookings@jbj.ae>",
          to: [user.email],
          subject: `Reminder scheduled · ${event.title}`,
          html: `
            <div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
              <h2 style="color:#064E3B">Your JBJ calendar reminder is scheduled</h2>
              <p><strong>${event.title}</strong></p>
              <p>Date: ${event.date}<br/>Time: ${event.time} Dubai time</p>
              ${event.location ? `<p>Location: ${event.location}</p>` : ""}
              ${event.notes ? `<p>Notes: ${event.notes}</p>` : ""}
              <p>JBJ AI Assistant will keep this in your portal task inbox and remind you before the event.</p>
            </div>
          `,
          text: `Your JBJ calendar reminder is scheduled: ${event.title} on ${event.date} at ${event.time} Dubai time. ${event.notes || ""}`,
        },
      });
    } catch (error) {
      console.warn("Booking confirmation email could not be sent", error);
    }
  };

  const handleAddEvent = async (override?: Partial<InvestorCalendarEvent>) => {
    const title = override?.title || eventForm.title.trim();
    if (!title) {
      toast.error("Add an event title first");
      return;
    }
    const resolvedDate = override?.date || eventForm.date;
    const resolvedTime = override?.time || eventForm.time;
    const nextEvent: InvestorCalendarEvent = {
      id: `${Date.now()}`,
      title,
      date: resolvedDate,
      time: resolvedTime,
      type: override?.type || eventForm.type,
      location: override?.location ?? eventForm.location,
      notes: override?.notes ?? eventForm.notes,
      emailReminder: override?.emailReminder ?? eventForm.emailReminder,
    };

    let savedEvent = nextEvent;
    if (user) {
      const startAt = dubaiDateTimeToIso(resolvedDate, resolvedTime);
      const endAt = new Date(new Date(startAt).getTime() + 60 * 60 * 1000).toISOString();
      const { data, error } = await (supabase as any)
        .from("owner_calendar_events")
        .insert({
          owner_id: user.id,
          title,
          description: nextEvent.notes,
          location: nextEvent.location,
          start_at: startAt,
          end_at: endAt,
          metadata: {
            portal: "investor",
            portal_type: "investor_calendar",
            type: nextEvent.type,
            notes: nextEvent.notes,
            email_reminder: nextEvent.emailReminder,
            attendee_email: user.email,
            attendee_name: profile?.full_name || user.email?.split("@")[0] || "Investor",
            owner_email: user.email,
            reminders: [1440, 30],
            sent_reminders: [],
          },
        })
        .select("id,title,description,location,start_at,end_at,metadata")
        .maybeSingle();
      if (error) {
        console.warn("Investor calendar database save failed; keeping local event", error);
        toast.warning("Saved locally. Email reminder will activate after portal sync.");
      } else if (data) {
        savedEvent = mapDbCalendarEvent(data);
      }
    }

    persistCalendar([...calendarEvents, savedEvent]);
    setEventForm((prev) => ({ ...prev, title: "", location: "", notes: "" }));
    void sendBookingConfirmation(savedEvent);
    toast.success(savedEvent.emailReminder ? "Event booked with email reminder" : "Event booked");
  };

  const handleAddTask = (title = taskDraft.trim(), due = formatLocalDate(new Date())) => {
    if (!title) {
      toast.error("Add a task note first");
      return;
    }
    persistTasks([{ id: `${Date.now()}`, title, due, done: false }, ...tasks]);
    setTaskDraft("");
    toast.success("Task note added");
  };

  const handleAssistantCommand = () => {
    const prompt = assistantPrompt.trim();
    if (!prompt) {
      toast.error("Tell the assistant what to schedule");
      return;
    }
    const tomorrow = /tomorrow/i.test(prompt);
    const date = tomorrow ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date();
    const timeMatch = prompt.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    let hour = timeMatch ? Number(timeMatch[1]) : 12;
    const minute = timeMatch?.[2] || "00";
    const meridiem = timeMatch?.[3]?.toLowerCase();
    if (meridiem === "pm" && hour < 12) hour += 12;
    if (meridiem === "am" && hour === 12) hour = 0;
    const time = `${String(hour).padStart(2, "0")}:${minute}`;
    const isViewing = /viewing|property/i.test(prompt);
    const guestMatch = prompt.match(/(?:meet|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const guestName = guestMatch?.[1];
    void handleAddEvent({
      title: isViewing ? `Property viewing${guestName ? ` with ${guestName}` : ""}` : `Investor appointment${guestName ? ` with ${guestName}` : ""}`,
      date: formatLocalDate(date),
      time,
      type: isViewing ? "Property viewing" : "Meeting",
      notes: prompt,
      emailReminder: true,
    });
    handleAddTask(`Reminder: ${prompt}`, formatLocalDate(date));
    setAssistantPrompt("");
  };

  const handleShareInventory = async () => {
    if (submittedListings.length === 0) {
      toast.info("Add and submit a listing before sharing inventory");
      return;
    }
    const approved = submittedListings.filter((listing) => /approved|live|published/i.test(`${listing.approvalStatus} ${listing.status}`));
    const shareRows = (approved.length ? approved : submittedListings).map((listing) => {
      const link = listing.source === "portal"
        ? `${window.location.origin}/resale-properties?listing=${listing.id}`
        : `${window.location.origin}/listing-portal/my-listings?listing=${listing.id}`;
      return `${listing.title} — ${listing.approvalStatus || listing.status} — ${link}`;
    });
    const bodyText = shareRows.join("\n");
    await navigator.clipboard?.writeText(bodyText);
    try {
      await supabase.functions.invoke("email-send-gateway", {
        body: {
          from: "JBJ GLOBAL REAL ESTATE <bookings@jbj.ae>",
          to: ["contact@jbj.ae"],
          subject: `Investor inventory share · ${displayName}`,
          html: `
            <div style="font-family:Inter,Arial,sans-serif;color:#1A1A1A;line-height:1.6">
              <h2 style="color:#064E3B">Investor inventory shared from portal</h2>
              <p><strong>Investor:</strong> ${displayName}<br/><strong>Email:</strong> ${user?.email || "—"}</p>
              <pre style="white-space:pre-wrap;background:#F7F2EA;border:1px solid #B89555;padding:14px;border-radius:12px">${bodyText}</pre>
            </div>
          `,
          text: `Investor: ${displayName}\nEmail: ${user?.email || "—"}\n\n${bodyText}`,
        },
      });
      toast.success("Inventory links sent to JBJ and copied");
    } catch (error) {
      console.warn("Inventory email failed", error);
      toast.success("Inventory links copied for your JBJ consultant");
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profileForm.full_name,
      nationality: profileForm.nationality,
      phone_number: profileForm.phone_number,
    } as any).eq("id", user.id);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile updated");
    setSavingProfile(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[hsl(36,40%,70%)] border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Investor";
  const userInitials = getUserInitials({ displayName: profile?.full_name || displayName, email: user?.email, isOwner });
  const nextBooking = [...calendarEvents]
    .filter((event) => new Date(`${event.date}T${event.time}:00+04:00`).getTime() >= Date.now() - 60 * 60 * 1000)
    .sort((a, b) => new Date(`${a.date}T${a.time}:00+04:00`).getTime() - new Date(`${b.date}T${b.time}:00+04:00`).getTime())[0];
  const openTaskCount = tasks.filter((task) => !task.done).length;
  const hasInventory = submittedListings.length > 0;

  // Reusable champagne→emerald hover tile (matches search dropdown style)
  const quickTileBase =
    "group rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] p-3 text-left transition-all duration-200 " +
    "hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_rgba(6,78,59,0.55)] " +
    "hover:bg-[image:var(--jj-emerald-ombre)] hover:border-transparent";
  const quickTileIcon =
    "w-4 h-4 mb-2 text-[#064E3B] group-hover:text-white transition-colors";
  const quickTileTitle =
    "text-[10px] font-bold uppercase tracking-[0.06em] text-[#1A1A1A] group-hover:text-white truncate";
  const quickTileSub =
    "text-[10px] text-muted-foreground group-hover:text-white/85 truncate";

  return (
    <div data-backend-portal="investor" className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,28%,94%)] to-[hsl(36,22%,88%)]">
      <div className="max-w-6xl mx-auto px-4 pt-10 md:pt-12 pb-8">
        <Card className="mb-5 overflow-hidden border-[hsl(36,40%,70%)]/35 bg-gradient-to-br from-[#FFFCF6] via-[#F7F2EA] to-[#EFE6D6] shadow-[0_18px_45px_-32px_rgba(26,26,26,0.65)]">
          <CardContent className="p-4 md:p-5">
            <div className="grid lg:grid-cols-[1.25fr_1fr] gap-4 items-center">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-12 h-12 border-2 border-[#B89555]/45 shadow-sm" data-surface="emerald" data-no-contrast-guard>
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback
                    data-surface="emerald"
                    data-no-contrast-guard
                    data-emerald-ok
                    className="allow-white bg-[image:var(--jj-emerald-ombre)] !text-white font-bold"
                    style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] font-bold text-[#064E3B]">Investor portal command center</p>
                  <h1 className="text-xl md:text-2xl font-bold text-[#1A1A1A] truncate">Welcome, {displayName}</h1>
                  <p className="text-xs text-muted-foreground">Manage inventory, approvals, documents, bookings, reminders, and JBJ consultant sharing in one place.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 min-w-0">
                <button onClick={() => setActiveTab("calendar")} className={quickTileBase}>
                  <Calendar className={quickTileIcon} />
                  <p className={quickTileTitle}>Calendar</p>
                  <p className={quickTileSub}>{nextBooking ? `${nextBooking.time} · ${nextBooking.title}` : "No bookings"}</p>
                </button>
                <button onClick={() => setActiveTab("tasks")} className={quickTileBase}>
                  <ClipboardList className={quickTileIcon} />
                  <p className={quickTileTitle}>Tasks</p>
                  <p className={quickTileSub}>{openTaskCount} open</p>
                </button>
                <button onClick={() => setActiveTab("assistant")} className={quickTileBase}>
                  <Bot className={quickTileIcon} />
                  <p className={quickTileTitle}>Assistant</p>
                  <p className={quickTileSub}>Book + remind</p>
                </button>
                <button onClick={hasInventory ? handleShareInventory : () => setActiveTab("properties")} className={quickTileBase}>
                  <Link2 className={quickTileIcon} />
                  <p className={quickTileTitle}>Share</p>
                  <p className={quickTileSub}>{hasInventory ? `${submittedListings.length} listings` : "Register first"}</p>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs — horizontally scrollable strap so they never crash into the header */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-6 -mx-1 overflow-x-auto jj-scrollbar-gold">
          <TabsList className="flex flex-nowrap gap-1.5 bg-transparent p-1 h-auto w-max min-w-full">

            <TabsTrigger value="dashboard" className={TAB_STYLE}>
              <LayoutDashboard className="w-3.5 h-3.5 mr-1 hidden md:block" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="properties" className={TAB_STYLE}>
              <Building2 className="w-3.5 h-3.5 mr-1 hidden md:block" /> My Properties
            </TabsTrigger>
            <TabsTrigger value="documents" className={TAB_STYLE}>
              <FileText className="w-3.5 h-3.5 mr-1 hidden md:block" /> Documents
            </TabsTrigger>
            <TabsTrigger value="profile" className={TAB_STYLE}>
              <User className="w-3.5 h-3.5 mr-1 hidden md:block" /> Update Profile
            </TabsTrigger>
            <TabsTrigger value="inbox" className={TAB_STYLE}>
              <Mail className="w-3.5 h-3.5 mr-1 hidden md:block" /> Inbox
            </TabsTrigger>
            <TabsTrigger value="alerts" className={TAB_STYLE}>
              <Bell className="w-3.5 h-3.5 mr-1 hidden md:block" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="calendar" className={TAB_STYLE}>
              <Calendar className="w-3.5 h-3.5 mr-1 hidden md:block" /> Calendar
            </TabsTrigger>
            <TabsTrigger value="tasks" className={TAB_STYLE}>
              <ClipboardList className="w-3.5 h-3.5 mr-1 hidden md:block" /> Tasks
            </TabsTrigger>
            <TabsTrigger value="assistant" className={TAB_STYLE}>
              <Bot className="w-3.5 h-3.5 mr-1 hidden md:block" /> AI Assistant
            </TabsTrigger>
          </TabsList>
          </div>



          {/* ── DASHBOARD ── */}
          <TabsContent value="dashboard">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Watchlist", value: stats.watchlist, icon: Heart },
                  { label: "Saved Searches", value: stats.savedSearches, icon: Search },
                  { label: "Reports", value: stats.reports, icon: FileText },
                  { label: "Active Requests", value: stats.requests, icon: ListChecks },
                ].map((kpi) => (
                  <Card key={kpi.label} className="border-[hsl(36,40%,70%)]/20 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,28%,93%)]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div data-backend-icon-tile="emerald" className="allow-white w-10 h-10 rounded-xl flex items-center justify-center">
                          <kpi.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                          <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Get Curated Shortlist", href: "/contact?type=shortlist", icon: ListChecks },
                    { label: "Compare Projects", href: "/compare", icon: BarChart3 },
                    { label: "Request ROI Snapshot", href: "/contact?type=roi", icon: TrendingUp },
                    { label: "Speak to Advisor", href: "/contact?type=advisor", icon: MessageCircle },
                  ].map((a) => (
                    <Link key={a.label} to={a.href}>
                      <Card className="border-[hsl(36,40%,70%)]/20 hover:border-[hsl(36,40%,70%)]/50 transition-all cursor-pointer group h-full">
                        <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                          <div data-backend-icon-tile="emerald" className="allow-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors">
                            <a.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs font-semibold text-foreground">{a.label}</span>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
                <Card className="border-[hsl(36,40%,70%)]/20 bg-[#F7F2EA] overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <Bot className="w-4 h-4 text-[hsl(36,40%,70%)] shrink-0" />
                      <span className="min-w-0 break-words">AI Full Schedule &amp; Task Assistant</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      value={assistantPrompt}
                      onChange={(e) => setAssistantPrompt(e.target.value)}
                      placeholder="Add for me notes that I need to meet Jane tomorrow at 12 PM for a property viewing."
                      className="min-h-[92px] border-[hsl(36,40%,70%)]/30 bg-[#FDFBF7]"
                    />
                    <Button onClick={handleAssistantCommand} data-emerald-action="true" className="jj-cta-emerald w-full">
                      <Send className="w-4 h-4 mr-2" /> Book, note, and remind me
                    </Button>
                  </CardContent>
                </Card>
                <Card className="border-[hsl(36,40%,70%)]/20 bg-[#F7F2EA] overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                      <Link2 className="w-4 h-4 text-[hsl(36,40%,70%)] shrink-0" />
                      <span className="min-w-0 break-words">Share inventory with JBJ</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hasInventory ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Approved listings generate share links automatically. Send your inventory list to your JBJ consultant when ready.
                        </p>
                        <Button onClick={handleShareInventory} variant="outline" className="w-full border-[hsl(36,40%,70%)]/40 text-[#064E3B]">
                          Share inventory with JBJ consultant
                        </Button>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#B89555]/45 bg-[#FDFBF7] p-4 space-y-3">
                        <p className="text-sm font-semibold text-[#1A1A1A]">You haven't connected any inventory yet</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Register your inventory first. As an investor, tell us:
                        </p>
                        <ul className="text-xs text-[#1A1A1A] space-y-1 pl-4 list-disc marker:text-[#B89555]">
                          <li>Where in Dubai did you buy?</li>
                          <li>Which units are for sale, and which are for rent?</li>
                          <li>Your selling / rental price</li>
                          <li>Title deed and full documents for each unit</li>
                        </ul>
                        <p className="text-[11px] text-muted-foreground">Once registered &amp; approved, share links generate automatically.</p>
                        <Button
                          onClick={() => navigate("/list-your-property")}
                          data-emerald-action="true"
                          className="jj-cta-emerald w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" /> Register my inventory
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>


              {/* Recent Activity */}
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 5).map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                          <span className="text-sm text-foreground">{a.message}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "dd MMM yyyy")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── MY PROPERTIES ── */}
          <TabsContent value="properties">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Favorited & Shortlisted Properties
              </h3>
              {favorites.length === 0 ? (
                <Card className="border-[hsl(36,40%,70%)]/20">
                  <CardContent className="p-8 text-center">
                    <Heart className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-muted-foreground">No saved properties yet</p>
                    <Link to="/properties"><Button variant="outline" className="mt-4 border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)]">Browse Properties</Button></Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {favorites.map((f: any) => (
                    <Card key={f.id} className="border-[hsl(36,40%,70%)]/20">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="min-w-0 pr-3">
                          <p className="font-semibold text-sm text-foreground truncate">{f.project?.name || `Project #${f.project_id?.slice(0, 8)}`}</p>
                          <p className="text-[10px] text-muted-foreground">Added {format(new Date(f.created_at), "dd MMM yyyy")}</p>
                        </div>
                        <Link to={`/project/${f.project?.slug || f.project_id}`} aria-label="View property">
                          <button
                            type="button"
                            data-surface="emerald"
                            data-emerald-ok="button"
                            className="jj-surface-emerald inline-flex items-center justify-center w-11 h-11 rounded-full shadow-[0_4px_14px_-4px_rgba(6,78,59,0.45)] transition-all duration-200 hover:scale-105 hover:shadow-[0_8px_24px_-6px_rgba(6,78,59,0.55)] hover:brightness-110"
                          >
                            <Eye className="w-5 h-5 allow-white" stroke="#FFFFFF" style={{ color: "#FFFFFF" }} />
                          </button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Browsing History */}
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 pt-4">
                <History className="w-5 h-5" style={{ color: "var(--emerald-1, #064e3b)" }} /> Browsing History
              </h3>
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardContent className="p-6 text-center">
                  <History className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--emerald-1, #064e3b)" }} />
                  <p className="text-sm text-muted-foreground">Property viewing history will appear here</p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── DOCUMENTS ── */}
          <TabsContent value="documents">
            <InvestorDocumentVault userId={user?.id || ""} />
          </TabsContent>

          {/* ── UPDATE PROFILE ── */}
          <TabsContent value="profile">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-6">
              <Card className="border-2 border-[hsl(36,40%,70%)]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Your Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Full Name</Label>
                      <Input value={profileForm.full_name} onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Input value={profileForm.email} disabled className="border-[hsl(36,40%,70%)]/30 opacity-60" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone Number</Label>
                      <Input value={profileForm.phone_number} onChange={(e) => setProfileForm(p => ({ ...p, phone_number: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Nationality</Label>
                      <Input value={profileForm.nationality} onChange={(e) => setProfileForm(p => ({ ...p, nationality: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Gender</Label>
                      <Select value={profileForm.gender} onValueChange={(v) => setProfileForm(p => ({ ...p, gender: v }))}>
                        <SelectTrigger className="border-[hsl(36,40%,70%)]/30"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Languages</Label>
                      <Input value={profileForm.languages} onChange={(e) => setProfileForm(p => ({ ...p, languages: e.target.value }))} placeholder="English, Arabic..." className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Years of Investment Experience</Label>
                      <Input value={profileForm.experience_years} onChange={(e) => setProfileForm(p => ({ ...p, experience_years: e.target.value }))} type="number" className="border-[hsl(36,40%,70%)]/30" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Bio / Notes</Label>
                    <Textarea value={profileForm.bio} onChange={(e) => setProfileForm(p => ({ ...p, bio: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" rows={3} />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-gradient-to-r from-[hsl(36,40%,70%)] to-[hsl(38,35%,60%)] text-[hsl(32,28%,13%)] hover:opacity-90">
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </CardContent>
              </Card>

              {/* Brand Assets */}
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Brand Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Stamp", icon: Stamp },
                      { label: "Logo", icon: ImageIcon },
                      { label: "Business Card", icon: CreditCard },
                    ].map((asset) => (
                      <div
                        key={asset.label}
                        className="group text-center p-4 rounded-xl border border-[hsl(36,40%,70%)]/40 bg-[#F7F2EA] transition-all duration-200 cursor-default hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-12px_rgba(6,78,59,0.45)]"
                      >
                        <div className="mx-auto mb-2 w-12 h-12 rounded-xl flex items-center justify-center bg-[#EFE6D6] border border-[hsl(36,40%,70%)]/40 transition-colors duration-200 group-hover:bg-[var(--emerald-1,#064e3b)] group-hover:border-[var(--emerald-1,#064e3b)]">
                          <asset.icon
                            className="w-6 h-6 text-[#1A1A1A] transition-colors duration-200 group-hover:text-white"
                            aria-hidden="true"
                            data-decorative="true"
                          />
                        </div>
                        <p className="text-xs font-semibold text-[#1A1A1A]">{asset.label}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">Not uploaded</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: "Draft Applications", icon: FileEdit, count: 0 },
                  { label: "AI Tools Used", icon: Star, count: 0 },
                  { label: "Notes", icon: StickyNote, count: 0 },
                ].map((item) => (
                  <Card key={item.label} className="border-[hsl(36,40%,70%)]/20">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[hsl(36,40%,70%)]/10 flex items-center justify-center">
                        <item.icon className="w-5 h-5 text-[hsl(36,40%,70%)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.count} items</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Role Switch */}
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Switch Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Want to become a developer or broker? Switch your role below.</p>
                  <div className="flex gap-3">
                    <Link to="/broker/portal">
                      <Button variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)]">Switch to Broker</Button>
                    </Link>
                    <Link to="/developer-portal?tab=register">
                      <Button variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)]">Apply as Developer</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── INBOX ── */}
          <TabsContent value="inbox">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Messages & Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-[hsl(36,40%,70%)]" />
                            <span className="text-sm text-foreground">{a.message}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(a.created_at), "dd MMM yyyy")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* ── ALERTS ── */}
          <TabsContent value="alerts">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-4">
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Event Invitations & Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {invitations.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No alerts or invitations</p>
                  ) : (
                    <div className="space-y-3">
                      {invitations.map((inv) => (
                        <div key={inv.id} className="p-4 rounded-xl border border-[hsl(36,40%,70%)]/20 bg-background/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-sm text-foreground">{(inv.event as any)?.title || "Event"}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {(inv.event as any)?.event_date ? format(new Date((inv.event as any).event_date), "dd MMM yyyy, HH:mm") : ""}
                              </p>
                            </div>
                            <Badge className={inv.status === "accepted" ? "jj-surface-emerald-soft text-emerald-500 border-[color:var(--emerald-1)]/30/30" : inv.status === "declined" ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-amber-500/10 text-amber-500 border-amber-500/30"}>
                              {inv.status}
                            </Badge>
                          </div>
                          {inv.status === "invited" && (
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" onClick={() => respondToInvitation(inv.id, "accepted")} className="jj-surface-emerald text-white hover:jj-surface-emerald text-xs">Accept</Button>
                              <Button size="sm" variant="outline" onClick={() => respondToInvitation(inv.id, "declined")} className="text-xs">Decline</Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {submittedListings.length > 0 && (
                <Card className="border-[hsl(36,40%,70%)]/20">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Listing Submission Approvals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {submittedListings.map((listing) => {
                        const approved = /approved|live|published/i.test(`${listing.approvalStatus} ${listing.status}`);
                        const rejected = /reject/i.test(`${listing.approvalStatus} ${listing.status}`);
                        return (
                          <div key={`${listing.source}-${listing.id}`} className="grid grid-cols-[1fr_auto] items-center gap-3 p-4 rounded-xl border border-[hsl(36,40%,70%)]/20 bg-background/50">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">{listing.title}</p>
                              <p className="text-[10px] text-muted-foreground">Submitted {format(new Date(listing.createdAt), "dd MMM yyyy")}{listing.location ? ` · ${listing.location}` : ""}</p>
                            </div>
                            <Badge className={`w-24 justify-center rounded-full ${approved ? "jj-surface-emerald-soft text-[#064E3B] border-[color:var(--emerald-1)]/30" : rejected ? "bg-red-500/10 text-red-500 border-red-500/30" : "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40"}`}>
                              {approved ? "Approved" : rejected ? "Rejected" : "Pending"}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* ── CALENDAR ── */}
          <TabsContent value="calendar">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="space-y-4">
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Full Calendar & Bookings
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}>Previous</Button>
                      <span className="min-w-[140px] text-center text-sm font-semibold text-foreground">{format(calendarMonth, "MMMM yyyy")}</span>
                      <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}>Next</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid lg:grid-cols-[1.5fr_0.9fr] gap-5">
                  <div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground py-2">{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {buildCalendarDays(calendarMonth).map((day, idx) => {
                        const dateKey = day ? formatLocalDate(day) : `blank-${idx}`;
                        const dayEvents = day ? calendarEvents.filter((event) => event.date === dateKey) : [];
                        return (
                          <div key={dateKey} className={`min-h-[92px] rounded-lg border p-2 ${day ? "bg-[#FDFBF7] border-[hsl(36,40%,70%)]/20" : "bg-transparent border-transparent"}`}>
                            {day && (
                              <>
                                <div className="text-xs font-bold text-foreground">{format(day, "d")}</div>
                                <div className="mt-1 space-y-1">
                                  {dayEvents.slice(0, 2).map((event) => (
                                    <div key={event.id} className="rounded-md bg-[#064E3B] px-1.5 py-1 text-[9px] font-semibold text-white truncate" title={event.title}>{event.time} {event.title}</div>
                                  ))}
                                  {dayEvents.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayEvents.length - 2} more</div>}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl border border-[hsl(36,40%,70%)]/25 bg-[#F7F2EA] p-4 space-y-3">
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2"><Plus className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Book appointment</h4>
                      <Input value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} placeholder="Property viewing with Jane" className="border-[hsl(36,40%,70%)]/30 bg-[#FDFBF7]" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="date" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} className="border-[hsl(36,40%,70%)]/30 bg-[#FDFBF7]" />
                        <Input type="time" value={eventForm.time} onChange={(e) => setEventForm((p) => ({ ...p, time: e.target.value }))} className="border-[hsl(36,40%,70%)]/30 bg-[#FDFBF7]" />
                      </div>
                      <Input value={eventForm.location} onChange={(e) => setEventForm((p) => ({ ...p, location: e.target.value }))} placeholder="Location or property link" className="border-[hsl(36,40%,70%)]/30 bg-[#FDFBF7]" />
                      <Textarea value={eventForm.notes} onChange={(e) => setEventForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes for this booking" className="border-[hsl(36,40%,70%)]/30 bg-[#FDFBF7]" />
                      <Button onClick={() => handleAddEvent()} data-emerald-action="true" className="jj-cta-emerald w-full"><Calendar className="w-4 h-4 mr-2" /> Add to calendar</Button>
                    </div>

                    <div className="rounded-xl border border-[hsl(36,40%,70%)]/25 bg-[#FDFBF7] p-4">
                      <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Upcoming reminders</h4>
                      {calendarEvents.length === 0 ? <p className="text-xs text-muted-foreground">No bookings yet</p> : (
                        <div className="space-y-2 max-h-[180px] overflow-y-auto jj-scrollbar-gold">
                          {calendarEvents.slice(-5).reverse().map((event) => (
                            <div key={event.id} className="flex items-center justify-between gap-2 rounded-lg border border-[hsl(36,40%,70%)]/15 p-2">
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">{event.title}</p>
                                <p className="text-[10px] text-muted-foreground">{format(new Date(event.date), "dd MMM")} · {event.time}</p>
                              </div>
                              {event.emailReminder && <Mail className="w-4 h-4 text-[#064E3B] shrink-0" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="tasks">
            <motion.div initial="hidden" animate="visible" variants={fadeIn} className="grid lg:grid-cols-[1fr_1fr] gap-4">
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><StickyNote className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Task Notes</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={taskDraft} onChange={(e) => setTaskDraft(e.target.value)} placeholder="Add a note or task for your property inventory..." className="min-h-[120px] border-[hsl(36,40%,70%)]/30 bg-[#FDFBF7]" />
                  <Button onClick={() => handleAddTask()} data-emerald-action="true" className="jj-cta-emerald w-full"><Plus className="w-4 h-4 mr-2" /> Add task note</Button>
                </CardContent>
              </Card>
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListChecks className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Active Tasks</CardTitle></CardHeader>
                <CardContent>
                  {tasks.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">No task notes yet</p> : (
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <button key={task.id} onClick={() => persistTasks(tasks.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))} className="w-full grid grid-cols-[24px_1fr_auto] items-center gap-3 p-3 rounded-xl border border-[hsl(36,40%,70%)]/20 bg-background/50 text-left">
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${task.done ? "bg-[#064E3B] border-[#064E3B]" : "border-[#B89555]"}`}>{task.done && <CheckCircle2 className="w-3 h-3 text-white" />}</span>
                          <span className={`text-sm font-medium ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(task.due), "dd MMM")}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="assistant">
            <motion.div initial="hidden" animate="visible" variants={fadeIn}>
              <Card className="border-[hsl(36,40%,70%)]/20 bg-gradient-to-br from-[#F7F2EA] to-[#FDFBF7]">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Bot className="w-4 h-4 text-[hsl(36,40%,70%)]" /> AI Assistant</CardTitle>
                </CardHeader>
                <CardContent className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
                  <div className="space-y-3">
                    <Textarea value={assistantPrompt} onChange={(e) => setAssistantPrompt(e.target.value)} placeholder="Tell me to book a viewing, add notes, create a task, or remind you by email..." className="min-h-[180px] border-[hsl(36,40%,70%)]/30 bg-[#FDFBF7]" />
                    <Button onClick={handleAssistantCommand} data-emerald-action="true" className="jj-cta-emerald w-full"><Send className="w-4 h-4 mr-2" /> Run assistant command</Button>
                  </div>
                  <div className="rounded-xl border border-[hsl(36,40%,70%)]/25 bg-[#FDFBF7] p-4 space-y-3">
                    <h4 className="text-sm font-bold text-foreground">What I can manage</h4>
                    {["Calendar bookings", "Viewing reminders", "Task notes", "Alert follow-ups", "Inventory share links"].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="w-4 h-4 text-[#064E3B]" /> {item}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
