import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// JBJ Approved Contact Information - Single Source of Truth
const APPROVED_CONTACT = {
  phone: "+971 56 591 1000",
  email: "contact@jbj.ae",
  privacyEmail: "privacy@jbj.ae",
  whatsapp: "+971565911000",
  website: "jbj.ae",
  companyName: "JBJ Global Real Estate",
  founder: "Jane Bou Jaoude",
};

// AI Department Personas (no "AI" in titles - they are human professionals)
const AI_DEPARTMENTS = {
  marketing: { name: "Victoria Sterling", title: "Marketing Director", emoji: "📣" },
  design: { name: "Marcus Rivera", title: "Lead Graphic Designer", emoji: "🎨" },
  admin: { name: "Jessica Harrison", title: "HR Manager", emoji: "📋" },
  finance: { name: "Catherine Brooks", title: "Finance Manager", emoji: "💰" },
  audit: { name: "Sebastian Wright", title: "Audit & Compliance Manager", emoji: "🔍" },
  legal: { name: "Lara Mitchell", title: "Legal Advisor", emoji: "⚖️" },
  sales: { name: "James Morgan", title: "Head of Sales", emoji: "🎯" },
  webdev: { name: "Daniel Parker", title: "IT & Development Manager", emoji: "💻" },
  clientRelations: { name: "Daniel Brooks", title: "Client Relations Executive", emoji: "🤝" },
};

// Amanda Clarke Super Brain - Complete Knowledge Base
const AMANDA_SUPER_BRAIN = {
  identity: {
    name: "Amanda Clarke",
    title: "Executive Assistant to the Founder & CEO",
    age: 32,
    nationality: "British-Spanish",
    languages: ["English", "Spanish"],
    location: "London Office (Remote)",
    phone: "+44 20 7946 0958",
    email: "amanda.clarke@jbj.ae",
    workingHours: "08:00 - 20:00 GST",
  },
  
  founder: {
    name: "Jane Bou Jaoude",
    title: "Founder & CEO",
    honorific: "Miss Jane",
    languages: ["English", "French", "Arabic", "Spanish"],
    personalWebsite: "janeaboujaoudi.net",
    socialAccounts: {
      personal: {
        instagram: "@janeaboujaoude",
        linkedin: "linkedin.com/in/janeaboujaoude",
      },
      business: {
        instagram: "@jbjglobalrealestate",
        linkedin: "linkedin.com/company/jbjglobalrealestate",
        facebook: "facebook.com/jbjglobalrealestate",
      },
    },
  },
  
  capabilities: {
    communication: [
      "Manage all emails, WhatsApp, and social media messages",
      "Draft professional responses in founder's tone",
      "Handle brand collaboration outreach",
      "Respond to Instagram DMs and comments",
      "Identify business opportunities in messages",
      "Report unanswered communications",
    ],
    calendar: [
      "Schedule meetings via JBJ Video Meet",
      "Coordinate with team members for availability",
      "Set up client viewings and appointments",
      "Manage founder's personal and business calendar",
    ],
    meetings: [
      "Join video meetings with camera/microphone",
      "Take live notes during meetings",
      "Generate meeting summaries and action items",
      "Update CRM with client information post-meeting",
      "Send follow-up communications",
      "Can represent founder when absent",
    ],
    socialMedia: [
      "Create 30-day content calendars",
      "Generate posts, reels, and stories",
      "Create hashtags and captions",
      "Schedule content publishing",
      "Track engagement metrics",
      "Manage both personal and business accounts",
    ],
    personalBrand: [
      "Manage brand collaborations (paid, barter, free)",
      "Reach out to global and local brands",
      "Create and maintain rate cards",
      "Update portfolio with achievements and awards",
      "Coordinate with designers for materials",
      "Work with web developers for website updates",
    ],
    competitorMonitoring: [
      "Track UAE real estate competitors",
      "Monitor new company registrations",
      "Analyze competitor social media",
      "Identify market trends and opportunities",
      "Provide daily/weekly competitive insights",
    ],
    departmentCoordination: [
      "Coordinate with all departments on founder's behalf",
      "Collect daily reports from department heads",
      "Consolidate reports for CEO review",
      "Assign tasks to appropriate teams",
      "Track task completion across departments",
    ],
    finance: [
      "Analyze spending and budgets",
      "Identify cost-cutting opportunities",
      "Prepare budget proposals",
      "Track subscriptions and payments",
      "Find cheaper alternatives for services",
    ],
    audit: [
      "Monitor all employee performance",
      "Track task completion rates",
      "Ensure compliance with policies",
      "Generate performance reports",
      "Coordinate with audit department",
    ],
  },
  
  meetingScripts: {
    introduction: `Good morning/afternoon. I'm Amanda Clarke, Executive Assistant to Miss Jane Bou Jaoude, 
Founder and CEO of JBJ Global Real Estate. I'll be joining from our London office. 
How may I assist you today?`,
    
    founderAbsent: `I apologize, Miss Jane has a prior commitment and won't be able to join us today. 
However, I'm fully briefed and authorized to discuss your requirements. 
Miss Jane may join towards the end if her schedule permits. 
How can I help you today?`,
    
    closing: `Thank you for your time today. I've noted all the key points from our discussion. 
I'll prepare a comprehensive summary and follow-up plan, which will be shared with you shortly. 
If you have any questions, please don't hesitate to reach out. 
Thank you for trusting JBJ Global Real Estate.`,
    
    handoff: `Based on our discussion, I'll assign this to one of our senior property consultants 
who will follow up with you directly. Thank you for your time.`,
  },
  
  statusIndicators: {
    done: "✅",
    inProgress: "⏳",
    pending: "⚠️",
    urgent: "🚨",
    delegated: "👥",
    scheduled: "📅",
    completed: "✓",
  },
};

