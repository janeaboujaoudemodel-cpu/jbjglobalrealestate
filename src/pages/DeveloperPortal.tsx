
import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar, Upload, Building2, PartyPopper, FileText, Loader2,
  CheckCircle, X, Plus, FolderOpen, ExternalLink, AlertCircle,
  ClipboardList, Send, Eye, Info, UserCheck, Briefcase, MessageSquare,
  FileSignature, ListTodo, Crown, SkipForward, Star, Users,
  Rocket, Search, EyeOff, Settings, MapPin, Lock, ShieldCheck, ShieldOff, ToggleLeft, ToggleRight,
} from "lucide-react";
import SalesRepRegistration from "@/components/developer-portal/SalesRepRegistration";
import { DeveloperSelectDropdown } from "@/components/developer-portal/DeveloperSelectDropdown";
import BriefingRequestForm from "@/components/developer-portal/BriefingRequestForm";
import DeveloperMessageForm from "@/components/developer-portal/DeveloperMessageForm";
import ExistingProjectsReview from "@/components/developer-portal/ExistingProjectsReview";
import { ProjectDuplicateInspector } from "@/components/listing-admin/ProjectDuplicateInspector";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { validateFiles } from "@/utils/developerFileValidation";
import { sanitizeSubmissionData, detectProtectedFieldAttempts } from "@/config/developerFieldProtection";
import { useDeveloperActivityLog } from "@/hooks/useDeveloperActivityLog";
import { NationalitySelect } from "@/components/developer-portal/NationalitySelect";
import { PhoneInputWithCountry } from "@/components/ui/phone-input-with-country";
import { LanguageMultiSelect } from "@/components/ui/language-multi-select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

interface ProjectSession {
  project_name: string;
  project_description: string;
  location: string;
  launch_date: string;
  files: UploadedFile[];
}

const emptyProject = (): ProjectSession => ({
  project_name: "", project_description: "", location: "", launch_date: "", files: [],
});

const OWNER_ID = '4944592b-93f1-4e05-ab59-4ebe1fee54f1';
const EMERALD_LABEL = "jj-pill-emerald-metallic allow-white text-white border-0";
const EMERALD_LABEL_SM = `${EMERALD_LABEL} text-[10px]`;
const EMERALD_NOTICE = "allow-white jj-pill-emerald-metallic text-white border-0 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.85)]";

