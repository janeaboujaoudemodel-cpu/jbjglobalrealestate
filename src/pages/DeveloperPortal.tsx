
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
  Rocket, Search, EyeOff, Settings,
} from "lucide-react";
import SalesRepRegistration from "@/components/developer-portal/SalesRepRegistration";
import BriefingRequestForm from "@/components/developer-portal/BriefingRequestForm";
import DeveloperMessageForm from "@/components/developer-portal/DeveloperMessageForm";

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

const DeveloperPortal = () => {
  const [searchParams] = useSearchParams();
  const { user, isOwner } = useAuth();
  const { isDeveloperMode } = useUserModeContext();
  const queryClient = useQueryClient();
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

  // Interest registration modal
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

  // Fetch developer names for autocomplete (owner mode)
  const { data: developersList } = useQuery({
    queryKey: ["developers-list-autocomplete"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('developers')
        .select('id, name')
        .order('name');
      return data || [];
    },
    enabled: isOwner,
  });

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

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '', position: '', email: '', phone: '', developer_name: '', nationality: '',
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
      if (editForm.full_name !== repProfile.full_name) changedFields.push('full_name');
      if (editForm.email !== repProfile.email) changedFields.push('email');
      if (editForm.phone !== ((repProfile as any).phone || '')) changedFields.push('phone');
      if (editForm.position !== ((repProfile as any).position || '')) changedFields.push('position');
      if (editForm.nationality !== ((repProfile as any).nationality || '')) changedFields.push('nationality');
      // developer_name is LOCKED — never update it

      const { error } = await supabase
        .from('developer_representatives')
        .update({
          full_name: editForm.full_name,
          position: editForm.position || null,
          email: editForm.email,
          phone: editForm.phone || null,
          // developer_name is LOCKED after registration — not updatable
          nationality: editForm.nationality || null,
        } as any)
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

      toast.success('Profile updated successfully');
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

  // Fetch user's interest registrations
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

  // Owner: fetch ALL interest registrations
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

  // Generic file upload handler
  const handleGenericFileUpload = async (
    files: FileList | null,
    prefix: string,
    setUploading: (v: boolean) => void,
    setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
    inputRef: React.RefObject<HTMLInputElement>
  ) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const path = `developer-events/${prefix}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("documents").upload(path, file);
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type });
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
    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const safeName = currentProject.project_name?.replace(/[^a-zA-Z0-9-_]/g, '-') || 'project';
        const path = `developer-uploads/${safeName}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("documents").upload(path, file);
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type });
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
    setSubmittingProject(true);
    try {
      const { error } = await supabase.from("developer_launch_uploads").insert({
        developer_name: effectiveDevName,
        developer_email: effectiveDevEmail,
        project_name: currentProject.project_name,
        project_description: currentProject.project_description || null,
        location: currentProject.location || null,
        launch_date: currentProject.launch_date || null,
        uploaded_files: currentProject.files,
      } as any);
      if (error) throw error;

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

      // Auto-create owner task for event attendance
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

      // Auto-create owner task for launch preparation
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
      pending_review: "bg-amber-500/20 text-amber-700",
      received: "bg-blue-500/20 text-blue-700",
      under_review: "bg-amber-500/20 text-amber-700",
      approved: "bg-emerald-500/20 text-emerald-700",
      rejected: "bg-red-500/20 text-red-700",
    };
    return <Badge className={config[status] || "bg-muted text-muted-foreground"}>{status?.replace(/_/g, " ") || "Pending"}</Badge>;
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
      // Match day of week
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
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer bg-card/50 ${isDragging ? 'border-primary bg-primary/5' : 'border-gold/40 hover:border-gold/70'}`}
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
        <Upload className="w-8 h-8 mx-auto text-gold/60 mb-2" />
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
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-gold/20">
              <FileText className="w-4 h-4 text-gold shrink-0" />
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
      <SEOHead title="Developer Portal | JBJ Global Real Estate" description="Submit projects, briefings, and marketing materials to JBJ Global." />
      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]">
        {/* Hero */}
        <div className="relative py-16 md:py-24 bg-gradient-to-br from-[hsl(38,35%,18%)] via-[hsl(36,30%,14%)] to-[hsl(34,25%,10%)] overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjE1LDE1MCwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
            <Badge className="mb-4 bg-gold/20 text-gold border-gold/30 text-sm">
              {isOwner ? 'Owner Access' : isDeveloperMode ? 'Developer Tools' : 'For Real Estate Developers & Sales Teams'}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-[#F5EBD7]">
              {isOwner ? `Welcome back, Jane` : `Here's your portal, ${displayName}`}
            </h1>
            <p className="text-lg md:text-xl text-[#D4B896]">
              {isOwner
                ? 'Upload projects, manage launches, and review interest registrations — all from here.'
                : 'Submit projects, request briefings, upload documents, and manage launches — all in one place.'}
            </p>
          </div>
        </div>

        {/* Owner Mode Banner */}
        {isOwner && (
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gold/10 to-gold/5 border-2 border-gold/30">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-gold" />
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
                  className={!ownerSkipMode ? "bg-gold text-black hover:bg-gold/90" : "border-gold/30"}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Developer View
                </Button>
                <Button
                  size="sm"
                  variant={ownerSkipMode ? "default" : "outline"}
                  onClick={() => setOwnerSkipMode(true)}
                  className={ownerSkipMode ? "bg-gold text-black hover:bg-gold/90" : "border-gold/30"}
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
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30 text-stone-800 text-sm">
              <UserCheck className="w-5 h-5 shrink-0 text-gold" />
              <div>
                <strong>Application Status: {repProfile?.status?.replace(/_/g, ' ')}</strong>
                <p className="text-xs mt-0.5 text-stone-600">Your {repProfile?.role?.replace(/_/g, ' ')} registration for <strong>{repProfile?.developer_name}</strong> is being reviewed.</p>
              </div>
              {statusBadge(repProfile?.status || 'pending_review')}
            </div>
          </div>
        )}

        {/* Registration Gate — unregistered non-owner users see ONLY the registration form */}
        {!hasRepProfile && !isOwner && !loadingRep ? (
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Developer name selection before registration */}
            <Card className="border-2 border-gold/30 bg-gradient-to-r from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] mb-6">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Developer / Company You Represent *</Label>
                  <Input
                    value={devName}
                    onChange={(e) => setDevName(e.target.value)}
                    placeholder="Start typing developer name (e.g. Emaar, DAMAC, Sobha)..."
                    list="developer-autocomplete"
                  />
                  <datalist id="developer-autocomplete">
                    {developersList?.map((d: any) => (
                      <option key={d.id} value={d.name} />
                    ))}
                  </datalist>
                  <p className="text-[10px] text-muted-foreground">Select your developer first, then complete the registration below.</p>
                </div>
              </CardContent>
            </Card>
            <SalesRepRegistration developerName={devName} onRegistered={() => { refetchRep(); }} />
          </div>
        ) : (
          /* Registered users / Owner — show full portal */
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            {hasRepProfile && !isOwner ? (
              /* Profile summary bar */
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] border-2 border-gold/30 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                  <UserCheck className="w-5 h-5 text-gold shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      Submitting as: {repProfile?.full_name} · {repProfile?.developer_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{repProfile?.email}{repProfile?.phone ? ` · ${repProfile.phone}` : ''}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="border-gold/30 shrink-0" onClick={() => setActiveTab('register')}>
                  Edit Profile
                </Button>
              </div>
            ) : ownerSkipMode ? (
              <Card className="border-2 border-gold/30 bg-gradient-to-r from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] mb-6">
                <CardContent className="p-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Developer / Company Name *</Label>
                    <div className="relative">
                      <Input
                        value={devName}
                        onChange={(e) => setDevName(e.target.value)}
                        placeholder="Start typing developer name..."
                        list="developer-autocomplete"
                      />
                      <datalist id="developer-autocomplete">
                        {developersList?.map((d: any) => (
                          <option key={d.id} value={d.name} />
                        ))}
                      </datalist>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Email auto-set to your owner account. Just enter the developer name and upload.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gold/30 bg-gradient-to-r from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] mb-6">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Developer / Company Name *</Label>
                      <Input value={devName} onChange={(e) => setDevName(e.target.value)} placeholder="e.g. Emaar Properties" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email Address *</Label>
                      <Input type="email" value={devEmail} onChange={(e) => setDevEmail(e.target.value)} placeholder="contact@developer.com" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="w-full overflow-x-auto pb-1">
              <TabsList className="inline-flex w-auto bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border-2 border-gold/30 rounded-xl h-14 gap-0.5 px-1.5 py-1.5">
                <TabsTrigger value="projects" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <FolderOpen className="w-3.5 h-3.5 mr-1 hidden md:block" /> Projects
                </TabsTrigger>
                <TabsTrigger value="submit" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <Plus className="w-3.5 h-3.5 mr-1 hidden md:block" /> New Project
                </TabsTrigger>
                <TabsTrigger value="events" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <Calendar className="w-3.5 h-3.5 mr-1 hidden md:block" /> Events
                </TabsTrigger>
                <TabsTrigger value="launches" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <Rocket className="w-3.5 h-3.5 mr-1 hidden md:block" /> Launches
                </TabsTrigger>
                <TabsTrigger value="register" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <UserCheck className="w-3.5 h-3.5 mr-1 hidden md:block" /> Register
                </TabsTrigger>
                <TabsTrigger value="agreements" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <FileSignature className="w-3.5 h-3.5 mr-1 hidden md:block" /> Agreements
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <ListTodo className="w-3.5 h-3.5 mr-1 hidden md:block" /> Tasks
                </TabsTrigger>
                {showRepTabs && (
                  <>
                    <TabsTrigger value="briefing" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                      <Briefcase className="w-3.5 h-3.5 mr-1 hidden md:block" /> Briefing
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5 mr-1 hidden md:block" /> Messages
                    </TabsTrigger>
                  </>
                )}
                {isOwner && (
                  <>
                    <TabsTrigger value="interest" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                      <Users className="w-3.5 h-3.5 mr-1 hidden md:block" /> Interest
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                      <Settings className="w-3.5 h-3.5 mr-1 hidden md:block" /> Manage
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="listings" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <Eye className="w-3.5 h-3.5 mr-1 hidden md:block" /> Listings
                </TabsTrigger>
              </TabsList>
            </div>

            {/* MY PROJECTS TAB */}
            <TabsContent value="projects" className="mt-6">
              <Card className="border-2 border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FolderOpen className="w-5 h-5 text-gold" /> Your Submitted Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
                  ) : myProjects && myProjects.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {myProjects.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gold/20 bg-card">
                            <div>
                              <h4 className="font-semibold text-foreground">{p.project_name}</h4>
                              <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge(p.status)}
                              {p.auto_approved && <Badge className="bg-emerald-500/20 text-emerald-700 text-[10px]">Auto-Approved</Badge>}
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
            <TabsContent value="submit" className="mt-6">
              {sessionProjects.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4" />
                  {sessionProjects.length} project(s) submitted this session: {sessionProjects.join(", ")}
                </div>
              )}

              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Building2 className="w-5 h-5 text-gold" />
                    {ownerSkipMode ? 'Quick Upload — Owner Mode' : 'Submit New Project'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload PDFs, renders, brochures, and fact sheets. Our system will automatically generate a listing.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input value={currentProject.project_name} onChange={(e) => setCurrentProject(p => ({ ...p, project_name: e.target.value }))} placeholder="The Residences at Marina" />
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
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer bg-card/50 ${mainDragOver ? 'border-primary bg-primary/5' : 'border-gold/40 hover:border-gold/70'}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setMainDragOver(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setMainDragOver(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setMainDragOver(false);
                        if (e.dataTransfer.files.length > 0) {
                          handleFileUpload({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                        }
                      }}
                    >
                      <Upload className="w-10 h-10 mx-auto text-gold/60 mb-3" />
                      <p className="text-sm font-medium text-foreground">{mainDragOver ? 'Drop files here' : 'Click to upload or drag & drop'}</p>
                      <p className="text-xs text-muted-foreground mt-1">PDFs, images, brochures, renders, videos (up to 100MB each)</p>
                      <input ref={fileInputRef} type="file" className="hidden" multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.pptx,.mp4,.mov,.avi,.heic,.mp3,.wav"
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
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-gold/20">
                            <FileText className="w-4 h-4 text-gold shrink-0" />
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
                    <Button onClick={handleSubmitProject} disabled={submittingProject}
                      className="flex-1 bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12">
                      {submittingProject ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Project</>}
                    </Button>
                  </div>

                  {sessionProjects.length > 0 && (
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => { setCurrentProject(emptyProject()); }} className="flex-1 border-gold/30">
                        <Plus className="w-4 h-4 mr-2" /> Add Another Project
                      </Button>
                      <Button variant="outline" onClick={() => { setSessionProjects([]); setActiveTab("projects"); }} className="flex-1 border-gold/30">
                        <CheckCircle className="w-4 h-4 mr-2" /> End Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* EVENTS TAB — Event Invitations */}
            <TabsContent value="events" className="mt-6">
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-5 h-5 text-gold" /> Submit Event Invitation
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

                    {/* File upload for events */}
                    <FileUploadZone
                      files={eventFiles}
                      setFiles={setEventFiles}
                      uploading={uploadingEventFiles}
                      inputRef={eventFileInputRef}
                      onUpload={(e) => handleGenericFileUpload(e.target.files, 'events', setUploadingEventFiles, setEventFiles, eventFileInputRef)}
                    />

                    <Button type="submit" disabled={eventSubmitting}
                      className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12">
                      {eventSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Event</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* LAUNCHES TAB — New Project Launch Announcements */}
            <TabsContent value="launches" className="mt-6 space-y-6">
              {/* Submit Launch Form */}
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Rocket className="w-5 h-5 text-gold" /> Submit New Launch
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

                    {/* File upload for launches */}
                    <FileUploadZone
                      files={launchFiles}
                      setFiles={setLaunchFiles}
                      uploading={uploadingLaunchFiles}
                      inputRef={launchFileInputRef}
                      onUpload={(e) => handleGenericFileUpload(e.target.files, 'launches', setUploadingLaunchFiles, setLaunchFiles, launchFileInputRef)}
                    />

                    <Button type="submit" disabled={launchSubmitting}
                      className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12">
                      {launchSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Rocket className="w-4 h-4 mr-2" /> Submit Launch</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Upcoming Launches & Events — Register Interest */}
              <Card className="border-2 border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Star className="w-5 h-5 text-gold" /> Upcoming Launches & Events
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Browse upcoming launches and register your interest.</p>
                </CardHeader>
                <CardContent>
                  {upcomingEvents && upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingEvents.map((event: any) => {
                        const registered = hasInterestFor(event.id);
                        return (
                          <div key={event.id} className="p-4 rounded-xl border border-gold/20 bg-card hover:border-gold/40 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground">{event.event_title}</h4>
                                  <Badge className={event.submission_subtype === 'launch' ? 'bg-blue-500/20 text-blue-700' : 'bg-gold/20 text-gold'}>
                                    {event.submission_subtype === 'launch' ? 'Launch' : 'Event'}
                                  </Badge>
                                  {registered && <Badge className="bg-emerald-500/20 text-emerald-700 text-[10px]">Registered</Badge>}
                                </div>
                                <p className="text-xs text-gold font-medium">{event.developer_name}</p>
                                {event.event_date && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📅 {format(new Date(event.event_date), "EEEE, MMM d, yyyy 'at' h:mm a")}
                                  </p>
                                )}
                                {event.event_location && (
                                  <p className="text-xs text-muted-foreground">📍 {event.event_location}</p>
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
                                  ? "bg-emerald-500/20 text-emerald-700 border-emerald-300"
                                  : "bg-gold text-black hover:bg-gold/90"
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
                <Card className="border-2 border-gold/30">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                      <CheckCircle className="w-4 h-4 text-gold" /> Your Interest Registrations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {myInterests.map((i: any) => (
                        <div key={i.id} className="flex items-center justify-between p-3 rounded-xl border border-gold/20 bg-card">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{i.event_title}</h4>
                            <p className="text-xs text-muted-foreground">{i.developer_name} · {format(new Date(i.created_at), "MMM d, yyyy")}</p>
                          </div>
                          <Badge className={
                            i.interest_type === 'eoi' ? 'bg-emerald-500/20 text-emerald-700' :
                            i.interest_type === 'private_tour' ? 'bg-blue-500/20 text-blue-700' :
                            'bg-gold/20 text-gold'
                          }>{i.interest_type === 'eoi' ? 'EOI' : i.interest_type === 'private_tour' ? 'Private Tour' : 'General'}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register" className="mt-6">
              {loadingRep ? (
                <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
              ) : hasRepProfile && !(isOwner && !ownerSkipMode) ? (
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <UserCheck className="w-5 h-5 text-gold" /> Your Profile
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
                            <Label>Phone</Label>
                            <Input type="tel" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Developer / Company</Label>
                            <Input value={editForm.developer_name} onChange={(e) => setEditForm(f => ({ ...f, developer_name: e.target.value }))} />
                          </div>
                          <div className="space-y-2">
                            <Label>Nationality</Label>
                            <Input value={editForm.nationality} onChange={(e) => setEditForm(f => ({ ...f, nationality: e.target.value }))} />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button onClick={handleSaveProfile} disabled={savingProfile}
                            className="flex-1 bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold">
                            {savingProfile ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                          </Button>
                          <Button variant="outline" onClick={() => setEditingProfile(false)} className="border-gold/30">Cancel</Button>
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
                            <p className="font-semibold text-foreground">{repProfile?.phone || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            {statusBadge(repProfile?.status || 'pending_review')}
                          </div>
                          {repProfile?.position && (
                            <div>
                              <p className="text-xs text-muted-foreground">Position</p>
                              <p className="font-semibold text-foreground">{repProfile.position}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-muted-foreground">Auto-Approve Uploads</p>
                            <Badge className={repProfile?.auto_approve_uploads ? 'bg-emerald-500/20 text-emerald-700' : 'bg-muted text-muted-foreground'}>
                              {repProfile?.auto_approve_uploads ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" onClick={handleStartEditProfile} className="border-gold/30">
                          Edit Profile
                        </Button>
                        {!isRepApproved && (
                          <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 text-sm text-stone-700">
                            Your registration is under review. Once approved, you'll be able to request briefings and send messages directly.
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : isDeveloperMode || (isOwner && !ownerSkipMode) ? (
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Building2 className="w-5 h-5 text-gold" />
                      Welcome, {displayName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Here's how to get the most out of the Developer Portal.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/60 rounded-xl p-4 border border-gold/20">
                        <div className="flex items-center gap-2 mb-2">
                          <FolderOpen className="w-5 h-5 text-gold" />
                          <h4 className="font-bold text-foreground text-sm">Submit Projects</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Upload brochures, renders, and fact sheets. Our system auto-generates listings.</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 border border-gold/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-gold" />
                          <h4 className="font-bold text-foreground text-sm">Event Invitations</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Invite our brokers to launches, open days, and exclusive previews.</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 border border-gold/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-5 h-5 text-gold" />
                          <h4 className="font-bold text-foreground text-sm">Request Briefings</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Once registered, schedule project briefings with our broker team.</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 border border-gold/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-5 h-5 text-gold" />
                          <h4 className="font-bold text-foreground text-sm">Track Listings</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Monitor your approved projects on our platform and report corrections.</p>
                      </div>
                    </div>

                    <div className="bg-gold/10 border-2 border-gold/30 rounded-xl p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">📋 Register Your Sales Team</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        To unlock briefing requests and direct messaging, register yourself or your sales representatives below.
                      </p>
                      <SalesRepRegistration
                        developerName={devName || 'Your Company'}
                        onRegistered={() => {
                          refetchRep();
                          toast.info('Your registration is now under review.');
                        }}
                      />
                    </div>
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
                  <Card className="border-2 border-gold/30">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                        <ClipboardList className="w-4 h-4 text-gold" /> Your Briefing Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {myBriefings.map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-gold/20 bg-card">
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
              <Card className="border-2 border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileSignature className="w-5 h-5 text-gold" /> Your Agreements & Documents
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Documents assigned to you for review or signature.</p>
                </CardHeader>
                <CardContent>
                  {myAgreements && myAgreements.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {myAgreements.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-gold/20 bg-card">
                            <div>
                              <h4 className="font-semibold text-foreground">{a.title}</h4>
                              <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "MMM d, yyyy")}</p>
                            </div>
                            <Badge className={
                              a.status === 'completed' ? 'bg-emerald-500/20 text-emerald-700' :
                              a.status === 'pending' ? 'bg-amber-500/20 text-amber-700' :
                              a.status === 'voided' ? 'bg-red-500/20 text-red-700' :
                              'bg-muted text-muted-foreground'
                            }>{a.status}</Badge>
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
              <Card className="border-2 border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <ListTodo className="w-5 h-5 text-gold" /> Your Tasks
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Tasks assigned to you by the team.</p>
                </CardHeader>
                <CardContent>
                  {myTasks && myTasks.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {myTasks.map((t: any) => (
                          <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-gold/20 bg-card">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-foreground truncate">{t.title}</h4>
                                {t.priority === 'high' && <Badge className="bg-red-500/20 text-red-700 text-[10px]">High</Badge>}
                                {t.priority === 'urgent' && <Badge className="bg-red-600/20 text-red-800 text-[10px]">Urgent</Badge>}
                              </div>
                              {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.description}</p>}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {format(new Date(t.created_at), "MMM d, yyyy")}
                                {t.due_date && ` · Due: ${format(new Date(t.due_date), "MMM d")}`}
                              </p>
                            </div>
                            <Badge className={
                              t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-700' :
                              t.status === 'in_progress' ? 'bg-blue-500/20 text-blue-700' :
                              t.status === 'pending' ? 'bg-amber-500/20 text-amber-700' :
                              'bg-muted text-muted-foreground'
                            }>{t.status?.replace(/_/g, ' ') || 'Pending'}</Badge>
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

            {/* OWNER: ALL INTEREST REGISTRATIONS */}
            {isOwner && (
              <TabsContent value="interest" className="mt-6">
                <Card className="border-2 border-gold/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Users className="w-5 h-5 text-gold" /> All Interest Registrations
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Everyone who expressed interest in upcoming launches.</p>
                  </CardHeader>
                  <CardContent>
                    {allInterests && allInterests.length > 0 ? (
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-3">
                          {allInterests.map((i: any) => (
                            <div key={i.id} className="p-4 rounded-xl border border-gold/20 bg-card">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h4 className="font-semibold text-foreground text-sm">{i.event_title}</h4>
                                  <p className="text-xs text-gold">{i.developer_name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {i.user_name} · {i.user_email}
                                    {i.user_phone && ` · ${i.user_phone}`}
                                  </p>
                                  {i.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{i.notes}"</p>}
                                  <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(i.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
                                </div>
                                <Badge className={
                                  i.interest_type === 'eoi' ? 'bg-emerald-500/20 text-emerald-700' :
                                  i.interest_type === 'private_tour' ? 'bg-blue-500/20 text-blue-700' :
                                  'bg-gold/20 text-gold'
                                }>{i.interest_type === 'eoi' ? 'EOI' : i.interest_type === 'private_tour' ? 'Private Tour' : 'General'}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="py-12 text-center text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p>No interest registrations yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* OWNER: MANAGE LAUNCHES & EVENTS */}
            {isOwner && (
              <TabsContent value="manage" className="mt-6">
                <Card className="border-2 border-gold/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Settings className="w-5 h-5 text-gold" /> Manage Launches & Events
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Search, filter, hide/show, and assign brokers to submissions.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search & Filter */}
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
                      <Button size="sm" variant="outline" onClick={() => setManageDateFilter("")} className="border-gold/30">
                        <X className="w-3 h-3 mr-1" /> Clear date filter
                      </Button>
                    )}

                    {/* Submissions list */}
                    {filteredSubmissions.length > 0 ? (
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-3">
                          {filteredSubmissions.map((s: any) => (
                            <div key={s.id} className={`p-4 rounded-xl border bg-card ${s.is_hidden ? 'opacity-50 border-muted' : 'border-gold/20'}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground text-sm">{s.event_title}</h4>
                                    <Badge className={s.submission_subtype === 'launch' ? 'bg-blue-500/20 text-blue-700' : 'bg-gold/20 text-gold'}>
                                      {s.submission_subtype === 'launch' ? 'Launch' : 'Event'}
                                    </Badge>
                                    {s.is_hidden && <Badge className="bg-muted text-muted-foreground text-[10px]">Hidden</Badge>}
                                  </div>
                                  <p className="text-xs text-gold font-medium">{s.developer_name}</p>
                                  {s.event_date && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      📅 {format(new Date(s.event_date), "EEEE, MMM d, yyyy 'at' h:mm a")}
                                    </p>
                                  )}
                                  {s.event_location && <p className="text-xs text-muted-foreground">📍 {s.event_location}</p>}
                                  {s.event_description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.event_description}</p>}
                                  {s.event_files && (s.event_files as any[]).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {(s.event_files as any[]).map((f: any, idx: number) => (
                                        <a key={idx} href={f.url} target="_blank" rel="noopener noreferrer"
                                          className="text-[10px] text-gold hover:underline flex items-center gap-1">
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
                                    className="border-gold/30 text-xs"
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
              </TabsContent>
            )}

            <TabsContent value="listings" className="mt-6">
              <Card className="border-2 border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Eye className="w-5 h-5 text-gold" /> Check Your Listings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">View your projects on the website. If anything is incorrect, let us know.</p>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
                  ) : myProjects && myProjects.filter((p: any) => p.status === 'approved').length > 0 ? (
                    <div className="space-y-3">
                      {myProjects.filter((p: any) => p.status === 'approved').map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gold/20 bg-card">
                          <div>
                            <h4 className="font-semibold text-foreground">{p.project_name}</h4>
                            <p className="text-xs text-muted-foreground">Approved · {format(new Date(p.created_at), "MMM d, yyyy")}</p>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/properties?search=${encodeURIComponent(p.project_name)}`}>
                              <Button size="sm" variant="outline" className="border-gold/30">
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

      {/* Register Interest Modal */}
      <Dialog open={interestModalOpen} onOpenChange={setInterestModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" /> Register Interest
            </DialogTitle>
            <DialogDescription>
              {selectedEvent?.event_title} by {selectedEvent?.developer_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">What type of interest?</Label>
              <RadioGroup value={interestType} onValueChange={setInterestType} className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gold/20 hover:border-gold/40 transition-colors">
                  <RadioGroupItem value="general" id="interest-general" />
                  <label htmlFor="interest-general" className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-foreground">General Interest</p>
                    <p className="text-xs text-muted-foreground">Keep me updated about this launch</p>
                  </label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gold/20 hover:border-gold/40 transition-colors">
                  <RadioGroupItem value="private_tour" id="interest-tour" />
                  <label htmlFor="interest-tour" className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-foreground">Private Tour</p>
                    <p className="text-xs text-muted-foreground">I'd like a private showing for my clients</p>
                  </label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-gold/20 hover:border-gold/40 transition-colors">
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
              className="w-full bg-gold text-black hover:bg-gold/90 font-bold h-11">
              {submittingInterest ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Star className="w-4 h-4 mr-2" /> Confirm Interest</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeveloperPortal;
