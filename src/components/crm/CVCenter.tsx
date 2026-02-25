import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
  const [cvDirectUrl, setCvDirectUrl] = useState<string | null>(null); // Raw signed URL for "open in new tab" / download
  const [cvPreviewLoading, setCvPreviewLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const autoAnalyzeRef = useRef(false);

  useEffect(() => { fetchCVs(); }, []);

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
    const unscored = cvEntries.filter(cv => !cv.ai_ranking || cv.ai_ranking === 0);
    if (unscored.length === 0) return;

    autoAnalyzeRef.current = true;
    // Run in background without blocking UI
    (async () => {
      let completed = 0;
      for (const cv of unscored) {
        try {
          setAnalyzingIds(prev => new Set(prev).add(cv.id));
          const { data, error } = await supabase.functions.invoke('cv-ai-analyzer', {
            body: { applicationId: cv.id, source: cv.record_source },
          });
          if (!error && data?.success && data.analysis && !data.analysis.already_analyzed) {
            const a = data.analysis;
            setCvEntries(prev => prev.map(entry =>
              entry.id === cv.id ? {
                ...entry,
                experience_years: a.experience_years ?? entry.experience_years,
                languages: a.languages ?? entry.languages,
                skills: a.skills ?? entry.skills,
                ai_ranking: a.ai_ranking ?? entry.ai_ranking,
                ai_summary: a.ai_summary ?? entry.ai_summary,
                department_category: a.department_category ?? entry.department_category,
                flag_reason: a.flag_reason ?? entry.flag_reason,
              } : entry
            ));
            completed++;
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
    return filtered.sort((a, b) => getScoreBreakdown(b).final - getScoreBreakdown(a).final);
  }, [cvEntries, activeStatusTab, activeDeptCategory, searchQuery]);

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

    const canInlinePreview = (extension: string) => ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt'].includes(extension);

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
      directUrl = firstSuccess?.signedUrl ?? null;
    }

    if (!directUrl) return { directUrl: null, previewUrl: null };

    // Avoid external office viewers in iframe to prevent browser security blocking.
    // Inline preview only when browser can render directly.
    const extension = getExtension(storagePath || directUrl || cvUrl);
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

      // Send status email to the applicant
      if (target.email && (newStatus === 'approved' || newStatus === 'rejected')) {
        supabase.functions.invoke('send-cv-status-email', {
          body: {
            email: target.email,
            fullName: target.full_name || 'Applicant',
            status: newStatus,
            position: target.department_category || 'General Application',
            userId: target.user_id || undefined,
          },
        }).catch(err => console.error('CV email error:', err));
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
    const { directUrl, previewUrl } = await resolvePreviewUrl(cv.cv_url);
    setCvDirectUrl(directUrl);
    setCvPreviewUrl(previewUrl);
    setCvPreviewLoading(false);
    if (!directUrl && !previewUrl) toast.error('Unable to load CV preview');
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
          ai_summary: a.ai_summary ?? entry.ai_summary,
          department_category: a.department_category ?? entry.department_category,
          flag_reason: a.flag_reason ?? entry.flag_reason,
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
        <Button className="gap-2 bg-gold text-white hover:bg-gold-dark font-semibold">
          <Upload className="h-4 w-4" />
          Upload CV
        </Button>
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-crm-text-muted" />
        <Input
          placeholder="Search by name, email, nationality, skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-crm-border text-crm-text placeholder:text-crm-text-muted focus:ring-2 focus:ring-gold/30 focus:border-gold"
        />
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
                                {cv.nationality && (
                                  <span className="flex items-center gap-1 text-crm-text">
                                    <Globe2 className="h-3.5 w-3.5 text-crm-text-muted" /> {cv.nationality}
                                  </span>
                                )}
                                {cv.languages.length > 0 && (
                                  <span className="flex items-center gap-1 text-crm-text">
                                    💬 {cv.languages.join(', ')}
                                  </span>
                                )}
                                {cv.experience_years > 0 && (
                                  <span className="flex items-center gap-1 text-crm-text">
                                    <Briefcase className="h-3.5 w-3.5 text-crm-text-muted" /> {cv.experience_years} yr{cv.experience_years !== 1 ? 's' : ''} exp
                                  </span>
                                )}
                                {cv.current_location_city && (
                                  <span className="flex items-center gap-1 text-crm-text">
                                    📍 {cv.current_location_city}{cv.current_location_country ? `, ${cv.current_location_country}` : ''}
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-crm-text-muted text-xs">
                                  <Calendar className="h-3 w-3" /> {format(new Date(cv.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>

                              {/* AI Summary - compact */}
                              {cv.ai_summary && (
                                <p className="text-sm text-crm-text bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
                                  <Sparkles className="h-3.5 w-3.5 inline mr-1 text-amber-500" />
                                  {cv.ai_summary}
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
                            <Button size="sm" onClick={() => { setSelectedCV(cv); setContactOpen(true); }} className="bg-gold hover:bg-gold-dark text-white font-bold px-4 py-2">
                              <Mail className="h-4 w-4 mr-1.5" /> Contact
                            </Button>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                              {cv.status !== 'approved' && (
                                <Button size="sm" onClick={() => handleUpdateStatus(cv.id, 'approved')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                                </Button>
                              )}
                              {cv.status !== 'pending' && (
                                <Button size="sm" onClick={() => handleUpdateStatus(cv.id, 'pending')} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold">
                                  <Clock className="h-3.5 w-3.5 mr-1" /> Pending
                                </Button>
                              )}
                              {cv.status !== 'rejected' && (
                                <Button size="sm" onClick={() => handleUpdateStatus(cv.id, 'rejected')} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold">
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

                                {/* Contact info */}
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-2 text-crm-text">
                                    <Mail className="h-3.5 w-3.5 text-crm-text-muted" /> {cv.email}
                                  </div>
                                  <div className="flex items-center gap-2 text-crm-text">
                                    <Phone className="h-3.5 w-3.5 text-crm-text-muted" /> {cv.phone_e164 || '—'}
                                  </div>
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
                                    CV: {cv.cv_url ? '✅ Uploaded' : '❌ Not uploaded'}
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
          <div className="h-full">
            {cvPreviewLoading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gold" /></div>
            ) : cvPreviewUrl ? (
              <iframe title="CV Preview" src={cvPreviewUrl} className="w-full h-full rounded-md border" />
            ) : cvDirectUrl ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                <p>Inline preview is unavailable for this file format.</p>
                <p>Please use <span className="font-semibold text-foreground">Open in new tab</span> or <span className="font-semibold text-foreground">Download</span>.</p>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">CV preview unavailable</div>
            )}
          </div>
          {cvDirectUrl && (
            <div className="flex gap-2">
              <a href={cvDirectUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-2">
                  <ExternalLink className="h-4 w-4" /> Open in new tab
                </Button>
              </a>
              <a href={cvDirectUrl} download={selectedCV ? `CV-${selectedCV.full_name.replace(/\s+/g, '-')}` : 'CV'}>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-lg" aria-describedby="contact-desc">
          <DialogHeader><DialogTitle>Contact Candidate</DialogTitle></DialogHeader>
          <p id="contact-desc" className="sr-only">Options to contact the selected candidate</p>
          {selectedCV && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{selectedCV.full_name}</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {selectedCV.email}</div>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${selectedCV.email}?subject=JBJ Global Real Estate - CV Update`}>Email</Button>
                </div>
                {selectedCV.phone_e164 && (
                  <>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {selectedCV.phone_e164}</div>
                      <Button size="sm" variant="outline" onClick={() => window.location.href = `tel:${selectedCV.phone_e164}`}>Call</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp</div>
                      <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/${(selectedCV.phone_e164 || '').replace(/[^0-9]/g, '')}`, '_blank')}>WhatsApp</Button>
                    </div>
                  </>
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
