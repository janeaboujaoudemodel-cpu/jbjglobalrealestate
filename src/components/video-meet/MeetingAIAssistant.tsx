import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Send, X, Sparkles, Home, Calculator, FileText, Loader2,
  ChevronDown, ChevronUp, Copy, EyeOff, ListChecks, Link2, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'property' | 'mortgage' | 'general' | 'task';
  data?: any;
  timestamp: Date;
}

interface MeetingAIAssistantProps {
  isVisible: boolean;
  onClose: () => void;
  meetingContext?: {
    clientName?: string;
    clientBudget?: string;
    clientPreferences?: string;
    transcript?: string;
    leadId?: string;
  };
  onSuggestion?: (suggestion: any) => void;
}

export function MeetingAIAssistant({
  isVisible, onClose, meetingContext, onSuggestion
}: MeetingAIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const lowerInput = input.toLowerCase();
      let response: Message;

      if (lowerInput.includes('mortgage') || lowerInput.includes('loan') || lowerInput.includes('payment') || lowerInput.includes('emi')) {
        response = handleMortgageQuery(input, meetingContext);
      } else if (lowerInput.includes('task') || lowerInput.includes('follow') || lowerInput.includes('reminder') || lowerInput.includes('next step')) {
        response = await handleTaskCreation(input, meetingContext);
      } else if (lowerInput.includes('property') || lowerInput.includes('properties') || lowerInput.includes('recommend') || lowerInput.includes('suggest') || lowerInput.includes('find') || lowerInput.includes('search')) {
        response = await handlePropertyQuery(input, meetingContext);
      } else if (lowerInput.includes('summarize') || lowerInput.includes('summary') || lowerInput.includes('recap')) {
        response = await handleSummarize(input, meetingContext);
      } else {
        response = await handleGeneralQuery(input, meetingContext);
      }

      setMessages(prev => [...prev, response]);
      if (response.data && onSuggestion) onSuggestion(response.data);
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMortgageQuery = (query: string, context?: any): Message => {
    const budgetMatch = (context?.clientBudget || query).match(/[\d,]+/);
    const propertyPrice = budgetMatch ? parseInt(budgetMatch[0].replace(/,/g, '')) : 2000000;
    const downPaymentPercent = 20;
    const downPayment = propertyPrice * (downPaymentPercent / 100);
    const loanAmount = propertyPrice - downPayment;
    const interestRate = 4.5;
    const termYears = 25;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = termYears * 12;
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

    return {
      id: Date.now().toString(), role: 'assistant', type: 'mortgage',
      data: { propertyPrice, downPayment, loanAmount, monthlyPayment: Math.round(monthlyPayment), interestRate, termYears },
      content: `**Mortgage Calculation**\n\nProperty: **AED ${propertyPrice.toLocaleString()}**\n\n• Down Payment (20%): **AED ${downPayment.toLocaleString()}**\n• Loan Amount: **AED ${loanAmount.toLocaleString()}**\n• Monthly Payment: **AED ${Math.round(monthlyPayment).toLocaleString()}**\n• Rate: ${interestRate}% | Term: ${termYears} years\n\n_Estimate only. Actual rates vary by bank._`,
      timestamp: new Date()
    };
  };

  const handlePropertyQuery = async (query: string, context?: any): Promise<Message> => {
    const budget = context?.clientBudget || '2,000,000';
    const budgetNum = parseInt(budget.replace(/[^0-9]/g, '')) || 2000000;
    const prefs = (context?.clientPreferences || query).toLowerCase();

    // Search real projects from database
    let dbQuery = supabase
      .from('projects')
      .select('id, name, slug, price_from, area_name, developer_name, property_type_label, bedrooms_min, bedrooms_max, size_min, construction_status')
      .lte('price_from', budgetNum * 1.3)
      .order('price_from', { ascending: false })
      .limit(6);

    // Filter by preferences if mentioned
    if (prefs.includes('villa')) dbQuery = dbQuery.ilike('property_type_label', '%villa%');
    else if (prefs.includes('apartment') || prefs.includes('flat')) dbQuery = dbQuery.ilike('property_type_label', '%apartment%');
    if (prefs.includes('marina')) dbQuery = dbQuery.ilike('area_name', '%marina%');
    else if (prefs.includes('downtown')) dbQuery = dbQuery.ilike('area_name', '%downtown%');
    else if (prefs.includes('palm')) dbQuery = dbQuery.ilike('area_name', '%palm%');

    const { data: projects, error } = await dbQuery;

    if (error || !projects?.length) {
      return {
        id: Date.now().toString(), role: 'assistant', type: 'property',
        content: `No matching properties found for budget AED ${budgetNum.toLocaleString()}. Try adjusting the budget or preferences.`,
        timestamp: new Date()
      };
    }

    const lines = projects.map((p, i) => 
      `**${i + 1}. [${p.name}](/project/${p.slug})**\n• ${p.area_name || 'Dubai'} | ${p.property_type_label || 'Property'}\n• From AED ${(p.price_from || 0).toLocaleString()}\n• ${p.bedrooms_min || '?'}-${p.bedrooms_max || '?'} BR | ${p.construction_status || 'TBA'}`
    ).join('\n\n');

    return {
      id: Date.now().toString(), role: 'assistant', type: 'property',
      data: { projects: projects.map(p => ({ ...p, link: `/project/${p.slug}` })) },
      content: `**Property Recommendations** (Budget: AED ${budgetNum.toLocaleString()})\n\n${lines}\n\n_Click a project name to view details. Shall I create a follow-up task?_`,
      timestamp: new Date()
    };
  };

  const handleTaskCreation = async (query: string, context?: any): Promise<Message> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { id: Date.now().toString(), role: 'assistant', content: 'Please log in to create tasks.', timestamp: new Date() };
    }

    // Use AI to extract task details
    const { data, error } = await supabase.functions.invoke('lovable-ai', {
      body: {
        prompt: `Extract a task from this request. Return ONLY a JSON object with: {"title": "...", "description": "...", "priority": "high|medium|low", "due_days": number_of_days_from_now}. Request: "${query}". Context: Client ${context?.clientName || 'unknown'}, Budget: ${context?.clientBudget || 'N/A'}`,
        model: 'google/gemini-2.5-flash-lite',
      }
    });

    let taskTitle = query.replace(/create|add|make|task|follow.up|reminder/gi, '').trim() || 'Follow up with client';
    let taskDesc = `Client: ${context?.clientName || 'Unknown'}\nBudget: ${context?.clientBudget || 'N/A'}`;
    let priority = 'medium';
    let dueDays = 3;

    try {
      const content = data?.content || data?.text || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        taskTitle = parsed.title || taskTitle;
        taskDesc = parsed.description || taskDesc;
        priority = parsed.priority || priority;
        dueDays = parsed.due_days || dueDays;
      }
    } catch { /* use defaults */ }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    const { error: insertError } = await supabase.from('admin_tasks').insert({
      title: taskTitle,
      description: taskDesc,
      priority,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
      category: 'follow-up',
      user_id: user.id,
    });

    if (insertError) {
      return { id: Date.now().toString(), role: 'assistant', content: `Failed to create task: ${insertError.message}`, timestamp: new Date() };
    }

    return {
      id: Date.now().toString(), role: 'assistant', type: 'task',
      content: `✅ **Task Created**\n\n• **${taskTitle}**\n• Priority: ${priority}\n• Due: ${dueDate.toLocaleDateString()}\n• ${taskDesc}\n\n_Task added to your dashboard._`,
      timestamp: new Date()
    };
  };

  const handleSummarize = async (query: string, context?: any): Promise<Message> => {
    const transcript = context?.transcript || messages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const { data, error } = await supabase.functions.invoke('lovable-ai', {
      body: {
        prompt: `Summarize this meeting/conversation into: 1) Key Points, 2) Client Requirements, 3) Action Items. Be concise.\n\nClient: ${context?.clientName || 'Unknown'}\nBudget: ${context?.clientBudget || 'N/A'}\nPreferences: ${context?.clientPreferences || 'N/A'}\n\nConversation:\n${transcript}`,
        model: 'google/gemini-2.5-flash',
      }
    });

    const summary = data?.content || data?.text || 'Unable to generate summary at this time.';
    return {
      id: Date.now().toString(), role: 'assistant', type: 'general',
      content: `**Meeting Summary**\n\n${summary}`,
      timestamp: new Date()
    };
  };

  const handleGeneralQuery = async (query: string, context?: any): Promise<Message> => {
    const { data, error } = await supabase.functions.invoke('lovable-ai', {
      body: {
        prompt: `You are JBJ's AI real estate assistant during a client meeting. Answer this question professionally and concisely. If the user asks about a property, suggest using "recommend properties" or "find properties" command.\n\nClient: ${context?.clientName || 'unknown'}\nBudget: ${context?.clientBudget || 'N/A'}\nPreferences: ${context?.clientPreferences || 'N/A'}\n\nQuestion: ${query}`,
        model: 'google/gemini-2.5-flash',
      }
    });

    return {
      id: Date.now().toString(), role: 'assistant', type: 'general',
      content: data?.content || data?.text || 'I can help with property recommendations, mortgage calculations, task creation, and meeting summaries. What would you like?',
      timestamp: new Date()
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`fixed right-4 bottom-24 w-80 bg-zinc-900 border border-gold/30 rounded-xl shadow-2xl z-50 overflow-hidden ${
        isMinimized ? 'h-12' : 'h-[500px]'
      }`}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gold/20 to-gold/10 border-b border-gold/20 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-gold" />
          <span className="text-white font-medium">AI Assistant</span>
          <Badge className="bg-green-500/20 text-green-400 text-[10px]">Live</Badge>
        </div>
        <div className="flex items-center gap-1">
          {isMinimized ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <>
              <ChevronDown className="w-4 h-4 text-gray-400" />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onClose(); }}>
                <X className="w-4 h-4 text-gray-400" />
              </Button>
            </>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          {meetingContext && (
            <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-700 text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <EyeOff className="w-3 h-3" />
                <span>Private — only you can see this</span>
              </div>
              {meetingContext.clientName && (
                <p className="text-gold text-[10px] mt-1">Client: {meetingContext.clientName}</p>
              )}
            </div>
          )}

          <ScrollArea className="flex-1 h-[340px] p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-gold/50 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">Your AI assistant during meetings</p>
                <div className="space-y-2">
                  {[
                    { icon: Home, label: 'Find matching properties', prompt: 'Recommend properties for this client' },
                    { icon: Calculator, label: 'Calculate mortgage', prompt: 'Calculate mortgage for client budget' },
                    { icon: ListChecks, label: 'Create follow-up task', prompt: 'Create a follow-up task to send brochure' },
                    { icon: FileText, label: 'Summarize meeting', prompt: 'Summarize our conversation so far' },
                  ].map(({ icon: Icon, label, prompt }) => (
                    <button
                      key={label}
                      onClick={() => setInput(prompt)}
                      className="w-full p-2 text-left text-xs text-gray-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Icon className="w-3 h-3 text-gold" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-lg p-3 ${
                      msg.role === 'user' ? 'bg-gold text-black' : 'bg-zinc-800 text-gray-200'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === 'assistant' && (
                        <Button size="icon" variant="ghost" className="h-5 w-5 mt-2 opacity-50 hover:opacity-100"
                          onClick={() => copyToClipboard(msg.content)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-800 rounded-lg p-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-gold animate-spin" />
                      <span className="text-gray-400 text-sm">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t border-zinc-700">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask AI privately..."
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
              <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()}
                className="bg-gold hover:bg-gold/90 text-black">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default MeetingAIAssistant;
