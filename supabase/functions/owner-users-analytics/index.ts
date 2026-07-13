import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function normalizeCategory(value?: string | null): 'investor' | 'broker' | 'developer' | 'buyer' | 'seller' | 'landlord' | 'tenant' | 'partner' | 'service_provider' | 'media' | 'other' | null {
  const c = (value || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  const known = ['investor','broker','developer','buyer','seller','landlord','tenant','partner','service_provider','media','other'];
  if (known.includes(c)) return c as any;
  return null;
}

function authName(u: any): string | null {
  const md = u?.user_metadata || {};
  return md.full_name || md.name || [md.first_name, md.last_name].filter(Boolean).join(' ') || null;
}

function authPhone(u: any): string | null {
  const md = u?.user_metadata || {};
  return u?.phone || md.phone || md.phone_number || md.mobile || md.whatsapp || null;
}

function authCategory(u: any): string | null {
  const md = u?.user_metadata || {};
  return md.category || md.selected_mode || md.role || null;
}

function categorize(p: any, crmCat?: string | null, selectedMode?: string | null, authCat?: string | null): 'investor' | 'broker' | 'developer' | 'buyer' | 'seller' | 'landlord' | 'tenant' | 'partner' | 'service_provider' | 'media' | 'other' | 'unassigned' {
  const direct = normalizeCategory(crmCat) || normalizeCategory(p.picked_role) || normalizeCategory(selectedMode) || normalizeCategory(authCat);
  if (direct) return direct;

  // `client` is an account type, not a CRM category. Do not display it as Investor.
  const candidates = [p.mode_default, p.user_type].filter((v) => v && String(v).toLowerCase() !== 'client');
  const m = candidates.join(' ').toLowerCase();
  if (m.includes('broker')) return 'broker';
  if (m.includes('develop')) return 'developer';
  if (m.includes('invest')) return 'investor';
  if (m.includes('buyer')) return 'buyer';
  if (m.includes('seller')) return 'seller';
  return 'unassigned';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: uErr } = await admin.auth.getUser(token);
    if (uErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = userData.user.id;
    const callerEmail = String(userData.user.email || '').toLowerCase().trim();

    const OWNER_BACKEND_EMAILS = [
      'janeaboujaoudenails@gmail.com',
      'janeaboujaoudemodel@gmail.com',
      'contact@janeaboujaoude.net',
      'infoo.jane@gmail.com',
    ];

    const emailAllowed = OWNER_BACKEND_EMAILS.includes(callerEmail);
    let hasRole = false;
    try {
      const { data: isOwner } = await admin.rpc('has_role', { _user_id: callerId, _role: 'owner' });
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: callerId, _role: 'admin' });
      hasRole = !!isOwner || !!isAdmin;
    } catch (_) { /* ignore */ }
    if (!emailAllowed && !hasRole) {
      console.log('Forbidden for', callerEmail, callerId);
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, first_name, last_name, email, phone_number, user_type, mode_default, picked_role, created_at, last_login_at, total_login_days')
      .order('created_at', { ascending: false })
      .limit(2000);

    const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 2000 });
    const authUsers = authList?.users || [];
    const authMap: Record<string, any> = {};
    for (const u of authUsers) authMap[u.id] = u;

    const profileMap: Record<string, any> = {};
    for (const p of profiles || []) profileMap[p.id] = p;

    const mergedProfiles = authUsers.map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_login_at: u.last_sign_in_at || null,
      total_login_days: 0,
      ...(profileMap[u.id] || {}),
    }));
    for (const p of profiles || []) {
      if (!authMap[p.id]) mergedProfiles.push(p);
    }

    const ids = mergedProfiles.map((p: any) => p.id);
    const since30 = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

    const [sessAgg, dailyAgg, crmAgg, prefAgg] = await Promise.all([
      admin.from('user_sessions').select('user_id, duration_seconds, country, device_type').in('user_id', ids),
      admin.from('user_daily_activity').select('user_id, day_date, total_duration_seconds').in('user_id', ids).gte('day_date', since30.slice(0, 10)),
      admin.from('crm_user_profiles').select('user_id, category, full_name, email, phone, whatsapp, country, company_name, position, source_page, created_at, updated_at').in('user_id', ids),
      admin.from('user_preferences').select('user_id, selected_mode').in('user_id', ids),
    ]);

    const sessMap: Record<string, { count: number; minutes: number; country: string | null; device: string | null }> = {};
    for (const s of sessAgg.data || []) {
      const k = s.user_id; if (!k) continue;
      sessMap[k] ||= { count: 0, minutes: 0, country: null, device: null };
      sessMap[k].count++;
      sessMap[k].minutes += Math.round((s.duration_seconds || 0) / 60);
      sessMap[k].country ||= s.country;
      sessMap[k].device ||= s.device_type;
    }
    const dayMap: Record<string, Set<string>> = {};
    for (const d of dailyAgg.data || []) {
      const k = d.user_id; if (!k) continue;
      (dayMap[k] ||= new Set()).add(d.day_date);
    }
    const crmMap: Record<string, any> = {};
    for (const c of crmAgg.data || []) {
      if (c.user_id) crmMap[c.user_id] = c;
    }
    const prefMap: Record<string, any> = {};
    for (const pref of prefAgg.data || []) {
      if (pref.user_id) prefMap[pref.user_id] = pref;
    }

    const rows = mergedProfiles.map((p: any) => {
      const s = sessMap[p.id] || { count: 0, minutes: 0, country: null, device: null };
      const crm = crmMap[p.id];
      const pref = prefMap[p.id];
      const auth = authMap[p.id];
      return {
        id: p.id,
        full_name: crm?.full_name || p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || authName(auth) || null,
        email: crm?.email || p.email || auth?.email || null,
        phone: crm?.phone || crm?.whatsapp || p.phone_number || authPhone(auth) || null,
        company_name: crm?.company_name || null,
        category: categorize(p, crm?.category, pref?.selected_mode, authCategory(auth)),
        position: crm?.position || null,
        has_signup_profile: !!crm,
        account_type: p.user_type || p.mode_default || null,
        created_at: p.created_at || auth?.created_at,
        last_login_at: p.last_login_at || auth?.last_sign_in_at || null,
        total_login_days: p.total_login_days,
        sessions_count: s.count,
        total_minutes: s.minutes,
        days_active_30d: (dayMap[p.id]?.size) || 0,
        country: crm?.country || s.country,
        device: s.device,
      };
    });

    return new Response(JSON.stringify({ rows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
