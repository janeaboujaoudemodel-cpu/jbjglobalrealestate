import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IconTile } from "@/components/ui/icon-tile";
import {
  Target, Users, BarChart3, Phone, Mail, Zap, TrendingUp, ArrowUpRight,
} from "lucide-react";

const CRM_FEATURES = [
  { title: "Lead Management", description: "Track, organize and prioritize every lead in one place.", icon: Users },
  { title: "Pipeline Tracking", description: "Visual pipeline from first contact to closing.", icon: TrendingUp },
  { title: "Activity Logging", description: "Calls, emails, meetings and follow-ups, auto-logged.", icon: BarChart3 },
  { title: "One-Click Contact", description: "Call, email or WhatsApp leads with a single click.", icon: Phone },
  { title: "Email Campaigns", description: "Send personalised campaigns to your lead lists.", icon: Mail },
  { title: "AI Insights", description: "AI-powered lead prioritization and next-step suggestions.", icon: Zap },
];

export function BrokerToolkitCRM() {
  const navigate = useNavigate();

  const handleCRMAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.error("Please sign in to access the CRM dashboard");
      navigate("/auth?redirect=/crm");
      return;
    }
    const { data: hrRole } = await supabase
      .from("hr_user_roles")
      .select("role, is_active")
      .eq("user_id", session.user.id)
      .eq("role", "broker_member")
      .eq("is_active", true)
      .maybeSingle();
    const [adminResult, ownerResult] = await Promise.all([
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: session.user.id, _role: "owner" }),
    ]);
    const isExecutive = Boolean(adminResult.data) || Boolean(ownerResult.data);
    const isRegisteredBroker = hrRole?.role === "broker_member" && hrRole?.is_active;
    if (isExecutive || isRegisteredBroker) navigate("/crm");
    else { toast.info("Apply to join our team to access the CRM."); navigate("/join"); }
  };

  return (
    <section id="section-crm" className="jj-band jj-band--page py-14 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 mb-3">
            <Target className="w-3 h-3 mr-1.5" />
            CRM & Leads
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1A1A1A] mb-3">
            Manage leads like a pro
          </h2>
          <p className="text-[#1A1A1A]/70 text-base">
            Our built-in CRM helps you track every lead, automate follow-ups, and close more deals.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto mb-10">
          {CRM_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              viewport={{ once: true }}
              className="bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/55 rounded-2xl p-5 h-full flex flex-col transition-colors"
            >
              <IconTile icon={feature.icon} tone="gold" size="md" className="mb-4" />
              <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1.5 leading-snug">
                {feature.title}
              </h3>
              <p className="text-[13px] text-[#1A1A1A]/65 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCRMAccess}
            data-cta="crm-open"
            data-surface="emerald"
            className="jj-pill-emerald-metallic inline-flex items-center gap-2 h-11 px-5 rounded-full text-sm font-medium"
          >
            Open CRM Dashboard
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
