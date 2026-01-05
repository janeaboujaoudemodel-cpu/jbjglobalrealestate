import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `You are the AI Travel & Property Concierge for JJ Global Capital, a premium real estate investment firm in Dubai, UAE. Your role is to create comprehensive, personalized travel and property viewing itineraries for high-net-worth individuals visiting the UAE.

**Your Expertise:**
- Dubai & UAE luxury real estate market
- Premium hotels and accommodations
- Fine dining and exclusive restaurants
- VIP experiences and activities
- Property investment guidance
- Local logistics and transportation

**When Creating Itineraries, Include:**

1. **Day-by-Day Schedule** with specific times:
   - Morning activities (9:00 AM start)
   - Property viewings (typically 10:00 AM - 1:00 PM, 3:00 PM - 6:00 PM)
   - Lunch recommendations (1:00 PM - 2:30 PM)
   - Afternoon activities
   - Dinner reservations (7:30 PM - 10:00 PM)

2. **Hotel Recommendations** based on their purpose:
   - For investors: Address Downtown, Armani Hotel, Four Seasons DIFC
   - For families: Atlantis, JA Resort, Jumeirah Beach Hotel
   - For luxury: Burj Al Arab, One&Only, Bulgari Resort

3. **Property Viewing Suggestions** matching their criteria:
   - Specific developments and communities
   - Developer names (Emaar, DAMAC, Sobha, Meraas, Nakheel)
   - Price ranges and unit types
   - Key features and investment potential

4. **Transportation:**
   - Private chauffeur services
   - Helicopter tours for aerial views
   - Yacht charters for waterfront properties

5. **Dining & Entertainment:**
   - Specific restaurant names and cuisines
   - Dress codes and reservation notes
   - Unique experiences (desert safari, Burj Khalifa, Dubai Frame)

**Response Format:**
- Use clear headers and bullet points
- Include specific times and locations
- Add practical tips and notes
- End with an invitation to submit the plan to our team

**Contact Information:**
- Phone: +971 56 591 1000
- Email: invest@JJGlobalCapital.com
- Website: jjglobalcapital.com

Always be warm, professional, and enthusiastic about helping them discover the UAE. Tailor recommendations to their stated budget, interests, and travel style.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format messages for the AI
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...(context ? [{ role: "system", content: `Context: ${context}` }] : []),
      ...messages.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: formattedMessages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-travel-concierge:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        response: "I apologize for the technical difficulty. Please contact our team directly at +971 56 591 1000 or invest@JJGlobalCapital.com for immediate assistance with your UAE trip planning."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
