import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Target,
  Users,
  BarChart3,
  Phone,
  Mail,
  MessageSquare,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  Zap,
  Lock
} from "lucide-react";

const CRM_FEATURES = [
  {
    title: "Lead Management",
    description: "Track, organize, and prioritize all your leads in one place",
    icon: Users,
  },
  {
    title: "Pipeline Tracking",
    description: "Visual pipeline to track deals from contact to closing",
    icon: TrendingUp,
  },
  {
    title: "Activity Logging",
    description: "Log calls, emails, meetings, and follow-ups automatically",
    icon: BarChart3,
  },
  {
    title: "One-Click Contact",
    description: "Call, email, or WhatsApp leads with a single click",
    icon: Phone,
  },
  {
    title: "Email Campaigns",
    description: "Send personalized email campaigns to your leads",
    icon: Mail,
  },
  {
    title: "AI Insights",
    description: "Get AI-powered recommendations for lead prioritization",
    icon: Zap,
  },
];

export function BrokerToolkitCRM() {
  const navigate = useNavigate();
  
  const handleCRMAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      toast.error("Please sign in to access the CRM dashboard");
      navigate("/auth");
      return;
    }
    
    // Check if user has broker_member role
    const { data: hrRole } = await supabase
      .from("hr_user_roles")
      .select("role, is_active")
      .eq("user_id", session.user.id)
      .eq("role", "broker_member")
      .eq("is_active", true)
      .maybeSingle();
    
    // Check for admin/owner roles
    const [adminResult, ownerResult] = await Promise.all([
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "owner" }),
    ]);
    
    const isExecutive = Boolean(adminResult.data) || Boolean(ownerResult.data);
    const isRegisteredBroker = hrRole?.role === "broker_member" && hrRole?.is_active;
    
    if (isExecutive || isRegisteredBroker) {
      navigate("/crm");
    } else {
      toast.info("You are not a registered broker. Please apply to join our team.");
      navigate("/join");
    }
  };
  
  return (
    <>
      {/* CRM Section - with gold/amber premium layer */}
      <section id="section-crm" className="py-8 md:py-10 bg-black">
        <div className="container mx-auto px-4">
          {/* Active Gold/Amber Premium Layer */}
          <div className="bg-gradient-to-br from-amber-900/90 via-amber-900/80 to-amber-950/90 border border-gold/30 rounded-2xl p-6 md:p-8 shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="bg-gold/30 text-gold border-gold/50 mb-4">
                <Target className="w-3 h-3 mr-1" />
                CRM & Lead Management
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Manage Leads <span className="text-gold">Like a Pro</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Our built-in CRM helps you track every lead, automate follow-ups, and close more deals.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {CRM_FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-amber-900/60 border border-gold/30 hover:border-gold hover:bg-amber-900/80 transition-all h-full shadow-lg shadow-gold/10">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                          <p className="text-amber-200/70 text-sm">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* CRM Preview Card - Premium gold-themed inner card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <Card className="bg-gradient-to-br from-gold/80 via-gold/70 to-amber-600/80 border-2 border-gold/50 shadow-xl shadow-gold/30">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(200,167,102,0.5)] border-2 border-gold/60">
                    <Lock className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(200,167,102,0.8)]" />
                  </div>
                  <h3 className="text-2xl font-bold text-black mb-4">
                    Ready to Organize Your Leads?
                  </h3>
                  <p className="text-black/80 mb-2 max-w-xl mx-auto">
                    Access the full JBJ CRM with lead scoring, pipeline management, and insights.
                  </p>
                  <p className="text-black/60 text-sm mb-6">
                    <Lock className="w-3 h-3 inline mr-1" />
                    Available exclusively to registered JBJ brokers
                  </p>
                  {/* Button matching Ready to Get Started section style */}
                  <div className="flex flex-wrap justify-center gap-4">
                    <button 
                      onClick={handleCRMAccess}
                      className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
                        border: '2px solid rgba(200,167,102,0.5)',
                        boxShadow: `
                          0 10px 30px rgba(0,0,0,0.4),
                          0 6px 15px rgba(0,0,0,0.2),
                          inset 0 2px 4px rgba(255,255,255,0.1),
                          inset 0 -2px 4px rgba(0,0,0,0.2),
                          0 0 20px rgba(200,167,102,0.3)
                        `,
                      }}
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                      <span className="relative flex items-center justify-center gap-2">
                        <Target className="w-5 h-5 text-gold" />
                        <span className="text-gold">Open</span>
                        <span className="text-white">CRM Dashboard</span>
                        <ArrowUpRight className="w-5 h-5 text-gold" />
                      </span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
