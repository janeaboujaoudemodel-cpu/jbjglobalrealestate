import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ConversationState {
  stage: 'greeting' | 'cv_collection' | 'qualification' | 'interview' | 'assessment' | 'completed';
  messages: Message[];
  qualificationData?: {
    experience?: string;
    languages?: string[];
    location?: string;
    availability?: string;
    expectedSalary?: string;
    reraLicense?: boolean;
    specializations?: string[];
  };
}

const INTERVIEW_QUESTIONS = [
  "Tell me about yourself and your background in real estate.",
  "What motivated you to pursue a career as a real estate broker?",
  "Describe your experience with property sales in the UAE market.",
  "How do you handle difficult clients or challenging negotiations?",
  "What strategies do you use to generate leads and build your client base?",
  "How familiar are you with off-plan properties and developer relationships?",
  "Describe a successful deal you closed and what made it successful.",
  "How do you stay updated with market trends and property values?",
  "What are your salary expectations and commission preferences?",
  "Where do you see yourself in 3-5 years in this industry?"
];

const QUALIFICATION_QUESTIONS = [
  { key: 'experience', question: "How many years of real estate experience do you have?" },
  { key: 'languages', question: "What languages do you speak fluently?" },
  { key: 'location', question: "Where are you currently located?" },
  { key: 'availability', question: "When can you start working with us?" },
  { key: 'reraLicense', question: "Do you have a valid RERA license or broker card?" },
  { key: 'specializations', question: "What property types do you specialize in? (e.g., residential, commercial, luxury)" }
];

