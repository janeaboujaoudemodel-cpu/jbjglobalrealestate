// Passkey sign-in — step 1: return authentication options (usernameless).
// Public endpoint.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
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
