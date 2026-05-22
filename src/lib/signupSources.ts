import { supabase } from '@/integrations/supabase/client';

// Canonical source taxonomy — keep in sync with supabase/functions/register-role-pick/index.ts
export const SIGNUP_SOURCES = {
  MODE_PICKER: 'mode_picker',
  HOMEPAGE_ROLE_CARD: 'homepage_role_card',
  JOIN_COMMUNITY_BUYER: 'join_community_buyer',
  JOIN_COMMUNITY_BROKER: 'join_community_broker',
  JOIN_COMMUNITY_VISITOR: 'join_community_visitor',
  JOIN_COMMUNITY_INVESTOR: 'join_community_investor',
  JOIN_COMMUNITY_DEVELOPER: 'join_community_developer',
  PROPERTY_INQUIRY: 'property_inquiry',
  FOOTER_CTA: 'footer_cta',
  AUTH_SIGNUP: 'auth_signup',
} as const;

export const SIGNUP_SOURCE_LABELS: Record<string, string> = {
  mode_picker: 'Mode Picker (Header)',
  homepage_role_card: 'Homepage Role Card',
  join_community_buyer: 'Join Our Community — Buyer',
  join_community_broker: 'Join Our Community — Broker',
  join_community_visitor: 'Join Our Community — Visitor',
  join_community_investor: 'Join Our Community — Investor',
  join_community_developer: 'Join Our Community — Developer',
  property_inquiry: 'Property Inquiry',
  footer_cta: 'Footer CTA',
  auth_signup: 'Auth Signup',
};

export type SignupSource = typeof SIGNUP_SOURCES[keyof typeof SIGNUP_SOURCES];

export interface RegisterRolePickInput {
  source: SignupSource | string;
  role?: string;
  email?: string;
  fullName?: string;
  propertyName?: string;
}

/**
 * Fire-and-forget registration of a role pick.
 * - Always appends an event (drives source counters).
 * - If user is authenticated, upserts profile (no duplicates).
 * - Safe to call from anonymous users (event still logged).
 */
export async function registerRolePick(input: RegisterRolePickInput): Promise<void> {
  try {
    await supabase.functions.invoke('register-role-pick', {
      body: {
        ...input,
        pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      },
    });
  } catch (err) {
    // Never block UX on tracking failure
    console.warn('[signup-source] tracking failed', err);
  }
}
