import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { StampSVGRenderer } from './StampSVGRenderer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  X, Check, Copy, Plus, Loader2, Clock, Upload
} from 'lucide-react';

interface VersionItem {
  id: string;
  svg_source: string;
  template_key: string;
  created_at: string;
  is_favorite: boolean;
}

interface StampVersionSelectorProps {
  projectId: string;
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  inkMode?: boolean;
  onSelectVersion: (version: VersionItem) => void;
  onDuplicate: (version: VersionItem) => void;
  onSaveBoth?: (version: VersionItem) => void;
  onUploadNew: () => void;
  onClose: () => void;
}

export function StampVersionSelector({
  projectId,
  tintColor,
  secondaryColor,
  accentColor,
  fontFamily,
  inkMode,
  onSelectVersion,
  onDuplicate,
  onSaveBoth,
  onUploadNew,
  onClose,
}: StampVersionSelectorProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, [projectId]);

  async function loadVersions() {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('stamp_designs')
      .select('id, svg_source, template_key, created_at, is_favorite')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) {
      setVersions(data as VersionItem[]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-[hsl(var(--border))] w-[90vw] max-w-[700px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--pearl-1))] to-white">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-[hsl(var(--gold))]" />
            <span className="font-semibold text-sm text-[hsl(var(--foreground))]">Previous Versions</span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">({versions.length} designs)</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onUploadNew} className="h-7 text-[10px] gap-1 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))]">
              <Upload size={10} /> Upload New
            </Button>
            <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[hsl(var(--muted))] flex items-center justify-center">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[hsl(var(--gold))]" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Clock size={32} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No previous versions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {versions.map(v => (
                <div key={v.id} className="group bg-card/80 rounded-xl border-2 border-[hsl(var(--gold)/0.2)] hover:border-[hsl(var(--gold)/0.5)] transition-all cursor-pointer">
                  <div className="relative p-2 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-xl min-h-[100px]">
                    {v.is_favorite && (
                      <div className="absolute top-1 left-1 text-[7px] px-1 py-0.5 rounded bg-rose-50 text-rose-500 font-medium">♥</div>
                    )}
                    <StampSVGRenderer svgSource={v.svg_source} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} inkMode={inkMode} size={90} />
                  </div>
                  <div className="p-1.5 space-y-1">
                    <p className="text-[8px] text-[hsl(var(--muted-foreground))]">
                      {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex gap-1">
                      <Button size="sm"
                        className="flex-1 h-5 text-[8px] gap-0.5 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90"
                        onClick={() => { onSelectVersion(v); toast.success('Version applied'); }}>
                        <Check size={7} /> Use
                      </Button>
                      {onSaveBoth && (
                        <button onClick={(e) => { e.stopPropagation(); onSaveBoth(v); toast.success('Both versions saved'); }}
                          className="h-5 px-1 rounded border border-[hsl(var(--gold)/0.3)] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] text-[hsl(var(--muted-foreground))] text-[7px] gap-0.5"
                          title="Keep current + add this version">
                          <Plus size={7} /> Both
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); onDuplicate(v); toast.success('Duplicated'); }}
                        className="h-5 w-5 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)] text-[hsl(var(--muted-foreground))]">
                        <Copy size={7} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
