import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, X, Send, Bot, User, Loader2, Star, Building2, Plane, Scale, Paintbrush, Calculator, Home, ChevronLeft, Mail, Phone as PhoneIcon, UserCircle, MapPin, Globe, Calendar, Shield, History, Plus, Clock, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CONTACT_INFO } from '@/constants/stats';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistoryItem {
  id: string;
  service_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
}

interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  language: string;
  currentLocation: string;
  ageRange: string;
  consentAccurate: boolean;
  consentPrivacy: boolean;
}

type ChatStep = 'welcome_choice' | 'check_email' | 'collect_info' | 'chat_history' | 'select_service' | 'chatting' | 'rating' | 'submitted';

// Agent persona for human-like experience
const AGENT = {
  name: 'Sara',
  fullName: 'Sara Al Rashid',
  title: 'Property Consultant',
  photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
};

const SERVICES = [
  { id: 'real_estate', icon: Building2, label: 'Property Sales & Leasing', description: 'Brokerage for buying, selling, leasing' },
  { id: 'holiday_homes', icon: Home, label: 'Holiday Homes', description: 'Short-term rental support' },
  { id: 'partner_intro', icon: Scale, label: 'Partner Introductions', description: 'Legal, mortgage, concierge partners' },
  { id: 'design_build', icon: Paintbrush, label: 'Design & Build', description: 'Architecture, interior, fit-out partners' },
  { id: 'concierge', icon: Plane, label: 'Luxury Concierge', description: 'Jets, yachts, VIP experiences' },
  { id: 'general', icon: MessageCircle, label: 'General Inquiry', description: 'Other questions' },
];

const AGE_RANGES = [
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-54', label: '45-54' },
  { value: '55+', label: '55+' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'arabic', label: 'العربية (Arabic)' },
  { value: 'french', label: 'Français (French)' },
  { value: 'russian', label: 'Русский (Russian)' },
  { value: 'chinese', label: '中文 (Chinese)' },
  { value: 'hindi', label: 'हिंदी (Hindi)' },
  { value: 'other', label: 'Other' },
];

