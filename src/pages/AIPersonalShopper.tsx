import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
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
import { ToolAnimatedFrame } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";
import { useProjectsListing } from "@/hooks/useProjects";
import { getHighResImageUrl } from "@/lib/imageUtils";

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
  const { data: featuredProjects } = useProjectsListing();
  const shopperListings = useMemo(() => (featuredProjects || []).slice(0, 3), [featuredProjects]);
  const heroPhoto = getHighResImageUrl(
    (shopperListings[0] as any)?.images?.[0]?.image_url ||
    (shopperListings[0] as any)?.cover_image_url ||
    "https://d3h330vgpwpjr8.cloudfront.net/x/1128x/Mercedes_Benz_Places_2_16c6f5cada.webp"
  );

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
        content: `I apologize for the technical difficulty. Let me help you plan your UAE trip!\n\nBased on your request, here's what I can assist with:\n\n**Services Available:**\n- Property viewing schedules\n- Hotel recommendations & bookings\n- Private transfers & chauffeur services\n- Restaurant reservations\n- Activity & experience planning\n- Complete daily itineraries\n\nPlease share more details about your trip:\n- **Duration**: How many days?\n- **Purpose**: Relocation, property purchase, or leisure?\n- **Budget**: Your comfortable range\n- **Interests**: Specific areas or activities?\n\nOur team at JBJ Global Real Estate will ensure your UAE experience is exceptional. Call +971 54 716 7107`
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
      const fullPlan = messages.map(m => `${m.role === 'user' ? 'Client' : 'Concierge'}: ${m.content}`).join('\n\n');
      
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
    <ToolAnimatedFrame theme={toolThemes.emerald}>
    <section className="min-h-screen bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806]">
      {/* Hero */}
      <div className="relative min-h-[560px] overflow-hidden border-b border-white/18">
        <img
          src={heroPhoto}
          alt="Curated UAE property listing"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-[#042C1C]/78 to-black/38" />
        <div className="container relative z-10 mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="allow-white jj-pill-emerald-metallic inline-flex items-center gap-2 rounded-full px-4 py-2 mb-5">
              <Plane className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-medium">AI Travel & Property Concierge</span>
            </div>
            <h1 className="allow-white text-4xl md:text-6xl font-bold text-white mb-5 leading-tight">
              Your Personal UAE Property Concierge
            </h1>
            <p className="allow-white text-white max-w-2xl text-base md:text-lg leading-relaxed">
              Tell me about your trip to UAE and I'll create a complete personalized itinerary — 
              property viewings, hotels, activities, dining, and everything in between.
            </p>
            <p className="allow-white text-xs text-white mt-3 uppercase tracking-[0.18em] font-semibold">Powered by JBJ Global Real Estate</p>
          </motion.div>

          {shopperListings.length > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
              {shopperListings.map((project: any) => {
                const image = getHighResImageUrl(project.images?.[0]?.image_url || project.cover_image_url || heroPhoto);
                return (
                  <Link
                    key={project.id}
                    to={`/project/${project.slug}`}
                    className="group overflow-hidden rounded-2xl border border-white/18 bg-black/40 backdrop-blur-md shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                  >
                    <img src={image} alt={project.name} className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                    <div className="bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] p-4">
                      <p className="allow-white text-white text-sm font-bold truncate">{project.name}</p>
                      <p className="allow-white text-white text-xs mt-1 truncate">{project.area_name || project.location || "UAE"}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-3 p-3 bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/18 rounded-xl">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-white" />
            <span className="text-white font-medium text-sm">
              {currentPlan ? currentPlan.name : "New Trip Plan"}
            </span>
            {currentPlan?.status === 'submitted' && (
              <Badge className="jj-surface-emerald text-xs">Submitted</Badge>
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
                <DialogContent data-filter-clean="true" className="bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/24">
                  <DialogHeader>
                    <DialogTitle className="text-white">Save Trip Plan</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Plan Name</Label>
                      <Input
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                        placeholder="My Dubai Investment Trip"
                        className="allow-white bg-[#021611]/82 border-white/28 text-white placeholder:text-white"
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
                <DialogContent data-filter-clean="true" className="bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/24">
                  <DialogHeader>
                    <DialogTitle className="text-white">Submit Your Trip Plan</DialogTitle>
                  </DialogHeader>
                  <p className="text-white text-sm">
                    Our concierge team will review your plan and contact you to finalize all arrangements.
                  </p>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-white">Full Name</Label>
                      <Input
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Smith"
                        className="allow-white bg-[#021611]/82 border-white/28 text-white placeholder:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Email *</Label>
                      <Input
                        type="email"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="allow-white bg-[#021611]/82 border-white/28 text-white placeholder:text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Phone (WhatsApp preferred)</Label>
                      <Input
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 234 567 8900"
                        className="allow-white bg-[#021611]/82 border-white/28 text-white placeholder:text-white"
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
              <SelectTrigger className="allow-white w-36 bg-[#021611]/82 border-white/28 text-sm text-white">
                <SelectValue placeholder="Load Plan" />
              </SelectTrigger>
              <SelectContent className="allow-white bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border-white/24">
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
            <Card className="bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/18">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
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
                    className="allow-white w-full p-3 text-left bg-black/24 hover:bg-white/10 border border-white/18 hover:border-white/32 rounded-lg transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <prompt.icon className="w-4 h-4 text-white" />
                      <span className="text-white text-sm font-medium">{prompt.title}</span>
                    </div>
                    <p className="text-white text-xs line-clamp-2 group-hover:text-white">
                      {prompt.prompt.substring(0, 80)}...
                    </p>
                  </motion.button>
                ))}
              </CardContent>
            </Card>

            {/* What I Can Do */}
            <Card className="bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/18">
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
                  <div key={i} className="allow-white flex items-center gap-2 text-white text-sm">
                    <item.icon className="w-4 h-4 text-white" />
                    {item.text}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/18 h-[600px] flex flex-col">
              <CardHeader className="border-b border-white/18 pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-white" />
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
                      <div className="jj-pill-emerald-metallic w-20 h-20 mx-auto rounded-2xl flex items-center justify-center">
                        <Plane className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-white">Welcome to Your Personal Concierge</h3>
                      <p className="text-white max-w-md">
                        Tell me about your upcoming trip to the UAE. Whether you're an investor, 
                        relocating family, or luxury traveler — I'll create a complete personalized itinerary for you.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        <Badge variant="outline" className="allow-white jj-pill-emerald-metallic border-0 text-white">
                          <Clock className="w-3 h-3 mr-1" /> Full Schedules
                        </Badge>
                        <Badge variant="outline" className="allow-white jj-pill-emerald-metallic border-0 text-white">
                          <Hotel className="w-3 h-3 mr-1" /> Hotels
                        </Badge>
                        <Badge variant="outline" className="allow-white jj-pill-emerald-metallic border-0 text-white">
                          <Building2 className="w-3 h-3 mr-1" /> Properties
                        </Badge>
                        <Badge variant="outline" className="allow-white jj-pill-emerald-metallic border-0 text-white">
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
 ? 'jj-pill-emerald-metallic text-white'
 : 'bg-black/34 text-white border border-white/18'
 }`}
                          >
                            {message.role === 'assistant' && (
                              <div className="flex items-center gap-2 mb-2 text-white text-xs font-medium">
                                <Sparkles className="w-3 h-3" />
                                Concierge
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
                        <div className="bg-black/34 border border-white/18 p-4 rounded-2xl">
                          <div className="flex items-center gap-2 text-white">
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
              <div className="p-4 border-t border-white/18">
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
                    className="allow-white flex-1 bg-[#021611]/82 border-white/28 text-white placeholder:text-white resize-none min-h-[60px]"
                    rows={2}
                  />
                  <Button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={!inputMessage.trim() || isLoading}
                    className="jj-surface-emerald hover:jj-surface-emerald self-end"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-white mt-2 text-center">
                  Press Enter to send • Your plan can be saved and submitted to our concierge team
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
    </ToolAnimatedFrame>
  );
};

export default AIPersonalShopper;
