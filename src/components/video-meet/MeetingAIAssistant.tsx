import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Send, X, Sparkles, Home, Calculator, FileText, Loader2,
  ChevronDown, ChevronUp, Copy, EyeOff, ListChecks, Plus, Check
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
  type?: 'property' | 'mortgage' | 'general' | 'task' | 'summary';
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

  const addAssistantMessage = (msg: Omit<Message, 'id' | 'role' | 'timestamp'>) => {
    const message: Message = { ...msg, id: Date.now().toString(), role: 'assistant', timestamp: new Date() };
    setMessages(prev => [...prev, message]);
    if (msg.data && onSuggestion) onSuggestion(msg.data);
    return message;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() }]);
    const query = input;
    setInput('');
    setIsLoading(true);

    try {
      const lower = query.toLowerCase();
      if (lower.includes('mortgage') || lower.includes('loan') || lower.includes('emi')) {
        handleMortgageQuery(query);
      } else if (lower.includes('task') || lower.includes('follow') || lower.includes('reminder')) {
        await handleTaskCreation(query);
      } else if (lower.includes('property') || lower.includes('recommend') || lower.includes('suggest') || lower.includes('find')) {
        await handlePropertyQuery(query);
      } else if (lower.includes('summarize') || lower.includes('summary') || lower.includes('recap')) {
        await handleSummarize(query);
      } else {
        await handleGeneralQuery(query);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      addAssistantMessage({ content: 'Sorry, I encountered an error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMortgageQuery = (query: string) => {
    const budgetMatch = (meetingContext?.clientBudget || query).match(/[\d,]+/);
    const price = budgetMatch ? parseInt(budgetMatch[0].replace(/,/g, '')) : 2000000;
    const down = price * 0.2;
    const loan = price - down;
    const r = 4.5 / 100 / 12;
    const n = 300;
    const monthly = Math.round((loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

    addAssistantMessage({
      type: 'mortgage',
      data: { price, down, loan, monthly },
      content: `**Mortgage Estimate**\n\nProperty: **AED ${price.toLocaleString()}**\n• Down (20%): AED ${down.toLocaleString()}\n• Loan: AED ${loan.toLocaleString()}\n• Monthly: **AED ${monthly.toLocaleString()}**\n• 4.5% rate · 25 years`
    });
  };

  const handlePropertyQuery = async (query: string) => {
    const budget = parseInt((meetingContext?.clientBudget || query).replace(/[^0-9]/g, '')) || 2000000;
    const prefs = (meetingContext?.clientPreferences || query).toLowerCase();

    let dbQuery = supabase.from('projects')
      .select('id, name, slug, price_from, area_name, property_type_label, bedrooms_min, bedrooms_max, construction_status')
      .lte('price_from', budget * 1.3).order('price_from', { ascending: false }).limit(5);

    if (prefs.includes('villa')) dbQuery = dbQuery.ilike('property_type_label', '%villa%');
    else if (prefs.includes('apartment')) dbQuery = dbQuery.ilike('property_type_label', '%apartment%');

    const { data: projects } = await dbQuery;
    if (!projects?.length) {
      addAssistantMessage({ type: 'property', content: `No properties found for AED ${budget.toLocaleString()}. Try adjusting budget.` });
      return;
    }

    const lines = projects.map((p, i) => `${i + 1}. **${p.name}** — ${p.area_name} · AED ${(p.price_from || 0).toLocaleString()}`).join('\n');
    addAssistantMessage({
      type: 'property',
      data: { projects },
      content: `**Matching Properties** (≤ AED ${budget.toLocaleString()})\n\n${lines}`
    });
  };

  const handleTaskCreation = async (query: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { addAssistantMessage({ content: 'Please log in to create tasks.' }); return; }

    const title = query.replace(/create|add|task|follow.up|reminder/gi, '').trim() || 'Follow up with client';
    const dueDate = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];

    const { error } = await supabase.from('admin_tasks').insert({
      title, description: `Client: ${meetingContext?.clientName || 'Unknown'}`,
      priority: 'medium', due_date: dueDate, status: 'pending', category: 'follow-up', user_id: user.id
    });

    addAssistantMessage({
      type: 'task',
      content: error ? `Failed: ${error.message}` : `✅ **Task Created**: ${title}\nDue: ${dueDate}`
    });
  };

  const handleSummarize = async (query: string) => {
    const transcript = meetingContext?.transcript || messages.map(m => `${m.role}: ${m.content}`).join('\n');

    // Use the ai-meeting-summarizer edge function for structured output
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.functions.invoke('ai-meeting-summarizer', {
      body: {
        meetingNotes: transcript,
        meetingType: 'client meeting',
        participants: meetingContext?.clientName || 'Unknown',
        propertyContext: meetingContext?.clientPreferences || '',
      }
    });

    if (error || !data?.success) {
      // Fallback to lovable-ai
      const { data: fallback } = await supabase.functions.invoke('lovable-ai', {
        body: {
          prompt: `Summarize this meeting:\n${transcript}\nProvide: Key Points, Action Items, Next Steps.`,
          model: 'google/gemini-2.5-flash',
        }
      });
      addAssistantMessage({ type: 'summary', content: `**Meeting Summary**\n\n${fallback?.content || fallback?.text || 'Unable to summarize.'}` });
      return;
    }

    // Structured output
    const summary = data.executiveSummary || data.summary || 'Meeting processed.';
    const actions = (data.actionItems || []).map((a: any) => typeof a === 'string' ? a : a.task).filter(Boolean);
    const decisions = (data.decisions || data.keyDecisions || []).map((d: any) => typeof d === 'string' ? d : d.decision).filter(Boolean);

    let content = `**Meeting Summary**\n\n${summary}`;
    if (actions.length) content += `\n\n**Action Items:**\n${actions.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n')}`;
    if (decisions.length) content += `\n\n**Decisions:**\n${decisions.map((d: string) => `✓ ${d}`).join('\n')}`;

    addAssistantMessage({ type: 'summary', data: { actionItems: actions, decisions }, content });
  };

  const handleGeneralQuery = async (query: string) => {
    const { data } = await supabase.functions.invoke('lovable-ai', {
      body: {
        prompt: `You are JBJ's real estate AI assistant in a live meeting. Answer concisely.\nClient: ${meetingContext?.clientName || 'unknown'}\nBudget: ${meetingContext?.clientBudget || 'N/A'}\nQuestion: ${query}`,
        model: 'google/gemini-2.5-flash',
      }
    });
    addAssistantMessage({ content: data?.content || data?.text || 'How can I help? Try "find properties" or "summarize meeting".' });
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`fixed right-4 bottom-24 w-80 bg-zinc-900 border border-gold/30 rounded-xl shadow-2xl z-50 overflow-hidden ${isMinimized ? 'h-12' : 'h-[500px]'}`}
    >
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-gold/20 to-gold/10 border-b border-gold/20 cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-gold" />
          <span className="text-white font-medium text-sm">AI Meeting Assistant</span>
          <Badge className="bg-green-500/20 text-green-400 text-[10px]">Live</Badge>
        </div>
        <div className="flex items-center gap-1">
          {isMinimized ? <ChevronUp className="w-4 h-4 text-gray-400" /> : (
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
                <span>Private — only you see this</span>
              </div>
              {meetingContext.clientName && <p className="text-gold text-[10px] mt-1">Client: {meetingContext.clientName}</p>}
            </div>
          )}

          <ScrollArea className="flex-1 h-[340px] p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center py-6">
                <Sparkles className="w-8 h-8 text-gold/50 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">AI assistant + CRM</p>
                <div className="space-y-2">
                  {[
                    { icon: Home, label: 'Find properties', prompt: 'Recommend properties for this client' },
                    { icon: Calculator, label: 'Mortgage calc', prompt: 'Calculate mortgage for budget' },
                    { icon: ListChecks, label: 'Create task', prompt: 'Create follow-up task to send brochure' },
                    { icon: FileText, label: 'Summarize meeting', prompt: 'Summarize our meeting' },
                  ].map(({ icon: Icon, label, prompt }) => (
                    <button key={label} onClick={() => setInput(prompt)}
                      className="w-full p-2 text-left text-xs text-gray-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 flex items-center gap-2">
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
                    <div className={`max-w-[90%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-gold text-black' : 'bg-zinc-800 text-gray-200'}`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === 'assistant' && (
                        <Button size="icon" variant="ghost" className="h-5 w-5 mt-2 opacity-50 hover:opacity-100"
                          onClick={() => { navigator.clipboard.writeText(msg.content); toast.success('Copied'); }}>
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
              <Input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask AI privately..." className="bg-zinc-800 border-zinc-700 text-white text-sm" />
              <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()} className="bg-gold hover:bg-gold/90 text-black">
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