const DeveloperPortal = () => {
  const [searchParams] = useSearchParams();
  const { user, isOwner } = useAuth();
  const { isDeveloperMode } = useUserModeContext();
  const queryClient = useQueryClient();
  const { logActivity, logFileValidation } = useDeveloperActivityLog();
  const [sessionUploadedBytes, setSessionUploadedBytes] = useState(0);
  const [sessionFileNames, setSessionFileNames] = useState<string[]>([]);
  const initialTab = searchParams.get("tab") || "projects";
  const [activeTab, setActiveTab] = useState(initialTab);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventFileInputRef = useRef<HTMLInputElement>(null);
  const launchFileInputRef = useRef<HTMLInputElement>(null);

  // Owner mode
  const initialOwnerMode = searchParams.get("mode") === "owner" && isOwner;
  const [ownerSkipMode, setOwnerSkipMode] = useState(initialOwnerMode);

  // Developer info
  const [devName, setDevName] = useState("");
  const [devEmail, setDevEmail] = useState("");

  // Launch interest modal
  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [interestType, setInterestType] = useState("general");
  const [interestNotes, setInterestNotes] = useState("");
  const [interestPhone, setInterestPhone] = useState("");
  const [submittingInterest, setSubmittingInterest] = useState(false);

  useEffect(() => {
    if (user?.email) setDevEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    if (isOwner && ownerSkipMode) {
      setDevEmail(user?.email || "");
    }
  }, [isOwner, ownerSkipMode, user?.email]);

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || 'Developer';

  // Developer list is now handled by DeveloperSelectDropdown component

  // Check if user has a registered rep profile
  const { data: repProfile, isLoading: loadingRep, refetch: refetchRep } = useQuery({
    queryKey: ["dev-rep-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('developer_representatives')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Auto-fill from rep profile (only when NOT in developer view as owner)
  useEffect(() => {
    if (repProfile && !(isOwner && !ownerSkipMode)) {
      setDevName(repProfile.developer_name || '');
      setDevEmail(repProfile.email || '');
    }
  }, [repProfile, isOwner, ownerSkipMode]);

  // Profile editing - enhanced with all fields
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '', position: '', email: '', phone: '', developer_name: '', nationality: '',
    personal_email: '', personal_phone: '', company_phone: '', languages: [] as string[],
  });

  const handleStartEditProfile = () => {
    if (repProfile) {
      setEditForm({
        full_name: repProfile.full_name || '',
        position: (repProfile as any).position || '',
        email: repProfile.email || '',
        phone: (repProfile as any).phone || '',
        developer_name: repProfile.developer_name || '',
        nationality: (repProfile as any).nationality || '',
        personal_email: (repProfile as any).personal_email || '',
        personal_phone: (repProfile as any).personal_phone || '',
        company_phone: (repProfile as any).company_phone || '',
        languages: (repProfile as any).languages || [],
      });
      setEditingProfile(true);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !repProfile) return;
    if (!editForm.full_name || !editForm.email) {
      toast.error('Name and email are required');
      return;
    }
    setSavingProfile(true);
    try {
      const changedFields: string[] = [];
      const developerChanged = editForm.developer_name !== (repProfile.developer_name || '');
      if (editForm.full_name !== repProfile.full_name) changedFields.push('full_name');
      if (editForm.email !== repProfile.email) changedFields.push('email');
      if (editForm.phone !== ((repProfile as any).phone || '')) changedFields.push('phone');
      if (editForm.position !== ((repProfile as any).position || '')) changedFields.push('position');
      if (editForm.nationality !== ((repProfile as any).nationality || '')) changedFields.push('nationality');
      if (editForm.personal_email !== ((repProfile as any).personal_email || '')) changedFields.push('personal_email');
      if (editForm.personal_phone !== ((repProfile as any).personal_phone || '')) changedFields.push('personal_phone');
      if (editForm.company_phone !== ((repProfile as any).company_phone || '')) changedFields.push('company_phone');
      if (JSON.stringify(editForm.languages) !== JSON.stringify((repProfile as any).languages || [])) changedFields.push('languages');
      if (developerChanged) changedFields.push('developer_name');

      const updatePayload: any = {
        full_name: editForm.full_name,
        position: editForm.position || null,
        email: editForm.email,
        phone: editForm.phone || null,
        nationality: editForm.nationality || null,
        personal_email: editForm.personal_email || null,
        personal_phone: editForm.personal_phone || null,
        company_phone: editForm.company_phone || null,
        languages: editForm.languages.length > 0 ? editForm.languages : null,
      };

      // If developer changed, update name and reset to pending_review
      if (developerChanged) {
        updatePayload.developer_name = editForm.developer_name;
        updatePayload.status = 'pending_review';
      }

      const { error } = await supabase
        .from('developer_representatives')
        .update(updatePayload)
        .eq('id', repProfile.id);
      if (error) throw error;

      if (changedFields.length > 0) {
        try {
          await supabase.from('admin_tasks').insert({
            user_id: OWNER_ID,
            title: `Profile Update: ${editForm.full_name}`,
            description: `Rep "${editForm.full_name}" (${editForm.developer_name}) updated their profile. Changed fields: ${changedFields.join(', ')}.`,
            category: 'rep_profile_update',
            priority: 'medium',
            status: 'pending',
          } as any);
        } catch {}
      }

      if (developerChanged) {
        toast.success('Developer changed — your profile is now pending re-approval.');
      } else {
        toast.success('Profile updated successfully');
      }
      setEditingProfile(false);
      refetchRep();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Session-based multi-project
  const [currentProject, setCurrentProject] = useState<ProjectSession>(emptyProject());
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [mainDragOver, setMainDragOver] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [sessionProjects, setSessionProjects] = useState<string[]>([]);
  const [duplicateBlocking, setDuplicateBlocking] = useState(false);
  const [sessionStartTime] = useState(() => new Date().toISOString());
  const [endSessionOpen, setEndSessionOpen] = useState(false);
  const [endingSession, setEndingSession] = useState(false);

  // Event form
  const [eventForm, setEventForm] = useState({
    event_title: "", event_date: "", event_location: "", event_description: "",
  });
  const [eventFiles, setEventFiles] = useState<UploadedFile[]>([]);
  const [uploadingEventFiles, setUploadingEventFiles] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // Launch form
  const [launchForm, setLaunchForm] = useState({
    launch_title: "", launch_date: "", launch_location: "", launch_description: "",
  });
  const [launchFiles, setLaunchFiles] = useState<UploadedFile[]>([]);
  const [uploadingLaunchFiles, setUploadingLaunchFiles] = useState(false);
  const [launchSubmitting, setLaunchSubmitting] = useState(false);

  // Owner manage tab
  const [manageSearch, setManageSearch] = useState("");
  const [manageDateFilter, setManageDateFilter] = useState("");
  const [interestExpanded, setInterestExpanded] = useState(false);
  const [devMgmtExpanded, setDevMgmtExpanded] = useState(false);

  // Fetch developer's submitted projects
  const { data: myProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["dev-portal-projects", devEmail],
    queryFn: async () => {
      if (!devEmail) return [];
      const { data, error } = await supabase
        .from("developer_launch_uploads")
        .select("id, project_name, status, extraction_status, auto_approved, created_at")
        .eq("developer_email", devEmail)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!devEmail,
  });

  // Fetch user's briefing requests
  const { data: myBriefings } = useQuery({
    queryKey: ["dev-briefings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('briefing_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user's tasks
  const { data: myTasks } = useQuery({
    queryKey: ["dev-portal-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('admin_tasks')
        .select('id, title, description, status, priority, due_date, created_at, category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch agreements
  const { data: myAgreements } = useQuery({
    queryKey: ["dev-portal-agreements", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data } = await (supabase as any)
        .from('esign_envelopes')
        .select('id, title, status, created_at, updated_at')
        .or(`sender_id.eq.${user.id},signers.cs.[{"email":"${user.email}"}]`)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user?.email,
  });

  // Fetch upcoming events/launches for Register Interest
  const { data: upcomingEvents } = useQuery({
    queryKey: ["upcoming-launches"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('developer_submissions')
        .select('id, developer_name, event_title, event_date, event_location, event_description, submission_subtype, event_files, created_at')
        .in('submission_type', ['event_invitation', 'launch_announcement'])
        .order('event_date', { ascending: true })
        .limit(50);
      return data || [];
    },
  });

  // Fetch user's launch interests
  const { data: myInterests } = useQuery({
    queryKey: ["my-launch-interests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await (supabase as any)
        .from('launch_interest_registrations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Owner: fetch ALL launch interests
  const { data: allInterests } = useQuery({
    queryKey: ["all-launch-interests"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('launch_interest_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: isOwner,
  });

  // Owner: fetch ALL submissions for Manage tab
  const { data: allSubmissions, refetch: refetchSubmissions } = useQuery({
    queryKey: ["all-dev-submissions"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('developer_submissions')
        .select('*')
        .in('submission_type', ['event_invitation', 'launch_announcement'])
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: isOwner,
  });

  // Owner: fetch ALL developer representatives for management
  const { data: allReps, refetch: refetchAllReps } = useQuery({
    queryKey: ["all-dev-reps"],
    queryFn: async () => {
      const { data } = await supabase
        .from('developer_representatives')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: isOwner,
  });

  // Generic file upload handler with validation
  const handleGenericFileUpload = async (
    files: FileList | null,
    prefix: string,
    setUploading: (v: boolean) => void,
    setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    const { valid, rejected } = validateFiles(
      Array.from(files), sessionFileNames, sessionUploadedBytes
    );

    for (const { file, result } of rejected) {
      toast.error(`${file.name}: ${result.rejectionReason}`);
      logFileValidation(file.name, file.type, file.size, false, result.rejectionReason, result.sanitizedName);
      logActivity({
        activityType: 'file_rejected',
        entityType: 'file',
        entityName: file.name,
        details: { reason: result.rejectionReason, size: file.size },
        riskFlags: result.riskFlags,
        developerName: devName,
        developerEmail: devEmail,
      });
    }

    const uploaded: UploadedFile[] = [];
    for (const { file, result } of valid) {
      try {
        const path = `developer-events/${prefix}/${Date.now()}-${result.sanitizedName}`;
        const { error } = await supabase.storage.from("documents").upload(path, file);
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        uploaded.push({ name: result.sanitizedName, url: urlData.publicUrl, type: file.type });
        logFileValidation(file.name, file.type, file.size, true, null, result.sanitizedName);
        setSessionUploadedBytes(prev => prev + file.size);
        setSessionFileNames(prev => [...prev, result.sanitizedName]);
      } catch { toast.error(`Error uploading file`); }
    }
    setFiles(prev => [...prev, ...uploaded]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFiles(true);

    const { valid, rejected } = validateFiles(
      Array.from(files), sessionFileNames, sessionUploadedBytes
    );

    for (const { file, result } of rejected) {
      toast.error(`${file.name}: ${result.rejectionReason}`);
      logFileValidation(file.name, file.type, file.size, false, result.rejectionReason, result.sanitizedName);
      logActivity({
        activityType: 'file_rejected',
        entityType: 'file',
        entityName: file.name,
        details: { reason: result.rejectionReason, size: file.size, project: currentProject.project_name },
        riskFlags: result.riskFlags,
        developerName: devName,
        developerEmail: devEmail,
      });
    }

    const uploaded: UploadedFile[] = [];
    for (const { file, result } of valid) {
      try {
        const safeName = currentProject.project_name?.replace(/[^a-zA-Z0-9-_]/g, '-') || 'project';
        const path = `developer-uploads/${safeName}/${Date.now()}-${result.sanitizedName}`;
        const { error } = await supabase.storage.from("documents").upload(path, file);
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        uploaded.push({ name: result.sanitizedName, url: urlData.publicUrl, type: file.type });
        logFileValidation(file.name, file.type, file.size, true, null, result.sanitizedName);
        setSessionUploadedBytes(prev => prev + file.size);
        setSessionFileNames(prev => [...prev, result.sanitizedName]);
      } catch { toast.error(`Error uploading file`); }
    }
    setCurrentProject(prev => ({ ...prev, files: [...prev.files, ...uploaded] }));
    setUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setCurrentProject(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));
  };

  const getEffectiveDevInfo = () => {
    const effectiveDevName = devName;
    const effectiveDevEmail = ownerSkipMode ? (user?.email || devEmail) : devEmail;
    return { effectiveDevName, effectiveDevEmail };
  };

  const handleSubmitProject = async () => {
    const { effectiveDevName, effectiveDevEmail } = getEffectiveDevInfo();
    if (!effectiveDevName || !effectiveDevEmail || !currentProject.project_name) {
      toast.error("Please fill in developer name, email, and project name");
      return;
    }
    if (currentProject.files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }
    if (duplicateBlocking) {
      toast.error("A project with this name already exists. Please use the 'Update Existing' flow instead.");
      logActivity({
        activityType: 'duplicate_attempt',
        entityType: 'project',
        entityName: currentProject.project_name,
        details: { blocked: true },
        riskFlags: ['duplicate_blocked'],
        developerName: effectiveDevName,
        developerEmail: effectiveDevEmail,
      });
      return;
    }
    setSubmittingProject(true);
    try {
      const submissionData = sanitizeSubmissionData({
        developer_name: effectiveDevName,
        developer_email: effectiveDevEmail,
        project_name: currentProject.project_name,
        project_description: currentProject.project_description || null,
        location: currentProject.location || null,
        launch_date: currentProject.launch_date || null,
        uploaded_files: currentProject.files,
      });
      const { error } = await supabase.from("developer_launch_uploads").insert(submissionData as any);
      if (error) throw error;
      logActivity({
        activityType: 'upload',
        entityType: 'project',
        entityName: currentProject.project_name,
        details: { fileCount: currentProject.files.length },
        developerName: effectiveDevName,
        developerEmail: effectiveDevEmail,
      });
      try {
        await supabase.from("admin_tasks").insert({
          user_id: OWNER_ID,
          title: `New Launch Upload: ${currentProject.project_name}`,
          description: `Developer ${effectiveDevName} (${effectiveDevEmail}) has uploaded materials for "${currentProject.project_name}". Review and approve the auto-generated listing.`,
          category: 'developer_launch',
          priority: 'high',
          status: 'pending',
        } as any);
      } catch {}
      setSessionProjects(prev => [...prev, currentProject.project_name]);
      toast.success(`"${currentProject.project_name}" submitted successfully!`);
      setCurrentProject(emptyProject());
      queryClient.invalidateQueries({ queryKey: ["dev-portal-projects"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit project");
      logActivity({
        activityType: 'failed_upload',
        entityType: 'project',
        entityName: currentProject.project_name,
        details: { error: err.message },
        riskFlags: ['submission_error'],
        developerName: effectiveDevName,
        developerEmail: effectiveDevEmail,
      });
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const { effectiveDevName, effectiveDevEmail } = getEffectiveDevInfo();
    if (!effectiveDevName || !effectiveDevEmail || !eventForm.event_title) {
      toast.error("Please fill in developer name, email, and event title");
      return;
    }
    setEventSubmitting(true);
    try {
      const { error } = await (supabase as any).from("developer_submissions").insert({
        developer_name: effectiveDevName,
        developer_email: effectiveDevEmail,
        submission_type: "event_invitation",
        submission_subtype: "event",
        event_title: eventForm.event_title,
        event_date: eventForm.event_date ? new Date(eventForm.event_date).toISOString() : null,
        event_location: eventForm.event_location || null,
        event_description: eventForm.event_description || null,
        event_files: eventFiles.length > 0 ? eventFiles : [],
      });
      if (error) throw error;
      try {
        await supabase.from("admin_tasks").insert({
          user_id: OWNER_ID,
          title: `Event to attend: ${eventForm.event_title}`,
          description: `${effectiveDevName} invited you to "${eventForm.event_title}"${eventForm.event_location ? ` at ${eventForm.event_location}` : ''}. Review and mark attendance.`,
          category: 'event_attendance',
          priority: 'high',
          status: 'pending',
          due_date: eventForm.event_date ? new Date(eventForm.event_date).toISOString() : null,
        } as any);
      } catch {}
      logActivity({
        activityType: 'upload',
        entityType: 'event',
        entityName: eventForm.event_title,
        details: { fileCount: eventFiles.length },
        developerName: effectiveDevName,
        developerEmail: effectiveDevEmail,
      });
      toast.success("Event invitation submitted!");
      setEventForm({ event_title: "", event_date: "", event_location: "", event_description: "" });
      setEventFiles([]);
      queryClient.invalidateQueries({ queryKey: ["upcoming-launches"] });
      queryClient.invalidateQueries({ queryKey: ["all-dev-submissions"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setEventSubmitting(false);
    }
  };

  const handleSubmitLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    const { effectiveDevName, effectiveDevEmail } = getEffectiveDevInfo();
    if (!effectiveDevName || !effectiveDevEmail || !launchForm.launch_title) {
      toast.error("Please fill in developer name, email, and launch title");
      return;
    }
    setLaunchSubmitting(true);
    try {
      const { error } = await (supabase as any).from("developer_submissions").insert({
        developer_name: effectiveDevName,
        developer_email: effectiveDevEmail,
        submission_type: "launch_announcement",
        submission_subtype: "launch",
        event_title: launchForm.launch_title,
        event_date: launchForm.launch_date ? new Date(launchForm.launch_date).toISOString() : null,
        event_location: launchForm.launch_location || null,
        event_description: launchForm.launch_description || null,
        event_files: launchFiles.length > 0 ? launchFiles : [],
      });
      if (error) throw error;
      try {
        await supabase.from("admin_tasks").insert({
          user_id: OWNER_ID,
          title: `New Launch: ${launchForm.launch_title}`,
          description: `${effectiveDevName} announced a new launch: "${launchForm.launch_title}"${launchForm.launch_location ? ` in ${launchForm.launch_location}` : ''}. Prepare marketing materials and broker briefing.`,
          category: 'launch_preparation',
          priority: 'high',
          status: 'pending',
          due_date: launchForm.launch_date ? new Date(launchForm.launch_date).toISOString() : null,
        } as any);
      } catch {}
      logActivity({
        activityType: 'upload',
        entityType: 'launch',
        entityName: launchForm.launch_title,
        details: { fileCount: launchFiles.length },
        developerName: effectiveDevName,
        developerEmail: effectiveDevEmail,
      });
      toast.success("Launch announcement submitted!");
      setLaunchForm({ launch_title: "", launch_date: "", launch_location: "", launch_description: "" });
      setLaunchFiles([]);
      queryClient.invalidateQueries({ queryKey: ["upcoming-launches"] });
      queryClient.invalidateQueries({ queryKey: ["all-dev-submissions"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setLaunchSubmitting(false);
    }
  };

  // Owner: toggle hide/show submission
  const handleToggleHide = async (id: string, currentlyHidden: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('developer_submissions')
        .update({ is_hidden: !currentlyHidden })
        .eq('id', id);
      if (error) throw error;
      toast.success(currentlyHidden ? 'Item shown' : 'Item hidden');
      refetchSubmissions();
    } catch { toast.error('Failed to update'); }
  };

  // Owner: assign broker
  const handleAssignBroker = async (id: string, brokerId: string | null) => {
    try {
      const { error } = await (supabase as any)
        .from('developer_submissions')
        .update({ assigned_broker_id: brokerId })
        .eq('id', id);
      if (error) throw error;
      toast.success(brokerId ? 'Broker assigned' : 'Broker removed');
      refetchSubmissions();
    } catch { toast.error('Failed to assign'); }
  };

  // Owner: toggle auto-approve for a rep
  const handleToggleAutoApprove = async (repId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('developer_representatives')
        .update({ auto_approve_uploads: !currentValue } as any)
        .eq('id', repId);
      if (error) throw error;
      toast.success(!currentValue ? 'Auto-approve enabled' : 'Reverted to manual approval');
      refetchAllReps();
    } catch { toast.error('Failed to update'); }
  };

  // Owner: restrict/unrestrict a rep
  const handleToggleRestrict = async (repId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'restricted' ? 'approved' : 'restricted';
    try {
      const { error } = await supabase
        .from('developer_representatives')
        .update({ status: newStatus } as any)
        .eq('id', repId);
      if (error) throw error;
      toast.success(newStatus === 'restricted' ? 'Access restricted' : 'Access restored');
      refetchAllReps();
    } catch { toast.error('Failed to update'); }
  };

  const handleRegisterInterest = async () => {
    if (!user || !selectedEvent) return;
    setSubmittingInterest(true);
    try {
      const { error } = await (supabase as any)
        .from('launch_interest_registrations')
        .insert({
          user_id: user.id,
          event_id: selectedEvent.id,
          developer_name: selectedEvent.developer_name,
          event_title: selectedEvent.event_title,
          user_email: user.email,
          user_name: displayName,
          user_phone: interestPhone || null,
          interest_type: interestType,
          notes: interestNotes || null,
        });
      if (error) throw error;
      try {
        await supabase.from("admin_tasks").insert({
          user_id: OWNER_ID,
          title: `Launch Interest: ${selectedEvent.event_title}`,
          description: `${displayName} (${user.email}) registered ${interestType} interest for "${selectedEvent.event_title}" by ${selectedEvent.developer_name}.${interestNotes ? ` Notes: ${interestNotes}` : ''}`,
          category: 'launch_interest',
          priority: interestType === 'eoi' ? 'high' : 'medium',
          status: 'pending',
        } as any);
      } catch {}
      toast.success(`Interest registered for "${selectedEvent.event_title}"!`);
      setInterestModalOpen(false);
      setInterestType("general");
      setInterestNotes("");
      setInterestPhone("");
      setSelectedEvent(null);
      queryClient.invalidateQueries({ queryKey: ["my-launch-interests"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to register interest");
    } finally {
      setSubmittingInterest(false);
    }
  };

  const statusBadge = (status: string) => {
    const config: Record<string, string> = {
      pending_review: EMERALD_LABEL,
      received: EMERALD_LABEL,
      under_review: EMERALD_LABEL,
      approved: EMERALD_LABEL,
      rejected: EMERALD_LABEL,
      restricted: EMERALD_LABEL,
    };
    return <Badge data-label-emerald-only className={config[status] || EMERALD_LABEL}>{status?.replace(/_/g, " ") || "Pending"}</Badge>;
  };

  const isRepApproved = repProfile?.status === 'approved';
  const hasRepProfile = !!repProfile;

  // Check if user is an approved broker
  const { data: brokerAccess } = useQuery({
    queryKey: ["dev-portal-broker-access", user?.id],
    queryFn: async () => {
      if (!user) return { isBroker: false };
      const { data: bp } = await (supabase.from('broker_profiles') as any)
        .select('id, verification_status')
        .eq('user_id', user.id)
        .eq('verification_status', 'verified')
        .maybeSingle();
      if (bp) return { isBroker: true };
      const { data: emp } = await (supabase.from('hr_employees') as any)
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (emp) return { isBroker: true };
      return { isBroker: false };
    },
    enabled: !!user,
  });

  const isApprovedBroker = brokerAccess?.isBroker || false;
  const showRepTabs = (hasRepProfile && isRepApproved) || isApprovedBroker;

  const hasInterestFor = (eventId: string) => {
    return myInterests?.some((i: any) => i.event_id === eventId);
  };

  // Should show dev info card? Show when: no rep profile, OR owner in developer view mode
  const showDevInfoCard = !hasRepProfile || (isOwner && !ownerSkipMode);

  // Filter submissions for manage tab
  const filteredSubmissions = (allSubmissions || []).filter((s: any) => {
    if (manageSearch) {
      const q = manageSearch.toLowerCase();
      const matchTitle = s.event_title?.toLowerCase().includes(q);
      const matchDev = s.developer_name?.toLowerCase().includes(q);
      let matchDay = false;
      if (s.event_date) {
        const dayName = format(new Date(s.event_date), 'EEEE').toLowerCase();
        matchDay = dayName.includes(q);
      }
      if (!matchTitle && !matchDev && !matchDay) return false;
    }
    if (manageDateFilter && s.event_date) {
      const eventDay = format(new Date(s.event_date), 'yyyy-MM-dd');
      if (eventDay !== manageDateFilter) return false;
    }
    return true;
  });

  // REGISTRATION GATE: Owner in Developer View (ownerSkipMode=false) should see the same gate as a developer
  const shouldShowRegistrationGate = !hasRepProfile && (!isOwner || isDeveloperMode || (isOwner && !ownerSkipMode)) && !loadingRep;

  // File upload drop zone component
  const FileUploadZone = ({
    files,
    setFiles,
    uploading,
    inputRef,
    onUpload,
  }: {
    files: UploadedFile[];
    setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    uploading: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => {
    const [isDragging, setIsDragging] = useState(false);
    return (
    <div className="space-y-3">
      <Label>Photos, Videos & Documents</Label>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer bg-card/50 ${isDragging ? 'border-primary bg-primary/5' : 'border-[#B89555]/40 hover:border-[#B89555]/70'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) {
            const syntheticEvent = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
            onUpload(syntheticEvent);
          }
        }}
      >
        <Upload className="w-8 h-8 mx-auto text-[#1A1A1A]/70 mb-2" />
        <p className="text-sm font-medium text-foreground">{isDragging ? 'Drop files here' : 'Click to upload or drag & drop'}</p>
        <p className="text-xs text-muted-foreground mt-1">Photos, videos, PDFs, brochures — any format</p>
        <input ref={inputRef} type="file" className="hidden" multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.pptx,.mp4,.mov,.avi,.heic"
          onChange={onUpload} />
      </div>
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Uploading files...
        </div>
      )}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-[#B89555]/20">
              <FileText className="w-4 h-4 text-[#1A1A1A] shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
              <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
    );
  };

  return (
    <>
      <SEOHead title="Developer Portal | JBJ Global Real Estate" description="Submit projects, briefings, and marketing materials to JBJ GLOBAL REAL ESTATE." />
      <div data-backend-portal="developer" className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]">
        {/* Owner Mode Banner */}
        {isOwner && !isDeveloperMode && (
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border-2 border-[#B89555]/30">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-[#1A1A1A]" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Owner Mode</p>
                  <p className="text-xs text-muted-foreground">
                    {ownerSkipMode ? 'Fast-track: skip registration, upload directly.' : 'Viewing as developer — full developer experience.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={ownerSkipMode ? "outline" : "default"}
                  onClick={() => setOwnerSkipMode(false)}
                  className={!ownerSkipMode ? "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90" : "border-[#B89555]/30"}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Developer View
                </Button>
                <Button
                  size="sm"
                  variant={ownerSkipMode ? "default" : "outline"}
                  onClick={() => setOwnerSkipMode(true)}
                  className={ownerSkipMode ? "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90" : "border-[#B89555]/30"}
                >
                  <SkipForward className="w-3.5 h-3.5 mr-1.5" /> Quick Upload
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Rep Status Banner */}
        {hasRepProfile && !isRepApproved && !(isOwner && !ownerSkipMode) && (
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#EFE6D6]/10 border border-[#B89555]/30 text-[#1A1A1A] text-sm">
              <UserCheck className="w-5 h-5 shrink-0 text-[#1A1A1A]" />
              <div>
                <strong>Application Status: {repProfile?.status?.replace(/_/g, ' ')}</strong>
                <p className="text-xs mt-0.5 text-[#1A1A1A]/70">Your {repProfile?.role?.replace(/_/g, ' ')} registration for <strong>{repProfile?.developer_name}</strong> is being reviewed.</p>
              </div>
              {statusBadge(repProfile?.status || 'pending_review')}
            </div>
          </div>
        )}

        {/* Registration Gate — unregistered users AND owner in Developer View see ONLY the registration form */}
        {shouldShowRegistrationGate ? (
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Developer name selection before registration */}
            <Card className="border-2 border-[#B89555]/30 bg-gradient-to-r from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] mb-6">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Developer / Company You Represent *</Label>
                  <DeveloperSelectDropdown
                    value={devName}
                    onChange={setDevName}
                    placeholder="Select your developer (e.g. Emaar, DAMAC, Sobha)..."
                  />
                  <p className="text-[10px] text-muted-foreground">Select your developer first, then complete the registration below.</p>
                </div>
              </CardContent>
            </Card>
            <SalesRepRegistration developerName={devName} onRegistered={() => { refetchRep(); }} />
          </div>
        ) : (
          /* Registered users / Owner in Quick Upload — show full portal */
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {hasRepProfile && !isOwner ? (
              /* Profile summary bar */
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] border-2 border-[#B89555]/30 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  <UserCheck className="w-5 h-5 text-[#1A1A1A] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      Submitting as: {repProfile?.full_name} · {repProfile?.developer_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{repProfile?.email}{repProfile?.phone ? ` · ${repProfile.phone}` : ''}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-[#B89555]/30 shrink-0" onClick={() => setActiveTab('register')}>
                  Edit Profile
                </Button>
              </div>
            ) : ownerSkipMode ? (
              <Card className="border-2 border-[#B89555]/30 bg-gradient-to-r from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] mb-6">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Developer / Company Name *</Label>
                    <DeveloperSelectDropdown
                      value={devName}
                      onChange={setDevName}
                      placeholder="Select developer name..."
                    />
                    <p className="text-[10px] text-muted-foreground">Email auto-set to your owner account. Just select the developer and upload.</p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full overflow-x-auto pb-1">
              <TabsList className="inline-flex w-auto bg-gradient-to-r from-[hsl(40,40%,90%)] via-[hsl(38,35%,85%)] to-[hsl(36,30%,80%)] border-2 border-[#B89555]/30 rounded-xl h-14 gap-0.5 px-1.5 py-1.5">
                <TabsTrigger value="projects" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                  <FolderOpen className="w-3.5 h-3.5 mr-1 hidden md:block" /> Projects
                </TabsTrigger>
                <TabsTrigger value="submit" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                  <Plus className="w-3.5 h-3.5 mr-1 hidden md:block" /> New Project
                </TabsTrigger>
                <TabsTrigger value="events" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 mr-1 hidden md:block" /> Events
                </TabsTrigger>
                <TabsTrigger value="launches" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                  <Rocket className="w-3.5 h-3.5 mr-1 hidden md:block" /> Launches
                </TabsTrigger>
                <TabsTrigger value="register" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5 mr-1 hidden md:block" /> Update Profile
                </TabsTrigger>
                <TabsTrigger value="agreements" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                  <FileSignature className="w-3.5 h-3.5 mr-1 hidden md:block" /> Agreements
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                  <ListTodo className="w-3.5 h-3.5 mr-1 hidden md:block" /> Tasks
                </TabsTrigger>
                {showRepTabs && (
                  <>
                    <TabsTrigger value="briefing" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                      <Briefcase className="w-3.5 h-3.5 mr-1 hidden md:block" /> Briefing
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5 mr-1 hidden md:block" /> Messages
                    </TabsTrigger>
                  </>
                )}
                {isOwner && ownerSkipMode && (
                  <TabsTrigger value="manage" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                    <Settings className="w-3.5 h-3.5 mr-1 hidden md:block" /> Manage
                  </TabsTrigger>
                )}
                <TabsTrigger value="listings" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(40,45%,88%)] data-[state=active]:to-[hsl(38,40%,83%)] data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-[#B89555]/40 rounded-lg">
                  <Eye className="w-3.5 h-3.5 mr-1 hidden md:block" /> Listings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* MY PROJECTS TAB */}
            <TabsContent value="projects" className="mt-6">
              <Card className="border-2 border-[#B89555]/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FolderOpen className="w-5 h-5 text-[#1A1A1A]" /> Your Submitted Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1A1A1A]" /></div>
                  ) : myProjects && myProjects.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {myProjects.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-[#B89555]/20 bg-card">
                            <div>
                              <h4 className="font-semibold text-foreground">{p.project_name}</h4>
                              <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge(p.status)}
                              {p.auto_approved && <Badge data-label-emerald-only className={EMERALD_LABEL_SM}>Auto-Approved</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No projects submitted yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => setActiveTab("submit")}>
                        <Plus className="w-4 h-4 mr-2" /> Submit Your First Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SUBMIT NEW PROJECT TAB */}
            <TabsContent value="submit" className="mt-6 space-y-6">
              {devName && <ExistingProjectsReview developerName={devName} />}
              
              {sessionProjects.length > 0 && (
                <div data-label-emerald-only className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm ${EMERALD_NOTICE}`}>
                  <CheckCircle className="w-4 h-4" />
                  {sessionProjects.length} project(s) submitted this session: {sessionProjects.join(", ")}
                </div>
              )}

              <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Building2 className="w-5 h-5 text-[#1A1A1A]" />
                    {ownerSkipMode ? 'Quick Upload — Owner Mode' : 'Submit New Project'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload PDFs, renders, brochures, and fact sheets. Our system will automatically generate a listing.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm text-blue-800">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    All submissions require admin approval before going live.
                  </div>

                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input value={currentProject.project_name} onChange={(e) => { setCurrentProject(p => ({ ...p, project_name: e.target.value })); setDuplicateBlocking(false); }} placeholder="The Residences at Marina" />
                    {currentProject.project_name.trim().length >= 3 && (
                      <ProjectDuplicateInspector
                        projectName={currentProject.project_name}
                        blocking={true}
                        onAction={(action, matchId) => {
                          if (action === "stop") {
                            setCurrentProject(emptyProject());
                            setDuplicateBlocking(false);
                          } else if (action === "merge" && matchId) {
                            setActiveTab("projects");
                            toast.info("Redirected to existing projects for review.");
                          } else if (action === "create_new") {
                            setDuplicateBlocking(false);
                          }
                        }}
                        className="mt-2"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={currentProject.location} onChange={(e) => setCurrentProject(p => ({ ...p, location: e.target.value }))} placeholder="Dubai Marina, Dubai" />
                    </div>
                    <div className="space-y-2">
                      <Label>Launch Date</Label>
                      <Input type="date" value={currentProject.launch_date} onChange={(e) => setCurrentProject(p => ({ ...p, launch_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Project Description</Label>
                    <Textarea value={currentProject.project_description} onChange={(e) => setCurrentProject(p => ({ ...p, project_description: e.target.value }))} placeholder="Brief overview, unit types, price range, amenities..." rows={3} />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-3">
                    <Label>Marketing Materials *</Label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer bg-card/50 ${mainDragOver ? 'border-primary bg-primary/5' : 'border-[#B89555]/40 hover:border-[#B89555]/70'}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setMainDragOver(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setMainDragOver(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setMainDragOver(false);
                        if (e.dataTransfer.files.length > 0) {
                          const syntheticEvent = { target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>;
                          handleFileUpload(syntheticEvent);
                        }
                      }}
                    >
                      <Upload className="w-10 h-10 mx-auto text-[#1A1A1A]/70 mb-3" />
                      <p className="text-sm font-medium text-foreground">
                        {mainDragOver ? 'Drop files here' : 'Click to upload or drag & drop files'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Photos, renders, brochures, fact sheets, floor plans — any format
                      </p>
                      <input ref={fileInputRef} type="file" className="hidden" multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.pptx,.mp4,.mov,.avi,.heic"
                        onChange={handleFileUpload} />
                    </div>
                    {uploadingFiles && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading files...
                      </div>
                    )}
                    {currentProject.files.length > 0 && (
                      <div className="space-y-2">
                        {currentProject.files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-[#B89555]/20">
                            <FileText className="w-4 h-4 text-[#1A1A1A] shrink-0" />
                            <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                            <button type="button" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSubmitProject} disabled={submittingProject || duplicateBlocking}
                      className="flex-1 bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-[#B89555]/40 text-foreground font-bold h-12">
                      {submittingProject ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Project</>}
                    </Button>
                  </div>

                  {sessionProjects.length > 0 && (
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => { setCurrentProject(emptyProject()); setDuplicateBlocking(false); }} className="flex-1 border-[#B89555]/30">
                        <Plus className="w-4 h-4 mr-2" /> Add Another Project
                      </Button>
                      <Button variant="outline" onClick={() => setEndSessionOpen(true)} className="flex-1 border-[#B89555]/30">
                        <CheckCircle className="w-4 h-4 mr-2" /> End Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* EVENTS TAB — Event Invitations */}
            <TabsContent value="events" className="mt-6">
              <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-5 h-5 text-[#1A1A1A]" /> Submit Event Invitation
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Invite our team to open days, networking events, exhibitions, or private previews.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitEvent} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Event Title *</Label>
                      <Input value={eventForm.event_title} onChange={(e) => setEventForm(p => ({ ...p, event_title: e.target.value }))} placeholder="Open Day: Jumeirah Living" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date & Time</Label>
                        <Input type="datetime-local" value={eventForm.event_date} onChange={(e) => setEventForm(p => ({ ...p, event_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={eventForm.event_location} onChange={(e) => setEventForm(p => ({ ...p, event_location: e.target.value }))} placeholder="Address Fountain Views" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description / Details</Label>
                      <Textarea value={eventForm.event_description} onChange={(e) => setEventForm(p => ({ ...p, event_description: e.target.value }))} placeholder="Event details, dress code, RSVP info..." rows={4} />
                    </div>

                    <FileUploadZone
                      files={eventFiles}
                      setFiles={setEventFiles}
                      uploading={uploadingEventFiles}
                      inputRef={eventFileInputRef}
                      onUpload={(e) => handleGenericFileUpload(e.target.files, 'events', setUploadingEventFiles, setEventFiles, eventFileInputRef)}
                    />

                    <Button type="submit" disabled={eventSubmitting}
                      className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-[#B89555]/40 text-foreground font-bold h-12">
                      {eventSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Event</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LAUNCHES TAB */}
            <TabsContent value="launches" className="mt-6 space-y-6">
              <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Rocket className="w-5 h-5 text-[#1A1A1A]" /> Submit New Launch
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Announce a new project launch. Our team will prepare marketing and broker briefings.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitLaunch} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Launch Title *</Label>
                      <Input value={launchForm.launch_title} onChange={(e) => setLaunchForm(p => ({ ...p, launch_title: e.target.value }))} placeholder="Grand Launch: Marina Heights" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Launch Date</Label>
                        <Input type="datetime-local" value={launchForm.launch_date} onChange={(e) => setLaunchForm(p => ({ ...p, launch_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={launchForm.launch_location} onChange={(e) => setLaunchForm(p => ({ ...p, launch_location: e.target.value }))} placeholder="Sales Gallery, Downtown Dubai" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description / Details</Label>
                      <Textarea value={launchForm.launch_description} onChange={(e) => setLaunchForm(p => ({ ...p, launch_description: e.target.value }))} placeholder="Unit types, price range, key selling points, commission structure..." rows={4} />
                    </div>

                    <FileUploadZone
                      files={launchFiles}
                      setFiles={setLaunchFiles}
                      uploading={uploadingLaunchFiles}
                      inputRef={launchFileInputRef}
                      onUpload={(e) => handleGenericFileUpload(e.target.files, 'launches', setUploadingLaunchFiles, setLaunchFiles, launchFileInputRef)}
                    />

                    <Button type="submit" disabled={launchSubmitting}
                      className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-[#B89555]/40 text-foreground font-bold h-12">
                      {launchSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Rocket className="w-4 h-4 mr-2" /> Submit Launch</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Upcoming Launches & Events */}
              <Card className="border-2 border-[#B89555]/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Star className="w-5 h-5 text-[#1A1A1A]" /> Upcoming Launches & Events
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Browse upcoming launches and register your interest.</p>
                </CardHeader>
                <CardContent>
                  {upcomingEvents && upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingEvents.map((event: any) => {
                        const registered = hasInterestFor(event.id);
                        return (
                          <div key={event.id} className="p-4 rounded-xl border border-[#B89555]/20 bg-card hover:border-[#B89555]/40 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground">{event.event_title}</h4>
                                  <Badge data-label-emerald-only className={EMERALD_LABEL}>
                                    {event.submission_subtype === 'launch' ? 'Launch' : 'Event'}
                                  </Badge>
                                  {registered && <Badge data-label-emerald-only className={EMERALD_LABEL_SM}>Registered</Badge>}
                                </div>
                                <p className="text-xs text-[#1A1A1A] font-medium">{event.developer_name}</p>
                                {event.event_date && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(event.event_date), "EEEE, MMM d, yyyy 'at' h:mm a")}
                                  </p>
                                )}
                                {event.event_location && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {event.event_location}
                                  </p>
                                )}
                                {event.event_description && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{event.event_description}</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                disabled={registered}
                                onClick={() => {
                                  setSelectedEvent(event);
                                  setInterestModalOpen(true);
                                }}
                                className={registered
                                  ? EMERALD_LABEL
                                  : "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
                                }
                              >
                                {registered ? <><CheckCircle className="w-3.5 h-3.5 mr-1" /> Done</> : <><Star className="w-3.5 h-3.5 mr-1" /> Register Interest</>}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No upcoming launches at the moment</p>
                      <p className="text-xs mt-1">New launches and events will appear here as developers submit them.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Registrations */}
              {myInterests && myInterests.length > 0 && (
                <Card className="border-2 border-[#B89555]/30">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A]" /> Your Launch Interests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {myInterests.map((i: any) => (
                        <div key={i.id} className="flex items-center justify-between p-3 rounded-xl border border-[#B89555]/20 bg-card">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{i.event_title}</h4>
                            <p className="text-xs text-muted-foreground">{i.developer_name} · {format(new Date(i.created_at), "MMM d, yyyy")}</p>
                          </div>
                          <Badge data-label-emerald-only className={EMERALD_LABEL}>{i.interest_type === 'eoi' ? 'EOI' : i.interest_type === 'private_tour' ? 'Private Tour' : 'General'}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* REGISTER / PROFILE TAB */}
            <TabsContent value="register" className="mt-6">
              {loadingRep ? (
                <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1A1A1A]" /></div>
              ) : hasRepProfile ? (
                <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <UserCheck className="w-5 h-5 text-[#1A1A1A]" /> Your Profile
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Your details are linked to all submissions. Edit anytime — we'll be notified of changes.</p>
                  </CardHeader>
                  <CardContent>
                    {editingProfile ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input value={editForm.full_name} onChange={(e) => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Position / Title</Label>
                            <Input value={editForm.position} onChange={(e) => setEditForm(f => ({ ...f, position: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Company Email *</Label>
                            <Input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Company Phone</Label>
                            <PhoneInputWithCountry
                              value={editForm.phone}
                              onChange={(v) => setEditForm(f => ({ ...f, phone: v }))}
                              placeholder="50 123 4567"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                              Developer / Company
                              <AlertCircle className="w-3 h-3 text-amber-500" />
                            </Label>
                            <DeveloperSelectDropdown
                              value={editForm.developer_name}
                              onChange={(v) => setEditForm(f => ({ ...f, developer_name: v }))}
                              placeholder="Select developer..."
                            />
                            {editForm.developer_name !== (repProfile?.developer_name || '') && (
                              <p className="text-[10px] text-amber-600 font-medium">⚠ Changing your developer will require re-approval and new verification documents.</p>
                            )}
                            <p className="text-[10px] text-muted-foreground">You can change your developer — this will trigger a re-approval process.</p>
                          </div>
                          <div className="space-y-2">
                            <Label>Nationality</Label>
                            <NationalitySelect
                              value={editForm.nationality}
                              onChange={(v) => setEditForm(f => ({ ...f, nationality: v }))}
                            />
                          </div>
                        </div>
                        {/* Personal contact fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                              Personal Email <Lock className="w-3 h-3 text-muted-foreground" />
                            </Label>
                            <Input type="email" value={editForm.personal_email} onChange={(e) => setEditForm(f => ({ ...f, personal_email: e.target.value }))} placeholder="john.personal@gmail.com" />
                            <p className="text-[10px] text-muted-foreground">Restricted. Backup contact only.</p>
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                              Personal Phone <Lock className="w-3 h-3 text-muted-foreground" />
                            </Label>
                            <PhoneInputWithCountry
                              value={editForm.personal_phone}
                              onChange={(v) => setEditForm(f => ({ ...f, personal_phone: v }))}
                              placeholder="55 987 6543"
                            />
                            <p className="text-[10px] text-muted-foreground">Restricted. Backup contact only.</p>
                          </div>
                        </div>
                        {/* Languages */}
                        <div className="space-y-2">
                          <Label>Languages Spoken</Label>
                          <LanguageMultiSelect
                            value={editForm.languages}
                            onChange={(v) => setEditForm(f => ({ ...f, languages: v }))}
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleSaveProfile} disabled={savingProfile}
                            className="flex-1 bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-[#B89555]/40 text-foreground font-bold">
                            {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingProfile(false)} className="border-[#B89555]/30">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Full Name</p>
                            <p className="font-semibold text-foreground">{repProfile?.full_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Role</p>
                            <p className="font-semibold text-foreground capitalize">{repProfile?.role?.replace(/_/g, ' ')}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Company</p>
                            <p className="font-semibold text-foreground">{repProfile?.developer_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-semibold text-foreground">{repProfile?.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="font-semibold text-foreground">{(repProfile as any)?.phone || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Nationality</p>
                            <p className="font-semibold text-foreground">{(repProfile as any)?.nationality || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Languages</p>
                            <p className="font-semibold text-foreground">{(repProfile as any)?.languages?.join(', ') || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Auto-Approve Uploads</p>
                            <Badge data-label-emerald-only className={EMERALD_LABEL}>
                              {repProfile?.auto_approve_uploads ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-3 items-center">
                          <Button variant="outline" onClick={handleStartEditProfile} className="border-[#B89555]/30">
                            Edit Profile
                          </Button>
                        </div>

                        {/* On-Leave Toggle */}
                        <div className="p-4 rounded-xl border border-[#B89555]/20 bg-card space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">On Leave Status</p>
                              <p className="text-xs text-muted-foreground">Mark yourself as on leave so the team knows your availability.</p>
                            </div>
                            <Button
                              size="sm"
                              variant={(repProfile as any)?.is_on_leave ? "default" : "outline"}
                              className={(repProfile as any)?.is_on_leave ? "bg-amber-500 text-white hover:bg-amber-600" : "border-[#B89555]/30"}
                              onClick={async () => {
                                const newVal = !(repProfile as any)?.is_on_leave;
                                try {
                                  await supabase.from('developer_representatives')
                                    .update({ is_on_leave: newVal, leave_start_date: newVal ? new Date().toISOString().split('T')[0] : null, leave_end_date: null } as any)
                                    .eq('id', repProfile!.id);
                                  toast.success(newVal ? 'Marked as on leave' : 'Welcome back! Leave status cleared.');
                                  refetchRep();
                                } catch { toast.error('Failed to update leave status'); }
                              }}
                            >
                              {(repProfile as any)?.is_on_leave ? 'On Leave' : 'Mark as On Leave'}
                            </Button>
                          </div>
                          {(repProfile as any)?.is_on_leave && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Leave Start</Label>
                                <Input
                                  type="date"
                                  defaultValue={(repProfile as any)?.leave_start_date || ''}
                                  onChange={async (e) => {
                                    try {
                                      await supabase.from('developer_representatives')
                                        .update({ leave_start_date: e.target.value } as any)
                                        .eq('id', repProfile!.id);
                                    } catch {}
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Expected Return</Label>
                                <Input
                                  type="date"
                                  defaultValue={(repProfile as any)?.leave_end_date || ''}
                                  onChange={async (e) => {
                                    try {
                                      await supabase.from('developer_representatives')
                                        .update({ leave_end_date: e.target.value } as any)
                                        .eq('id', repProfile!.id);
                                    } catch {}
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {!isRepApproved && (
                          <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-xl p-3 text-sm text-[#1A1A1A]">
                            Your registration is under review. Once approved, you'll be able to request briefings and send messages directly.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <SalesRepRegistration
                  developerName={devName || 'Your Company'}
                  onRegistered={() => {
                    refetchRep();
                    toast.info('Your registration is now under review.');
                  }}
                />
              )}
            </TabsContent>

            {/* BRIEFING TAB */}
            {showRepTabs && (
              <TabsContent value="briefing" className="mt-6 space-y-6">
                <BriefingRequestForm
                  representativeId={repProfile!.id}
                  developerName={repProfile!.developer_name}
                />
                {myBriefings && myBriefings.length > 0 && (
                  <Card className="border-2 border-[#B89555]/30">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                        <ClipboardList className="w-4 h-4 text-[#1A1A1A]" /> Your Briefing Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {myBriefings.map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-[#B89555]/20 bg-card">
                            <div>
                              <h4 className="font-semibold text-sm text-foreground">{b.project_name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {b.briefing_date} at {b.briefing_time} · {b.duration_minutes} min
                              </p>
                            </div>
                            {statusBadge(b.status)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* MESSAGES TAB */}
            {showRepTabs && (
              <TabsContent value="messages" className="mt-6">
                <DeveloperMessageForm
                  representativeId={repProfile!.id}
                  developerName={repProfile!.developer_name}
                  autoApprove={repProfile!.auto_approve_uploads ?? false}
                />
              </TabsContent>
            )}

            {/* AGREEMENTS TAB */}
            <TabsContent value="agreements" className="mt-6">
              <Card className="border-2 border-[#B89555]/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileSignature className="w-5 h-5 text-[#1A1A1A]" /> Your Agreements & Documents
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Documents assigned to you for review or signature.</p>
                </CardHeader>
                <CardContent>
                  {myAgreements && myAgreements.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {myAgreements.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-[#B89555]/20 bg-card">
                            <div>
                              <h4 className="font-semibold text-foreground">{a.title}</h4>
                              <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, yyyy")}</p>
                            </div>
                            <Badge data-label-emerald-only className={EMERALD_LABEL}>{a.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <FileSignature className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No agreements found</p>
                      <p className="text-xs mt-1">Documents requiring your signature will appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TASKS TAB */}
            <TabsContent value="tasks" className="mt-6">
              <Card className="border-2 border-[#B89555]/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <ListTodo className="w-5 h-5 text-[#1A1A1A]" /> Your Tasks
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Tasks assigned to you by the team.</p>
                </CardHeader>
                <CardContent>
                  {myTasks && myTasks.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {myTasks.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-[#B89555]/20 bg-card">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground truncate">{t.title}</h4>
                                {t.priority === 'high' && <Badge data-label-emerald-only className={EMERALD_LABEL_SM}>High</Badge>}
                                {t.priority === 'urgent' && <Badge data-label-emerald-only className={EMERALD_LABEL_SM}>Urgent</Badge>}
                              </div>
                              {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</p>}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {format(new Date(t.created_at), "MMM d, yyyy")}
                                {t.due_date && ` · Due: ${format(new Date(t.due_date), "MMM d")}`}
                              </p>
                            </div>
                            <Badge data-label-emerald-only className={EMERALD_LABEL}>{t.status?.replace(/_/g, ' ') || 'Pending'}</Badge>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No tasks assigned</p>
                      <p className="text-xs mt-1">Tasks from the team will appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* OWNER: MANAGE — Launches, Events, Developer Reps, Launch Interests */}
            {isOwner && ownerSkipMode && (
              <TabsContent value="manage" className="mt-6 space-y-6">
                {/* Launches & Events Management */}
                <Card className="border-2 border-[#B89555]/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Settings className="w-5 h-5 text-[#1A1A1A]" /> Manage Launches & Events
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Search, filter, hide/show, and assign brokers to submissions.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={manageSearch}
                          onChange={(e) => setManageSearch(e.target.value)}
                          placeholder="Search by developer, title, or day (e.g. Monday)..."
                          className="pl-10"
                        />
                      </div>
                      <Input
                        type="date"
                        value={manageDateFilter}
                        onChange={(e) => setManageDateFilter(e.target.value)}
                        placeholder="Filter by date"
                      />
                    </div>

                    {manageDateFilter && (
                      <Button size="sm" variant="outline" onClick={() => setManageDateFilter("")} className="border-[#B89555]/30">
                        <X className="w-3 h-3 mr-1" /> Clear date filter
                      </Button>
                    )}

                    {filteredSubmissions.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {filteredSubmissions.map((s: any) => (
                            <div key={s.id} className={`p-4 rounded-xl border bg-card ${s.is_hidden ? 'opacity-50 border-muted' : 'border-[#B89555]/20'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground text-sm">{s.event_title}</h4>
                                    <Badge data-label-emerald-only className={EMERALD_LABEL}>
                                      {s.submission_subtype === 'launch' ? 'Launch' : 'Event'}
                                    </Badge>
                                    {s.is_hidden && <Badge data-label-emerald-only className={EMERALD_LABEL_SM}>Hidden</Badge>}
                                  </div>
                                  <p className="text-xs text-[#1A1A1A] font-medium">{s.developer_name}</p>
                                  {s.event_date && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(s.event_date), "EEEE, MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                  )}
                                  {s.event_location && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> {s.event_location}
                                    </p>
                                  )}
                                  {s.event_description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.event_description}</p>}
                                  {s.event_files && (s.event_files as any[]).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {(s.event_files as any[]).map((f: any, idx: number) => (
                                        <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer"
                                          className="text-[10px] text-[#1A1A1A] hover:underline flex items-center gap-1">
                                          <FileText className="w-3 h-3" /> {f.name}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Submitted: {format(new Date(s.created_at), "MMM d, yyyy")}
                                    {s.assigned_broker_id && ' · Broker assigned'}
                                  </p>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-[#B89555]/30 text-xs"
                                    onClick={() => handleToggleHide(s.id, s.is_hidden)}
                                  >
                                    {s.is_hidden ? <><Eye className="w-3 h-3 mr-1" /> Show</> : <><EyeOff className="w-3 h-3 mr-1" /> Hide</>}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        <Settings className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No submissions found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Developer Representative Management */}
                <Card className="border-2 border-[#B89555]/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Users className="w-5 h-5 text-[#1A1A1A]" /> Manage Registered Developers
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Toggle auto-approve, restrict access, or review developer representatives.</p>
                  </CardHeader>
                  <CardContent>
                    {allReps && allReps.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {allReps.map((rep: any) => (
                            <div key={rep.id} className="p-4 rounded-xl border border-[#B89555]/20 bg-card">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-foreground text-sm">{rep.full_name}</h4>
                                  <p className="text-xs text-[#1A1A1A] font-medium">{rep.developer_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {rep.email} · {rep.role?.replace(/_/g, ' ')}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {statusBadge(rep.status || 'pending_review')}
                                    {rep.auto_approve_uploads && (
                                      <Badge data-label-emerald-only className={EMERALD_LABEL_SM}>Auto-Approve</Badge>
                                    )}
                                    {rep.is_on_leave && (
                                      <Badge data-label-emerald-only className={EMERALD_LABEL_SM}>On Leave</Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2 shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-[#B89555]/30 text-xs"
                                    onClick={() => handleToggleAutoApprove(rep.id, !!rep.auto_approve_uploads)}
                                  >
                                    {rep.auto_approve_uploads
                                      ? <><ToggleRight className="w-3.5 h-3.5 mr-1 text-[color:var(--emerald-1)]" /> Auto-Approve On</>
                                      : <><ToggleLeft className="w-3.5 h-3.5 mr-1" /> Auto-Approve Off</>
                                    }
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={rep.status === 'restricted'
                                      ? "border-[color:var(--emerald-1)]/30 text-[color:var(--emerald-1)] text-xs"
                                      : "border-red-300 text-red-700 text-xs"
                                    }
                                    onClick={() => handleToggleRestrict(rep.id, rep.status)}
                                  >
                                    {rep.status === 'restricted'
                                      ? <><ShieldCheck className="w-3.5 h-3.5 mr-1" /> Restore Access</>
                                      : <><ShieldOff className="w-3.5 h-3.5 mr-1" /> Restrict Access</>
                                    }
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No registered developer representatives yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Launch Interests — collapsible */}
                <Collapsible open={interestExpanded} onOpenChange={setInterestExpanded}>
                  <Card className="border-2 border-[#B89555]/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-[#EFE6D6]/5 transition-colors rounded-t-xl">
                        <CardTitle className="flex items-center justify-between text-foreground">
                          <span className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-[#1A1A1A]" /> Launch Interests
                            {allInterests && allInterests.length > 0 && (
                              <Badge data-label-emerald-only className={`${EMERALD_LABEL} ml-2`}>{allInterests.length}</Badge>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{interestExpanded ? 'Collapse' : 'Expand'}</span>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        {allInterests && allInterests.length > 0 ? (
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-3">
                              {allInterests.map((i: any) => (
                                <div key={i.id} className="p-4 rounded-xl border border-[#B89555]/20 bg-card">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h4 className="font-semibold text-foreground text-sm">{i.event_title}</h4>
                                      <p className="text-xs text-[#1A1A1A]">{i.developer_name}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {i.user_name} · {i.user_email}
                                        {i.user_phone && ` · ${i.user_phone}`}
                                      </p>
                                      {i.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{i.notes}"</p>}
                                      <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(i.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                                    </div>
                                    <Badge data-label-emerald-only className={EMERALD_LABEL}>{i.interest_type === 'eoi' ? 'EOI' : i.interest_type === 'private_tour' ? 'Private Tour' : 'General'}</Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">
                            <Star className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p>No launch interests yet</p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </TabsContent>
            )}

            <TabsContent value="listings" className="mt-6">
              <Card className="border-2 border-[#B89555]/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Eye className="w-5 h-5 text-[#1A1A1A]" /> Check Your Listings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">View your projects on the website. If anything is incorrect, let us know.</p>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#1A1A1A]" /></div>
                  ) : myProjects && myProjects.filter((p: any) => p.status === 'approved').length > 0 ? (
                    <div className="space-y-3">
                      {myProjects.filter((p: any) => p.status === 'approved').map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-[#B89555]/20 bg-card">
                          <div>
                            <h4 className="font-semibold text-foreground">{p.project_name}</h4>
                            <p className="text-xs text-muted-foreground">Approved · {format(new Date(p.created_at), "MMM d, yyyy")}</p>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/properties?search=${encodeURIComponent(p.project_name)}`}>
                              <Button size="sm" variant="outline" className="border-[#B89555]/30">
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View on Site
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline" className="border-red-500/30 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                toast.info("Report feature coming soon. Please contact support@jbjglobal.com");
                              }}>
                              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Report Issue
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No approved listings yet</p>
                      <p className="text-xs mt-1">Once your projects are approved, they'll appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        )}
      </div>

      {/* End Session Summary Dialog */}
      <AlertDialog open={endSessionOpen} onOpenChange={setEndSessionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#1A1A1A]" /> Session Summary
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <div><span className="text-muted-foreground">Projects Submitted:</span> <strong className="text-foreground">{sessionProjects.length}</strong></div>
                  <div><span className="text-muted-foreground">Session Started:</span> <strong className="text-foreground">{format(new Date(sessionStartTime), "h:mm a")}</strong></div>
                </div>
                {sessionProjects.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Uploaded Projects:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {sessionProjects.map((name, i) => <li key={i}>{name}</li>)}
                    </ul>
                  </div>
                )}
                <p className="text-muted-foreground">A confirmation will be sent to <strong className="text-foreground">{devEmail}</strong>.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Working</AlertDialogCancel>
            <AlertDialogAction
              disabled={endingSession}
              onClick={async (e) => {
                e.preventDefault();
                setEndingSession(true);
                try {
                  if (user) {
                    await (supabase as any).from("developer_session_logs").insert({
                      user_id: user.id,
                      developer_name: devName,
                      developer_email: devEmail,
                      session_start: sessionStartTime,
                      session_end: new Date().toISOString(),
                      projects_submitted: sessionProjects,
                      files_uploaded_count: sessionProjects.length,
                      summary: { projects: sessionProjects, ended_by: "user" },
                    });
                  }
                  toast.success("Session ended. Confirmation will be sent.");
                  setSessionProjects([]);
                  setCurrentProject(emptyProject());
                  setDuplicateBlocking(false);
                  setEndSessionOpen(false);
                  setActiveTab("projects");
                } catch {
                  toast.error("Failed to log session.");
                } finally {
                  setEndingSession(false);
                }
              }}
              className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
            >
              {endingSession ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ending...</> : "Confirm End Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Register Interest Modal */}
      <Dialog open={interestModalOpen} onOpenChange={setInterestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-[#1A1A1A]" /> Register Interest
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.event_title} by {selectedEvent?.developer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">What type of interest?</Label>
              <RadioGroup value={interestType} onValueChange={setInterestType} className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#B89555]/20 hover:border-[#B89555]/40 transition-colors">
                  <RadioGroupItem value="general" id="interest-general" />
                  <label htmlFor="interest-general" className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-foreground">General Interest</p>
                    <p className="text-xs text-muted-foreground">Keep me updated about this launch</p>
                  </label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#B89555]/20 hover:border-[#B89555]/40 transition-colors">
                  <RadioGroupItem value="private_tour" id="interest-tour" />
                  <label htmlFor="interest-tour" className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-foreground">Private Tour</p>
                    <p className="text-xs text-muted-foreground">I'd like a private showing for my clients</p>
                  </label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#B89555]/20 hover:border-[#B89555]/40 transition-colors">
                  <RadioGroupItem value="eoi" id="interest-eoi" />
                  <label htmlFor="interest-eoi" className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-foreground">Expression of Interest (EOI)</p>
                    <p className="text-xs text-muted-foreground">I have a client ready to reserve</p>
                  </label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Phone Number (optional)</Label>
              <Input type="tel" value={interestPhone} onChange={(e) => setInterestPhone(e.target.value)} placeholder="+971 50 123 4567" />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea value={interestNotes} onChange={(e) => setInterestNotes(e.target.value)} placeholder="Any additional details..." rows={3} />
            </div>
            <Button onClick={handleRegisterInterest} disabled={submittingInterest}
              className="w-full bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90 font-bold h-11">
              {submittingInterest ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Star className="w-4 h-4 mr-2" /> Confirm Interest</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeveloperPortal;
