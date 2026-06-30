import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { useActionGate } from "@/contexts/ActionGateContext";
import { Star, TrendingUp, Shield, Gift, Sparkles, ArrowRight, X } from "lucide-react";
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";

const REASON_HEADLINES: Record<string, string> = {
  save_favorite: "Save Your Favourite Properties",
  add_shortlist: "Build Your Personalised Shortlist",
  compare: "Compare Properties Side by Side",
  download: "Download Exclusive Reports",
  book_consultation: "Book a Private Consultation",
  request_callback: "Get a Priority Callback",
  submit_form: "Submit Your Request",
  access_dashboard: "Access Your Personal Dashboard",
  access_portal: "Enter Your Private Portal",
  access_tools: "Unlock Premium AI Tools",
  view_documents: "Access Your Documents",
  general: "Unlock the Full JBJ GLOBAL REAL ESTATE Experience",
};

const benefits = [
  { icon: Gift, text: "Earn loyalty points on every activity — redeemable on purchases & subscriptions" },
  { icon: Star, text: "Personalised property recommendations tailored to your preferences" },
  { icon: TrendingUp, text: "Exclusive market reports & portfolio tracking tools" },
  { icon: Sparkles, text: "Priority access to new launches & off-plan opportunities" },
  { icon: Shield, text: "Secure account with saved searches, favourites & history" },
];

const ActionGateModal = () => {
  const { isGateOpen, closeGate, gateReason } = useActionGate();
  const navigate = useNavigate();

  const headline = REASON_HEADLINES[gateReason || "general"] || REASON_HEADLINES.general;

  const handleSignIn = () => {
    closeGate();
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    navigate(`/auth?returnTo=${returnTo}`);
  };

  return (
    <Dialog open={isGateOpen} onOpenChange={(open) => { if (!open) closeGate(); }}>
      <DialogContent
        className="bg-[#1A1A1A]/95 backdrop-blur-xl border border-[#B89555]/30 text-white max-w-lg p-0 overflow-hidden shadow-2xl rounded-2xl"
        aria-describedby={undefined}
      >
        <VisuallyHidden.Root>
          <DialogTitle>Sign in to continue</DialogTitle>
        </VisuallyHidden.Root>

        {/* Top gold accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950 to-black" />

        {/* Ambient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-48 pointer-events-none opacity-25"
          style={{ background: `radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.5) 0%, transparent 70%)` }}
        />

        {/* Corner accents */}
        <div className="absolute top-5 left-5 w-8 h-8 border-l-2 border-t-2 border-[#B89555]/50" />
        <div className="absolute top-5 right-5 w-8 h-8 border-r-2 border-t-2 border-[#B89555]/50" />
        <div className="absolute bottom-5 left-5 w-8 h-8 border-l-2 border-b-2 border-[#B89555]/40" />
        <div className="absolute bottom-5 right-5 w-8 h-8 border-r-2 border-b-2 border-[#B89555]/40" />

        <div className="relative px-8 py-10">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <img src={jbjMonogramLightTransparent} alt="JBJ Global Real Estate" className="h-20 w-auto object-contain"  loading="lazy" decoding="async" />
          </div>

          {/* Headline */}
          <h2
            className="text-center text-xl md:text-2xl font-bold text-[#1A1A1A] mb-2 tracking-wide"
          >
            {headline}
          </h2>

          <p className="text-center text-white/70 text-sm mb-6">
            Create a free account to unlock premium features and start earning rewards
          </p>

          {/* Divider */}
          <div className="relative h-px mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#EFE6D6]/10 border border-[#B89555]/20 flex items-center justify-center mt-0.5">
                  <b.icon className="w-4 h-4 text-[#1A1A1A]" />
                </div>
                <p className="text-sm text-white/85 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button
              onClick={handleSignIn}
              className="w-full py-5 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-bold text-base rounded-xl group relative overflow-hidden transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Sparkles className="w-5 h-5 mr-2 relative z-10" />
              <span className="relative z-10">Create Free Account</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
            </Button>

            <Button
              onClick={handleSignIn}
              variant="outline"
              className="w-full py-5 bg-transparent border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 font-semibold text-sm rounded-xl transition-all duration-300"
            >
              Already have an account? Sign In
            </Button>

            <button
              onClick={closeGate}
              className="w-full text-center text-white/90 hover:text-white/70 text-xs mt-2 transition-colors"
            >
              Continue Browsing
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[#1A1A1A]/70 text-[10px] mt-6">
            Your activity earns loyalty points redeemable on purchases & subscriptions
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActionGateModal;