// E.164 phone validation
const validateE164Phone = (phone: string): boolean => {
  // Must start with + and have 7-15 digits
  const e164Regex = /^\+[1-9]\d{6,14}$/;
  return e164Regex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Email validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get relative time ago string
const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Highlight matching text in search results
const HighlightText = ({ text, search }: { text: string; search: string }) => {
  if (!search.trim()) {
    return <>{text}</>;
  }
  
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <span key={i} className="bg-gold/40 text-gold font-medium rounded px-0.5">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// Approved contact info block for AI responses
const APPROVED_CONTACT_BLOCK = `

📧 Email: ${CONTACT_INFO.email}
📞 Phone: ${CONTACT_INFO.phone}
💬 WhatsApp: ${CONTACT_INFO.phone}

Our team is available to assist you.`;

const AIChatWidget = () => {
  const { t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<ChatStep>('welcome_choice');
  const [checkEmail, setCheckEmail] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    language: 'english',
    currentLocation: '',
    ageRange: '',
    consentAccurate: false,
    consentPrivacy: false,
  });
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if email exists in leads database
  const handleCheckEmail = async () => {
    if (!checkEmail.trim() || !validateEmail(checkEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('email', checkEmail.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error('Error checking email:', error);
      }

      if (data) {
        // Existing user found - pre-fill their info
        const nameParts = (data.full_name || '').split(' ');
        setUserInfo({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: data.email,
          phone: data.phone || '',
          nationality: data.nationality || '',
          language: data.language || 'english',
          currentLocation: data.current_location || '',
          ageRange: data.age_range || '',
          consentAccurate: true,
          consentPrivacy: true,
        });
        setIsExistingUser(true);
        
        // Fetch chat history for this user
        await fetchChatHistory(data.email);
        
        toast.success(`Welcome back! We found your profile.`);
        // Go to chat history view for existing users
        setStep('chat_history');
      } else {
        // New user - go to collect info
        setUserInfo(prev => ({ ...prev, email: checkEmail.trim() }));
        setIsExistingUser(false);
        setStep('collect_info');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      setUserInfo(prev => ({ ...prev, email: checkEmail.trim() }));
      setStep('collect_info');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Fetch chat history for a user
  const fetchChatHistory = async (email: string) => {
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, service_type, status, created_at, updated_at, messages')
        .eq('user_email', email.toLowerCase().trim())
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching chat history:', error);
        return;
      }

      // Type assertion for messages array
      const typedData = (data || []).map(item => ({
        ...item,
        messages: (item.messages as Array<{ role: string; content: string; timestamp: string }>) || []
      }));
      
      setChatHistory(typedData);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Continue an existing conversation
  const handleContinueConversation = (conversation: ChatHistoryItem) => {
    setConversationId(conversation.id);
    setSelectedService(conversation.service_type);
    
    // Restore messages from the conversation
    const restoredMessages: Message[] = conversation.messages.map((msg, index) => ({
      id: `restored-${index}`,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }));
    
    setMessages(restoredMessages);
    setStep('chatting');
  };

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!userInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!userInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!userInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(userInfo.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!userInfo.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!validateE164Phone(userInfo.phone)) {
      errors.phone = 'Use international format (e.g., +971501234567)';
    }
    if (!userInfo.nationality.trim()) errors.nationality = 'Nationality is required';
    if (!userInfo.currentLocation.trim()) errors.currentLocation = 'Location is required';
    if (!userInfo.ageRange) errors.ageRange = 'Age range is required';
    if (!userInfo.consentAccurate) errors.consentAccurate = 'Please confirm information is accurate';
    if (!userInfo.consentPrivacy) errors.consentPrivacy = 'Please agree to Privacy Policy';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStartChat = async () => {
    if (!validateForm()) {
      toast.error('Please complete all required fields');
      return;
    }
    setStep('select_service');
  };

  const handleSelectService = async (serviceId: string) => {
    setSelectedService(serviceId);
    
    const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
    const pageSource = window.location.pathname;
    
    // Create conversation in database
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_email: userInfo.email,
          user_name: fullName,
          user_phone: userInfo.phone,
          service_type: serviceId,
          messages: [],
          status: 'active',
          page_source: pageSource,
        })
        .select('id')
        .single();

      if (error) throw error;
      setConversationId(data.id);

      // Save to leads table with full info
      await supabase.from('leads').upsert({
        email: userInfo.email,
        full_name: fullName,
        phone: userInfo.phone,
        nationality: userInfo.nationality,
        language: userInfo.language,
        current_location: userInfo.currentLocation,
        age_range: userInfo.ageRange,
        consent_accurate: userInfo.consentAccurate,
        consent_privacy: userInfo.consentPrivacy,
        page_source: pageSource,
        source: 'ai_chat_support',
        status: 'new',
      }, { onConflict: 'email' });

    } catch (error) {
      console.error('Error creating conversation:', error);
    }

    const serviceName = SERVICES.find(s => s.id === serviceId)?.label || 'our services';
    
    // Welcome message - warm and human-like
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hey ${userInfo.firstName}! 👋 I'm ${AGENT.name}, nice to meet you!\n\nI help clients with ${serviceName} here at JJ Global Capital. I know Dubai real estate inside and out, so feel free to ask me anything about properties, prices, areas, developers... whatever's on your mind!\n\nAnd if you ever need to chat with the team directly, just tap the WhatsApp button. But I'm pretty quick with answers too 😊`,
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
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const { data, error } = await supabase.functions.invoke('ai-chat-support', {
        body: {
          message: userMessage.content,
          history: conversationHistory,
          service: selectedService,
          userName: userInfo.firstName,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || `I apologize, but I encountered an issue. Please contact our team directly:${APPROVED_CONTACT_BLOCK}`,
        timestamp: new Date(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      await saveMessagesToDb(updatedMessages);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `I apologize for the technical difficulty. Please contact our team directly:${APPROVED_CONTACT_BLOCK}`,
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

  const handleSubmitToTeam = async () => {
    if (!conversationId) return;

    try {
      // Update conversation status
      await supabase
        .from('chat_conversations')
        .update({ status: 'submitted_to_team' })
        .eq('id', conversationId);

      // Update lead status
      await supabase
        .from('leads')
        .update({ status: 'submitted' })
        .eq('email', userInfo.email);

      // Send notification email
      await supabase.functions.invoke('send-inquiry-email', {
        body: {
          name: `${userInfo.firstName} ${userInfo.lastName}`,
          email: userInfo.email,
          phone: userInfo.phone,
          message: `Chat inquiry from ${userInfo.nationality} - ${userInfo.currentLocation}\nService: ${selectedService}\nLanguage: ${userInfo.language}\n\nConversation transcript attached.`,
          subject: `[Chat Lead] ${userInfo.firstName} ${userInfo.lastName} - ${selectedService}`,
          source: 'ai_chat_widget',
        },
      });

      setStep('submitted');
      toast.success('Your inquiry has been submitted to our team!');
    } catch (error) {
      console.error('Error submitting to team:', error);
      toast.error('Failed to submit. Please try again.');
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
    
    resetChat();
  };

  const resetChat = () => {
    setIsOpen(false);
    setTimeout(() => {
      setStep('welcome_choice');
      setCheckEmail('');
      setIsExistingUser(false);
      setUserInfo({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationality: '',
        language: 'english',
        currentLocation: '',
        ageRange: '',
        consentAccurate: false,
        consentPrivacy: false,
      });
      setSelectedService(null);
      setMessages([]);
      setConversationId(null);
      setRating(0);
      setRatingFeedback('');
      setFormErrors({});
      setChatHistory([]);
      setHistorySearch('');
    }, 300);
  };

  const handleClose = () => {
    if (step === 'chatting' && messages.length > 1) {
      handleEndChat();
    } else {
      resetChat();
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
              Chat with us
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
            className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 w-[420px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-zinc-900/95 backdrop-blur-xl border border-gold/30 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gold/20 bg-gradient-to-r from-gold/10 to-transparent">
              <div className="flex items-center gap-3">
                {step !== 'welcome_choice' && step !== 'rating' && step !== 'submitted' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (step === 'check_email') setStep('welcome_choice');
                      else if (step === 'collect_info') setStep('check_email');
                      else if (step === 'chat_history') setStep('check_email');
                      else if (step === 'select_service') setStep(isExistingUser ? 'chat_history' : 'collect_info');
                      else if (step === 'chatting') handleEndChat();
                    }}
                    className="text-white/60 hover:text-white hover:bg-white/10 mr-1"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/40">
                  <img 
                    src={AGENT.photo} 
                    alt={AGENT.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">{AGENT.name}</h3>
                  <p className="text-white/50 text-xs">
                    {step === 'welcome_choice' && 'How can I help you?'}
                    {step === 'check_email' && 'Just need your email'}
                    {step === 'collect_info' && "Let's get to know you"}
                    {step === 'chat_history' && 'Your conversations'}
                    {step === 'select_service' && "What can I help with?"}
                    {step === 'chatting' && '🟢 Online • Here to help'}
                    {step === 'rating' && 'How did I do?'}
                    {step === 'submitted' && 'Thank you!'}
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

            {/* Step 0: Welcome Choice - AI or WhatsApp */}
            {step === 'welcome_choice' && (
              <div className="flex-1 p-6 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold/40">
                    <img 
                      src={AGENT.photo} 
                      alt={AGENT.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-white text-lg font-semibold mb-2">Hey there! I'm {AGENT.name} 👋</h4>
                  <p className="text-zinc-400 text-sm">Your property consultant at JJ Global Capital</p>
                </div>

                <div className="space-y-3">
                  {/* Chat with Sara Option */}
                  <button
                    onClick={() => setStep('check_email')}
                    className="w-full p-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border border-gold/30 hover:border-gold/50 rounded-xl text-left transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold/40">
                        <img 
                          src={AGENT.photo} 
                          alt={AGENT.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white text-sm font-semibold mb-1">💬 Chat with me now</h5>
                        <p className="text-gold text-xs font-medium">⚡ Quick answers • Available 24/7</p>
                        <p className="text-zinc-400 text-xs mt-1">I know everything about Dubai properties, areas, prices & more!</p>
                      </div>
                    </div>
                  </button>

                  {/* WhatsApp Option */}
                  <a
                    href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent("Hi! I'd like to speak with someone about property investment in Dubai.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl text-left transition-all duration-300 group block"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white text-sm font-semibold mb-1">📱 Chat on WhatsApp</h5>
                        <p className="text-green-400 text-xs font-medium">Talk directly with our team</p>
                        <p className="text-zinc-400 text-xs mt-1">For urgent matters or personalized consultation</p>
                      </div>
                    </div>
                  </a>

                  <p className="text-zinc-500 text-xs text-center mt-4 px-4">
                    💡 <strong className="text-zinc-400">Tip:</strong> I can answer most questions right away. If it gets complex, I'll connect you to our team on WhatsApp!
                  </p>
                </div>
              </div>
            )}

            {/* Step 1: Check Email */}
            {step === 'check_email' && (
              <div className="flex-1 p-6 flex flex-col justify-center">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold/40">
                    <img 
                      src={AGENT.photo} 
                      alt={AGENT.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="text-white text-lg font-semibold mb-2">Nice to meet you!</h4>
                  <p className="text-zinc-400 text-sm">Just pop in your email so I can give you personalized help</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-300 text-sm flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gold" />
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      value={checkEmail}
                      onChange={(e) => setCheckEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCheckEmail()}
                      placeholder="your@email.com"
                      className="bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-12 text-base"
                      autoFocus
                    />
                  </div>

                  <Button
                    onClick={handleCheckEmail}
                    disabled={isCheckingEmail || !checkEmail.trim()}
                    className="w-full h-12 bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold"
                  >
                    {isCheckingEmail ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue to AI Chat
                        <Bot className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <p className="text-zinc-500 text-xs text-center mt-4">
                    Been here before? I'll remember you! New here? Quick intro and we're good to go.
                  </p>
                </div>
              </div>
            )}

            {/* Step: Chat History (Returning Users) */}
            {step === 'chat_history' && (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center">
                    <History className="w-7 h-7 text-gold" />
                  </div>
                  <h4 className="text-white text-lg font-semibold mb-1">Welcome back, {userInfo.firstName}!</h4>
                  <p className="text-zinc-400 text-sm">Continue a conversation or start fresh</p>
                </div>

                {/* New Conversation Button */}
                <button
                  onClick={() => setStep('select_service')}
                  className="w-full p-4 mb-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border border-gold/30 hover:border-gold/50 rounded-xl text-left transition-all duration-300 group flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <h5 className="text-white text-sm font-semibold">Start New Conversation</h5>
                    <p className="text-gold text-xs">Ask me anything about properties & services</p>
                  </div>
                </button>

                {/* WhatsApp Quick Access */}
                <a
                  href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userInfo.firstName}. I'd like to chat about my property inquiry.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3 mb-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-300 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-white text-sm font-medium">Chat on WhatsApp</h5>
                    <p className="text-green-400 text-xs">Direct access • Instant response</p>
                  </div>
                </a>

                {/* Search Bar for Chat History */}
                {chatHistory.length > 0 && !isLoadingHistory && (
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="pl-9 bg-white/5 border-zinc-700 text-white placeholder:text-zinc-500 h-9 text-sm"
                    />
                    {historySearch && (
                      <button
                        onClick={() => setHistorySearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Previous Conversations */}
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                  </div>
                ) : chatHistory.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs font-medium mb-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Previous Conversations
                      {historySearch && ` (filtered)`}
                    </p>
                    {chatHistory
                      .filter((conv) => {
                        if (!historySearch.trim()) return true;
                        const search = historySearch.toLowerCase();
                        const serviceName = SERVICES.find(s => s.id === conv.service_type)?.label || 'General';
                        // Search in service name, status, and message content
                        const matchesService = serviceName.toLowerCase().includes(search);
                        const matchesStatus = conv.status.toLowerCase().includes(search);
                        const matchesMessages = conv.messages?.some(msg => 
                          msg.content.toLowerCase().includes(search)
                        );
                        return matchesService || matchesStatus || matchesMessages;
                      })
                      .map((conv) => {
                      const serviceName = SERVICES.find(s => s.id === conv.service_type)?.label || 'General';
                      const messageCount = conv.messages?.length || 0;
                      const lastMessage = conv.messages?.[conv.messages.length - 1]?.content || '';
                      const preview = lastMessage.substring(0, 60) + (lastMessage.length > 60 ? '...' : '');
                      const date = new Date(conv.updated_at);
                      const timeAgo = getTimeAgo(date);

                      return (
                        <button
                          key={conv.id}
                          onClick={() => handleContinueConversation(conv)}
                          className="w-full p-3 bg-white/5 hover:bg-white/10 border border-zinc-700 hover:border-gold/30 rounded-lg text-left transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-white text-sm font-medium">
                                  <HighlightText text={serviceName} search={historySearch} />
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  conv.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                  conv.status === 'completed' ? 'bg-zinc-500/20 text-zinc-400' :
                                  'bg-gold/20 text-gold'
                                }`}>
                                  <HighlightText 
                                    text={conv.status === 'active' ? 'Active' : conv.status === 'completed' ? 'Completed' : 'Submitted'} 
                                    search={historySearch} 
                                  />
                                </span>
                              </div>
                              <p className="text-zinc-400 text-xs truncate">
                                <HighlightText text={preview || 'No messages yet'} search={historySearch} />
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-zinc-500 text-[10px]">{timeAgo}</p>
                              <p className="text-zinc-600 text-[10px]">{messageCount} msgs</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                    {/* No search results */}
                    {historySearch && chatHistory.filter((conv) => {
                      const search = historySearch.toLowerCase();
                      const serviceName = SERVICES.find(s => s.id === conv.service_type)?.label || 'General';
                      return serviceName.toLowerCase().includes(search) ||
                        conv.status.toLowerCase().includes(search) ||
                        conv.messages?.some(msg => msg.content.toLowerCase().includes(search));
                    }).length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-zinc-500 text-sm">No conversations match "{historySearch}"</p>
                        <button
                          onClick={() => setHistorySearch('')}
                          className="text-gold text-xs hover:underline mt-1"
                        >
                          Clear search
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-zinc-500 text-sm">No previous conversations found</p>
                    <p className="text-zinc-600 text-xs mt-1">Start a new chat above!</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Collect User Info (New Users Only) */}
            {step === 'collect_info' && (
              <ScrollArea className="flex-1 p-4">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center">
                    <UserCircle className="w-7 h-7 text-gold" />
                  </div>
                  <h4 className="text-white text-base font-semibold mb-1">Complete Your Profile</h4>
                  <p className="text-zinc-400 text-xs">Just a few quick questions to personalize your experience.</p>
                </div>

                <div className="space-y-3">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
                        <UserCircle className="w-3 h-3 text-gold" />
                        First Name *
                      </Label>
                      <Input
                        value={userInfo.firstName}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                        placeholder="First name"
                        className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.firstName ? 'border-red-500' : ''}`}
                      />
                      {formErrors.firstName && <p className="text-red-400 text-xs mt-0.5">{formErrors.firstName}</p>}
                    </div>
                    <div>
                      <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
                        Last Name *
                      </Label>
                      <Input
                        value={userInfo.lastName}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Last name"
                        className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.lastName ? 'border-red-500' : ''}`}
                      />
                      {formErrors.lastName && <p className="text-red-400 text-xs mt-0.5">{formErrors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
                      <Mail className="w-3 h-3 text-gold" />
                      Email *
                    </Label>
                    <Input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your@email.com"
                      className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.email ? 'border-red-500' : ''}`}
                    />
                    {formErrors.email && <p className="text-red-400 text-xs mt-0.5">{formErrors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
                      <PhoneIcon className="w-3 h-3 text-gold" />
                      Phone (with country code) *
                    </Label>
                    <Input
                      type="tel"
                      value={userInfo.phone}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+971 50 123 4567"
                      className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.phone ? 'border-red-500' : ''}`}
                    />
                    {formErrors.phone && <p className="text-red-400 text-xs mt-0.5">{formErrors.phone}</p>}
                  </div>

                  {/* Nationality & Location Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
                        <Globe className="w-3 h-3 text-gold" />
                        Nationality *
                      </Label>
                      <Input
                        value={userInfo.nationality}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, nationality: e.target.value }))}
                        placeholder="e.g., British"
                        className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.nationality ? 'border-red-500' : ''}`}
                      />
                      {formErrors.nationality && <p className="text-red-400 text-xs mt-0.5">{formErrors.nationality}</p>}
                    </div>
                    <div>
                      <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 text-gold" />
                        Current Location *
                      </Label>
                      <Input
                        value={userInfo.currentLocation}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, currentLocation: e.target.value }))}
                        placeholder="City, Country"
                        className={`bg-white/10 border-gold/20 text-white placeholder:text-white/40 h-9 text-sm ${formErrors.currentLocation ? 'border-red-500' : ''}`}
                      />
                      {formErrors.currentLocation && <p className="text-red-400 text-xs mt-0.5">{formErrors.currentLocation}</p>}
                    </div>
                  </div>

                  {/* Language & Age Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-zinc-300 text-xs mb-1 block">Preferred Language</Label>
                      <Select value={userInfo.language} onValueChange={(v) => setUserInfo(prev => ({ ...prev, language: v }))}>
                        <SelectTrigger className="bg-white/10 border-gold/20 text-white h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-zinc-300 text-xs flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-gold" />
                        Age Range *
                      </Label>
                      <Select value={userInfo.ageRange} onValueChange={(v) => setUserInfo(prev => ({ ...prev, ageRange: v }))}>
                        <SelectTrigger className={`bg-white/10 border-gold/20 text-white h-9 text-sm ${formErrors.ageRange ? 'border-red-500' : ''}`}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {AGE_RANGES.map(age => (
                            <SelectItem key={age.value} value={age.value}>{age.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.ageRange && <p className="text-red-400 text-xs mt-0.5">{formErrors.ageRange}</p>}
                    </div>
                  </div>

                  {/* Consent Checkboxes */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="consent-accurate"
                        checked={userInfo.consentAccurate}
                        onCheckedChange={(checked) => setUserInfo(prev => ({ ...prev, consentAccurate: checked === true }))}
                        className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
                      />
                      <label htmlFor="consent-accurate" className="text-zinc-300 text-xs leading-tight cursor-pointer">
                        I confirm the information provided is accurate. *
                      </label>
                    </div>
                    {formErrors.consentAccurate && <p className="text-red-400 text-xs ml-6">{formErrors.consentAccurate}</p>}
                    
                    <div className="flex items-start gap-2">
                      <Checkbox
                        id="consent-privacy"
                        checked={userInfo.consentPrivacy}
                        onCheckedChange={(checked) => setUserInfo(prev => ({ ...prev, consentPrivacy: checked === true }))}
                        className="border-gold/50 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
                      />
                      <label htmlFor="consent-privacy" className="text-zinc-300 text-xs leading-tight cursor-pointer">
                        I agree to the <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-gold hover:underline">Terms</Link>. *
                      </label>
                    </div>
                    {formErrors.consentPrivacy && <p className="text-red-400 text-xs ml-6">{formErrors.consentPrivacy}</p>}
                  </div>

                  <Button
                    onClick={handleStartChat}
                    className="w-full bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold mt-3"
                  >
                    Continue
                  </Button>
                </div>
              </ScrollArea>
            )}

            {/* Step 2: Select Service */}
            {step === 'select_service' && (
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="text-center mb-4">
                  <h4 className="text-white text-lg font-semibold mb-1">
                    {isExistingUser ? `Welcome back, ${userInfo.firstName}!` : `Hi ${userInfo.firstName}!`}
                  </h4>
                  <p className="text-zinc-400 text-sm">
                    {isExistingUser ? 'Great to see you again! How can we help?' : 'Which service are you looking for?'}
                  </p>
                </div>

                {/* WhatsApp Direct Access for Existing Users */}
                {isExistingUser && (
                  <a
                    href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userInfo.firstName}. I'd like to chat about my property inquiry.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 mb-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 rounded-xl transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-white text-sm font-semibold">Chat on WhatsApp</h5>
                      <p className="text-green-400 text-xs">Direct access • Instant response</p>
                    </div>
                    <div className="text-green-400 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </a>
                )}

                <p className="text-zinc-500 text-xs text-center mb-3">
                  {isExistingUser ? 'Or chat with our AI assistant:' : 'Select a topic to get started:'}
                </p>

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
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gold/20 text-gold">
                            <User className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gold/30">
                            <img 
                              src={AGENT.photo} 
                              alt={AGENT.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] p-3 rounded-xl ${
                            message.role === 'user'
                              ? 'bg-gold/20 text-white'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className="text-[10px] text-white/40 mt-1">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gold/30">
                          <img 
                            src={AGENT.photo} 
                            alt={AGENT.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="bg-white/10 p-3 rounded-xl flex items-center gap-1">
                            <motion.span
                              className="w-2 h-2 bg-gold rounded-full"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-gold rounded-full"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                            />
                            <motion.span
                              className="w-2 h-2 bg-gold rounded-full"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                            />
                          </div>
                          <p className="text-zinc-400 text-xs italic ml-1">{AGENT.name} is typing...</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>

                {/* Action Buttons */}
                <div className="px-4 py-2 border-t border-zinc-800 flex gap-2">
                  {isExistingUser && (
                    <a
                      href={`https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${encodeURIComponent(`Hi, I'm ${userInfo.firstName}. I was chatting with the AI about ${SERVICES.find(s => s.id === selectedService)?.label || 'property inquiries'}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm py-2 rounded-md transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                  <Button
                    onClick={handleSubmitToTeam}
                    className={`${isExistingUser ? 'flex-1' : 'w-full'} bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-2`}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Submit to Team
                  </Button>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gold/20 bg-black/20">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      className="flex-1 bg-white/10 border-gold/20 text-white placeholder:text-white/40"
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
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gold/20 to-gold/10 flex items-center justify-center mb-4">
                  <Star className="w-8 h-8 text-gold" />
                </div>
                <h4 className="text-white text-lg font-semibold mb-2">How was your experience?</h4>
                <p className="text-zinc-400 text-sm text-center mb-6">Your feedback helps us improve</p>

                <div className="flex gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
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
                  className="bg-white/10 border-gold/20 text-white placeholder:text-white/40 mb-4"
                />

                <Button
                  onClick={handleSubmitRating}
                  className="w-full bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold"
                >
                  Submit Feedback
                </Button>
              </div>
            )}

            {/* Step 5: Submitted */}
            {step === 'submitted' && (
              <div className="flex-1 p-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-white text-lg font-semibold mb-2">Submitted Successfully!</h4>
                <p className="text-zinc-400 text-sm text-center mb-4">Our team will contact you within 24 hours.</p>
                
                <div className="bg-zinc-800/50 rounded-lg p-4 text-center mb-4">
                  <p className="text-zinc-300 text-sm mb-2">Contact us directly:</p>
                  <p className="text-gold text-sm font-medium">{CONTACT_INFO.email}</p>
                  <p className="text-gold text-sm font-medium">{CONTACT_INFO.phone}</p>
                </div>

                <Button
                  onClick={resetChat}
                  className="w-full bg-gradient-to-r from-gold to-gold/80 hover:from-gold/90 hover:to-gold/70 text-black font-semibold"
                >
                  Start New Conversation
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatWidget;
