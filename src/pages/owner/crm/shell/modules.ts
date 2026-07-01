/**
 * JBJ CRM shell navigation registry.
 * This file mirrors the uploaded Projects-screen sidebar only: same visible
 * folders, same order, same nesting, and no live external dependency.
 */
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
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
  Package,
  Phone,
  ReceiptText,
  ScrollText,
  Search,
  Share2,
  ShoppingCart,
  Store,
  Tag,
  TicketCheck,
  Users,
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

export const CRM_TEAMSPACE_TOP: CrmModule[] = [
  { slug: "meetings", label: "Meetings", icon: Video },
  { slug: "calls", label: "Calls", icon: Phone },
];

export const CRM_TEAMSPACE_FOLDERS: CrmFolder[] = [
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

export const CRM_DEFAULT_SECTION = "projects";

export const crmSectionPath = (slug: string) => `/owner/crm/jbj/${slug}`;

export const getCrmModuleLabel = (slug?: string) =>
  CRM_MODULE_MAP[slug || CRM_DEFAULT_SECTION]?.label ?? "Projects";

export { ChevronDown, Search, Users, Contact, CalendarDays };
