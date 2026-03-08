import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Send,
  X,
  Sparkles,
  Home,
  Calculator,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff
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
  type?: 'property' | 'mortgage' | 'general';
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
  };
  onSuggestion?: (suggestion: any) => void;
}

export function MeetingAIAssistant({
  isVisible,
  onClose,
  meetingContext,
  onSuggestion
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Detect intent
      const lowerInput = input.toLowerCase();
      let response: Message;

      if (lowerInput.includes('mortgage') || lowerInput.includes('loan') || lowerInput.includes('payment')) {
        // Mortgage calculation request
        response = await handleMortgageQuery(input, meetingContext);
      } else if (lowerInput.includes('property') || lowerInput.includes('properties') || lowerInput.includes('recommend') || lowerInput.includes('suggest')) {
        // Property recommendation request
        response = await handlePropertyQuery(input, meetingContext);
      } else {
        // General AI response
        response = await handleGeneralQuery(input, meetingContext);
      }

      setMessages(prev => [...prev, response]);
      
      // Notify parent of suggestion if applicable
      if (response.data && onSuggestion) {
        onSuggestion(response.data);
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMortgageQuery = async (query: string, context?: any): Promise<Message> => {
    // Extract numbers from context or query
    const budgetMatch = (context?.clientBudget || query).match(/[\d,]+/);
    const propertyPrice = budgetMatch ? parseInt(budgetMatch[0].replace(/,/g, '')) : 2000000;
    
    // Calculate mortgage details
    const downPaymentPercent = 20;
    const downPayment = propertyPrice * (downPaymentPercent / 100);
    const loanAmount = propertyPrice - downPayment;
    const interestRate = 4.5;
    const termYears = 25;
    
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = termYears * 12;
    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);

    const data = {
      propertyPrice,
      downPayment,
      loanAmount,
      monthlyPayment: Math.round(monthlyPayment),
      interestRate,
      termYears
    };

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `**Mortgage Calculation**

Based on a property price of **AED ${propertyPrice.toLocaleString()}**:

• Down Payment (20%): **AED ${downPayment.toLocaleString()}**
• Loan Amount: **AED ${loanAmount.toLocaleString()}**
• Monthly Payment: **AED ${Math.round(monthlyPayment).toLocaleString()}**
• Interest Rate: ${interestRate}%
• Term: ${termYears} years

This is an estimate. Actual rates may vary based on the bank and client's credit profile.`,
      type: 'mortgage',
      data,
      timestamp: new Date()
    };
  };

  const handlePropertyQuery = async (query: string, context?: any): Promise<Message> => {
    // Get budget from context
    const budget = context?.clientBudget || '2,000,000';
    const budgetNum = parseInt(budget.replace(/[^0-9]/g, '')) || 2000000;
    
    // Generate property suggestions based on budget
    const properties = generatePropertySuggestions(budgetNum);

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: `**Property Recommendations**

Based on budget of **AED ${budgetNum.toLocaleString()}**:

${properties.map((p, i) => `
**${i + 1}. ${p.name}**
• Location: ${p.location}
• Type: ${p.type}
• Price: AED ${p.price.toLocaleString()}
• Bedrooms: ${p.bedrooms}
• Size: ${p.size} sq ft
• ROI: ${p.roi}%
`).join('')}

Shall I provide more details on any of these properties?`,
      type: 'property',
      data: { properties },
      timestamp: new Date()
    };
  };

  const handleGeneralQuery = async (query: string, context?: any): Promise<Message> => {
    // Use AI to generate response
    const { data, error } = await supabase.functions.invoke('ai-meeting-summarizer', {
      body: {
        transcript: `User question: ${query}\nContext: Client ${context?.clientName || 'unknown'}, Budget: ${context?.clientBudget || 'not specified'}, Preferences: ${context?.clientPreferences || 'not specified'}`,
        meetingType: 'AI Assistant Query',
        participants: 'AI Assistant and Host'
      }
    });

    if (error) throw error;

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: data?.summary || 'I understand your question. Could you provide more specific details so I can assist you better?',
      type: 'general',
      timestamp: new Date()
    };
  };

  const generatePropertySuggestions = (budget: number) => {
    const suggestions = [];
    
    if (budget >= 1500000 && budget < 3000000) {
      suggestions.push(
        { name: 'Dubai Marina Apartment', location: 'Dubai Marina', type: '2BR Apartment', price: budget * 0.9, bedrooms: 2, size: 1200, roi: 6.5 },
        { name: 'JVC Villa', location: 'Jumeirah Village Circle', type: '3BR Villa', price: budget * 0.85, bedrooms: 3, size: 2200, roi: 7.2 },
        { name: 'Downtown Views', location: 'Downtown Dubai', type: '1BR Apartment', price: budget * 0.7, bedrooms: 1, size: 850, roi: 5.8 }
      );
    } else if (budget >= 3000000 && budget < 6000000) {
      suggestions.push(
        { name: 'Palm Jumeirah Villa', location: 'Palm Jumeirah', type: '4BR Villa', price: budget * 0.95, bedrooms: 4, size: 4500, roi: 4.5 },
        { name: 'Marina Penthouse', location: 'Dubai Marina', type: '3BR Penthouse', price: budget * 0.9, bedrooms: 3, size: 3200, roi: 5.2 },
        { name: 'DIFC Tower', location: 'DIFC', type: '2BR Apartment', price: budget * 0.6, bedrooms: 2, size: 1800, roi: 6.0 }
      );
    } else {
      suggestions.push(
        { name: 'Emirates Hills Estate', location: 'Emirates Hills', type: '6BR Villa', price: budget * 0.9, bedrooms: 6, size: 15000, roi: 3.5 },
        { name: 'Burj Khalifa Residence', location: 'Downtown Dubai', type: '4BR Apartment', price: budget * 0.7, bedrooms: 4, size: 5500, roi: 4.0 },
        { name: 'Palm Beachfront', location: 'Palm Jumeirah', type: '5BR Villa', price: budget * 0.85, bedrooms: 5, size: 8000, roi: 4.2 }
      );
    }
    
    return suggestions;
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
          <Badge className="bg-green-500/20 text-green-400 text-[10px]">Private</Badge>
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
          {/* Context Info */}
          {meetingContext && (
            <div className="px-4 py-2 bg-zinc-800/50 border-b border-zinc-700 text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <EyeOff className="w-3 h-3" />
                <span>Only you can see these messages</span>
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 h-[340px] p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Sparkles className="w-8 h-8 text-gold/50 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Ask me anything during your meeting</p>
                <div className="mt-4 space-y-2">
                  <button 
                    onClick={() => setInput('Calculate mortgage for client budget')}
                    className="w-full p-2 text-left text-xs text-gray-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <Calculator className="w-3 h-3 text-gold" />
                    Calculate mortgage
                  </button>
                  <button 
                    onClick={() => setInput('Recommend properties')}
                    className="w-full p-2 text-left text-xs text-gray-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <Home className="w-3 h-3 text-gold" />
                    Suggest properties
                  </button>
                  <button 
                    onClick={() => setInput('Summarize client needs')}
                    className="w-full p-2 text-left text-xs text-gray-400 bg-zinc-800 rounded-lg hover:bg-zinc-700 flex items-center gap-2"
                  >
                    <FileText className="w-3 h-3 text-gold" />
                    Summarize meeting
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] rounded-lg p-3 ${
                      msg.role === 'user' 
                        ? 'bg-gold text-black' 
                        : 'bg-zinc-800 text-gray-200'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      {msg.role === 'assistant' && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-5 w-5 mt-2 opacity-50 hover:opacity-100"
                          onClick={() => copyToClipboard(msg.content)}
                        >
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

          {/* Input */}
          <div className="p-3 border-t border-zinc-700">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask AI privately..."
                className="bg-zinc-800 border-zinc-700 text-white text-sm"
              />
              <Button 
                size="icon" 
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-gold hover:bg-gold/90 text-black"
              >
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
