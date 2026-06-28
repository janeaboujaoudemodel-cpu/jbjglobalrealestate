import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Loader2, FileText, CheckCircle, Sparkles, Paperclip, X, Briefcase, MessageCircle, ArrowLeft, ArrowRight, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PhoneInput } from '@/components/ui/phone-input';
import { getCountryList, getLanguageList } from '@/constants/localeOptions';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const NATIONALITIES = [
  "Afghan","Albanian","Algerian","American","Andorran","Angolan","Argentine","Armenian","Australian","Austrian",
  "Azerbaijani","Bahraini","Bangladeshi","Belgian","Bolivian","Bosnian","Brazilian","British","Bulgarian","Cambodian",
  "Cameroonian","Canadian","Chilean","Chinese","Colombian","Croatian","Cuban","Czech","Danish","Dutch",
  "Ecuadorian","Egyptian","Emirati","Estonian","Ethiopian","Filipino","Finnish","French","Georgian","German",
  "Ghanaian","Greek","Hungarian","Icelandic","Indian","Indonesian","Iranian","Iraqi","Irish","Israeli",
  "Italian","Jamaican","Japanese","Jordanian","Kazakh","Kenyan","Korean","Kuwaiti","Latvian","Lebanese",
  "Libyan","Lithuanian","Luxembourgish","Malaysian","Maldivian","Maltese","Mexican","Moldovan","Mongolian","Moroccan",
  "Nepalese","New Zealander","Nigerian","Norwegian","Omani","Pakistani","Palestinian","Panamanian","Peruvian","Polish",
  "Portuguese","Qatari","Romanian","Russian","Saudi","Serbian","Singaporean","Slovak","Slovenian","South African",
  "Spanish","Sri Lankan","Sudanese","Swedish","Swiss","Syrian","Taiwanese","Thai","Tunisian","Turkish",
  "Ukrainian","Uruguayan","Uzbek","Venezuelan","Vietnamese","Yemeni","Zambian","Zimbabwean",
];
const LANGUAGES = getLanguageList();
const COUNTRIES = getCountryList();

interface OpenPosition {
  id: string;
  title: string;
  department: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const stageBadges: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  greeting: { label: 'Welcome', color: 'bg-blue-500', icon: <Sparkles className="w-3 h-3" /> },
  cv_collection: { label: 'CV Collection', color: 'bg-amber-500', icon: <FileText className="w-3 h-3" /> },
  qualification: { label: 'Qualification', color: 'bg-purple-500', icon: <CheckCircle className="w-3 h-3" /> },
  interview: { label: 'Interview', color: 'bg-[#EFE6D6]', icon: <UserCheck className="w-3 h-3" /> },
  assessment: { label: 'Assessment', color: 'jj-surface-emerald', icon: <CheckCircle className="w-3 h-3" /> },
  completed: { label: 'Completed', color: 'jj-surface-emerald', icon: <CheckCircle className="w-3 h-3" /> }
};

