// Passkey enrollment — step 1: return WebAuthn registration options.
// Requires an authenticated user (they must be signed in to register a passkey).

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors-utils.ts';
import { generateRegistrationOptions } from 'npm:@simplewebauthn/server@13';

const RP_NAME = 'JBJ Global Real Estate';

function rpIdFromOrigin(origin: string | null): string {
  if (!origin) return 'localhost';
  try {
    return new URL(origin).hostname;
  } catch {
    return 'localhost';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: cErr } = await supabase.auth.getClaims(token);
  if (cErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId: string = claims.claims.sub;
  const email: string = claims.claims.email ?? 'user@jbj.ae';
  const rpID = rpIdFromOrigin(req.headers.get('origin'));

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Exclude any credentials already registered for this user.
  const { data: existing } = await admin
    .from('user_passkeys')
    .select('credential_id, transports')
    .eq('user_id', userId);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: email,
    userID: new TextEncoder().encode(userId),
    attestationType: 'none',
    excludeCredentials: (existing ?? []).map((c) => ({
      id: c.credential_id,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'preferred',
    },
    preferredAuthenticatorType: 'localDevice',
  });

  // Persist challenge (5 min TTL via default).
  await admin.from('webauthn_challenges').insert({
    challenge: options.challenge,
    user_id: userId,
    kind: 'registration',
  });

  return new Response(JSON.stringify(options), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
