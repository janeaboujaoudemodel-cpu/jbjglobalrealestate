import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Video, Sparkles, Crown, Play, Mic, Music, Languages, 
  Wand2, Film, Star, ArrowRight, Lock, Palette, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VideoBuilderAccessGateProps {
  children: React.ReactNode;
}

const VideoBuilderAccessGate = ({ children }: VideoBuilderAccessGateProps) => {
  const { user, loading: authLoading, isOwner, ownerLoading } = useAuth();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to finish
      if (authLoading || ownerLoading) return;

      if (!user) {
        setHasAccess(false);
        setIsChecking(false);
        return;
      }

      // Owner override - if verified as Owner, allow immediately
      if (isOwner) {
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      try {
        // Check if user has admin role
        const { data: hasAdminRole } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (hasAdminRole) {
          setHasAccess(true);
          setIsChecking(false);
          return;
        }

        // Check if user has a broker subscription (JBJ broker)
        const { data: subscription } = await supabase
          .from("broker_subscriptions")
          .select("id, status, user_role")
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (subscription) {
          setHasAccess(true);
          setIsChecking(false);
          return;
        }

        // Check if user has broker_member role via direct query (cast to avoid type restrictions)
        const { data: brokerRole } = await supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "broker_member" as any)
          .maybeSingle();

        setHasAccess(Boolean(brokerRole));
      } catch (error) {
        console.error("Error checking video builder access:", error);
        setHasAccess(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [user, authLoading, isOwner, ownerLoading]);

  if (authLoading || ownerLoading || isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Exclusive preview for non-JBJ users
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#EFE6D6]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container max-w-6xl mx-auto px-4 py-16 relative z-10">
          {/* Exclusive Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <Badge className="bg-gradient-to-r from-gold via-gold-light to-gold text-[#1A1A1A] px-6 py-2 text-sm font-semibold shadow-xl shadow-gold/30">
              <Crown className="h-4 w-4 mr-2" />
              Exclusive for JBJ Brokers
            </Badge>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              AI Video
              <span className="bg-gradient-to-r from-primary via-gold to-primary bg-clip-text text-transparent"> Builder</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              Create stunning, cinematic property videos in minutes with AI-powered editing, voiceovers, and branding
            </p>
          </motion.div>

          {/* Video Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-4xl mx-auto mb-16"
          >
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 shadow-2xl">
              {/* Mock video player */}
              <div className="aspect-video relative">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                        <Play className="h-12 w-12 text-primary fill-current" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-primary/10"
                      />
                    </div>
                    <p className="text-white/90 text-lg">AI-Powered Property Tours</p>
                  </div>
                </div>

                {/* Floating feature badges */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute top-4 left-4 flex flex-col gap-2"
                >
                  <Badge className="bg-[#1A1A1A]/80 text-white border-white/20">
                    <Wand2 className="h-3 w-3 mr-1" /> AI Auto-Edit
                  </Badge>
                  <Badge className="bg-[#1A1A1A]/80 text-white border-white/20">
                    <Mic className="h-3 w-3 mr-1" /> Voice Synthesis
                  </Badge>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="absolute top-4 right-4 flex flex-col gap-2"
                >
                  <Badge className="bg-[#1A1A1A]/80 text-white border-white/20">
                    <Music className="h-3 w-3 mr-1" /> AI Music
                  </Badge>
                  <Badge className="bg-[#1A1A1A]/80 text-white border-white/20">
                    <Languages className="h-3 w-3 mr-1" /> Multi-Language
                  </Badge>
                </motion.div>

                {/* Bottom overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">Creek Vista by Sobha</p>
                      <p className="text-white/90 text-sm">Dubai Creek Harbour</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      AED 1.8M
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Mock timeline */}
              <div className="p-4 border-t border-white/10 bg-[#1A1A1A]/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 flex-1 bg-gradient-to-r from-primary/40 via-gold/30 to-primary/40 rounded" />
                </div>
                <div className="flex gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 flex-1 bg-[#1A1A1A] rounded border border-white/5" />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-3 gap-6 mb-16"
          >
            {[
              {
                icon: Wand2,
                title: "AI Auto-Editing",
                description: "Intelligent scene detection, color correction, and cinematic transitions applied automatically"
              },
              {
                icon: Mic,
                title: "Voice Synthesis",
                description: "Professional voiceovers in British, Arabic, Hindi, and more with ElevenLabs AI"
              },
              {
                icon: Languages,
                title: "Multi-Language",
                description: "Auto-translated subtitles and narration for global property marketing"
              },
              {
                icon: Music,
                title: "AI Background Music",
                description: "Royalty-free, mood-matched music generated specifically for your video"
              },
              {
                icon: Palette,
                title: "JBJ Branding",
                description: "Automatic logo animations, watermarks, and professional intro/outro sequences"
              },
              {
                icon: Zap,
                title: "Instant Export",
                description: "Export in 16:9, 9:16, or 1:1 formats ready for social media and listings"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-[#FDFBF7]/5 border-white/10 backdrop-blur-sm hover:bg-[#FDFBF7]/10 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-gold/20 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/90 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 via-gold/5 to-primary/10 border-primary/30">
              <CardContent className="p-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Lock className="h-5 w-5 text-[#1A1A1A]" />
                  <span className="text-[#1A1A1A] font-semibold">Exclusive Access</span>
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  This Tool is Reserved for JBJ Brokers
                </h2>

                <p className="text-white/90 mb-6">
                  Join the JBJ Broker Circle and unlock instant access to the AI Video Builder, 
                  plus 20+ professional tools, dedicated support, and exclusive training.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate("/hr-agent")}
                    className="bg-gradient-to-r from-gold via-gold-light to-gold text-[#1A1A1A] hover:opacity-90 shadow-lg shadow-gold/30 gap-2"
                  >
                    <Star className="h-5 w-5" />
                    Join the Circle Now
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                  
                  {!user && (
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/auth")}
                      className="border-white/20 text-white hover:bg-[#FDFBF7]/10"
                    >
                      Already a Member? Sign In
                    </Button>
                  )}
                </div>

                <p className="text-white/85 text-sm mt-6">
                  Connect with our HR team to start your journey today
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VideoBuilderAccessGate;
