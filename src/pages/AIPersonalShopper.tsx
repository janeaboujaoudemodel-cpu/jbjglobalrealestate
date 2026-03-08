import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plane, MapPin, Calendar, Building2, Send, Loader2, Sparkles,
  Save, FolderOpen, Plus, Hotel, Car, Utensils, Clock, Star,
  Compass, Users, Briefcase, Download, Mail, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TripPlan {
  id: string;
  name: string;
  request: string;
  plan: string;
  createdAt: Date;
  status: 'draft' | 'submitted';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickPrompts = [
  {
    icon: Building2,
    title: "Property Investor Tour",
    prompt: "I'm coming to Dubai for 5 days as a property investor. Budget $2M. I want to see luxury apartments in Dubai Marina and Downtown. Schedule viewings, recommend hotels, and plan some leisure activities."
  },
  {
    icon: Briefcase,
    title: "Business & Property",
    prompt: "I'm visiting UAE for 7 days combining business meetings with property exploration. I need a schedule that includes morning meetings in DIFC, afternoon property viewings, and evening entertainment."
  },
  {
    icon: Users,
    title: "Family Relocation",
    prompt: "We're a family of 4 relocating to Dubai. We need to see family-friendly communities, international schools, and healthcare facilities. We have 10 days and want to explore different areas."
  },
  {
    icon: Star,
    title: "Luxury Experience",
    prompt: "I want the ultimate luxury Dubai experience for 4 days - 5-star hotels, penthouse viewings on Palm Jumeirah, yacht trips, fine dining, and exclusive property tours."
  },
  {
    icon: Compass,
    title: "First-Time Explorer",
    prompt: "I'm visiting Dubai for the first time for 6 days. I want to explore investment opportunities while experiencing the city. Suggest a balanced itinerary with sightseeing and property viewings."
  }
];

const AIPersonalShopper = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedPlans, setSavedPlans] = useState<TripPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<TripPlan | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [planName, setPlanName] = useState('');
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved plans
  useEffect(() => {
    const saved = localStorage.getItem('ai_concierge_plans');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedPlans(parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      })));
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const savePlans = (updated: TripPlan[]) => {
    localStorage.setItem('ai_concierge_plans', JSON.stringify(updated));
    setSavedPlans(updated);
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('ai-travel-concierge', {
        body: { 
          messages: [...messages, userMessage],
          context: currentPlan ? `Current plan: ${currentPlan.name}` : 'New trip planning session'
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: response.data.response 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      toast.error('Failed to get AI response. Please try again.');
      
      // Fallback response
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `I apologize for the technical difficulty. Let me help you plan your UAE trip!\n\nBased on your request, here's what I can assist with:\n\n**Services Available:**\n- Property viewing schedules\n- Hotel recommendations & bookings\n- Private transfers & chauffeur services\n- Restaurant reservations\n- Activity & experience planning\n- Complete daily itineraries\n\nPlease share more details about your trip:\n- **Duration**: How many days?\n- **Purpose**: Relocation, property purchase, or leisure?\n- **Budget**: Your comfortable range\n- **Interests**: Specific areas or activities?\n\nOur team at JBJ Global Real Estate will ensure your UAE experience is exceptional. Call +971 56 591 1000`
      };
      setMessages(prev => [...prev, fallbackMessage]);
    }

    setIsLoading(false);
  };

  const savePlan = () => {
    if (!planName.trim()) {
      toast.error("Please enter a plan name");
      return;
    }

    const fullPlan = messages.map(m => `${m.role === 'user' ? 'You' : 'Concierge'}: ${m.content}`).join('\n\n');
    
    const newPlan: TripPlan = {
      id: Date.now().toString(),
      name: planName,
      request: messages.find(m => m.role === 'user')?.content || '',
      plan: fullPlan,
      createdAt: new Date(),
      status: 'draft'
    };

    const updated = [...savedPlans, newPlan];
    savePlans(updated);
    setCurrentPlan(newPlan);
    setPlanName('');
    setShowSaveModal(false);
    toast.success(`Plan "${planName}" saved!`);
  };

  const loadPlan = (plan: TripPlan) => {
    setCurrentPlan(plan);
    // Parse the saved conversation
    const lines = plan.plan.split('\n\n');
    const loadedMessages: Message[] = lines
      .filter(line => line.startsWith('You:') || line.startsWith('Concierge:'))
      .map(line => ({
        role: line.startsWith('You:') ? 'user' : 'assistant',
        content: line.replace(/^(You|Concierge): /, '')
      }));
    setMessages(loadedMessages);
    toast.success(`Plan "${plan.name}" loaded!`);
  };

  const submitInquiry = async () => {
    if (!inquiryForm.email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      const fullPlan = messages.map(m => `${m.role === 'user' ? 'Client' : 'AI Concierge'}: ${m.content}`).join('\n\n');
      
      // Best-effort notification (must NOT block user success)
      try {
        await supabase.functions.invoke('send-inquiry-email', {
          body: {
            fullName: inquiryForm.name || 'Guest',
            email: inquiryForm.email,
            phone: inquiryForm.phone?.replace(/[\s\-\(\)]/g, '') || '+971000000000',
            nationality: 'Not specified',
            language: 'English',
            message: fullPlan,
            source: 'AI Travel Concierge',
          }
        });
      } catch (notifyErr) {
        console.warn('Travel concierge notification failed:', notifyErr);
      }

      // Update plan status
      if (currentPlan) {
        const updated = savedPlans.map(p => 
          p.id === currentPlan.id ? { ...p, status: 'submitted' as const } : p
        );
        savePlans(updated);
      }

      setShowInquiryModal(false);
      setInquiryForm({ name: '', email: '', phone: '' });
      toast.success("Your trip plan has been sent to our team! We'll contact you shortly.");
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Failed to submit. Please try again.");
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentPlan(null);
    toast.success("Started new trip planning session");
  };

  const useQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/30 via-teal-800/20 to-emerald-900/30 border-b border-emerald-500/20">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1 mb-4">
              <Plane className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">AI Travel & Property Concierge</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Your Personal <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">UAE Concierge</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto text-sm md:text-base">
              Tell me about your trip to UAE and I'll create a complete personalized itinerary — 
              property viewings, hotels, activities, dining, and everything in between.
            </p>
            <p className="text-xs text-gold mt-2">Powered by JBJ Global Real Estate</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium text-sm">
              {currentPlan ? currentPlan.name : "New Trip Plan"}
            </span>
            {currentPlan?.status === 'submitted' && (
              <Badge className="bg-emerald-600 text-xs">Submitted</Badge>
            )}
          </div>
          <div className="flex-1" />
          
          <Button size="sm" variant="outline" onClick={startNewConversation} className="text-xs">
            <Plus className="w-3 h-3 mr-1" /> New Plan
          </Button>
          
          {messages.length > 0 && (
            <>
              <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Save className="w-3 h-3 mr-1" /> Save Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Save Trip Plan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-zinc-400">Plan Name</Label>
                      <Input
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="My Dubai Investment Trip"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <Button onClick={savePlan} variant="primary" className="w-full">
                      Save Plan
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showInquiryModal} onOpenChange={setShowInquiryModal}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="primary" className="text-xs">
                    <Mail className="w-3 h-3 mr-1" /> Submit to Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Submit Your Trip Plan</DialogTitle>
                  </DialogHeader>
                  <p className="text-zinc-400 text-sm">
                    Our concierge team will review your plan and contact you to finalize all arrangements.
                  </p>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-zinc-400">Full Name</Label>
                      <Input
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Smith"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Email *</Label>
                      <Input
                        type="email"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">Phone (WhatsApp preferred)</Label>
                      <Input
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>
                    <Button onClick={submitInquiry} variant="primary" className="w-full">
                      Submit to Concierge Team
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          {savedPlans.length > 0 && (
            <Select onValueChange={(id) => {
              const plan = savedPlans.find(p => p.id === id);
              if (plan) loadPlan(plan);
            }}>
              <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-sm text-white">
                <SelectValue placeholder="Load Plan" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {savedPlans.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-white">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Quick Prompts Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => useQuickPrompt(prompt.prompt)}
                    className="w-full p-3 text-left bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 hover:border-emerald-500/50 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <prompt.icon className="w-4 h-4 text-emerald-400" />
                      <span className="text-white text-sm font-medium">{prompt.title}</span>
                    </div>
                    <p className="text-zinc-500 text-xs line-clamp-2 group-hover:text-zinc-400">
                      {prompt.prompt.substring(0, 80)}...
                    </p>
                  </motion.button>
                ))}
              </CardContent>
            </Card>

            {/* What I Can Do */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">What I Can Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { icon: Building2, text: "Property Viewings" },
                  { icon: Hotel, text: "Hotel Bookings" },
                  { icon: Car, text: "Private Transfers" },
                  { icon: Utensils, text: "Restaurant Reservations" },
                  { icon: Calendar, text: "Daily Itineraries" },
                  { icon: Compass, text: "Activities & Experiences" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-zinc-400 text-sm">
                    <item.icon className="w-4 h-4 text-emerald-400" />
                    {item.text}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="bg-zinc-900/50 border-zinc-800 h-[600px] flex flex-col">
              <CardHeader className="border-b border-zinc-800 pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  Plan Your UAE Journey
                </CardTitle>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center">
                        <Plane className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Welcome to Your Personal Concierge</h3>
                      <p className="text-zinc-400 max-w-md">
                        Tell me about your upcoming trip to the UAE. Whether you're an investor, 
                        relocating family, or luxury traveler — I'll create a complete personalized itinerary for you.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                          <Clock className="w-3 h-3 mr-1" /> Full Schedules
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                          <Hotel className="w-3 h-3 mr-1" /> Hotels
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                          <Building2 className="w-3 h-3 mr-1" /> Properties
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
                          <Star className="w-3 h-3 mr-1" /> Experiences
                        </Badge>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {messages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] p-4 rounded-2xl ${
                              message.role === 'user'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                            }`}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-medium">
                                <Sparkles className="w-3 h-3" />
                                AI Concierge
                              </div>
                            )}
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl">
                          <div className="flex items-center gap-2 text-emerald-400">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Creating your personalized plan...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t border-zinc-800">
                <div className="flex gap-2">
                  <Textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(inputMessage);
                      }
                    }}
                    placeholder="Describe your ideal UAE trip... (e.g., I'm visiting Dubai for 7 days as a property investor looking at luxury penthouses...)"
                    className="flex-1 bg-zinc-800 border-zinc-700 text-white resize-none min-h-[60px]"
                    rows={2}
                  />
                  <Button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 self-end"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  Press Enter to send • Your plan can be saved and submitted to our concierge team
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIPersonalShopper;
