import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerRegistrationStatus {
  registered: boolean;
  verified: boolean;
  partnershipType?: string | null;
  partnershipStage?: string | null;
  referralStatus?: string | null;
}

/**
 * Detects whether the current authenticated user has registered as a partner.
 * Sources: `partnership_applications.user_id` and `referral_partners.user_id`.
 * Returns `registered=true` when at least one record exists, and `verified=true`
 * only when the record is in an approved/active state.
 */
export function usePartnerRegistration() {
  const { user } = useAuth();

  return useQuery<PartnerRegistrationStatus>({
    queryKey: ["partner-registration", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const empty: PartnerRegistrationStatus = { registered: false, verified: false };
      if (!user?.id) return empty;

      const [apps, refs] = await Promise.all([
        supabase
          .from("partnership_applications")
          .select("partnership_type, stage")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("referral_partners")
          .select("partner_type, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const app = apps.data ?? null;
      const ref = refs.data ?? null;
      const registered = !!(app || ref);
      const appApproved = app?.stage === "ceo_approval";
      const refApproved = ref?.status === "approved";
      const verified = appApproved || refApproved;

      return {
        registered,
        verified,
        partnershipType: app?.partnership_type ?? ref?.partner_type ?? null,
        partnershipStage: (app?.stage as string | undefined) ?? null,
        referralStatus: ref?.status ?? null,
      };
    },
  });
}
