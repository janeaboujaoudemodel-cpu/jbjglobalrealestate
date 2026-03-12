import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileCheck, MapPin, GraduationCap, BookOpen, Calendar, Sparkles,
  Home, BarChart3, FileText, MessageSquare, Building2, Plus,
  ListChecks, FolderOpen, HelpCircle, Palette as _Palette
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole, VisitorRole } from "@/hooks/useUserRole";
import { useOwnerVerification } from "@/hooks/useOwnerVerification";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const brokerActions: QuickAction[] = [
  { label: "Register Deal", description: "Submit a new closed deal", icon: FileCheck, href: "/broker-dashboard/deals", color: "text-emerald-400" },
  { label: "Site Check-In", description: "Log a developer visit", icon: MapPin, href: "/broker-dashboard/visits", color: "text-blue-400" },
  { label: "Training", description: "Continue learning", icon: GraduationCap, href: "/broker-education", color: "text-purple-400" },
  { label: "Resources", description: "Access broker tools", icon: BookOpen, href: "/broker-resources", color: "text-amber-400" },
  { label: "Schedule Visit", description: "Book a briefing", icon: Calendar, href: "/broker-dashboard/developer-visits", color: "text-cyan-400" },
  { label: "AI Tools", description: "Explore AI assistants", icon: Sparkles, href: "/broker-resources#ai-tools", color: "text-primary" },
];

const investorActions: QuickAction[] = [
  { label: "Browse Properties", description: "Find your next investment", icon: Home, href: "/properties?transaction=buy", color: "text-blue-400" },
  { label: "Compare Projects", description: "Side-by-side comparison", icon: BarChart3, href: "/compare", color: "text-emerald-400" },
  { label: "Request Shortlist", description: "Get curated options", icon: ListChecks, href: "/contact?type=shortlist", color: "text-purple-400" },
  { label: "Market Reports", description: "Access insights", icon: FileText, href: "/market-intelligence", color: "text-amber-400" },
  { label: "Request Consultation", description: "Speak to an advisor", icon: MessageSquare, href: "/contact?type=consultation", color: "text-cyan-400" },
  { label: "Portfolio View", description: "Track your watchlist", icon: Building2, href: "/investor-dashboard", color: "text-primary" },
];

const ownerActions: QuickAction[] = [
  { label: "Command Center", description: "Owner dashboard", icon: Building2, href: "/owner", color: "text-blue-400" },
  { label: "Listing Admin", description: "Manage all listings", icon: ListChecks, href: "/owner/listing-admin", color: "text-emerald-400" },
  { label: "CRM Dashboard", description: "Leads & pipeline", icon: BarChart3, href: "/owner/crm", color: "text-purple-400" },
  { label: "Add Property", description: "List a new property", icon: Plus, href: "/listing-portal", color: "text-amber-400" },
  { label: "Analytics", description: "Business analytics", icon: FileText, href: "/owner/analytics", color: "text-cyan-400" },
  { label: "Marketing Hub", description: "Campaigns & ads", icon: MessageSquare, href: "/owner/marketing-hub", color: "text-primary" },
  { label: "AI Assistant", description: "Founder AI helper", icon: Sparkles, href: "/owner/founder-assistant", color: "text-purple-400" },
  { label: "Studio", description: "Media & content", icon: FolderOpen, href: "/owner/studio", color: "text-pink-400" },
  { label: "Ticket Center", description: "Customer happiness", icon: HelpCircle, href: "/ticket-hub", color: "text-amber-400" },
  { label: "CV Center", description: "Career applications", icon: FileCheck, href: "/hr-dashboard?tab=cv-center", color: "text-teal-400" },
  { label: "Calendar", description: "Appointments", icon: Calendar, href: "/owner/crm/calendar", color: "text-blue-400" },
  { label: "Team Chat", description: "Internal comms", icon: MessageSquare, href: "/owner/team-chat", color: "text-cyan-400" },
  { label: "My Listings", description: "View your properties", icon: Building2, href: "/owner/properties", color: "text-emerald-400" },
  { label: "Documents", description: "Manage your files", icon: FolderOpen, href: "/owner/documents", color: "text-amber-400" },
  { label: "Admin Panel", description: "System admin", icon: GraduationCap, href: "/owner/admin", color: "text-red-400" },
  { label: "Employee Hub", description: "Team & HR", icon: MapPin, href: "/employee-hub", color: "text-indigo-400" },
];

const defaultActions: QuickAction[] = [
  { label: "Browse Properties", description: "Explore listings", icon: Home, href: "/properties", color: "text-blue-400" },
  { label: "Area Guides", description: "Explore neighborhoods", icon: MapPin, href: "/areas", color: "text-emerald-400" },
  { label: "Market Intelligence", description: "View market data", icon: BarChart3, href: "/market-intelligence", color: "text-purple-400" },
  { label: "Contact Us", description: "Get in touch", icon: MessageSquare, href: "/contact", color: "text-amber-400" },
  { label: "AI Home Finder", description: "Get recommendations", icon: Sparkles, href: "/ai-hub", color: "text-cyan-400" },
  { label: "Resources", description: "Guides & tools", icon: BookOpen, href: "/guides", color: "text-primary" },
];

function getActionsForRole(role: VisitorRole, isOwnerVerified: boolean): QuickAction[] {
  // Server-verified owner always gets owner actions
  if (isOwnerVerified) return ownerActions;
  
  switch (role) {
    case 'broker':
    case 'broker_jbj':
    case 'broker_partner':
      return brokerActions;
    case 'investor':
      return investorActions;
    case 'owner':
      return ownerActions;
    default:
      return defaultActions;
  }
}

export function QuickActions() {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const { isOwner: isOwnerVerified } = useOwnerVerification();
  const actions = getActionsForRole(role, isOwnerVerified);

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto jj-scrollbar-gold">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => navigate(action.href)}
              className="flex items-center gap-3 rounded-xl border border-border bg-gradient-to-br from-[#F5EBD7] via-[#EDE0C8] to-[#E2D4B8] p-3.5 hover:border-gold/40 hover:shadow-md transition-all text-left w-full h-[72px]"
            >
              <div className="w-10 h-10 rounded-lg bg-white/60 border border-gold/30 flex items-center justify-center shrink-0">
                <action.icon className={`h-5 w-5 ${action.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-black leading-tight block">{action.label}</span>
                <span className="text-[11px] text-black/60 leading-snug block">{action.description}</span>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
