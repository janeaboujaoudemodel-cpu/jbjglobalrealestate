/**
 * JBJ CRM shell navigation registry.
 * Standalone — no external CRM dependency.
 */
import {
  BarChart3,
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
