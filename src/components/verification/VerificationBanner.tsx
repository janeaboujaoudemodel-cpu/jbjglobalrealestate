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
        className="relative overflow-hidden bg-[#1e3a5f]"
      >
        <div className="max-w-[1600px] mx-auto px-4 py-4 sm:py-5 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5">
            {/* Shield icon */}
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#2a4a75] border border-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 !text-white" />
            </div>

            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm sm:text-base text-white/85 font-medium leading-snug">
                Join us in building a safer community.{" "}
                <span className="text-white font-semibold">Get verified</span> to boost your credibility and assist us in creating trust amongst our users!
              </p>
            </div>

            {/* CTA Button — light champagne pill on dark navy with 3D gold glow on hover */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="group relative flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-b from-[#FDFBF7] to-[#EFE6D6] text-[#1A1A1A] font-semibold text-sm tracking-wide border border-[#B89555]/50 shadow-[0_2px_10px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.7)] hover:shadow-[0_0_0_1px_rgba(184,149,85,0.55),0_10px_28px_-6px_rgba(184,149,85,0.65),0_4px_14px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.99] transition-all duration-300 ease-out before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:opacity-0 before:-translate-x-full hover:before:translate-x-full hover:before:opacity-100 before:transition-all before:duration-700 before:pointer-events-none overflow-hidden"
              aria-label="Open identity verification"
            >
              <span className="relative z-10 text-[#1A1A1A]">Get Verified</span>
              <ArrowRight
                className="relative z-10 w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                strokeWidth={2.5}
                color="#1A1A1A"
                style={{ color: "#1A1A1A", stroke: "#1A1A1A" }}
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
