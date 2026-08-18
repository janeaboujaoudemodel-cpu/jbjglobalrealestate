// create-checkout — creates a Stripe embedded checkout session.
//
// SECURITY (backend audit 2.2): the caller-supplied `userId` is NEVER trusted.
// The Stripe `metadata.userId` that downstream entitlement logic reads is
// derived exclusively from the verified Supabase session on this request.
// Anonymous/guest checkout is still allowed (email-only, no userId metadata),
// so an unauthenticated caller can buy something for themselves but can never
// attribute a purchase to another account.
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { getCorsHeaders, requireAuthenticatedUser } from "../_shared/auth-utils.ts";
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Checkout-session creation hits Stripe's API on every call — throttle it so
  // an anonymous caller can't burn the account's rate budget.
  const { response: rateLimited } = await enforceRateLimit(
    req,
    { functionName: "create-checkout", maxRequests: 20, windowMinutes: 15, keyType: "ip" },
    corsHeaders,
  );
  if (rateLimited) return rateLimited;

  try {
    const {
      priceId,
      quantity,
      customerEmail,
      returnUrl,
      environment,
    }: {
      priceId: string;
      quantity?: number;
      customerEmail?: string;
      returnUrl: string;
      environment: StripeEnv;
    } = await req.json();

    if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) return json({ error: "Invalid priceId" }, 400);
    if (!returnUrl) return json({ error: "Missing returnUrl" }, 400);
    if (environment !== "sandbox" && environment !== "live") {
      return json({ error: "Invalid environment" }, 400);
    }

    const parsedQuantity = Number.isFinite(quantity) ? Math.floor(Number(quantity)) : 1;
    if (parsedQuantity < 1 || parsedQuantity > 100) return json({ error: "Invalid quantity" }, 400);

    // Identity comes from the verified session only. A caller with no valid
    // session proceeds as a guest — never as whoever they claimed to be.
    const auth = await requireAuthenticatedUser(req);
    const sessionUserId = auth.authenticated ? auth.userId : undefined;
    const sessionEmail = auth.authenticated ? auth.email : undefined;

    // Guests may supply their own email; authenticated users always use the
    // email on their verified session so a purchase can't be pinned elsewhere.
    const resolvedEmail = sessionEmail || (typeof customerEmail === "string" ? customerEmail : undefined);

    const stripe = createStripeClient(environment);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) return json({ error: "Price not found" }, 400);
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId = (resolvedEmail || sessionUserId)
      ? await resolveOrCreateCustomer(stripe, { email: resolvedEmail, userId: sessionUserId })
      : undefined;

    let productDescription: string | undefined;
    if (!isRecurring) {
      const productId = typeof stripePrice.product === "string"
        ? stripePrice.product
        : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);
      productDescription = product.name;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: parsedQuantity }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
      ...(sessionUserId && {
        metadata: { userId: sessionUserId },
        ...(isRecurring && { subscription_data: { metadata: { userId: sessionUserId } } }),
      }),
    });

    return json({ clientSecret: session.client_secret }, 200);
  } catch (e) {
    console.error("create-checkout error:", e);
    // Never echo the raw exception — it can carry Stripe/internal detail.
    return json({ error: "Unable to start checkout. Please try again." }, 400);
  }
});