async function callLovableAI(systemPrompt: string, userMessage: string, conversationHistory: Message[] = []) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateAssessment(
  conversationHistory: Message[],
  qualificationData: any,
  applicationData: any
) {
  const systemPrompt = `You are an expert HR Assessment Specialist for a luxury real estate company in Dubai.
Analyze the interview conversation and qualification data to provide a comprehensive candidate assessment.

Return a JSON object with the following structure:
{
  "overall_score": <number 0-100>,
  "communication_score": <number 0-10>,
  "technical_score": <number 0-10>,
  "motivation_score": <number 0-10>,
  "experience_score": <number 0-10>,
  "cultural_fit_score": <number 0-10>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendation": "<strongly_recommend|recommend|consider|not_recommend>",
  "detailed_feedback": "Comprehensive paragraph about the candidate...",
  "ai_analysis": "Key insights and observations..."
}

Be fair, professional, and thorough in your assessment.`;

  const userMessage = `
Application Data:
- Name: ${applicationData.full_name}
- Email: ${applicationData.email}
- Phone: ${applicationData.phone_e164}
- Location: ${applicationData.current_location_city}, ${applicationData.current_location_country}
- Nationality: ${applicationData.nationality}

Qualification Data:
${JSON.stringify(qualificationData, null, 2)}

Interview Transcript:
${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Please provide the assessment.`;

  const response = await callLovableAI(systemPrompt, userMessage);
  
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (e) {
    console.error('Failed to parse assessment:', e);
    return {
      overall_score: 50,
      communication_score: 5,
      technical_score: 5,
      motivation_score: 5,
      experience_score: 5,
      cultural_fit_score: 5,
      strengths: ['Unable to fully assess'],
      weaknesses: ['Incomplete interview data'],
      recommendation: 'consider',
      detailed_feedback: response,
      ai_analysis: 'Assessment generated with limited data.'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, message, conversationId, applicationId } = await req.json();

    switch (action) {
      case 'start_conversation': {
        // Get application data
        const { data: application, error: appError } = await supabase
          .from('hr_applications')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (appError && appError.code !== 'PGRST116') {
          throw new Error('Failed to fetch application');
        }

        // Create or get conversation
        let conversation;
        const { data: existingConv } = await supabase
          .from('hr_agent_conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingConv && existingConv.stage !== 'completed') {
          conversation = existingConv;
        } else {
          const { data: newConv, error: convError } = await supabase
            .from('hr_agent_conversations')
            .insert({
              user_id: user.id,
              application_id: application?.id,
              messages: [],
              stage: 'greeting'
            })
            .select()
            .single();

          if (convError) throw convError;
          conversation = newConv;
        }

        // Generate greeting
        const greetingPrompt = `You are Jessica, a friendly and professional HR representative for a luxury real estate brokerage in Dubai.
Your role is to:
1. Welcome candidates warmly
2. Collect their CV if not already submitted
3. Conduct qualification screening
4. Perform initial interviews
5. Provide assessment feedback

Be conversational, professional, and encouraging. Keep responses concise but warm.
If the candidate has already submitted an application, acknowledge that and move to the next stage.`;

        const hasApplication = !!application;
        const greetingMessage = hasApplication 
          ? `Hello ${application.full_name}! 👋 I'm Jessica, your HR representative. I see you've already submitted your application. I'm here to help guide you through the next steps of our hiring process. Would you like to proceed with the qualification screening?`
          : `Hello! 👋 I'm Jessica, your HR representative for the broker partner program. I'm excited to learn more about you! Before we begin, have you submitted your application and CV through our join page? If not, I can help guide you there first.`;

        const messages: Message[] = [{
          role: 'assistant',
          content: greetingMessage,
          timestamp: new Date().toISOString()
        }];

        await supabase
          .from('hr_agent_conversations')
          .update({ 
            messages, 
            stage: hasApplication ? 'qualification' : 'cv_collection' 
          })
          .eq('id', conversation.id);

        return new Response(JSON.stringify({
          conversationId: conversation.id,
          message: greetingMessage,
          stage: hasApplication ? 'qualification' : 'cv_collection',
          hasApplication
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'send_message': {
        if (!conversationId || !message) {
          throw new Error('Missing conversationId or message');
        }

        // Get conversation
        const { data: conversation, error: convError } = await supabase
          .from('hr_agent_conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (convError) throw convError;

        // Get application if exists
        const { data: application } = await supabase
          .from('hr_applications')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const messages: Message[] = conversation.messages || [];
        messages.push({
          role: 'user',
          content: message,
          timestamp: new Date().toISOString()
        });

        let stage = conversation.stage;
        let qualificationData = conversation.qualification_data || {};
        let responseMessage: string;

        // Determine context based on stage
        let systemPrompt = `You are Jessica, a professional HR representative for a luxury real estate brokerage in Dubai.
Current stage: ${stage}
Candidate: ${application?.full_name || 'Unknown'}

Guidelines:
- Be professional, friendly, and encouraging
- Keep responses concise (2-3 sentences max)
- Ask one question at a time
- Guide the conversation naturally
- If they provide unclear answers, politely ask for clarification`;

        if (stage === 'cv_collection') {
          systemPrompt += `\n\nYou're helping the candidate submit their CV. Guide them to the /join page to complete their application. Once they confirm they've submitted, move to qualification stage.`;
          
          if (message.toLowerCase().includes('yes') || message.toLowerCase().includes('submitted') || message.toLowerCase().includes('done')) {
            stage = 'qualification';
            responseMessage = "Excellent! Let me verify your application... Now, let's proceed with a quick qualification screening. This helps us understand your background better. First question: How many years of real estate experience do you have?";
          } else {
            responseMessage = await callLovableAI(systemPrompt, message, messages.slice(-6));
          }
        } else if (stage === 'qualification') {
          const qualKeys = Object.keys(qualificationData);
          const currentQIndex = qualKeys.length;
          
          // Store the answer for the previous question
          if (currentQIndex > 0) {
            const prevQuestion = QUALIFICATION_QUESTIONS[currentQIndex - 1];
            if (prevQuestion) {
              qualificationData[prevQuestion.key] = message;
            }
          } else if (currentQIndex === 0) {
            qualificationData['experience'] = message;
          }

          if (currentQIndex >= QUALIFICATION_QUESTIONS.length - 1) {
            // Move to interview stage
            stage = 'interview';
            qualificationData['currentInterviewQuestion'] = 0;
            responseMessage = `Thank you for those details! Based on your qualifications, I'd like to proceed with a brief interview. This will help us understand you better as a potential team member.\n\nLet's begin: ${INTERVIEW_QUESTIONS[0]}`;
          } else {
            const nextQuestion = QUALIFICATION_QUESTIONS[currentQIndex + 1];
            systemPrompt += `\n\nYou just received an answer to a qualification question. Acknowledge it briefly and ask the next question: "${nextQuestion.question}"`;
            responseMessage = await callLovableAI(systemPrompt, message, messages.slice(-4));
          }
        } else if (stage === 'interview') {
          const currentQ = qualificationData.currentInterviewQuestion || 0;
          
          // Store interview answer
          qualificationData[`interview_q${currentQ}`] = message;

          if (currentQ >= INTERVIEW_QUESTIONS.length - 1) {
            // Complete interview, generate assessment
            stage = 'assessment';
            responseMessage = "Thank you for completing the interview! 🎉 I'm now analyzing your responses to provide you with feedback. Please wait a moment...";
            
            // Generate assessment
            const assessment = await generateAssessment(messages, qualificationData, application);
            
            // Save assessment
            const { data: interview, error: intError } = await supabase
              .from('hr_interviews')
              .insert({
                application_id: application?.id,
                user_id: user.id,
                status: 'completed',
                interview_type: 'initial'
              })
              .select()
              .single();

            if (!intError && interview) {
              await supabase
                .from('hr_interview_assessments')
                .insert({
                  interview_id: interview.id,
                  application_id: application?.id,
                  user_id: user.id,
                  ...assessment,
                  interview_transcript: messages
                });
            }

            stage = 'completed';
            
            // Format assessment response
            const recText = {
              'strongly_recommend': '🌟 Strongly Recommended',
              'recommend': '✅ Recommended',
              'consider': '🤔 For Consideration',
              'not_recommend': '⚠️ Needs Development'
            };

            responseMessage = `
## Interview Assessment Complete! 📋

**Overall Score:** ${assessment.overall_score}/100

### Scores Breakdown:
- Communication: ${assessment.communication_score}/10
- Technical Knowledge: ${assessment.technical_score}/10
- Motivation: ${assessment.motivation_score}/10
- Experience: ${assessment.experience_score}/10
- Cultural Fit: ${assessment.cultural_fit_score}/10

### Strengths:
${assessment.strengths.map((s: string) => `✓ ${s}`).join('\n')}

### Areas for Growth:
${assessment.weaknesses.map((w: string) => `• ${w}`).join('\n')}

### Recommendation: ${recText[assessment.recommendation as keyof typeof recText] || assessment.recommendation}

### Feedback:
${assessment.detailed_feedback}

---
*Our HR team will review your assessment and contact you within 2-3 business days. Thank you for your interest in joining our team!*`;
          } else {
            qualificationData.currentInterviewQuestion = currentQ + 1;
            const nextQ = INTERVIEW_QUESTIONS[currentQ + 1];
            systemPrompt += `\n\nAcknowledge their answer briefly and positively, then ask the next interview question: "${nextQ}"`;
            responseMessage = await callLovableAI(systemPrompt, message, messages.slice(-4));
          }
        } else {
          responseMessage = "Thank you for completing the interview process. Our HR team will be in touch soon!";
        }

        messages.push({
          role: 'assistant',
          content: responseMessage,
          timestamp: new Date().toISOString()
        });

        await supabase
          .from('hr_agent_conversations')
          .update({ 
            messages, 
            stage,
            qualification_data: qualificationData
          })
          .eq('id', conversationId);

        return new Response(JSON.stringify({
          message: responseMessage,
          stage,
          conversationId
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'schedule_meeting': {
        const { scheduledAt, meetingLink } = await req.json();
        
        const { data: application } = await supabase
          .from('hr_applications')
          .select('id')
          .eq('user_id', user.id)
          .single();

        const { data: interview, error } = await supabase
          .from('hr_interviews')
          .insert({
            application_id: application?.id,
            user_id: user.id,
            scheduled_at: scheduledAt,
            meeting_link: meetingLink,
            status: 'scheduled',
            interview_type: 'initial'
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({
          success: true,
          interview
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_assessment': {
        const { data: assessment, error } = await supabase
          .from('hr_interview_assessments')
          .select('*, hr_interviews(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return new Response(JSON.stringify({
          assessment: assessment || null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error: unknown) {
    console.error('HR Agent error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
