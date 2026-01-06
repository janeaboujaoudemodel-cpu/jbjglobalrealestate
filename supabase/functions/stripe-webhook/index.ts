import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Stripe event validation schemas
const PaymentIntentSucceededSchema = z.object({
  id: z.string(),
  object: z.literal('payment_intent'),
  amount: z.number(),
  currency: z.string(),
  status: z.literal('succeeded'),
  metadata: z.record(z.string()).optional(),
  customer: z.string().nullable().optional(),
});

const CheckoutSessionCompletedSchema = z.object({
  id: z.string(),
  object: z.literal('checkout.session'),
  payment_status: z.enum(['paid', 'unpaid', 'no_payment_required']),
  customer: z.string().nullable().optional(),
  customer_email: z.string().nullable().optional(),
  metadata: z.record(z.string()).optional(),
  amount_total: z.number().nullable().optional(),
});

const StripeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
  created: z.number(),
  livemode: z.boolean(),
});

// Verify Stripe webhook signature
async function verifyStripeSignature(
  payload: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const expectedSignature = parts['v1'];

    if (!timestamp || !expectedSignature) {
      return false;
    }

    // Check timestamp is within 5 minutes
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      console.log('Webhook timestamp too old');
      return false;
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return computedSignature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!stripeWebhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get signature header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.log('Missing stripe-signature header');
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature verification
    const payload = await req.text();

    // Verify webhook signature
    const isValid = await verifyStripeSignature(payload, signature, stripeWebhookSecret);
    if (!isValid) {
      console.log('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate event
    const rawEvent = JSON.parse(payload);
    const eventResult = StripeEventSchema.safeParse(rawEvent);

    if (!eventResult.success) {
      console.log('Invalid event format:', eventResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid event format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event = eventResult.data;
    console.log(`Processing Stripe event: ${event.type} (${event.id})`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const parseResult = PaymentIntentSucceededSchema.safeParse(paymentIntent);
        
        if (!parseResult.success) {
          console.log('Invalid payment_intent data');
          break;
        }

        const data = parseResult.data;
        console.log(`Payment succeeded: ${data.id}, amount: ${data.amount} ${data.currency}`);

        // Update membership or subscription status
        const userId = data.metadata?.user_id;
        const subscriptionType = data.metadata?.subscription_type;

        if (userId && subscriptionType === 'membership') {
          await supabase
            .from('memberships')
            .update({ 
              status: 'active',
              payment_reference: data.id,
              payment_method: 'stripe',
            })
            .eq('user_id', userId)
            .eq('status', 'pending');
        } else if (userId && subscriptionType === 'broker') {
          await supabase
            .from('broker_subscriptions')
            .update({ 
              status: 'active',
              payment_reference: data.id,
              payment_method: 'stripe',
            })
            .eq('user_id', userId)
            .eq('status', 'pending');
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        const parseResult = CheckoutSessionCompletedSchema.safeParse(session);
        
        if (!parseResult.success) {
          console.log('Invalid checkout.session data');
          break;
        }

        const data = parseResult.data;
        console.log(`Checkout completed: ${data.id}, status: ${data.payment_status}`);

        if (data.payment_status === 'paid') {
          const userId = data.metadata?.user_id;
          const subscriptionType = data.metadata?.subscription_type;

          if (userId && subscriptionType === 'membership') {
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);

            await supabase
              .from('memberships')
              .update({ 
                status: 'active',
                payment_reference: data.id,
                payment_method: 'stripe',
                expires_at: expiresAt.toISOString(),
              })
              .eq('user_id', userId)
              .eq('status', 'pending');
          } else if (userId && subscriptionType === 'broker') {
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);

            await supabase
              .from('broker_subscriptions')
              .update({ 
                status: 'active',
                payment_reference: data.id,
                payment_method: 'stripe',
                expires_at: expiresAt.toISOString(),
              })
              .eq('user_id', userId)
              .eq('status', 'pending');
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata?.user_id;
        
        console.log(`Payment failed for user: ${userId}`);
        
        // Could send failure notification email here
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        
        if (userId) {
          await supabase
            .from('memberships')
            .update({ status: 'cancelled' })
            .eq('user_id', userId);
          
          await supabase
            .from('broker_subscriptions')
            .update({ status: 'cancelled' })
            .eq('user_id', userId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, event_type: event.type }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
