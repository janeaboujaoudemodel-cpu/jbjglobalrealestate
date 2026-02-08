import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileCheck, 
  MapPin, 
  GraduationCap, 
  BookOpen, 
  Calendar,
  Sparkles,
  Home,
  BarChart3,
  FileText,
  MessageSquare,
  Building2,
  Plus,
  ListChecks,
  FolderOpen,
  HelpCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole, VisitorRole } from "@/hooks/useUserRole";

interface QuickAction {
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

// Role-based action configurations
const brokerActions: QuickAction[] = [
  {
    label: "Register Deal",
    description: "Submit a new closed deal",
    icon: FileCheck,
    href: "/broker-dashboard/deals",
    color: "text-emerald-400",
  },
  {
    label: "Site Check-In",
    description: "Log a developer visit",
    icon: MapPin,
    href: "/broker-dashboard/visits",
    color: "text-blue-400",
  },
  {
    label: "Training",
    description: "Continue learning",
    icon: GraduationCap,
    href: "/broker-education",
    color: "text-purple-400",
  },
  {
    label: "Resources",
    description: "Access broker tools",
    icon: BookOpen,
    href: "/broker-resources",
    color: "text-amber-400",
  },
  {
    label: "Schedule Visit",
    description: "Book a briefing",
    icon: Calendar,
    href: "/broker-dashboard/developer-visits",
    color: "text-cyan-400",
  },
  {
    label: "AI Tools",
    description: "Explore AI assistants",
    icon: Sparkles,
    href: "/broker-resources#ai-tools",
    color: "text-primary",
  },
];

const investorActions: QuickAction[] = [
  {
    label: "Browse Properties",
    description: "Find your next investment",
    icon: Home,
    href: "/properties?transaction=buy",
    color: "text-blue-400",
  },
  {
    label: "Compare Projects",
    description: "Side-by-side comparison",
    icon: BarChart3,
    href: "/compare",
    color: "text-emerald-400",
  },
  {
    label: "Request Shortlist",
    description: "Get curated options",
    icon: ListChecks,
    href: "/contact?type=shortlist",
    color: "text-purple-400",
  },
  {
    label: "Market Reports",
    description: "Access insights",
    icon: FileText,
    href: "/market-intelligence",
    color: "text-amber-400",
  },
  {
    label: "Request Consultation",
    description: "Speak to an advisor",
    icon: MessageSquare,
    href: "/contact?type=consultation",
    color: "text-cyan-400",
  },
  {
    label: "Portfolio View",
    description: "Track your watchlist",
    icon: Building2,
    href: "/investor-dashboard",
    color: "text-primary",
  },
];

const ownerActions: QuickAction[] = [
  {
    label: "My Listings",
    description: "View your properties",
    icon: Building2,
    href: "/owner/properties",
    color: "text-blue-400",
  },
  {
    label: "Add Property",
    description: "List a new property",
    icon: Plus,
    href: "/seller-listing",
    color: "text-emerald-400",
  },
  {
    label: "Leads & CRM",
    description: "Manage your leads",
    icon: ListChecks,
    href: "/owner",
    color: "text-purple-400",
  },
  {
    label: "Documents",
    description: "Manage your files",
    icon: FolderOpen,
    href: "/owner/documents",
    color: "text-amber-400",
  },
  {
    label: "Messages",
    description: "View inquiries",
    icon: MessageSquare,
    href: "/owner/inbox",
    color: "text-cyan-400",
  },
  {
    label: "Request Support",
    description: "Get assistance",
    icon: HelpCircle,
    href: "/contact?type=support",
    color: "text-primary",
  },
];

const defaultActions: QuickAction[] = [
  {
    label: "Browse Properties",
    description: "Explore listings",
    icon: Home,
    href: "/properties",
    color: "text-blue-400",
  },
  {
    label: "Area Guides",
    description: "Explore neighborhoods",
    icon: MapPin,
    href: "/areas",
    color: "text-emerald-400",
  },
  {
    label: "Market Intelligence",
    description: "View market data",
    icon: BarChart3,
    href: "/market-intelligence",
    color: "text-purple-400",
  },
  {
    label: "Contact Us",
    description: "Get in touch",
    icon: MessageSquare,
    href: "/contact",
    color: "text-amber-400",
  },
  {
    label: "AI Home Finder",
    description: "Get recommendations",
    icon: Sparkles,
    href: "/ai-hub",
    color: "text-cyan-400",
  },
  {
    label: "Resources",
    description: "Guides & tools",
    icon: BookOpen,
    href: "/guides",
    color: "text-primary",
  },
];

function getActionsForRole(role: VisitorRole): QuickAction[] {
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
  
  const actions = getActionsForRole(role);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-foreground">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:border-primary/50 transition-colors min-h-[100px] w-full"
              onClick={() => navigate(action.href)}
            >
              <div className="flex items-center gap-2 w-full">
                <action.icon className={`h-5 w-5 ${action.color} shrink-0`} />
                <span className="text-sm font-medium text-foreground truncate">{action.label}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left line-clamp-2">{action.description}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
