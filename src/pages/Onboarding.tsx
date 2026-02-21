import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, CheckCircle, XCircle, BookOpen, GraduationCap, 
  Trophy, Lock, ChevronRight, Building2, Briefcase
} from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { toast } from "sonner";
import { CertificateGenerator } from "@/components/onboarding/CertificateGenerator";

interface Application {
  id: string;
  status: "pending" | "approved" | "rejected";
  full_name: string;
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
}

interface HRRole {
  role: "broker_candidate" | "broker_member";
  is_active: boolean;
}

interface Module {
  id: string;
  track: "company_knowledge" | "real_estate_basics";
  title: string;
  content: string;
  video_url?: string;
  key_points: string[];
  display_order: number;
}

interface QuizAttempt {
  module_id: string;
  score: number;
  passed: boolean;
  attempted_at: string;
}

interface Certificate {
  id: string;
  certificate_number: string;
  full_name: string;
  company_score: number;
  real_estate_score: number;
  combined_score: number;
  issued_at: string;
  verification_token: string;
}

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [hrRole, setHrRole] = useState<HRRole | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [passThresholds, setPassThresholds] = useState({
    company: 70,
    realEstate: 70,
    combined: 70,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/onboarding");
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load application
      const { data: appData } = await supabase
        .from("hr_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setApplication(appData);

      // Load HR role
      const { data: roleData } = await supabase
        .from("hr_user_roles")
        .select("role, is_active")
        .eq("user_id", user.id)
        .maybeSingle();

      setHrRole(roleData);

      // If approved member, load modules and attempts
      if (roleData?.role === "broker_member" && roleData?.is_active) {
        const { data: modulesData } = await supabase
          .from("hr_modules")
          .select("*")
          .eq("is_active", true)
          .order("display_order");

        setModules((modulesData || []).map(m => ({
          ...m,
          key_points: Array.isArray(m.key_points) ? (m.key_points as string[]) : []
        })));

        const { data: attemptsData } = await supabase
          .from("hr_quiz_attempts")
          .select("module_id, score, passed, attempted_at")
          .eq("user_id", user.id)
          .order("attempted_at", { ascending: false });

        setQuizAttempts(attemptsData || []);

        // Load existing certificate
        const { data: certData } = await supabase
          .from("hr_certificates")
          .select("id, certificate_number, full_name, company_score, real_estate_score, combined_score, issued_at, verification_token")
          .eq("user_id", user.id)
          .eq("is_revoked", false)
          .maybeSingle();

        if (certData) {
          setCertificate(certData as Certificate);
        }

        // Load pass thresholds
        const { data: settingsData } = await supabase
          .from("hr_settings")
          .select("setting_key, setting_value");

        if (settingsData) {
          const thresholds = { ...passThresholds };
          settingsData.forEach((s) => {
            if (s.setting_key === "pass_threshold_company") {
              thresholds.company = (s.setting_value as any).percentage || 70;
            } else if (s.setting_key === "pass_threshold_real_estate") {
              thresholds.realEstate = (s.setting_value as any).percentage || 70;
            } else if (s.setting_key === "pass_threshold_combined") {
              thresholds.combined = (s.setting_value as any).percentage || 70;
            }
          });
          setPassThresholds(thresholds);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-gold/20 text-gold border border-gold/40"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-600 border border-green-500/40"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-600 border border-red-500/40"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  const getBestAttempt = (moduleId: string) => {
    const attempts = quizAttempts.filter((a) => a.module_id === moduleId);
    if (attempts.length === 0) return null;
    return attempts.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  const calculateTrackProgress = (track: "company_knowledge" | "real_estate_basics") => {
    const trackModules = modules.filter((m) => m.track === track);
    if (trackModules.length === 0) return { completed: 0, total: 0, avgScore: 0 };

    let passedCount = 0;
    let totalScore = 0;
    let attemptedCount = 0;

    trackModules.forEach((m) => {
      const best = getBestAttempt(m.id);
      if (best) {
        attemptedCount++;
        totalScore += best.score;
        if (best.passed) passedCount++;
      }
    });

    return {
      completed: passedCount,
      total: trackModules.length,
      avgScore: attemptedCount > 0 ? totalScore / attemptedCount : 0,
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BrandedLoader text="Loading..." className="min-h-screen" />
      </div>
    );
  }

  // No application yet - 3-Layer System
  if (!application) {
    return (
      <div className="min-h-screen bg-black py-16">
        <div className="jj-layer-2">
          <div className="max-w-lg mx-auto">
            <div className="jj-layer-active rounded-2xl p-6">
              <div className="jj-card-inner border-2 border-gold rounded-xl p-8 text-center">
                <h2 className="text-2xl font-bold text-black mb-4">No Application Found</h2>
                <p className="text-zinc-600 mb-6">You haven't submitted an application yet.</p>
                <Button asChild variant="primary">
                  <Link to="/join">Apply Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending or Rejected status - 3-Layer System
  if (application.status === "pending" || application.status === "rejected") {
    return (
      <div className="min-h-screen bg-black py-16">
        <div className="jj-layer-2">
          <div className="max-w-lg mx-auto">
            <div className="jj-layer-active rounded-2xl p-6">
              <div className="jj-card-inner border-2 border-gold rounded-xl p-8 text-center">
                {application.status === "pending" ? (
                  <Clock className="h-16 w-16 text-gold mx-auto mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                )}
                <h2 className="text-2xl font-bold text-black mb-4">
                  {application.status === "pending" ? "Application Under Review" : "Application Not Approved"}
                </h2>
                <div className="mt-2 mb-6">{getStatusBadge(application.status)}</div>
                {application.status === "pending" ? (
                  <>
                    <p className="text-zinc-600 mb-4">
                      Thank you for your application, {application.full_name}. Our team is reviewing your submission and will get back to you soon.
                    </p>
                    <p className="text-sm text-zinc-500">
                      Submitted on {new Date(application.created_at).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-zinc-600 mb-4">
                      Unfortunately, your application was not approved at this time.
                    </p>
                    {application.rejection_reason && (
                      <div className="jj-card-inner border border-gold/20 p-4 rounded-lg text-left mb-4">
                        <p className="text-sm font-medium text-black mb-1">Reason:</p>
                        <p className="text-sm text-zinc-600">{application.rejection_reason}</p>
                      </div>
                    )}
                    <p className="text-sm text-zinc-500">
                      If you have questions, please contact us at{" "}
                      <a href="mailto:CONTACT@JBJ.AE" className="text-gold hover:underline">
                        CONTACT@JBJ.AE
                      </a>
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Approved - show training dashboard - 3-Layer System
  const companyProgress = calculateTrackProgress("company_knowledge");
  const realEstateProgress = calculateTrackProgress("real_estate_basics");
  const combinedAvg = (companyProgress.avgScore + realEstateProgress.avgScore) / 2;

  const companyModules = modules.filter((m) => m.track === "company_knowledge");
  const realEstateModules = modules.filter((m) => m.track === "real_estate_basics");

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="jj-layer-2">
        {/* Header */}
        <div className="jj-layer-active rounded-2xl p-6 md:p-8 mb-6">
          <h1 className="text-3xl font-bold text-black mb-2">
            Welcome, <span className="text-gold">{application.full_name}!</span>
          </h1>
          <p className="text-zinc-600">
            Complete your training modules and quizzes to become a certified broker partner.
          </p>
          <div className="mt-2">{getStatusBadge(application.status)}</div>
        </div>

        {/* Score Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="jj-card-inner border-2 border-gold rounded-xl p-6 transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-gold"
                style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}>
                <Building2 className="h-5 w-5 text-black" />
              </div>
              <span className="text-sm font-medium text-zinc-600">Company Knowledge</span>
            </div>
            <div className="text-2xl font-bold text-gold">
              {companyProgress.avgScore.toFixed(0)}%
            </div>
            <Progress value={companyProgress.avgScore} className="mt-2 h-2" />
            <p className="text-xs text-zinc-500 mt-2">
              {companyProgress.completed}/{companyProgress.total} modules passed (min {passThresholds.company}%)
            </p>
          </div>

          <div className="jj-card-inner border-2 border-gold rounded-xl p-6 transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-gold"
                style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}>
                <Briefcase className="h-5 w-5 text-black" />
              </div>
              <span className="text-sm font-medium text-zinc-600">Real Estate Basics</span>
            </div>
            <div className="text-2xl font-bold text-gold">
              {realEstateProgress.avgScore.toFixed(0)}%
            </div>
            <Progress value={realEstateProgress.avgScore} className="mt-2 h-2" />
            <p className="text-xs text-zinc-500 mt-2">
              {realEstateProgress.completed}/{realEstateProgress.total} modules passed (min {passThresholds.realEstate}%)
            </p>
          </div>

          <div className="jj-card-inner border-2 border-gold rounded-xl p-6 transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-gold"
                style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)' }}>
                <Trophy className="h-5 w-5 text-black" />
              </div>
              <span className="text-sm font-medium text-zinc-600">Combined Score</span>
            </div>
            <div className="text-2xl font-bold text-gold">
              {combinedAvg.toFixed(0)}%
            </div>
            <Progress value={combinedAvg} className="mt-2 h-2" />
            <p className="text-xs text-zinc-500 mt-2">
              Target: {passThresholds.combined}% to complete training
            </p>
          </div>
        </div>

        {/* Training Modules */}
        <div className="jj-layer-active rounded-2xl p-6 md:p-8">
          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-champagne border border-gold/30">
              <TabsTrigger value="company" className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-gold">
                <Building2 className="h-4 w-4" />
                Company Knowledge
              </TabsTrigger>
              <TabsTrigger value="realestate" className="flex items-center gap-2 data-[state=active]:bg-black data-[state=active]:text-gold">
                <Briefcase className="h-4 w-4" />
                Real Estate
              </TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="space-y-4">
              {companyModules.length === 0 ? (
                <div className="jj-card-inner border-2 border-gold rounded-xl p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gold mx-auto mb-4" />
                  <p className="text-zinc-600">No modules available yet. Check back soon!</p>
                </div>
              ) : (
                companyModules.map((module) => {
                  const bestAttempt = getBestAttempt(module.id);
                  return (
                    <div key={module.id} className="jj-card-inner border-2 border-gold rounded-xl p-4 transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            bestAttempt?.passed ? 'bg-green-500/20 text-green-600' : 'bg-gold/20 text-gold'
                          }`}>
                            {bestAttempt?.passed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <BookOpen className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-black">{module.title}</h3>
                            {bestAttempt ? (
                              <p className="text-sm text-zinc-600">
                                Best score: {bestAttempt.score.toFixed(0)}%
                                {bestAttempt.passed ? " ✓ Passed" : " (needs " + passThresholds.company + "% to pass)"}
                              </p>
                            ) : (
                              <p className="text-sm text-zinc-500">Not started</p>
                            )}
                          </div>
                        </div>
                        <Button asChild variant="ghost" className="text-gold hover:text-gold/80">
                          <Link to={`/onboarding/module/${module.id}`}>
                            {bestAttempt ? "Review" : "Start"}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="realestate" className="space-y-4">
              {realEstateModules.length === 0 ? (
                <div className="jj-card-inner border-2 border-gold rounded-xl p-12 text-center">
                  <BookOpen className="h-12 w-12 text-gold mx-auto mb-4" />
                  <p className="text-zinc-600">No modules available yet. Check back soon!</p>
                </div>
              ) : (
                realEstateModules.map((module) => {
                  const bestAttempt = getBestAttempt(module.id);
                  return (
                    <div key={module.id} className="jj-card-inner border-2 border-gold rounded-xl p-4 transition-all hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            bestAttempt?.passed ? 'bg-green-500/20 text-green-600' : 'bg-gold/20 text-gold'
                          }`}>
                            {bestAttempt?.passed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <BookOpen className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-black">{module.title}</h3>
                            {bestAttempt ? (
                              <p className="text-sm text-zinc-600">
                                Best score: {bestAttempt.score.toFixed(0)}%
                                {bestAttempt.passed ? " ✓ Passed" : " (needs " + passThresholds.realEstate + "% to pass)"}
                              </p>
                            ) : (
                              <p className="text-sm text-zinc-500">Not started</p>
                            )}
                          </div>
                        </div>
                        <Button asChild variant="ghost" className="text-gold hover:text-gold/80">
                          <Link to={`/onboarding/module/${module.id}`}>
                            {bestAttempt ? "Review" : "Start"}
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Certificate Section */}
        {certificate && (
          <div className="jj-layer-active rounded-2xl p-6 md:p-8 mt-6">
            <div className="jj-card-inner border-2 border-gold rounded-xl p-8 text-center">
              <GraduationCap className="h-16 w-16 text-gold mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-black mb-2">Congratulations!</h3>
              <p className="text-zinc-600 mb-6">You have completed your training and earned your certificate.</p>
              <CertificateGenerator isEligible={true} existingCertificate={certificate} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
