import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot, User, Loader2, Star, Building2, Plane, Scale, Paintbrush, Calculator, Home, ChevronLeft, Mail, Phone as PhoneIcon, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserInfo {
  name: string;
  email: string;
  phone: string;
}

type ChatStep = 'collect_info' | 'select_service' | 'chatting' | 'rating';

const SERVICES = [
  { id: 'real_estate', icon: Building2, label: 'Real Estate Investment', description: 'Properties, off-plan, ready units in UAE' },
  { id: 'concierge', icon: Plane, label: 'Luxury Concierge', description: 'Private jets, yachts, VIP experiences' },
  { id: 'legal', icon: Scale, label: 'Legal Advisory', description: 'Property transactions, documentation' },
  { id: 'design_build', icon: Paintbrush, label: 'Design & Build', description: 'Interior design, fit-out, renovation' },
  { id: 'mortgage', icon: Calculator, label: 'Mortgage Advisory', description: 'Financing, mortgage options' },
  { id: 'property_management', icon: Home, label: 'Property Management', description: 'Rental, maintenance, tenant services' },
];

const AIChatWidget = () => {
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ChatStep>('collect_info');
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', email: '', phone: '' });
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when chat step changes
  useEffect(() => {
    if (isOpen && step === 'chatting' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, step]);

  const handleStartChat = async () => {
    if (!userInfo.name.trim() || !userInfo.email.trim()) {
      toast.error('Please provide your name and email to continue');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userInfo.email)) {
      toast.error('Please provide a valid email address');
      return;
    }

    setStep('select_service');
  };

  const handleSelectService = async (serviceId: string) => {
    setSelectedService(serviceId);
    
    // Create conversation in database
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_email: userInfo.email,
          user_name: userInfo.name,
          user_phone: userInfo.phone || null,
          service_type: serviceId,
          messages: [],
          status: 'active'
        })
        .select('id')
        .single();

      if (error) throw error;
      setConversationId(data.id);

      // Also save to leads table
      await supabase.from('leads').upsert({
        email: userInfo.email,
        full_name: userInfo.name,
        phone: userInfo.phone || null,
        source: 'ai_chat_support'
      }, { onConflict: 'email' });

    } catch (error) {
      console.error('Error creating conversation:', error);
      // Continue anyway - we'll try to save messages later
    }

    const serviceName = SERVICES.find(s => s.id === serviceId)?.label || 'our services';
    
    // Set welcome message based on selected service
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hello ${userInfo.name}! 👋 Welcome to JJ Global Capital.\n\nI see you're interested in ${serviceName}. I'm here to help you with any questions about our services across the UAE.\n\nHow can I assist you today?`,
        timestamp: new Date(),
      },
    ]);
    
    setStep('chatting');
  };

  const saveMessagesToDb = async (newMessages: Message[]) => {
    if (!conversationId) return;
    
    try {
      const messagesForDb = newMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString()
      }));

      await supabase
        .from('chat_conversations')
        .update({ 
          messages: messagesForDb,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat-support', {
        body: {
          message: userMessage.content,
          history: conversationHistory,
          service: selectedService,
          userName: userInfo.name,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an issue. Please try again or contact our team directly at contact@jjglobalcapital.com or call +971 56 591 1000.',
        timestamp: new Date(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      
      // Save to database
      await saveMessagesToDb(updatedMessages);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I apologize for the technical difficulty. Please try again or contact our team directly:\n\n📧 Email: contact@jjglobalcapital.com\n📞 Phone: +971 56 591 1000\n💬 WhatsApp: +971 56 591 1000\n\nOur team is available to assist you.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEndChat = () => {
    setStep('rating');
  };

  const handleSubmitRating = async () => {
    if (conversationId && rating > 0) {
      try {
        await supabase
          .from('chat_conversations')
          .update({ 
            rating,
            rating_feedback: ratingFeedback || null,
            status: 'completed'
          })
          .eq('id', conversationId);
        
        toast.success('Thank you for your feedback!');
      } catch (error) {
        console.error('Error saving rating:', error);
      }
    }
    
    // Reset everything
    setIsOpen(false);
    setTimeout(() => {
      setStep('collect_info');
      setUserInfo({ name: '', email: '', phone: '' });
      setSelectedService(null);
      setMessages([]);
      setConversationId(null);
      setRating(0);
      setRatingFeedback('');
    }, 300);
  };

  const handleClose = () => {
    if (step === 'chatting' && messages.length > 1) {
      handleEndChat();
    } else {
      setIsOpen(false);
      setTimeout(() => {
        setStep('collect_info');
        setUserInfo({ name: '', email: '', phone: '' });
        setSelectedService(null);
        setMessages([]);
        setConversationId(null);
        setRating(0);
        setRatingFeedback('');
      }, 300);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 shadow-lg shadow-gold/30 text-black"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
            >
              {t('chat.askMe')}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 w-[400px] max-w-[calc(100vw-48px)] h-[550px] max-h-[calc(100vh-100px)] bg-zinc-900/95 backdrop-blur-xl border border-gold/30 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gold/20 bg-gradient-to-r from-gold/10 to-transparent">
              <div className="flex items-center gap-3">
                {step !== 'collect_info' && step !== 'rating' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (step === 'select_service') setStep('collect_info');
                      else if (step === 'chatting') handleEndChat();
                    }}
                    className="text-white/60 hover:text-white hover:bg-white/10 mr-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gold to-gold/60 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{t('chat.title')}</h3>
                  <p className="text-white/50 text-xs">
                    {step === 'collect_info' && 'Let\'s get started'}
                    {step === 'select_service' && 'Choose a service'}
                    {step === 'chatting' && 'Online now'}
                    {step === 'rating' && 'Rate your experience'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Step 1: Collect User Info */}
            {step === 'collect_info' && (
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-gold" />
                  </div>
                  <h4 className="text-white text-lg font-semibold mb-2">Welcome to JJ Global Capital</h4>
                  <p className="text-zinc-400 text-sm">Please provide your details to start chatting with our AI assistant</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-300 text-sm flex items-center gap-2 mb-2">
                      <UserCircle className="w-4 h-4 text-gold" />
                      Your Name *
                    </Label>
                    <Input
                      value={userInfo.name}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter your full name"
                      className="bg-white/10 border-gold/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-zinc-300 text-sm flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gold" />
                      Email Address *
                    </Label>
                    <Input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="bg-white/10 border-gold/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-zinc-300 text-sm flex items-center gap-2 mb-2">
                      <PhoneIcon className="w-4 h-4 text-gold" />
                      Phone Number (Optional)
                    </Label>
                    <Input
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+971 50 000 0000"
                      className="bg-white/10 border-gold/20 text-white placeholder:text-white/40"
                    />
                  </div>

                  <Button
                    onClick={handleStartChat}
                    className="w-full bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold mt-4"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Select Service */}
            {step === 'select_service' && (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-center mb-4">
                  <h4 className="text-white text-lg font-semibold mb-1">Hi {userInfo.name}!</h4>
                  <p className="text-zinc-400 text-sm">Which service are you looking for?</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {SERVICES.map((service) => {
                    const Icon = service.icon;
                    return (
                      <button
                        key={service.id}
                        onClick={() => handleSelectService(service.id)}
                        className="p-4 bg-white/5 hover:bg-gold/10 border border-zinc-700 hover:border-gold/50 rounded-xl text-left transition-all duration-300 group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gold/10 group-hover:bg-gold/20 flex items-center justify-center mb-3">
                          <Icon className="w-5 h-5 text-gold" />
                        </div>
                        <h5 className="text-white text-sm font-medium mb-1">{service.label}</h5>
                        <p className="text-zinc-500 text-xs">{service.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Chat */}
            {step === 'chatting' && (
              <>
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user'
                              ? 'bg-gold/20 text-gold'
                              : 'bg-gradient-to-r from-gold to-gold/60 text-black'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4" />
                          )}
                        </div>
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                            message.role === 'user'
                              ? 'bg-gold/20 text-white rounded-tr-sm'
                              : 'bg-white/10 text-white/90 rounded-tl-sm'
                          }`}
                        >
                          {message.content}
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold to-gold/60 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-black" />
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl rounded-tl-sm">
                          <Loader2 className="w-4 h-4 text-gold animate-spin" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-gold/20 bg-black/30">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={t('chat.placeholder')}
                      className="flex-1 bg-white/10 border-gold/20 text-white placeholder:text-white/40 focus:border-gold/50"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="bg-gold hover:bg-gold/90 text-black"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Rating */}
            {step === 'rating' && (
              <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <div className="text-center mb-6">
                  <h4 className="text-white text-xl font-semibold mb-2">How was your experience?</h4>
                  <p className="text-zinc-400 text-sm">Your feedback helps us improve</p>
                </div>

                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-gold fill-gold'
                            : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <Input
                  value={ratingFeedback}
                  onChange={(e) => setRatingFeedback(e.target.value)}
                  placeholder="Any additional feedback? (optional)"
                  className="w-full bg-white/10 border-gold/20 text-white placeholder:text-white/40 mb-4"
                />

                <Button
                  onClick={handleSubmitRating}
                  className="w-full bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold"
                >
                  {rating > 0 ? 'Submit Rating' : 'Skip'}
                </Button>

                <p className="text-zinc-500 text-xs mt-4 text-center">
                  Need more help? Contact us at contact@jjglobalcapital.com
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatWidget;