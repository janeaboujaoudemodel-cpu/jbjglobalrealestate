import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  FileText, Search, Upload, Star, Mail, Phone, Video, Calendar,
  Globe2, Briefcase, Clock, CheckCircle, XCircle, AlertTriangle,
  Flag, Eye, User, Building2, Camera, Megaphone, Code, Calculator,
  Loader2, ExternalLink, Download, MessageSquare, Brain, Sparkles,
  Target, HelpCircle, ThumbsUp, ThumbsDown, Zap, ChevronDown, ChevronUp,
  ArrowUpDown, MapPin,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { maybeProxyStorageUrl } from '@/utils/downloadProxy';

// Department categories with icons
const DEPARTMENT_CATEGORIES = [
  { id: 'all', label: 'All CVs', icon: FileText, color: 'text-gold' },
  { id: 'sales', label: 'Sales / Broker', icon: Briefcase, color: 'text-blue-400' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'text-orange-400' },
  { id: 'photography', label: 'Photography', icon: Camera, color: 'text-pink-400' },
  { id: 'videography', label: 'Videography', icon: Video, color: 'text-purple-400' },
  { id: 'digital_marketing', label: 'Digital Marketing', icon: Globe2, color: 'text-cyan-400' },
  { id: 'finance', label: 'Finance', icon: Calculator, color: 'text-green-400' },
  { id: 'hr', label: 'HR', icon: User, color: 'text-indigo-400' },
  { id: 'admin', label: 'Admin', icon: Building2, color: 'text-gray-400' },
  { id: 'tech', label: 'Tech / IT', icon: Code, color: 'text-emerald-400' },
  { id: 'general', label: 'Other', icon: FileText, color: 'text-zinc-400' },
];

const STATUS_TABS = [
  { id: 'all', label: 'All', icon: FileText, count: 0, color: 'bg-zinc-500' },
  { id: 'pending', label: 'Pending', icon: Clock, count: 0, color: 'bg-amber-500' },
  { id: 'approved', label: 'Accepted', icon: CheckCircle, count: 0, color: 'bg-green-500' },
  { id: 'rejected', label: 'Rejected', icon: XCircle, count: 0, color: 'bg-red-500' },
  { id: 'flagged', label: 'Flagged', icon: Flag, count: 0, color: 'bg-yellow-500' },
];

interface CVEntry {
  id: string;
  full_name: string;
  email: string;
  phone_e164: string | null;
  nationality: string | null;
  preferred_language: string | null;
  current_location_country: string | null;
  current_location_city: string | null;
  cv_url: string | null;
  status: string;
  department_category: string;
  ai_summary: string | null;
  ai_ranking: number;
  languages: string[];
  experience_years: number;
  skills: string[];
  flag_reason: string | null;
  source: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_id: string | null;
  record_source: 'hr_applications' | 'hr_cv_submissions';
  position_applied: string | null;
  is_viewed: boolean;
}

interface CVCenterProps {
  userId: string;
}

