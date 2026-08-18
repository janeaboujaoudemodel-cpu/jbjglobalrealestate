// JBJ Bookings — public booking creation (with optional email verification)
// Flow:
//   POST { slug, starts_at, customer:{name,email,phone}, form_data, guests[], code? }
//   If page.require_email_verification === true and !code: sends a 6-digit code, no appointment created.
//   If code supplied: verifies code, then atomically creates appointment (server-side conflict check).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';
import { enforceRateLimit } from '../_shared/rate-limit-middleware.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

// Brute-force guards for the 6-digit email code.
const MAX_CODE_ATTEMPTS = 5;          // wrong guesses per outstanding code
const MAX_CODES_PER_EMAIL_HOUR = 5;   // codes we will issue per email per hour

const BodySchema = z.object({
  slug: z.string().min(1).max(80),
  starts_at: z.string(), // ISO UTC
  customer: z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().max(60).optional().nullable(),
  }),
  form_data: z.record(z.any()).default({}),
  guests: z.array(z.string().email()).max(20).default([]),
  code: z.string().length(6).optional(),
});

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendVerificationEmail(opts: {
  to: string; code: string;
  workspaceName: string; senderName: string; senderEmail: string; eventName: string;
}) {
  if (!RESEND_KEY) {
    console.warn('[booking] RESEND_API_KEY missing — verification code logged only:', opts.code);
    return;
  }
  const html = `
    <div style="font-family:Georgia,serif;background:#ffffff;padding:32px;color:#0a0a0a">
      <div style="max-width:520px;margin:0 auto;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#064E3B 0%,#042c1c 60%,#000 100%);padding:28px;color:#fff;text-align:center">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;letter-spacing:0.5px">${opts.workspaceName}</div>
          <div style="opacity:0.85;font-size:12px;margin-top:6px;letter-spacing:2px;text-transform:uppercase">Verify your email</div>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 12px;font-size:15px">To confirm your booking for <b>${opts.eventName}</b>, enter this 6-digit code:</p>
          <div style="font-size:36px;letter-spacing:8px;text-align:center;font-weight:700;color:#064E3B;padding:16px;background:#F0FDF4;border-radius:10px">${opts.code}</div>
          <p style="margin:20px 0 0;font-size:12px;color:#6B7280">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
        <div style="padding:14px;background:#F9FAFB;text-align:center;font-size:11px;color:#9CA3AF">Powered by JBJ Bookings</div>
      </div>
    </div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${opts.senderName} <${opts.senderEmail}>`,
      to: [opts.to],
      subject: `Your verification code: ${opts.code}`,
      html,
    }),
  });
  if (!res.ok) console.error('[booking] resend send failed', res.status, await res.text());
}

