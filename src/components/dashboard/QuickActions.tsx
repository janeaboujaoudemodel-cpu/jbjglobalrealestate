import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileCheck, MapPin, GraduationCap, BookOpen, Calendar, Sparkles,
  Home, BarChart3, FileText, MessageSquare, Building2, Plus,
  ListChecks, FolderOpen, HelpCircle, Briefcase, Wrench, Linkedin,
  TrendingUp, Tag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserModeContext, UserMode } from "@/contexts/UserModeContext";
import { useOwnerVerification } from "@/hooks/useOwnerVerification";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

// ── Tiles shared across ALL modes (investor/broker/developer) ──────────────
const sharedActions: QuickAction[] = [
  { label: "Browse Properties",   description: "Explore listings",         icon: Home,         href: "/properties" },
  { label: "List Your Property",  description: "Sell or rent your asset",  icon: Plus,         href: "/listing-portal" },
  { label: "Resale Properties",   description: "Investor secondary market", icon: Tag,         href: "/properties?transaction=resale" },
  { label: "AI Tools",            description: "Smart real-estate assistants", icon: Sparkles, href: "/ai-hub" },
  { label: "Distribution Services", description: "Reach the right buyers", icon: MessageSquare, href: "/services" },
  { label: "Insights & Guides",   description: "Market intelligence",      icon: BarChart3,    href: "/market-intelligence" },
  { label: "Books",               description: "Curated library",          icon: BookOpen,     href: "/education-hub" },
  { label: "Company & LinkedIn",  description: "About JBJ",                icon: Linkedin,     href: "/about" },
  { label: "Tools & Workspace",   description: "Productivity suite",       icon: Wrench,       href: "/toolkit" },
];

// ── Mode-only tiles ────────────────────────────────────────────────────────
const investorOnly: QuickAction[] = [
  { label: "Investor Services",    description: "Premium advisory",         icon: TrendingUp, href: "/investors" },
  { label: "Compare Projects",     description: "Side-by-side comparison",  icon: BarChart3,  href: "/compare" },
  { label: "Request Shortlist",    description: "Get curated options",      icon: ListChecks, href: "/contact?type=shortlist" },
  { label: "Speak to Advisor",     description: "Book a consultation",      icon: MessageSquare, href: "/contact?type=consultation" },
];

const brokerOnly: QuickAction[] = [
  { label: "Register Deal",        description: "Submit a closed deal",     icon: FileCheck,  href: "/broker-dashboard/deals" },
  { label: "Site Check-In",        description: "Log a developer visit",    icon: MapPin,     href: "/broker-dashboard/visits" },
  { label: "Broker Education",     description: "Continue learning",        icon: GraduationCap, href: "/broker-education" },
  { label: "Broker Resources",     description: "Templates & guides",       icon: FolderOpen, href: "/broker-resources" },
  { label: "Schedule Visit",       description: "Book a briefing",          icon: Calendar,   href: "/broker-dashboard/developer-visits" },
  { label: "Careers",              description: "Join JBJ",                 icon: GraduationCap, href: "/join" },
];

const developerOnly: QuickAction[] = [
  { label: "Developer Center",     description: "Your developer hub",       icon: Building2,  href: "/developer-hub" },
  { label: "Submit Project",       description: "Brochures, renders, terms", icon: Plus,      href: "/developer-portal?tab=submit" },
  { label: "My Projects",          description: "Track submission status",  icon: FolderOpen, href: "/developer-portal?tab=projects" },
  { label: "Request Briefing",     description: "Schedule a briefing",      icon: Calendar,   href: "/developer-portal?tab=briefing" },
  { label: "Agreements",           description: "Sign & review documents",  icon: FileCheck,  href: "/developer-portal?tab=agreements" },
  { label: "Careers",              description: "Hire with JBJ",            icon: GraduationCap, href: "/join" },
];

const ownerActions: QuickAction[] = [
  { label: "Command Center",   description: "Owner dashboard",  icon: Building2,  href: "/owner" },
  { label: "Listing Admin",    description: "Manage listings",  icon: ListChecks, href: "/owner/listing-admin" },
  { label: "CRM",              description: "Leads & pipeline", icon: BarChart3,  href: "/owner/crm" },
  { label: "Marketing Hub",    description: "Campaigns & ads",  icon: MessageSquare, href: "/owner/marketing-hub" },
  { label: "AI Assistant",     description: "Founder helper",   icon: Sparkles,   href: "/owner/founder-assistant" },
  { label: "Studio",           description: "Media & content",  icon: FolderOpen, href: "/owner/studio" },
  { label: "Ticket Center",    description: "Customer happiness", icon: HelpCircle, href: "/ticket-hub" },
  { label: "Calendar",         description: "Appointments",     icon: Calendar,   href: "/owner/crm/calendar" },
  { label: "Documents",        description: "Manage your files", icon: FolderOpen, href: "/owner/documents" },
];

function getModeOnly(mode: UserMode): QuickAction[] {
  if (mode === "broker")    return brokerOnly;
  if (mode === "developer") return developerOnly;
  return investorOnly;
}

function modeLabel(mode: UserMode): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function Tile({ action, onClick }: { action: QuickAction; onClick: (href: string) => void }) {
  return (
    <button
      onClick={() => onClick(action.href)}
      className="flex items-center gap-3 rounded-xl bg-[#EFE6D6] border-2 border-[#B89555]/60 p-3.5 hover:border-[#B89555] hover:bg-[#F7F2EA] hover:shadow-[0_6px_20px_-8px_rgba(184,149,85,0.45)] transition-all text-left w-full h-[72px]"
    >
      <div className="w-10 h-10 rounded-lg bg-[#F7F2EA] border-2 border-[#B89555]/60 flex items-center justify-center shrink-0">
        <action.icon className="h-5 w-5 text-[#1A1A1A]" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-semibold text-[#1A1A1A] leading-tight block">{action.label}</span>
        <span className="text-[11px] text-[#1A1A1A]/70 leading-snug block">{action.description}</span>
      </div>
    </button>
  );
}

export function QuickActions() {
  const navigate = useNavigate();
  const { mode } = useUserModeContext();
  const { isOwner } = useOwnerVerification();

  // Owner cockpit short-circuits ONLY in explicit Owner mode.
  if (isOwner && mode === "owner") {
    return (
      <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto jj-scrollbar-gold">
            {ownerActions.map((a, i) => <Tile key={i} action={a} onClick={navigate} />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const modeOnly = getModeOnly(mode);

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[#B89555]" strokeWidth={2.5} />
          Quick Actions
          <span className="ml-auto text-[10px] uppercase tracking-wider text-[#B89555] font-semibold">
            {modeLabel(mode)} mode
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-5">
        {/* For [Mode] */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-2 font-semibold">
            For {modeLabel(mode)}s
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modeOnly.map((a, i) => <Tile key={`m-${i}`} action={a} onClick={navigate} />)}
          </div>
        </div>

        {/* Shared */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 mb-2 font-semibold">
            Available to everyone
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sharedActions.map((a, i) => <Tile key={`s-${i}`} action={a} onClick={navigate} />)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
