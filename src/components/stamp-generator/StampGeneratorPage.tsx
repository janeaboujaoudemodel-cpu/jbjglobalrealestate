import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import { generateStampConcepts, StampDesignConcept } from '@/lib/stampTemplates';
import {
  Wand2, Loader2, Check, RefreshCw, Download, Stamp,
  ArrowLeft, ChevronRight, AlertTriangle
} from 'lucide-react';

const TINT_COLORS = [
  { label: 'Navy', value: '#1a2744' },
  { label: 'Black', value: '#111111' },
  { label: 'Red', value: '#8B0000' },
  { label: 'Forest', value: '#1B4332' },
  { label: 'Purple', value: '#4B0082' },
];

export default function StampGeneratorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [concepts, setConcepts] = useState<StampDesignConcept[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tintColor, setTintColor] = useState('#1a2744');
  const [blocked, setBlocked] = useState(false);
  const [savedDesignId, setSavedDesignId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !projectId) return;
    loadProject();
  }, [user, projectId]);

  async function loadProject() {
    const { data, error } = await supabase
      .from('stamp_projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user!.id)
      .single();
    if (error || !data) { toast.error('Project not found'); navigate('/toolkit/stamp-generator'); return; }
    setProject(data);
    // Auto-generate if no existing designs
    const { data: existing } = await supabase
      .from('stamp_designs')
      .select('id, svg_source, template_key')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(7);
    if (existing && existing.length > 0) {
      const loaded: StampDesignConcept[] = existing.map((d: any) => ({
        id: d.id,
        templateKey: d.template_key || 'classic-double',
        label: d.template_key?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Design',
        tags: [],
        svgSource: d.svg_source || '',
      }));
      setConcepts(loaded);
    } else {
      generateConcepts(data);
    }
  }

  const generateConcepts = useCallback(async (proj?: any) => {
    const p = proj || project;
    if (!p) return;
    setGenerating(true);
    setBlocked(false);

    try {
      // Try server-side generation via edge function first
      if (session?.access_token) {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stamp-generator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'generate', project: p, projectId }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.blocked) {
            setBlocked(true);
            setGenerating(false);
            return;
          }
          if (json.concepts?.length) {
            // Reload saved concepts from DB
            const { data: saved } = await supabase
              .from('stamp_designs')
              .select('id, svg_source, template_key')
              .eq('project_id', projectId)
              .order('created_at', { ascending: false })
              .limit(7);
            if (saved && saved.length > 0) {
              setConcepts(saved.map((d: any) => ({
                id: d.id,
                templateKey: d.template_key || 'classic-double',
                label: d.template_key?.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Design',
                tags: [],
                svgSource: d.svg_source || '',
              })));
              setGenerating(false);
              return;
            }
          }
        }
      }
    } catch (_) {
      // fallback to client-side
    }

    // Client-side fallback
    const clientConcepts = generateStampConcepts(p);
    if (clientConcepts[0]?.templateKey === 'blocked') { setBlocked(true); setGenerating(false); return; }
    setConcepts(clientConcepts);
    setGenerating(false);
  }, [project, session, projectId]);

  async function selectDesign(concept: StampDesignConcept) {
    setSelectedId(concept.id);
    // If concept id is a UUID from DB, update project; else save it
    const isDbId = concept.id.length === 36;
    if (isDbId) {
      setSavedDesignId(concept.id);
      await supabase.from('stamp_projects').update({
        selected_design_id: concept.id,
        approval_status: 'FINAL_SELECTED',
      }).eq('id', projectId);
    } else {
      // Save to DB first
      const { data } = await supabase.from('stamp_designs').insert({
        project_id: projectId,
        user_id: user!.id,
        design_version: 1,
        template_key: concept.templateKey,
        svg_source: concept.svgSource,
        style_snapshot_json: project,
      }).select('id').single();
      if (data) {
        setSavedDesignId(data.id);
        await supabase.from('stamp_projects').update({
          selected_design_id: data.id,
          approval_status: 'FINAL_SELECTED',
        }).eq('id', projectId);
      }
    }
    toast.success('Design selected!');
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[hsl(var(--gold))]" size={32}/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/toolkit/stamp-generator')} className="gap-1">
              <ArrowLeft size={14}/> Projects
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]"/>
            <div className="flex items-center gap-2">
              <Stamp size={16} className="text-[hsl(var(--gold))]"/>
              <span className="font-medium text-sm text-[hsl(var(--foreground))]">{project.company_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateConcepts()}
              disabled={generating}
              className="gap-1 text-xs"
            >
              <RefreshCw size={12} className={generating ? 'animate-spin' : ''}/>
              {generating ? 'Generating…' : 'Regenerate'}
            </Button>
            {selectedId && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1 text-xs"
                onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}
              >
                <Download size={12}/> Export Pack <ChevronRight size={12}/>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Tint color picker */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Preview color:</span>
          {TINT_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setTintColor(c.value)}
              title={c.label}
              className={`w-6 h-6 rounded-full border-2 transition-all ${tintColor === c.value ? 'border-[hsl(var(--gold))] scale-110' : 'border-white'}`}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Preview only · final export is black</span>
        </div>

        {/* Blocked warning */}
        {blocked && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
            <AlertTriangle size={18}/>
            <div>
              <p className="font-semibold text-sm">Generation Blocked</p>
              <p className="text-xs">Official government or authority seals cannot be generated. Please use a company or business name.</p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {generating && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1,2,3,4,5,6,7].map(i => (
              <div key={i} className="h-72 rounded-2xl bg-[hsl(var(--muted))] animate-pulse"/>
            ))}
          </div>
        )}

        {/* Concepts grid */}
        {!generating && !blocked && concepts.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[hsl(var(--foreground))]">
                {concepts.length} Stamp Concepts
              </h2>
              {selectedId && <Badge className="bg-[hsl(var(--gold)/0.15)] text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]"><Check size={10} className="mr-1"/>Design Selected</Badge>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {concepts.map(concept => {
                const isSelected = selectedId === concept.id;
                return (
                  <div
                    key={concept.id}
                    className={`group bg-white rounded-2xl border-2 transition-all shadow-sm hover:shadow-md ${
                      isSelected
                        ? 'border-[hsl(var(--gold))] shadow-[0_0_0_3px_hsl(var(--gold)/0.15)]'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]'
                    }`}
                  >
                    {/* SVG Preview */}
                    <div className="relative p-4 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-2xl min-h-[180px]">
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
                          <Check size={12} className="text-white"/>
                        </div>
                      )}
                      <StampSVGRenderer
                        svgSource={concept.svgSource}
                        tintColor={tintColor}
                        size={160}
                      />
                    </div>

                    {/* Info */}
                    <div className="p-3 space-y-2">
                      <p className="font-medium text-sm text-[hsl(var(--foreground))]">{concept.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {concept.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className={`w-full h-7 text-xs gap-1 ${
                          isSelected
                            ? 'bg-[hsl(var(--gold))] text-white hover:bg-[hsl(var(--gold-dark))]'
                            : 'bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90'
                        }`}
                        onClick={() => selectDesign(concept)}
                      >
                        {isSelected ? <><Check size={10}/> Selected</> : 'Select This Design'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty state */}
        {!generating && !blocked && concepts.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <Wand2 size={40} className="text-[hsl(var(--gold))] mx-auto"/>
            <p className="text-[hsl(var(--muted-foreground))]">Click "Regenerate" to create stamp concepts</p>
            <Button onClick={() => generateConcepts()} className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white">
              <Wand2 size={14} className="mr-2"/> Generate Concepts
            </Button>
          </div>
        )}

        {/* Export CTA */}
        {selectedId && !generating && (
          <div className="bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-[hsl(var(--champagne-1))] rounded-2xl border border-[hsl(var(--gold)/0.2)] p-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-[hsl(var(--foreground))]">Design selected — ready to export!</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Download SVG, PNG, JPG, PDF + full brand pack</p>
            </div>
            <Button
              className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2"
              onClick={() => navigate(`/toolkit/stamp-generator/${projectId}/export/${savedDesignId || selectedId}`)}
            >
              <Download size={15}/> Export Pack
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
