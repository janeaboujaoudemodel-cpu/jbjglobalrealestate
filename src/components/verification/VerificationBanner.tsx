import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import VerificationModal from "./VerificationModal";

const VerificationBanner = () => {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: verificationStatus } = useQuery({
    queryKey: ["verification-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_verifications")
        .select("status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.status ?? "none";
    },
    enabled: !!user,
  });

  if (verificationStatus === "approved" || verificationStatus === "pending") {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-y border-[hsl(var(--gold)/0.3)]"
      >
        {/* Subtle shine */}
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--gold)/0.08)] via-transparent to-[hsl(var(--gold)/0.08)] pointer-events-none" />
        
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            {/* Shield icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-none bg-gradient-to-br from-[hsl(var(--gold)/0.2)] to-[hsl(var(--gold)/0.1)] border border-[hsl(var(--gold)/0.4)] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[hsl(var(--gold))]" />
            </div>
            
            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm sm:text-base text-black/80 font-medium leading-snug">
                Join us in building a safer community.{" "}
                <span className="text-[hsl(var(--gold))] font-semibold">Get verified</span> to boost your credibility and assist us in creating trust amongst our users!
              </p>
            </div>
            
            {/* CTA Button */}
            <button
              onClick={() => setModalOpen(true)}
              className="flex-shrink-0 group inline-flex items-center gap-2 px-5 py-2.5 rounded-none bg-black text-[hsl(var(--gold))] font-semibold text-sm tracking-wide border border-[hsl(var(--gold)/0.4)] hover:bg-[hsl(var(--gold))] hover:text-black transition-all duration-300"
            >
              Get Verified
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>

      <VerificationModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};

export default VerificationBanner;
