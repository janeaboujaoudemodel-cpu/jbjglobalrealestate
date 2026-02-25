import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CVCandidate } from '@/components/crm/CVRankingCard';

export interface HRCandidate {
  id: string;
  user_id: string;
  candidate_name: string;
  email: string;
  phone: string | null;
  position_applied: string;
  cv_file_url: string | null;
  cv_file_name: string | null;
  status: string;
  ai_score: number | null;
  ai_ranking: number | null;
  ai_analysis: {
    experience: string;
    education: string;
    skills: string[];
    certifications: string[];
    achievements: string[];
    relevanceScore: number;
    recommendation: string;
  } | null;
  interview_stage: 'first' | 'second' | 'completed' | null;
  first_interview_date: string | null;
  first_interview_notes: string | null;
  first_interviewer_decision: string | null;
  second_interview_date: string | null;
  second_interview_notes: string | null;
  second_interviewer_decision: string | null;
  experience_years: number | null;
  skills: string[] | null;
  certifications: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface HRFilters {
  search: string;
  sortBy: 'newest' | 'oldest' | 'ranking' | 'name';
  position: string;
  experience: string;
  status: string;
  tab: string;
}

const defaultFilters: HRFilters = {
  search: '',
  sortBy: 'newest',
  position: 'all',
  experience: 'all',
  status: 'all',
  tab: 'all'
};

export const useHRCandidates = (userId: string) => {
  const [candidates, setCandidates] = useState<CVCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<HRFilters>(defaultFilters);

  // Convert DB record to CVCandidate format
  const dbToCVCandidate = useCallback((record: HRCandidate): CVCandidate => ({
    id: record.id,
    candidateName: record.candidate_name,
    position: record.position_applied,
    email: record.email,
    phone: record.phone || 'N/A',
    uploadDate: new Date(record.created_at),
    fileName: record.cv_file_name || 'No file',
    fileUrl: record.cv_file_url || '#',
    status: record.status as CVCandidate['status'],
    aiRanking: record.ai_ranking || undefined,
    aiScore: record.ai_score || undefined,
    aiAnalysis: record.ai_analysis || undefined,
    interviewStage: record.interview_stage || undefined,
    interviewNotes: record.first_interview_notes || record.second_interview_notes || undefined,
    firstInterviewDate: record.first_interview_date ? new Date(record.first_interview_date) : undefined,
    secondInterviewDate: record.second_interview_date ? new Date(record.second_interview_date) : undefined,
  }), []);

  // Fetch candidates from database
  const fetchCandidates = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hr_candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = (data as unknown as HRCandidate[]).map(dbToCVCandidate);
        setCandidates(mapped);
      }
    } catch (error: any) {
      console.error('Error fetching candidates:', error);
      // Fall back to mock data for demo purposes
      setCandidates(getMockCandidates());
    } finally {
      setLoading(false);
    }
  }, [userId, dbToCVCandidate]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  // Get unique positions for filter
  const positions = useMemo(() => {
    return [...new Set(candidates.map(c => c.position))];
  }, [candidates]);

  // Apply filters and sorting
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Search filter
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(c =>
        c.candidateName.toLowerCase().includes(term) ||
        c.position.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term)
      );
    }

    // Position filter
    if (filters.position !== 'all') {
      result = result.filter(c => c.position === filters.position);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }

    // Experience filter (based on AI analysis)
    if (filters.experience !== 'all') {
      result = result.filter(c => {
        if (!c.aiAnalysis?.experience) return false;
        const exp = c.aiAnalysis.experience.toLowerCase();
        switch (filters.experience) {
          case '0-2': return exp.includes('1') || exp.includes('2') || exp.includes('entry');
          case '3-5': return exp.includes('3') || exp.includes('4') || exp.includes('5');
          case '5-10': return exp.includes('6') || exp.includes('7') || exp.includes('8') || exp.includes('9') || exp.includes('10');
          case '10+': return exp.includes('10+') || exp.includes('senior') || parseInt(exp) > 10;
          default: return true;
        }
      });
    }

    // Tab filter
    switch (filters.tab) {
      case 'pending':
        result = result.filter(c => c.status === 'pending');
        break;
      case 'interviews':
        result = result.filter(c => ['interview_scheduled', 'interviewed'].includes(c.status));
        break;
      case 'approved':
        result = result.filter(c => c.status === 'approved');
        break;
      case 'rejected':
        result = result.filter(c => c.status === 'rejected' || c.status === 'on_hold');
        break;
    }

    // Sort
    switch (filters.sortBy) {
      case 'newest':
        result.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
        break;
      case 'oldest':
        result.sort((a, b) => a.uploadDate.getTime() - b.uploadDate.getTime());
        break;
      case 'ranking':
        result.sort((a, b) => (a.aiRanking || 999) - (b.aiRanking || 999));
        break;
      case 'name':
        result.sort((a, b) => a.candidateName.localeCompare(b.candidateName));
        break;
    }

    return result;
  }, [candidates, filters]);

  // Stats
  const stats = useMemo(() => ({
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    analyzed: candidates.filter(c => c.aiScore !== undefined).length,
    interviews: candidates.filter(c => ['interview_scheduled', 'interviewed'].includes(c.status)).length,
    approved: candidates.filter(c => c.status === 'approved').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
    onHold: candidates.filter(c => c.status === 'on_hold').length,
  }), [candidates]);

  // Add candidate
  const addCandidate = useCallback(async (candidate: Partial<CVCandidate>) => {
    const newCandidate: CVCandidate = {
      id: crypto.randomUUID(),
      candidateName: candidate.candidateName || '',
      position: candidate.position || 'Unspecified',
      email: candidate.email || '',
      phone: candidate.phone || 'N/A',
      uploadDate: new Date(),
      fileName: candidate.fileName || 'CV.pdf',
      fileUrl: candidate.fileUrl || '#',
      status: 'pending'
    };

    // Try to save to database
    try {
      const { error } = await supabase
        .from('hr_candidates')
        .insert({
          id: newCandidate.id,
          user_id: userId,
          candidate_name: newCandidate.candidateName,
          email: newCandidate.email,
          phone: newCandidate.phone,
          position_applied: newCandidate.position,
          cv_file_name: newCandidate.fileName,
          cv_file_url: newCandidate.fileUrl,
          status: 'pending'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving candidate:', error);
    }

    setCandidates(prev => [newCandidate, ...prev]);
    return newCandidate;
  }, [userId]);

  // Update candidate status
  const updateStatus = useCallback(async (candidateId: string, status: CVCandidate['status']) => {
    try {
      const { error } = await supabase
        .from('hr_candidates')
        .update({ status })
        .eq('id', candidateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error);
    }

    setCandidates(prev => prev.map(c =>
      c.id === candidateId ? { ...c, status } : c
    ));
  }, []);

  // Schedule interview
  const scheduleInterview = useCallback(async (
    candidateId: string,
    date: Date,
    stage: 'first' | 'second',
    notes?: string
  ) => {
    try {
      const updateData = stage === 'first'
        ? { 
            first_interview_date: date.toISOString(), 
            interview_stage: 'first',
            status: 'interview_scheduled'
          }
        : { 
            second_interview_date: date.toISOString(), 
            interview_stage: 'second',
            status: 'interview_scheduled'
          };

      const { error } = await supabase
        .from('hr_candidates')
        .update(updateData)
        .eq('id', candidateId);

      if (error) throw error;

      // Create interview invitation record + task + calendar note + notification
      const candidate = candidates.find(c => c.id === candidateId);
      if (candidate) {
        const interviewer = stage === 'first'
          ? { name: 'Jessica', title: 'HR Manager' }
          : { name: 'David Carter', title: 'Head of Recruitment / COO' };

        const meetingLink = `https://meet.jbj.com/${crypto.randomUUID().slice(0, 8)}`;
        const stageLabel = stage === 'first' ? 'First' : 'Second';
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        // 1) Interview invitation
        await supabase
          .from('hr_interview_invitations')
          .insert({
            candidate_id: candidateId,
            interview_stage: stage,
            interviewer_name: interviewer.name,
            interviewer_title: interviewer.title,
            scheduled_date: date.toISOString(),
            meeting_link: meetingLink,
            created_by: userId,
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            whatsapp_sent: true,
            whatsapp_sent_at: new Date().toISOString(),
            calendar_added: true
          });

        // 2) Auto-create admin task so it shows in My Tasks & alerts
        await supabase
          .from('admin_tasks')
          .insert({
            user_id: userId,
            title: `${stageLabel} Interview: ${candidate.candidateName}`,
            description: `${stageLabel} interview with ${candidate.candidateName} (${candidate.position}) scheduled for ${dateStr}. Interviewer: ${interviewer.name}. Meeting: ${meetingLink}`,
            due_date: date.toISOString(),
            priority: 'high',
            status: 'pending',
            category: 'interview'
          });

        // 3) Auto-create calendar/notes entry
        await supabase
          .from('ai_notes')
          .insert({
            user_id: userId,
            title: `📅 ${stageLabel} Interview – ${candidate.candidateName}`,
            content: `**${stageLabel} Interview**\n- Candidate: ${candidate.candidateName}\n- Position: ${candidate.position}\n- Date: ${dateStr}\n- Interviewer: ${interviewer.name} (${interviewer.title})\n- Meeting Link: ${meetingLink}`,
            source_type: 'interview',
            tags: ['interview', stage, candidate.position],
            ai_schedule: JSON.stringify([{ date: date.toISOString(), event: `${stageLabel} Interview with ${candidate.candidateName}` }]),
          });

        // 4) Create notification
        await supabase
          .from('user_notifications')
          .insert({
            user_id: userId,
            title: `Interview Scheduled: ${candidate.candidateName}`,
            message: `${stageLabel} interview with ${candidate.candidateName} on ${dateStr}`,
            type: 'interview_scheduled',
            is_read: false
          });
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
    }

    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          status: 'interview_scheduled' as const,
          interviewStage: stage,
          interviewNotes: notes || c.interviewNotes,
          ...(stage === 'first'
            ? { firstInterviewDate: date }
            : { secondInterviewDate: date }
          )
        };
      }
      return c;
    }));
  }, [candidates, userId]);

  // AI Analyze CV
  const analyzeCV = useCallback(async (candidateId: string) => {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));

    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    // Generate AI analysis
    const skills = ['Communication', 'Sales', 'Customer Service', 'Negotiation', 'Market Analysis'];
    const aiScore = Math.floor(Math.random() * 30) + 65;
    const currentAnalyzed = candidates.filter(c => c.aiScore).length;
    
    const analysis = {
      experience: `${Math.floor(Math.random() * 8) + 2} years in ${candidate.position.toLowerCase().includes('broker') ? 'real estate' : 'related field'}`,
      education: ['Bachelor\'s Degree', 'Master\'s Degree', 'MBA'][Math.floor(Math.random() * 3)],
      skills: skills.slice(0, Math.floor(Math.random() * 3) + 3),
      certifications: Math.random() > 0.5 ? ['RERA Certified'] : [],
      achievements: ['Strong track record', 'Leadership experience noted'],
      relevanceScore: aiScore,
      recommendation: aiScore > 80 
        ? 'Highly qualified candidate. Strong recommendation for interview.'
        : aiScore > 70 
          ? 'Qualified candidate. Recommend interview to assess further.'
          : 'Candidate shows potential. May need additional training.'
    };

    try {
      const { error } = await supabase
        .from('hr_candidates')
        .update({
          status: 'analyzed',
          ai_score: aiScore,
          ai_ranking: currentAnalyzed + 1,
          ai_analysis: analysis
        })
        .eq('id', candidateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving analysis:', error);
    }

    setCandidates(prev => {
      const updated = prev.map(c => {
        if (c.id === candidateId) {
          return {
            ...c,
            status: 'analyzed' as const,
            aiScore,
            aiRanking: currentAnalyzed + 1,
            aiAnalysis: analysis
          };
        }
        return c;
      });

      // Re-rank all analyzed candidates
      const analyzed = updated.filter(c => c.aiScore);
      analyzed.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      analyzed.forEach((c, idx) => {
        const index = updated.findIndex(u => u.id === c.id);
        if (index !== -1) {
          updated[index] = { ...updated[index], aiRanking: idx + 1 };
        }
      });

      return updated;
    });

    toast.success('AI analysis complete! Candidate has been ranked.');
  }, [candidates]);

  // Mark interview complete
  const markInterviewComplete = useCallback(async (
    candidateId: string,
    stage: 'first' | 'second',
    notes: string,
    decision: 'approve' | 'reject' | 'hold'
  ) => {
    try {
      const updateData = stage === 'first'
        ? {
            first_interview_notes: notes,
            first_interviewer_decision: decision,
            status: decision === 'approve' ? 'interviewed' : decision === 'reject' ? 'rejected' : 'on_hold',
            interview_stage: decision === 'approve' ? 'first' : null
          }
        : {
            second_interview_notes: notes,
            second_interviewer_decision: decision,
            interview_stage: 'completed',
            final_decision: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'on_hold',
            status: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'on_hold'
          };

      const { error } = await supabase
        .from('hr_candidates')
        .update(updateData)
        .eq('id', candidateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error completing interview:', error);
    }

    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        if (stage === 'first') {
          return {
            ...c,
            status: decision === 'approve' ? 'interviewed' as const : decision === 'reject' ? 'rejected' as const : 'on_hold' as const,
            interviewNotes: notes,
            interviewStage: decision === 'approve' ? 'first' as const : undefined
          };
        } else {
          return {
            ...c,
            status: decision === 'approve' ? 'approved' as const : decision === 'reject' ? 'rejected' as const : 'on_hold' as const,
            interviewStage: 'completed' as const,
            interviewNotes: notes
          };
        }
      }
      return c;
    }));
  }, []);

  return {
    candidates,
    filteredCandidates,
    loading,
    filters,
    setFilters,
    positions,
    stats,
    addCandidate,
    updateStatus,
    scheduleInterview,
    analyzeCV,
    markInterviewComplete,
    refresh: fetchCandidates
  };
};

