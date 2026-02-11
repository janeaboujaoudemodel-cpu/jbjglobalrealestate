import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Import refactored components
import { 
  Message, 
  ChatHistoryItem, 
  UserInfo, 
  ChatStep, 
  SERVICES, 
  APPROVED_CONTACT_BLOCK,
  initialUserInfo,
  getRandomAgent
} from './chat/types';
import ChatHeader from './chat/ChatHeader';
import ChatWelcome from './chat/ChatWelcome';
import ChatEmailCheck from './chat/ChatEmailCheck';
import ChatHistoryView from './chat/ChatHistory';
import ChatLeadForm from './chat/ChatLeadForm';
import ChatServiceSelector from './chat/ChatServiceSelector';
import ChatMessages from './chat/ChatMessages';
import ChatRating from './chat/ChatRating';
import ChatSubmitted from './chat/ChatSubmitted';
import CollapsedChatButton from './chat/CollapsedChatButton';
import ChatAgentJoining from './chat/ChatAgentJoining';
import ChatShortcuts, { ShortcutType } from './chat/ChatShortcuts';
import ChatCVSubmission from './chat/ChatCVSubmission';
import ChatCVConfirmation from './chat/ChatCVConfirmation';
import ChatFeedback, { FeedbackType } from './chat/ChatFeedback';
import ChatConversationalCollect from './chat/ChatConversationalCollect';

interface AIChatWidgetProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMinimize?: () => void;
  showAttentionPulse?: boolean;
}