const CVCenter = ({ userId }: CVCenterProps) => {
  const [cvEntries, setCvEntries] = useState<CVEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [activeDeptCategory, setActiveDeptCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCV, setSelectedCV] = useState<CVEntry | null>(null);
  const [cvPreviewOpen, setCvPreviewOpen] = useState(false);
  const [cvPreviewUrl, setCvPreviewUrl] = useState<string | null>(null);
  const [cvDirectUrl, setCvDirectUrl] = useState<string | null>(null); // Raw signed URL for open/download fallback
  const [cvPreviewLoading, setCvPreviewLoading] = useState(false);
  const previewBlobUrlRef = useRef<string | null>(null);
  const [contactActionsOpen, setContactActionsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [adminMessageSubject, setAdminMessageSubject] = useState('');
  const [adminMessageBody, setAdminMessageBody] = useState('');
  const [aiRewritePrompt, setAiRewritePrompt] = useState('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [createTaskForUser, setCreateTaskForUser] = useState(false);
  const [approveTaskForUser, setApproveTaskForUser] = useState(false);
  const [candidateTaskTitle, setCandidateTaskTitle] = useState('');
  const [candidateTaskDescription, setCandidateTaskDescription] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score' | 'position'>('newest');
  const autoAnalyzeRef = useRef(false);

  // --- Auto-save composer drafts to survive page reloads ---
  const DRAFT_KEY = 'jbj_cv_composer_draft';
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.aiRewritePrompt) setAiRewritePrompt(d.aiRewritePrompt);
        if (d.adminMessageSubject) setAdminMessageSubject(d.adminMessageSubject);
        if (d.adminMessageBody) setAdminMessageBody(d.adminMessageBody);
        if (d.candidateTaskTitle) setCandidateTaskTitle(d.candidateTaskTitle);
        if (d.candidateTaskDescription) setCandidateTaskDescription(d.candidateTaskDescription);
        if (d.createTaskForUser) setCreateTaskForUser(true);
      }
    } catch { /* ignore */ }
  }, []);

  // Save drafts on change (debounced)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        const hasData = aiRewritePrompt || adminMessageSubject || adminMessageBody || candidateTaskTitle || candidateTaskDescription;
        if (hasData) {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ aiRewritePrompt, adminMessageSubject, adminMessageBody, candidateTaskTitle, candidateTaskDescription, createTaskForUser }));
        }
      } catch { /* ignore */ }
    }, 400);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [aiRewritePrompt, adminMessageSubject, adminMessageBody, candidateTaskTitle, candidateTaskDescription, createTaskForUser]);

  // Load CVs on mount
  useEffect(() => { fetchCVs(); }, []);

  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
    };
  }, []);

  const fetchCVs = async () => {
    setIsLoading(true);
    try {
      const [appsRes, subsRes] = await Promise.all([
        supabase.from('hr_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('hr_cv_submissions').select('*').order('created_at', { ascending: false }),
      ]);
      if (appsRes.error) throw appsRes.error;

      const fromApps: CVEntry[] = (appsRes.data || []).map((app: any) => ({
        id: app.id, full_name: app.full_name, email: app.email,
        phone_e164: app.phone_e164, nationality: app.nationality,
        preferred_language: app.preferred_language,
        current_location_country: app.current_location_country,
        current_location_city: app.current_location_city,
        cv_url: app.cv_url, status: app.status,
        department_category: detectDepartmentCategory(app),
        ai_summary: app.ai_summary || null,
        ai_ranking: app.ai_ranking || 0,
        languages: app.languages || [app.preferred_language].filter(Boolean),
        experience_years: app.experience_years || 0,
        skills: app.skills || [],
        flag_reason: app.flag_reason || detectFlagReason(app),
        source: app.source || 'careers_portal',
        created_at: app.created_at, reviewed_at: app.reviewed_at,
        reviewed_by: app.reviewed_by, user_id: app.user_id || null,
        record_source: 'hr_applications',
        position_applied: app.position_applied || null,
        is_viewed: app.is_viewed || false,
      }));

      const fromSubs: CVEntry[] = (subsRes.data || []).map((sub: any) => ({
        id: sub.id, full_name: sub.full_name, email: sub.email,
        phone_e164: sub.phone || null, nationality: null,
        preferred_language: null, current_location_country: null,
        current_location_city: null, cv_url: sub.cv_url,
        status: sub.status || 'pending',
        department_category: detectDepartmentCategory(sub),
        ai_summary: sub.ai_summary || null,
        ai_ranking: sub.ai_ranking || 0,
        languages: [], experience_years: 0, skills: [],
        flag_reason: !sub.cv_url ? 'No CV file uploaded' : null,
        source: 'chat_widget', created_at: sub.created_at,
        reviewed_at: sub.reviewed_at || null, reviewed_by: sub.reviewed_by || null,
        user_id: null, record_source: 'hr_cv_submissions',
        position_applied: sub.position_applied || null,
        is_viewed: sub.is_viewed || false,
        position_applied: sub.position_applied || null,
      }));

      const allCVs = [...fromApps, ...fromSubs];
      const emailMap = new Map<string, CVEntry>();
      for (const cv of allCVs) {
        const key = cv.email.toLowerCase();
        const existing = emailMap.get(key);
        if (!existing || new Date(cv.created_at) > new Date(existing.created_at)) {
          emailMap.set(key, cv);
        }
      }
      const merged = Array.from(emailMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setCvEntries(merged);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast.error('Failed to load CVs');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-analyze unscored CVs after initial load
  useEffect(() => {
    if (isLoading || autoAnalyzeRef.current || cvEntries.length === 0) return;
    const pendingAnalysis = cvEntries
      .map((cv) => {
        const hasNoScore = !cv.ai_ranking || cv.ai_ranking === 0;
        const markedUnreadable =
          /unreadable|corrupt|malformed/i.test(cv.ai_summary || '') ||
          /unreadable|corrupt|malformed/i.test(cv.flag_reason || '');
        // Also re-analyze CVs stuck at score 1 with the generic "limited" summary
        const stuckAtDefault =
          cv.ai_ranking === 1 &&
          /limited from.*extraction|manual HR review/i.test(cv.ai_summary || '');

        return { cv, markedUnreadable: markedUnreadable || stuckAtDefault, shouldAnalyze: hasNoScore || markedUnreadable || stuckAtDefault };
      })
      .filter((entry) => entry.shouldAnalyze);

    if (pendingAnalysis.length === 0) return;

    autoAnalyzeRef.current = true;
    // Run in background without blocking UI
    (async () => {
      let completed = 0;
      for (const { cv, markedUnreadable } of pendingAnalysis) {
        try {
          setAnalyzingIds(prev => new Set(prev).add(cv.id));
          const { data, error } = await supabase.functions.invoke('cv-ai-analyzer', {
            body: { applicationId: cv.id, source: cv.record_source, forceReanalyze: markedUnreadable },
          });
          if (!error && data?.success && data.analysis) {
            const a = data.analysis;
            setCvEntries(prev => prev.map(entry =>
              entry.id === cv.id ? {
                ...entry,
                experience_years: a.experience_years ?? entry.experience_years,
                languages: a.languages ?? entry.languages,
                skills: a.skills ?? entry.skills,
                ai_ranking: a.ai_ranking ?? entry.ai_ranking,
                ai_summary: a.ai_summary !== undefined ? a.ai_summary : entry.ai_summary,
                department_category: a.department_category ?? entry.department_category,
                flag_reason: a.flag_reason !== undefined ? a.flag_reason : entry.flag_reason,
              } : entry
            ));
            if (!a.already_analyzed || markedUnreadable) completed++;
          }
        } catch (err) {
          console.error(`Auto-analyze failed for ${cv.full_name}:`, err);
        } finally {
          setAnalyzingIds(prev => {
            const next = new Set(prev); next.delete(cv.id); return next;
          });
        }
      }
      if (completed > 0) {
        toast.success(`Auto-analyzed ${completed} new CV${completed > 1 ? 's' : ''}`);
      }
    })();
  }, [isLoading, cvEntries.length]);

  const detectDepartmentCategory = (app: any): string => {
    const text = `${app.full_name || ''} ${app.email || ''}`.toLowerCase();
    if (text.includes('marketing') || text.includes('social media')) return 'marketing';
    if (text.includes('photo') || text.includes('photographer')) return 'photography';
    if (text.includes('video') || text.includes('videographer')) return 'videography';
    if (text.includes('digital') || text.includes('seo') || text.includes('ads')) return 'digital_marketing';
    if (text.includes('broker') || text.includes('sales') || text.includes('agent')) return 'sales';
    if (text.includes('finance') || text.includes('account')) return 'finance';
    if (text.includes('hr') || text.includes('recruit')) return 'hr';
    if (text.includes('admin') || text.includes('office')) return 'admin';
    if (text.includes('developer') || text.includes('tech') || text.includes('it')) return 'tech';
    return app.department_category || 'general';
  };

  const detectFlagReason = (app: any): string | null => {
    const issues = [];
    if (!app.cv_url) issues.push('No CV file uploaded');
    if (!app.phone_e164) issues.push('Missing phone number');
    if (!app.email) issues.push('Missing email');
    return issues.length > 0 ? issues.join(', ') : null;
  };

  const dynamicCategories = useMemo(() => {
    const categorySet = new Set(cvEntries.map(cv => cv.department_category));
    return DEPARTMENT_CATEGORIES.filter(cat => cat.id === 'all' || categorySet.has(cat.id));
  }, [cvEntries]);

  const getScoreBreakdown = (cv: CVEntry) => {
    const exp = cv.experience_years >= 7 ? 4 : cv.experience_years >= 4 ? 3 : cv.experience_years >= 2 ? 2 : cv.experience_years > 0 ? 1 : 0;
    const lang = cv.languages.length >= 3 ? 3 : cv.languages.length >= 2 ? 2 : cv.languages.length >= 1 ? 1 : 0;
    const skills = cv.skills.length >= 6 ? 3 : cv.skills.length >= 3 ? 2 : cv.skills.length >= 1 ? 1 : 0;
    const base = exp + lang + skills;
    const final = cv.ai_ranking > 0 ? cv.ai_ranking : Math.max(1, base);
    const level = final >= 9 ? 'Elite' : final >= 7 ? 'Advanced' : final >= 5 ? 'Intermediate' : final >= 3 ? 'Developing' : 'Beginner';
    return { exp, lang, skills, final, level };
  };

  const filteredCVs = useMemo(() => {
    let filtered = cvEntries;
    if (activeStatusTab !== 'all') {
      if (activeStatusTab === 'flagged') {
        filtered = filtered.filter(cv => cv.flag_reason !== null);
      } else {
        filtered = filtered.filter(cv => cv.status === activeStatusTab);
      }
    }
    if (activeDeptCategory !== 'all') {
      filtered = filtered.filter(cv => cv.department_category === activeDeptCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cv =>
        cv.full_name.toLowerCase().includes(query) ||
        cv.email.toLowerCase().includes(query) ||
        (cv.nationality && cv.nationality.toLowerCase().includes(query)) ||
        cv.skills.some(s => s.toLowerCase().includes(query)) ||
        cv.languages.some(l => l.toLowerCase().includes(query))
      );
    }
    // Apply selected sort
    switch (sortBy) {
      case 'oldest':
        return filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'score':
        return filtered.sort((a, b) => getScoreBreakdown(b).final - getScoreBreakdown(a).final);
      case 'position':
        return filtered.sort((a, b) => a.department_category.localeCompare(b.department_category));
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [cvEntries, activeStatusTab, activeDeptCategory, searchQuery, sortBy]);

  const stats = useMemo(() => ({
    total: cvEntries.length,
    pending: cvEntries.filter(cv => cv.status === 'pending').length,
    approved: cvEntries.filter(cv => cv.status === 'approved').length,
    rejected: cvEntries.filter(cv => cv.status === 'rejected').length,
    flagged: cvEntries.filter(cv => cv.flag_reason !== null).length,
  }), [cvEntries]);

  /**
   * Resolves a cv_url (either a storage path or full URL) into:
   * - directUrl: raw signed/public URL for download / open-in-new-tab
   * - previewUrl: URL suitable for inline iframe preview (PDF/images/text only)
   */
  const resolvePreviewUrl = async (cvUrl: string | null): Promise<{ directUrl: string | null; previewUrl: string | null }> => {
    if (!cvUrl) return { directUrl: null, previewUrl: null };

    const normalizePath = (value: string) => {
      const trimmed = value.replace(/^\/+/, '');
      try {
        return decodeURIComponent(trimmed);
      } catch {
        return trimmed;
      }
    };

    const getExtension = (value: string) => {
      const cleanValue = value.split('?')[0].split('#')[0];
      const lastDot = cleanValue.lastIndexOf('.');
      return lastDot > -1 ? cleanValue.slice(lastDot + 1).toLowerCase() : '';
    };

    const canInlinePreview = (extension: string) => ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'rtf', 'svg'].includes(extension);

    const buildStoragePublicUrl = (bucket: string, path: string) => {
      const base = import.meta.env.VITE_SUPABASE_URL;
      if (!base) return null;
      const encodedPath = path.split('/').map(segment => encodeURIComponent(segment)).join('/');
      return `${base}/storage/v1/object/public/${bucket}/${encodedPath}`;
    };

    let directUrl: string | null = null;
    let storagePath: string | null = null;
    let sourceBucket: string | null = null;

    // Case 1: Full public storage URL — extract bucket + path
    const publicMatch = cvUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/i);
    // Case 2: Full signed URL — extract bucket + path
    const signedMatch = !publicMatch && cvUrl.match(/\/storage\/v1\/object\/sign\/([^/]+)\/(.+?)(?:\?|$)/i);

    if (publicMatch) {
      sourceBucket = publicMatch[1];
      storagePath = normalizePath(publicMatch[2]);
    } else if (signedMatch) {
      sourceBucket = signedMatch[1];
      storagePath = normalizePath(signedMatch[2]);
    } else if (/^https?:\/\//i.test(cvUrl)) {
      // Case 3: Non-storage full URL
      directUrl = cvUrl;
    } else {
      // Case 4: Relative path only (common in hr_applications)
      storagePath = normalizePath(cvUrl);
      sourceBucket = 'hr-documents';
    }

    // Generate signed URLs across common buckets in parallel (faster than sequential retries)
    if (storagePath) {
      const bucketCandidates = Array.from(
        new Set(
          [sourceBucket, 'hr-documents', 'documents', 'public'].filter((bucket): bucket is string => Boolean(bucket))
        )
      );

      const attempts = await Promise.all(
        bucketCandidates.map(async (bucket) => {
          const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath!, 3600);
          return { bucket, signedUrl: data?.signedUrl ?? null, error };
        })
      );

      const firstSuccess = attempts.find((attempt) => !!attempt.signedUrl);
      if (firstSuccess?.signedUrl) {
        directUrl = firstSuccess.signedUrl;
      } else {
        const fallbackBucket = bucketCandidates[0];
        directUrl = fallbackBucket ? buildStoragePublicUrl(fallbackBucket, storagePath) : null;
      }
    }

    if (!directUrl) return { directUrl: null, previewUrl: null };

    const extension = getExtension(storagePath || directUrl || cvUrl);

    // For doc/docx, use Google Docs Viewer for inline preview
    if (['doc', 'docx', 'odt'].includes(extension) && directUrl) {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(directUrl)}&embedded=true`;
      return { directUrl, previewUrl: googleViewerUrl };
    }

    const previewUrl = canInlinePreview(extension) ? directUrl : null;
    return { directUrl, previewUrl };
  };

  const handleUpdateStatus = async (cvId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    const target = cvEntries.find((entry) => entry.id === cvId);
    if (!target) return;
    try {
      const { error } = await supabase.from(target.record_source)
        .update({ status: newStatus, reviewed_at: new Date().toISOString(), reviewed_by: userId })
        .eq('id', cvId);
      if (error) throw error;

      setCvEntries(prev => prev.map(cv =>
        cv.id === cvId ? { ...cv, status: newStatus, reviewed_at: new Date().toISOString() } : cv
      ));
      toast.success(`CV marked as ${newStatus}`);

      // Send status email for pending/approved/rejected
      if (target.email && ['pending', 'approved', 'rejected'].includes(newStatus)) {
        const emailStatus = newStatus === 'pending' ? 'under_review' : newStatus;
        const pendingReviewNote = newStatus === 'pending'
          ? 'Your profile has been moved back to pending review for a deeper HR audit. Our team is reviewing your CV again and will update you shortly with the next step.'
          : undefined;

        const { error: emailError } = await supabase.functions.invoke('send-cv-status-email', {
          body: {
            email: target.email,
            fullName: target.full_name || 'Applicant',
            status: emailStatus,
            position: target.department_category || target.position_applied || 'General Application',
            userId: target.user_id || undefined,
            adminNote: pendingReviewNote,
          },
        });

        if (emailError) {
          console.error('CV email error:', emailError);
          toast.error('Status updated, but email delivery failed');
        }
      }
    } catch (error) {
      console.error('Error updating CV status:', error);
      toast.error('Failed to update CV status');
    }
  };

  const handleViewCV = async (cv: CVEntry) => {
    setSelectedCV(cv);
    setCvPreviewOpen(true);
    setCvPreviewLoading(true);
    setCvDirectUrl(null);
    setCvPreviewUrl(null);

    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = null;
    }

    try {
      const { directUrl, previewUrl } = await resolvePreviewUrl(cv.cv_url);
      setCvDirectUrl(directUrl);

      const inlineMimeAllowList = ['application/pdf', 'application/rtf'];
      const inlineExtAllowList = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'rtf', 'svg'];

      const loadPreviewBlob = async (url: string) => {
        const ext = (cv.cv_url || '').split('?')[0].split('.').pop()?.toLowerCase();

        // Try authenticated blob download first (bypasses CORS/auth issues)
        let rawPath = cv.cv_url?.replace(/^\/+/, '') || '';
        // Strip bucket prefix if present (e.g. "hr-documents/cv-uploads/file.pdf" → "cv-uploads/file.pdf")
        const knownBuckets = ['hr-documents', 'documents', 'public'];
        for (const b of knownBuckets) {
          if (rawPath.startsWith(`${b}/`)) {
            rawPath = rawPath.slice(b.length + 1);
            break;
          }
        }
        // Also strip full URL prefix if cv_url is a full URL
        const storageMatch = rawPath.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?|$)/i);
        if (storageMatch) {
          rawPath = storageMatch[2];
          try { rawPath = decodeURIComponent(rawPath); } catch {}
        }

        const buckets = ['hr-documents', 'documents', 'public'];
        let blob: Blob | null = null;

        for (const bucket of buckets) {
          const { data, error } = await supabase.storage.from(bucket).download(rawPath);
          if (!error && data) {
            blob = data;
            break;
          }
        }

        // Fallback to proxy fetch with auth header
        if (!blob) {
          const session = (await supabase.auth.getSession()).data.session;
          const previewSource = maybeProxyStorageUrl(url, {
            filename: `CV-${cv.full_name.replace(/\s+/g, '-')}`,
            disposition: 'inline',
          });
          const response = await fetch(previewSource, {
            headers: {
              Accept: 'application/pdf,image/*,text/*,*/*',
              ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
            },
          });
          if (!response.ok) throw new Error('Preview fetch failed');
          blob = await response.blob();
        }

        const contentType = (blob.type || '').toLowerCase();
        const isInlineMime = inlineMimeAllowList.some((mime) => contentType.includes(mime)) ||
          contentType.startsWith('image/') ||
          contentType.startsWith('text/');
        const isInlineExt = ext ? inlineExtAllowList.includes(ext) : false;

        if (!isInlineMime && !isInlineExt) {
          throw new Error('Not an inline-previewable mime type');
        }

        // Ensure correct MIME type for PDF blobs
        if ((ext === 'pdf' || contentType.includes('application/pdf')) && (!blob.type || blob.type === 'application/octet-stream')) {
          blob = new Blob([blob], { type: 'application/pdf' });
        }

        const objectUrl = URL.createObjectURL(blob);
        previewBlobUrlRef.current = objectUrl;
        setCvPreviewUrl(objectUrl);
      };

      if (previewUrl) {
        try {
          await loadPreviewBlob(previewUrl);
        } catch {
          // Fallback to direct preview URL when blob fetch is blocked (e.g. Google Docs viewer)
          setCvPreviewUrl(previewUrl);
        }
      } else if (directUrl) {
        try {
          await loadPreviewBlob(directUrl);
        } catch {
          setCvPreviewUrl(null);
        }
      } else {
        setCvPreviewUrl(null);
      }

      if (!directUrl && !previewUrl) toast.error('Unable to load CV preview');
    } catch (error) {
      console.error('CV preview error:', error);
      toast.error('Preview blocked by browser — try Open in new tab');
    } finally {
      setCvPreviewLoading(false);
    }
  };

  const handleAnalyzeCV = useCallback(async (cv: CVEntry, forceReanalyze: boolean = false) => {
    setAnalyzingIds(prev => new Set(prev).add(cv.id));
    try {
      const { data, error } = await supabase.functions.invoke('cv-ai-analyzer', {
        body: { applicationId: cv.id, source: cv.record_source, forceReanalyze },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Analysis failed');
      const a = data.analysis;
      setCvEntries(prev => prev.map(entry =>
        entry.id === cv.id ? {
          ...entry,
          experience_years: a.experience_years ?? entry.experience_years,
          languages: a.languages ?? entry.languages,
          skills: a.skills ?? entry.skills,
          ai_ranking: a.ai_ranking ?? entry.ai_ranking,
          ai_summary: a.ai_summary !== undefined ? a.ai_summary : entry.ai_summary,
          department_category: a.department_category ?? entry.department_category,
          flag_reason: a.flag_reason !== undefined ? a.flag_reason : entry.flag_reason,
        } : entry
      ));
      // Auto-expand the card to show results
      setExpandedCards(prev => new Set(prev).add(cv.id));
      toast.success(`Analysis complete for ${cv.full_name}`);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev); next.delete(cv.id); return next;
      });
    }
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const getScoreColor = (score: number) => 
    score >= 7 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    score >= 4 ? 'text-amber-600 bg-amber-50 border-amber-200' :
    'text-zinc-500 bg-zinc-50 border-zinc-200';

  const getRecommendationColor = (rec: string) =>
    rec === 'Strongly Recommend' ? 'text-emerald-600 border-emerald-300 bg-emerald-50' :
    rec === 'Recommend' ? 'text-green-600 border-green-300 bg-green-50' :
    rec === 'Consider' ? 'text-amber-600 border-amber-300 bg-amber-50' :
    'text-red-600 border-red-300 bg-red-50';

  const resetContactComposer = () => {
    setAdminMessageSubject('');
    setAdminMessageBody('');
    setAiRewritePrompt('');
    setCreateTaskForUser(false);
    setApproveTaskForUser(false);
    setCandidateTaskTitle('');
    setCandidateTaskDescription('');
    setCreatingTask(false);
    setIsGeneratingDraft(false);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
  };

  const openContactActions = (cv: CVEntry) => {
    setSelectedCV(cv);
    setContactActionsOpen(true);
  };

  const openEmailComposerFromContact = () => {
    setContactActionsOpen(false);
    setContactOpen(true);
  };

  const handleGenerateAiDraft = async () => {
    if (!selectedCV) return;

    const prompt = aiRewritePrompt.trim() || adminMessageBody.trim();
    if (!prompt) {
      toast.error('Describe what you need first');
      return;
    }

    setIsGeneratingDraft(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-email-generator', {
        body: {
          emailType: 'follow-up',
          context: {
            recipientName: selectedCV.full_name,
            language: selectedCV.preferred_language || 'English',
            tone: 'professional',
            purpose: 'Career application update',
            additionalContext: `Candidate: ${selectedCV.full_name}, position: ${selectedCV.position_applied || 'General'}\nAdmin request: ${prompt}`,
          },
        },
      });

      if (error) throw error;

      const generatedBody = [data?.greeting, data?.body, data?.callToAction, data?.closing, data?.signature]
        .filter(Boolean)
        .join('\n\n')
        .trim();

      setAdminMessageSubject(data?.subject || `Update on your application - ${selectedCV.full_name}`);
      setAdminMessageBody(generatedBody || data?.body || '');

      // Auto-generate task from email context
      if (createTaskForUser) {
        const posLabel = selectedCV.position_applied || 'Application';
        setCandidateTaskTitle((prev) => prev || `Action required: ${posLabel}`);
        const autoTaskDesc = `Please review the email regarding your ${posLabel} at JBJ Global Real Estate and follow the instructions provided.`;
        setCandidateTaskDescription((prev) => prev || autoTaskDesc);
        setApproveTaskForUser(true); // Show approval step
      }

      toast.success('AI draft generated — review and approve');
    } catch (err) {
      console.error('AI draft generation failed:', err);
      toast.error('Could not generate AI draft');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleCreateTaskForCandidate = async (cv: CVEntry) => {
    if (!createTaskForUser) return;

    if (!cv.user_id) {
      toast.info('Task skipped: this candidate has no linked account yet');
      return;
    }

    const taskTitle = candidateTaskTitle.trim() || `Action required: ${cv.position_applied || 'Career application'}`;
    const taskDescription = candidateTaskDescription.trim() || adminMessageBody.trim() || 'Please review the latest message from HR.';

    setCreatingTask(true);
    const { error } = await supabase.functions.invoke('create-user-alert', {
      body: {
        task: {
          user_id: cv.user_id,
          title: taskTitle,
          description: taskDescription,
          category: 'cv_application',
          priority: 'high',
        },
        notification: {
          user_id: cv.user_id,
          type: 'cv_application',
          title: 'New HR Task',
          message: taskTitle,
          metadata: { cv_id: cv.id, source: 'cv_center', action_url: '/my-account#tasks' },
        },
      },
    });

    if (error) {
      setCreatingTask(false);
      throw error;
    }

    setCreatingTask(false);
    toast.success('Task added for candidate');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-white rounded-xl border border-crm-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-crm-text flex items-center gap-3">
            <FileText className="h-7 w-7 text-gold" />
            CV Center
          </h2>
          <p className="text-crm-text-muted mt-1">
            AI-powered candidate scoring & management — analysis runs automatically
          </p>
        </div>
        <div>
          <input
            type="file"
            id="cv-upload-input"
            accept=".pdf,.doc,.docx,.txt"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              let uploaded = 0;
              for (const file of Array.from(files)) {
                try {
                  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
                  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                  const storagePath = `cv-uploads/${safeName}`;
                  const { error: uploadErr } = await supabase.storage.from('hr-documents').upload(storagePath, file, { upsert: false });
                  if (uploadErr) { console.error('Upload error:', uploadErr); toast.error(`Failed to upload ${file.name}`); continue; }
                  const { data: urlData } = supabase.storage.from('hr-documents').getPublicUrl(storagePath);
                  const cvUrl = urlData?.publicUrl || storagePath;
                  const nameFromFile = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
                  const { error: insertErr } = await supabase.from('hr_cv_submissions').insert({
                    full_name: nameFromFile || 'Unnamed',
                    email: `upload-${Date.now()}@pending-review.local`,
                    cv_url: cvUrl,
                    status: 'pending',
                    position_applied: 'Unspecified',
                  });
                  if (insertErr) { console.error('Insert error:', insertErr); toast.error(`Failed to save ${file.name}`); continue; }
                  uploaded++;
                } catch (err) { console.error('Upload error:', err); toast.error(`Error uploading ${file.name}`); }
              }
              if (uploaded > 0) { toast.success(`${uploaded} CV${uploaded > 1 ? 's' : ''} uploaded`); fetchCVs(); }
              e.target.value = '';
            }}
          />
          <Button
            className="gap-2 bg-gold text-white hover:bg-gold-dark font-semibold"
            onClick={() => document.getElementById('cv-upload-input')?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload CV
          </Button>
        </div>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === 'all' ? stats.total :
                       tab.id === 'flagged' ? stats.flagged :
                       stats[tab.id as keyof typeof stats] || 0;
          const IconComponent = tab.icon;
          return (
            <Card
              key={tab.id}
              className={`bg-white border cursor-pointer hover:shadow-md transition-all ${
                activeStatusTab === tab.id ? 'border-gold ring-2 ring-gold/20' : 'border-crm-border'
              }`}
              onClick={() => setActiveStatusTab(tab.id)}
            >
              <CardContent className="p-4 text-center">
                <IconComponent className={`h-5 w-5 mx-auto mb-2 ${
                  tab.id === 'pending' ? 'text-amber-500' : tab.id === 'approved' ? 'text-green-500' :
                  tab.id === 'rejected' ? 'text-red-500' : tab.id === 'flagged' ? 'text-yellow-500' : 'text-gold'
                }`} />
                <p className="text-xl font-bold text-crm-text">{count}</p>
                <p className="text-xs text-crm-text-muted font-medium">{tab.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Department Categories */}
      <Card className="bg-white border border-crm-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-crm-text-muted">Categories</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {dynamicCategories.map((cat) => {
              const count = cat.id === 'all' ? cvEntries.length : cvEntries.filter(cv => cv.department_category === cat.id).length;
              const IconComponent = cat.icon;
              return (
                <Badge
                  key={cat.id}
                  variant={activeDeptCategory === cat.id ? 'default' : 'outline'}
                  className={`cursor-pointer px-3 py-2 ${
                    activeDeptCategory === cat.id ? 'bg-gold text-white border-gold' : 'hover:bg-gold/10 border-crm-border text-crm-text'
                  }`}
                  onClick={() => setActiveDeptCategory(cat.id)}
                >
                  <IconComponent className={`h-3 w-3 mr-2 ${cat.color}`} />
                  {cat.label} ({count})
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search + Sort */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-crm-text-muted" />
          <Input
            placeholder="Search by name, email, nationality, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-crm-border text-crm-text placeholder:text-crm-text-muted focus:ring-2 focus:ring-gold/30 focus:border-gold"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px] bg-white border-crm-border text-crm-text">
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-crm-text-muted" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="score">Highest Score</SelectItem>
            <SelectItem value="position">By Position</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* CV List */}
      <Card className="bg-white border border-crm-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-crm-text">
            <FileText className="h-5 w-5 text-gold" />
            {filteredCVs.length} Candidates
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : (
            <ScrollArea className="h-[700px]">
              <div className="space-y-4">
                {filteredCVs.map((cv) => {
                  const score = getScoreBreakdown(cv);
                  const isAnalyzed = cv.ai_ranking > 0;
                  const isAnalyzing = analyzingIds.has(cv.id);
                  const isExpanded = expandedCards.has(cv.id);
                  const hasUnreadableSummary = /unreadable|corrupt|malformed/i.test(cv.ai_summary || '');

                  return (
                    <Card key={cv.id} className="bg-gradient-to-r from-zinc-50 to-white border border-crm-border hover:border-gold/50 hover:shadow-md transition-all">
                      <CardContent className="p-5">
                        {/* === QUICK SUMMARY (always visible) === */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4 flex-1">
                            <Avatar className="h-14 w-14 border-2 border-gold/30 flex-shrink-0">
                              <AvatarFallback className="bg-gold/10 text-gold font-bold text-lg">
                                {cv.full_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              {/* Name & Score row */}
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-lg font-bold text-crm-text">{cv.full_name}</h4>
                                {isAnalyzing ? (
                                  <Badge className="bg-purple-100 text-purple-700 border-purple-300 animate-pulse">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyzing...
                                  </Badge>
                                ) : isAnalyzed ? (
                                  <Badge className={`${getScoreColor(score.final)} font-bold px-3 py-1`}>
                                    <Star className="h-3.5 w-3.5 mr-1 fill-current" />
                                    {score.final}/10 · {score.level}
                                  </Badge>
                                ) : null}
                                {cv.status === 'approved' && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Accepted</Badge>}
                                {cv.status === 'rejected' && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>}
                                {cv.status === 'pending' && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending Review</Badge>}
                              </div>

                              {/* Quick info pills */}
                              <div className="flex flex-wrap gap-2 mb-2 text-sm">
                                {cv.position_applied && cv.position_applied !== 'Unspecified' && (
                                  <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-0.5 font-medium">
                                    <Target className="h-3.5 w-3.5" /> {cv.position_applied}
                                  </span>
                                )}
                                {DEPARTMENT_CATEGORIES.find(c => c.id === cv.department_category) && cv.department_category !== 'general' && (
                                  <span className="flex items-center gap-1 text-crm-text bg-zinc-100 border border-zinc-200 rounded-full px-2.5 py-0.5 font-medium">
                                    <Building2 className="h-3.5 w-3.5 text-crm-text-muted" /> {DEPARTMENT_CATEGORIES.find(c => c.id === cv.department_category)?.label}
                                  </span>
                                )}
                                {cv.nationality && (
                                  <span className="flex items-center gap-1 text-crm-text">
                                    <Globe2 className="h-3.5 w-3.5 text-crm-text-muted" /> {cv.nationality}
                                  </span>
                                )}
                                {cv.languages.length > 0 && (
                                  <span className="flex items-center gap-1 text-crm-text">
                                    <MessageSquare className="h-3.5 w-3.5 text-crm-text-muted" /> {cv.languages.join(', ')}
                                  </span>
                                )}
                                {cv.experience_years > 0 && (
                                  <span className="flex items-center gap-1 text-crm-text">
                                    <Briefcase className="h-3.5 w-3.5 text-crm-text-muted" /> {cv.experience_years} yr{cv.experience_years !== 1 ? 's' : ''} exp
                                  </span>
                                )}
                                {cv.current_location_city && (
                                  <span className="flex items-center gap-1 text-crm-text">
                                    <MapPin className="h-3.5 w-3.5 text-crm-text-muted" /> {cv.current_location_city}{cv.current_location_country ? `, ${cv.current_location_country}` : ''}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-crm-text-muted text-xs">
                                  <Calendar className="h-3 w-3" /> {format(new Date(cv.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                              {/* Contact details on surface */}
                              <div className="flex flex-wrap gap-3 mb-2 text-xs text-crm-text-muted">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" /> {cv.email}
                                </span>
                                {cv.phone_e164 && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" /> {cv.phone_e164}
                                  </span>
                                )}
                              </div>

                              {/* AI Summary - compact */}
                              {cv.ai_summary && !hasUnreadableSummary && (
                                <p className="text-sm text-crm-text bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
                                  <Sparkles className="h-3.5 w-3.5 inline mr-1 text-amber-500" />
                                  {cv.ai_summary}
                                </p>
                              )}

                              {hasUnreadableSummary && (
                                <p className="text-sm text-crm-text bg-zinc-50 border border-zinc-200 rounded-md px-3 py-2 mb-2">
                                  <Sparkles className="h-3.5 w-3.5 inline mr-1 text-zinc-500" />
                                  AI summary is being regenerated for better readability.
                                </p>
                              )}

                              {/* Skills tags */}
                              {cv.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {cv.skills.slice(0, 5).map((s, i) => (
                                    <Badge key={i} variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">{s}</Badge>
                                  ))}
                                  {cv.skills.length > 5 && (
                                    <Badge variant="outline" className="text-xs text-crm-text-muted">+{cv.skills.length - 5}</Badge>
                                  )}
                                </div>
                              )}

                              {/* Flag warning */}
                              {cv.flag_reason && (
                                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-1.5 text-sm">
                                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                  {cv.flag_reason}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {!isAnalyzed && !isAnalyzing && (
                              <Button
                                size="sm"
                                onClick={() => handleAnalyzeCV(cv)}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg px-4 py-2 transition-all hover:scale-105"
                              >
                                <Brain className="h-4 w-4 mr-1.5" /> Analyze
                              </Button>
                            )}
                            {isAnalyzed && (
                              <Button
                                size="sm" variant="outline"
                                onClick={() => handleAnalyzeCV(cv, true)}
                                disabled={isAnalyzing}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50 text-xs"
                              >
                                {isAnalyzing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Brain className="h-3 w-3 mr-1" />}
                                Re-Analyze
                              </Button>
                            )}
                            <Button size="sm" onClick={() => handleViewCV(cv)} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold shadow-lg px-4 py-2">
                              <Eye className="h-4 w-4 mr-1.5" /> View CV
                            </Button>
                            <Button size="sm" onClick={() => openContactActions(cv)} className="bg-gold hover:bg-gold-dark text-white font-bold px-4 py-2">
                              <Mail className="h-4 w-4 mr-1.5" /> Contact
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCV(cv);
                                setCreateTaskForUser(true);
                                setCandidateTaskTitle(`Follow up: ${cv.position_applied || 'Career application'}`);
                                setCandidateTaskDescription(`Please review the latest update regarding your ${cv.position_applied || 'application'}.`);
                                setContactOpen(true);
                              }}
                              className="text-gold border-gold/40 hover:bg-gold/10 font-semibold"
                            >
                              <Flag className="h-4 w-4 mr-1.5" /> Add Task
                            </Button>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              {cv.status !== 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(cv.id, 'approved')}
                                className="flex-1 rounded-xl border font-bold border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                              </Button>
                              )}
                              {cv.status !== 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(cv.id, 'pending')}
                                className="flex-1 rounded-xl border font-bold border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100"
                              >
                                <Clock className="h-3.5 w-3.5 mr-1" /> Pending
                              </Button>
                              )}
                              {cv.status !== 'rejected' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(cv.id, 'rejected')}
                                className="flex-1 rounded-xl border font-bold border-red-500 bg-red-50 text-red-700 hover:bg-red-100"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                              </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* === EXPANDABLE ADVANCED DETAILS === */}
                        {isAnalyzed && (
                          <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(cv.id)}>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full mt-3 text-crm-text-muted hover:text-crm-text gap-2 text-xs">
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {isExpanded ? 'Hide' : 'Show'} Advanced Analysis
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-3 pt-3 border-t border-crm-border space-y-3">
                                {/* Score breakdown bar */}
                                <div className="grid grid-cols-3 gap-4">
                                  {[
                                    { label: 'Experience', value: score.exp, max: 4, icon: Briefcase },
                                    { label: 'Languages', value: score.lang, max: 3, icon: Globe2 },
                                    { label: 'Skills', value: score.skills, max: 3, icon: Zap },
                                  ].map(item => (
                                    <div key={item.label} className="text-center">
                                      <div className="flex items-center justify-center gap-1 mb-1">
                                        <item.icon className="h-3.5 w-3.5 text-crm-text-muted" />
                                        <span className="text-xs font-medium text-crm-text-muted">{item.label}</span>
                                      </div>
                                      <div className="bg-zinc-200 rounded-full h-2 mb-1">
                                        <div
                                          className={`h-2 rounded-full ${item.value >= item.max * 0.7 ? 'bg-emerald-500' : item.value >= item.max * 0.4 ? 'bg-amber-500' : 'bg-red-400'}`}
                                          style={{ width: `${(item.value / item.max) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-crm-text">{item.value}/{item.max}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Contact info - clickable actions */}
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 gap-1.5 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const subject = encodeURIComponent(`Interview Invitation – JBJ Global Real Estate`);
                                      const body = encodeURIComponent(`Dear ${cv.full_name},\n\nThank you for your application to JBJ Global Real Estate.\n\nBest regards,\nJBJ Global Real Estate HR Team`);
                                      window.location.href = `mailto:${cv.email}?subject=${subject}&body=${body}`;
                                    }}
                                  >
                                    <Mail className="h-3 w-3" /> {cv.email}
                                  </Button>
                                  {cv.phone_e164 && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 gap-1.5 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const clean = cv.phone_e164!.replace(/[^0-9]/g, '');
                                          const msg = encodeURIComponent(`Hello ${cv.full_name}, this is JBJ Global Real Estate HR. We would like to discuss your application.`);
                    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank', 'noopener');
                        }}
                      >
                        <MessageSquare className="h-3 w-3" /> WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`tel:${cv.phone_e164}`, '_self');
                        }}
                      >
                        <Phone className="h-3 w-3" /> Call
                      </Button>
                                    </>
                                  )}
                                  {!cv.phone_e164 && (
                                    <span className="text-xs text-crm-text-muted flex items-center gap-1">
                                      <Phone className="h-3 w-3" /> No phone
                                    </span>
                                  )}
                                </div>

                                {/* Category & Source */}
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline" className="text-xs border-crm-border text-crm-text-muted">
                                    {DEPARTMENT_CATEGORIES.find(c => c.id === cv.department_category)?.label || cv.department_category}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs border-crm-border text-crm-text-muted">
                                    Source: {cv.source}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs border-crm-border text-crm-text-muted">
                                    CV: {cv.cv_url ? 'Uploaded' : 'Not uploaded'}
                                  </Badge>
                                </div>

                                {/* Schedule interview from expanded view */}
                                <Button
                                  size="sm" variant="outline"
                                  onClick={() => { setSelectedCV(cv); setScheduleOpen(true); }}
                                  className="gap-2 text-gold border-gold/30 hover:bg-gold/10"
                                >
                                  <Video className="h-4 w-4" /> Schedule Interview
                                </Button>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredCVs.length === 0 && !isLoading && (
                  <div className="py-16 text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-crm-text-muted opacity-30" />
                    <p className="text-crm-text-muted text-lg font-medium">No CVs found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={cvPreviewOpen} onOpenChange={setCvPreviewOpen}>
        <DialogContent className="max-w-6xl h-[85vh]" aria-describedby="cv-preview-desc">
          <DialogHeader>
            <DialogTitle>CV Preview {selectedCV ? `· ${selectedCV.full_name}` : ''}</DialogTitle>
            <p id="cv-preview-desc" className="sr-only">Preview of the candidate's CV document</p>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {cvPreviewLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
            ) : cvPreviewUrl ? (
              <iframe title="CV Preview" src={cvPreviewUrl} className="w-full h-full rounded-md border" />
            ) : cvDirectUrl ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
                <FileText className="h-16 w-16 text-gold/40" />
                <p className="text-lg font-medium text-foreground">This file format cannot be previewed inline.</p>
                <p>Use the buttons below to open or download the CV.</p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-12 w-12 text-amber-400" />
                <p className="text-lg font-medium text-foreground">Unable to load CV</p>
                <p>The file may have been moved or deleted. Try re-uploading.</p>
              </div>
            )}
          </div>
          {cvDirectUrl && (
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" className="gap-2" onClick={() => {
                // Use blob URL if available (avoids cross-origin blocking), otherwise proxy with inline disposition
                const url = cvPreviewUrl || maybeProxyStorageUrl(cvDirectUrl, { disposition: 'inline' });
                window.open(url, '_blank');
              }}>
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </Button>
              <Button variant="outline" className="gap-2" onClick={async () => {
                try {
                  const filename = selectedCV ? `CV-${selectedCV.full_name.replace(/\s+/g, '-')}.pdf` : 'CV.pdf';
                  const session = (await supabase.auth.getSession()).data.session;
                  const proxyUrl = maybeProxyStorageUrl(cvDirectUrl, filename);
                  const res = await fetch(proxyUrl, {
                    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
                  });
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success('Download started');
                } catch {
                  toast.error('Download failed — try "Open in new tab" instead');
                }
              }}>
                <Download className="h-4 w-4" /> Download
              </Button>
              {cvPreviewUrl && (
                <Button variant="outline" className="gap-2 ml-auto" onClick={() => {
                  const win = window.open('', '_blank');
                  if (win) {
                    win.document.write(`<!DOCTYPE html><html><head><title>CV - ${selectedCV?.full_name || 'Preview'}</title><style>body{margin:0;overflow:hidden}iframe{width:100vw;height:100vh;border:none}</style></head><body><iframe src="${cvPreviewUrl}"></iframe></body></html>`);
                    win.document.close();
                  }
                }}>
                  <Eye className="h-4 w-4" /> Maximize
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Actions Dialog */}
      <Dialog open={contactActionsOpen} onOpenChange={setContactActionsOpen}>
        <DialogContent className="max-w-md" aria-describedby="contact-actions-desc">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-gold" /> Candidate Contact Options
            </DialogTitle>
          </DialogHeader>
          <p id="contact-actions-desc" className="sr-only">Choose how to contact this candidate</p>
          {selectedCV && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-zinc-50 border text-sm">
                <p className="font-semibold text-crm-text">{selectedCV.full_name}</p>
                <p className="text-crm-text-muted">{selectedCV.email}</p>
                <p className="text-crm-text-muted">{selectedCV.phone_e164 || 'No phone number available'}</p>
              </div>

              <Button className="w-full bg-gold hover:bg-gold-dark text-white font-bold" onClick={openEmailComposerFromContact}>
                <Mail className="h-4 w-4 mr-2" /> Send Email
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  disabled={!selectedCV.phone_e164}
                  className="border-green-500/40 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    if (!selectedCV.phone_e164) return;
                    const clean = selectedCV.phone_e164.replace(/[^0-9]/g, '');
                    const msg = encodeURIComponent(`Hello ${selectedCV.full_name}, this is JBJ Global Real Estate HR.`);
                    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank', 'noopener');
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-1.5" /> WhatsApp
                </Button>

                <Button
                  variant="outline"
                  disabled={!selectedCV.phone_e164}
                  className="border-amber-500/40 text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    if (!selectedCV.phone_e164) return;
                    window.open(`tel:${selectedCV.phone_e164}`, '_self');
                  }}
                >
                  <Phone className="h-4 w-4 mr-1.5" /> Call
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Dialog - AI Rewrite + Approval + Send */}
      <Dialog open={contactOpen} onOpenChange={(open) => {
        setContactOpen(open);
        if (!open) resetContactComposer();
      }}>
        <DialogContent className="max-w-xl" aria-describedby="contact-desc">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-gold" /> Message Candidate</DialogTitle></DialogHeader>
          <p id="contact-desc" className="sr-only">Describe the message, let AI rewrite it, approve, then send automatically.</p>
          {selectedCV && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border">
                <Avatar className="h-10 w-10 border border-gold/30">
                  <AvatarFallback className="bg-gold/10 text-gold font-bold">{selectedCV.full_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-crm-text">{selectedCV.full_name}</p>
                  <p className="text-xs text-crm-text-muted">{selectedCV.email}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-crm-text">Describe what you need (AI will rewrite)</Label>
                <Textarea
                  value={aiRewritePrompt}
                  onChange={(e) => setAiRewritePrompt(e.target.value)}
                  placeholder="Example: Tell the candidate we need an updated CV and available interview slots this week"
                  className="mt-1 min-h-[90px]"
                  rows={4}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-2 gap-2 border-gold/40 text-gold hover:bg-gold/10"
                  onClick={handleGenerateAiDraft}
                  disabled={isGeneratingDraft}
                >
                  {isGeneratingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  AI Rewrite Draft
                </Button>
              </div>

              <div>
                <Label className="text-sm font-medium text-crm-text">Subject</Label>
                <Input
                  value={adminMessageSubject}
                  onChange={(e) => setAdminMessageSubject(e.target.value)}
                  placeholder="e.g. Update on Your Application"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-crm-text">Approved Email Body</Label>
                <Textarea
                  value={adminMessageBody}
                  onChange={(e) => setAdminMessageBody(e.target.value)}
                  placeholder="Review and edit the final message before sending..."
                  className="mt-1 min-h-[140px]"
                  rows={7}
                />
              </div>

              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-crm-text">Add task for candidate</p>
                    <p className="text-xs text-crm-text-muted">Creates a pending task in the candidate's account.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant={createTaskForUser ? 'default' : 'outline'}
                    onClick={() => { setCreateTaskForUser((v) => !v); setApproveTaskForUser(false); }}
                    className={createTaskForUser ? 'bg-gold text-black hover:bg-gold/90' : 'border-gold/40 text-gold hover:bg-gold/10'}
                  >
                    {createTaskForUser ? 'Task ON' : 'Enable Task'}
                  </Button>
                </div>

                {createTaskForUser && (
                  <div className="space-y-2">
                    <Input
                      value={candidateTaskTitle}
                      onChange={(e) => setCandidateTaskTitle(e.target.value)}
                      placeholder="Task title (auto-generated from email context)"
                    />
                    <Textarea
                      value={candidateTaskDescription}
                      onChange={(e) => setCandidateTaskDescription(e.target.value)}
                      placeholder="Task instructions for the candidate (auto-generated)"
                      rows={3}
                    />
                    {approveTaskForUser && (
                      <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 border border-amber-200">
                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        <span className="text-xs text-amber-700 flex-1">Review the task above before sending. Approve?</span>
                        <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-7 px-3 text-xs" onClick={() => setApproveTaskForUser(false)}>
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve Task
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-red-300 text-red-600 hover:bg-red-50" onClick={() => { setCreateTaskForUser(false); setApproveTaskForUser(false); }}>
                          Skip Task
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs text-crm-text-muted">
                Feedback links are appended automatically to the sent email.
              </p>

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gold hover:bg-gold/90 text-black font-bold"
                  disabled={!adminMessageSubject.trim() || !adminMessageBody.trim() || sendingMessage || isGeneratingDraft || creatingTask || approveTaskForUser}
                  onClick={async () => {
                    if (!selectedCV) return;
                    setSendingMessage(true);
                    try {
                      await handleCreateTaskForCandidate(selectedCV);

                      const { error } = await supabase.functions.invoke('send-admin-message', {
                        body: {
                          recipientEmail: selectedCV.email,
                          recipientName: selectedCV.full_name,
                          subject: adminMessageSubject.trim(),
                          message: adminMessageBody.trim(),
                          serviceCategory: 'career',
                          referenceId: selectedCV.id,
                          referenceLabel: selectedCV.position_applied || 'Career Application',
                          userId: selectedCV.user_id || undefined,
                        },
                      });
                      if (error) throw error;

                      toast.success(`Email approved and sent to ${selectedCV.full_name}`);
                      setContactOpen(false);
                      resetContactComposer();
                    } catch (err: any) {
                      console.error('Send message error:', err);
                      toast.error(err?.message || 'Failed to send message');
                    } finally {
                      setSendingMessage(false);
                      setCreatingTask(false);
                    }
                  }}
                >
                  {(sendingMessage || creatingTask) ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                  Approve & Send Email
                </Button>
                {selectedCV.phone_e164 && (
                  <Button size="icon" variant="outline" title="WhatsApp" onClick={() => window.open(`https://wa.me/${(selectedCV.phone_e164 || '').replace(/[^0-9]/g, '')}`, '_blank', 'noopener')}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                )}
                {selectedCV.phone_e164 && (
                  <Button size="icon" variant="outline" title="Call" onClick={() => window.open(`tel:${selectedCV.phone_e164}`, '_self')}>
                    <Phone className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg" aria-describedby="schedule-desc">
          <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
          <p id="schedule-desc" className="sr-only">Schedule an interview with the selected candidate</p>
          {selectedCV && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{selectedCV.full_name}</div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} /></div>
                <div><Label>Time</Label><Input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} placeholder="Interview notes" /></div>
              <Button onClick={async () => {
                if (!selectedCV || !interviewDate || !interviewTime) { toast.error('Please select date and time'); return; }
                const updatedStatus = selectedCV.record_source === 'hr_applications' ? 'approved' : 'under_review';
                const { error } = await supabase.from(selectedCV.record_source).update({ status: updatedStatus, reviewed_at: new Date().toISOString(), reviewed_by: userId }).eq('id', selectedCV.id);
                if (error) { toast.error('Failed to save interview schedule'); return; }
                setCvEntries(prev => prev.map(cv => cv.id === selectedCV.id ? { ...cv, status: updatedStatus } : cv));
                setScheduleOpen(false);
                toast.success(`Interview scheduled for ${selectedCV.full_name}`);
              }} className="w-full gap-2"><Video className="h-4 w-4" /> Confirm Schedule</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVCenter;
