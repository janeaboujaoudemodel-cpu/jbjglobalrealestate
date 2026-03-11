
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TierBadge } from "@/components/tier/TierBadge";
import { useBrokerProfile } from "@/hooks/useBrokerProfile";
import { useBrokerEducation } from "@/hooks/useBrokerEducation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  GraduationCap,
  BookOpen,
  BarChart3,
  Briefcase,
  Brain,
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
  Shield,
  Users,
  Phone,
  Headphones,
  Zap,
  Trophy,
  Lock,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const PORTAL_TOOLS = [
  { href: "/jbj-academy", icon: GraduationCap, label: "JBJ Academy", desc: "Education, modules, quizzes & certifications", accent: true },
  { href: "/listing-portal", icon: MapPin, label: "Listing Portal", desc: "Submit & manage property listings" },
  { href: "/crm", icon: Briefcase, label: "CRM", desc: "Lead management & pipeline" },
  { href: "/broker-dashboard", icon: BarChart3, label: "Dashboard", desc: "Performance metrics & analytics" },
  { href: "/ai-hub", icon: Brain, label: "AI Assistant", desc: "AI-powered sales & support tools" },
  { href: "/ai-objection-handler", icon: Target, label: "Objection Handler", desc: "AI objection handling scripts" },
  { href: "/broker-education", icon: BookOpen, label: "Education Hub", desc: "Training books & course library" },
  { href: "/guides", icon: FileText, label: "Guides & Books", desc: "Real estate guides library" },
  { href: "/broker-resources", icon: Star, label: "Broker Resources", desc: "Templates, scripts & materials" },
  { href: "/market-intelligence", icon: TrendingUp, label: "Market Intelligence", desc: "Market data & insights" },
  { href: "/broker-toolkit", icon: Zap, label: "Royal Tools", desc: "Stamp, E-Sign, Logo & more" },
  { href: "/ticket-hub", icon: Headphones, label: "Support Hub", desc: "Submit tickets & get help" },
];

