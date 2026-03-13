import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Plus, Stamp, Trash2, ExternalLink, Clock, CheckCircle2, Copy, Images, History, LayoutGrid, CheckSquare, X } from 'lucide-react';
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface StampProject {
  id: string;
  project_name: string;
  company_name: string;
  approval_status: string;
  stamp_type: string;
  style_theme: string;
  language_mode: string;
  created_at: string;
  updated_at: string;
}

export default function StampProjectsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StampProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  // Track whether we've waited at least one tick after auth resolved to prevent premature redirects
  const authSettledRef = useRef(false);

  useEffect(() => {
    // Still loading — wait
    if (authLoading) return;

    // Auth has resolved at least once — mark settled
    authSettledRef.current = true;

    if (!user) {
      // Only redirect if we're sure auth has fully resolved (not just initial null state)
      const timer = setTimeout(() => {
        navigate('/auth?redirect=/toolkit/stamp-generator/projects', { replace: true });
      }, 150); // tiny grace period to let session restore
      return () => clearTimeout(timer);
    }
    fetchProjects();
  }, [user, authLoading]);

  async function fetchProjects() {
    setLoading(true);
    const { data, error } = await supabase
      .from('stamp_projects')
      .select('*')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });
    if (error) toast.error('Failed to load projects');
    else setProjects(data || []);
    setLoading(false);
  }

  async function deleteProject(id: string) {
    setDeleting(id);
    const { error } = await supabase.from('stamp_projects').delete().eq('id', id);
    if (error) toast.error('Failed to delete project');
    else {
      toast.success('Project deleted');
      setProjects(prev => prev.filter(p => p.id !== id));
    }
    setDeleting(null);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === projects.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(projects.map(p => p.id)));
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = [...selectedIds];
    const { error } = await supabase.from('stamp_projects').delete().in('id', ids);
    if (error) toast.error('Failed to delete some projects');
    else {
      toast.success(`${ids.length} project${ids.length > 1 ? 's' : ''} deleted`);
      setProjects(prev => prev.filter(p => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
    }
    setBulkDeleting(false);
  }

  async function bulkDuplicate() {
    if (selectedIds.size === 0) return;
    const toDup = projects.filter(p => selectedIds.has(p.id));
    let count = 0;
    for (const project of toDup) {
      const { data } = await supabase.from('stamp_projects').insert({
        user_id: user!.id, project_name: `${project.project_name} (Copy)`,
        company_name: project.company_name, stamp_type: project.stamp_type,
        style_theme: project.style_theme, language_mode: project.language_mode,
      }).select().single();
      if (data) { setProjects(prev => [data, ...prev]); count++; }
    }
    toast.success(`${count} project${count > 1 ? 's' : ''} duplicated`);
    setSelectedIds(new Set());
  }

  async function duplicateProject(project: StampProject) {
    const { data, error } = await supabase
      .from('stamp_projects')
      .insert({
        user_id: user!.id,
        project_name: `${project.project_name} (Copy)`,
        company_name: project.company_name,
        stamp_type: project.stamp_type,
        style_theme: project.style_theme,
        language_mode: project.language_mode,
      })
      .select()
      .single();
    if (error) toast.error('Failed to duplicate');
    else {
      toast.success('Project duplicated');
      setProjects(prev => [data, ...prev]);
    }
  }

  const statusBadge = (status: string) =>
    status === 'FINAL_SELECTED'
      ? <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)] gap-1"><CheckCircle2 size={11}/>Finalized</Badge>
      : <Badge variant="secondary" className="gap-1"><Clock size={11}/>Draft</Badge>;

  // Show a full-screen loader while auth session is being restored (e.g. page refresh)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[hsl(var(--gold)/0.2)] to-[hsl(var(--champagne-1))] flex items-center justify-center animate-pulse">
            <Stamp size={28} className="text-[hsl(var(--gold))]"/>
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading your projects…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))] pt-4">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center">
              <Stamp size={18} className="text-white"/>
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--foreground))] text-base">Stamp Projects</h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={toggleSelectAll}
              >
                <CheckSquare size={13}/> {selectedIds.size === projects.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate('/toolkit/corporate-suite')}
            >
              <LayoutGrid size={13}/> Corporate Suite
            </Button>
            <Button
              variant="outline"
              className="gap-1.5 text-sm"
              onClick={() => navigate('/toolkit/stamp-generator/history')}
            >
              <History size={14}/> History
            </Button>
            <Button
              onClick={() => navigate('/toolkit/stamp-generator/new')}
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2"
            >
              <Plus size={15}/> New Stamp Project
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-[hsl(var(--muted))] animate-pulse"/>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--gold)/0.15)] to-[hsl(var(--champagne-1))] flex items-center justify-center mx-auto">
              <Stamp size={36} className="text-[hsl(var(--gold))]"/>
            </div>
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">No stamp projects yet</h2>
            <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto text-sm">
              Create your first professionally generated company stamp in minutes.
            </p>
            <Button
              onClick={() => navigate('/toolkit/stamp-generator/new')}
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2 mt-2"
            >
              <Plus size={15}/> Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-all group"
              >
                {/* Stamp Preview Placeholder */}
                <div className="h-40 rounded-t-2xl bg-gradient-to-br from-[hsl(var(--pearl-1))] to-[hsl(var(--champagne-1))] flex items-center justify-center border-b border-[hsl(var(--border))]">
                  <div className="w-24 h-24 rounded-full border-2 border-[hsl(var(--gold)/0.5)] flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[hsl(var(--gold-dark))] font-bold text-lg leading-none">{project.company_name.slice(0,2).toUpperCase()}</p>
                      <p className="text-[hsl(var(--gold))] text-[8px] mt-1 tracking-widest">STAMP</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-[hsl(var(--foreground))] text-sm truncate">{project.project_name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{project.company_name}</p>
                    </div>
                    {statusBadge(project.approval_status)}
                  </div>

                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{project.stamp_type}</Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{project.style_theme}</Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{project.language_mode}</Badge>
                  </div>

                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Updated {formatDate(project.updated_at)}</p>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90"
                      onClick={() => navigate(`/toolkit/stamp-generator/${project.id}/generate`)}
                    >
                      <ExternalLink size={11} className="mr-1"/> Open
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs gap-1"
                      title="Browse Gallery"
                      onClick={() => navigate(`/toolkit/stamp-generator/${project.id}/gallery`)}
                    >
                      <Images size={11}/> Gallery
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      title="Duplicate"
                      onClick={() => duplicateProject(project)}
                    >
                      <Copy size={11}/>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      title="Delete"
                      disabled={deleting === project.id}
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 size={11}/>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