export default function HRAgentChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [stage, setStage] = useState<string>('greeting');
  const [mode, setMode] = useState<'applicant' | 'owner'>('applicant');
  const [initializing, setInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CV + position application state
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<string>('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [chatIntent, setChatIntent] = useState<'undecided' | 'question' | 'apply'>('undecided');
  const [applicationStep, setApplicationStep] = useState(0);
  const [applicationForm, setApplicationForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    nationality: '',
    preferredLanguage: '',
    country: '',
    city: '',
    consentAccurate: false,
    consentTerms: false,
  });

  useEffect(() => {
    if (user) {
      startConversation();
    }
  }, [user]);

  useEffect(() => {
    // Fetch open positions for the in-chat picker
    (async () => {
      const { data } = await supabase
        .from('open_positions')
        .select('id, title, department')
        .neq('status', 'hidden')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
      setOpenPositions((data as OpenPosition[]) || []);
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startConversation = async () => {
    try {
      setInitializing(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please log in to continue');
        return;
      }

      const response = await supabase.functions.invoke('hr-ai-agent', {
        body: { action: 'start_conversation' }
      });

      if (response.error) throw response.error;

      const data = response.data;
      setConversationId(data.conversationId);
      setStage(data.stage);
      if (data.mode === 'owner') setMode('owner');
      setMessages([{
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }]);

    } catch (error) {
      console.error('Failed to start conversation:', error);
      toast.error('Failed to connect to Jessica');
    } finally {
      setInitializing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversationId || loading) return;

    const outgoing = input.trim();

    const userMessage: Message = {
      role: 'user',
      content: outgoing,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    if (chatIntent !== 'apply' && /\b(apply|job|career|position|vacancy|cv)\b/i.test(outgoing)) {
      setChatIntent('undecided');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sure — tap **Apply for a Job** below and I’ll open the 5-step application inside this chat.',
        timestamp: new Date().toISOString()
      }]);
      return;
    }

    setLoading(true);

    try {
      const response = await supabase.functions.invoke('hr-ai-agent', {
        body: {
          action: 'send_message',
          conversationId,
          message: outgoing
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      setStage(data.stage);
      if (data.mode === 'owner') setMode('owner');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCvPicked = (f: File | null) => {
    if (!f) return;
    const ok = /\.(pdf|docx?|jpe?g|png|webp|heic|heif)$/i.test(f.name);
    if (!ok) {
      toast.error('Please upload PDF, Word, or image (JPG/PNG/HEIC).');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Max file size is 10 MB.');
      return;
    }
    setCvFile(f);
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: `📎 Attached CV: ${f.name}`,
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        content: selectedPositionId
          ? `Got it — I have your CV. Tap "Submit application" when you're ready and I'll file it for the selected role.`
          : `Thanks! I've received your CV. Please pick the position you're applying for from the selector below, then tap "Submit application".`,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const startApplicationInChat = () => {
    setChatIntent('apply');
    setApplicationStep(0);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: 'Apply for a Job', timestamp: new Date().toISOString() },
      { role: 'assistant', content: "Perfect — I'll collect your application here in 5 quick steps, then save your CV securely for HR review.", timestamp: new Date().toISOString() },
    ]);
  };

  const continueWithQuestions = () => {
    setChatIntent('question');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: 'I have a question', timestamp: new Date().toISOString() },
      { role: 'assistant', content: 'Of course — type your question below and I’ll help.', timestamp: new Date().toISOString() },
    ]);
  };

  const setApplicationValue = (key: keyof typeof applicationForm, value: string | boolean) => {
    setApplicationForm((prev) => ({ ...prev, [key]: value }));
  };

  const isStepComplete = (step: number) => {
    if (step === 0) return Boolean(selectedPositionId);
    if (step === 1) return Boolean(applicationForm.firstName.trim() && applicationForm.lastName.trim() && applicationForm.phone.trim());
    if (step === 2) return Boolean(applicationForm.nationality.trim() && applicationForm.country.trim() && applicationForm.city.trim() && applicationForm.preferredLanguage);
    if (step === 3) return Boolean(cvFile);
    return Boolean(applicationForm.consentAccurate && applicationForm.consentTerms);
  };

  const nextApplicationStep = () => {
    if (!isStepComplete(applicationStep)) {
      toast.error('Complete this step first.');
      return;
    }
    setApplicationStep((prev) => Math.min(prev + 1, 4));
  };

  const submitApplication = async () => {
    if (!user) {
      toast.error('Please sign in to submit your application.');
      return;
    }
    if (!applicationForm.consentAccurate || !applicationForm.consentTerms) {
      toast.error('Confirm the application consent first.');
      setApplicationStep(4);
      return;
    }
    if (!applicationForm.firstName.trim() || !applicationForm.lastName.trim() || !applicationForm.phone.trim()) {
      toast.error('Complete your personal details first.');
      setApplicationStep(1);
      return;
    }
    if (!applicationForm.nationality.trim() || !applicationForm.country.trim() || !applicationForm.city.trim()) {
      toast.error('Complete your location details first.');
      setApplicationStep(2);
      return;
    }
    if (!cvFile) {
      toast.error('Upload your CV first.');
      setApplicationStep(3);
      return;
    }
    if (!selectedPositionId) {
      toast.error('Select the position you are applying for.');
      return;
    }
    setSubmittingApp(true);
    try {
      // 1) Upload to hr-documents bucket (same path scheme as JoinApplication)
      const ext = cvFile.name.split('.').pop();
      const path = `${user.id}/cv-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('hr-documents')
        .upload(path, cvFile, { cacheControl: '3600', upsert: true });
      if (upErr) throw upErr;

      const pos = openPositions.find((p) => p.id === selectedPositionId);
      const positionLabel = pos?.title || selectedPositionId;

      // 2) Insert hr_applications row (same wiring as the application form)
      const { error: appErr } = await supabase.from('hr_applications').insert({
        user_id: user.id,
        full_name: `${applicationForm.firstName} ${applicationForm.lastName}`.trim(),
        email: user.email!,
        phone_e164: applicationForm.phone,
        nationality: applicationForm.nationality,
        preferred_language: applicationForm.preferredLanguage,
        current_location_country: applicationForm.country,
        current_location_city: applicationForm.city,
        cv_url: path,
        position_applied: positionLabel,
        consent_accurate: applicationForm.consentAccurate,
        consent_terms: applicationForm.consentTerms,
        status: 'pending',
        source: 'jessica_chat',
      } as any);
      if (appErr && !/duplicate|unique/i.test(appErr.message)) throw appErr;

      // 3) Confirmation email + admin task (best-effort)
      void supabase.functions.invoke('send-cv-status-email', {
        body: {
          email: user.email!,
          fullName: `${applicationForm.firstName} ${applicationForm.lastName}`.trim(),
          status: 'submitted',
          position: positionLabel,
          userId: user.id,
        },
      });

      // 4) Tell Jessica so she can guide next steps in conversation
      try {
        await supabase.functions.invoke('hr-ai-agent', {
          body: {
            action: 'send_message',
            conversationId,
            message: `[SYSTEM] Candidate just submitted their CV "${cvFile.name}" for position "${positionLabel}" through the chat. Please confirm receipt warmly and continue the interview.`,
          },
        });
      } catch {}

      setHasApplied(true);
      setCvFile(null);
      toast.success('Application submitted — thank you!');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `✅ Your application for **${positionLabel}** has been received and your CV is saved to our system. Our HR team will review it within 2–3 business days. In the meantime, I can continue with a few interview questions if you'd like.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to submit application.');
    } finally {
      setSubmittingApp(false);
    }
  };


  const currentStageBadge = stageBadges[stage] || stageBadges.greeting;

  if (initializing) {
    return (
      <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30">
        <CardContent className="flex items-center justify-center py-20">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1A1A1A] mx-auto" />
            <p className="text-[#1A1A1A]/70">Connecting to Jessica...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-gradient-to-br from-[#FDFBF7] to-[#F7F1E6] border-2 border-[#B89555]/30">
      <CardHeader className="border-b border-[#B89555]/20 bg-gradient-to-r from-gold/10 to-gold/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-[#1A1A1A]">Jessica</CardTitle>
            <p className="text-sm text-[#1A1A1A]/70">
              {mode === 'owner' ? 'Executive HR assistant' : 'Available 24/7 to support you'}
            </p>
          </div>
          {mode === 'owner' ? (
            <Badge className="bg-[#0A0A0A] text-white flex items-center gap-1 border border-[#B89555]/40">
              <Sparkles className="w-3 h-3" /> Owner mode
            </Badge>
          ) : (
            <Badge className={`${currentStageBadge.color} text-white flex items-center gap-1`}>
              {currentStageBadge.icon}
              {currentStageBadge.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[500px] p-4" ref={scrollRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`flex gap-3 group ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
 message.role === 'user' 
 ? 'bg-[#EFE6D6] text-[#1A1A1A]' 
 : 'bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/20'
 }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <UserCheck className="w-4 h-4 text-[#1A1A1A]" />}
                  </div>
                  <div className="flex flex-col max-w-[80%]">
                    <div className={`rounded-2xl px-4 py-3 select-text cursor-text ${
 message.role === 'user'
 ? 'bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/30 shadow-md rounded-tr-none'
 : 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/20 shadow-sm rounded-tl-none'
 }`}>
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-[#1A1A1A] select-text">
                        {message.content}
                      </div>
                      <p className="text-xs mt-1 text-[#1A1A1A]/60 select-none">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] border border-[#B89555]/20 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/20 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#EFE6D6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        {(mode === 'owner' || stage !== 'completed') && (
          <div className="border-t border-[#B89555]/20 p-4 space-y-3">
            {!hasApplied && chatIntent !== 'question' && (
              <div className="rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] p-3 space-y-3">
                {chatIntent === 'undecided' ? (
                  <>
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/70">
                      <MessageCircle className="w-3.5 h-3.5 text-[#0A0A0A]" /> What would you like to do?
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button type="button" onClick={startApplicationInChat} className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#F7F2EA] hover:text-[#1A1A1A] border border-[#B89555]/50">
                        <Briefcase className="w-4 h-4 mr-1.5 text-[#1A1A1A]" /> Apply for a Job
                      </Button>
                      <Button type="button" variant="outline" onClick={continueWithQuestions} className="border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6] hover:text-[#1A1A1A]">
                        <MessageCircle className="w-4 h-4 mr-1.5 text-[#1A1A1A]" /> Ask Jessica
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#1A1A1A]/70">
                        <Briefcase className="w-3.5 h-3.5 text-[#0A0A0A]" /> Apply for a position
                      </div>
                      <span className="text-xs font-semibold text-[#1A1A1A]">Step {applicationStep + 1} of 5</span>
                    </div>

                    <div className="grid grid-cols-5 gap-1" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((step) => (
                        <span key={step} className={`h-1.5 rounded-full ${step <= applicationStep ? 'bg-[#0A0A0A]' : 'bg-[#EFE6D6]'}`} />
                      ))}
                    </div>

                    {applicationStep === 0 && (
                      <div className="space-y-2">
                        <Label className="text-[#1A1A1A]">Position</Label>
                        <Select value={selectedPositionId} onValueChange={setSelectedPositionId}>
                          <SelectTrigger className="border-[#B89555]/40 bg-white text-[#1A1A1A]">
                            <SelectValue placeholder="Select position…" />
                          </SelectTrigger>
                          <SelectContent className="bg-white text-[#1A1A1A]">
                            {openPositions.length === 0 && <SelectItem value="__none" disabled>No open positions</SelectItem>}
                            {openPositions.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.title}{p.department ? ` — ${p.department}` : ''}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {applicationStep === 1 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input value={applicationForm.firstName} onChange={(e) => setApplicationValue('firstName', e.target.value)} placeholder="First name" className="border-[#B89555]/40 text-[#1A1A1A]" />
                        <Input value={applicationForm.lastName} onChange={(e) => setApplicationValue('lastName', e.target.value)} placeholder="Last name" className="border-[#B89555]/40 text-[#1A1A1A]" />
                        <div className="sm:col-span-2">
                          <PhoneInput
                            value={applicationForm.phone}
                            onChange={(v) => setApplicationValue('phone', v || '')}
                            placeholder="Phone number"
                            className="border-[#B89555]/40"
                          />
                        </div>
                      </div>
                    )}

                    {applicationStep === 2 && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <SearchableSelect
                          value={applicationForm.nationality}
                          onChange={(v) => setApplicationValue('nationality', v)}
                          options={NATIONALITIES}
                          placeholder="Select nationality"
                          searchPlaceholder="Search nationality..."
                          flagType="nationality"
                          triggerClassName="h-10 border-[#B89555]/40 bg-white text-[#1A1A1A]"
                        />
                        <SearchableSelect
                          value={applicationForm.preferredLanguage}
                          onChange={(v) => setApplicationValue('preferredLanguage', v)}
                          options={LANGUAGES}
                          placeholder="Select language"
                          searchPlaceholder="Search language..."
                          flagType="language"
                          triggerClassName="h-10 border-[#B89555]/40 bg-white text-[#1A1A1A]"
                        />
                        <SearchableSelect
                          value={applicationForm.country}
                          onChange={(v) => setApplicationValue('country', v)}
                          options={COUNTRIES}
                          placeholder="Select country"
                          searchPlaceholder="Search country..."
                          flagType="country"
                          triggerClassName="h-10 border-[#B89555]/40 bg-white text-[#1A1A1A]"
                        />
                        <Input value={applicationForm.city} onChange={(e) => setApplicationValue('city', e.target.value)} placeholder="City" className="border-[#B89555]/40 text-[#1A1A1A]" />
                      </div>
                    )}

                    {applicationStep === 3 && (
                      <div className="space-y-2">
                        {cvFile ? (
                          <div className="flex items-center gap-2 rounded-md border border-[color:var(--emerald-1)]/30/40 jj-emerald-soft px-3 py-2 text-sm text-[#1A1A1A]">
                            <FileText className="w-4 h-4 text-[color:var(--emerald-1)]" /><span className="truncate flex-1">{cvFile.name}</span>
                            <button type="button" onClick={() => setCvFile(null)} className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]" aria-label="Remove CV"><X className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6] hover:text-[#1A1A1A]">
                            <Paperclip className="w-4 h-4 mr-1.5 text-[#1A1A1A]" /> Upload CV
                          </Button>
                        )}
                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,image/*" className="hidden" onChange={(e) => handleCvPicked(e.target.files?.[0] || null)} />
                        <p className="text-[10px] text-[#1A1A1A]/60">PDF · Word · JPG / PNG / HEIC — max 10 MB. Your CV is stored securely with our HR team.</p>
                      </div>
                    )}

                    {applicationStep === 4 && (
                      <div className="space-y-3 text-sm text-[#1A1A1A]">
                        <label className="flex gap-2"><Checkbox checked={applicationForm.consentAccurate} onCheckedChange={(v) => setApplicationValue('consentAccurate', v === true)} /><span>I confirm the details I provided are accurate.</span></label>
                        <label className="flex gap-2"><Checkbox checked={applicationForm.consentTerms} onCheckedChange={(v) => setApplicationValue('consentTerms', v === true)} /><span>I consent to JBJ GLOBAL REAL ESTATE storing my CV for recruitment review.</span></label>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <Button type="button" variant="outline" onClick={() => setApplicationStep((prev) => Math.max(prev - 1, 0))} disabled={applicationStep === 0} className="border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6] hover:text-[#1A1A1A]">
                        <ArrowLeft className="w-4 h-4 mr-1.5 text-[#1A1A1A]" /> Back
                      </Button>
                      {applicationStep < 4 ? (
                        <Button type="button" onClick={nextApplicationStep} className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#F7F2EA] hover:text-[#1A1A1A] border border-[#B89555]/50">
                          Next <ArrowRight className="w-4 h-4 ml-1.5 text-[#1A1A1A]" />
                        </Button>
                      ) : (
                        <Button type="button" onClick={submitApplication} disabled={submittingApp || !isStepComplete(4)} className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#F7F2EA] hover:text-[#1A1A1A] disabled:text-[#1A1A1A] disabled:opacity-100 border border-[#B89555]/50">
                          {submittingApp ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin text-[#1A1A1A]" /> Submitting…</> : 'Submit application'}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 border-[#B89555]/30 focus:border-[#B89555]"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                size="icon"
                className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-[#1A1A1A]/70 text-center">
              Press Enter to send • Jessica interview support
            </p>
          </div>
        )}

        {stage === 'completed' && mode !== 'owner' && (
          <div className="border-t border-[#B89555]/20 p-4 jj-emerald-soft">
            <div className="flex items-center justify-center gap-2 text-[color:var(--emerald-1)]">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Interview Complete - Assessment Generated</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
