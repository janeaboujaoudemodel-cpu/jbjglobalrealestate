// Passkey enrollment — step 2: verify the attestation and store the credential.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { verifyRegistrationResponse } from 'npm:@simplewebauthn/server@13';
import { z } from 'npm:zod@3';

const BodySchema = z.object({
  response: z.any(),
  deviceLabel: z.string().max(120).optional(),
});

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

  const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const { response, deviceLabel } = parsed.data;

  const origin = req.headers.get('origin') ?? '';
  const rpID = rpIdFromOrigin(origin);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Latest unexpired challenge for this user.
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('id, challenge')
    .eq('user_id', userId)
    .eq('kind', 'registration')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!challengeRow) {
    return new Response(JSON.stringify({ error: 'Challenge expired or not found' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return new Response(JSON.stringify({ error: 'Verification failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const info = verification.registrationInfo;
  const cred = info.credential;

  const { error: insErr } = await admin.from('user_passkeys').insert({
    user_id: userId,
    credential_id: cred.id,
    public_key: cred.publicKey,
    counter: cred.counter,
    transports: cred.transports ?? [],
    device_label: deviceLabel ?? 'Passkey',
    aaguid: info.aaguid ?? null,
    backed_up: info.credentialBackedUp ?? false,
  });

  // Consume the challenge.
  await admin.from('webauthn_challenges').delete().eq('id', challengeRow.id);

  if (insErr) {
    return new Response(JSON.stringify({ error: insErr.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ verified: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
