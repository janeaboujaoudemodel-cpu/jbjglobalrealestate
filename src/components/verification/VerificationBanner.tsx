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
        className="relative overflow-hidden bg-[#F7F2EA] border-y border-[#B89555]/30"
      >
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            {/* Shield icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#1A1A1A]/70" />
            </div>
            
            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm sm:text-base text-[#1A1A1A]/80 font-medium leading-snug">
                Join us in building a safer community.{" "}
                <span className="text-[#1A1A1A] font-semibold">Get verified</span> to boost your credibility and assist us in creating trust amongst our users!
              </p>
            </div>
            
            {/* CTA Button */}
            <button
              onClick={() => setModalOpen(true)}
              className="cta-premium flex-shrink-0 group inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A1A1A] text-white font-semibold text-sm tracking-wide border border-[#1A1A1A] hover:bg-[#1A1A1A] allow-white"
              data-no-contrast-guard
            >
              Get Verified
              <ArrowRight
                className="w-4 h-4 text-white allow-white group-hover:translate-x-0.5 transition-transform"
                data-no-contrast-guard
                style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.55))' }}
              />
            </button>
          </div>
        </div>
      </motion.div>

      <VerificationModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};

export default VerificationBanner;
