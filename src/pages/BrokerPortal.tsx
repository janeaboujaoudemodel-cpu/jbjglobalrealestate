import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { TierBadge } from "@/components/tier/TierBadge";
import { useBrokerProfile } from "@/hooks/useBrokerProfile";
import { useBrokerEducation } from "@/hooks/useBrokerEducation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ApprovalTimeline, { JBJ_APPROVAL_STEPS } from "@/components/shared/ApprovalTimeline";
import { useMyEventInvitations } from "@/hooks/useEventManagement";
import {
  GraduationCap, BookOpen, BarChart3, Briefcase, Brain, Target, MapPin, TrendingUp,
  ArrowRight, Award, Clock, CheckCircle, AlertTriangle, Upload, FileText, Star,
  Shield, Users, Phone, Headphones, Zap, Trophy, Lock, LayoutDashboard, Mail,
  Bell, Calendar, User, ImageIcon, Stamp, CreditCard, StickyNote, FileEdit, Globe,
  History
} from "lucide-react";
import { format } from "date-fns";

const TAB_STYLE = "text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[hsl(36,40%,70%)]/40 rounded-lg";

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
        <div className="w-20 h-20 rounded-full bg-[hsl(36,40%,70%)]/20" />
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-[hsl(36,40%,70%)]/10 rounded w-1/3" />
          <div className="h-4 bg-[hsl(36,40%,70%)]/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <Lock className="w-12 h-12 text-[hsl(36,40%,70%)]/50 mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Sign in to access your Broker Portal</p>
        <Link to="/auth?redirect=/broker-portal">
          <Button className="bg-[hsl(36,40%,70%)] text-[hsl(32,28%,13%)] hover:opacity-90">Sign In</Button>
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
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(36,40%,70%)]/40 to-[hsl(36,40%,70%)]/10 border-2 border-[hsl(36,40%,70%)] flex items-center justify-center overflow-hidden">
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt={firstName} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
          ) : (
            <span className="text-2xl font-bold text-[hsl(36,40%,70%)]">{firstName[0]}</span>
          )}
        </div>
        {isVerified && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 jj-surface-emerald rounded-full flex items-center justify-center border-2 border-background">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-foreground">{firstName}</h2>
          <TierBadge tierName={tier} />
          {performanceRating === "elite" && (
            <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-[#1A1A1A] border-0">
              <Trophy className="w-3 h-3 mr-1" /> Elite
            </Badge>
          )}
          {isVerified && <Badge variant="outline" className="border-[color:var(--emerald-1)]/30 text-emerald-400"><Shield className="w-3 h-3 mr-1" /> Verified</Badge>}
          {isExpired && <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Documents Expired</Badge>}
        </div>
        <p className="text-muted-foreground mt-1">{profile?.custom_title || profile?.title || "Real Estate Broker"} · {profile?.custom_label || tier}</p>
        <div className="flex items-center gap-6 mt-3 text-sm">
          <div className="flex items-center gap-1.5 text-[hsl(36,40%,70%)]">
            <Star className="w-4 h-4" />
            <span className="font-semibold">{totalPoints}</span>
            <span className="text-muted-foreground">points</span>
          </div>
          {probationDaysLeft !== null && probationDaysLeft > 0 && (
            <div className="flex items-center gap-1.5 text-[#1A1A1A]">
              <Clock className="w-4 h-4" /><span>{probationDaysLeft} days probation left</span>
            </div>
          )}
          {probationDaysLeft === 0 && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-4 h-4" /><span>Probation completed</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Link to="/jbj-academy">
          <Button size="sm" variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)] hover:bg-[hsl(36,40%,70%)]/10">
            <GraduationCap className="w-4 h-4 mr-1" /> Academy
          </Button>
        </Link>
        <Link to="/broker-dashboard">
          <Button size="sm" variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)] hover:bg-[hsl(36,40%,70%)]/10">
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
    <Card className="border-[hsl(36,40%,70%)]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,92%)]">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><BookOpen className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Training Progress</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{completedModules} of {totalModules} modules completed</span>
          <span className="font-semibold text-[hsl(36,40%,70%)]">{overallPercent}%</span>
        </div>
        <Progress value={overallPercent} className="h-2" />
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center"><p className="text-2xl font-bold text-foreground">{books.length}</p><p className="text-xs text-muted-foreground">Total Books</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-emerald-400">{completedBooks}</p><p className="text-xs text-muted-foreground">Completed</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-[hsl(36,40%,70%)]">{overallPercent}%</p><p className="text-xs text-muted-foreground">Overall</p></div>
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
    const { error: uploadError } = await supabase.storage.from("broker-documents").upload(path, file, { cacheControl: "3600", upsert: true });
    if (uploadError) { toast.error("Upload service unavailable. Please try again later."); return; }
    const { data: urlData } = supabase.storage.from("broker-documents").getPublicUrl(path);
    const updateData: Record<string, any> = {};
    if (docType === "rera") updateData.rera_card_url = urlData.publicUrl;
    else updateData.id_document_url = urlData.publicUrl;
    const { error: dbError } = await supabase.from("broker_profiles").update(updateData as any).eq("id", profile.id);
    if (dbError) { toast.error("Failed to save document info"); return; }
    toast.success(`${docType === "rera" ? "RERA Card" : "Emirates ID"} uploaded successfully`);
  };

  const triggerUpload = (docType: "rera" | "id") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
        handleDocUpload(docType, file);
      }
    };
    input.click();
  };

  return (
    <Card className="border-[hsl(36,40%,70%)]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,92%)]">
      <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Shield className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Verification & Documents</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Verification Status</span>
          <Badge variant={verificationStatus === "verified" ? "default" : verificationStatus === "expired" ? "destructive" : "secondary"}
            className={verificationStatus === "verified" ? "jj-surface-emerald-soft text-emerald-400 border-[color:var(--emerald-1)]/30/30" : ""}>
            {verificationStatus === "verified" ? "Verified" : verificationStatus === "expired" ? "Expired" : "Unverified"}
          </Badge>
        </div>
        {["rera", "id"].map((docType) => {
          const expiry = docType === "rera" ? reraExpiry : idExpiry;
          const label = docType === "rera" ? "RERA Card" : "Emirates ID";
          return (
            <div key={docType} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
              <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-[hsl(36,40%,70%)]" /><span className="text-sm">{label}</span></div>
              {expiry ? (
                <span className={`text-xs ${isExpiringSoon(expiry) ? "text-[#1A1A1A]" : "text-muted-foreground"}`}>
                  Expires: {new Date(expiry).toLocaleDateString()}{isExpiringSoon(expiry) && <AlertTriangle className="w-3 h-3 inline ml-1" />}
                </span>
              ) : (
                <Button size="sm" variant="ghost" className="text-[hsl(36,40%,70%)] text-xs h-7" onClick={() => triggerUpload(docType as "rera" | "id")}>
                  <Upload className="w-3 h-3 mr-1" /> Upload
                </Button>
              )}
            </div>
          );
        })}
        {verificationStatus !== "verified" && (
          <p className="text-xs text-muted-foreground">Upload your RERA card and Emirates ID to get verified.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function BrokerPortal() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "dashboard");
  const { user } = useAuth();
  const { profile } = useBrokerProfile();
  const { invitations, respondToInvitation } = useMyEventInvitations();

  const [profileForm, setProfileForm] = useState({
    company_name: "", personal_number: "", personal_email: "",
    nationality: "", languages: "", years_in_re: "", date_of_joining: "",
  });

  return (
    <>
      <SEOHead title="Broker Portal | JBJ Global Real Estate" description="Your dedicated broker portal — access CRM, listings, AI tools, training academy, and performance dashboard." />

      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] to-[hsl(36,25%,88%)]">
        {/* Tabbed Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap gap-1.5 bg-transparent p-0 mb-6 h-auto">
              <TabsTrigger value="dashboard" className={TAB_STYLE}><LayoutDashboard className="w-3.5 h-3.5 mr-1 hidden md:block" /> Dashboard</TabsTrigger>
              <TabsTrigger value="listings" className={TAB_STYLE}><MapPin className="w-3.5 h-3.5 mr-1 hidden md:block" /> My Listings</TabsTrigger>
              <TabsTrigger value="documents" className={TAB_STYLE}><FileText className="w-3.5 h-3.5 mr-1 hidden md:block" /> Documents</TabsTrigger>
              <TabsTrigger value="profile" className={TAB_STYLE}><User className="w-3.5 h-3.5 mr-1 hidden md:block" /> Update Profile</TabsTrigger>
              <TabsTrigger value="inbox" className={TAB_STYLE}><Mail className="w-3.5 h-3.5 mr-1 hidden md:block" /> Inbox</TabsTrigger>
              <TabsTrigger value="alerts" className={TAB_STYLE}><Bell className="w-3.5 h-3.5 mr-1 hidden md:block" /> Alerts</TabsTrigger>
              <TabsTrigger value="calendar" className={TAB_STYLE}><Calendar className="w-3.5 h-3.5 mr-1 hidden md:block" /> Calendar</TabsTrigger>
            </TabsList>

            {/* ── DASHBOARD ── */}
            <TabsContent value="dashboard">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
                <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Quick Access
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {PORTAL_TOOLS.map((tool) => (
                    <motion.div key={tool.href} variants={fadeInUp}>
                      <Link to={tool.href}>
                        <Card className={`h-full hover:border-[hsl(36,40%,70%)] transition-all duration-300 group cursor-pointer ${tool.accent ? "border-[hsl(36,40%,70%)] bg-gradient-to-br from-[hsl(36,40%,70%)]/10 to-transparent" : "border-[hsl(36,40%,70%)]/20"}`}>
                          <CardContent className="p-4 flex flex-col items-start gap-2">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tool.accent ? "bg-[hsl(36,40%,70%)]/20" : "bg-[hsl(36,40%,70%)]/10"}`}>
                              <tool.icon className="w-5 h-5 text-[hsl(36,40%,70%)]" />
                            </div>
                            <h3 className="font-semibold text-sm text-foreground group-hover:text-[hsl(36,40%,70%)] transition-colors">{tool.label}</h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                            <ArrowRight className="w-3.5 h-3.5 text-[hsl(36,40%,70%)]/50 group-hover:text-[hsl(36,40%,70%)] group-hover:translate-x-1 transition-all mt-auto" />
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <TrainingProgressSection />
                  <DocumentVerificationSection />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <Card className="border-[hsl(36,40%,70%)]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,92%)]">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[hsl(36,40%,70%)]/10 flex items-center justify-center flex-shrink-0"><Award className="w-7 h-7 text-[hsl(36,40%,70%)]" /></div>
                      <div className="flex-1"><h3 className="font-semibold text-foreground">My Certificates</h3><p className="text-xs text-muted-foreground mt-0.5">View and download earned certificates</p></div>
                      <Link to="/jbj-academy"><Button size="sm" variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)] hover:bg-[hsl(36,40%,70%)]/10">View <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
                    </CardContent>
                  </Card>
                  <Card className="border-[hsl(36,40%,70%)]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(36,25%,92%)]">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[hsl(36,40%,70%)]/10 flex items-center justify-center flex-shrink-0"><Users className="w-7 h-7 text-[hsl(36,40%,70%)]" /></div>
                      <div className="flex-1"><h3 className="font-semibold text-foreground">JBJ Graduates</h3><p className="text-xs text-muted-foreground mt-0.5">View all graduated brokers</p></div>
                      <Link to="/academy/graduates"><Button size="sm" variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)] hover:bg-[hsl(36,40%,70%)]/10">View <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </TabsContent>

            {/* ── MY LISTINGS ── */}
            <TabsContent value="listings">
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">If your company or role has changed, please <button onClick={() => setActiveTab("profile")} className="text-[hsl(36,40%,70%)] underline font-semibold">update your profile</button> before submitting a new listing.</p>
                </div>
                <Card className="border-[hsl(36,40%,70%)]/20">
                  <CardContent className="p-8 text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-muted-foreground">No listings submitted yet</p>
                    <Link to="/listing-portal"><Button variant="outline" className="mt-4 border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)]">Submit a Listing</Button></Link>
                  </CardContent>
                </Card>

                <Card className="border-[hsl(36,40%,70%)]/20">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Approval Process</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">All listings go through our 3-step approval:</p>
                    <ApprovalTimeline steps={JBJ_APPROVAL_STEPS} />
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ── DOCUMENTS ── */}
            <TabsContent value="documents">
              <DocumentVerificationSection />
            </TabsContent>

            {/* ── UPDATE PROFILE ── */}
            <TabsContent value="profile">
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-6">
                <Card className="border-2 border-[hsl(36,40%,70%)]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><User className="w-5 h-5 text-[hsl(36,40%,70%)]" /> Broker Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><Label className="text-xs text-muted-foreground">Company Name</Label><Input value={profileForm.company_name} onChange={(e) => setProfileForm(p => ({ ...p, company_name: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" /></div>
                      <div><Label className="text-xs text-muted-foreground">Personal Number</Label><Input value={profileForm.personal_number} onChange={(e) => setProfileForm(p => ({ ...p, personal_number: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" /></div>
                      <div><Label className="text-xs text-muted-foreground">Personal Email</Label><Input value={profileForm.personal_email} onChange={(e) => setProfileForm(p => ({ ...p, personal_email: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" /></div>
                      <div><Label className="text-xs text-muted-foreground">Nationality</Label><Input value={profileForm.nationality} onChange={(e) => setProfileForm(p => ({ ...p, nationality: e.target.value }))} className="border-[hsl(36,40%,70%)]/30" /></div>
                      <div><Label className="text-xs text-muted-foreground">Languages</Label><Input value={profileForm.languages} onChange={(e) => setProfileForm(p => ({ ...p, languages: e.target.value }))} placeholder="English, Arabic..." className="border-[hsl(36,40%,70%)]/30" /></div>
                      <div><Label className="text-xs text-muted-foreground">Years in Real Estate</Label><Input value={profileForm.years_in_re} onChange={(e) => setProfileForm(p => ({ ...p, years_in_re: e.target.value }))} type="number" className="border-[hsl(36,40%,70%)]/30" /></div>
                      <div><Label className="text-xs text-muted-foreground">Date of Joining Company</Label><Input value={profileForm.date_of_joining} onChange={(e) => setProfileForm(p => ({ ...p, date_of_joining: e.target.value }))} type="date" className="border-[hsl(36,40%,70%)]/30" /></div>
                    </div>
                    <Button className="bg-gradient-to-r from-[hsl(36,40%,70%)] to-[hsl(38,35%,60%)] text-[hsl(32,28%,13%)] hover:opacity-90" onClick={() => toast.success("Profile saved")}>Save Profile</Button>
                  </CardContent>
                </Card>

                {/* Brand Assets */}
                <Card className="border-[hsl(36,40%,70%)]/20">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Brand Assets</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {[{ label: "Stamp", icon: Stamp }, { label: "Logo", icon: ImageIcon }, { label: "Business Card", icon: CreditCard }].map((asset) => (
                        <div key={asset.label} className="text-center p-4 rounded-lg border border-border/30 bg-background/50">
                          <asset.icon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" aria-hidden="true" data-decorative="true" />
                          <p className="text-xs text-muted-foreground">{asset.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Links */}
                <div className="grid md:grid-cols-3 gap-3">
                  {[{ label: "Draft Applications", icon: FileEdit, count: 0 }, { label: "AI Tools Used", icon: Star, count: 0 }, { label: "Notes", icon: StickyNote, count: 0 }].map((item) => (
                    <Card key={item.label} className="border-[hsl(36,40%,70%)]/20">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[hsl(36,40%,70%)]/10 flex items-center justify-center"><item.icon className="w-5 h-5 text-[hsl(36,40%,70%)]" /></div>
                        <div><p className="text-sm font-semibold text-foreground">{item.label}</p><p className="text-[10px] text-muted-foreground">{item.count} items</p></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Role Switch */}
                <Card className="border-[hsl(36,40%,70%)]/20">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Switch Role</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">Convert your profile to Developer (requires re-approval).</p>
                    <Link to="/developer-portal?tab=register"><Button variant="outline" className="border-[hsl(36,40%,70%)]/30 text-[hsl(36,40%,70%)]">Apply as Developer / Representative</Button></Link>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ── INBOX ── */}
            <TabsContent value="inbox">
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Mail className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Inbox</CardTitle></CardHeader>
                <CardContent><p className="text-center text-sm text-muted-foreground py-8">No messages yet</p></CardContent>
              </Card>
            </TabsContent>

            {/* ── ALERTS ── */}
            <TabsContent value="alerts">
              <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="space-y-4">
                <Card className="border-[hsl(36,40%,70%)]/20">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Event Invitations</CardTitle></CardHeader>
                  <CardContent>
                    {invitations.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">No alerts</p>
                    ) : (
                      <div className="space-y-3">
                        {invitations.map((inv) => (
                          <div key={inv.id} className="p-4 rounded-xl border border-[hsl(36,40%,70%)]/20 bg-background/50">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm text-foreground">{(inv.event as any)?.title || "Event"}</p>
                              <Badge className={inv.status === "accepted" ? "jj-surface-emerald-soft text-emerald-500" : "bg-amber-500/10 text-amber-500"}>{inv.status}</Badge>
                            </div>
                            {inv.status === "invited" && (
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" onClick={() => respondToInvitation(inv.id, "accepted")} className="jj-surface-emerald text-white hover:jj-surface-emerald text-xs">Accept</Button>
                                <Button size="sm" variant="outline" onClick={() => respondToInvitation(inv.id, "declined")} className="text-xs">Decline</Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ── CALENDAR ── */}
            <TabsContent value="calendar">
              <Card className="border-[hsl(36,40%,70%)]/20">
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-[hsl(36,40%,70%)]" /> Events Calendar</CardTitle></CardHeader>
                <CardContent>
                  {invitations.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No upcoming events</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {invitations.filter((inv) => (inv.event as any)?.event_date).map((inv) => (
                        <div key={inv.id} className="flex items-center gap-4 p-4 rounded-xl border border-[hsl(36,40%,70%)]/20 bg-background/50">
                          <div className="w-14 h-14 rounded-xl bg-[hsl(36,40%,70%)]/10 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-[hsl(36,40%,70%)]">{format(new Date((inv.event as any).event_date), "dd")}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date((inv.event as any).event_date), "MMM")}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-foreground">{(inv.event as any)?.title}</p>
                            <p className="text-[10px] text-muted-foreground">{(inv.event as any)?.location || "TBA"}</p>
                          </div>
                          <Badge className={inv.status === "accepted" ? "jj-surface-emerald-soft text-emerald-500" : "bg-amber-500/10 text-amber-500"}>{inv.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
