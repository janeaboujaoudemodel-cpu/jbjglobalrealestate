import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Footer from "@/components/Footer";
import BrokerPDFGenerator from "@/components/broker/BrokerPDFGenerator";
import BrokerCourses from "@/components/broker/BrokerCourses";
import BrokerAITools from "@/components/broker/BrokerAITools";
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

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth?redirect=/broker-toolkit/dashboard");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

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
      <div className="min-h-screen bg-[hsl(var(--premium-bg))] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-[hsl(var(--premium-bg))] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">No Active Subscription</h1>
          <p className="text-zinc-400 mb-6">
            You don't have an active Broker Toolkit subscription. Start your free trial today!
          </p>
          <Button
            onClick={() => navigate("/broker-toolkit")}
            className="bg-gradient-to-r from-gold to-gold-dark text-black hover:brightness-110"
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
    <div className="min-h-screen bg-[hsl(var(--premium-bg))]">
      {/* Header */}
      <section className="py-8 border-b border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Broker Dashboard</h1>
                <Badge className={`${
                  subscription.tier === "enterprise" 
                    ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                    : subscription.tier === "professional"
                    ? "bg-gold/20 text-gold border-gold/30"
                    : "bg-zinc-600/20 text-zinc-300 border-zinc-600/30"
                }`}>
                  {tierLabels[subscription.tier] || subscription.tier}
                </Badge>
              </div>
              {isTrialActive && (
                <p className="text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Trial: {trialDaysLeft} days remaining
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isTrialActive && (
                <Button
                  variant="outline"
                  className="border-gold text-gold hover:bg-gold/10"
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
              <Button
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trial Banner */}
      {isTrialActive && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <p className="text-amber-200">
                  Your trial ends in <strong>{trialDaysLeft} days</strong>. Contact us to activate your subscription.
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="https://wa.me/971565911000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-amber-400 hover:text-amber-300"
                >
                  <Phone className="w-4 h-4" />
                  +971 56 591 1000
                </a>
                <a
                  href="mailto:contact@jbj.ae"
                  className="flex items-center gap-2 text-amber-400 hover:text-amber-300"
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
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="pdf-generator" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <FileText className="w-4 h-4 mr-2" />
              PDF Generator
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-gold data-[state=active]:text-black">
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
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">AI Credits</p>
                    <p className="text-white font-semibold">
                      {subscription.ai_credits_limit === null
                        ? "Unlimited"
                        : `${subscription.ai_credits_used} / ${subscription.ai_credits_limit}`}
                    </p>
                  </div>
                </div>
                {subscription.ai_credits_limit !== null && (
                  <Progress value={aiCreditsPercent} className="h-2" />
                )}
              </motion.div>

              {/* PDF Downloads Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">PDFs Generated</p>
                    <p className="text-white font-semibold">{subscription.pdf_downloads}</p>
                  </div>
                </div>
              </motion.div>

              {/* Subscription Status Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">Status</p>
                    <p className="text-white font-semibold capitalize">{subscription.status}</p>
                  </div>
                </div>
              </motion.div>

              {/* Expiry Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-zinc-400 text-sm">
                      {isTrialActive ? "Trial Ends" : "Expires"}
                    </p>
                    <p className="text-white font-semibold">
                      {isTrialActive ? trialDaysLeft : daysUntilExpiry} days
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setActiveTab("pdf-generator")}
                className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/30 rounded-xl p-6 text-left hover:border-blue-500/50 transition-colors"
              >
                <FileText className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Generate Property PDF</h3>
                <p className="text-zinc-400 text-sm">Create branded property presentations</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => setActiveTab("ai-tools")}
                className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-6 text-left hover:border-purple-500/50 transition-colors"
              >
                <Sparkles className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI Comparison Tool</h3>
                <p className="text-zinc-400 text-sm">Compare properties with AI insights</p>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setActiveTab("courses")}
                className="bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/30 rounded-xl p-6 text-left hover:border-gold/50 transition-colors"
              >
                <GraduationCap className="w-10 h-10 text-gold mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Training Courses</h3>
                <p className="text-zinc-400 text-sm">Master real estate sales techniques</p>
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

      <Footer />
    </div>
  );
}
