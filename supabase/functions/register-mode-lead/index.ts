// Edge Function: register-mode-lead
// Upserts a CRM lead in `crm_leads` whenever a logged-in user picks or
// changes their platform mode (investor / broker / developer).
// Idempotent on (owner_user_id, source='self_registration') — switching
// mode updates the same row's contact_type instead of creating duplicates.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type Mode = 'investor' | 'broker' | 'investor_broker' | 'developer';

const ALLOWED_MODES: Mode[] = ['investor', 'broker', 'investor_broker', 'developer'];

function modeToContactType(mode: Mode): 'investor' | 'broker' | 'developer' {
  // investor_broker is logged primarily as broker (a closer commercial signal),
  // and is also tagged on the lead so admins can filter by either category.
  if (mode === 'broker' || mode === 'investor_broker') return 'broker';
  if (mode === 'developer') return 'developer';
  return 'investor';
}

function modeToIntent(mode: Mode): string {
  // Must satisfy crm_leads_lead_intent_check:
  // ('buy','sell','rent_lease','broker_registration','partner_services')
  if (mode === 'broker' || mode === 'investor_broker') return 'broker_registration';
  if (mode === 'developer') return 'partner_services';
  return 'buy';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the caller and resolve their user id
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Parse + validate body
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode as Mode | undefined;
    if (!mode || !ALLOWED_MODES.includes(mode)) {
      return new Response(JSON.stringify({ error: 'Invalid mode' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Service-role client to bypass RLS for the upsert
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Resolve user identity (email + name + phone) from auth + profile
    const { data: userResp } = await admin.auth.admin.getUserById(userId);
    const authUser = userResp?.user;
    const email = authUser?.email?.toLowerCase().trim() ?? null;
    const phoneRaw = authUser?.phone ?? (authUser?.user_metadata?.phone as string | undefined) ?? null;
    const metaName =
      (authUser?.user_metadata?.full_name as string | undefined) ||
      (authUser?.user_metadata?.name as string | undefined) ||
      null;

    let fullName: string | null = metaName;
    // crm_leads.full_name is NOT NULL — always fall back to email/local-part/'New User'
    const ensureName = () =>
      fullName ||
      (email ? email.split('@')[0] : null) ||
      'New User';
    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('full_name, display_name, phone')
        .eq('user_id', userId)
        .maybeSingle();
      if (profile) {
        fullName = fullName || profile.full_name || profile.display_name || null;
      }
    } catch {
      // profiles table not strictly required
    }

    const contactType = modeToContactType(mode);
    const intent = modeToIntent(mode);
    const tags = Array.from(
      new Set([
        mode,
        contactType,
        ...(mode === 'investor_broker' ? ['investor'] : []),
        'self-registered',
      ]),
    );

    // Look up existing self-registration lead for this user
    const { data: existing, error: lookupErr } = await admin
      .from('crm_leads')
      .select('id, contact_type, tags')
      .eq('owner_user_id', userId)
      .eq('source', 'self_registration')
      .is('deleted_at', null)
      .maybeSingle();

    if (lookupErr) {
      console.error('[register-mode-lead] lookup error', lookupErr);
    }

    let leadId: string;

    if (existing?.id) {
      const mergedTags = Array.from(new Set([...(existing.tags ?? []), ...tags]));
      const { error: updErr } = await admin
        .from('crm_leads')
        .update({
          contact_type: contactType,
          lead_intent: intent,
          tags: mergedTags,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (updErr) {
        console.error('[register-mode-lead] update error', updErr);
        return new Response(JSON.stringify({ error: 'Failed to update lead' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      leadId = existing.id;
    } else {
      const { data: inserted, error: insErr } = await admin
        .from('crm_leads')
        .insert({
          owner_type: 'company_assigned',
          owner_user_id: userId,
          created_by_user_id: userId,
          contact_type: contactType,
          full_name: ensureName(),
          email_lower: email,
          email_normalized: email,
          phone_e164: phoneRaw,
          phone_raw: phoneRaw,
          source: 'self_registration',
          lead_source_type: 'mode_selection',
          pipeline_stage: 'new',
          lead_intent: intent,
          tags,
          notes: 'Auto-created when user selected their platform role.',
        })
        .select('id')
        .single();
      if (insErr || !inserted) {
        console.error('[register-mode-lead] insert error', insErr);
        return new Response(JSON.stringify({ error: 'Failed to create lead' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      leadId = inserted.id;
    }

    // Best-effort audit log; never fail the request on this.
    try {
      await admin.from('crm_action_logs').insert({
        actor_user_id: userId,
        target_lead_id: leadId,
        action: existing?.id ? 'mode_changed' : 'mode_registered',
        metadata: { mode, contact_type: contactType },
      });
    } catch (e) {
      // schema variations across environments — non-fatal
      console.warn('[register-mode-lead] audit log skipped', e);
    }

    return new Response(
      JSON.stringify({ ok: true, lead_id: leadId, contact_type: contactType }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[register-mode-lead] fatal', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
