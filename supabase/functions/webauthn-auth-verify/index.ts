// Passkey sign-in — step 2: verify the assertion and mint a Supabase session
// for the matched user. Public endpoint.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { verifyAuthenticationResponse } from 'npm:@simplewebauthn/server@13';
import { z } from 'npm:zod@3';

const BodySchema = z.object({ response: z.any() });

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

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const { response } = parsed.data;

  const origin = req.headers.get('origin') ?? '';
  const rpID = rpIdFromOrigin(origin);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Look up the credential.
  const credentialId: string | undefined = response?.id;
  if (!credentialId) {
    return new Response(JSON.stringify({ error: 'Missing credential id' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: cred } = await admin
    .from('user_passkeys')
    .select('*')
    .eq('credential_id', credentialId)
    .maybeSingle();

  if (!cred) {
    return new Response(JSON.stringify({ error: 'Unknown passkey' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Newest unexpired authentication challenge.
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('id, challenge')
    .eq('kind', 'authentication')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challengeRow) {
    return new Response(JSON.stringify({ error: 'Challenge expired' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credential_id,
        publicKey: cred.public_key as Uint8Array,
        counter: Number(cred.counter),
        transports: (cred.transports ?? []) as AuthenticatorTransport[],
      },
      requireUserVerification: false,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!verification.verified) {
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Monotonic counter check.
  const newCounter = verification.authenticationInfo.newCounter;
  if (newCounter < Number(cred.counter)) {
    // Suspected cloned credential — revoke it.
    await admin.from('user_passkeys').delete().eq('id', cred.id);
    return new Response(JSON.stringify({ error: 'Credential revoked' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await admin
    .from('user_passkeys')
    .update({ counter: newCounter, last_used_at: new Date().toISOString() })
    .eq('id', cred.id);

  await admin.from('webauthn_challenges').delete().eq('id', challengeRow.id);

  // Mint a session for this user.
  const { data: userRes, error: uErr } = await admin.auth.admin.getUserById(cred.user_id);
  if (uErr || !userRes?.user?.email) {
    return new Response(JSON.stringify({ error: 'User not found' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Generate a magic link, then verify it server-side to obtain tokens.
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: userRes.user.email,
  });
  if (linkErr || !link?.properties?.hashed_token) {
    return new Response(JSON.stringify({ error: 'Session mint failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const anon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
  );
  const { data: verified, error: vErr } = await anon.auth.verifyOtp({
    type: 'magiclink',
    token_hash: link.properties.hashed_token,
  });
  if (vErr || !verified?.session) {
    return new Response(JSON.stringify({ error: 'Session verify failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({
      access_token: verified.session.access_token,
      refresh_token: verified.session.refresh_token,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
