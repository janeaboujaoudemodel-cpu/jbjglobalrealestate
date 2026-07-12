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

    const [sessions, events, daily] = await Promise.all([
      admin.from('user_sessions').select('started_at, ended_at, duration_seconds, device_type, country, pages_visited').eq('user_id', user_id).order('started_at', { ascending: false }).limit(100),
      admin.from('user_events').select('event_time, event_name, page_path, metadata').eq('user_id', user_id).order('event_time', { ascending: false }).limit(50),
      admin.from('user_daily_activity').select('day_date, sessions_count, total_duration_seconds, total_events').eq('user_id', user_id).order('day_date', { ascending: false }).limit(90),
    ]);

    return new Response(JSON.stringify({
      sessions: sessions.data || [],
      events: events.data || [],
      daily: daily.data || [],
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