async function sendConfirmationEmail(opts: {
  to: string; workspaceName: string; senderName: string; senderEmail: string;
  eventName: string; startsAt: string; timezone: string; guests: string[];
  pending?: boolean;
}) {
  if (!RESEND_KEY) return;
  const when = new Intl.DateTimeFormat('en-US', {
    timeZone: opts.timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(opts.startsAt));
  const kicker = opts.pending ? 'Request Received' : 'Booking Confirmed';
  const lead = opts.pending
    ? `Your requested time for <b>${opts.eventName}</b> is reserved and awaiting confirmation by our team.`
    : `Your booking for <b>${opts.eventName}</b> is confirmed.`;
  const html = `
    <div style="font-family:Georgia,serif;background:#fff;padding:32px;color:#0a0a0a">
      <div style="max-width:560px;margin:0 auto;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#064E3B 0%,#042c1c 60%,#000 100%);padding:32px;color:#fff;text-align:center">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px">${opts.workspaceName}</div>
          <div style="opacity:0.85;font-size:12px;margin-top:8px;letter-spacing:2px;text-transform:uppercase">${kicker}</div>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 8px;font-size:15px">${lead}</p>
          <div style="margin:16px 0;padding:16px;background:#F0FDF4;border-left:3px solid #064E3B;border-radius:6px">
            <div style="font-size:13px;color:#6B7280">REQUESTED TIME</div>
            <div style="font-size:16px;color:#064E3B;font-weight:600;margin-top:4px">${when} (${opts.timezone})</div>
          </div>
          ${opts.guests.length ? `<p style="font-size:13px;color:#6B7280">Guests invited: ${opts.guests.join(', ')}</p>` : ''}
          <p style="font-size:12px;color:#9CA3AF;margin-top:20px">${opts.pending ? 'You will receive a separate confirmation once the appointment is accepted.' : 'You will receive further details from our team shortly.'}</p>
        </div>
        <div style="padding:14px;background:#F9FAFB;text-align:center;font-size:11px;color:#9CA3AF">Powered by JBJ Bookings</div>
      </div>
    </div>`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${opts.senderName} <${opts.senderEmail}>`,
      to: [opts.to, ...opts.guests],
      subject: `${opts.pending ? 'Booking request received' : 'Booking confirmed'} — ${opts.eventName}`,
      html,
    }),
  }).catch((e) => console.error('confirmation send failed', e));
}

/**
 * Owner Alerts (LOCKED): an appointment must raise an in-app bell notification
 * for every owner/admin plus an owner email that deep-links to the queue.
 */
async function notifyOwnersAboutBooking(sb: any, p: {
  appointmentId: string; eventName: string; workspaceName: string;
  notificationEmail: string | null;
  customerName: string; customerEmail: string; customerPhone: string | null;
  startsAt: string; timezone: string; formData: Record<string, unknown>; guests: string[];
}) {
  const when = new Intl.DateTimeFormat('en-US', {
    timeZone: p.timezone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(p.startsAt));
  const actionUrl = `/owner/bookings?appointment=${p.appointmentId}`;

  const { data: roleRows } = await sb
    .from('user_roles')
    .select('user_id, role')
    .in('role', ['owner', 'admin']);
  const userIds = Array.from(new Set((roleRows ?? []).map((r: any) => r.user_id).filter(Boolean)));

  if (userIds.length) {
    await sb.from('notifications').insert(userIds.map((user_id: string) => ({
      user_id,
      title: 'New appointment request',
      body: `${p.customerName} requested ${p.eventName} · ${when}`,
      notification_type: 'booking_request',
      action_url: actionUrl,
      metadata: {
        appointment_id: p.appointmentId,
        customer_email: p.customerEmail,
        customer_phone: p.customerPhone,
        starts_at: p.startsAt,
        timezone: p.timezone,
        event_name: p.eventName,
        status: 'awaiting_approval',
        sound: 'lead-pop',
      },
    })));
  }

  if (!RESEND_KEY) return;
  const recipients = Array.from(new Set(['infoo.jane@gmail.com', ...(p.notificationEmail ? [p.notificationEmail] : [])]));
  const detailRows = Object.entries(p.formData ?? {})
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .slice(0, 12)
    .map(([k, v]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #EFE6D6;font-weight:700;">${k}</td><td style="padding:6px 10px;border-bottom:1px solid #EFE6D6;">${String(v)}</td></tr>`)
    .join('');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'JBJ Bookings <contact@jbj.ae>',
      to: recipients,
      reply_to: p.customerEmail,
      subject: `New appointment request: ${p.customerName} · ${p.eventName}`,
      html: `<div style="font-family:Arial,sans-serif;padding:24px;color:#1A1A1A"><div style="max-width:680px;margin:0 auto;border:1px solid #B89555;border-radius:14px;overflow:hidden"><div style="background:linear-gradient(135deg,#064E3B,#042C1C,#000);padding:18px 22px;color:#fff"><h1 style="margin:0;font-size:22px;color:#fff">New appointment request</h1><p style="margin:6px 0 0;color:#fff">${p.eventName} · ${p.workspaceName}</p></div><div style="padding:22px;background:#FDFBF7"><p><strong>Name:</strong> ${p.customerName}</p><p><strong>Email:</strong> <a href="mailto:${p.customerEmail}">${p.customerEmail}</a></p><p><strong>Phone:</strong> ${p.customerPhone ? `<a href="https://wa.me/${p.customerPhone.replace(/\D/g, '')}">${p.customerPhone}</a>` : 'Not provided'}</p><p><strong>Requested:</strong> ${when} (${p.timezone})</p><p><strong>Status:</strong> Awaiting your approval</p>${p.guests.length ? `<p><strong>Guests:</strong> ${p.guests.join(', ')}</p>` : ''}${detailRows ? `<table style="border-collapse:collapse;width:100%;margin-top:14px">${detailRows}</table>` : ''}<p style="margin-top:18px"><a href="https://www.jbj.ae${actionUrl}" style="background:#064E3B;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Open bookings queue</a></p></div></div></div>`,
    }),
  }).catch((e) => console.error('owner booking email failed', e));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Audit 4.3: anonymous endpoint that creates appointments and sends email —
  // 10 requests per IP per 15 minutes via the shared DB-backed limiter. The
  // per-email code guards above stay as the second layer.
  const { response: rateLimited } = await enforceRateLimit(
    req,
    { functionName: 'booking-public-create', maxRequests: 10, windowMinutes: 15, keyType: 'ip' },
    corsHeaders,
  );
  if (rateLimited) return rateLimited;

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      // Audit 6.1: field names only, not the full zod issue tree.
      const fields = Array.from(new Set(parsed.error.issues.map((i) => i.path.join('.'))))
        .filter(Boolean)
        .slice(0, 10);
      return new Response(JSON.stringify({ error: 'Invalid booking details', fields }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { slug, starts_at, customer, form_data, guests, code } = parsed.data;

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Load page + event + workspace
    const { data: pageRow } = await sb
      .from('jbj_booking_pages')
      .select('id, event_type_id, is_active, require_email_verification, jbj_booking_event_types!inner(id, name, workspace_id, duration_minutes, is_active, jbj_booking_workspaces!inner(id, display_name, sender_name, sender_email, notification_email, timezone, is_active))')
      .eq('slug', slug)
      .maybeSingle();

    if (!pageRow || !pageRow.is_active) {
      return new Response(JSON.stringify({ error: 'page_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const evt: any = (pageRow as any).jbj_booking_event_types;
    const ws: any = evt.jbj_booking_workspaces;
    if (!evt.is_active || !ws.is_active) {
      return new Response(JSON.stringify({ error: 'inactive' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const startsAtDate = new Date(starts_at);
    if (isNaN(startsAtDate.getTime())) {
      return new Response(JSON.stringify({ error: 'bad_starts_at' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const endsAtDate = new Date(startsAtDate.getTime() + evt.duration_minutes * 60_000);

    // ── Rate limits (abuse-guard) ─────────────────────────────────────────
    // Max 5 bookings per email per rolling 24h, and 10 per IP per hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;

    const { count: emailCount } = await sb
      .from('jbj_booking_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('customer_email', customer.email.toLowerCase())
      .gte('created_at', oneDayAgo);
    if ((emailCount ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: 'rate_limited_email' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (ip) {
      const { count: ipCount } = await sb
        .from('jbj_booking_audit_log')
        .select('id', { count: 'exact', head: true })
        .contains('details', { ip })
        .gte('created_at', oneHourAgo);
      if ((ipCount ?? 0) >= 10) {
        return new Response(JSON.stringify({ error: 'rate_limited_ip' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }


    // Email verification path
    if (pageRow.require_email_verification) {
      if (!code) {
        // Per-email code throttle: an attacker cannot farm fresh codes.
        const { count: codeCount } = await sb
          .from('jbj_booking_email_verifications')
          .select('id', { count: 'exact', head: true })
          .eq('email', customer.email.toLowerCase())
          .gte('created_at', oneHourAgo);
        if ((codeCount ?? 0) >= MAX_CODES_PER_EMAIL_HOUR) {
          return new Response(JSON.stringify({ error: 'rate_limited_code' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // Send code
        const genCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hash = await sha256(`${customer.email.toLowerCase()}:${slug}:${genCode}`);
        await sb.from('jbj_booking_email_verifications').insert({
          email: customer.email.toLowerCase(),
          slug,
          code_hash: hash,
          expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
        });
        await sendVerificationEmail({
          to: customer.email,
          code: genCode,
          workspaceName: ws.display_name,
          senderName: ws.sender_name,
          senderEmail: ws.sender_email,
          eventName: evt.name,
        });
        return new Response(JSON.stringify({ step: 'verify_email' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // ── Verify code (brute-force hardened) ──────────────────────────────
        // Attempts are counted on the LATEST outstanding verification for this
        // email+slug, not on the row matching the submitted hash — otherwise a
        // wrong guess touches nothing and the code can be enumerated.
        const emailKey = customer.email.toLowerCase();
        const { data: pending } = await sb
          .from('jbj_booking_email_verifications')
          .select('id, expires_at, verified_at, attempts, code_hash')
          .eq('email', emailKey)
          .eq('slug', slug)
          .is('verified_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!pending) {
          return new Response(JSON.stringify({ error: 'invalid_code' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if ((pending.attempts ?? 0) >= MAX_CODE_ATTEMPTS) {
          await sb.from('jbj_booking_audit_log').insert({
            action: 'verification_locked',
            actor: 'public',
            details: { slug, email: emailKey, ip },
          });
          return new Response(JSON.stringify({ error: 'too_many_attempts' }), {
            status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (new Date(pending.expires_at) < new Date()) {
          return new Response(JSON.stringify({ error: 'code_expired' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const hash = await sha256(`${emailKey}:${slug}:${code}`);
        if (hash !== pending.code_hash) {
          // Count the failure BEFORE responding, and leave an audit trail.
          await sb
            .from('jbj_booking_email_verifications')
            .update({ attempts: (pending.attempts ?? 0) + 1 })
            .eq('id', pending.id);
          await sb.from('jbj_booking_audit_log').insert({
            action: 'verification_failed',
            actor: 'public',
            details: { slug, email: emailKey, ip, attempt: (pending.attempts ?? 0) + 1 },
          });
          const remaining = Math.max(MAX_CODE_ATTEMPTS - ((pending.attempts ?? 0) + 1), 0);
          return new Response(JSON.stringify({ error: 'invalid_code', attempts_remaining: remaining }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await sb.from('jbj_booking_email_verifications')
          .update({ verified_at: new Date().toISOString() })
          .eq('id', pending.id);
      }
    }


    // Conflict check via SQL function (atomic-ish; DB is source of truth)
    const { data: freeRes, error: freeErr } = await sb.rpc('jbj_booking_slot_is_free', {
      _event_type_id: evt.id,
      _starts_at: startsAtDate.toISOString(),
      _ends_at: endsAtDate.toISOString(),
    });
    if (freeErr) {
      return new Response(JSON.stringify({ error: 'conflict_check_failed', details: freeErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (freeRes === false) {
      return new Response(JSON.stringify({ error: 'slot_taken' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create appointment
    const { data: appt, error: apptErr } = await sb
      .from('jbj_booking_appointments')
      .insert({
        workspace_id: ws.id,
        event_type_id: evt.id,
        booking_page_id: pageRow.id,
        status: 'awaiting_approval',
        starts_at: startsAtDate.toISOString(),
        ends_at: endsAtDate.toISOString(),
        timezone: ws.timezone,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone ?? null,
        form_data,
        email_verified: pageRow.require_email_verification,
      })
      .select('id')
      .single();

    if (apptErr || !appt) {
      return new Response(JSON.stringify({ error: 'create_failed', details: apptErr?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Guests
    if (guests.length) {
      const rows = Array.from(new Set(guests.map((g) => g.toLowerCase()))).map((email) => ({ appointment_id: appt.id, email }));
      await sb.from('jbj_booking_guests').insert(rows);
    }

    // Audit
    await sb.from('jbj_booking_audit_log').insert({
      appointment_id: appt.id,
      action: 'created',
      actor: 'public',
      details: { slug, ip: req.headers.get('x-forwarded-for') ?? null },
    });

    const pendingApproval = true; // appointments are created as awaiting_approval

    // Fire customer email (fire-and-forget)
    sendConfirmationEmail({
      to: customer.email,
      workspaceName: ws.display_name,
      senderName: ws.sender_name,
      senderEmail: ws.sender_email,
      eventName: evt.name,
      startsAt: startsAtDate.toISOString(),
      timezone: ws.timezone,
      guests,
      pending: pendingApproval,
    }).catch(() => {});

    // Owner Alerts contract: every public request raises an in-app bell for
    // owners/admins AND an owner email, deep-linked to the bookings queue.
    await notifyOwnersAboutBooking(sb, {
      appointmentId: appt.id,
      eventName: evt.name,
      workspaceName: ws.display_name,
      notificationEmail: ws.notification_email ?? null,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone ?? null,
      startsAt: startsAtDate.toISOString(),
      timezone: ws.timezone,
      formData: form_data,
      guests,
    }).catch((e) => console.error('owner booking alert failed', e));

    return new Response(
      JSON.stringify({
        step: 'confirmed',
        appointment_id: appt.id,
        status: 'awaiting_approval',
        requires_approval: pendingApproval,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('booking create error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
