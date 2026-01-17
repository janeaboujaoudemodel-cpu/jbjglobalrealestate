import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, Send, Loader2, X, MessageCircle, 
  Calculator, FileText, HelpCircle, Lightbulb
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CONTACT_INFO } from "@/constants/stats";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SellerAssistantProps {
  formData: Record<string, unknown>;
  currentStep: number;
  onClose: () => void;
}

const STEP_GUIDANCE: Record<number, string[]> = {
  1: [
    "What information do you need from me?",
    "I'm selling on behalf of someone else",
    "Which contact method is best?",
  ],
  2: [
    "How do I describe my property type?",
    "What location details are important?",
    "My property is off-plan, what should I know?",
  ],
  3: [
    "How should I price my property?",
    "What's a realistic selling timeline?",
    "Help me understand the market value",
  ],
  4: [
    "What upgrades add the most value?",
    "How should I describe my property features?",
    "What are the best highlights to mention?",
  ],
  5: [
    "What photos work best for listings?",
    "Should I include a video tour?",
    "Tips for property photography",
  ],
  6: [
    "What documents do I need to sell?",
    "What is a Title Deed?",
    "Do I need a Power of Attorney?",
  ],
  7: [
    "What happens after I submit?",
    "How long until you contact me?",
    "Can I make changes later?",
  ],
};

const SellerAssistant = ({ formData, currentStep, onClose }: SellerAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm your JBJ Seller Assistant. I'm here to help you complete your property listing and answer any questions about the selling process in the UAE.\n\nYou're currently on Step ${currentStep}. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getSystemPrompt = () => {
    const formSummary = JSON.stringify(formData, null, 2);
    
    return `You are the JBJ Seller Assistant, an expert AI assistant helping property sellers in the UAE complete their listing with JBJ Global Real Estate.

IMPORTANT RULES:
1. You provide guidance on the UAE property selling process ONLY
2. You are NOT licensed to give legal, financial, mortgage, or investment advice
3. For legal/mortgage questions, suggest contacting our licensed partners
4. Always use the official contact: ${CONTACT_INFO.phone} and ${CONTACT_INFO.email}
5. NEVER make up phone numbers or email addresses
6. Be helpful, professional, and encouraging
7. Keep responses concise (under 150 words)
8. If unsure, recommend speaking with our team directly

CURRENT FORM STATE:
${formSummary}

CURRENT STEP: ${currentStep} of 7

STEPS:
1. Seller Details - collecting contact information
2. Property Basics - type, location, bedrooms, size
3. Pricing - target price, urgency
4. Condition & Upgrades - furnishing, improvements
5. Media Uploads - photos, videos, floor plans
6. Documents Vault - title deed, ID, POA
7. Review & Submit - final confirmation

COMPANY: JBJ Global Real Estate (never say "JBJ Global" alone)
SCOPE: Real estate brokerage services only
GEOGRAPHY: UAE Real Estate (say "Dubai" only when specifically relevant)

Help the user complete their listing form and answer questions about the selling process.`;
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = { role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [
            { role: "system", content: getSystemPrompt() },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: textToSend },
          ],
          model: "google/gemini-2.5-flash",
          max_tokens: 500,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: "assistant",
        content: data?.response || data?.content || "I apologize, I couldn't process that. Please try again or contact us directly at " + CONTACT_INFO.phone,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Assistant error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `I'm having trouble connecting right now. Please contact our team directly at ${CONTACT_INFO.phone} or ${CONTACT_INFO.email} for immediate assistance.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { icon: Calculator, label: "Run Evaluator", action: () => window.open("/property-evaluator", "_blank"), iconClass: "text-gold" },
    { icon: FileText, label: "Seller Guide", action: () => window.open("/seller-guide", "_blank"), iconClass: "text-gold" },
    { icon: MessageCircle, label: "WhatsApp", action: () => window.open(`https://wa.me/${CONTACT_INFO.whatsappNumber}`, "_blank"), iconClass: "text-green-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white border border-gold/30 rounded-xl overflow-hidden shadow-xl"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-gold/20 to-gold/5 border-b border-gold/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-gold" />
          </div>
          <div>
            <h3 className="text-black font-semibold text-sm">JBJ Seller Assistant</h3>
            <p className="text-gold/70 text-xs">Here to help you list your property</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-zinc-500 hover:text-black hover:bg-zinc-100"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-b border-zinc-200 flex gap-2 overflow-x-auto bg-zinc-50">
        {quickActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={action.action}
            className="border-zinc-300 text-zinc-700 hover:text-gold hover:border-gold/50 whitespace-nowrap text-xs bg-white"
          >
            <action.icon className={`w-3 h-3 mr-1 ${action.iconClass}`} />
            {action.label}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <ScrollArea className="h-[300px] p-4 bg-white" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                  message.role === "user"
                    ? "bg-gold text-black"
                    : "bg-zinc-100 text-zinc-800 border border-zinc-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-100 border border-zinc-200 rounded-lg px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-gold" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Questions */}
      <div className="px-4 py-2 border-t border-zinc-200 bg-zinc-50">
        <p className="text-zinc-500 text-xs mb-2 flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          Suggested questions:
        </p>
        <div className="flex flex-wrap gap-2">
          {STEP_GUIDANCE[currentStep]?.slice(0, 3).map((question, index) => (
            <button
              key={index}
              onClick={() => sendMessage(question)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 bg-white text-zinc-700 border border-zinc-300 rounded-full hover:bg-gold/10 hover:text-gold hover:border-gold/50 transition-colors disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about selling..."
            className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-gold text-black hover:bg-gold/80"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-zinc-500 text-xs mt-2 text-center">
          AI responses are informational only. For advice, contact our team.
        </p>
      </div>
    </motion.div>
  );
};

export default SellerAssistant;