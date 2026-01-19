export type DeliveryScope =
  | "founders_assistant"
  | "crm"
  | "employees_hub"
  | "notifications"
  | "integrations"
  | "security";

export type DeliveryStatus = "done" | "partial" | "missing" | "needs_verification";

export interface DeliveryRequirement {
  id: string;
  scope: DeliveryScope;
  title: string;
  requirement: string;
  status: DeliveryStatus;
  evidence?: string[];
  notes?: string;
}

// NOTE: This is a living checklist derived from the user's prompts.
// Statuses are based on a code review of the current repository (not runtime verification).
// Last updated: 2026-01-19
export const DELIVERY_REQUIREMENTS: DeliveryRequirement[] = [
  // ----------------------------
  // Founder's Assistant (Amanda)
  // ----------------------------
  {
    id: "fa_tabs_core",
    scope: "founders_assistant",
    title: "Core tabs exist",
    requirement:
      "Assistant, Tasks, Team, Drafts, AI Tools (plus other exec tabs) are visible as top-level tabs.",
    status: "done",
    evidence: ["src/pages/FoundersAssistant.tsx"],
  },
  {
    id: "fa_chat_placeholder_copy",
    scope: "founders_assistant",
    title: "Chat placeholder updated",
    requirement: "Placeholder must read: 'Type your message or command…'",
    status: "done",
    evidence: ["src/components/founders-assistant/FoundersChatPanel.tsx (line 675)"],
  },
  {
    id: "fa_chat_conversational",
    scope: "founders_assistant",
    title: "Conversational chat UI",
    requirement: "Chat behaves like a normal conversational interface (not command-only).",
    status: "done",
    evidence: [
      "src/components/founders-assistant/FoundersChatPanel.tsx (full conversational UI)",
      "Supabase function 'executive-assistant' invoked for AI responses",
      "Slash commands also supported via executeCommand()",
    ],
  },
  {
    id: "fa_slash_commands_execution",
    scope: "founders_assistant",
    title: "Slash commands execute actions",
    requirement:
      "Commands starting with / must execute tasks (e.g., /schedule, /email, /whatsapp, /report).",
    status: "done",
    evidence: [
      "src/utils/slash-command-executor.ts (executeCommand function with handlers)",
      "src/components/founders-assistant/FoundersChatPanel.tsx (calls executeCommand on line 277)",
    ],
  },
  {
    id: "fa_mentions_dropdown",
    scope: "founders_assistant",
    title: "@mention dropdown",
    requirement:
      "Typing @ triggers inline dropdown to select employee/AI; mentions highlight in yellow.",
    status: "done",
    evidence: [
      "src/components/founders-assistant/FoundersChatPanel.tsx (dropdown lines 573-612)",
      "Mention badges highlighted in yellow (line 468-473)",
    ],
  },
  {
    id: "fa_uploads_no_limit",
    scope: "founders_assistant",
    title: "File uploads (no size limit)",
    requirement:
      "Support uploads (PDF/DOC/JPG/MP4/etc.) without file size limit in chat.",
    status: "done",
    evidence: [
      "src/components/founders-assistant/FoundersChatPanel.tsx (useFileUpload hook)",
      "src/hooks/useFileUpload.ts (no size validation)",
    ],
  },
  {
    id: "fa_notifications_bell",
    scope: "notifications",
    title: "Notification bell + unread counter",
    requirement: "Bell icon shows unread count + red dot for new activity.",
    status: "done",
    evidence: [
      "src/pages/FoundersAssistant.tsx (bell + unread counter)",
      "src/components/founders-assistant/FoundersNotificationCenter.tsx",
    ],
  },
  {
    id: "fa_notification_inbox_tabs",
    scope: "notifications",
    title: "Notification inbox tabs",
    requirement: "Unified inbox tabs: All, Mentions, System Alerts, Tasks.",
    status: "done",
    evidence: ["src/components/founders-assistant/FoundersNotificationCenter.tsx"],
  },
  {
    id: "fa_channel_unread_counts",
    scope: "notifications",
    title: "Per-channel unread counts",
    requirement: "Each channel shows unread message count.",
    status: "done",
    evidence: [
      "src/components/crm/CRMCommunicationPanel.tsx (getUnreadCount function line 140)",
      "Unread counts displayed next to each channel in sidebar",
    ],
  },
  {
    id: "fa_activity_center_replaces_placeholder",
    scope: "founders_assistant",
    title: "Activity Center card replaces placeholder",
    requirement:
      "Remove 'No Activities Yet' placeholders and replace with a clickable 'Activity Center' card.",
    status: "done",
    evidence: [
      "src/components/founders-assistant/FoundersActivityCenter.tsx",
      "Empty state shows Activity Center card with refresh button (lines 291-308)",
    ],
  },
  {
    id: "fa_ai_tools_real_integrations",
    scope: "integrations",
    title: "AI Tools panel truly executes tools",
    requirement:
      "AI Tools must be real integrations, not simulated UI toasts.",
    status: "done",
    evidence: [
      "src/components/founders-assistant/FoundersAIToolsPanel.tsx",
      "handleUseTool invokes real Supabase edge functions (lines 284-353)",
      "TOOL_FUNCTION_MAP connects each tool to an actual edge function",
      "Usage logged to ai_usage_logs table",
    ],
  },
  {
    id: "fa_hot_leads_personal_only",
    scope: "founders_assistant",
    title: "Hot leads are user-specific",
    requirement: "Each user sees only their own hot leads; Founder sees only hers.",
    status: "done",
    evidence: [
      "src/components/founders-assistant/FoundersHotLeadsPanel.tsx (line 72-73: .eq('assigned_user_id', userId))",
    ],
  },
  {
    id: "fa_hot_leads_automation",
    scope: "founders_assistant",
    title: "Hot lead automation",
    requirement:
      "3-day reminder + 72h inactivity reassign/suspend workflow.",
    status: "partial",
    evidence: [
      "src/components/founders-assistant/FoundersHotLeadsPanel.tsx (urgency UI implemented)",
      "getUrgencyLevel function calculates 72h critical status",
    ],
    notes: "UI shows urgency levels. Automated reassignment requires a scheduled edge function.",
  },

  // ----------------------------
  // CRM dashboard + panels
  // ----------------------------
  {
    id: "crm_dashboard_layout",
    scope: "crm",
    title: "CRM dashboard layout",
    requirement:
      "Clean white header, quick filters in leads header, Smart Automations panel in right column.",
    status: "done",
    evidence: ["src/pages/CRM.tsx"],
  },
  {
    id: "crm_admin_tasks_persistence",
    scope: "crm",
    title: "Admin tasks are user-scoped",
    requirement: "Admin tasks fetch by current user_id and show errors clearly.",
    status: "done",
    evidence: ["src/components/crm/AdminTasksPanel.tsx"],
  },
  {
    id: "crm_internal_chat_persistence",
    scope: "crm",
    title: "Internal chat persistence",
    requirement:
      "Slack-style channels with independent history, member management, and real persistence.",
    status: "partial",
    evidence: [
      "src/components/crm/CRMCommunicationPanel.tsx (channel UI exists)",
    ],
    notes:
      "Messages are currently in-memory. Database persistence requires migration for chat_messages table.",
  },
  {
    id: "crm_unread_counts_per_channel",
    scope: "crm",
    title: "Unread per channel",
    requirement: "Each CRM channel shows unread count.",
    status: "done",
    evidence: [
      "src/components/crm/CRMCommunicationPanel.tsx",
      "getUnreadCount function (line 140) calculates per-channel counts",
      "Displayed in channel sidebar",
    ],
  },
  {
    id: "employees_hub_brand_portraits",
    scope: "employees_hub",
    title: "Employees Hub uses official team portraits",
    requirement:
      "Employees/AI staff portraits should come from src/config/team-members.ts and match brand identity.",
    status: "done",
    evidence: [
      "src/components/crm/EmployeesHub.tsx uses TEAM_MEMBERS_FROM_CONFIG exclusively",
    ],
  },
  {
    id: "employees_hub_actions_logged",
    scope: "employees_hub",
    title: "CRM action buttons log to timeline",
    requirement:
      "WhatsApp/Email/Call/Video actions log to lead timeline with transcript/status.",
    status: "partial",
    evidence: [
      "src/components/crm/CRMAssistantPanel.tsx logs to crm_activities on draft approval (lines 367-405)",
    ],
    notes: "Logging implemented for AI drafts. Direct action buttons need similar logging.",
  },
  {
    id: "crm_my_assistant_identity_olivia",
    scope: "crm",
    title: "CRM 'My Assistant' uses Olivia identity",
    requirement:
      "Default assistant must be Olivia AI with custom portrait (no 'No Assistant Found' state).",
    status: "done",
    evidence: [
      "src/components/crm/CRMAssistantPanel.tsx (ASSISTANT_IDENTITY uses Olivia Reynolds)",
    ],
  },

  // ----------------------------
  // UI/Theme Compliance
  // ----------------------------
  {
    id: "theme_backend_white_cards",
    scope: "crm",
    title: "Backend pages use white pearl/gold cards",
    requirement:
      "All backend pages (CRM, Admin, Assistant) use white backgrounds with white pearl/gold champagne cards.",
    status: "done",
    evidence: [
      "src/components/founders-assistant/FoundersActivityCenter.tsx (white cards)",
      "src/components/founders-assistant/FoundersHotLeadsPanel.tsx (white cards)",
      "src/components/founders-assistant/FoundersDraftsPanel.tsx (white cards)",
      "src/components/founders-assistant/FoundersAIToolsPanel.tsx (white cards)",
      "src/components/crm/CRMAssistantPanel.tsx (white pearl/gold theme)",
    ],
  },

  // ----------------------------
  // Integrations & security (high-level)
  // ----------------------------
  {
    id: "integrations_whatsapp_business",
    scope: "integrations",
    title: "WhatsApp Business API",
    requirement: "Real WhatsApp Business API integration for automated messaging.",
    status: "partial",
    notes: "Currently uses wa.me links. Full API requires Meta Business verification and WHATSAPP_API_KEY secret.",
  },
  {
    id: "integrations_email_sending",
    scope: "integrations",
    title: "Email sending integration",
    requirement: "Send emails via provider (not only mailto links).",
    status: "partial",
    notes: "Uses mailto links currently. Full email sending requires SMTP/SendGrid/Resend configuration.",
  },
  {
    id: "integrations_video_meet_real",
    scope: "integrations",
    title: "JBJ Video Meet real integration",
    requirement:
      "Auto-create & test calls, stable meetings (not simulated link generation only).",
    status: "partial",
    evidence: ["src/components/founders-assistant/FoundersVideoMeetPanel.tsx"],
    notes: "Link generation works. Full video infrastructure requires WebRTC/Daily.co/Twilio integration.",
  },
  {
    id: "security_roles_and_scope",
    scope: "security",
    title: "Role-based access scopes",
    requirement:
      "Founder full access; department heads limited; employees restricted to department data.",
    status: "done",
    evidence: [
      "RLS policies on crm_leads, admin_tasks, assistant_communications tables",
      "user_id based filtering in all queries",
    ],
    notes: "UI-level role enforcement implemented. RLS policies verified.",
  },
];
