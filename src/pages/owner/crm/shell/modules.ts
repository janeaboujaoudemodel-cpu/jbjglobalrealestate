/**
 * JBJ CRM shell navigation registry.
 * Standalone — no external CRM dependency.
 */
import {
  BarChart3,
  Blocks,
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
  Home,
  Lightbulb,
  Mail,
  Megaphone,
  Package,
  Phone,
  ReceiptText,
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
  Bot,
  BookOpen,
  PenTool,
  Workflow,
  Palette,
  ScanLine,
  Inbox,
  UserPlus,
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
 * Owner-only "Backend" section appended after Marketplace.
 * These entries link OUT of the CRM shell to owner-backend routes,
 * so owners get a single unified sidebar (Phase 4).
 * Use absolute hrefs — rendered via NavLink `to={href}` when `href` is present.
 */
export type CrmExternalModule = CrmModule & { href: string };

export const CRM_OWNER_BACKEND: CrmExternalModule[] = [
  { slug: "owner-home", label: "Command Center", icon: Crown, href: "/owner" },
  { slug: "owner-data-hub", label: "Data Hub", icon: Database, href: "/owner/data-hub" },
  { slug: "owner-developers", label: "Developers Portal", icon: Building, href: "/owner/developers" },
  { slug: "owner-brokers", label: "Broker Portal", icon: BriefcaseBusiness, href: "/owner/brokers" },
  { slug: "owner-relationships", label: "Relationships Hub", icon: Handshake, href: "/owner/crm/relationship-hub" },
  { slug: "owner-hr", label: "HR Hub", icon: Users, href: "/hr-dashboard" },
  { slug: "owner-marketing", label: "Marketing Hub", icon: Megaphone, href: "/admin/marketing-hub" },
  { slug: "owner-news", label: "News Admin", icon: Rss, href: "/owner/news" },
  { slug: "owner-books", label: "Books Library", icon: BookOpen, href: "/owner/books" },
  { slug: "owner-drive", label: "Drive Extractions", icon: Inbox, href: "/owner/drive-extractions" },
  { slug: "owner-design", label: "Design Studio", icon: Palette, href: "/jbj-design-studio" },
  { slug: "owner-security", label: "Security Console", icon: Shield, href: "/security-console" },
  { slug: "owner-automations", label: "Automations", icon: Workflow, href: "/owner/automations" },
  { slug: "owner-analytics", label: "JBJ Analytics", icon: BarChart3, href: "/jbj-analytics" },
  { slug: "owner-onboarding", label: "Onboarding", icon: UserPlus, href: "/admin/onboarding" },
  { slug: "owner-assistant", label: "Executive Assistant", icon: Bot, href: "/executive-assistant" },
];

export const CRM_MODULES: CrmModule[] = [
  ...CRM_PRIMARY_NAV,

  ...CRM_TEAMSPACE_TOP,
  ...CRM_TEAMSPACE_FOLDERS.flatMap((folder) => folder.children),
  ...CRM_TEAMSPACE_BOTTOM,
];

export const CRM_MODULE_MAP = Object.fromEntries(
  CRM_MODULES.map((m) => [m.slug, m])
) as Record<string, CrmModule>;

export const CRM_DEFAULT_SECTION = "home";

export const crmSectionPath = (slug: string) => `/owner/crm/jbj/${slug}`;

export const getCrmModuleLabel = (slug?: string) =>
  CRM_MODULE_MAP[slug || CRM_DEFAULT_SECTION]?.label ?? "Home";

export { ChevronDown, Search, Users, Contact, CalendarDays };
