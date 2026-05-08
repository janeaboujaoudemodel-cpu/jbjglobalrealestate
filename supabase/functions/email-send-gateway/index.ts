// Universal email send gateway — single entry point for any client/edge code
// that wants to send an email. Routes through Resend with the global daily
// + monthly cap (Resend free plan: 100/day, 3,000/month, 2 req/s).
//
// POST body: { from, to, subject, html?, text?, reply_to?, cc?, bcc?, ... }

import { sendViaResend, type ResendSendInput } from "../_shared/resendClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: ResendSendInput;
  try {
    body = (await req.json()) as ResendSendInput;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!body?.from || !body?.to || !body?.subject || (!body.html && !body.text)) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: from, to, subject, html|text" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const result = await sendViaResend(body);

  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : result.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
