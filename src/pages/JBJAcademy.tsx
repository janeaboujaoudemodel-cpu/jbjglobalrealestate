import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/tier/TierBadge";
import { CertificationSection } from "@/components/certification/CertificationSection";
import { useBrokerProfile } from "@/hooks/useBrokerProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessControl } from "@/hooks/useAccessControl";
import VideoBackground from "@/components/VideoBackground";
import brokerEducationHeroVideo from "@/assets/videos/broker-education-hero.mp4";
import {
  GraduationCap,
  BookOpen,
  BarChart3,
  Briefcase,
  Users,
  Brain,
  Shield,
  Target,
  MapPin,
  TrendingUp,
  ArrowRight,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Upload,
  FileText,
  Star,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const ACADEMY_TOOLS = [
  { href: "/broker-education", icon: BookOpen, label: "Education Hub", desc: "Training books, modules & quizzes" },
  { href: "/broker-dashboard", icon: BarChart3, label: "Dashboard", desc: "Performance metrics & analytics" },
  { href: "/crm", icon: Briefcase, label: "CRM", desc: "Lead management & pipeline" },
  { href: "/listing-portal", icon: MapPin, label: "Listing Portal", desc: "Submit & manage property listings" },
  { href: "/ai-hub", icon: Brain, label: "AI Assistant", desc: "AI-powered sales & support tools" },
  { href: "/ai-objection-handler", icon: Target, label: "Objection Handler", desc: "AI objection handling scripts" },
  { href: "/guides", icon: FileText, label: "Guides & Books", desc: "Real estate guides library" },
  { href: "/broker-resources", icon: Star, label: "Broker Resources", desc: "Templates, scripts & materials" },
  { href: "/market-intelligence", icon: TrendingUp, label: "Market Intelligence", desc: "Market data & insights" },
];

function BrokerProfileCard() {
  const { profile, loading, hasBrokerProfile } = useBrokerProfile();
  const { user } = useAuth();

  if (loading) {
    return (
      <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,88%)]">
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gold/20" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gold/10 rounded w-1/3" />
              <div className="h-4 bg-gold/10 rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,88%)]">
        <CardContent className="p-6 text-center">
          <GraduationCap className="w-10 h-10 text-gold mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-black mb-2">Join JBJ Academy</h3>
          <p className="text-black/60 text-sm mb-4">Sign in to access your broker profile, training, and certification.</p>
          <Button asChild className="bg-gold text-black hover:bg-gold/90">
            <Link to="/join">Apply Now</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Broker";
  const firstName = displayName.split(" ")[0];
  const tier = (profile as any)?.current_tier || "Starter";
  const verificationStatus = (profile as any)?.verification_status || "unverified";
  const probationEnd = (profile as any)?.probation_end;
  const probationMonths = (profile as any)?.probation_months || 3;
  const reraExpiry = (profile as any)?.rera_expiry_date;
  const idExpiry = (profile as any)?.id_expiry_date;

  const isVerified = verificationStatus === "verified";
  const now = new Date();
  const probationRemaining = probationEnd ? Math.max(0, Math.ceil((new Date(probationEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
  const reraExpired = reraExpiry ? new Date(reraExpiry) < now : false;
  const idExpired = idExpiry ? new Date(idExpiry) < now : false;

  return (
    <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,88%)]">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center text-gold font-bold text-xl border-2 border-gold/40 flex-shrink-0">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt={firstName} className="w-full h-full rounded-full object-cover" />
            ) : (
              firstName[0]?.toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-black">{firstName}</h3>
              {isVerified && (
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
              <TierBadge tierName={tier} size="sm" />
            </div>

            <p className="text-black/60 text-sm mt-0.5">
              {(profile as any)?.custom_title || profile?.title || "Property Consultant"}
            </p>

            {/* Probation info */}
            {probationRemaining !== null && probationRemaining > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-700">
                <Clock className="w-3.5 h-3.5" />
                <span>Probation: {probationRemaining} days remaining ({probationMonths} months)</span>
              </div>
            )}

            {/* Document expiry alerts */}
            {(reraExpired || idExpired) && (
              <div className="mt-2 space-y-1">
                {reraExpired && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>RERA card expired — upload a new one to maintain verification</span>
                  </div>
                )}
                {idExpired && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ID document expired — upload a new one to maintain verification</span>
                  </div>
                )}
              </div>
            )}

            {/* Points */}
            {(profile as any)?.total_points !== undefined && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-gold">
                <Star className="w-3.5 h-3.5" />
                <span>{(profile as any)?.total_points || 0} loyalty points</span>
              </div>
            )}
          </div>
        </div>

        {/* Document upload prompt for unverified */}
        {!isVerified && hasBrokerProfile && (
          <div className="mt-4 p-3 bg-gold/10 border border-gold/20 rounded-lg">
            <p className="text-xs text-black/70 mb-2">
              <Shield className="w-3.5 h-3.5 inline mr-1 text-gold" />
              Upload your ID and RERA card to get verified
            </p>
            <Button size="sm" variant="outline" className="border-gold/40 text-gold hover:bg-gold/10 text-xs">
              <Upload className="w-3 h-3 mr-1.5" />
              Upload Documents
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GraduatedBrokersGallery() {
  // This queries hr_certificates for completed brokers
  // Placeholder - populated when certificates exist
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-gold/20 text-gold border-gold/30">
            <Award className="w-3 h-3 mr-1" />
            Graduates
          </Badge>
          <h2 className="text-3xl font-bold text-black mb-2">JBJ Academy Graduates</h2>
          <p className="text-black/60 max-w-xl mx-auto">
            Brokers who have successfully completed the JBJ Broker Certification Program.
          </p>
        </div>

        <Card className="border-2 border-gold/20 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,88%)]">
          <CardContent className="p-8 text-center">
            <GraduationCap className="w-12 h-12 text-gold/40 mx-auto mb-3" />
            <p className="text-black/50 text-sm">
              Complete the certification program to join the graduates gallery.
            </p>
            <Button asChild variant="outline" className="mt-4 border-gold/40 text-gold">
              <Link to="/broker-education">
                Start Training <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default function JBJAcademy() {
  const { isJBJEmployee } = useAccessControl();

  return (
    <>
      <SEOHead
        title="JBJ Academy | Professional Broker Training & Certification"
        description="JBJ Academy — the comprehensive broker training portal featuring education modules, certification, CRM tools, AI assistant, and professional development resources."
        keywords="broker academy, real estate training, broker certification, JBJ academy, Dubai broker education"
        canonicalPath="/jbj-academy"
      />

      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,95%)] to-[hsl(36,25%,92%)]">
        {/* Hero */}
        <section className="relative min-h-[420px] flex items-center overflow-hidden">
          <VideoBackground
            src={brokerEducationHeroVideo}
            poster=""
          />
          <div className="relative z-10 container mx-auto px-4 py-20 text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeInUp}>
                <Badge className="bg-gold/20 text-gold border-gold/40 px-4 py-1.5 mb-6 text-sm">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  JBJ Academy — Internal Training Program
                </Badge>
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold text-white mb-4">
                JBJ <span className="text-gold">Academy</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
                Your complete professional development hub — education, certification, tools, and career growth all in one place.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="bg-gold text-black hover:bg-gold/90 font-semibold">
                  <Link to="/broker-education">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Start Learning
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  <Link to="/verify-certificate/lookup">
                    <Shield className="w-5 h-5 mr-2" />
                    Verify Certificate
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Broker Profile + Navigation */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Profile Card */}
              <div className="lg:col-span-1">
                <BrokerProfileCard />
              </div>

              {/* Navigation Grid */}
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold text-black mb-6">Your Tools & Resources</h2>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={stagger}
                  className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                  {ACADEMY_TOOLS.map((tool) => (
                    <motion.div key={tool.href} variants={fadeInUp}>
                      <Link to={tool.href}>
                        <Card className="border border-gold/20 bg-white/80 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5 transition-all duration-300 h-full group">
                          <CardContent className="p-4 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-colors">
                              <tool.icon className="w-5 h-5 text-gold" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-black text-sm group-hover:text-gold transition-colors">
                                {tool.label}
                              </h3>
                              <p className="text-black/50 text-xs mt-0.5">{tool.desc}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Certification Section */}
        <div className="max-w-7xl mx-auto px-4">
          <CertificationSection isLocked={!isJBJEmployee} />
        </div>

        {/* Graduated Brokers */}
        <GraduatedBrokersGallery />
      </div>
    </>
  );
}