const AIChatWidget = ({ isCollapsed, onToggleCollapse, onMinimize, showAttentionPulse = false }: AIChatWidgetProps) => {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  
  // Get a consistent agent for this session
  const currentAgent = useMemo(() => getRandomAgent(), []);
  
  // State
  const [step, setStep] = useState<ChatStep>('welcome_choice');
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState<ShortcutType | null>(null);
  const [detectedFullName, setDetectedFullName] = useState<string | null>(null);

  // Fetch logged-in user's display name
  useEffect(() => {
    if (!user) {
      setDetectedFullName(null);
      return;
    }

    const fetchUserName = async () => {
      try {
        // Try crm_users_profile first
        const { data: profile } = await supabase
          .from('crm_users_profile')
          .select('display_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profile?.display_name) {
          setDetectedFullName(profile.display_name);
          return;
        }

        // Fallback to user metadata
        const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
        if (metaName) {
          setDetectedFullName(metaName);
          return;
        }

        // Last fallback: email prefix
        if (user.email) {
          setDetectedFullName(user.email.split('@')[0]);
        }
      } catch (err) {
        console.warn('Could not fetch user display name:', err);
      }
    };

    fetchUserName();
  }, [user]);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const savedStep = sessionStorage.getItem('jbj_chat_step');
    const savedUserInfo = sessionStorage.getItem('jbj_chat_user');
    if (savedStep) {
      setStep(savedStep as ChatStep);
    }
    if (savedUserInfo) {
      try {
        setUserInfo(JSON.parse(savedUserInfo));
      } catch (e) {
        console.error('Failed to parse saved user info:', e);
      }
    }
  }, []);

  // Persist step and userInfo to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('jbj_chat_step', step);
    sessionStorage.setItem('jbj_chat_user', JSON.stringify(userInfo));
  }, [step, userInfo]);

  // Check email in database
  const checkEmailInDatabase = async (email: string): Promise<{ exists: boolean; data?: any }> => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking email:', error);
        return { exists: false };
      }

      if (data) {
        // Pre-fill user info
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
          birthday: (data as any).birthday || '',
          consentAccurate: true,
          consentPrivacy: true,
        });
        
        // Fetch chat history
        await fetchChatHistory(data.email);
        
        return { exists: true, data };
      }

      return { exists: false };
    } catch (error) {
      console.error('Error checking email:', error);
      return { exists: false };
    }
  };

  // Fetch chat history
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

  // Handle email verification result
  const handleEmailVerified = (email: string, isExisting: boolean, userData?: any) => {
    if (isExisting) {
      setIsExistingUser(true);
      toast.success('Welcome back! We found your profile.');
      // Show shortcuts for returning users instead of chat history
      setStep('shortcuts');
    } else {
      setUserInfo(prev => ({ ...prev, email }));
      setIsExistingUser(false);
      // Use conversational AI collection instead of form
      setStep('conversational_collect');
    }
  };

  // Handle conversational collect completion
  const handleConversationalComplete = (info: { firstName: string; lastName: string; email: string; phone: string }) => {
    setUserInfo(prev => ({
      ...prev,
      firstName: info.firstName,
      lastName: info.lastName,
      email: info.email,
      phone: info.phone,
      consentAccurate: true,
      consentPrivacy: true,
    }));
    // Proceed to shortcuts after collecting info
    setStep('shortcuts');
  };

  // Handle user preferring form instead of conversational
  const handlePreferForm = () => {
    setStep('collect_info');
  };

  // Continue existing conversation
  const handleContinueConversation = (conversation: ChatHistoryItem) => {
    setConversationId(conversation.id);
    setSelectedService(conversation.service_type);
    
    const restoredMessages: Message[] = conversation.messages.map((msg, index) => ({
      id: `restored-${index}`,
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
    }));
    
    setMessages(restoredMessages);
    setStep('chatting');
  };

  // Select service and create conversation
  const handleSelectService = async (serviceId: string) => {
    setSelectedService(serviceId);
    
    const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
    const pageSource = window.location.pathname;
    
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

      // Use backend edge function to save lead (bypasses RLS)
      const normalizedEmail = userInfo.email.toLowerCase().trim();
      const normalizedPhone = userInfo.phone?.replace(/[\s\-\(\)]/g, '') || null;
      
      const { error: captureError } = await supabase.functions.invoke('capture-lead', {
        body: {
          email: normalizedEmail,
          fullName: fullName,
          phone: normalizedPhone,
          nationality: userInfo.nationality,
          language: userInfo.language,
          currentLocation: userInfo.currentLocation,
          ageRange: userInfo.ageRange,
          source: 'ai_chat_support',
          subSource: `Chat - ${serviceId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          pageSource: pageSource,
          contactType: 'client',
        },
      });

      if (captureError) {
        console.warn('Lead capture warning:', captureError);
      }

    } catch (error) {
      console.error('Error creating conversation:', error);
    }

    // Show agent joining animation
    setStep('agent_joining');
  };

  // When agent is ready, start the chat
  const handleAgentReady = () => {
    const serviceName = SERVICES.find(s => s.id === selectedService)?.label || 'our services';
    
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Hi ${userInfo.firstName}! 👋 Thank you for contacting JBJ GLOBAL REAL ESTATE.\n\nI'm ${currentAgent.name}, your ${currentAgent.title}. I'll be assisting you with ${serviceName} today.\n\nHow can I help you? Feel free to ask me anything about UAE Real Estate, properties, or any questions you have!`,
        timestamp: new Date(),
      },
    ]);
    
    setStep('chatting');
  };

  // Save messages to database
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

  // Send message with streaming
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

    // Create placeholder for streaming response
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };
    
    setMessages([...newMessages, assistantMessage]);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Try streaming first, fallback to regular endpoint
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Use streaming endpoint
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: userMessage.content,
            history: conversationHistory,
            service: selectedService,
            userName: userInfo.firstName,
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let streamedContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.content) {
                    streamedContent += data.content;
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === assistantMessageId 
                          ? { ...msg, content: streamedContent }
                          : msg
                      )
                    );
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }

          if (streamedContent) {
            const finalMessages = newMessages.concat({
              ...assistantMessage,
              content: streamedContent,
            });
            await saveMessagesToDb(finalMessages);
            setIsLoading(false);
            return;
          }
        }
      }

      // Fallback to non-streaming endpoint
      const { data, error } = await supabase.functions.invoke('ai-chat-support', {
        body: {
          message: userMessage.content,
          history: conversationHistory,
          service: selectedService,
          userName: userInfo.firstName,
        },
      });

      if (error) throw error;

      const finalContent = data.response || `I apologize, but I encountered an issue. Please contact our team directly:${APPROVED_CONTACT_BLOCK}`;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: finalContent }
            : msg
        )
      );

      const updatedMessages = [...newMessages, { ...assistantMessage, content: finalContent }];
      await saveMessagesToDb(updatedMessages);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: `I apologize for the technical difficulty. Please contact our team directly:${APPROVED_CONTACT_BLOCK}` }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Submit to team
  const handleSubmitToTeam = async () => {
    if (!conversationId) return;

    try {
      // 1) Update conversation and lead status (CRITICAL)
      await supabase
        .from('chat_conversations')
        .update({ status: 'submitted_to_team' })
        .eq('id', conversationId);

      await supabase
        .from('leads')
        .update({ status: 'submitted' })
        .eq('email', userInfo.email);

      // 2) Best-effort admin notification (must NOT block)
      try {
        await supabase.functions.invoke('send-inquiry-email', {
          body: {
            fullName: `${userInfo.firstName} ${userInfo.lastName}`,
            email: userInfo.email,
            phone: userInfo.phone?.replace(/[\s\-\(\)]/g, '') || '+971000000000',
            nationality: userInfo.nationality || 'Not specified',
            language: userInfo.language || 'English',
            message: `Chat inquiry from ${userInfo.nationality} - ${userInfo.currentLocation}\nService: ${selectedService}\nLanguage: ${userInfo.language}\n\nConversation transcript attached.`,
            source: 'ai_chat_widget',
          },
        });
      } catch (notifyErr) {
        console.warn('Chat notification failed (lead still saved):', notifyErr);
      }

      setStep('submitted');
      toast.success('Your inquiry has been submitted to our team!');
    } catch (error) {
      console.error('Error submitting to team:', error);
      toast.error('Failed to submit. Please try again.');
    }
  };

  // Handle rating submission
  const handleSubmitRating = async (rating: number, feedback: string) => {
    if (conversationId && rating > 0) {
      try {
        await supabase
          .from('chat_conversations')
          .update({ 
            rating,
            rating_feedback: feedback || null,
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

  // Handle feedback submission (new simplified feedback)
  const handleSubmitFeedback = async (feedback: { type: FeedbackType; rating: number; comment: string }) => {
    if (conversationId) {
      try {
        await supabase
          .from('chat_conversations')
          .update({ 
            feedback_type: feedback.type,
            rating: feedback.rating,
            rating_feedback: feedback.comment || null,
            status: 'completed'
          })
          .eq('id', conversationId);
        
        toast.success('Thank you for your feedback!');
      } catch (error) {
        console.error('Error saving feedback:', error);
      }
    }
  };

  // Handle shortcut selection
  const handleSelectShortcut = (shortcut: ShortcutType) => {
    setSelectedShortcut(shortcut);
    
    if (shortcut === 'submit_cv') {
      setStep('cv_submission');
    } else {
      // Map shortcut to service type and proceed to agent
      const serviceMap: Record<ShortcutType, string> = {
        'submit_cv': 'careers',
        'buy_property': 'real_estate',
        'rent_property': 'holiday_homes',
        'property_management': 'partner_intro',
        'design_services': 'design_build',
        'legal_partners': 'partner_intro',
        'general_inquiry': 'general',
      };
      
      setSelectedService(serviceMap[shortcut] || 'general');
      handleSelectService(serviceMap[shortcut] || 'general');
    }
  };

  // Handle CV submission success
  const handleCVSubmitSuccess = () => {
    setStep('cv_submitted');
  };

  // Handle user info field update
  const handleUserInfoFieldUpdate = (field: string, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  // Reset chat and clear session storage
  const resetChat = () => {
    setStep('welcome_choice');
    setIsExistingUser(false);
    setUserInfo(initialUserInfo);
    setSelectedService(null);
    setSelectedShortcut(null);
    setMessages([]);
    setConversationId(null);
    setFormErrors({});
    setChatHistory([]);
    // Clear session storage
    sessionStorage.removeItem('jbj_chat_step');
    sessionStorage.removeItem('jbj_chat_user');
  };

  // Handle back navigation
  const handleBack = () => {
    switch (step) {
      case 'check_email':
        setStep('welcome_choice');
        break;
      case 'shortcuts':
        setStep('check_email');
        break;
      case 'cv_submission':
        setStep('shortcuts');
        break;
      case 'cv_submitted':
        setStep('shortcuts');
        break;
      case 'conversational_collect':
        setStep('welcome_choice');
        break;
      case 'collect_info':
        setStep('conversational_collect');
        break;
      case 'chat_history':
        setStep('check_email');
        break;
      case 'select_service':
        setStep(isExistingUser ? 'chat_history' : 'collect_info');
        break;
      case 'chatting':
        setStep('feedback');
        break;
      case 'feedback':
        resetChat();
        break;
    }
  };

  // Collapsed state
  if (isCollapsed) {
    return <CollapsedChatButton onToggle={onToggleCollapse} onMinimize={onMinimize} showAttentionPulse={showAttentionPulse} />;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: isRTL ? -380 : 380, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: isRTL ? -380 : 380, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed ${isRTL ? 'left-0' : 'right-0'} top-24 sm:top-28 lg:top-32 z-[9000] w-full sm:w-[380px] h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)] bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-l-2 border-gold shadow-2xl shadow-gold/20 flex flex-col overflow-hidden`}
      >
        <ChatHeader
          step={step} 
          isExistingUser={isExistingUser} 
          onBack={handleBack} 
          onToggleCollapse={onToggleCollapse} 
        />

        {step === 'welcome_choice' && (
          <ChatWelcome onStartChat={() => setStep('conversational_collect')} />
        )}

        {step === 'check_email' && (
          <ChatEmailCheck 
            onEmailVerified={handleEmailVerified}
            checkEmailInDatabase={checkEmailInDatabase}
          />
        )}

        {step === 'chat_history' && (
          <ChatHistoryView
            userFirstName={userInfo.firstName}
            chatHistory={chatHistory}
            isLoading={isLoadingHistory}
            onNewConversation={() => setStep('select_service')}
            onContinueConversation={handleContinueConversation}
          />
        )}

        {step === 'shortcuts' && (
          <ChatShortcuts
            userFirstName={userInfo.firstName}
            onSelectShortcut={handleSelectShortcut}
          />
        )}

        {step === 'cv_submission' && (
          <ChatCVSubmission
            userInfo={{
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              email: userInfo.email,
              phone: userInfo.phone,
            }}
            onUserInfoChange={handleUserInfoFieldUpdate}
            conversationId={conversationId}
            onSubmitSuccess={handleCVSubmitSuccess}
            onBack={() => setStep('shortcuts')}
          />
        )}

        {step === 'cv_submitted' && (
          <ChatCVConfirmation
            userFirstName={userInfo.firstName}
            onStartNewChat={resetChat}
            onGoToShortcuts={() => setStep('shortcuts')}
          />
        )}

        {step === 'conversational_collect' && (
          <ChatConversationalCollect
            onComplete={handleConversationalComplete}
            onPreferForm={handlePreferForm}
            initialEmail={userInfo.email || (user?.email ?? '')}
            detectedFullName={detectedFullName ?? undefined}
          />
        )}

        {step === 'collect_info' && (
          <ChatLeadForm
            userInfo={userInfo}
            onUserInfoChange={setUserInfo}
            onSubmit={() => setStep('shortcuts')}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
          />
        )}

        {step === 'select_service' && (
          <ChatServiceSelector
            userFirstName={userInfo.firstName}
            isExistingUser={isExistingUser}
            onSelectService={handleSelectService}
          />
        )}

        {step === 'agent_joining' && (
          <ChatAgentJoining
            agent={currentAgent}
            userFirstName={userInfo.firstName}
            onAgentReady={handleAgentReady}
          />
        )}

        {step === 'chatting' && (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            onSubmitToTeam={handleSubmitToTeam}
            userFirstName={userInfo.firstName}
            isExistingUser={isExistingUser}
            selectedService={selectedService}
          />
        )}

        {step === 'rating' && (
          <ChatRating 
            onSubmitRating={handleSubmitRating}
            onSkip={resetChat}
          />
        )}

        {step === 'feedback' && (
          <ChatFeedback
            onSubmitFeedback={handleSubmitFeedback}
            onSkip={resetChat}
          />
        )}

        {step === 'submitted' && (
          <ChatSubmitted 
            userFirstName={userInfo.firstName}
            onStartNewChat={resetChat}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AIChatWidget;
