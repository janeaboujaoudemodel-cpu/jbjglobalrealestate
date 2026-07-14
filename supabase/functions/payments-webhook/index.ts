import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

function resolvePriceId(item: any): string {
  return item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = typeof item?.price?.product === "string" ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

// -------- Broker credit system: tier + pack grants --------

async function grantIfNotAlready(params: {
  userId: string;
  credits: number;
  reason: string;
  bucket: "subscription" | "purchased";
  relatedId: string;
  metadata?: Record<string, unknown>;
}) {
  const sb = getSupabase();
  // Idempotency: check ledger for existing entry with same related_id + reason.
  const { data: existing } = await sb
    .from("broker_credit_ledger")
    .select("id")
    .eq("user_id", params.userId)
    .eq("related_id", params.relatedId)
    .eq("reason", params.reason)
    .limit(1)
    .maybeSingle();
  if (existing) {
    console.log("grant skipped (already applied):", params.relatedId, params.reason);
    return;
  }
  const { error } = await sb.rpc("grant_broker_credits", {
    p_user_id: params.userId,
    p_credits: params.credits,
    p_reason: params.reason,
    p_bucket: params.bucket,
    p_related_id: params.relatedId,
    p_metadata: params.metadata ?? {},
  });
  if (error) console.error("grant_broker_credits error:", error);
}

async function handleBrokerTierSubscription(subscription: any) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  if (!priceId) return;

  const sb = getSupabase();
  const { data: tier } = await sb
    .from("broker_tier_definitions")
    .select("tier_key, monthly_credit_allowance")
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .maybeSingle();
  if (!tier) return;

  // Ensure wallet exists + set active tier/allowance.
  await sb.from("broker_credit_wallets").upsert(
    {
      user_id: userId,
      active_tier: tier.tier_key,
      monthly_allowance: tier.monthly_credit_allowance,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  // Grant the tier's monthly allowance for this billing cycle. Idempotent by
  // (subscription.id + current_period_start).
  const cycleStart = item?.current_period_start ?? subscription.current_period_start;
  const relatedId = `sub:${subscription.id}:${cycleStart ?? "initial"}`;
  await grantIfNotAlready({
    userId,
    credits: tier.monthly_credit_allowance,
    reason: `tier_${tier.tier_key}_cycle_grant`,
    bucket: "subscription",
    relatedId,
    metadata: { tier: tier.tier_key, price_id: priceId, subscription_id: subscription.id },
  });
}

async function handleInvoicePaid(invoice: any) {
  // Renewal grants: on each successful recurring invoice, refill subscription credits.
  if (!invoice.subscription || invoice.billing_reason === "subscription_create") return;
  const userId = invoice.subscription_details?.metadata?.userId
    ?? invoice.metadata?.userId;
  const line = invoice.lines?.data?.find((l: any) => l.price?.recurring);
  const priceId = resolvePriceId(line);
  if (!userId || !priceId) return;

  const sb = getSupabase();
  const { data: tier } = await sb
    .from("broker_tier_definitions")
    .select("tier_key, monthly_credit_allowance")
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
    .maybeSingle();
  if (!tier) return;

  await grantIfNotAlready({
    userId,
    credits: tier.monthly_credit_allowance,
    reason: `tier_${tier.tier_key}_renewal_grant`,
    bucket: "subscription",
    relatedId: `invoice:${invoice.id}`,
    metadata: { tier: tier.tier_key, price_id: priceId, invoice_id: invoice.id },
  });
}

async function handleCreditPackPurchase(session: any) {
  if (session.mode !== "payment" || session.payment_status !== "paid") return;
  const userId = session.metadata?.userId;
  if (!userId) return;

  // Line items aren't on the session by default — fetch them.
  const stripe = createStripeClient((session.livemode ? "live" : "sandbox") as StripeEnv);
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price"],
    limit: 20,
  });

  const sb = getSupabase();
  for (const li of lineItems.data) {
    const priceId = (li.price as any)?.lookup_key
      ?? (li.price as any)?.metadata?.lovable_external_id
      ?? li.price?.id;
    if (!priceId) continue;
    const { data: pack } = await sb
      .from("broker_credit_pack_definitions")
      .select("pack_key, credits")
      .eq("stripe_price_id", priceId)
      .maybeSingle();
    if (!pack) continue;
    const qty = li.quantity ?? 1;
    await grantIfNotAlready({
      userId,
      credits: pack.credits * qty,
      reason: `credit_pack_${pack.pack_key}`,
      bucket: "purchased",
      relatedId: `session:${session.id}:${li.id}`,
      metadata: { pack_key: pack.pack_key, session_id: session.id, quantity: qty },
    });
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      await handleBrokerTierSubscription(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env);
      await handleBrokerTierSubscription(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object);
      break;
    case "checkout.session.completed":
      await handleCreditPackPurchase(event.data.object);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook received with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;
  try {
    await handleWebhook(req, env);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
