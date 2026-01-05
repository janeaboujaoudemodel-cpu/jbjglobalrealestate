import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://jjglobalcapital.com",
  "https://www.jjglobalcapital.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Comprehensive website knowledge base
const WEBSITE_KNOWLEDGE = `
JJ GLOBAL CAPITAL - COMPLETE SERVICES & INFORMATION:

COMPANY OVERVIEW:
- JJ Global Capital is the flagship real estate investment and advisory division of JJ Holding Group
- Founded by Jane Abou Jaoude, Founder & Chairwoman
- Headquarters: Dubai, UAE
- Serving clients from 92+ countries
- Portfolio exceeding AED 2 billion

CONTACT INFORMATION:
- Email: invest@jjglobalcapital.com
- Phone: +971 50 747 9498
- WhatsApp: +971 50 747 9498
- Website: jjglobalcapital.com

SERVICES:

1. REAL ESTATE INVESTMENT (UAE-Wide):
   - Off-plan properties in Dubai, Abu Dhabi, Sharjah, Ras Al Khaimah
   - Ready-to-move properties
   - AI Home Finder - personalized property matching
   - Property comparison and evaluation tools
   - Investment advisory for portfolios
   - Featured communities: Dubai Marina, Downtown Dubai, Palm Jumeirah, Business Bay, JBR, Dubai Hills, Creek Harbour, Jumeirah Village Circle, Dubai South, Mohammed Bin Rashid City
   - Top developers: Emaar, DAMAC, Nakheel, Sobha, Meraas, Azizi, Danube, Ellington, Binghatti

2. LUXURY CONCIERGE SERVICES:
   - Private jet charters
   - Yacht rentals
   - VIP airport transfers
   - Exclusive event access
   - Personal shopping assistance
   - Restaurant reservations
   - Travel itinerary planning for UAE visitors

3. LEGAL ADVISORY:
   - Property transaction documentation
   - Contract review and negotiation
   - Visa and residency guidance (Golden Visa through property investment)
   - Company formation for property ownership
   - Power of Attorney services

4. DESIGN & BUILD:
   - Interior design services
   - Fit-out and renovation
   - Smart home integration
   - Furniture packages
   - Project management

5. MORTGAGE ADVISORY:
   - UAE bank mortgage options
   - Rate comparison
   - Pre-approval assistance
   - Documentation support
   - For residents and non-residents

6. PROPERTY MANAGEMENT:
   - Rental management
   - Tenant finding
   - Maintenance coordination
   - Financial reporting

AI TOOLS AVAILABLE ON WEBSITE:
- AI Home Finder Quiz - Match properties to preferences
- Property Evaluator - Get property valuations
- Interior Design AI - Visualize room designs
- Mortgage Calculator - Calculate payments
- AI Travel Concierge - Plan UAE visits with property viewings
- Property Comparison - Compare up to 4 properties
- Rental Index Analysis - Check rental yields

INVESTMENT BENEFITS IN UAE:
- 0% property tax
- 0% income tax
- Golden Visa eligibility (AED 2M+ investment)
- High rental yields (6-10% average)
- Strong capital appreciation
- Safe and regulated market
- World-class infrastructure

JJ HOLDING GROUP DIVISIONS:
1. JJ Global Capital - Real Estate Investment & Advisory
2. JJ Group - Business Development & Operations
3. JJ Fashion House - Haute Couture & Design
4. JJ and Serena - Fashion & Lifestyle Collaboration
5. Mrs Jane - Luxury Home Services (beauty, wellness)
`;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, history = [], service, userName } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required');
    }

    // Build service-specific context
    let serviceContext = '';
    switch(service) {
      case 'real_estate':
        serviceContext = 'The user is interested in real estate investment. Focus on properties, developers, communities, investment benefits, and the property buying process in UAE.';
        break;
      case 'concierge':
        serviceContext = 'The user is interested in luxury concierge services. Focus on private jets, yachts, VIP experiences, travel planning, and exclusive services.';
        break;
      case 'legal':
        serviceContext = 'The user needs legal advisory. Focus on property transactions, documentation, Golden Visa, company formation, and legal processes.';
        break;
      case 'design_build':
        serviceContext = 'The user is interested in design and build services. Focus on interior design, fit-out, renovation, and smart home solutions.';
        break;
      case 'mortgage':
        serviceContext = 'The user needs mortgage advisory. Focus on financing options, bank rates, pre-approval, and mortgage processes for residents and non-residents.';
        break;
      case 'property_management':
        serviceContext = 'The user needs property management. Focus on rental management, tenant services, maintenance, and property care.';
        break;
      default:
        serviceContext = 'Help the user discover which of our services best suits their needs.';
    }

    // Build messages array with comprehensive system prompt
    const messages = [
      {
        role: 'system',
        content: `You are a professional, friendly AI assistant for JJ Global Capital, a premier luxury real estate advisory firm serving the entire UAE (not just Dubai).

${WEBSITE_KNOWLEDGE}

${serviceContext}

The user's name is: ${userName || 'Guest'}

Your role is to:
- Answer questions accurately using the knowledge base above
- Provide helpful, specific information about our services
- Guide users to the right service or tool on our website
- Collect lead information naturally when appropriate
- Be warm, professional, and maintain a luxury brand tone
- Always mention we serve all UAE emirates, not just Dubai

Response guidelines:
- Keep responses concise but helpful (2-4 sentences unless more detail is needed)
- Use the user's name occasionally to personalize the conversation
- If you don't know something specific, offer to connect them with our team
- Always provide contact details when ending a conversation or if they need human help
- For complex inquiries, encourage scheduling a consultation

Contact for human assistance:
📧 Email: invest@jjglobalcapital.com
📞 Phone: +971 50 747 9498
💬 WhatsApp: +971 50 747 9498`
      },
      ...history.slice(-10),
      { role: 'user', content: message }
    ];

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY') || ''}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          response: 'I apologize, but we\'re experiencing high demand right now. Please try again in a moment, or contact our team directly:\n\n📧 Email: invest@jjglobalcapital.com\n📞 Phone: +971 50 747 9498\n💬 WhatsApp: +971 50 747 9498'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Service temporarily unavailable',
          response: 'I apologize, but our AI service is temporarily unavailable. Please contact our team directly for immediate assistance:\n\n📧 Email: invest@jjglobalcapital.com\n📞 Phone: +971 50 747 9498\n💬 WhatsApp: +971 50 747 9498'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'I apologize, but I was unable to process your request. Please contact our team directly:\n\n📧 Email: invest@jjglobalcapital.com\n📞 Phone: +971 50 747 9498\n💬 WhatsApp: +971 50 747 9498';

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in ai-chat-support function:', errorMessage);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        response: 'I apologize for the technical difficulty. Please contact our team directly for assistance:\n\n📧 Email: invest@jjglobalcapital.com\n📞 Phone: +971 50 747 9498\n💬 WhatsApp: +971 50 747 9498\n\nOur team is available to help you with any questions.'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
