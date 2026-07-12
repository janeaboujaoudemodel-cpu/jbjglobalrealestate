import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function categorize(p: any): 'investor' | 'broker' | 'developer' | 'unassigned' {
  const m = (p.mode_default || p.user_type || '').toLowerCase();
  if (m.includes('broker')) return 'broker';
  if (m.includes('develop')) return 'developer';
  if (m.includes('invest') || m === 'client') return 'investor';
  return 'unassigned';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: cErr } = await userClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const callerId = claims.claims.sub;
    const callerEmail = String(claims.claims.email || '').toLowerCase().trim();

    const OWNER_BACKEND_EMAILS = [
      'janeaboujaoudenails@gmail.com',
      'janeaboujaoudemodel@gmail.com',
      'contact@janeaboujaoude.net',
      'infoo.jane@gmail.com',
    ];

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const emailAllowed = OWNER_BACKEND_EMAILS.includes(callerEmail);
    const { data: isOwner } = await admin.rpc('has_role', { _user_id: callerId, _role: 'owner' });
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!emailAllowed && !isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, email, user_type, mode_default, created_at, last_login_at, total_login_days')
      .order('created_at', { ascending: false })
      .limit(2000);

    const ids = (profiles || []).map((p: any) => p.id);
    const since30 = new Date(Date.now() - 30 * 86400 * 1000).toISOString();

    const [sessAgg, dailyAgg] = await Promise.all([
      admin.from('user_sessions').select('user_id, duration_seconds, country, device_type').in('user_id', ids),
      admin.from('user_daily_activity').select('user_id, day_date, total_duration_seconds').in('user_id', ids).gte('day_date', since30.slice(0, 10)),
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

    const rows = (profiles || []).map((p: any) => {
      const s = sessMap[p.id] || { count: 0, minutes: 0, country: null, device: null };
      return {
        id: p.id,
        full_name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || null,
        email: p.email,
        category: categorize(p),
        created_at: p.created_at,
        last_login_at: p.last_login_at,
        total_login_days: p.total_login_days,
        sessions_count: s.count,
        total_minutes: s.minutes,
        days_active_30d: (dayMap[p.id]?.size) || 0,
        country: s.country,
        device: s.device,
      };
    });

    return new Response(JSON.stringify({ rows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