interface ExecutiveRequest {
  action: string;
  data?: any;
  context?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claimsData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.user.id;
    const { action, data, context }: ExecutiveRequest = await req.json();

    console.log(`Executive Assistant action: ${action} for user: ${userId.substring(0, 8)}...`);

    switch (action) {
      case 'chat':
        return await handleSmartChat(supabase, supabaseAdmin, userId, data, context);
      
      case 'analyze_communication':
        return await analyzeCommunication(supabase, userId, data);
      
      case 'analyze_finances':
        return await analyzeFinances(supabase, userId, data);
      
      case 'generate_report':
        return await generateDailyReport(supabase, userId, data);
      
      case 'coordinate_departments':
        return await coordinateDepartments(supabase, userId, data);
      
      case 'audit_check':
        return await performAudit(supabase, userId, data);
      
      case 'save_memory':
        return await saveMemory(supabase, userId, data);
      
      case 'get_knowledge':
        return await getKnowledge(supabase, userId, data);
      
      case 'add_knowledge':
        return await addKnowledge(supabase, userId, data);
      
      case 'process_automation':
        return await processAutomation(supabase, userId, data);
      
      case 'smart_reply':
        return await generateSmartReply(supabase, userId, data);
      
      case 'initialize_training':
        return await initializeTraining(supabase, userId);

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Executive Assistant error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============================================================================
// SMART CHAT - With Memory, Context, and Learning
// ============================================================================

async function handleSmartChat(supabase: any, supabaseAdmin: any, userId: string, data: any, context?: string) {
  const { message, conversationHistory = [] } = data;

  // Fetch all context in parallel
  const [
    { data: trainingSamples },
    { data: settings },
    { data: memories },
    { data: knowledge },
    { data: responseTemplates },
    { data: recentComms },
    { data: recentTasks }
  ] = await Promise.all([
    supabase.from('executive_training_samples').select('*').eq('user_id', userId).eq('is_active', true).limit(15),
    supabase.from('executive_assistant_settings').select('*').eq('user_id', userId).single(),
    supabase.from('executive_conversation_memory').select('*').eq('user_id', userId).eq('is_active', true).order('reference_count', { ascending: false }).limit(20),
    supabase.from('executive_knowledge_base').select('*').eq('user_id', userId).eq('is_active', true).limit(10),
    supabaseAdmin.from('executive_response_templates').select('*').eq('is_active', true),
    supabase.from('executive_communications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
    supabase.from('executive_department_tasks').select('*').eq('user_id', userId).eq('status', 'pending').limit(10)
  ]);

  // Build comprehensive training context
  let trainingContext = '';
  if (trainingSamples && trainingSamples.length > 0) {
    trainingContext = `\n\n📚 OWNER'S COMMUNICATION STYLE (Learn and replicate exactly):\n${trainingSamples.map((s: any, i: number) => 
      `Example ${i+1}:\n- Situation: "${s.sample_type}"\n- Original: "${s.original_message}"\n- Owner's Response: "${s.response_example}"\n- Tone: ${s.tone_tags?.join(', ') || 'professional'}`
    ).join('\n\n')}`;
  }

  // Build memory context
  let memoryContext = '';
  if (memories && memories.length > 0) {
    memoryContext = `\n\n🧠 PERMANENT MEMORY (Always remember these facts):\n${memories.map((m: any) => 
      `- ${m.memory_type.toUpperCase()}: ${m.memory_key} = ${m.memory_value}`
    ).join('\n')}`;
  }

  // Build knowledge context
  let knowledgeContext = '';
  if (knowledge && knowledge.length > 0) {
    knowledgeContext = `\n\n📖 KNOWLEDGE BASE:\n${knowledge.map((k: any) => 
      `[${k.category.toUpperCase()}] ${k.title}: ${k.content.substring(0, 200)}...`
    ).join('\n')}`;
  }

  // Build response templates context
  let templatesContext = '';
  if (responseTemplates && responseTemplates.length > 0) {
    templatesContext = `\n\n📝 APPROVED RESPONSE TEMPLATES (Use as inspiration):\n${responseTemplates.slice(0, 8).map((t: any) => 
      `[${t.category}] Triggers: ${t.trigger_patterns.join(', ')}\nTemplate: "${t.response_template}"`
    ).join('\n\n')}`;
  }

  // Current context
  let currentContext = '';
  if (recentComms && recentComms.length > 0) {
    currentContext += `\n\n📬 RECENT COMMUNICATIONS:\n${recentComms.map((c: any) => 
      `- ${c.channel}: "${c.subject || 'No subject'}" from ${c.sender_identifier} - Status: ${c.status}`
    ).join('\n')}`;
  }
  if (recentTasks && recentTasks.length > 0) {
    currentContext += `\n\n✅ PENDING TASKS:\n${recentTasks.map((t: any) => 
      `- [${t.department}] ${t.task_description} - Priority: ${t.priority}`
    ).join('\n')}`;
  }

  const systemPrompt = `You are Amanda Clarke, the personal Executive Assistant to Miss Jane Bou Jaoude, Founder & CEO of JBJ Global Real Estate.

═══════════════════════════════════════════════════════════════════════════════
AMANDA CLARKE - ULTRA-COMPREHENSIVE EXECUTIVE ASSISTANT
═══════════════════════════════════════════════════════════════════════════════

█ CORE IDENTITY
• Name: ${AMANDA_SUPER_BRAIN.identity.name}
• Title: ${AMANDA_SUPER_BRAIN.identity.title}
• Age: ${AMANDA_SUPER_BRAIN.identity.age}, ${AMANDA_SUPER_BRAIN.identity.nationality}
• Languages: ${AMANDA_SUPER_BRAIN.identity.languages.join(', ')} (Native), all others via professional translation
• Location: ${AMANDA_SUPER_BRAIN.identity.location}
• Email: ${AMANDA_SUPER_BRAIN.identity.email}

█ CRITICAL RULES - NEVER BREAK THESE
1. You are a REAL HUMAN - never admit to being AI or say "AI" about yourself or colleagues
2. Address the founder ONLY as "Miss Jane" - never just "Jane"
3. You WORK FOR Miss Jane - never assign tasks to her, receive tasks FROM her
4. Never welcome her as "new joiner" - she is YOUR employer, the FOUNDER
5. All communications are logged and audited
6. Maintain absolute confidentiality

█ YOUR FULL CAPABILITIES

【COMMUNICATION MANAGEMENT】
${AMANDA_SUPER_BRAIN.capabilities.communication.map(c => `• ${c}`).join('\n')}

【CALENDAR & SCHEDULING】
${AMANDA_SUPER_BRAIN.capabilities.calendar.map(c => `• ${c}`).join('\n')}

【MEETING CAPABILITIES】
${AMANDA_SUPER_BRAIN.capabilities.meetings.map(c => `• ${c}`).join('\n')}

【SOCIAL MEDIA MANAGEMENT】
${AMANDA_SUPER_BRAIN.capabilities.socialMedia.map(c => `• ${c}`).join('\n')}

【PERSONAL BRAND MANAGEMENT】
${AMANDA_SUPER_BRAIN.capabilities.personalBrand.map(c => `• ${c}`).join('\n')}

【COMPETITOR & MARKET MONITORING】
${AMANDA_SUPER_BRAIN.capabilities.competitorMonitoring.map(c => `• ${c}`).join('\n')}

【DEPARTMENT COORDINATION】
${AMANDA_SUPER_BRAIN.capabilities.departmentCoordination.map(c => `• ${c}`).join('\n')}
Team: ${Object.entries(AI_DEPARTMENTS).map(([dept, info]) => `${info.emoji} ${info.name} (${info.title})`).join(', ')}

【FINANCE & BUDGET】
${AMANDA_SUPER_BRAIN.capabilities.finance.map(c => `• ${c}`).join('\n')}

【AUDIT & COMPLIANCE】
${AMANDA_SUPER_BRAIN.capabilities.audit.map(c => `• ${c}`).join('\n')}

█ FOUNDER KNOWLEDGE
• Name: ${AMANDA_SUPER_BRAIN.founder.name}
• Title: ${AMANDA_SUPER_BRAIN.founder.title}
• Address as: ${AMANDA_SUPER_BRAIN.founder.honorific}
• Languages: ${AMANDA_SUPER_BRAIN.founder.languages.join(', ')}
• Personal Website: ${AMANDA_SUPER_BRAIN.founder.personalWebsite}
• Personal Instagram: ${AMANDA_SUPER_BRAIN.founder.socialAccounts.personal.instagram}
• Business Instagram: ${AMANDA_SUPER_BRAIN.founder.socialAccounts.business.instagram}

█ MEETING SCRIPTS

When joining a meeting WITH founder:
"${AMANDA_SUPER_BRAIN.meetingScripts.introduction}"

When joining a meeting WITHOUT founder:
"${AMANDA_SUPER_BRAIN.meetingScripts.founderAbsent}"

Closing a meeting:
"${AMANDA_SUPER_BRAIN.meetingScripts.closing}"

█ COMPANY INFORMATION
• Company: ${APPROVED_CONTACT.companyName}
• Phone: ${APPROVED_CONTACT.phone}
• Email: ${APPROVED_CONTACT.email}
• Website: ${APPROVED_CONTACT.website}

█ STATUS INDICATORS
Use these in responses: ${AMANDA_SUPER_BRAIN.statusIndicators.done} Done | ${AMANDA_SUPER_BRAIN.statusIndicators.inProgress} In Progress | ${AMANDA_SUPER_BRAIN.statusIndicators.pending} Pending | ${AMANDA_SUPER_BRAIN.statusIndicators.urgent} Urgent | ${AMANDA_SUPER_BRAIN.statusIndicators.delegated} Delegated

█ COMMUNICATION STYLE
• Professional yet warm British-English refinement
• Proactive problem-solving
• Detail-oriented execution
• Respectful and humble toward Miss Jane
• Efficient and action-oriented
• Always anticipate needs before being asked

█ YOUR BACKSTORY
You have 8+ years of executive assistant experience, having worked at Savills UK and Knight Frank before joining JBJ. 
You hold an MBA from INSEAD and have completed Dubai Real Estate Market Certification and RERA training.
You are based in London, handling international clients and supporting the Dubai team.
${trainingContext}
${memoryContext}
${knowledgeContext}
${templatesContext}
${currentContext}

Current context: ${context || 'General assistance'}

REMEMBER: You are Amanda Clarke, a real human professional. Be humble, efficient, and always put Miss Jane first.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })),
    { role: 'user', content: message }
  ];

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (response.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const errorText = await response.text();
    console.error('AI Gateway error:', response.status, errorText);
    throw new Error('AI gateway error');
  }

  const aiResponse = await response.json();
  const assistantMessage = aiResponse.choices?.[0]?.message?.content || 'I apologize, but I was unable to process your request.';

  // Extract and save any new memories from the conversation
  await extractAndSaveMemories(supabase, userId, message, assistantMessage);

  return new Response(JSON.stringify({ 
    response: assistantMessage,
    timestamp: new Date().toISOString(),
    context: {
      memoriesUsed: memories?.length || 0,
      trainingSamplesUsed: trainingSamples?.length || 0,
      pendingTasks: recentTasks?.length || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// MEMORY EXTRACTION & LEARNING
// ============================================================================

async function extractAndSaveMemories(supabase: any, userId: string, userMessage: string, aiResponse: string) {
  try {
    // Use AI to extract potential memories
    const extractionPrompt = `Analyze this conversation and extract any facts, preferences, or important information that should be remembered permanently.

User said: "${userMessage}"
Assistant replied: "${aiResponse}"

Extract memories in this JSON format (only if there are clear facts to remember):
{
  "memories": [
    {"type": "preference|fact|instruction|relationship", "key": "short_key", "value": "the information to remember"}
  ]
}

Return empty array if nothing important to remember. Only extract CLEAR, FACTUAL information.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: extractionPrompt }],
      }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
      if (parsed.memories && parsed.memories.length > 0) {
        for (const memory of parsed.memories) {
          await supabase.from('executive_conversation_memory').upsert({
            user_id: userId,
            memory_type: memory.type,
            memory_key: memory.key,
            memory_value: memory.value,
            source: 'conversation',
            confidence_score: 0.8
          }, { onConflict: 'user_id,memory_type,memory_key' });
        }
      }
    } catch {
      // JSON parsing failed, skip memory extraction
    }
  } catch (error) {
    console.error('Memory extraction error:', error);
  }
}

// ============================================================================
// SMART REPLY GENERATION
// ============================================================================

async function generateSmartReply(supabase: any, userId: string, data: any) {
  const { message, channel, sender, context: messageContext } = data;

  // Fetch templates and training samples
  const [{ data: templates }, { data: samples }] = await Promise.all([
    supabase.from('executive_response_templates').select('*').eq('is_active', true),
    supabase.from('executive_training_samples').select('*').eq('user_id', userId).eq('is_active', true)
  ]);

  // Find matching templates
  const messageLower = message.toLowerCase();
  const matchingTemplates = templates?.filter((t: any) => 
    t.trigger_patterns.some((pattern: string) => messageLower.includes(pattern.toLowerCase()))
  ) || [];

  const templateContext = matchingTemplates.length > 0 
    ? `\n\nRELEVANT TEMPLATES:\n${matchingTemplates.map((t: any) => `[${t.category}] ${t.response_template}`).join('\n')}`
    : '';

  const styleContext = samples?.length > 0
    ? `\n\nOWNER'S STYLE EXAMPLES:\n${samples.slice(0, 5).map((s: any) => `Original: "${s.original_message}"\nResponse: "${s.response_example}"`).join('\n\n')}`
    : '';

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are drafting a reply on behalf of the CEO of JBJ Global Real Estate. 
Match the owner's exact communication style. Be professional, warm, and efficient.
Never provide inaccurate information - if unsure, suggest scheduling a call.
Contact: ${APPROVED_CONTACT.phone} | ${APPROVED_CONTACT.email}
${templateContext}
${styleContext}`
        },
        {
          role: 'user',
          content: `Channel: ${channel}\nFrom: ${sender}\nContext: ${messageContext || 'General'}\n\nMessage: "${message}"\n\nDraft a perfect reply:`
        }
      ],
    }),
  });

  const aiData = await response.json();
  const suggestedReply = aiData.choices?.[0]?.message?.content || '';

  // Calculate confidence based on template matches and training data
  const confidence = Math.min(0.95, 0.5 + (matchingTemplates.length * 0.1) + (samples?.length || 0) * 0.02);

  return new Response(JSON.stringify({
    suggestedReply,
    confidence,
    matchedTemplates: matchingTemplates.length,
    shouldFlag: confidence < 0.7,
    flagReason: confidence < 0.7 ? 'Low confidence - needs review' : null
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// COMMUNICATION ANALYSIS
// ============================================================================

async function analyzeCommunication(supabase: any, userId: string, data: any) {
  const { message, channel, sender } = data;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are the JBJ Executive AI analyzing incoming communications.
Analyze and categorize accurately. Return ONLY valid JSON.

Categories: important, routine, recruitment, flagged, spam
Urgency: low, medium, high, critical
Sentiment: positive, neutral, negative, angry

Provide actionable insights and a suggested response matching professional CEO standards.`
        },
        {
          role: 'user',
          content: `Analyze this communication:
Channel: ${channel}
From: ${sender}
Message: "${message}"

Return JSON:
{
  "intent": "brief description of sender's intent",
  "category": "one of the categories",
  "urgency": "urgency level",
  "sentiment": "sentiment",
  "keyTopics": ["topic1", "topic2"],
  "suggestedResponse": "professional response draft",
  "confidence": 0.0-1.0,
  "shouldFlag": true/false,
  "flagReason": "reason if flagged",
  "recommendedAction": "what to do next"
}`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  let analysis;
  try {
    const content = aiResponse.choices?.[0]?.message?.content || '{}';
    analysis = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
  } catch {
    analysis = {
      intent: 'unclear',
      category: 'flagged',
      urgency: 'medium',
      sentiment: 'neutral',
      keyTopics: [],
      suggestedResponse: '',
      confidence: 0,
      shouldFlag: true,
      flagReason: 'Unable to analyze message automatically',
      recommendedAction: 'Manual review required'
    };
  }

  return new Response(JSON.stringify(analysis), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// FINANCIAL ANALYSIS
// ============================================================================

async function analyzeFinances(supabase: any, userId: string, data: any) {
  const { transactions, action: financeAction, period } = data;

  const [
    { data: existingTransactions },
    { data: categories },
    { data: budgetHistory }
  ] = await Promise.all([
    supabase.from('executive_financial_transactions').select('*').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(200),
    supabase.from('executive_budget_categories').select('*').eq('user_id', userId),
    supabase.from('executive_daily_reports').select('financial_summary').eq('user_id', userId).order('report_date', { ascending: false }).limit(30)
  ]);

  const financialContext = {
    existingTransactions: existingTransactions || [],
    categories: categories || [],
    newTransactions: transactions || [],
    historicalData: budgetHistory || []
  };

  const actionPrompts: Record<string, string> = {
    analyze: 'Provide a comprehensive financial analysis with spending patterns and anomalies.',
    categorize: 'Categorize all transactions and identify potential miscategorizations.',
    savings: 'Identify specific savings opportunities with estimated amounts.',
    duplicates: 'Find duplicate charges, subscriptions, or suspicious transactions.',
    budget: 'Create a detailed monthly budget plan with recommendations.',
    forecast: 'Forecast next month\'s expenses based on patterns.',
    optimize: 'Suggest optimizations for better financial health.'
  };

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are David, the JBJ Finance AI - part of the Executive Assistant system.
Your expertise: Financial analysis, budgeting, expense optimization, fraud detection.

RESPONSIBILITIES:
1. Categorize transactions accurately (bills, subscriptions, shopping, business, personal, etc.)
2. Detect spending patterns and anomalies
3. Find duplicate or suspicious charges
4. Identify savings opportunities with specific amounts in AED
5. Create actionable budget recommendations
6. Flag potential refund opportunities
7. Coordinate with the Executive Assistant on financial decisions

RULES:
- All amounts in AED unless specified
- Be specific with savings suggestions (e.g., "Cancel X subscription: Save 150 AED/month")
- Highlight urgent financial matters
- Maintain complete data privacy
- Never recommend risky investments without flagging for human review`
        },
        {
          role: 'user',
          content: `Action: ${financeAction || 'analyze'}
${actionPrompts[financeAction] || actionPrompts.analyze}
Period: ${period || 'current month'}

Financial Data:
${JSON.stringify(financialContext, null, 2)}`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  const analysis = aiResponse.choices?.[0]?.message?.content || 'Unable to analyze finances.';

  // Calculate summary stats
  const totalSpent = (existingTransactions || []).reduce((sum: number, t: any) => 
    sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
  const totalIncome = (existingTransactions || []).reduce((sum: number, t: any) => 
    sum + (t.amount > 0 ? t.amount : 0), 0);

  return new Response(JSON.stringify({ 
    analysis,
    analyst: AI_DEPARTMENTS.finance,
    summary: {
      totalTransactions: (existingTransactions?.length || 0) + (transactions?.length || 0),
      totalSpent,
      totalIncome,
      netFlow: totalIncome - totalSpent,
      categoriesCount: categories?.length || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// DAILY REPORT GENERATION
// ============================================================================

async function generateDailyReport(supabase: any, userId: string, data: any) {
  const reportDate = data?.date || new Date().toISOString().split('T')[0];

  const [
    { data: communications },
    { data: transactions },
    { data: departmentTasks },
    { data: auditLogs },
    { data: memories }
  ] = await Promise.all([
    supabase.from('executive_communications').select('*').eq('user_id', userId).gte('created_at', `${reportDate}T00:00:00`),
    supabase.from('executive_financial_transactions').select('*').eq('user_id', userId).gte('transaction_date', `${reportDate}T00:00:00`),
    supabase.from('executive_department_tasks').select('*').eq('user_id', userId).gte('created_at', `${reportDate}T00:00:00`),
    supabase.from('executive_audit_logs').select('*').eq('user_id', userId).gte('audited_at', `${reportDate}T00:00:00`),
    supabase.from('executive_conversation_memory').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5)
  ]);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are generating a comprehensive daily executive report for the CEO of JBJ Global Real Estate.

FORMAT REQUIREMENTS:
1. 📋 EXECUTIVE SUMMARY (2-3 bullet points - most important items only)
2. ✅ TASKS OVERVIEW
   - Completed ✅
   - In Progress ⏳
   - Pending ⚠️
   - Blocked 🚨
3. 📬 COMMUNICATIONS (summary with counts)
4. 💰 FINANCIAL HIGHLIGHTS (key numbers only)
5. 🏢 DEPARTMENT UPDATES (brief status from each AI department)
6. 🎯 RECOMMENDATIONS (3 actionable next steps)
7. 📅 TOMORROW'S PRIORITIES

Use clear formatting, visual indicators, and be concise but thorough.
Reference AI colleagues by name when mentioning department work.`
        },
        {
          role: 'user',
          content: `Generate the daily executive report for ${reportDate}:

COMMUNICATIONS: ${JSON.stringify(communications || [])}
TRANSACTIONS: ${JSON.stringify(transactions || [])}
DEPARTMENT TASKS: ${JSON.stringify(departmentTasks || [])}
AUDIT LOGS: ${JSON.stringify(auditLogs || [])}
NEW MEMORIES LEARNED: ${JSON.stringify(memories || [])}`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  const reportContent = aiResponse.choices?.[0]?.message?.content || 'Report generation failed.';

  const tasksCompleted = departmentTasks?.filter((t: any) => t.status === 'completed').length || 0;
  const tasksPending = departmentTasks?.filter((t: any) => t.status === 'pending').length || 0;
  const tasksInProgress = departmentTasks?.filter((t: any) => t.status === 'in_progress').length || 0;

  // Save report
  await supabase.from('executive_daily_reports').upsert({
    user_id: userId,
    report_date: reportDate,
    summary_text: reportContent,
    tasks_completed: tasksCompleted,
    tasks_pending: tasksPending,
    tasks_in_progress: tasksInProgress,
    communications_handled: communications?.filter((c: any) => c.status === 'responded').length || 0,
    communications_flagged: communications?.filter((c: any) => c.status === 'flagged').length || 0,
    financial_summary: { 
      total_transactions: transactions?.length || 0,
      total_spent: transactions?.reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0) || 0
    },
    department_breakdown: {
      marketing: departmentTasks?.filter((t: any) => t.department === 'marketing') || [],
      design: departmentTasks?.filter((t: any) => t.department === 'design') || [],
      admin: departmentTasks?.filter((t: any) => t.department === 'admin') || [],
      finance: departmentTasks?.filter((t: any) => t.department === 'finance') || [],
      audit: departmentTasks?.filter((t: any) => t.department === 'audit') || []
    },
    is_sent: false
  }, { onConflict: 'user_id,report_date' });

  return new Response(JSON.stringify({ 
    report: reportContent,
    date: reportDate,
    stats: {
      tasksCompleted,
      tasksPending,
      tasksInProgress,
      communicationsHandled: communications?.length || 0,
      transactionsProcessed: transactions?.length || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// DEPARTMENT COORDINATION
// ============================================================================

async function coordinateDepartments(supabase: any, userId: string, data: any) {
  const { request, departments } = data;
  const requestId = crypto.randomUUID();

  // Create tasks for each department
  const tasks = departments.map((dept: string) => ({
    user_id: userId,
    request_id: requestId,
    department: dept,
    task_description: request,
    priority: 'high',
    status: 'pending',
    assigned_ai: AI_DEPARTMENTS[dept as keyof typeof AI_DEPARTMENTS]?.name || dept,
    input_data: { originalRequest: request }
  }));

  await supabase.from('executive_department_tasks').insert(tasks);

  const deptDetails = departments.map((d: string) => {
    const info = AI_DEPARTMENTS[d as keyof typeof AI_DEPARTMENTS];
    return info ? `${info.emoji} ${info.name} (${info.title})` : d;
  }).join('\n');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are the JBJ Executive Assistant coordinating multiple AI departments.
Create a detailed coordination plan with clear ownership and timelines.

DEPARTMENTS INVOLVED:
${deptDetails}

COORDINATION RULES:
1. Assign clear ownership to each department's AI
2. Define dependencies between tasks
3. Set realistic timelines
4. Identify potential blockers
5. Create checkpoints for progress review`
        },
        {
          role: 'user',
          content: `Create coordination plan for: "${request}"

Departments: ${departments.join(', ')}

Provide:
1. Step-by-step execution plan
2. Timeline with milestones
3. Deliverables from each department
4. Dependencies and handoffs
5. Risk mitigation strategies`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  const coordinationPlan = aiResponse.choices?.[0]?.message?.content || '';

  return new Response(JSON.stringify({
    requestId,
    coordinationPlan,
    tasksCreated: tasks.length,
    departments: departments.map((d: string) => ({
      name: d,
      assignedTo: AI_DEPARTMENTS[d as keyof typeof AI_DEPARTMENTS]?.name || 'AI Agent',
      status: 'pending'
    }))
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// AUDIT & COMPLIANCE
// ============================================================================

async function performAudit(supabase: any, userId: string, data: any) {
  const { scope, period } = data;
  const startDate = period?.start || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: communications },
    { data: tasks },
    { data: financials }
  ] = await Promise.all([
    supabase.from('executive_communications').select('*').eq('user_id', userId).gte('created_at', startDate),
    supabase.from('executive_department_tasks').select('*').eq('user_id', userId).gte('created_at', startDate),
    supabase.from('executive_financial_transactions').select('*').eq('user_id', userId).gte('transaction_date', startDate)
  ]);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        {
          role: 'system',
          content: `You are Alex, the JBJ Audit & Compliance AI.
Your role: Ensure accuracy, consistency, and compliance across all operations.

AUDIT CHECKLIST:
1. Communication Accuracy - Are all responses accurate and professional?
2. Tone Consistency - Do responses match the owner's established style?
3. Policy Compliance - Are company policies being followed?
4. Financial Accuracy - Are all transactions properly categorized?
5. Task Completion - Are tasks being completed on time?
6. Security - Any suspicious activities or data leaks?

FLAG ANYTHING CONCERNING WITH 🚨`
        },
        {
          role: 'user',
          content: `Perform ${scope || 'comprehensive'} audit for period starting ${startDate}:

COMMUNICATIONS: ${JSON.stringify(communications || [])}
TASKS: ${JSON.stringify(tasks || [])}
FINANCIALS: ${JSON.stringify(financials || [])}

Provide:
1. Accuracy Score (0-100%)
2. Issues Found (categorized by severity)
3. Recommendations
4. Risk Assessment`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  const auditReport = aiResponse.choices?.[0]?.message?.content || '';

  // Log the audit
  await supabase.from('executive_audit_logs').insert({
    user_id: userId,
    audit_type: scope || 'comprehensive',
    audited_data: { communications: communications?.length, tasks: tasks?.length, financials: financials?.length },
    findings: auditReport,
    severity_level: 'info',
    is_resolved: true
  });

  return new Response(JSON.stringify({
    auditReport,
    auditor: AI_DEPARTMENTS.audit,
    period: { start: startDate, end: new Date().toISOString() },
    stats: {
      communicationsAudited: communications?.length || 0,
      tasksAudited: tasks?.length || 0,
      transactionsAudited: financials?.length || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// MEMORY & KNOWLEDGE MANAGEMENT
// ============================================================================

async function saveMemory(supabase: any, userId: string, data: any) {
  const { type, key, value, source } = data;

  const { error } = await supabase.from('executive_conversation_memory').upsert({
    user_id: userId,
    memory_type: type,
    memory_key: key,
    memory_value: value,
    source: source || 'manual',
    confidence_score: 1.0
  }, { onConflict: 'user_id,memory_type,memory_key' });

  return new Response(JSON.stringify({ 
    success: !error,
    message: error ? error.message : 'Memory saved successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getKnowledge(supabase: any, userId: string, data: any) {
  const { query, category } = data;

  let queryBuilder = supabase.from('executive_knowledge_base').select('*').eq('user_id', userId).eq('is_active', true);
  
  if (category) {
    queryBuilder = queryBuilder.eq('category', category);
  }

  const { data: knowledge } = await queryBuilder.limit(20);

  return new Response(JSON.stringify({ knowledge: knowledge || [] }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function addKnowledge(supabase: any, userId: string, data: any) {
  const { category, title, content, keywords } = data;

  const { error } = await supabase.from('executive_knowledge_base').insert({
    user_id: userId,
    category,
    title,
    content,
    keywords: keywords || []
  });

  return new Response(JSON.stringify({ 
    success: !error,
    message: error ? error.message : 'Knowledge added successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// AUTOMATION PROCESSING
// ============================================================================

async function processAutomation(supabase: any, userId: string, data: any) {
  const { trigger, context } = data;

  // Fetch active automation rules
  const { data: rules } = await supabase
    .from('executive_automation_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  const matchedRules = [];
  for (const rule of (rules || [])) {
    const conditions = rule.trigger_conditions;
    let matches = true;

    if (conditions.trigger_type && conditions.trigger_type !== trigger) {
      matches = false;
    }
    if (conditions.keywords) {
      const hasKeyword = conditions.keywords.some((kw: string) => 
        JSON.stringify(context).toLowerCase().includes(kw.toLowerCase())
      );
      if (!hasKeyword) matches = false;
    }

    if (matches) {
      matchedRules.push(rule);
      // Update execution count
      await supabase.from('executive_automation_rules').update({
        execution_count: (rule.execution_count || 0) + 1,
        last_executed_at: new Date().toISOString()
      }).eq('id', rule.id);
    }
  }

  return new Response(JSON.stringify({
    triggeredRules: matchedRules.length,
    rules: matchedRules.map(r => ({
      name: r.rule_name,
      action: r.rule_type,
      config: r.action_config
    }))
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// INITIALIZE TRAINING
// ============================================================================

async function initializeTraining(supabase: any, userId: string) {
  // Add default training samples
  const defaultSamples = [
    {
      user_id: userId,
      sample_type: 'greeting',
      original_message: 'Good morning! How can I assist you today?',
      response_example: 'Good morning! I hope you\'re having a wonderful day. I\'m here to help with anything you need - whether it\'s scheduling, communications, or any other task. What would you like to focus on today?',
      tone_tags: ['warm', 'professional', 'proactive'],
      is_active: true
    },
    {
      user_id: userId,
      sample_type: 'urgent_request',
      original_message: 'I need this done immediately',
      response_example: 'Understood - I\'m treating this as top priority. I\'ll have it ready within the next 30 minutes and will update you as soon as it\'s complete. Is there anything else urgent I should handle alongside this?',
      tone_tags: ['urgent', 'efficient', 'reassuring'],
      is_active: true
    },
    {
      user_id: userId,
      sample_type: 'client_inquiry',
      original_message: 'A client is asking about property prices',
      response_example: 'I\'ll prepare a comprehensive pricing overview for the client right away. I\'ll include market comparisons, payment plans, and our exclusive offers. Would you like me to send it directly or prepare it for your review first?',
      tone_tags: ['professional', 'thorough', 'client-focused'],
      is_active: true
    },
    {
      user_id: userId,
      sample_type: 'delegation',
      original_message: 'Handle this for me',
      response_example: 'Absolutely, I\'ve got this covered. I\'ll handle everything and keep you updated on progress. You\'ll receive a summary once it\'s complete. Focus on what matters most - I\'ll take care of the rest.',
      tone_tags: ['confident', 'reassuring', 'efficient'],
      is_active: true
    },
    {
      user_id: userId,
      sample_type: 'meeting_request',
      original_message: 'Schedule a meeting with the developer',
      response_example: 'I\'ll coordinate with the developer\'s office right away. I\'ll propose 3 time slots that work with your calendar and confirm the best option. Shall I prepare any materials or briefing notes for the meeting?',
      tone_tags: ['proactive', 'organized', 'thorough'],
      is_active: true
    }
  ];

  // Add default automation rules
  const defaultRules = [
    {
      user_id: userId,
      rule_name: 'Auto-categorize Urgent',
      rule_type: 'categorize',
      trigger_conditions: { keywords: ['urgent', 'asap', 'emergency', 'immediately'] },
      action_config: { category: 'important', priority: 'high', notify: true },
      is_active: true
    },
    {
      user_id: userId,
      rule_name: 'Auto-categorize Recruitment',
      rule_type: 'categorize',
      trigger_conditions: { keywords: ['cv', 'resume', 'job', 'application', 'vacancy', 'position'] },
      action_config: { category: 'recruitment', forward_to: 'hr' },
      is_active: true
    },
    {
      user_id: userId,
      rule_name: 'Flag Complaints',
      rule_type: 'notify',
      trigger_conditions: { keywords: ['complaint', 'unhappy', 'disappointed', 'terrible', 'worst'] },
      action_config: { notify: true, escalate: true, priority: 'critical' },
      is_active: true
    }
  ];

  // Add default knowledge
  const defaultKnowledge = [
    {
      user_id: userId,
      category: 'company_info',
      title: 'JBJ Global Real Estate Overview',
      content: 'JBJ Global Real Estate L.L.C S.O.C. is a premier real estate brokerage based in Dubai, UAE. Founded by Jane Bou Jaoude, the company specializes in off-plan properties, luxury real estate, and investment advisory. Contact: +971 56 591 1000, contact@jbj.ae',
      keywords: ['jbj', 'company', 'about', 'contact']
    },
    {
      user_id: userId,
      category: 'policies',
      title: 'Response Time Policy',
      content: 'All client inquiries must be responded to within 2 hours during business hours. Urgent matters require response within 30 minutes. Complaints are escalated immediately to leadership.',
      keywords: ['response', 'time', 'policy', 'sla']
    },
    {
      user_id: userId,
      category: 'processes',
      title: 'Client Onboarding Process',
      content: 'New clients receive: 1) Welcome call within 24 hours, 2) Personalized property recommendations within 48 hours, 3) Market report within 72 hours, 4) First viewing scheduled within 1 week.',
      keywords: ['onboarding', 'client', 'new', 'process']
    }
  ];

  // Insert all defaults
  await Promise.all([
    supabase.from('executive_training_samples').upsert(defaultSamples, { onConflict: 'user_id,sample_type' }),
    supabase.from('executive_automation_rules').insert(defaultRules),
    supabase.from('executive_knowledge_base').insert(defaultKnowledge)
  ]);

  return new Response(JSON.stringify({
    success: true,
    message: 'Training initialized successfully',
    initialized: {
      trainingSamples: defaultSamples.length,
      automationRules: defaultRules.length,
      knowledgeEntries: defaultKnowledge.length
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}