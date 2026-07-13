import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const OWNER_BACKEND_EMAILS = [
      'janeaboujaoudenails@gmail.com',
      'janeaboujaoudemodel@gmail.com',
      'contact@janeaboujaoude.net',
      'infoo.jane@gmail.com',
    ];
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await admin.auth.getUser(token);
    const callerId = userData?.user?.id;
    const callerEmail = userData?.user?.email?.toLowerCase().trim();
    if (!callerId) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const emailAllowed = !!callerEmail && OWNER_BACKEND_EMAILS.includes(callerEmail);
    const { data: isOwner } = await admin.rpc('has_role', { _user_id: callerId, _role: 'owner' });
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!emailAllowed && !isOwner && !isAdmin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { user_id } = await req.json();
    if (!user_id || typeof user_id !== 'string') {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const [sessions, events, daily, crmProfile, baseProfile, roles, activity, preferences, authUser] = await Promise.all([
      admin.from('user_sessions').select('started_at, ended_at, duration_seconds, device_type, country, pages_visited').eq('user_id', user_id).order('started_at', { ascending: false }).limit(100),
      admin.from('user_events').select('event_time, event_name, page_path, metadata').eq('user_id', user_id).order('event_time', { ascending: false }).limit(100),
      admin.from('user_daily_activity').select('day_date, sessions_count, total_duration_seconds, total_events').eq('user_id', user_id).order('day_date', { ascending: false }).limit(90),
      admin.from('crm_user_profiles').select('*').eq('user_id', user_id).maybeSingle(),
      admin.from('profiles').select('*').eq('id', user_id).maybeSingle(),
      admin.from('user_roles').select('role').eq('user_id', user_id),
      admin.from('crm_profile_activity').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(50),
      admin.from('user_preferences').select('*').eq('user_id', user_id).maybeSingle(),
      admin.auth.admin.getUserById(user_id),
    ]);

    // Best-effort enrichment: consents, signup source trail, lead record, activity log by email
    const authEmail = authUser.data?.user?.email?.toLowerCase() || null;
    const [consents, signupEvents, leadRow, activityLog] = await Promise.all([
      admin.from('cookie_consents').select('consent_status, preferences, policy_version, consent_source, page_url, referrer, accepted_at, user_agent').eq('user_id', user_id).order('accepted_at', { ascending: false }).limit(20),
      admin.from('signup_source_events').select('signup_source, signup_source_label, picked_role, page_path, referrer, created_at').eq('user_id', user_id).order('created_at', { ascending: false }).limit(20),
      admin.from('crm_leads').select('id, pipeline_stage, tags, source, source_page, contact_type, ai_score, priority_score, last_contacted_at, created_at').eq('email_lower', authEmail || '').is('deleted_at', null).maybeSingle(),
      authEmail
        ? admin.from('user_activity_log').select('event_type, activity_type, page_path, activity_data, created_at').eq('lead_email', authEmail).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [] } as any),
    ]);

    const profile = baseProfile.data || null;
    const pref = preferences.data || null;
    const auth = authUser.data?.user || null;
    const md = auth?.user_metadata || {};
    const authFullName = md.full_name || md.name || [md.first_name, md.last_name].filter(Boolean).join(' ') || null;
    const authPhone = auth?.phone || md.phone || md.phone_number || md.mobile || md.whatsapp || null;
    const synthesizedProfile = crmProfile.data || (profile ? {
      user_id,
      category: normalizeCategory(profile.picked_role) || normalizeCategory(pref?.selected_mode) || normalizeCategory(md.category) || null,
      full_name: profile.full_name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || authFullName,
      email: profile.email || auth?.email || null,
      phone: profile.phone_number || authPhone,
      whatsapp: md.whatsapp || null,
      country: null,
      nationality: null,
      preferred_language: pref?.preferred_language || profile.language || null,
      preferred_contact_method: null,
      preferred_contact_time: null,
      services: [],
      notes: null,
      source_page: profile.first_signup_source || profile.last_signup_source || 'direct account / social sign-in',
      category_data: pref?.dashboard_config || {},
      position: null,
      company_name: null,
      years_experience: null,
      budget_min: null,
      budget_max: null,
      investment_experience: null,
      communities: [],
      status: 'profile_pending',
      _missing_signup_profile: true,
      auth_metadata: md,
    } : (auth ? {
      user_id,
      category: normalizeCategory(md.category) || normalizeCategory(md.selected_mode) || null,
      full_name: authFullName,
      email: auth.email || null,
      phone: authPhone,
      whatsapp: md.whatsapp || null,
      country: null,
      nationality: null,
      preferred_language: pref?.preferred_language || null,
      preferred_contact_method: null,
      preferred_contact_time: null,
      services: [],
      notes: null,
      source_page: 'direct account / social sign-in',
      category_data: pref?.dashboard_config || {},
      position: null,
      company_name: null,
      years_experience: null,
      budget_min: null,
      budget_max: null,
      investment_experience: null,
      communities: [],
      status: 'profile_pending',
      auth_metadata: md,
      _missing_signup_profile: true,
    } : null));

    return new Response(JSON.stringify({
      sessions: sessions.data || [],
      events: events.data || [],
      daily: daily.data || [],
      crm_profile: synthesizedProfile,
      profile,
      preferences: pref,
      roles: (roles.data || []).map((r: any) => r.role),
      activity: activity.data || [],
      consents: consents.data || [],
      signup_events: signupEvents.data || [],
      crm_lead: leadRow.data || null,
      activity_log: activityLog.data || [],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

function normalizeCategory(value?: string | null) {
  const c = (value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const known = ['investor','broker','developer','buyer','seller','landlord','tenant','partner','service_provider','media','other'];
  return known.includes(c) ? c : null;
}
