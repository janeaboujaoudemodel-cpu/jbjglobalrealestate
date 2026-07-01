/**
 * JBJ CRM module registry — single source of truth for the left rail,
 * the router, and each module page.
 */
import {
  Home, BarChart3, PieChart, Inbox, Sparkles, Users2, ListChecks,
  UserPlus, Contact, Building2, Handshake, LineChart, FileText, Megaphone,
  CheckSquare, CalendarClock, Phone, Package, LifeBuoy, Cog, Briefcase,
  Plug, Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type JbjCrmSection =
  | "home" | "reports" | "analytics" | "my-requests" | "agents"
  | "team-space" | "work-queue"
  | "leads" | "contacts" | "accounts" | "deals" | "forecast"
  | "campaigns"
  | "tasks" | "meetings" | "calls"
  | "documents"
  | "inventory" | "support"
  | "services" | "projects"
  | "integrations" | "roles";

export type ZohoModuleId =
  | "Leads" | "Contacts" | "Accounts" | "Deals"
  | "Tasks" | "Cases" | "Products" | "Quotes" | "Invoices";

export interface JbjCrmModule {
  id: JbjCrmSection;
  label: string;
  path: string;
  icon: LucideIcon;
  /** If set, this module reads live data from Zoho via zoho-crm-proxy. */
  zohoModule?: ZohoModuleId;
  /** Grouping label in the left rail. */
  group: string;
}

export const JBJ_CRM_MODULES: JbjCrmModule[] = [
  // Home
  { id: "home",         label: "Home",         path: "",              icon: Home,          group: "Workspace" },

  // Sales
  { id: "leads",        label: "Leads",        path: "leads",         icon: UserPlus,      group: "Sales", zohoModule: "Leads" },
  { id: "contacts",     label: "Contacts",     path: "contacts",      icon: Contact,       group: "Sales", zohoModule: "Contacts" },
  { id: "accounts",     label: "Accounts",     path: "accounts",      icon: Building2,     group: "Sales", zohoModule: "Accounts" },
  { id: "deals",        label: "Deals",        path: "deals",         icon: Handshake,     group: "Sales", zohoModule: "Deals" },
  { id: "forecast",     label: "Forecast",     path: "forecast",      icon: LineChart,     group: "Sales" },

  // Marketing
  { id: "campaigns",    label: "Campaigns",    path: "campaigns",     icon: Megaphone,     group: "Marketing" },

  // Activities
  { id: "tasks",        label: "Tasks",        path: "tasks",         icon: CheckSquare,   group: "Activities", zohoModule: "Tasks" },
  { id: "meetings",     label: "Meetings",     path: "meetings",      icon: CalendarClock, group: "Activities" },
  { id: "calls",        label: "Calls",        path: "calls",         icon: Phone,         group: "Activities" },

  // Collaboration
  { id: "documents",    label: "Documents",    path: "documents",     icon: FileText,      group: "Collaboration" },
  { id: "team-space",   label: "Team Space",   path: "team-space",    icon: Users2,        group: "Collaboration" },
  { id: "work-queue",   label: "Work Queue",   path: "work-queue",    icon: ListChecks,    group: "Collaboration" },
  { id: "my-requests",  label: "My Requests",  path: "my-requests",   icon: Inbox,         group: "Collaboration" },

  // Ops
  { id: "inventory",    label: "Inventory",    path: "inventory",     icon: Package,       group: "Operations", zohoModule: "Products" },
  { id: "support",      label: "Support",      path: "support",       icon: LifeBuoy,      group: "Operations", zohoModule: "Cases" },
  { id: "services",     label: "Services",     path: "services",      icon: Cog,           group: "Operations" },
  { id: "projects",     label: "Projects",     path: "projects",      icon: Briefcase,     group: "Operations" },

  // Intelligence
  { id: "reports",      label: "Reports",      path: "reports",       icon: BarChart3,     group: "Intelligence" },
  { id: "analytics",    label: "Analytics",    path: "analytics",     icon: PieChart,      group: "Intelligence" },
  { id: "agents",       label: "AI Agents",    path: "agents",        icon: Sparkles,      group: "Intelligence" },

  // Config
  { id: "integrations", label: "Integrations", path: "integrations",  icon: Plug,          group: "Configure" },
  { id: "roles",        label: "Roles",        path: "settings/roles",icon: Shield,        group: "Configure" },
];

export const JBJ_CRM_GROUPS = Array.from(new Set(JBJ_CRM_MODULES.map((m) => m.group)));

export const COLUMNS_BY_ZOHO: Record<ZohoModuleId, { key: string; label: string }[]> = {
  Leads: [
    { key: "Full_Name", label: "Name" }, { key: "Company", label: "Company" },
    { key: "Email", label: "Email" }, { key: "Phone", label: "Phone" },
    { key: "Lead_Status", label: "Status" }, { key: "Lead_Source", label: "Source" },
  ],
  Contacts: [
    { key: "Full_Name", label: "Name" }, { key: "Account_Name", label: "Account" },
    { key: "Email", label: "Email" }, { key: "Phone", label: "Phone" }, { key: "Title", label: "Title" },
  ],
  Accounts: [
    { key: "Account_Name", label: "Account" }, { key: "Industry", label: "Industry" },
    { key: "Account_Type", label: "Type" }, { key: "Phone", label: "Phone" }, { key: "Website", label: "Website" },
  ],
  Deals: [
    { key: "Deal_Name", label: "Deal" }, { key: "Account_Name", label: "Account" },
    { key: "Stage", label: "Stage" }, { key: "Amount", label: "Amount" },
    { key: "Probability", label: "Prob %" }, { key: "Closing_Date", label: "Close Date" },
  ],
  Tasks: [
    { key: "Subject", label: "Subject" }, { key: "Status", label: "Status" },
    { key: "Priority", label: "Priority" }, { key: "Due_Date", label: "Due" },
  ],
  Cases: [
    { key: "Subject", label: "Subject" }, { key: "Status", label: "Status" },
    { key: "Priority", label: "Priority" }, { key: "Account_Name", label: "Account" }, { key: "Case_Origin", label: "Origin" },
  ],
  Products: [
    { key: "Product_Name", label: "Product" }, { key: "Product_Code", label: "Code" },
    { key: "Product_Category", label: "Category" }, { key: "Unit_Price", label: "Unit Price" }, { key: "Qty_in_Stock", label: "Stock" },
  ],
  Quotes: [
    { key: "Subject", label: "Subject" }, { key: "Quote_Stage", label: "Stage" },
    { key: "Grand_Total", label: "Total" }, { key: "Account_Name", label: "Account" }, { key: "Valid_Till", label: "Valid Till" },
  ],
  Invoices: [
    { key: "Subject", label: "Subject" }, { key: "Status", label: "Status" },
    { key: "Grand_Total", label: "Total" }, { key: "Account_Name", label: "Account" }, { key: "Due_Date", label: "Due" },
  ],
};

/** Mirror cache — every successful Zoho fetch is stashed here so data survives disconnect. */
const MIRROR_PREFIX = "jbj_crm_mirror::";
export function readMirror(module: ZohoModuleId, page: number) {
  try {
    const raw = localStorage.getItem(`${MIRROR_PREFIX}${module}::${page}`);
    return raw ? JSON.parse(raw) as { data: Record<string, unknown>[]; info: any; ts: number } : null;
  } catch { return null; }
}
export function writeMirror(module: ZohoModuleId, page: number, payload: { data: Record<string, unknown>[]; info: any }) {
  try {
    localStorage.setItem(`${MIRROR_PREFIX}${module}::${page}`, JSON.stringify({ ...payload, ts: Date.now() }));
  } catch { /* quota */ }
}
