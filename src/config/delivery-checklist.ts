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
export const DELIVERY_REQUIREMENTS: DeliveryRequirement[] = [
  // ----------------------------
  // Founder’s Assistant (Olivia)
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
    evidence: ["src/components/founders-assistant/FoundersChatPanel.tsx"],
  },
  {
    id: "fa_chat_conversational",
    scope: "founders_assistant",
    title: "Conversational chat UI",
    requirement: "Chat behaves like a normal conversational interface (not command-only).",
    status: "partial",
    evidence: [
      "src/components/founders-assistant/FoundersChatPanel.tsx (UI implemented)",
      "Supabase function 'executive-assistant' is invoked, but command parsing/execution is not guaranteed.",
    ],
    notes:
      "The UI is conversational, but actual 'execute actions' behavior depends on backend function and is not implemented for all commands.",
  },
  {
    id: "fa_slash_commands_execution",
    scope: "founders_assistant",
    title: "Slash commands execute actions",
    requirement:
      "Commands starting with / must execute tasks (e.g., /schedule, /email, /whatsapp, /report).",
    status: "missing",
    evidence: [
      "src/components/founders-assistant/FoundersChatPanel.tsx (shows command suggestions, but does not implement command execution client-side)",
    ],
  },
  {
    id: "fa_mentions_dropdown",
    scope: "founders_assistant",
    title: "@mention dropdown",
    requirement:
      "Typing @ triggers inline dropdown to select employee/AI; mentions highlight in yellow.",
    status: "partial",
    evidence: [
      "src/components/founders-assistant/FoundersChatPanel.tsx (dropdown + mention badges exist)",
    ],
    notes: "Highlight is present on mention badges; per-message bubble highlighting rules may still need refinement.",
  },
  {
    id: "fa_uploads_no_limit",
    scope: "founders_assistant",
    title: "File uploads (no size limit)",
    requirement:
      "Support uploads (PDF/DOC/JPG/MP4/etc.) without file size limit in chat.",
    status: "missing",
    evidence: [
      "src/components/founders-assistant/FoundersChatPanel.tsx (upload handler is a 'coming soon' toast)",
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
    status: "missing",
    notes: "Unread counts exist globally, but not by per-channel UI in Founder chat.",
  },
  {
    id: "fa_activity_center_replaces_placeholder",
    scope: "founders_assistant",
    title: "Activity Center card replaces placeholder",
    requirement:
      "Remove 'No Activities Yet' placeholders and replace with a clickable 'Activity Center' card.",
    status: "partial",
    evidence: ["src/components/founders-assistant/FoundersActivityCenter.tsx"],
    notes:
      "Activity Center exists, but empty state still shows 'No activities found' instead of a 'go to Activity Center' card in other panels.",
  },
  {
    id: "fa_ai_tools_real_integrations",
    scope: "integrations",
    title: "AI Tools panel truly executes tools",
    requirement:
      "AI Tools must be real integrations, not simulated UI toasts.",
    status: "missing",
    evidence: ["src/components/founders-assistant/FoundersAIToolsPanel.tsx (simulated execution)"]
  },
  {
    id: "fa_hot_leads_personal_only",
    scope: "founders_assistant",
    title: "Hot leads are user-specific",
    requirement: "Each user sees only their own hot leads; Founder sees only hers.",
    status: "missing",
    evidence: [
      "src/components/founders-assistant/FoundersHotLeadsPanel.tsx (filters vip=true but not by assigned user)",
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
      "src/components/founders-assistant/FoundersHotLeadsPanel.tsx (shows urgency UI, but no reminder/reassign automation)",
    ],
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
      "Messages are currently in-memory (INITIAL_MESSAGES) and not saved to the backend.",
  },
  {
    id: "crm_unread_counts_per_channel",
    scope: "crm",
    title: "Unread per channel",
    requirement: "Each CRM channel shows unread count.",
    status: "missing",
    evidence: ["src/components/crm/CRMCommunicationPanel.tsx (Channel.unread exists but is not updated/used)"]
  },
  {
    id: "employees_hub_brand_portraits",
    scope: "employees_hub",
    title: "Employees Hub uses official team portraits",
    requirement:
      "Employees/AI staff portraits should come from src/config/team-members.ts and match brand identity.",
    status: "missing",
    evidence: [
      "src/components/crm/EmployeesHub.tsx (uses local TEAM_MEMBERS + SAMPLE_BROKERS instead of team-members config)",
    ],
  },
  {
    id: "employees_hub_actions_logged",
    scope: "employees_hub",
    title: "CRM action buttons log to timeline",
    requirement:
      "WhatsApp/Email/Call/Video actions log to lead timeline with transcript/status.",
    status: "missing",
    notes:
      "Buttons exist in multiple places, but lead-timeline logging for each action is not implemented consistently.",
  },
  {
    id: "crm_my_assistant_identity_olivia",
    scope: "crm",
    title: "CRM 'My Assistant' uses Olivia identity",
    requirement:
      "Default assistant must be Olivia AI with custom portrait (no 'No Assistant Found' state).",
    status: "done",
    evidence: [
      "src/pages/CRM.tsx (My Assistant button opens assistant panel)",
      "src/components/crm/CRMAssistantPanel.tsx (now uses Olivia Reynolds with official team portrait)",
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
    status: "missing",
  },
  {
    id: "integrations_email_sending",
    scope: "integrations",
    title: "Email sending integration",
    requirement: "Send emails via provider (not only mailto links).",
    status: "missing",
  },
  {
    id: "integrations_video_meet_real",
    scope: "integrations",
    title: "JBJ Video Meet real integration",
    requirement:
      "Auto-create & test calls, stable meetings (not simulated link generation only).",
    status: "partial",
    evidence: ["src/components/founders-assistant/FoundersVideoMeetPanel.tsx (simulated creation)"]
  },
  {
    id: "security_roles_and_scope",
    scope: "security",
    title: "Role-based access scopes",
    requirement:
      "Founder full access; department heads limited; employees restricted to department data.",
    status: "needs_verification",
    notes:
      "Some RLS exists in backend schema, but full role-based UI enforcement needs review across all features.",
  },
];
