import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, Users, Clock, CheckCircle, XCircle, FileText, 
  Download, Eye, Settings, BookOpen, Plus, Trash2, Edit
} from "lucide-react";
import { toast } from "sonner";

interface Application {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  full_name: string;
  email: string;
  phone_e164: string;
  nationality: string;
  preferred_language: string;
  current_location_country: string;
  current_location_city: string;
  cv_url?: string;
  created_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

interface Module {
  id: string;
  track: "company_knowledge" | "real_estate_basics";
  title: string;
  content: string;
  video_url?: string;
  key_points: string[];
  display_order: number;
  is_active: boolean;
}

interface QuizQuestion {
  id: string;
  module_id: string;
  question_type: "mcq" | "true_false" | "short_answer";
  question: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  display_order: number;
  is_active: boolean;
}

interface PassThresholds {
  company: number;
  realEstate: number;
  combined: number;
}

export default function AdminOnboarding() {
  const { user, loading: authLoading, isOwner } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [passThresholds, setPassThresholds] = useState<PassThresholds>({
    company: 70,
    realEstate: 70,
    combined: 70,
  });
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // Module/Question edit states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [moduleForm, setModuleForm] = useState({
    track: "company_knowledge" as "company_knowledge" | "real_estate_basics",
    title: "",
    content: "",
    video_url: "",
    key_points: "",
    display_order: 0,
  });

  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [selectedModuleForQuestion, setSelectedModuleForQuestion] = useState<string>("");
  const [questionForm, setQuestionForm] = useState({
    question_type: "mcq" as "mcq" | "true_false" | "short_answer",
    question: "",
    options: "",
    correct_answer: "",
    explanation: "",
    display_order: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/admin/onboarding");
      return;
    }
    if (!authLoading && user && !isOwner) {
      toast.error("Access denied. Owner only.");
      navigate("/");
      return;
    }
    if (user && isOwner) {
      loadData();
    }
  }, [user, authLoading, isOwner]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load applications
      const { data: appsData } = await supabase
        .from("hr_applications")
        .select("*")
        .order("created_at", { ascending: false });

      setApplications(appsData || []);

      // Load modules
      const { data: modulesData } = await supabase
        .from("hr_modules")
        .select("*")
        .order("display_order");

      setModules((modulesData || []).map(m => ({
        ...m,
        key_points: Array.isArray(m.key_points) ? (m.key_points as string[]) : []
      })));

      // Load questions
      const { data: questionsData } = await supabase
        .from("hr_quiz_questions")
        .select("*")
        .order("display_order");

      setQuestions((questionsData || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? (q.options as string[]) : []
      })));

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
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (application: Application) => {
    if (!user) return;
    setProcessing(true);

    try {
      // Update application status
      const { error: appError } = await supabase
        .from("hr_applications")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", application.id);

      if (appError) throw appError;

      // Update HR role to broker_member
      const { error: roleError } = await supabase
        .from("hr_user_roles")
        .upsert({
          user_id: application.user_id,
          role: "broker_member",
          is_active: true,
        }, { onConflict: "user_id" });

      if (roleError) throw roleError;

      // Log audit
      await supabase.from("hr_audit_logs").insert({
        admin_user_id: user.id,
        action: "approve_application",
        resource_type: "hr_application",
        resource_id: application.id,
        details: { applicant_email: application.email },
      });

      toast.success(`${application.full_name} has been approved!`);
      setShowApplicationDialog(false);
      loadData();
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Failed to approve application");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedApplication) return;
    setProcessing(true);

    try {
      const { error } = await supabase
        .from("hr_applications")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason || undefined,
        })
        .eq("id", selectedApplication.id);

      if (error) throw error;

      // Log audit
      await supabase.from("hr_audit_logs").insert({
        admin_user_id: user.id,
        action: "reject_application",
        resource_type: "hr_application",
        resource_id: selectedApplication.id,
        details: { 
          applicant_email: selectedApplication.email,
          reason: rejectionReason 
        },
      });

      toast.success("Application rejected");
      setShowRejectDialog(false);
      setShowApplicationDialog(false);
      setRejectionReason("");
      loadData();
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Failed to reject application");
    } finally {
      setProcessing(false);
    }
  };

  const downloadCV = async (cvUrl: string, applicantName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("hr-documents")
        .download(cvUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV-${applicantName.replace(/\s+/g, "-")}.${cvUrl.split(".").pop()}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading CV:", error);
      toast.error("Failed to download CV");
    }
  };

  const handleSaveModule = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      const moduleData = {
        track: moduleForm.track,
        title: moduleForm.title,
        content: moduleForm.content,
        video_url: moduleForm.video_url || null,
        key_points: moduleForm.key_points.split("\n").filter(Boolean),
        display_order: moduleForm.display_order,
        is_active: true,
      };

      if (editingModule) {
        const { error } = await supabase
          .from("hr_modules")
          .update(moduleData)
          .eq("id", editingModule.id);
        if (error) throw error;

        await supabase.from("hr_audit_logs").insert({
          admin_user_id: user.id,
          action: "update_module",
          resource_type: "hr_module",
          resource_id: editingModule.id,
          details: { title: moduleForm.title },
        });

        toast.success("Module updated");
      } else {
        const { error } = await supabase.from("hr_modules").insert(moduleData);
        if (error) throw error;

        await supabase.from("hr_audit_logs").insert({
          admin_user_id: user.id,
          action: "create_module",
          resource_type: "hr_module",
          details: { title: moduleForm.title },
        });

        toast.success("Module created");
      }

      setShowModuleDialog(false);
      resetModuleForm();
      loadData();
    } catch (error) {
      console.error("Error saving module:", error);
      toast.error("Failed to save module");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!user || !confirm("Are you sure? This will delete all associated questions.")) return;

    try {
      const { error } = await supabase.from("hr_modules").delete().eq("id", moduleId);
      if (error) throw error;

      await supabase.from("hr_audit_logs").insert({
        admin_user_id: user.id,
        action: "delete_module",
        resource_type: "hr_module",
        resource_id: moduleId,
      });

      toast.success("Module deleted");
      loadData();
    } catch (error) {
      console.error("Error deleting module:", error);
      toast.error("Failed to delete module");
    }
  };

  const handleSaveQuestion = async () => {
    if (!user || !selectedModuleForQuestion) return;
    setProcessing(true);

    try {
      const questionData = {
        module_id: selectedModuleForQuestion,
        question_type: questionForm.question_type,
        question: questionForm.question,
        options: questionForm.question_type === "mcq" 
          ? questionForm.options.split("\n").filter(Boolean)
          : [],
        correct_answer: questionForm.correct_answer,
        explanation: questionForm.explanation || null,
        display_order: questionForm.display_order,
        is_active: true,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from("hr_quiz_questions")
          .update(questionData)
          .eq("id", editingQuestion.id);
        if (error) throw error;
        toast.success("Question updated");
      } else {
        const { error } = await supabase.from("hr_quiz_questions").insert(questionData);
        if (error) throw error;
        toast.success("Question created");
      }

      setShowQuestionDialog(false);
      resetQuestionForm();
      loadData();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const { error } = await supabase.from("hr_quiz_questions").delete().eq("id", questionId);
      if (error) throw error;
      toast.success("Question deleted");
      loadData();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const handleSaveThresholds = async () => {
    if (!user) return;
    setProcessing(true);

    try {
      await supabase.from("hr_settings").upsert([
        { setting_key: "pass_threshold_company", setting_value: { percentage: passThresholds.company }, updated_by: user.id },
        { setting_key: "pass_threshold_real_estate", setting_value: { percentage: passThresholds.realEstate }, updated_by: user.id },
        { setting_key: "pass_threshold_combined", setting_value: { percentage: passThresholds.combined }, updated_by: user.id },
      ], { onConflict: "setting_key" });

      toast.success("Thresholds saved");
    } catch (error) {
      console.error("Error saving thresholds:", error);
      toast.error("Failed to save thresholds");
    } finally {
      setProcessing(false);
    }
  };

  const resetModuleForm = () => {
    setEditingModule(null);
    setModuleForm({
      track: "company_knowledge",
      title: "",
      content: "",
      video_url: "",
      key_points: "",
      display_order: modules.length,
    });
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setQuestionForm({
      question_type: "mcq",
      question: "",
      options: "",
      correct_answer: "",
      explanation: "",
      display_order: 0,
    });
  };

  const openModuleEdit = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      track: module.track,
      title: module.title,
      content: module.content,
      video_url: module.video_url || "",
      key_points: module.key_points.join("\n"),
      display_order: module.display_order,
    });
    setShowModuleDialog(true);
  };

  const openQuestionEdit = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setSelectedModuleForQuestion(question.module_id);
    setQuestionForm({
      question_type: question.question_type,
      question: question.question,
      options: question.options.join("\n"),
      correct_answer: question.correct_answer,
      explanation: question.explanation || "",
      display_order: question.display_order,
    });
    setShowQuestionDialog(true);
  };

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = 
      app.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="border-green-500 text-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="border-red-500 text-red-500"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return null;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">HR Onboarding Admin</h1>
          <p className="text-muted-foreground">Manage broker applications, training modules, and quizzes</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{applications.length}</p>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <BookOpen className="h-8 w-8 text-[#1A1A1A]" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{modules.length}</p>
                  <p className="text-sm text-muted-foreground">Training Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs bg-background"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-card border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{app.full_name}</p>
                            <p className="text-sm text-muted-foreground">{app.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {app.current_location_city}, {app.current_location_country}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{app.nationality}</TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(app.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedApplication(app);
                                setShowApplicationDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {app.cv_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadCV(app.cv_url!, app.full_name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  resetModuleForm();
                  setShowModuleDialog(true);
                }}
                className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>

            <div className="grid gap-4">
              {modules.map((module) => (
                <Card key={module.id} className="bg-card border-border">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          {module.track === "company_knowledge" ? "Company" : "Real Estate"}
                        </Badge>
                        <div>
                          <h3 className="font-medium text-foreground">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {questions.filter((q) => q.module_id === module.id).length} questions
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openModuleEdit(module)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteModule(module.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {modules.length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No modules yet. Create your first training module!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <div className="flex gap-4 justify-between items-center flex-wrap">
              <Select
                value={selectedModuleForQuestion}
                onValueChange={setSelectedModuleForQuestion}
              >
                <SelectTrigger className="w-64 bg-background">
                  <SelectValue placeholder="Select module to manage questions" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  if (!selectedModuleForQuestion) {
                    toast.error("Please select a module first");
                    return;
                  }
                  resetQuestionForm();
                  setShowQuestionDialog(true);
                }}
                className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
                disabled={!selectedModuleForQuestion}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="grid gap-4">
              {questions
                .filter((q) => !selectedModuleForQuestion || q.module_id === selectedModuleForQuestion)
                .map((question, index) => (
                  <Card key={question.id} className="bg-card border-border">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {question.question_type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {modules.find((m) => m.id === question.module_id)?.title}
                            </span>
                          </div>
                          <p className="text-foreground">{question.question}</p>
                          <p className="text-sm text-green-600 mt-1">Answer: {question.correct_answer}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openQuestionEdit(question)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {questions.filter((q) => !selectedModuleForQuestion || q.module_id === selectedModuleForQuestion).length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {selectedModuleForQuestion 
                        ? "No questions for this module yet." 
                        : "Select a module to view its questions."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Pass Thresholds
                </CardTitle>
                <CardDescription>
                  Configure minimum passing scores for each track
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyThreshold">Company Knowledge (%)</Label>
                    <Input
                      id="companyThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={passThresholds.company}
                      onChange={(e) => setPassThresholds({ ...passThresholds, company: parseInt(e.target.value) || 0 })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="realEstateThreshold">Real Estate Basics (%)</Label>
                    <Input
                      id="realEstateThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={passThresholds.realEstate}
                      onChange={(e) => setPassThresholds({ ...passThresholds, realEstate: parseInt(e.target.value) || 0 })}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="combinedThreshold">Combined Score (%)</Label>
                    <Input
                      id="combinedThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={passThresholds.combined}
                      onChange={(e) => setPassThresholds({ ...passThresholds, combined: parseInt(e.target.value) || 0 })}
                      className="bg-background"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSaveThresholds} 
                  disabled={processing}
                  className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
                >
                  {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Save Thresholds
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Application Detail Dialog */}
        <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="text-foreground font-medium">{selectedApplication.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="text-foreground">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="text-foreground">{selectedApplication.phone_e164}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nationality</Label>
                    <p className="text-foreground">{selectedApplication.nationality}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="text-foreground">
                      {selectedApplication.current_location_city}, {selectedApplication.current_location_country}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Language</Label>
                    <p className="text-foreground">{selectedApplication.preferred_language.toUpperCase()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Applied</Label>
                    <p className="text-foreground">
                      {new Date(selectedApplication.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedApplication.cv_url && (
                  <Button
                    variant="outline"
                    onClick={() => downloadCV(selectedApplication.cv_url!, selectedApplication.full_name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CV
                  </Button>
                )}

                {selectedApplication.status === "pending" && (
                  <div className="flex gap-4 pt-4 border-t">
                    <Button
                      onClick={() => handleApprove(selectedApplication)}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                Optionally provide a reason for rejection that will be shown to the applicant.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Module Dialog */}
        <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingModule ? "Edit Module" : "Create Module"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Track</Label>
                  <Select
                    value={moduleForm.track}
                    onValueChange={(v) => setModuleForm({ ...moduleForm, track: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_knowledge">Company Knowledge</SelectItem>
                      <SelectItem value="real_estate_basics">Real Estate Basics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={moduleForm.display_order}
                    onChange={(e) => setModuleForm({ ...moduleForm, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="Module title"
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={moduleForm.content}
                  onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                  placeholder="Module content..."
                  rows={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Video URL (optional)</Label>
                <Input
                  value={moduleForm.video_url}
                  onChange={(e) => setModuleForm({ ...moduleForm, video_url: e.target.value })}
                  placeholder="YouTube or Vimeo URL"
                />
              </div>
              <div className="space-y-2">
                <Label>Key Points (one per line)</Label>
                <Textarea
                  value={moduleForm.key_points}
                  onChange={(e) => setModuleForm({ ...moduleForm, key_points: e.target.value })}
                  placeholder="Point 1&#10;Point 2&#10;Point 3"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowModuleDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveModule} disabled={processing} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Module
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Question Dialog */}
        <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Edit Question" : "Create Question"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={questionForm.question_type}
                    onValueChange={(v) => setQuestionForm({ ...questionForm, question_type: v as any })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mcq">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={questionForm.display_order}
                    onChange={(e) => setQuestionForm({ ...questionForm, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  placeholder="Enter your question..."
                  rows={3}
                />
              </div>
              {questionForm.question_type === "mcq" && (
                <div className="space-y-2">
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={questionForm.options}
                    onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })}
                    placeholder="Option A&#10;Option B&#10;Option C&#10;Option D"
                    rows={4}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Correct Answer</Label>
                <Input
                  value={questionForm.correct_answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                  placeholder={questionForm.question_type === "true_false" ? "true or false" : "Exact correct answer"}
                />
              </div>
              <div className="space-y-2">
                <Label>Explanation (optional)</Label>
                <Textarea
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Why this is the correct answer..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuestionDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveQuestion} disabled={processing} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]">
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Question
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
