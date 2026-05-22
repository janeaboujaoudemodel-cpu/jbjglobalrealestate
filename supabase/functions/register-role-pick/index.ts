import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Canonical source taxonomy — keep in sync with src/lib/signupSources.ts
const SOURCE_LABELS: Record<string, string> = {
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

interface Payload {
  source: string;
  role?: string;
  email?: string;
  fullName?: string;
  pagePath?: string;
  referrer?: string;
  propertyName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body: Payload = await req.json();
    const source = String(body.source || '').trim();
    if (!source || !SOURCE_LABELS[source]) {
      return new Response(JSON.stringify({ error: 'Invalid source' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const role = body.role ? String(body.role).toLowerCase().trim() : null;
    const email = body.email ? String(body.email).toLowerCase().trim() : null;
    const fullName = body.fullName ? String(body.fullName).trim().slice(0, 200) : null;
    const pagePath = body.pagePath ? String(body.pagePath).slice(0, 500) : null;
    const referrer = body.referrer ? String(body.referrer).slice(0, 500) : null;
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) ?? null;

    let label = SOURCE_LABELS[source];
    if (source === 'property_inquiry' && body.propertyName) {
      label = `Property Inquiry — ${String(body.propertyName).slice(0, 120)}`;
    }

    // Try to identify the authenticated user (optional)
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const anon = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data } = await anon.auth.getUser();
      userId = data?.user?.id ?? null;
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1) Always append an event (drives the counters)
    const { error: evErr } = await admin.from('signup_source_events').insert({
      user_id: userId,
      email,
      signup_source: source,
      signup_source_label: label,
      picked_role: role,
      page_path: pagePath,
      referrer,
      user_agent: userAgent,
    });
    if (evErr) throw evErr;

    // 2) Upsert profile if authenticated (dedupes by user_id)
    if (userId) {
      const { data: existing } = await admin
        .from('profiles')
        .select('id, first_signup_source')
        .eq('id', userId)
        .maybeSingle();

      const update: Record<string, unknown> = {
        last_signup_source: source,
        picked_role: role,
        picked_role_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (fullName) update.full_name = fullName;

      if (existing) {
        if (!existing.first_signup_source) {
          update.first_signup_source = source;
          update.signup_source_label = label;
        }
        await admin.from('profiles').update(update).eq('id', userId);
      } else {
        await admin.from('profiles').insert({
          id: userId,
          email,
          full_name: fullName,
          first_signup_source: source,
          signup_source_label: label,
          ...update,
        });
      }
    }

    return new Response(
      JSON.stringify({ ok: true, source, label, userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('register-role-pick error', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
