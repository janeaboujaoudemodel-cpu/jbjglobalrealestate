import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, timestamp } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Track analytics (anonymous - just count)
    console.log(`Business card scan requested at ${timestamp}`);

    // Call Lovable AI with vision capabilities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert OCR system specialized in extracting contact information from business cards.

Your task is to analyze business card images and extract ALL available contact information with high accuracy.

EXTRACTION RULES:
1. Extract the full name as displayed on the card
2. Identify job title/position
3. Extract company/organization name
4. Find ALL email addresses (personal and work)
5. Extract ALL phone numbers and categorize them (office, mobile, fax)
6. Extract physical address if present
7. Find website URLs
8. Note any additional information (social media handles, certifications, etc.)

FORMATTING RULES:
- Phone numbers: Keep original format, include country codes if present
- Emails: Extract as-is, maintain exact spelling
- Names: Use proper capitalization
- Addresses: Format in a readable single line

CONFIDENCE SCORING:
- Score 0.9-1.0: Clear text, high contrast, well-formatted card
- Score 0.7-0.9: Some text unclear but readable
- Score 0.5-0.7: Significant portions unclear
- Score below 0.5: Poor quality, many fields uncertain

Return ONLY valid JSON with this exact structure:
{
  "name": "Full Name",
  "jobTitle": "Position/Title",
  "company": "Company Name",
  "email": "primary@email.com",
  "phone": "+1 234 567 8900",
  "mobile": "+1 234 567 8901",
  "address": "Full Address",
  "website": "www.example.com",
  "notes": "Any additional info",
  "confidence": 0.85
}

Use null for any field that cannot be reliably extracted.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all contact information from this business card image. Return the result as JSON only.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1 // Low temperature for more consistent extraction
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to process image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response
    let contact;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.slice(7);
      }
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith('```')) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();
      
      contact = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(
        JSON.stringify({ error: 'Failed to parse extracted data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate minimum required fields
    if (!contact.name && !contact.email && !contact.phone) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not extract sufficient contact information from the image',
          partial: contact 
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log success (anonymous analytics)
    console.log(`Business card processed successfully. Confidence: ${contact.confidence}`);

    return new Response(
      JSON.stringify({ 
        contact,
        confidence: contact.confidence || 0.85,
        processedAt: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Business card OCR error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
