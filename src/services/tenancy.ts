/**
 * Client wrapper around the multi-tenancy schema.
 * Uses RLS-backed tables directly — no service role required.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  OrgPermission,
  OrgRole,
  Organization,
  OrganizationInvitation,
  OrganizationMembership,
} from "@/types/tenancy";

export const tenancy = {
  async listMyOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Organization[];
  },

  async getCurrentOrgId(): Promise<string | null> {
    const { data, error } = await supabase
      .from("user_current_org")
      .select("organization_id")
      .maybeSingle();
    if (error) throw error;
    return data?.organization_id ?? null;
  },

  async setCurrentOrg(orgId: string): Promise<void> {
    const { data: session } = await supabase.auth.getUser();
    const uid = session.user?.id;
    if (!uid) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("user_current_org")
      .upsert({ user_id: uid, organization_id: orgId, updated_at: new Date().toISOString() });
    if (error) throw error;
  },

  async createOrganization(input: { name: string; slug?: string | null }): Promise<Organization> {
    const { data: session } = await supabase.auth.getUser();
    const uid = session.user?.id;
    if (!uid) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: input.name, slug: input.slug ?? null, owner_id: uid })
      .select("*")
      .single();
    if (error) throw error;
    return data as Organization;
  },

  async listMembers(orgId: string): Promise<OrganizationMembership[]> {
    const { data, error } = await supabase
      .from("organization_members")
      .select("organization_id, user_id, role, joined_at")
      .eq("organization_id", orgId);
    if (error) throw error;
    return (data ?? []) as OrganizationMembership[];
  },

  async updateMemberRole(orgId: string, userId: string, role: OrgRole): Promise<void> {
    const { error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("organization_id", orgId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  async removeMember(orgId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", orgId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  async invite(orgId: string, email: string, role: OrgRole = "member"): Promise<OrganizationInvitation> {
    const { data, error } = await supabase
      .from("organization_invitations")
      .insert({ organization_id: orgId, email, role })
      .select("*")
      .single();
    if (error) throw error;
    return data as OrganizationInvitation;
  },

  async listInvitations(orgId: string): Promise<OrganizationInvitation[]> {
    const { data, error } = await supabase
      .from("organization_invitations")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as OrganizationInvitation[];
  },

  async revokeInvitation(id: string): Promise<void> {
    const { error } = await supabase
      .from("organization_invitations")
      .update({ status: "revoked" })
      .eq("id", id);
    if (error) throw error;
  },

  // Permission helpers — call the DB security-definer functions so the
  // rules stay in a single place.
  async hasPermission(orgId: string, perm: OrgPermission): Promise<boolean> {
    const { data, error } = await supabase.rpc("has_org_permission", {
      _org: orgId,
      _perm: perm,
    });
    if (error) throw error;
    return Boolean(data);
  },

  async getMyRole(orgId: string): Promise<OrgRole | null> {
    const { data, error } = await supabase.rpc("get_org_role", { _org: orgId });
    if (error) throw error;
    return (data as OrgRole | null) ?? null;
  },
};

export type TenancyClient = typeof tenancy;
