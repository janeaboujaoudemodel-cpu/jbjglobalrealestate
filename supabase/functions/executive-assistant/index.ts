import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Approved contact info - never leak other data
const APPROVED_CONTACT_INFO = {
  phone: "+971 56 591 1000",
  email: "contact@jbj.ae",
  privacy_email: "privacy@jbj.ae",
  company: "JBJ Global Capital"
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

    switch (action) {
      case 'chat':
        return await handleChat(supabase, userId, data, context);
      
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

async function handleChat(supabase: any, userId: string, data: any, context?: string) {
  const { message, conversationHistory = [] } = data;

  // Fetch user's training samples for personalized responses
  const { data: trainingSamples } = await supabase
    .from('executive_training_samples')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(10);

  // Fetch user settings
  const { data: settings } = await supabase
    .from('executive_assistant_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Build training context
  let trainingContext = '';
  if (trainingSamples && trainingSamples.length > 0) {
    trainingContext = `\n\nOwner's communication style examples:\n${trainingSamples.map((s: any) => 
      `Original: "${s.original_message}"\nResponse: "${s.response_example}"\nTone: ${s.tone_tags?.join(', ') || 'professional'}`
    ).join('\n\n')}`;
  }

  const systemPrompt = `You are the JBJ Executive AI Assistant - a highly intelligent, professional, and empathetic personal assistant for the owner of JBJ Global Capital.

CORE IDENTITY:
- Name: ${settings?.assistant_name || 'JBJ Executive Assistant'}
- Voice Style: ${settings?.voice_style || 'professional'} - polished, calm, and efficient
- You are the central command unit coordinating all JBJ Hub AI departments

YOUR CAPABILITIES:
1. COMMUNICATION: Handle emails, WhatsApp, Instagram DMs, and internal chats
2. FINANCE: Analyze spending, create budgets, identify savings opportunities
3. COORDINATION: Work with Marketing AI, Design AI, Admin AI, Finance AI, and Audit AI
4. REPORTING: Generate daily reports on all operations
5. DECISION SUPPORT: Provide data-driven recommendations

BEHAVIOR RULES:
- Never guess or provide inaccurate information - if unsure, say "I'll flag this for your review"
- Always confirm before executing sensitive actions (payments, sending messages)
- Reference AI colleagues by name when coordinating ("I've coordinated with Marketing...")
- Maintain 100% privacy - all data stays within JBJ Hub
- Use the owner's communication style learned from training samples

APPROVED CONTACT INFORMATION (never share other contacts):
- Phone: ${APPROVED_CONTACT_INFO.phone}
- Email: ${APPROVED_CONTACT_INFO.email}
- Privacy: ${APPROVED_CONTACT_INFO.privacy_email}
${trainingContext}

Current context: ${context || 'General assistance'}

Respond in a helpful, professional manner that matches the owner's style.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((msg: any) => ({
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
      model: 'google/gemini-2.5-flash',
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
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
    throw new Error('AI gateway error');
  }

  const aiResponse = await response.json();
  const assistantMessage = aiResponse.choices?.[0]?.message?.content || 'I apologize, but I was unable to process your request.';

  return new Response(JSON.stringify({ 
    response: assistantMessage,
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function analyzeCommunication(supabase: any, userId: string, data: any) {
  const { message, channel, sender } = data;

  // Use AI to analyze and draft response
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
          content: `You are analyzing a communication for the JBJ Executive Assistant. 
          Analyze the message and provide:
          1. intent: The sender's intent/purpose
          2. urgency: low/medium/high
          3. sentiment: positive/neutral/negative
          4. suggestedResponse: A draft response matching owner's professional style
          5. confidence: 0-1 how confident you are in the suggested response
          6. shouldFlag: true if this needs manual review, false if AI can handle
          7. flagReason: If shouldFlag is true, explain why
          
          Return as JSON only.`
        },
        {
          role: 'user',
          content: `Channel: ${channel}\nFrom: ${sender}\nMessage: ${message}`
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
      urgency: 'medium',
      sentiment: 'neutral',
      suggestedResponse: '',
      confidence: 0,
      shouldFlag: true,
      flagReason: 'Unable to analyze message'
    };
  }

  return new Response(JSON.stringify(analysis), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function analyzeFinances(supabase: any, userId: string, data: any) {
  const { transactions, action: financeAction } = data;

  // Fetch existing transactions and categories
  const { data: existingTransactions } = await supabase
    .from('executive_financial_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('transaction_date', { ascending: false })
    .limit(100);

  const { data: categories } = await supabase
    .from('executive_budget_categories')
    .select('*')
    .eq('user_id', userId);

  const financialContext = {
    existingTransactions: existingTransactions || [],
    categories: categories || [],
    newTransactions: transactions || []
  };

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
          content: `You are the JBJ Finance AI, part of the Executive Assistant system.
          Your job is to analyze financial data and provide actionable insights.
          
          Capabilities:
          1. Categorize transactions automatically
          2. Identify spending patterns and anomalies
          3. Detect duplicate or suspicious charges
          4. Suggest savings opportunities
          5. Create budget recommendations
          6. Flag potential refund opportunities
          
          Always maintain complete privacy - this data is highly sensitive.
          Provide clear, actionable advice in AED currency.`
        },
        {
          role: 'user',
          content: `Action: ${financeAction || 'analyze'}\n\nFinancial Data: ${JSON.stringify(financialContext)}`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  const analysis = aiResponse.choices?.[0]?.message?.content || 'Unable to analyze finances.';

  return new Response(JSON.stringify({ 
    analysis,
    summary: {
      totalTransactions: (existingTransactions?.length || 0) + (transactions?.length || 0),
      categoriesCount: categories?.length || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateDailyReport(supabase: any, userId: string, data: any) {
  const reportDate = data?.date || new Date().toISOString().split('T')[0];

  // Gather data from all departments
  const [
    { data: communications },
    { data: transactions },
    { data: departmentTasks },
    { data: auditLogs }
  ] = await Promise.all([
    supabase.from('executive_communications').select('*').eq('user_id', userId).gte('created_at', `${reportDate}T00:00:00`),
    supabase.from('executive_financial_transactions').select('*').eq('user_id', userId).eq('transaction_date', reportDate),
    supabase.from('executive_department_tasks').select('*').eq('user_id', userId).gte('created_at', `${reportDate}T00:00:00`),
    supabase.from('executive_audit_logs').select('*').eq('user_id', userId).gte('audited_at', `${reportDate}T00:00:00`)
  ]);

  // Generate AI summary
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
          content: `You are generating a daily executive report for the JBJ Hub owner.
          
          Create a comprehensive but easy-to-read report with:
          1. Executive Summary (2-3 sentences)
          2. Tasks Overview (completed ✅, pending ⚠️, in progress ⏳)
          3. Communications Summary
          4. Financial Highlights
          5. Department Updates (Marketing, Design, Admin, Finance, Audit)
          6. Key Recommendations
          
          Format with clear sections and visual indicators.`
        },
        {
          role: 'user',
          content: `Generate daily report for ${reportDate}:
          Communications: ${JSON.stringify(communications || [])}
          Transactions: ${JSON.stringify(transactions || [])}
          Department Tasks: ${JSON.stringify(departmentTasks || [])}
          Audit Logs: ${JSON.stringify(auditLogs || [])}`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  const reportContent = aiResponse.choices?.[0]?.message?.content || 'Report generation failed.';

  // Calculate stats
  const tasksCompleted = departmentTasks?.filter((t: any) => t.status === 'completed').length || 0;
  const tasksPending = departmentTasks?.filter((t: any) => t.status === 'pending').length || 0;
  const tasksInProgress = departmentTasks?.filter((t: any) => t.status === 'in_progress').length || 0;

  // Save report
  const { data: report, error } = await supabase
    .from('executive_daily_reports')
    .upsert({
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
        total_spent: transactions?.reduce((sum: number, t: any) => sum + (t.amount < 0 ? Math.abs(t.amount) : 0), 0) || 0
      },
      department_breakdown: {
        marketing: departmentTasks?.filter((t: any) => t.department === 'marketing') || [],
        design: departmentTasks?.filter((t: any) => t.department === 'design') || [],
        admin: departmentTasks?.filter((t: any) => t.department === 'admin') || [],
        finance: departmentTasks?.filter((t: any) => t.department === 'finance') || [],
        audit: departmentTasks?.filter((t: any) => t.department === 'audit') || []
      }
    }, {
      onConflict: 'user_id,report_date'
    })
    .select()
    .single();

  return new Response(JSON.stringify({ 
    report: reportContent,
    stats: {
      tasksCompleted,
      tasksPending,
      tasksInProgress,
      communicationsHandled: communications?.length || 0
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function coordinateDepartments(supabase: any, userId: string, data: any) {
  const { request, departments } = data;
  const requestId = crypto.randomUUID();

  // Create tasks for each department
  const departmentPrompts: Record<string, string> = {
    marketing: 'Create marketing plan, campaign strategy, and promotional content',
    design: 'Design visual materials, banners, graphics, and brand assets',
    admin: 'Handle logistics, scheduling, HR coordination, and administrative tasks',
    finance: 'Prepare budget, cost analysis, and financial projections',
    audit: 'Review compliance, accuracy, and risk assessment'
  };

  const tasks = departments.map((dept: string) => ({
    user_id: userId,
    request_id: requestId,
    department: dept,
    task_description: `${request} - ${departmentPrompts[dept] || 'General support'}`,
    priority: 'high',
    status: 'pending',
    assigned_ai: `${dept.charAt(0).toUpperCase() + dept.slice(1)} AI`,
    input_data: { originalRequest: request }
  }));

  await supabase.from('executive_department_tasks').insert(tasks);

  // Generate coordination plan
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
          content: `You are the JBJ Executive Assistant coordinating multiple AI departments.
          Create a detailed coordination plan with timelines, deliverables, and dependencies.
          Reference each department's AI by name (e.g., "Marketing AI will handle...", "Design AI will create...").
          Provide a step-by-step execution plan.`
        },
        {
          role: 'user',
          content: `Request: ${request}\nDepartments involved: ${departments.join(', ')}`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  const coordinationPlan = aiResponse.choices?.[0]?.message?.content || 'Coordination plan could not be generated.';

  return new Response(JSON.stringify({
    requestId,
    coordinationPlan,
    tasksCreated: tasks.length,
    departments
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function performAudit(supabase: any, userId: string, data: any) {
  const { auditType, entityId, entityType } = data;

  let entityData = null;
  if (entityId && entityType) {
    const { data } = await supabase.from(entityType).select('*').eq('id', entityId).single();
    entityData = data;
  }

  // Perform AI audit
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
          content: `You are the JBJ Audit AI, responsible for compliance and accuracy checking.
          
          Audit checklist:
          1. Accuracy: Is all information correct?
          2. Tone: Does it match company professional standards?
          3. Compliance: Does it follow company policies?
          4. Security: Are there any data leaks or privacy concerns?
          5. Quality: Is the communication/work of high quality?
          
          Provide audit results as JSON with:
          - complianceStatus: 'compliant' | 'warning' | 'non-compliant'
          - issues: array of found issues
          - severity: 'info' | 'warning' | 'critical'
          - recommendations: array of improvement suggestions`
        },
        {
          role: 'user',
          content: `Audit Type: ${auditType}\nData: ${JSON.stringify(entityData || data)}`
        }
      ],
    }),
  });

  const aiResponse = await response.json();
  let auditResult;
  try {
    const content = aiResponse.choices?.[0]?.message?.content || '{}';
    auditResult = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
  } catch {
    auditResult = {
      complianceStatus: 'warning',
      issues: ['Unable to parse audit results'],
      severity: 'warning',
      recommendations: ['Manual review recommended']
    };
  }

  // Log audit
  await supabase.from('executive_audit_logs').insert({
    user_id: userId,
    audit_type: auditType,
    entity_id: entityId,
    entity_type: entityType,
    action: 'audit_performed',
    new_state: auditResult,
    compliance_status: auditResult.complianceStatus,
    issues_found: auditResult.issues,
    severity: auditResult.severity
  });

  return new Response(JSON.stringify(auditResult), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
