import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import BrokerPDFGenerator from "@/components/broker/BrokerPDFGenerator";
import BrokerCourses from "@/components/broker/BrokerCourses";
import BrokerAITools from "@/components/broker/BrokerAITools";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";
import {
  Crown,
  FileText,
  GraduationCap,
  Sparkles,
  Settings,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
  Phone,
  Mail,
  Search,
  Bell,
  Home,
} from "lucide-react";

interface Subscription {
  id: string;
  tier: string;
  status: string;
  trial_ends_at: string | null;
  expires_at: string | null;
  ai_credits_used: number;
  ai_credits_limit: number | null;
  pdf_downloads: number;
}

export default function BrokerDashboard() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/broker-dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchSubscription = async () => {
    try {
      // Use safe view that masks payment data for security
      const { data, error } = await supabase
        .from("broker_subscriptions_safe")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setSubscription(data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  if (loading || loadingSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-black mb-4">No Active Subscription</h1>
          <p className="text-zinc-500 mb-6">
            You don't have an active Broker Toolkit subscription. Start your free trial today!
          </p>
          <Button
            onClick={() => navigate("/broker-toolkit")}
            variant="primary"
          >
            <Crown className="w-5 h-5 mr-2" />
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  const tierLabels: Record<string, string> = {
    starter: "Starter",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  const daysUntilExpiry = subscription.expires_at
    ? Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const isTrialActive = subscription.status === "trial" && subscription.trial_ends_at
    ? new Date(subscription.trial_ends_at) > new Date()
    : false;

  const trialDaysLeft = subscription.trial_ends_at
    ? Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  const aiCreditsPercent = subscription.ai_credits_limit
    ? (subscription.ai_credits_used / subscription.ai_credits_limit) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      {/* Premium Header */}
      <section className="py-6 border-b-2 border-gold/30 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-lg shadow-gold/20">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-black">Broker Dashboard</h1>
                  <Badge className={`${
                    subscription.tier === "enterprise" 
                      ? "bg-purple-500/10 text-purple-600 border-purple-500/30"
                      : subscription.tier === "professional"
                      ? "bg-gold/10 text-gold border-gold/30"
                      : "bg-zinc-100 text-zinc-600 border-zinc-300"
                  }`}>
                    {tierLabels[subscription.tier] || subscription.tier}
                  </Badge>
                </div>
                {isTrialActive && (
                  <p className="text-amber-600 flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    Trial: {trialDaysLeft} days remaining
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <button
                onClick={() => setShowCommandPalette(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gold/30 text-zinc-500 hover:border-gold/50 transition-all"
              >
                <Search className="h-4 w-4 text-gold" />
                <span className="text-sm">Search...</span>
                <kbd className="ml-2 px-2 py-0.5 bg-gold/10 text-gold text-xs rounded font-mono">⌘K</kbd>
              </button>
              
              {isTrialActive && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    window.open(
                      "https://wa.me/971565911000?text=Hi%2C%20I%20want%20to%20activate%20my%20Broker%20Toolkit%20subscription",
                      "_blank"
                    );
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Activate Now
                </Button>
              )}
              <Button variant="secondary">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="secondary" onClick={() => navigate("/")}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trial Banner */}
      {isTrialActive && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/50 to-transparent border-b-2 border-amber-500/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-amber-700">
                  Your trial ends in <strong>{trialDaysLeft} days</strong>. Contact us to activate your subscription.
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="https://wa.me/971565911000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
                >
                  <Phone className="w-4 h-4" />
                  +971 56 591 1000
                </a>
                <a
                  href="mailto:Contact@JBJ.ae"
                  className="flex items-center gap-2 text-amber-600 hover:text-amber-700"
                >
                  <Mail className="w-4 h-4" />
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/80 border-2 border-gold/30 p-1 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pdf-generator" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
              <FileText className="w-4 h-4 mr-2" />
              PDF Generator
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
              <GraduationCap className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* AI Credits Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white border-2 border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.1)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-zinc-500 text-sm">AI Credits</p>
                        <p className="text-black font-semibold">
                          {subscription.ai_credits_limit === null
                            ? "Unlimited"
                            : `${subscription.ai_credits_used} / ${subscription.ai_credits_limit}`}
                        </p>
                      </div>
                    </div>
                    {subscription.ai_credits_limit !== null && (
                      <Progress value={aiCreditsPercent} className="h-2" />
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* PDF Downloads Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="bg-white border-2 border-green-500/30 shadow-[0_4px_20px_rgba(34,197,94,0.1)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-zinc-500 text-sm">PDFs Generated</p>
                        <p className="text-black font-semibold">{subscription.pdf_downloads}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Subscription Status Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                        <Crown className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-zinc-500 text-sm">Status</p>
                        <p className="text-black font-semibold capitalize">{subscription.status}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Expiry Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-white border-2 border-purple-500/30 shadow-[0_4px_20px_rgba(168,85,247,0.1)]">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-zinc-500 text-sm">
                          {isTrialActive ? "Trial Ends" : "Expires"}
                        </p>
                        <p className="text-black font-semibold">
                          {isTrialActive ? trialDaysLeft : daysUntilExpiry} days
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setActiveTab("pdf-generator")}
                className="bg-white border-2 border-blue-500/30 rounded-xl p-6 text-left hover:border-blue-500/50 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Generate Property PDF</h3>
                <p className="text-zinc-500 text-sm">Create branded property presentations</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setActiveTab("ai-tools")}
                className="bg-white border-2 border-purple-500/30 rounded-xl p-6 text-left hover:border-purple-500/50 hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">AI Comparison Tool</h3>
                <p className="text-zinc-500 text-sm">Compare properties with AI insights</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setActiveTab("courses")}
                className="bg-white border-2 border-gold/30 rounded-xl p-6 text-left hover:border-gold/50 hover:shadow-[0_8px_30px_rgba(200,167,102,0.15)] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Training Courses</h3>
                <p className="text-zinc-500 text-sm">Master real estate sales techniques</p>
              </motion.button>
            </div>
          </TabsContent>

          {/* PDF Generator Tab */}
          <TabsContent value="pdf-generator">
            <BrokerPDFGenerator subscription={subscription} />
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools">
            <BrokerAITools subscription={subscription} />
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <BrokerCourses subscription={subscription} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar />

      <Footer />
    </div>
  );
}
