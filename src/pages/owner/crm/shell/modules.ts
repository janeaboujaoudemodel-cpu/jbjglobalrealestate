/**
 * JBJ CRM shell navigation registry.
 * Standalone — no external CRM dependency.
 */
import {
  BarChart3,
  Blocks,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  Contact,
  FileBarChart2,
  FileText,
  Folder,
  Handshake,
  Headphones,
  Home,
  ImageOff,
  Kanban,
  Lightbulb,
  Link,
  Mail,
  Map,
  MapPin,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Package,
  Phone,
  Plug,
  ReceiptText,
  RefreshCw,
  ScrollText,
  Rss,
  Search,
  Share2,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Target,
  TicketCheck,
  TrendingUp,
  Users,
  UserCircle2,
  Building2,
  Video,
  Wrench,
  Crown,
  Database,
  Building,
  Shield,
  ShieldAlert,
  Bot,
  BookOpen,
  PenTool,
  Workflow,
  Palette,
  Inbox,
  Zap,
  AlertTriangle,
  Wallet,
  type LucideIcon,
} from "lucide-react";


export type CrmModule = {
  slug: string;
  label: string;
  icon: LucideIcon;
  color?: string;
};

export type CrmFolder = {
  label: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  children: CrmModule[];
};

export const CRM_PRIMARY_NAV: CrmModule[] = [
  { slug: "home", label: "Home", icon: Home },
  { slug: "calendar", label: "Calendar", icon: CalendarDays },
  { slug: "reports", label: "Reports", icon: BarChart3 },
  { slug: "analytics", label: "Analytics", icon: FileBarChart2 },
  { slug: "my-requests", label: "My Requests", icon: ClipboardList },
  { slug: "agents", label: "Agents", icon: BriefcaseBusiness },
];

// Standalone teamspace item above the folder groups.
export const CRM_TEAMSPACE_TOP: CrmModule[] = [
  { slug: "feeds", label: "Feeds", icon: Rss },
  { slug: "workqueue", label: "Workqueue", icon: Sparkles },
];

