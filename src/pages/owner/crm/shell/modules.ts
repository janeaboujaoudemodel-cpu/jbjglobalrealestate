/**
 * JBJ CRM module registry — mirrors Zoho CRM's sidebar sections EXACTLY.
 * Order and names are preserved. Do NOT add, remove, or rename.
 * Icons are lucide equivalents chosen to visually match Zoho.
 */
import {
  Home, Rss, UserPlus, Users, Building2, Handshake, CheckSquare,
  Video, PhoneCall, FileBarChart2, LineChart, Package, FileText,
  ShoppingCart, ClipboardList, Receipt, Megaphone, Truck, BookOpen,
  LifeBuoy, Lightbulb, TrendingUp, Folder, MapPin, Share2, FolderKanban,
  type LucideIcon,
} from "lucide-react";

export type CrmModule = {
  slug: string;
  label: string;
  icon: LucideIcon;
};

export const CRM_MODULES: CrmModule[] = [
  { slug: "home",             label: "Home",            icon: Home },
  { slug: "feeds",            label: "Feeds",           icon: Rss },
  { slug: "leads",            label: "Leads",           icon: UserPlus },
  { slug: "contacts",         label: "Contacts",        icon: Users },
  { slug: "accounts",         label: "Accounts",        icon: Building2 },
  { slug: "deals",            label: "Deals",           icon: Handshake },
  { slug: "tasks",            label: "Tasks",           icon: CheckSquare },
  { slug: "meetings",         label: "Meetings",        icon: Video },
  { slug: "calls",            label: "Calls",           icon: PhoneCall },
  { slug: "reports",          label: "Reports",         icon: FileBarChart2 },
  { slug: "analytics",        label: "Analytics",       icon: LineChart },
  { slug: "products",         label: "Products",        icon: Package },
  { slug: "quotes",           label: "Quotes",          icon: FileText },
  { slug: "sales-orders",     label: "Sales Orders",    icon: ShoppingCart },
  { slug: "purchase-orders",  label: "Purchase Orders", icon: ClipboardList },
  { slug: "invoices",         label: "Invoices",        icon: Receipt },
  { slug: "campaigns",        label: "Campaigns",       icon: Megaphone },
  { slug: "vendors",          label: "Vendors",         icon: Truck },
  { slug: "price-books",      label: "Price Books",     icon: BookOpen },
  { slug: "cases",            label: "Cases",           icon: LifeBuoy },
  { slug: "solutions",        label: "Solutions",       icon: Lightbulb },
  { slug: "forecasts",        label: "Forecasts",       icon: TrendingUp },
  { slug: "documents",        label: "Documents",       icon: Folder },
  { slug: "visits",           label: "Visits",          icon: MapPin },
  { slug: "social",           label: "Social",          icon: Share2 },
  { slug: "projects",         label: "Projects",        icon: FolderKanban },
];

export const CRM_MODULE_MAP = Object.fromEntries(
  CRM_MODULES.map((m) => [m.slug, m])
) as Record<string, CrmModule>;
