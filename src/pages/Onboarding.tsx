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
  Loader2, Clock, CheckCircle, XCircle, BookOpen, GraduationCap, 
  Trophy, Lock, ChevronRight, Building2, Briefcase
} from "lucide-react";
import { toast } from "sonner";

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

export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [hrRole, setHrRole] = useState<HRRole | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
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
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending Review</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-green-500 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-red-500 text-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  // No application yet
  if (!application) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">No Application Found</CardTitle>
              <CardDescription>
                You haven't submitted an application yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-gold hover:bg-gold/90 text-black">
                <Link to="/join">Apply Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pending or Rejected status
  if (application.status === "pending" || application.status === "rejected") {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="bg-card border-border">
            <CardHeader className="text-center">
              {application.status === "pending" ? (
                <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              )}
              <CardTitle className="text-2xl text-foreground">
                {application.status === "pending" ? "Application Under Review" : "Application Not Approved"}
              </CardTitle>
              <div className="mt-2">{getStatusBadge(application.status)}</div>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {application.status === "pending" ? (
                <>
                  <p className="text-muted-foreground">
                    Thank you for your application, {application.full_name}. Our team is reviewing your submission and will get back to you soon.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Submitted on {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Unfortunately, your application was not approved at this time.
                  </p>
                  {application.rejection_reason && (
                    <div className="bg-muted p-4 rounded-lg text-left">
                      <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
                      <p className="text-sm text-muted-foreground">{application.rejection_reason}</p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    If you have questions, please contact us at{" "}
                    <a href="mailto:contact@jjglobalcapital.com" className="text-gold hover:underline">
                      contact@jjglobalcapital.com
                    </a>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Approved - show training dashboard
  const companyProgress = calculateTrackProgress("company_knowledge");
  const realEstateProgress = calculateTrackProgress("real_estate_basics");
  const combinedAvg = (companyProgress.avgScore + realEstateProgress.avgScore) / 2;

  const companyModules = modules.filter((m) => m.track === "company_knowledge");
  const realEstateModules = modules.filter((m) => m.track === "real_estate_basics");

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome, {application.full_name}!
          </h1>
          <p className="text-muted-foreground">
            Complete your training modules and quizzes to become a certified broker partner.
          </p>
          <div className="mt-2">{getStatusBadge(application.status)}</div>
        </div>

        {/* Score Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Knowledge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {companyProgress.avgScore.toFixed(0)}%
              </div>
              <Progress 
                value={companyProgress.avgScore} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {companyProgress.completed}/{companyProgress.total} modules passed (min {passThresholds.company}%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Real Estate Basics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {realEstateProgress.avgScore.toFixed(0)}%
              </div>
              <Progress 
                value={realEstateProgress.avgScore} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {realEstateProgress.completed}/{realEstateProgress.total} modules passed (min {passThresholds.realEstate}%)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Combined Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {combinedAvg.toFixed(0)}%
              </div>
              <Progress 
                value={combinedAvg} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Target: {passThresholds.combined}% to complete training
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Training Modules */}
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Company Knowledge
            </TabsTrigger>
            <TabsTrigger value="realestate" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Real Estate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-4">
            {companyModules.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No modules available yet. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              companyModules.map((module) => {
                const bestAttempt = getBestAttempt(module.id);
                return (
                  <Card key={module.id} className="bg-card border-border hover:border-gold/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            bestAttempt?.passed ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                          }`}>
                            {bestAttempt?.passed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <BookOpen className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{module.title}</h3>
                            {bestAttempt ? (
                              <p className="text-sm text-muted-foreground">
                                Best score: {bestAttempt.score.toFixed(0)}%
                                {bestAttempt.passed ? " ✓ Passed" : " (needs " + passThresholds.company + "% to pass)"}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not started</p>
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
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="realestate" className="space-y-4">
            {realEstateModules.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No modules available yet. Check back soon!</p>
                </CardContent>
              </Card>
            ) : (
              realEstateModules.map((module) => {
                const bestAttempt = getBestAttempt(module.id);
                return (
                  <Card key={module.id} className="bg-card border-border hover:border-gold/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            bestAttempt?.passed ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
                          }`}>
                            {bestAttempt?.passed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <BookOpen className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">{module.title}</h3>
                            {bestAttempt ? (
                              <p className="text-sm text-muted-foreground">
                                Best score: {bestAttempt.score.toFixed(0)}%
                                {bestAttempt.passed ? " ✓ Passed" : " (needs " + passThresholds.realEstate + "% to pass)"}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not started</p>
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
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>

        {/* Coming Soon Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Coming Soon</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-muted/50 border-border opacity-60">
              <CardContent className="py-6 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium text-muted-foreground">Certificates</h3>
                <p className="text-xs text-muted-foreground mt-1">Earn completion certificates</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border opacity-60">
              <CardContent className="py-6 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium text-muted-foreground">Broker Perks</h3>
                <p className="text-xs text-muted-foreground mt-1">Exclusive partner benefits</p>
              </CardContent>
            </Card>
            <Card className="bg-muted/50 border-border opacity-60">
              <CardContent className="py-6 text-center">
                <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium text-muted-foreground">Lead Allocation</h3>
                <p className="text-xs text-muted-foreground mt-1">Receive qualified leads</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