export const CRM_TEAMSPACE_FOLDERS: CrmFolder[] = [
  {
    label: "Sales",
    icon: Folder,
    defaultOpen: true,
    children: [
      { slug: "leads", label: "Leads", icon: Target },
      { slug: "contacts", label: "Contacts", icon: UserCircle2 },
      { slug: "accounts", label: "Accounts", icon: Building2 },
      { slug: "deals", label: "Deals", icon: Handshake },
      { slug: "forecasts", label: "Forecasts", icon: TrendingUp },
      { slug: "documents", label: "Documents", icon: FileText },
      { slug: "campaigns", label: "Campaigns", icon: Megaphone },
    ],
  },
  {
    label: "Activities",
    icon: Folder,
    defaultOpen: true,
    children: [
      { slug: "tasks", label: "Tasks", icon: CheckSquare },
      { slug: "meetings", label: "Meetings", icon: Video },
      { slug: "calls", label: "Calls", icon: Phone },
    ],
  },
  {
    label: "Inventory",
    icon: Folder,
    defaultOpen: true,
    children: [
      { slug: "products", label: "Products", icon: Package },
      { slug: "price-books", label: "Price Books", icon: Tag },
      { slug: "quotes", label: "Quotes", icon: FileText },
      { slug: "sales-orders", label: "Sales Orders", icon: ReceiptText },
      { slug: "purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
      { slug: "invoices", label: "Invoices", icon: ScrollText },
      { slug: "vendors", label: "Vendors", icon: Store },
    ],
  },
  {
    label: "Support",
    icon: Folder,
    defaultOpen: true,
    children: [
      { slug: "cases", label: "Cases", icon: TicketCheck },
      { slug: "solutions", label: "Solutions", icon: Lightbulb },
    ],
  },
  {
    label: "Integrations",
    icon: Folder,
    defaultOpen: true,
    children: [
      { slug: "salesinbox", label: "SalesInbox", icon: Mail },
      { slug: "social", label: "Social", icon: Share2 },
      { slug: "visits", label: "Visits", icon: Contact },
    ],
  },
];

export const CRM_TEAMSPACE_BOTTOM: CrmModule[] = [
  { slug: "services", label: "Services", icon: Wrench },
  { slug: "projects", label: "Projects", icon: Handshake },
  { slug: "marketplace", label: "Marketplace", icon: Blocks },
];

/**
 * Owner-only JBJ Hub section appended after Marketplace.
 * These routes stay INSIDE the CRM shell so owner tools do not jump back to
 * the legacy champagne backend shell.
 */
export type CrmOwnerHubModule = CrmModule & { href: string; legacyPath: string };

const hub = (slug: string) => `/owner/crm/jbj/${slug}`;

export const OWNER_HUB_LEGACY_PATHS: Record<string, string> = {
  "owner-admin": "/owner/admin",
  "owner-overview": "/owner",
  "owner-jbj-hub": "/owner/jbj-hub",
  "owner-documents-forms": "/owner/documents/forms",
  "owner-unified-crm": "/owner/crm",
  "owner-crm-workspace": "/owner/crm/jbj",
  "owner-data-hub": "/owner/data-hub",
  "owner-brokerages": "/owner/brokerages",
  "owner-client-portal": "/owner/crm/jbj/owner-client-portal",
  "owner-investors": "/owner/crm/jbj/owner-client-portal",
  "deals-ledger": "/owner/crm/jbj/deals",
  "owner-developers": "/owner/developers",
  "owner-developer-projects": "/owner/developers/projects",
  "owner-developer-calendar": "/owner/developers/calendar",
  "owner-developer-access": "/owner/developers/access-requests",
  "owner-developer-profiles": "/owner/developers/profile-rebuild",
  "owner-missing-logos": "/owner/developers/missing-logos",
  "owner-profile-requests": "/owner/crm/jbj/owner-profile-requests",
  "owner-drive-extractions": "/owner/drive-extractions",
  "owner-properties": "/owner/properties",
  "owner-featured-projects": "/owner/properties/featured",
  "owner-property-map": "/owner/map",
  "owner-listing-admin": "/owner/listing-admin",
  "owner-inbox": "/owner/crm/jbj/owner-inbox",
  "owner-team-chat": "/owner/team-chat",
  "owner-relationships": "/owner/crm/jbj/owner-relationships",
  "owner-founder-assistant": "/owner/founder-assistant",
  "owner-recommendations": "/owner/recommendations",
  "owner-ai-home-finder": "/owner/applications/ai-home-finder",
  "owner-royal-tools": "/ai-hub",
  "owner-automations": "/owner/automations",
  "owner-meeting-hub": "/meeting-center",
  "owner-ai-meeting": "/ai-meeting-summarizer",
  "owner-agent-integrations": "/owner/agent-integrations",
  "owner-locations": "/owner/jbj-hub?tab=areas",
  "owner-data-gaps": "/owner/data-gaps",
  "owner-market-import": "/owner/crm/jbj/owner-market-import",
  "owner-enrichment-review": "/owner/enrichment-review",
  "owner-brand-assets": "/owner/brand-assets",
  "owner-studio": "/owner/studio",
  "owner-founder-settings": "/owner/founder-settings",
  "owner-podcast-studio": "/owner/podcast-studio",
  "owner-voice-agent": "/owner/voice-agent",
  "owner-kanban": "/owner/kanban",
  "owner-marketing-hub": "/owner/marketing-hub",
  "owner-news": "/owner/news",
  "owner-books": "/owner/books",
  "owner-careers": "/owner/careers-portal",
  "owner-analytics": "/owner/analytics",
  "owner-users": "/owner/users",
  "owner-crm-directory": "/owner/crm-directory",
  "owner-research-users": "/owner/research-users",
  "owner-external-access": "/owner/external-access",
  "owner-audit": "/owner/audit",
  "owner-integrations": "/owner/integrations",
  "owner-safety": "/owner/safety",
  "owner-settings": "/owner/settings",
  "owner-security": "/security-console",
  "owner-executive-assistant": "/executive-assistant",
};

export const CRM_OWNER_HUB_SECTIONS: CrmFolder[] = [
  {
    label: "Core",
    icon: Crown,
    defaultOpen: true,
    children: [
      { slug: "owner-admin", label: "Owner Panel", icon: Crown },
      { slug: "owner-overview", label: "Overview", icon: Home },
      { slug: "owner-jbj-hub", label: "JBJ Hub", icon: Sparkles },
      { slug: "owner-documents-forms", label: "Document Studio", icon: FileText },
      { slug: "owner-data-hub", label: "Data Hub", icon: Database },
    ],
  },
  {
    label: "Portal Hub",
    icon: Building,
    defaultOpen: true,
    children: [
      { slug: "owner-brokerages", label: "Brokerage Portal", icon: Handshake },
      { slug: "owner-developers", label: "Developer Portal", icon: Building },
      { slug: "owner-client-portal", label: "Client Portal", icon: Users },
      { slug: "owner-relationships", label: "Relationships Hub", icon: Handshake },
      { slug: "deals-ledger", label: "My Deals", icon: Wallet },
      { slug: "owner-careers", label: "Careers Portal", icon: BriefcaseBusiness },
    ],
  },
  {
    label: "Developers",
    icon: Building,
    defaultOpen: true,
    children: [
      { slug: "owner-developer-projects", label: "Projects", icon: ClipboardList },
      { slug: "owner-developer-calendar", label: "Calendar", icon: CalendarDays },
      { slug: "owner-developer-access", label: "Access Requests", icon: Shield },
      { slug: "owner-developer-profiles", label: "Developer Profiles", icon: RefreshCw },
      { slug: "owner-missing-logos", label: "Missing Logos", icon: ImageOff },
      { slug: "owner-developer-media", label: "Media Studio", icon: ImageOff },
      { slug: "owner-profile-requests", label: "Profile Requests", icon: FileText },
      { slug: "owner-drive-extractions", label: "Drive Extractions", icon: Inbox },
    ],
  },
  {
    label: "Properties",
    icon: Building2,
    defaultOpen: true,
    children: [
      { slug: "owner-properties", label: "Properties", icon: Building2 },
      { slug: "owner-featured-projects", label: "Featured Projects", icon: Sparkles },
      { slug: "owner-property-map", label: "Property Map", icon: Map },
      { slug: "owner-listing-admin", label: "Listings Admin", icon: ClipboardList },
      { slug: "owner-listings-approval", label: "Listings Approval", icon: ClipboardList },
    ],
  },
  {
    label: "Communication",
    icon: MessageSquare,
    defaultOpen: true,
    children: [
      { slug: "owner-inbox", label: "Messages / Inbox", icon: MessageSquare },
      { slug: "owner-team-chat", label: "Team Chat", icon: MessagesSquare },
    ],
  },
  {
    label: "AI & Tools",
    icon: Bot,
    defaultOpen: true,
    children: [
      { slug: "owner-founder-assistant", label: "Founder Assistant", icon: MessageSquare },
      { slug: "owner-recommendations", label: "Recommendations", icon: Sparkles },
      { slug: "owner-ai-home-finder", label: "AI Home Finder Leads", icon: Sparkles },
      { slug: "owner-royal-tools", label: "JBJ Royal Tools Hub", icon: Crown },
      { slug: "owner-automations", label: "Workflow Automation", icon: Zap },
      { slug: "owner-meeting-hub", label: "Meeting Hub", icon: Video },
      { slug: "owner-ai-meeting", label: "AI Meeting Summarizer", icon: Brain },
      { slug: "owner-agent-integrations", label: "Agent Integrations", icon: Plug },
      { slug: "owner-locations", label: "Locations", icon: MapPin },
      { slug: "owner-data-gaps", label: "Data Gaps", icon: AlertTriangle },
      { slug: "owner-market-import", label: "Market Import Review", icon: Database },
      { slug: "owner-enrichment-review", label: "AI Enrichment Review", icon: Sparkles },
    ],
  },
  {
    label: "Creative",
    icon: Palette,
    defaultOpen: true,
    children: [
      { slug: "owner-brand-assets", label: "Brand Assets", icon: Crown },
      { slug: "owner-studio", label: "Studio", icon: Video },
      { slug: "owner-founder-settings", label: "Founder & Podcast Control", icon: Users },
      { slug: "owner-podcast-studio", label: "Podcast Studio", icon: Headphones },
      { slug: "owner-voice-agent", label: "Voice Agent", icon: Phone },
      { slug: "owner-kanban", label: "Kanban Board", icon: Kanban },
      { slug: "owner-marketing-hub", label: "Marketing Hub", icon: Megaphone },
      { slug: "owner-news", label: "News Admin", icon: Rss },
      { slug: "owner-books", label: "Books Library", icon: BookOpen },
    ],
  },
  {
    label: "Admin",
    icon: Shield,
    defaultOpen: true,
    children: [
      { slug: "owner-analytics", label: "Analytics", icon: BarChart3 },
      { slug: "owner-users", label: "Users", icon: Users },
      { slug: "owner-crm-directory", label: "CRM Directory", icon: Users },
      { slug: "owner-research-users", label: "Research Users", icon: Users },
    ],
  },
  {
    label: "System",
    icon: ShieldAlert,
    defaultOpen: true,
    children: [
      { slug: "owner-external-access", label: "External Access", icon: Shield },
      { slug: "owner-audit", label: "Audit", icon: Store },
      { slug: "owner-integrations", label: "Integrations", icon: Link },
      { slug: "owner-safety", label: "Safety Panel", icon: ShieldAlert },
      { slug: "owner-settings", label: "Settings", icon: PenTool },
      { slug: "owner-security", label: "Security Console", icon: Shield },
      { slug: "owner-executive-assistant", label: "Executive Assistant", icon: Bot },
    ],
  },
];

export const CRM_OWNER_HUB_MODULES: CrmOwnerHubModule[] = CRM_OWNER_HUB_SECTIONS.flatMap((section) =>
  section.children.map((item) => ({
    ...item,
    href: hub(item.slug),
    legacyPath: OWNER_HUB_LEGACY_PATHS[item.slug] ?? "/owner",
  }))
);

export const CRM_OWNER_HUB_MAP = Object.fromEntries(
  CRM_OWNER_HUB_MODULES.map((m) => [m.slug, m])
) as Record<string, CrmOwnerHubModule>;

export const CRM_MODULES: CrmModule[] = [
  ...CRM_PRIMARY_NAV,

  ...CRM_TEAMSPACE_TOP,
  ...CRM_TEAMSPACE_FOLDERS.flatMap((folder) => folder.children),
  ...CRM_TEAMSPACE_BOTTOM,
  ...CRM_OWNER_HUB_MODULES,
];

export const CRM_MODULE_MAP = Object.fromEntries(
  CRM_MODULES.map((m) => [m.slug, m])
) as Record<string, CrmModule>;

export const CRM_DEFAULT_SECTION = "home";

export const crmSectionPath = (slug: string) => `/owner/crm/jbj/${slug}`;

export const getCrmModuleLabel = (slug?: string) =>
  CRM_MODULE_MAP[slug || CRM_DEFAULT_SECTION]?.label ?? "Home";

export { ChevronDown, Search, Users, Contact, CalendarDays };
