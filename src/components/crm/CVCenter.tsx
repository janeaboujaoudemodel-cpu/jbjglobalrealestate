import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FileText,
  Search,
  Upload,
  Star,
  Mail,
  Phone,
  Video,
  Calendar,
  Globe2,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flag,
  Eye,
  User,
  Building2,
  Camera,
  Megaphone,
  Code,
  Calculator,
  Loader2,
  ExternalLink,
  Download,
  MessageSquare,
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

// Status categories
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
  const [cvPreviewLoading, setCvPreviewLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  // Fetch CVs from database
  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    setIsLoading(true);
    try {
      // Fetch from both hr_applications AND hr_cv_submissions
      const [appsRes, subsRes] = await Promise.all([
        supabase.from('hr_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('hr_cv_submissions').select('*').order('created_at', { ascending: false }),
      ]);

      if (appsRes.error) throw appsRes.error;

      // Transform hr_applications
      const fromApps: CVEntry[] = (appsRes.data || []).map((app: any) => ({
        id: app.id,
        full_name: app.full_name,
        email: app.email,
        phone_e164: app.phone_e164,
        nationality: app.nationality,
        preferred_language: app.preferred_language,
        current_location_country: app.current_location_country,
        current_location_city: app.current_location_city,
        cv_url: app.cv_url,
        status: app.status,
        department_category: detectDepartmentCategory(app),
        ai_summary: app.ai_summary || generateAutoSummary(app),
        ai_ranking: app.ai_ranking || 0,
        languages: app.languages || [app.preferred_language].filter(Boolean),
        experience_years: app.experience_years || 0,
        skills: app.skills || [],
        flag_reason: app.flag_reason || detectFlagReason(app),
        source: app.source || 'careers_portal',
        created_at: app.created_at,
        reviewed_at: app.reviewed_at,
        reviewed_by: app.reviewed_by,
        user_id: app.user_id || null,
        record_source: 'hr_applications',
      }));

      // Transform hr_cv_submissions (chat widget CVs)
      const fromSubs: CVEntry[] = (subsRes.data || []).map((sub: any) => ({
        id: sub.id,
        full_name: sub.full_name,
        email: sub.email,
        phone_e164: sub.phone || null,
        nationality: null,
        preferred_language: null,
        current_location_country: null,
        current_location_city: null,
        cv_url: sub.cv_url,
        status: sub.status || 'pending',
        department_category: detectDepartmentCategory(sub),
        ai_summary: sub.ai_summary || `Candidate submitted CV via chat widget.`,
        ai_ranking: sub.ai_ranking || 0,
        languages: [],
        experience_years: 0,
        skills: [],
        flag_reason: !sub.cv_url ? 'No CV file uploaded' : null,
        source: 'chat_widget',
        created_at: sub.created_at,
        reviewed_at: sub.reviewed_at || null,
        reviewed_by: sub.reviewed_by || null,
        user_id: null,
        record_source: 'hr_cv_submissions',
      }));

      // Merge and deduplicate by email (keep the most recent)
      const allCVs = [...fromApps, ...fromSubs];
      const emailMap = new Map<string, CVEntry>();
      for (const cv of allCVs) {
        const key = cv.email.toLowerCase();
        const existing = emailMap.get(key);
        if (!existing || new Date(cv.created_at) > new Date(existing.created_at)) {
          emailMap.set(key, cv);
        }
      }
      const merged = Array.from(emailMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCvEntries(merged);
    } catch (error) {
      console.error('Error fetching CVs:', error);
      toast.error('Failed to load CVs');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-detect department category from application data
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

  // Auto-generate summary from application data
  const generateAutoSummary = (app: any): string => {
    const parts = [];
    if (app.nationality) parts.push(`${app.nationality} national`);
    if (app.current_location_city && app.current_location_country) {
      parts.push(`based in ${app.current_location_city}, ${app.current_location_country}`);
    }
    if (app.preferred_language) parts.push(`speaks ${app.preferred_language}`);
    
    return parts.length > 0 
      ? `Candidate: ${parts.join(', ')}.`
      : 'New application submitted via careers portal.';
  };

  // Detect flag reasons
  const detectFlagReason = (app: any): string | null => {
    const issues = [];
    if (!app.cv_url) issues.push('No CV file uploaded');
    if (!app.phone_e164) issues.push('Missing phone number');
    if (!app.email) issues.push('Missing email');
    
    return issues.length > 0 ? issues.join(', ') : null;
  };

  // Get dynamic categories based on actual CVs
  const dynamicCategories = useMemo(() => {
    const categorySet = new Set(cvEntries.map(cv => cv.department_category));
    return DEPARTMENT_CATEGORIES.filter(cat => 
      cat.id === 'all' || categorySet.has(cat.id)
    );
  }, [cvEntries]);

  // Filter CVs
  const filteredCVs = useMemo(() => {
    let filtered = cvEntries;

    // Status filter
    if (activeStatusTab !== 'all') {
      if (activeStatusTab === 'flagged') {
        filtered = filtered.filter(cv => cv.flag_reason !== null);
      } else {
        filtered = filtered.filter(cv => cv.status === activeStatusTab);
      }
    }

    // Department filter
    if (activeDeptCategory !== 'all') {
      filtered = filtered.filter(cv => cv.department_category === activeDeptCategory);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cv =>
        cv.full_name.toLowerCase().includes(query) ||
        cv.email.toLowerCase().includes(query) ||
        (cv.nationality && cv.nationality.toLowerCase().includes(query)) ||
        (cv.preferred_language && cv.preferred_language.toLowerCase().includes(query)) ||
        cv.skills.some(s => s.toLowerCase().includes(query)) ||
        cv.languages.some(l => l.toLowerCase().includes(query))
      );
    }

    // Sort by strongest score first
    return filtered.sort((a, b) => {
      const aScore = getScoreBreakdown(a).final;
      const bScore = getScoreBreakdown(b).final;
      return bScore - aScore;
    });
  }, [cvEntries, activeStatusTab, activeDeptCategory, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: cvEntries.length,
    pending: cvEntries.filter(cv => cv.status === 'pending').length,
    approved: cvEntries.filter(cv => cv.status === 'approved').length,
    rejected: cvEntries.filter(cv => cv.status === 'rejected').length,
    flagged: cvEntries.filter(cv => cv.flag_reason !== null).length,
  }), [cvEntries]);

  const getScoreBreakdown = (cv: CVEntry) => {
    const exp = cv.experience_years >= 7 ? 4 : cv.experience_years >= 4 ? 3 : cv.experience_years >= 2 ? 2 : cv.experience_years > 0 ? 1 : 0;
    const lang = cv.languages.length >= 3 ? 3 : cv.languages.length >= 2 ? 2 : cv.languages.length >= 1 ? 1 : 0;
    const skills = cv.skills.length >= 6 ? 3 : cv.skills.length >= 3 ? 2 : cv.skills.length >= 1 ? 1 : 0;
    const base = exp + lang + skills;
    const final = cv.ai_ranking > 0 ? Math.max(1, Math.min(10, Math.round((cv.ai_ranking * 0.6) + (base * 0.4)))) : Math.max(1, base);
    const level = final >= 9 ? 'Elite' : final >= 7 ? 'Advanced' : final >= 5 ? 'Intermediate' : 'Beginner';
    return { exp, lang, skills, final, level };
  };

  const resolvePreviewUrl = async (cvUrl: string | null) => {
    if (!cvUrl) return null;
    if (/^https?:\/\//i.test(cvUrl)) return cvUrl;

    const cleanPath = cvUrl.replace(/^\/+/, '');
    const buckets = ['hr-documents', 'documents', 'public'];

    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(cleanPath, 60 * 60);
      if (!error && data?.signedUrl) return data.signedUrl;
    }

    return null;
  };

  // Update CV status
  const handleUpdateStatus = async (cvId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    const target = cvEntries.find((entry) => entry.id === cvId);
    if (!target) return;

    try {
      const { error } = await supabase
        .from(target.record_source)
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: userId 
        })
        .eq('id', cvId);

      if (error) throw error;

      setCvEntries(prev => prev.map(cv => 
        cv.id === cvId ? { ...cv, status: newStatus, reviewed_at: new Date().toISOString() } : cv
      ));

      toast.success(`CV marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating CV status:', error);
      toast.error('Failed to update CV status');
    }
  };

  // View CV inline (same page)
  const handleViewCV = async (cv: CVEntry) => {
    setSelectedCV(cv);
    setCvPreviewOpen(true);
    setCvPreviewLoading(true);

    const resolved = await resolvePreviewUrl(cv.cv_url);
    setCvPreviewUrl(resolved);
    setCvPreviewLoading(false);

    if (!resolved) {
      toast.error('Unable to load CV preview');
    }
  };

  // Contact candidate
  const handleContact = (cv: CVEntry) => {
    setSelectedCV(cv);
    setContactOpen(true);
  };

  // Schedule interview
  const handleScheduleInterview = (cv: CVEntry) => {
    setSelectedCV(cv);
    setScheduleOpen(true);
  };

  const getCategoryIcon = (categoryId: string) => {
    const cat = DEPARTMENT_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) return <FileText className="h-4 w-4" />;
    const IconComponent = cat.icon;
    return <IconComponent className={`h-4 w-4 ${cat.color}`} />;
  };

  const getStatusBadge = (status: string, flagReason: string | null) => {
    if (flagReason) {
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Flagged
        </Badge>
      );
    }
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Pending Review</Badge>;
    }
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
            Centralized CV collection, categorization & candidate management
          </p>
        </div>
        <Button className="gap-2 bg-gold text-white hover:bg-gold-dark font-semibold">
          <Upload className="h-4 w-4" />
          Upload CV
        </Button>
      </div>

      {/* Status Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === 'all' ? stats.total :
                       tab.id === 'flagged' ? stats.flagged :
                       stats[tab.id as keyof typeof stats] || 0;
          const IconComponent = tab.icon;
          
          return (
            <Card 
              key={tab.id}
              className={`bg-white border cursor-pointer hover:shadow-md transition-all duration-200 ${
                activeStatusTab === tab.id ? 'border-gold ring-2 ring-gold/20' : 'border-crm-border'
              }`}
              onClick={() => setActiveStatusTab(tab.id)}
            >
              <CardContent className="p-4 text-center">
                <IconComponent className={`h-5 w-5 mx-auto mb-2 ${
                  tab.id === 'pending' ? 'text-amber-500' :
                  tab.id === 'approved' ? 'text-green-500' :
                  tab.id === 'rejected' ? 'text-red-500' :
                  tab.id === 'flagged' ? 'text-yellow-500' :
                  'text-gold'
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
          <CardTitle className="text-sm font-medium text-crm-text-muted">
            Categories (Auto-Detected)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {dynamicCategories.map((cat) => {
              const count = cat.id === 'all' 
                ? cvEntries.length 
                : cvEntries.filter(cv => cv.department_category === cat.id).length;
              const IconComponent = cat.icon;
              
              return (
                <Badge
                  key={cat.id}
                  variant={activeDeptCategory === cat.id ? 'default' : 'outline'}
                  className={`cursor-pointer px-3 py-2 ${
                    activeDeptCategory === cat.id 
                      ? 'bg-gold text-white border-gold' 
                      : 'hover:bg-gold/10 border-crm-border text-crm-text'
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
          placeholder="Search by name, email, nationality, language, skills..."
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
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredCVs.map((cv) => (
                  <Card 
                    key={cv.id} 
                    className="bg-gradient-to-r from-zinc-50 to-white border border-crm-border hover:border-gold/50 hover:shadow-md transition-all duration-200"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left: Avatar & Main Info */}
                        <div className="flex gap-4 flex-1">
                          <Avatar className="h-14 w-14 border-2 border-gold/30 flex-shrink-0">
                            <AvatarFallback className="bg-gold/10 text-gold font-bold text-lg">
                              {cv.full_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            {/* Name & Status Row */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h4 className="text-lg font-bold text-crm-text">{cv.full_name}</h4>
                              {getStatusBadge(cv.status, cv.flag_reason)}
                              <Badge variant="outline" className="text-xs border-crm-border text-crm-text-muted">
                                {getCategoryIcon(cv.department_category)}
                                <span className="ml-1 capitalize">
                                  {DEPARTMENT_CATEGORIES.find(c => c.id === cv.department_category)?.label || cv.department_category}
                                </span>
                              </Badge>
                            </div>

                            {/* AI Summary - Visible on Card */}
                            <p className="text-sm text-crm-text mb-3 italic bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                              📋 {cv.ai_summary}
                            </p>

                            {/* Quick Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-crm-text-muted flex-shrink-0" />
                                <span className="text-crm-text truncate">{cv.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-crm-text-muted flex-shrink-0" />
                                <span className="text-crm-text">{cv.phone_e164 || '—'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Globe2 className="h-4 w-4 text-crm-text-muted flex-shrink-0" />
                                <span className="text-crm-text">{cv.nationality || '—'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-crm-text-muted flex-shrink-0" />
                                <span className="text-crm-text">
                                  {format(new Date(cv.created_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>

                            {/* Languages, Score & Ranking */}
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              {(() => {
                                const score = getScoreBreakdown(cv);
                                return (
                                  <>
                                    <Badge className="bg-gold/10 text-gold border-gold/30 font-semibold">
                                      <Star className="h-3 w-3 mr-1 fill-gold" />
                                      Score: {score.final}/10 · {score.level}
                                    </Badge>
                                    <Badge variant="outline" className="text-crm-text border-crm-border text-xs">
                                      Experience {score.exp}/4 · Languages {score.lang}/3 · Skills {score.skills}/3
                                    </Badge>
                                  </>
                                );
                              })()}
                              {cv.languages.length > 0 && (
                                <Badge variant="outline" className="text-crm-text border-crm-border">
                                  <Globe2 className="h-3 w-3 mr-1" />
                                  {cv.languages.join(', ')}
                                </Badge>
                              )}
                              {cv.current_location_city && (
                                <Badge variant="outline" className="text-crm-text border-crm-border">
                                  📍 {cv.current_location_city}, {cv.current_location_country}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-crm-text-muted border-crm-border text-xs">
                                Source: {cv.source}
                              </Badge>
                            </div>

                            {/* Flag Warning */}
                            {cv.flag_reason && (
                              <div className="mt-3 flex items-center gap-2 text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm">{cv.flag_reason}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Action Buttons - HIGH VISIBILITY GOLD */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Button 
                            size="sm"
                            onClick={() => handleScheduleInterview(cv)}
                            className="bg-gold hover:bg-gold-light text-black font-bold shadow-lg px-5 py-2.5 transition-all duration-200 hover:scale-105 border-2 border-gold-dark"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Schedule Interview
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleViewCV(cv)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold shadow-lg px-5 py-2.5 transition-all duration-200 hover:scale-105 border-2 border-zinc-600"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View CV
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleContact(cv)}
                            className="bg-gold hover:bg-gold-light text-black font-bold shadow-lg px-5 py-2.5 transition-all duration-200 hover:scale-105 border-2 border-gold-dark"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Contact
                          </Button>
                          
                          {/* Status Actions - High Visibility */}
                          {cv.status === 'pending' && (
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm"
                                onClick={() => handleUpdateStatus(cv.id, 'approved')}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg transition-all duration-200 hover:scale-105 border-2 border-emerald-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleUpdateStatus(cv.id, 'rejected')}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg transition-all duration-200 hover:scale-105 border-2 border-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredCVs.length === 0 && !isLoading && (
                  <div className="py-16 text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-crm-text-muted opacity-30" />
                    <p className="text-crm-text-muted text-lg font-medium">No CVs found</p>
                    <p className="text-sm text-crm-text-muted mt-1">
                      CVs submitted through the careers portal will appear here automatically.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={cvPreviewOpen} onOpenChange={setCvPreviewOpen}>
        <DialogContent className="max-w-6xl h-[85vh]">
          <DialogHeader>
            <DialogTitle>CV Preview {selectedCV ? `· ${selectedCV.full_name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="h-full">
            {cvPreviewLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              </div>
            ) : cvPreviewUrl ? (
              <iframe title="CV Preview" src={cvPreviewUrl} className="w-full h-full rounded-md border" />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                CV preview unavailable
              </div>
            )}
          </div>
          {cvPreviewUrl && (
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => window.open(cvPreviewUrl, '_blank')}>
                <ExternalLink className="h-4 w-4" /> Open in new tab
              </Button>
              <Button className="gap-2" onClick={() => window.open(cvPreviewUrl, '_blank')}>
                <Download className="h-4 w-4" /> Download
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact Candidate</DialogTitle>
          </DialogHeader>
          {selectedCV && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{selectedCV.full_name}</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> {selectedCV.email}</div>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = `mailto:${selectedCV.email}?subject=JBJ Global Real Estate - CV Update&body=Hello ${selectedCV.full_name}, your CV is currently under review by our HR team.`}>Email</Button>
                </div>
                {selectedCV.phone_e164 && (
                  <>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {selectedCV.phone_e164}</div>
                      <Button size="sm" variant="outline" onClick={() => window.location.href = `tel:${selectedCV.phone_e164}`}>Call</Button>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> WhatsApp</div>
                      <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/${(selectedCV.phone_e164 || '').replace(/[^0-9]/g, '')}?text=Hello ${selectedCV.full_name}, your CV is under review by JBJ Global Real Estate HR team.`, '_blank')}>WhatsApp</Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
          </DialogHeader>
          {selectedCV && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">{selectedCV.full_name}</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={interviewTime} onChange={(e) => setInterviewTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={interviewNotes} onChange={(e) => setInterviewNotes(e.target.value)} placeholder="Interview notes" />
              </div>
              <Button onClick={async () => {
                if (!selectedCV || !interviewDate || !interviewTime) {
                  toast.error('Please select date and time');
                  return;
                }
                const updatedStatus = selectedCV.record_source === 'hr_applications' ? 'approved' : 'under_review';
                const { error } = await supabase.from(selectedCV.record_source).update({ status: updatedStatus, reviewed_at: new Date().toISOString(), reviewed_by: userId }).eq('id', selectedCV.id);
                if (error) {
                  toast.error('Failed to save interview schedule');
                  return;
                }
                setCvEntries(prev => prev.map(cv => cv.id === selectedCV.id ? { ...cv, status: updatedStatus } : cv));
                setScheduleOpen(false);
                toast.success(`Interview scheduled for ${selectedCV.full_name}`);
              }} className="w-full gap-2">
                <Video className="h-4 w-4" /> Confirm Schedule
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CVCenter;
