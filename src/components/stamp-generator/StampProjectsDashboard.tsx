import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Stamp, Trash2, ExternalLink, Clock, CheckCircle2, Copy, Images, History, LayoutGrid, CheckSquare, X, RotateCw, AlertTriangle } from 'lucide-react';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntilPurge(deletedAt: string): number {
  const deleted = new Date(deletedAt);
  const purge = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.max(0, Math.ceil((purge.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
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
  deleted_at: string | null;
}

export default function StampProjectsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<StampProject[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<StampProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const authSettledRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    authSettledRef.current = true;
    if (!user) {
      const timer = setTimeout(() => {
        navigate('/auth?redirect=/toolkit/stamp-generator/projects', { replace: true });
      }, 150);
      return () => clearTimeout(timer);
    }
    fetchProjects();
  }, [user, authLoading]);

  async function fetchProjects() {
    setLoading(true);
    // Active projects (not deleted)
    const { data: active, error: err1 } = await supabase
      .from('stamp_projects')
      .select('*')
      .eq('user_id', user!.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    
    // Recently deleted projects
    const { data: deleted, error: err2 } = await supabase
      .from('stamp_projects')
      .select('*')
      .eq('user_id', user!.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (err1) toast.error('Failed to load projects');
    else setProjects((active || []) as StampProject[]);
    
    setDeletedProjects((deleted || []) as StampProject[]);
    setLoading(false);
  }

  // Soft delete — sets deleted_at instead of hard delete
  async function softDeleteProject(id: string) {
    setDeleting(id);
    const { error } = await supabase
      .from('stamp_projects')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (error) toast.error('Failed to delete project');
    else {
      toast.success('Moved to Recently Deleted (30 days)');
      const moved = projects.find(p => p.id === id);
      setProjects(prev => prev.filter(p => p.id !== id));
      if (moved) setDeletedProjects(prev => [{ ...moved, deleted_at: new Date().toISOString() }, ...prev]);
    }
    setDeleting(null);
  }

  // Recover from recently deleted
  async function recoverProject(id: string) {
    const { error } = await supabase
      .from('stamp_projects')
      .update({ deleted_at: null } as any)
      .eq('id', id);
    if (error) toast.error('Failed to recover project');
    else {
      toast.success('Project recovered');
      const recovered = deletedProjects.find(p => p.id === id);
      setDeletedProjects(prev => prev.filter(p => p.id !== id));
      if (recovered) setProjects(prev => [{ ...recovered, deleted_at: null }, ...prev]);
      setSelectedDeletedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  // Permanently delete
  async function permanentlyDelete(id: string) {
    setDeleting(id);
    const { error } = await supabase.from('stamp_projects').delete().eq('id', id);
    if (error) toast.error('Failed to permanently delete');
    else {
      toast.success('Permanently deleted');
      setDeletedProjects(prev => prev.filter(p => p.id !== id));
      setSelectedDeletedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
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

  function toggleDeletedSelect(id: string) {
    setSelectedDeletedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleDeletedSelectAll() {
    if (selectedDeletedIds.size === deletedProjects.length) setSelectedDeletedIds(new Set());
    else setSelectedDeletedIds(new Set(deletedProjects.map(p => p.id)));
  }

  async function bulkSoftDelete() {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = [...selectedIds];
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('stamp_projects')
      .update({ deleted_at: now } as any)
      .in('id', ids);
    if (error) toast.error('Failed to delete some projects');
    else {
      toast.success(`${ids.length} project${ids.length > 1 ? 's' : ''} moved to Recently Deleted`);
      const moved = projects.filter(p => selectedIds.has(p.id)).map(p => ({ ...p, deleted_at: now }));
      setProjects(prev => prev.filter(p => !selectedIds.has(p.id)));
      setDeletedProjects(prev => [...moved, ...prev]);
      setSelectedIds(new Set());
    }
    setBulkDeleting(false);
  }

  async function bulkRecover() {
    if (selectedDeletedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = [...selectedDeletedIds];
    const { error } = await supabase
      .from('stamp_projects')
      .update({ deleted_at: null } as any)
      .in('id', ids);
    if (error) toast.error('Failed to recover some projects');
    else {
      toast.success(`${ids.length} project${ids.length > 1 ? 's' : ''} recovered`);
      const recovered = deletedProjects.filter(p => selectedDeletedIds.has(p.id)).map(p => ({ ...p, deleted_at: null }));
      setDeletedProjects(prev => prev.filter(p => !selectedDeletedIds.has(p.id)));
      setProjects(prev => [...recovered, ...prev]);
      setSelectedDeletedIds(new Set());
    }
    setBulkDeleting(false);
  }

  async function bulkPermanentlyDelete() {
    if (selectedDeletedIds.size === 0) return;
    if (!confirm(`Permanently delete ${selectedDeletedIds.size} project(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    const ids = [...selectedDeletedIds];
    const { error } = await supabase.from('stamp_projects').delete().in('id', ids);
    if (error) toast.error('Failed to delete some projects');
    else {
      toast.success(`${ids.length} project${ids.length > 1 ? 's' : ''} permanently deleted`);
      setDeletedProjects(prev => prev.filter(p => !selectedDeletedIds.has(p.id)));
      setSelectedDeletedIds(new Set());
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
      if (data) { setProjects(prev => [data as StampProject, ...prev]); count++; }
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
      setProjects(prev => [data as StampProject, ...prev]);
    }
  }

  const statusBadge = (status: string) =>
    status === 'FINAL_SELECTED'
      ? <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)] gap-1"><CheckCircle2 size={11}/>Finalized</Badge>
      : <Badge variant="secondary" className="gap-1"><Clock size={11}/>Draft</Badge>;

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
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{projects.length} active · {deletedProjects.length} deleted</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"
              onClick={() => navigate('/toolkit/corporate-suite')}>
              <LayoutGrid size={13}/> Corporate Suite
            </Button>
            <Button variant="outline" className="gap-1.5 text-sm"
              onClick={() => navigate('/toolkit/stamp-generator/history')}>
              <History size={14}/> History
            </Button>
            <Button onClick={() => navigate('/toolkit/stamp-generator/new')}
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2">
              <Plus size={15}/> New Stamp Project
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active" className="gap-1.5">
              <Stamp size={13}/> Active ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="deleted" className="gap-1.5">
              <Trash2 size={13}/> Recently Deleted ({deletedProjects.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Active Projects ── */}
          <TabsContent value="active">
            {projects.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={toggleSelectAll}>
                  <CheckSquare size={13}/> {selectedIds.size === projects.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            )}

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
                <Button onClick={() => navigate('/toolkit/stamp-generator/new')}
                  className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2 mt-2">
                  <Plus size={15}/> Create First Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map(project => (
                  <div key={project.id}
                    onClick={(e) => {
                      // Allow clicks on buttons/checkboxes to work normally
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('[role="checkbox"]') || target.closest('input')) return;
                      navigate(`/toolkit/stamp-generator/${project.id}/generate`);
                    }}
                    className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all group relative cursor-pointer ${selectedIds.has(project.id) ? 'border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold)/0.2)]' : 'border-[hsl(var(--border))]'}`}>
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox checked={selectedIds.has(project.id)} onCheckedChange={() => toggleSelect(project.id)}
                        className="border-[hsl(var(--gold)/0.5)] data-[state=checked]:bg-[hsl(var(--gold))] data-[state=checked]:border-[hsl(var(--gold))]"/>
                    </div>
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
                        <Button size="sm" className="flex-1 h-7 text-xs bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90"
                          onClick={() => navigate(`/toolkit/stamp-generator/${project.id}/generate`)}>
                          <ExternalLink size={11} className="mr-1"/> Open
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" title="Browse Gallery"
                          onClick={() => navigate(`/toolkit/stamp-generator/${project.id}/gallery`)}>
                          <Images size={11}/> Gallery
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 w-7 p-0" title="Duplicate"
                          onClick={() => duplicateProject(project)}>
                          <Copy size={11}/>
                        </Button>
                        <Button size="sm" variant="outline"
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" title="Delete"
                          disabled={deleting === project.id}
                          onClick={() => softDeleteProject(project.id)}>
                          <Trash2 size={11}/>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Recently Deleted ── */}
          <TabsContent value="deleted">
            {deletedProjects.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={toggleDeletedSelectAll}>
                  <CheckSquare size={13}/> {selectedDeletedIds.size === deletedProjects.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0"/>
              <div>
                <p className="text-sm font-medium text-amber-900">Recently Deleted</p>
                <p className="text-xs text-amber-700">Items here will be automatically purged after 30 days. You can recover or permanently delete them.</p>
              </div>
            </div>

            {deletedProjects.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <Trash2 size={32} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30"/>
                <p className="text-[hsl(var(--muted-foreground))] text-sm">No recently deleted projects</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {deletedProjects.map(project => (
                  <div key={project.id}
                    className={`bg-white/60 rounded-2xl border shadow-sm transition-all relative opacity-80 ${selectedDeletedIds.has(project.id) ? 'border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold)/0.2)]' : 'border-[hsl(var(--border))]'}`}>
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox checked={selectedDeletedIds.has(project.id)} onCheckedChange={() => toggleDeletedSelect(project.id)}
                        className="border-[hsl(var(--gold)/0.5)] data-[state=checked]:bg-[hsl(var(--gold))] data-[state=checked]:border-[hsl(var(--gold))]"/>
                    </div>
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="destructive" className="text-[9px] px-1.5">
                        {project.deleted_at ? `${daysUntilPurge(project.deleted_at)}d left` : ''}
                      </Badge>
                    </div>
                    <div className="h-32 rounded-t-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-b border-[hsl(var(--border))]">
                      <div className="w-20 h-20 rounded-full border-2 border-gray-300 flex items-center justify-center opacity-50">
                        <p className="text-gray-600 font-bold text-lg">{project.company_name.slice(0,2).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[hsl(var(--foreground))] text-sm truncate">{project.project_name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{project.company_name}</p>
                        <p className="text-[10px] text-destructive mt-1">
                          Deleted {project.deleted_at ? formatDate(project.deleted_at) : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline"
                          className="flex-1 h-7 text-xs gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => recoverProject(project.id)}>
                          <RotateCw size={11}/> Recover
                        </Button>
                        <Button size="sm" variant="outline"
                          className="flex-1 h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={deleting === project.id}
                          onClick={() => {
                            if (confirm('Permanently delete this project? This cannot be undone.')) {
                              permanentlyDelete(project.id);
                            }
                          }}>
                          <Trash2 size={11}/> Permanently Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating bulk action bar — active tab */}
      {activeTab === 'active' && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl border-2 border-[hsl(var(--gold)/0.4)] shadow-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-[hsl(var(--border))]"/>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={bulkDuplicate}>
            <Copy size={12}/> Duplicate
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
            disabled={bulkDeleting} onClick={bulkSoftDelete}>
            <Trash2 size={12}/> Delete
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedIds(new Set())}>
            <X size={14}/>
          </Button>
        </div>
      )}

      {/* Floating bulk action bar — deleted tab */}
      {activeTab === 'deleted' && selectedDeletedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl border-2 border-[hsl(var(--gold)/0.4)] shadow-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{selectedDeletedIds.size} selected</span>
          <div className="w-px h-5 bg-[hsl(var(--border))]"/>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            disabled={bulkDeleting} onClick={bulkRecover}>
            <RotateCw size={12}/> Recover All
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
            disabled={bulkDeleting} onClick={bulkPermanentlyDelete}>
            <Trash2 size={12}/> Permanently Delete
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedDeletedIds(new Set())}>
            <X size={14}/>
          </Button>
        </div>
      )}
    </div>
  );
}
