// Inbox natural-language command interpreter.
// Returns a structured plan { actions: [...] } that the client confirms and executes.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface ThreadCtx {
  id: string;
  channel_type: string;
  status: string;
  unread_count: number;
  contact_name: string | null;
  contact_identifier: string;
  last_message_preview: string | null;
  ai_category?: string | null;
  ai_priority?: string | null;
  hours_since_last?: number | null;
}

interface ReqBody {
  command: string;
  threads: ThreadCtx[];
  selected_ids?: string[];
}

const SYSTEM = `You are an inbox automation planner for a real-estate executive.
You receive a natural-language command and a list of conversation summaries.
Return ONLY JSON: { "summary": string, "actions": [ { "type": ..., "thread_ids": string[], "value"?: string } ] }.
Allowed action types:
 - mark_read
 - set_status (value: "new" | "needs_reply" | "waiting" | "follow_up_due" | "closed")
 - draft_reply (one per thread; value is the reply text in the contact's language)
 - filter_only (value: human description; thread_ids = matching list)
Do not invent thread ids. Use only ids present in the input.
If the command is ambiguous, return a filter_only action with the best-matching subset.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = (await req.json()) as ReqBody;
    if (!body?.command || !Array.isArray(body.threads)) {
      return new Response(JSON.stringify({ error: 'command and threads required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Trim payload
    const compactThreads = body.threads.slice(0, 80).map(t => ({
      id: t.id,
      ch: t.channel_type,
      st: t.status,
      unread: t.unread_count,
      from: t.contact_name || t.contact_identifier,
      preview: (t.last_message_preview || '').slice(0, 140),
      cat: t.ai_category || null,
      prio: t.ai_priority || null,
      hrs: t.hours_since_last ?? null,
    }));

    const userMsg = `Command: ${body.command}\nSelected ids: ${(body.selected_ids || []).join(', ') || '(none)'}\nConversations:\n${JSON.stringify(compactThreads)}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: userMsg },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (aiRes.status === 429) return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (aiRes.status === 402) return new Response(JSON.stringify({ error: 'credits_exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: 'ai_failed', detail: txt }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content || '{}';
    let parsed: { summary?: string; actions?: unknown[] } = {};
    try { parsed = JSON.parse(content); } catch { parsed = { summary: content, actions: [] }; }

    return new Response(JSON.stringify({
      summary: parsed.summary || '',
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
