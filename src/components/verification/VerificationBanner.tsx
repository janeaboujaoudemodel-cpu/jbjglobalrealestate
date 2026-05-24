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
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
        className="relative overflow-hidden bg-[#0B1829]"
      >
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            {/* Shield icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#162544] border border-white/15 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm sm:text-base text-white/85 font-medium leading-snug">
                Join us in building a safer community.{" "}
                <span className="text-white font-semibold">Get verified</span> to boost your credibility and assist us in creating trust amongst our users!
              </p>
            </div>

            {/* CTA Button — light champagne pill on dark navy (navy text, elegant contrast) */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#FDFBF7] to-[#EFE6D6] text-[#0B1829] font-semibold text-sm tracking-wide border border-[#B89555]/40 shadow-[0_2px_10px_rgba(0,0,1,0.20),inset_0_1px_0_rgba(255,255,255,0.7)] hover:shadow-[0_6px_22px_rgba(0,0,1,0.30),inset_0_1px_0_rgba(255,255,255,0.85)] hover:-translate-y-0.5 transition-all duration-200"
              aria-label="Open identity verification"
            >
              <span className="text-[#0B1829]">Get Verified</span>
              <ArrowRight
                className="w-4 h-4 text-[#0B1829] group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2.5}
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
