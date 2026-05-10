/**
 * Zero Trust Permission Matrix
 * 
 * Defines access rules for every module across role tiers.
 * This is the single source of truth for platform permissions.
 * 
 * R = Read, W = Write, - = No Access
 * * = Action-gated (requires auth for specific actions)
 * † = Sandboxed (limited write within own scope)
 * ‡ = Requires re-authentication token
 */

export type AccessLevel = "RW" | "R" | "R*" | "RW†" | "RW‡" | "-";

export interface ModulePermission {
  module: string;
  category: "public" | "tools" | "crm" | "admin" | "security" | "destructive";
  public: AccessLevel;
  authenticated: AccessLevel;
  broker: AccessLevel;
  developer: AccessLevel;
  owner: AccessLevel;
  description: string;
  backendEnforced: boolean;
}

export const PERMISSION_MATRIX: ModulePermission[] = [
  // ── Public-facing ──
  {
    module: "Home / Properties",
    category: "public",
    public: "R",
    authenticated: "R",
    broker: "R",
    developer: "R",
    owner: "RW",
    description: "Property listings, project details, communities",
    backendEnforced: true,
  },
  {
    module: "Developer Portal",
    category: "public",
    public: "-",
    authenticated: "R",
    broker: "-",
    developer: "RW†",
    owner: "RW",
    description: "Developer submissions (sandboxed to own projects)",
    backendEnforced: true,
  },
  {
    module: "Guides / Books",
    category: "public",
    public: "R",
    authenticated: "R",
    broker: "R",
    developer: "R",
    owner: "RW",
    description: "Area guides, market guides, downloadable books",
    backendEnforced: true,
  },

  // ── AI & Tools ──
  {
    module: "AI Hub / Tools",
    category: "tools",
    public: "-",
    authenticated: "R*",
    broker: "R",
    developer: "-",
    owner: "RW",
    description: "AI tools (action-gated for free users)",
    backendEnforced: true,
  },
  {
    module: "Design Studio",
    category: "tools",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Brand design and creative tools",
    backendEnforced: true,
  },

  // ── CRM ──
  {
    module: "CRM",
    category: "crm",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Lead management, tasks, calendar, notes",
    backendEnforced: true,
  },
  {
    module: "CRM Reports",
    category: "crm",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "generate-crm-report edge function",
    backendEnforced: true,
  },

  // ── Admin ──
  {
    module: "Listing Admin",
    category: "admin",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Import queue, listing approval, bulk operations",
    backendEnforced: true,
  },
  {
    module: "Marketing Hub",
    category: "admin",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Email campaigns, brand messaging",
    backendEnforced: true,
  },
  {
    module: "Moderation Queue",
    category: "admin",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Developer submission moderation",
    backendEnforced: true,
  },
  {
    module: "Send Admin Message",
    category: "admin",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "send-admin-message edge function (branded emails)",
    backendEnforced: true,
  },

  // ── Security ──
  {
    module: "API Security Dashboard",
    category: "security",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Rate limit monitoring, auth failures",
    backendEnforced: true,
  },
  {
    module: "Incident Readiness",
    category: "security",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Backup status, security checklists, deployments",
    backendEnforced: true,
  },
  {
    module: "Zero Trust Audit",
    category: "security",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Permission matrix, denied requests, role integrity",
    backendEnforced: true,
  },
  {
    module: "Encryption Audit",
    category: "security",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "PII encryption status and compliance",
    backendEnforced: true,
  },

  // ── Destructive ──
  {
    module: "Wipe & Rebuild",
    category: "destructive",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW‡",
    description: "Full DB wipe — requires re-authentication token",
    backendEnforced: true,
  },
  {
    module: "Bulk Approve Imports",
    category: "destructive",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "Approve pending imports into live data",
    backendEnforced: true,
  },

  // ── Data Sync (Owner-only) ──
  {
    module: "Data Sync (Provident/Reelly)",
    category: "admin",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "provident-areas-sync, provident-enrich, reelly-auto-enrich, sync-developer-data",
    backendEnforced: true,
  },
  {
    module: "Repair Live Projects",
    category: "admin",
    public: "-",
    authenticated: "-",
    broker: "-",
    developer: "-",
    owner: "RW",
    description: "repair-live-projects-batch edge function",
    backendEnforced: true,
  },
];

/** Edge functions and their auth status */
export interface EdgeFunctionAuthStatus {
  name: string;
  authLevel: "owner-only" | "authenticated" | "public" | "webhook";
  middleware: "requireOwnerAuth" | "getClaims" | "getUser" | "none" | "signature";
  risk: "critical" | "high" | "medium" | "low";
}

export const EDGE_FUNCTION_AUTH_REGISTRY: EdgeFunctionAuthStatus[] = [
  { name: "wipe-and-rebuild", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "critical" },
  { name: "bulk-approve-imports", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "critical" },
  { name: "send-admin-message", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "high" },
  { name: "repair-live-projects-batch", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "high" },
  { name: "provident-areas-sync", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "medium" },
  { name: "provident-enrich-projects", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "medium" },
  { name: "reelly-auto-enrich", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "medium" },
  { name: "sync-developer-data", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "medium" },
  { name: "handover-alerts", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "low" },
  { name: "generate-crm-report", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "high" },
  { name: "run-security-checklist", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "medium" },
  { name: "create-config-snapshot", authLevel: "owner-only", middleware: "requireOwnerAuth", risk: "medium" },
  { name: "verify-owner", authLevel: "authenticated", middleware: "getClaims", risk: "low" },
  { name: "capture-lead", authLevel: "public", middleware: "none", risk: "low" },
  { name: "ai-chat-support", authLevel: "public", middleware: "none", risk: "low" },
  { name: "send-welcome-email", authLevel: "public", middleware: "none", risk: "low" },
  { name: "send-inquiry-email", authLevel: "public", middleware: "none", risk: "low" },
  { name: "resend-webhook", authLevel: "webhook", middleware: "signature", risk: "low" },
  { name: "whatsapp-webhook", authLevel: "webhook", middleware: "signature", risk: "low" },
];

export const ROLE_LABELS: Record<string, string> = {
  public: "Public (Visitor)",
  authenticated: "Authenticated",
  broker: "Broker",
  developer: "Developer",
  owner: "Owner",
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, { label: string; color: string }> = {
  "RW": { label: "Read/Write", color: "text-green-400" },
  "R": { label: "Read Only", color: "text-blue-400" },
  "R*": { label: "Action-Gated", color: "text-[#1A1A1A]" },
  "RW†": { label: "Sandboxed", color: "text-purple-400" },
  "RW‡": { label: "Re-auth Required", color: "text-red-400" },
  "-": { label: "No Access", color: "text-[#1A1A1A]/70" },
};