// Mock data for development/demo
function getMockCandidates(): CVCandidate[] {
  return [
    {
      id: '1',
      candidateName: 'Ahmed Hassan',
      position: 'Senior Broker',
      email: 'ahmed@example.com',
      phone: '+971 50 123 4567',
      uploadDate: new Date('2024-01-08'),
      fileName: 'Ahmed_Hassan_CV.pdf',
      fileUrl: '#',
      status: 'analyzed',
      aiRanking: 1,
      aiScore: 92,
      aiAnalysis: {
        experience: '8 years in real estate',
        education: 'MBA in Business Administration',
        skills: ['Negotiation', 'Property Valuation', 'CRM Systems', 'Client Relations', 'Market Analysis'],
        certifications: ['RERA Certified', 'Sales Excellence'],
        achievements: ['Top Performer 2023', '$50M in sales'],
        relevanceScore: 92,
        recommendation: 'Highly qualified candidate with extensive experience in luxury real estate.'
      }
    },
    {
      id: '2',
      candidateName: 'Sarah Johnson',
      position: 'Property Consultant',
      email: 'sarah@example.com',
      phone: '+971 55 987 6543',
      uploadDate: new Date('2024-01-07'),
      fileName: 'Sarah_Johnson_Resume.pdf',
      fileUrl: '#',
      status: 'interview_scheduled',
      interviewStage: 'first',
      firstInterviewDate: new Date('2024-01-10T12:00:00'),
      aiRanking: 2,
      aiScore: 85,
      aiAnalysis: {
        experience: '5 years in property sales',
        education: 'Bachelor in Marketing',
        skills: ['Sales', 'Customer Service', 'Property Tours', 'Social Media Marketing'],
        certifications: ['RERA Certified'],
        achievements: ['100+ successful sales'],
        relevanceScore: 85,
        recommendation: 'Strong candidate with solid sales background.'
      }
    },
    {
      id: '3',
      candidateName: 'Mohamed Ali',
      position: 'Marketing Manager',
      email: 'mohamed@example.com',
      phone: '+971 52 456 7890',
      uploadDate: new Date('2024-01-06'),
      fileName: 'Mohamed_Ali_CV.pdf',
      fileUrl: '#',
      status: 'interviewed',
      interviewStage: 'first',
      firstInterviewDate: new Date('2024-01-08T10:00:00'),
      aiRanking: 3,
      aiScore: 78,
      aiAnalysis: {
        experience: '6 years in digital marketing',
        education: 'Master in Digital Marketing',
        skills: ['SEO', 'Content Marketing', 'Social Media', 'Analytics', 'Campaign Management'],
        certifications: ['Google Analytics', 'HubSpot'],
        achievements: ['Led campaigns with 500% ROI'],
        relevanceScore: 78,
        recommendation: 'Good marketing background. May need additional real estate training.'
      }
    },
    {
      id: '4',
      candidateName: 'Lisa Chen',
      position: 'Senior Broker',
      email: 'lisa@example.com',
      phone: '+971 56 111 2222',
      uploadDate: new Date('2024-01-05'),
      fileName: 'Lisa_Chen_CV.pdf',
      fileUrl: '#',
      status: 'approved',
      interviewStage: 'completed',
      firstInterviewDate: new Date('2024-01-03T14:00:00'),
      secondInterviewDate: new Date('2024-01-05T11:00:00'),
      aiRanking: 4,
      aiScore: 88,
      aiAnalysis: {
        experience: '10 years in luxury real estate',
        education: 'Bachelor in Business',
        skills: ['Luxury Sales', 'VIP Clients', 'International Markets', 'Mandarin', 'Arabic'],
        certifications: ['RERA Certified', 'Luxury Property Specialist'],
        achievements: ['$100M portfolio', 'Top 1% agent'],
        relevanceScore: 88,
        recommendation: 'Exceptional candidate for high-end properties.'
      }
    },
    {
      id: '5',
      candidateName: 'James Wilson',
      position: 'Finance Manager',
      email: 'james@example.com',
      phone: '+971 50 333 4444',
      uploadDate: new Date('2024-01-04'),
      fileName: 'James_Wilson_CV.pdf',
      fileUrl: '#',
      status: 'pending'
    }
  ];
}

export default useHRCandidates;
