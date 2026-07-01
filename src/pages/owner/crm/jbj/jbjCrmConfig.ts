import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartPie,
  Contact,
  FileBarChart2,
  FileBox,
  FileText,
  FolderKanban,
  Gauge,
  Handshake,
  Home,
  Megaphone,
  Package,
  Phone,
  ReceiptText,
  ShoppingCart,
  Tags,
  Target,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type JbjCrmSection =
  | "home"
  | "leads"
  | "contacts"
  | "accounts"
  | "deals"
  | "forecast"
  | "activities"
  | "calls"
  | "meetings"
  | "tasks"
  | "campaigns"
  | "products"
  | "price-books"
  | "quotes"
  | "sales-orders"
  | "purchase-orders"
  | "invoices"
  | "reports"
  | "analytics"
  | "dashboards"
  | "documents"
  | "projects"
  | "developers-portal"
  | "listings";

export interface JbjCrmModule {
  id: JbjCrmSection;
  label: string;
  path: string;
  icon: LucideIcon;
}

export const JBJ_CRM_MODULES: JbjCrmModule[] = [
  { id: "home", label: "Home", path: "", icon: Home },
  { id: "leads", label: "Leads", path: "leads", icon: UserPlus },
  { id: "contacts", label: "Contacts", path: "contacts", icon: Contact },
  { id: "accounts", label: "Accounts", path: "accounts", icon: Building2 },
  { id: "deals", label: "Deals", path: "deals", icon: Handshake },
  { id: "forecast", label: "Forecast", path: "forecast", icon: Target },
  { id: "activities", label: "Activities", path: "activities", icon: Activity },
  { id: "calls", label: "Calls", path: "calls", icon: Phone },
  { id: "meetings", label: "Meetings", path: "meetings", icon: CalendarDays },
  { id: "tasks", label: "Tasks", path: "tasks", icon: BookOpen },
  { id: "campaigns", label: "Campaigns", path: "campaigns", icon: Megaphone },
  { id: "products", label: "Products", path: "products", icon: Package },
  { id: "price-books", label: "Price Books", path: "price-books", icon: Tags },
  { id: "quotes", label: "Quotes", path: "quotes", icon: FileText },
  { id: "sales-orders", label: "Sales Orders", path: "sales-orders", icon: ShoppingCart },
  { id: "purchase-orders", label: "Purchase Orders", path: "purchase-orders", icon: FileBox },
  { id: "invoices", label: "Invoices", path: "invoices", icon: ReceiptText },
  { id: "reports", label: "Reports", path: "reports", icon: FileBarChart2 },
  { id: "analytics", label: "Analytics", path: "analytics", icon: BarChart3 },
  { id: "dashboards", label: "Dashboards", path: "dashboards", icon: Gauge },
  { id: "documents", label: "Documents", path: "documents", icon: FileText },
  { id: "projects", label: "Projects", path: "projects", icon: FolderKanban },
  { id: "developers-portal", label: "Developers Portal", path: "developers-portal", icon: BriefcaseBusiness },
  { id: "listings", label: "Listings", path: "listings", icon: ChartPie },
];

export const getJbjCrmPath = (module: JbjCrmModule) =>
  module.path ? `/owner/crm/jbj/${module.path}` : "/owner/crm/jbj";
