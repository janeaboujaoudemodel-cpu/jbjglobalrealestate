/**
 * Multi-tenancy primitives shared across the app.
 * Mirror of the DB enums in `public.org_role` / `public.org_permission`.
 */

export type OrgRole = "owner" | "admin" | "manager" | "member" | "viewer";
export type TeamRole = "lead" | "member" | "viewer";

export type OrgPermission =
  | "org.manage"
  | "org.billing.manage"
  | "members.manage"
  | "teams.manage"
  | "invitations.manage"
  | "crm.leads.read"
  | "crm.leads.write"
  | "crm.leads.delete"
  | "crm.contacts.read"
  | "crm.contacts.write"
  | "crm.accounts.read"
  | "crm.accounts.write"
  | "crm.deals.read"
  | "crm.deals.write"
  | "crm.tasks.read"
  | "crm.tasks.write"
  | "crm.reports.read"
  | "crm.analytics.read"
  | "crm.settings.manage"
  | "crm.export";

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMembership {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  joined_at: string;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  invited_by: string | null;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  updated_at: string;
}

export const ORG_ROLE_RANK: Record<OrgRole, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  member: 2,
  viewer: 1,
};
