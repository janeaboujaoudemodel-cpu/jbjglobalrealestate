// Passkey sign-in — step 1: return authentication options (usernameless).
// Public endpoint.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors-utils.ts';
import { generateAuthenticationOptions } from 'npm:@simplewebauthn/server@13';

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

  const rpID = rpIdFromOrigin(req.headers.get('origin'));

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { count, error: countError } = await admin
    .from('user_passkeys')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    return new Response(JSON.stringify({ error: 'Passkey service unavailable' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!count) {
    return new Response(JSON.stringify({ error: 'No passkeys are set up yet' }), {
      status: 409,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: [], // usernameless / discoverable-credential flow
  });

  await admin.from('webauthn_challenges').insert({
    challenge: options.challenge,
    user_id: null,
    kind: 'authentication',
  });

  return new Response(JSON.stringify(options), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
