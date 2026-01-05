import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA-256 hash function
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.toUpperCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, code, userEmail, userId, tier } = await req.json();

    console.log(`Discount code action: ${action}, code length: ${code?.length}, tier: ${tier}`);

    if (action === 'validate') {
      // Validate a discount code
      if (!code || !userEmail || !userId) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Missing required fields' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      const codeHash = await hashCode(code);
      console.log(`Looking up code hash: ${codeHash.substring(0, 10)}...`);

      // Find the discount code by hash
      const { data: discountCode, error: lookupError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code_hash', codeHash)
        .eq('is_active', true)
        .single();

      if (lookupError || !discountCode) {
        console.log('Code not found or inactive');
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid or expired discount code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check validity period
      const now = new Date();
      if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code is not yet active' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code has expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check max uses
      if (discountCode.max_uses !== null && discountCode.current_uses >= discountCode.max_uses) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code has reached its maximum uses' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check if assigned to specific user
      if (discountCode.assigned_to_email && discountCode.assigned_to_email.toLowerCase() !== userEmail.toLowerCase()) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code is not assigned to your account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      if (discountCode.assigned_to_user_id && discountCode.assigned_to_user_id !== userId) {
        return new Response(
          JSON.stringify({ valid: false, error: 'This code is not assigned to your account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Check applicable tiers
      if (discountCode.applicable_tiers && discountCode.applicable_tiers.length > 0) {
        if (!discountCode.applicable_tiers.includes(tier)) {
          return new Response(
            JSON.stringify({ valid: false, error: `This code is not valid for the ${tier} plan` }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }

      // Check if user already used this code (if single use per user)
      if (discountCode.is_single_use_per_user) {
        const { data: existingUsage } = await supabase
          .from('discount_code_usages')
          .select('id')
          .eq('discount_code_id', discountCode.id)
          .eq('user_id', userId)
          .single();

        if (existingUsage) {
          return new Response(
            JSON.stringify({ valid: false, error: 'You have already used this discount code' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      }

      // Code is valid!
      console.log(`Code valid: ${discountCode.discount_type} - ${discountCode.discount_value}`);
      
      return new Response(
        JSON.stringify({
          valid: true,
          discountType: discountCode.discount_type,
          discountValue: discountCode.discount_value,
          description: discountCode.description,
          codeId: discountCode.id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (action === 'apply') {
      // Apply the discount code (record usage)
      const { codeId, originalPrice, finalPrice, subscriptionId } = await req.json();

      if (!codeId || !userId || !userEmail) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Get discount code details
      const { data: discountCode, error: lookupError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('id', codeId)
        .single();

      if (lookupError || !discountCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'Discount code not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Record usage
      const { error: usageError } = await supabase
        .from('discount_code_usages')
        .insert({
          discount_code_id: codeId,
          user_id: userId,
          user_email: userEmail,
          subscription_id: subscriptionId || null,
          discount_applied: originalPrice - finalPrice,
          original_price: originalPrice,
          final_price: finalPrice,
        });

      if (usageError) {
        console.error('Failed to record usage:', usageError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to apply discount' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Increment usage count
      await supabase
        .from('discount_codes')
        .update({ current_uses: discountCode.current_uses + 1 })
        .eq('id', codeId);

      console.log(`Discount applied: ${originalPrice} -> ${finalPrice}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } else if (action === 'create') {
      // Create a new discount code (admin only - verified by RLS)
      const { 
        discountType, 
        discountValue, 
        description, 
        maxUses, 
        assignedToEmail, 
        validUntil, 
        applicableTiers,
        createdBy 
      } = await req.json();

      // Generate a secure random code
      const randomBytes = new Uint8Array(6);
      crypto.getRandomValues(randomBytes);
      const generatedCode = Array.from(randomBytes)
        .map(b => b.toString(36).toUpperCase())
        .join('')
        .substring(0, 8);

      const codeHash = await hashCode(generatedCode);

      const { data: newCode, error: createError } = await supabase
        .from('discount_codes')
        .insert({
          code: generatedCode, // Store the plain code for admin reference only
          code_hash: codeHash,
          discount_type: discountType,
          discount_value: discountValue || 0,
          description,
          max_uses: maxUses || 1,
          assigned_to_email: assignedToEmail || null,
          valid_until: validUntil || null,
          applicable_tiers: applicableTiers || null,
          created_by: createdBy,
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create code:', createError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create discount code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log(`Created discount code: ${generatedCode}`);

      return new Response(
        JSON.stringify({ success: true, code: generatedCode, id: newCode.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error) {
    console.error('Discount code error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