function BrokerProfileHero() {
  const { profile, loading, hasBrokerProfile } = useBrokerProfile();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gold/20" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gold/10 rounded w-1/3" />
          <div className="h-4 bg-gold/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <Lock className="w-12 h-12 text-gold/50 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Sign in to access your Broker Portal</p>
        <Link to="/auth?redirect=/broker-portal">
          <Button className="bg-gold text-black hover:bg-gold/90">Sign In</Button>
        </Link>
      </div>
    );
  }

  const firstName = profile?.display_name?.split(" ")[0] || user.email?.split("@")[0] || "Broker";
  const tier = profile?.current_tier || "Starter";
  const verificationStatus = profile?.verification_status || "unverified";
  const probationEnd = profile?.probation_end;
  const totalPoints = profile?.total_points || 0;
  const performanceRating = profile?.performance_rating || "standard";

  const isVerified = verificationStatus === "verified";
  const isExpired = verificationStatus === "expired";
  const probationDaysLeft = probationEnd ? Math.max(0, Math.ceil((new Date(probationEnd).getTime() - Date.now()) / 86400000)) : null;

  return (
    <div className="flex flex-col md:flex-row items-start gap-6">
      {/* Avatar */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/40 to-gold/10 border-2 border-gold flex items-center justify-center overflow-hidden">
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt={firstName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-gold">{firstName[0]}</span>
          )}
        </div>
        {isVerified && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-background">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-foreground">{firstName}</h2>
          <TierBadge tierName={tier} />
          {performanceRating === "elite" && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black border-0">
              <Trophy className="w-3 h-3 mr-1" /> Elite
            </Badge>
          )}
          {isVerified && (
            <Badge variant="outline" className="border-emerald-500 text-emerald-400">
              <Shield className="w-3 h-3 mr-1" /> Verified
            </Badge>
          )}
          {isExpired && (
            <Badge variant="destructive">
              <AlertTriangle className="w-3 h-3 mr-1" /> Documents Expired
            </Badge>
          )}
        </div>

        <p className="text-muted-foreground mt-1">
          {profile?.custom_title || profile?.title || "Real Estate Broker"} · {profile?.custom_label || tier}
        </p>

        <div className="flex items-center gap-6 mt-3 text-sm">
          <div className="flex items-center gap-1.5 text-gold">
            <Star className="w-4 h-4" />
            <span className="font-semibold">{totalPoints}</span>
            <span className="text-muted-foreground">points</span>
          </div>
          {probationDaysLeft !== null && probationDaysLeft > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <Clock className="w-4 h-4" />
              <span>{probationDaysLeft} days probation left</span>
            </div>
          )}
          {probationDaysLeft === 0 && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>Probation completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Link to="/jbj-academy">
          <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
            <GraduationCap className="w-4 h-4 mr-1" /> Academy
          </Button>
        </Link>
        <Link to="/broker-dashboard">
          <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
            <BarChart3 className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

function TrainingProgressSection() {
  const { books, progressMap, loading } = useBrokerEducation();

  if (loading) return null;

  const totalModules = Object.values(progressMap).reduce((s, p) => s + p.totalModules, 0);
  const completedModules = Object.values(progressMap).reduce((s, p) => s + p.completedModules, 0);
  const overallPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
  const completedBooks = Object.values(progressMap).filter(p => p.status === "completed").length;

  return (
    <Card className="border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,92%)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BookOpen className="w-5 h-5 text-gold" /> Training Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{completedModules} of {totalModules} modules completed</span>
          <span className="font-semibold text-gold">{overallPercent}%</span>
        </div>
        <Progress value={overallPercent} className="h-2" />
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{books.length}</p>
            <p className="text-xs text-muted-foreground">Total Books</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{completedBooks}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gold">{overallPercent}%</p>
            <p className="text-xs text-muted-foreground">Overall</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentVerificationSection() {
  const { profile } = useBrokerProfile();
  const { user } = useAuth();
  const verificationStatus = profile?.verification_status || "unverified";
  const reraExpiry = profile?.rera_expiry_date;
  const idExpiry = profile?.id_expiry_date;

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const diff = new Date(date).getTime() - Date.now();
    return diff > 0 && diff < 30 * 86400000;
  };

  const handleDocUpload = async (docType: "rera" | "id", file: File) => {
    if (!user || !profile) return;
    const ext = file.name.split(".").pop();
    const path = `broker-docs/${user.id}/${docType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("broker-documents")
      .upload(path, file, { cacheControl: "3600", upsert: true });

    if (uploadError) {
      // Bucket may not exist — store as local reference
      console.warn("Upload failed:", uploadError);
      toast.error("Upload service unavailable. Please try again later.");
      return;
    }

    const { data: urlData } = supabase.storage
      .from("broker-documents")
      .getPublicUrl(path);

    const updateData: Record<string, any> = {};
    if (docType === "rera") {
      updateData.rera_card_url = urlData.publicUrl;
    } else {
      updateData.id_document_url = urlData.publicUrl;
    }

    const { error: dbError } = await supabase
      .from("broker_profiles")
      .update(updateData)
      .eq("id", profile.id);

    if (dbError) {
      toast.error("Failed to save document info");
      return;
    }

    toast.success(`${docType === "rera" ? "RERA Card" : "Emirates ID"} uploaded successfully`);
  };

  const triggerUpload = (docType: "rera" | "id") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File must be under 10MB");
          return;
        }
        handleDocUpload(docType, file);
      }
    };
    input.click();
  };

  return (
    <Card className="border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,92%)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-gold" /> Verification & Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Verification Status</span>
          <Badge
            variant={verificationStatus === "verified" ? "default" : verificationStatus === "expired" ? "destructive" : "secondary"}
            className={verificationStatus === "verified" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : ""}
          >
            {verificationStatus === "verified" ? "Verified" : verificationStatus === "expired" ? "Expired" : "Unverified"}
          </Badge>
        </div>

        {/* RERA Card */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" />
            <span className="text-sm">RERA Card</span>
          </div>
          {reraExpiry ? (
            <span className={`text-xs ${isExpiringSoon(reraExpiry) ? "text-amber-400" : "text-muted-foreground"}`}>
              Expires: {new Date(reraExpiry).toLocaleDateString()}
              {isExpiringSoon(reraExpiry) && <AlertTriangle className="w-3 h-3 inline ml-1" />}
            </span>
          ) : (
            <Button size="sm" variant="ghost" className="text-gold text-xs h-7" onClick={() => triggerUpload("rera")}>
              <Upload className="w-3 h-3 mr-1" /> Upload
            </Button>
          )}
        </div>

        {/* ID Document */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" />
            <span className="text-sm">Emirates ID</span>
          </div>
          {idExpiry ? (
            <span className={`text-xs ${isExpiringSoon(idExpiry) ? "text-amber-400" : "text-muted-foreground"}`}>
              Expires: {new Date(idExpiry).toLocaleDateString()}
              {isExpiringSoon(idExpiry) && <AlertTriangle className="w-3 h-3 inline ml-1" />}
            </span>
          ) : (
            <Button size="sm" variant="ghost" className="text-gold text-xs h-7" onClick={() => triggerUpload("id")}>
              <Upload className="w-3 h-3 mr-1" /> Upload
            </Button>
          )}
        </div>

        {verificationStatus !== "verified" && (
          <p className="text-xs text-muted-foreground">
            Upload your RERA card and Emirates ID to get verified. Both documents must match your registered name.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function BrokerPortal() {
  return (
    <>
      <SEOHead
        title="Broker Portal | JBJ Global Real Estate"
        description="Your dedicated broker portal — access CRM, listings, AI tools, training academy, certifications, and performance dashboard."
      />

      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] to-[hsl(36,25%,88%)]">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-[hsl(36,10%,12%)] to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(36,40%,20%)_0%,transparent_60%)]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center border border-gold/30">
                  <GraduationCap className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Broker Portal</h1>
                  <p className="text-gold/70 text-sm">JBJ Global Real Estate — Partner Hub</p>
                </div>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-gold/20 p-6 md:p-8">
                <BrokerProfileHero />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Access Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold" /> Quick Access
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {PORTAL_TOOLS.map((tool) => (
                <motion.div key={tool.href} variants={fadeInUp}>
                  <Link to={tool.href}>
                    <Card className={`h-full hover:border-gold transition-all duration-300 group cursor-pointer ${
                      tool.accent ? "border-gold bg-gradient-to-br from-gold/10 to-transparent" : "border-gold/20"
                    }`}>
                      <CardContent className="p-4 flex flex-col items-start gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          tool.accent ? "bg-gold/20" : "bg-gold/10"
                        }`}>
                          <tool.icon className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-gold transition-colors">
                          {tool.label}
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                        <ArrowRight className="w-3.5 h-3.5 text-gold/50 group-hover:text-gold group-hover:translate-x-1 transition-all mt-auto" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Status Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="grid md:grid-cols-2 gap-6">
            <TrainingProgressSection />
            <DocumentVerificationSection />
          </div>
        </section>

        {/* Certificates & Graduates CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,92%)]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-7 h-7 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">My Certificates</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">View and download your earned certificates with QR verification</p>
                </div>
                <Link to="/jbj-academy">
                  <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                    View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,92%)]">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-gold" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">JBJ Graduates</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">View all graduated brokers and verify certificates</p>
                </div>
                <Link to="/academy/graduates">
                  <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                    View <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
