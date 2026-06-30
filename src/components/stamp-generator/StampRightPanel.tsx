/**
 * StampRightPanel — Tabbed right panel: Standard, Concepts, Favorites, AI Variations, Library, History.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StampSVGRenderer } from './StampSVGRenderer';
import { StampVariationsPanel } from './StampVariationsPanel';
import { StampRecentlyDeleted, DeletedStamp } from './StampRecentlyDeleted';
import { StampVersionSelector } from './StampVersionSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StampDesignConcept } from '@/lib/stampTemplates';
import {
  Heart, Loader2, Check, ChevronLeft, ChevronRight, Wand2,
  Sparkles, Clock, RefreshCw, Copy, Trash2, Download, Shield,
  BookOpen, Save, FolderOpen, RotateCw, Pencil, X, Package,
  GitCompare, Library as LibraryIcon, Star, Archive
} from 'lucide-react';
import DesignFavoriteButton from '@/components/toolkit/DesignFavoriteButton';
import { toast } from 'sonner';

const CONCEPTS_PER_PAGE = 6;

/** Relative time helper */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

interface StampRightPanelProps {
  // Concepts
  concepts: StampDesignConcept[];
  favoriteConcepts: StampDesignConcept[];
  generating: boolean;
  blocked: boolean;
  selectedId: string | null;
  svgOverrides: Record<string, string>;
  // Standard Model — pinned first card
  standardConcept: StampDesignConcept | null;
  // Style
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  manualFontSize?: number | null;
  inkMode?: boolean;
  togglingFav: string | null;
  // Variations
  variations: StampDesignConcept[];
  variationsLoading: boolean;
  // Deleted
  deletedStamps: DeletedStamp[];
  // Handlers
  onSelect: (c: StampDesignConcept) => void;
  onToggleFav: (c: StampDesignConcept) => void;
  onEditText: (c: StampDesignConcept) => void;
  onPreview: (c: StampDesignConcept) => void;
  onDelete: (c: StampDesignConcept) => void;
  onDuplicate: (c: StampDesignConcept) => void;
  onGenerate: () => void;
  onGenerateVariations: () => void;
  // Variation handlers
  onSelectVariation: (v: StampDesignConcept) => void;
  onDeleteVariation: (id: string) => void;
  onDuplicateVariation: (v: StampDesignConcept) => void;
  // Deleted handlers
  onRecoverDeleted: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onAdaptAndSave: (item: DeletedStamp) => void;
  // Version handlers
  projectId?: string;
  onSelectVersion: (v: any) => void;
  onSaveBothVersions: (v: any) => void;
  onDuplicateVersion: (v: any) => void;
  onUploadNew: () => void;
  // Export
  savedDesignId?: string | null;
  onExport: () => void;
  // New props
  isOwner?: boolean;
  onSwitchToLibrary?: (fn: () => void) => void;
  // Compare mode
  onCompare?: (concept: StampDesignConcept) => void;
  // Save to library
  onSaveToLibrary?: (concept: StampDesignConcept) => void;
}

export function StampRightPanel(props: StampRightPanelProps) {
  const [conceptPage, setConceptPage] = useState(0);
  const [activeTab, setActiveTab] = useState('standard');

  // Expose a way to switch to library tab from parent
  useEffect(() => {
    if (props.onSwitchToLibrary) {
      props.onSwitchToLibrary(() => setActiveTab('library'));
    }
  }, [props.onSwitchToLibrary]);

  // Build concepts list: standard first (excluded from regular list), then the rest
  const nonStandardConcepts = props.standardConcept
    ? props.concepts.filter(c => c.id !== props.standardConcept!.id)
    : props.concepts;
  const totalPages = Math.ceil(nonStandardConcepts.length / CONCEPTS_PER_PAGE);
  const pagedConcepts = nonStandardConcepts.slice(conceptPage * CONCEPTS_PER_PAGE, (conceptPage + 1) * CONCEPTS_PER_PAGE);

  return (
    <div className="w-[340px] xl:w-[400px] flex-shrink-0 min-w-0 flex flex-col overflow-hidden bg-[#FDFBF7]/80 border-l border-[hsl(var(--border))]">
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--pearl-1))] to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={12} className="text-[hsl(var(--gold))]" />
            <span className="text-[10px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Design Library</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={props.onGenerate} disabled={props.generating}
              className="h-6 text-[9px] gap-1 px-2">
              <RefreshCw size={9} className={props.generating ? 'animate-spin' : ''} /> Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={props.onGenerateVariations} disabled={props.variationsLoading}
              className="h-6 text-[9px] gap-1 px-2 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))]">
              <Sparkles size={9} /> AI Variations
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="flex-shrink-0 mx-2 mt-2 bg-[hsl(var(--muted))] h-8">
          <TabsTrigger value="standard" className="text-[9px] px-1 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            <Shield size={8} className="mr-0.5" /> Standard
          </TabsTrigger>
          <TabsTrigger value="concepts" className="text-[9px] px-1 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            Concepts
            {props.concepts.length > 0 && <Badge variant="secondary" className="ml-0.5 text-[7px] px-1 py-0 h-3.5">{props.concepts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="text-[9px] px-1 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            <Heart size={8} className="mr-0.5" />
            {props.favoriteConcepts.length > 0 && <Badge variant="secondary" className="ml-0.5 text-[7px] px-1 py-0 h-3.5">{props.favoriteConcepts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="variations" className="text-[9px] px-1 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            Vars
            {props.variations.length > 0 && <Badge variant="secondary" className="ml-0.5 text-[7px] px-1 py-0 h-3.5">{props.variations.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="library" className="text-[9px] px-1 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            <BookOpen size={8} className="mr-0.5" />
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[9px] px-1 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            <Clock size={8} className="mr-0.5" />
          </TabsTrigger>
        </TabsList>

        {/* ── Standard Tab ── */}
        <TabsContent value="standard" className="flex-1 overflow-y-auto p-3 mt-0 space-y-3">
          {props.standardConcept ? (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-[hsl(var(--gold))]" />
                <span className="text-[10px] font-bold text-[hsl(var(--foreground))] uppercase tracking-wider">Locked Reference Design</span>
              </div>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                This is your protected base design. It will never be overwritten by AI generation.
              </p>
              {/* Large standard render */}
              <div className="bg-[hsl(var(--pearl-1))] rounded-xl border-2 border-[hsl(var(--gold))] shadow-[0_0_0_4px_hsl(var(--gold)/0.12)] p-4 flex items-center justify-center cursor-pointer hover:shadow-md transition-all"
                onClick={() => props.onSelect(props.standardConcept!)}>
                <StampSVGRenderer
                  svgSource={props.svgOverrides[props.standardConcept.id] || props.standardConcept.svgSource}
                  tintColor={props.tintColor}
                  secondaryColor={props.secondaryColor}
                  accentColor={props.accentColor}
                  fontFamily={props.fontFamily}
                  fontWeight={props.fontBold ? 'bold' : 'normal'}
                  fontStyle={props.fontItalic ? 'italic' : 'normal'}
                  fontSize={props.manualFontSize}
                  inkMode={props.inkMode}
                  size={160}
                />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{props.standardConcept.label}</p>
                <p className="text-[8px] text-[hsl(var(--muted-foreground))]">Template: {props.standardConcept.templateKey}</p>
              </div>
              {/* Actions */}
              <div className="grid grid-cols-2 gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-[9px] gap-1"
                  onClick={() => props.onPreview(props.standardConcept!)}>
                  <Pencil size={8} /> Edit
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[9px] gap-1"
                  onClick={props.onExport}>
                  <Download size={8} /> Export
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-[9px] gap-1"
                  onClick={() => props.onDuplicate(props.standardConcept!)}>
                  <Copy size={8} /> Duplicate
                </Button>
                {props.onCompare && (
                  <Button size="sm" variant="outline" className="h-7 text-[9px] gap-1"
                    onClick={() => props.onCompare!(props.standardConcept!)}>
                    <GitCompare size={8} /> Compare
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 space-y-3">
              <Shield size={28} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
              <p className="text-[11px] font-medium text-[hsl(var(--foreground))]">No Standard Model Yet</p>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))] max-w-[200px] mx-auto">
                Generate concepts or use "Lock as Standard" on your active preview to create your reference design.
              </p>
              <Button size="sm" onClick={props.onGenerate}
                className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-[10px]">
                <Wand2 size={10} className="mr-1" /> Generate Concepts
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── Concepts Tab ── */}
        <TabsContent value="concepts" className="flex-1 overflow-y-auto p-3 mt-0 space-y-3">
          {/* Generating indicator */}
          {props.generating && props.standardConcept && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.2)]">
              <Loader2 size={12} className="animate-spin text-[hsl(var(--gold))]" />
              <span className="text-[10px] font-medium text-[hsl(var(--gold-dark))]">Generating concepts…</span>
            </div>
          )}

          {/* Pinned Standard Model mini-card in Concepts for quick reference */}
          {props.standardConcept && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Shield size={10} className="text-[hsl(var(--gold))]" />
                <span className="text-[9px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Standard Model</span>
              </div>
              <div
                className="bg-card/80 rounded-xl border-2 border-[hsl(var(--gold))] shadow-[0_0_0_3px_hsl(var(--gold)/0.15)] cursor-pointer transition-all hover:shadow-md"
                onClick={() => props.onSelect(props.standardConcept!)}
              >
                <div className="relative p-2 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-xl min-h-[100px]">
                  <Badge className="absolute top-1.5 left-1.5 z-10 text-[7px] px-1.5 py-0 bg-[hsl(var(--gold))] text-white border-0">
                    Standard
                  </Badge>
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center z-10">
                    <Check size={8} className="text-white" />
                  </div>
                  <StampSVGRenderer
                    svgSource={props.svgOverrides[props.standardConcept.id] || props.standardConcept.svgSource}
                    tintColor={props.tintColor}
                    secondaryColor={props.secondaryColor}
                    accentColor={props.accentColor}
                    fontFamily={props.fontFamily}
                    fontWeight={props.fontBold ? 'bold' : 'normal'}
                    fontStyle={props.fontItalic ? 'italic' : 'normal'}
                    fontSize={props.manualFontSize}
                    inkMode={props.inkMode}
                    size={90}
                  />
                </div>
                <div className="p-1.5">
                  <p className="text-[8px] font-medium text-[hsl(var(--foreground))] truncate">{props.standardConcept.label}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Concepts */}
          {props.generating ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-44 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
              ))}
            </div>
          ) : nonStandardConcepts.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{nonStandardConcepts.length} generated — click to apply</span>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setConceptPage(p => Math.max(0, p - 1))} disabled={conceptPage === 0}
                      className="w-5 h-5 rounded-md border border-[hsl(var(--border))] flex items-center justify-center disabled:opacity-30 hover:bg-[hsl(var(--gold)/0.06)]">
                      <ChevronLeft size={10} />
                    </button>
                    <span className="text-[9px] text-[hsl(var(--muted-foreground))]">{conceptPage + 1}/{totalPages}</span>
                    <button onClick={() => setConceptPage(p => Math.min(totalPages - 1, p + 1))} disabled={conceptPage >= totalPages - 1}
                      className="w-5 h-5 rounded-md border border-[hsl(var(--border))] flex items-center justify-center disabled:opacity-30 hover:bg-[hsl(var(--gold)/0.06)]">
                      <ChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                {pagedConcepts.map(c => (
                  <ConceptCard key={c.id} concept={c} svgOverride={props.svgOverrides[c.id]}
                    selectedId={props.selectedId} tintColor={props.tintColor} secondaryColor={props.secondaryColor}
                    accentColor={props.accentColor} fontFamily={props.fontFamily} fontBold={props.fontBold}
                    fontItalic={props.fontItalic} manualFontSize={props.manualFontSize} inkMode={props.inkMode}
                    togglingFav={props.togglingFav} onSelect={props.onSelect} onToggleFav={props.onToggleFav}
                    onEditText={props.onEditText} onPreview={props.onPreview} onDelete={props.onDelete}
                    onDuplicate={props.onDuplicate} onCompare={props.onCompare} onSaveToLibrary={props.onSaveToLibrary} />
                ))}
              </div>
            </>
          ) : !props.standardConcept ? (
            <div className="text-center py-12 space-y-3">
              <Wand2 size={28} className="text-[hsl(var(--gold))] mx-auto opacity-40" />
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Click "Regenerate" to create stamp concepts</p>
              <Button size="sm" onClick={props.onGenerate}
                className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-[10px]">
                <Wand2 size={10} className="mr-1" /> Generate Concepts
              </Button>
            </div>
          ) : null}

          {/* Export CTA */}
          {props.selectedId && !props.generating && (
            <div className="bg-gradient-to-r from-[hsl(var(--gold)/0.08)] to-[hsl(var(--champagne-1))] rounded-xl border border-[hsl(var(--gold)/0.2)] p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-[hsl(var(--foreground))] text-[11px]">Ready to export</p>
                <p className="text-[9px] text-[hsl(var(--muted-foreground))]">SVG, PNG, JPG, PDF</p>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1 text-[10px] h-7"
                onClick={props.onExport}>
                <Download size={10} /> Export
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── Favorites Tab ── */}
        <TabsContent value="favorites" className="flex-1 overflow-y-auto p-3 mt-0 space-y-3">
          {props.favoriteConcepts.length > 0 ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <Heart size={10} className="text-rose-500" />
                <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">{props.favoriteConcepts.length} Favorites</span>
              </div>
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                {props.favoriteConcepts.map(c => (
                  <ConceptCard key={c.id} concept={c} svgOverride={props.svgOverrides[c.id]}
                    selectedId={props.selectedId} tintColor={props.tintColor} secondaryColor={props.secondaryColor}
                    accentColor={props.accentColor} fontFamily={props.fontFamily} fontBold={props.fontBold}
                    fontItalic={props.fontItalic} manualFontSize={props.manualFontSize} inkMode={props.inkMode}
                    togglingFav={props.togglingFav} onSelect={props.onSelect} onToggleFav={props.onToggleFav}
                    onEditText={props.onEditText} onPreview={props.onPreview} onDelete={props.onDelete}
                    onDuplicate={props.onDuplicate} onCompare={props.onCompare} onSaveToLibrary={props.onSaveToLibrary}
                    cardStyle="favorite" />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 space-y-2">
              <Heart size={24} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
              <p className="text-[11px] font-medium text-[hsl(var(--foreground))]">No Favorites Yet</p>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Click the heart on any concept to save it here</p>
            </div>
          )}
        </TabsContent>

        {/* ── Variations Tab ── */}
        <TabsContent value="variations" className="flex-1 overflow-y-auto mt-0">
          {props.variations.length > 0 || props.variationsLoading ? (
            <StampVariationsPanel
              variations={props.variations}
              loading={props.variationsLoading}
              tintColor={props.tintColor}
              secondaryColor={props.secondaryColor}
              accentColor={props.accentColor}
              fontFamily={props.fontFamily}
              inkMode={props.inkMode}
              onSelectVariation={props.onSelectVariation}
              onDeleteVariation={(id) => props.onDeleteVariation(id)}
              onDuplicateVariation={props.onDuplicateVariation}
              onClose={() => setActiveTab('concepts')}
              onGenerate={props.onGenerateVariations}
            />
          ) : (
            <div className="text-center py-12 space-y-3 px-3">
              <Sparkles size={24} className="text-[hsl(var(--gold))] mx-auto opacity-40" />
              <p className="text-[11px] font-medium text-[hsl(var(--foreground))]">No Variations Yet</p>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Generate AI variations of your current design</p>
              <Button size="sm" onClick={props.onGenerateVariations}
                className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-[10px]">
                <Sparkles size={10} className="mr-1" /> Generate Variations
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ── Library Tab ── */}
        <TabsContent value="library" className="flex-1 overflow-y-auto p-3 mt-0 space-y-4">
          <StampLibraryPanel
            onApplyPreset={props.onSelect}
            isOwner={props.isOwner}
            standardConcept={props.standardConcept}
            svgOverrides={props.svgOverrides}
          />
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history" className="flex-1 overflow-y-auto p-3 mt-0 space-y-4">
          {props.projectId && (
            <HistoryList
              projectId={props.projectId}
              tintColor={props.tintColor}
              secondaryColor={props.secondaryColor}
              accentColor={props.accentColor}
              fontFamily={props.fontFamily}
              inkMode={props.inkMode}
              onSelectVersion={props.onSelectVersion}
              onSaveBoth={props.onSaveBothVersions}
              onDuplicate={props.onDuplicateVersion}
              onUploadNew={props.onUploadNew}
              onCompare={props.onCompare}
              onSaveToLibrary={props.onSaveToLibrary}
            />
          )}

          {/* Recently Deleted */}
          <StampRecentlyDeleted
            items={props.deletedStamps}
            tintColor={props.tintColor}
            secondaryColor={props.secondaryColor}
            accentColor={props.accentColor}
            fontFamily={props.fontFamily}
            inkMode={props.inkMode}
            onRecover={props.onRecoverDeleted}
            onPermanentDelete={props.onPermanentDelete}
            onAdaptAndSave={props.onAdaptAndSave}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** Library panel: DB-backed — My Projects, Style Presets (owner-only create), Brand Assets */
function StampLibraryPanel({ onApplyPreset, isOwner, standardConcept, svgOverrides }: {
  onApplyPreset: (c: any) => void;
  isOwner?: boolean;
  standardConcept?: any;
  svgOverrides?: Record<string, string>;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPreset, setSavingPreset] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const [projRes, presetRes, assetRes] = await Promise.all([
      supabase.from('stamp_projects').select('id, company_name, updated_at, selected_design_id, deleted_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }).limit(30),
      // Privacy fix: only load user's own presets
      supabase.from('stamp_presets' as any).select('id, name, description, config_json, svg_preview, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(50),
      supabase.from('brand_assets').select('id, name, svg_content, thumbnail_url, created_at')
        .eq('user_id', user.id).eq('asset_type', 'stamp').order('created_at', { ascending: false }).limit(20),
    ]);
    setProjects(projRes.data || []);
    setPresets(presetRes.data || []);
    setAssets(assetRes.data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSavePreset = async () => {
    if (!user?.id || !standardConcept) return;
    setSavingPreset(true);
    try {
      const svg = svgOverrides?.[standardConcept.id] || standardConcept.svgSource;
      const { error } = await supabase.from('stamp_presets' as any).insert({
        user_id: user.id,
        name: standardConcept.label || 'Custom Preset',
        description: `Saved ${new Date().toLocaleDateString()}`,
        config_json: { templateKey: standardConcept.templateKey, svgSource: svg },
        svg_preview: svg?.slice(0, 50000),
      });
      if (error) throw error;
      toast.success('Preset saved');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save preset');
    }
    setSavingPreset(false);
  };

  const handleDeletePreset = async (id: string) => {
    await supabase.from('stamp_presets' as any).delete().eq('id', id);
    toast.success('Preset removed');
    loadData();
  };

  const handleArchiveProject = async (id: string) => {
    await supabase.from('stamp_projects').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    toast.success('Project archived');
    loadData();
  };

  const handleRestoreProject = async (id: string) => {
    await supabase.from('stamp_projects').update({ deleted_at: null }).eq('id', id);
    toast.success('Project restored');
    loadData();
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return d; }
  };

  // Client-side search filter
  const q = searchQuery.toLowerCase().trim();
  const filteredProjects = projects
    .filter(p => showArchived ? p.deleted_at : !p.deleted_at)
    .filter(p => !q || (p.company_name || '').toLowerCase().includes(q));
  const filteredPresets = presets.filter(p => !q || (p.name || '').toLowerCase().includes(q));
  const filteredAssets = assets.filter(a => !q || (a.name || '').toLowerCase().includes(q));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-[hsl(var(--gold))]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search projects, presets, assets…"
          className="w-full h-8 pl-3 pr-8 text-[10px] rounded-lg border border-[hsl(var(--border))] bg-[#FDFBF7] focus:outline-none focus:border-[hsl(var(--gold))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
            <X size={10} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        )}
      </div>

      {/* Save as Preset (Owner Only) */}
      {isOwner && standardConcept && (
        <Button variant="outline" size="sm" disabled={savingPreset}
          className="w-full h-8 text-[10px] gap-1.5 border-[hsl(var(--gold)/0.4)] text-[hsl(var(--gold-dark))] hover:bg-[hsl(var(--gold)/0.06)]"
          onClick={handleSavePreset}>
          {savingPreset ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
          Save Current as Preset
        </Button>
      )}

      {/* My Projects */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <FolderOpen size={11} className="text-[hsl(var(--gold))]" />
          <span className="text-[10px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">My Projects</span>
          <Badge variant="secondary" className="ml-auto text-[7px] px-1 py-0 h-3.5">{filteredProjects.length}</Badge>
          <button onClick={() => setShowArchived(v => !v)}
            className="text-[8px] px-1.5 py-0.5 rounded border border-[hsl(var(--border))] hover:bg-[hsl(var(--gold)/0.06)] text-[hsl(var(--muted-foreground))]">
            {showArchived ? 'Active' : 'Archived'}
          </button>
        </div>
        {filteredProjects.length > 0 ? (
          <div className="space-y-1.5">
            {filteredProjects.slice(0, 8).map((proj: any) => (
              <div key={proj.id} className="w-full flex items-center gap-2 p-2 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] bg-[#FDFBF7]/80 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0">
                  <FolderOpen size={10} className="text-[hsl(var(--muted-foreground))]" />
                </div>
                <button className="flex-1 min-w-0 text-left" onClick={() => navigate(`/toolkit/stamp-generator/${proj.id}/generate`)}>
                  <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] truncate">{proj.company_name || 'Untitled'}</p>
                  <p className="text-[8px] text-[hsl(var(--muted-foreground))]">{formatDate(proj.updated_at)}</p>
                </button>
                <Badge variant="secondary" className="text-[6px] px-1 py-0 h-3 bg-blue-50 text-blue-600 border-blue-200 flex-shrink-0">Draft</Badge>
                {showArchived ? (
                  <button onClick={() => handleRestoreProject(proj.id)}
                    className="w-5 h-5 rounded flex items-center justify-center hover:jj-emerald-soft opacity-0 group-hover:opacity-100 transition-opacity" title="Restore">
                    <RotateCw size={9} className="text-[color:var(--emerald-1)]" />
                  </button>
                ) : (
                  <button onClick={() => handleArchiveProject(proj.id)}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" title="Archive">
                    <Archive size={9} className="text-[hsl(var(--muted-foreground))]" />
                  </button>
                )}
              </div>
            ))}
            {filteredProjects.length > 8 && (
              <Button variant="ghost" size="sm" className="w-full text-[10px] h-7" onClick={() => navigate('/toolkit/stamp-generator/projects')}>
                View all {filteredProjects.length} projects →
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            <FolderOpen size={14} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30 mb-1" />
            <p className="text-[9px] text-[hsl(var(--muted-foreground))]">
              {showArchived ? 'No archived projects' : 'No saved projects yet'}
            </p>
          </div>
        )}
      </div>

      {/* Style Presets */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Save size={11} className="text-[hsl(var(--gold))]" />
          <span className="text-[10px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Style Presets</span>
          <Badge variant="secondary" className="ml-auto text-[7px] px-1 py-0 h-3.5">{filteredPresets.length}</Badge>
        </div>
        {filteredPresets.length > 0 ? (
          <div className="space-y-1.5">
            {filteredPresets.map((preset: any) => (
              <div key={preset.id} className="flex items-center gap-2 p-2 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] bg-[#FDFBF7]/80 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-[hsl(var(--gold)/0.1)] flex items-center justify-center flex-shrink-0">
                  <Save size={10} className="text-[hsl(var(--gold))]" />
                </div>
                <button className="flex-1 min-w-0 text-left" onClick={() => {
                  const cfg = preset.config_json as any;
                  if (cfg?.svgSource) {
                    onApplyPreset({ id: preset.id, svgSource: cfg.svgSource, templateKey: cfg.templateKey || 'preset', label: preset.name, tags: [] });
                  }
                }}>
                  <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] truncate">{preset.name}</p>
                  <p className="text-[8px] text-[hsl(var(--muted-foreground))]">{preset.description || 'Style preset'}</p>
                </button>
                <Badge variant="secondary" className="text-[6px] px-1 py-0 h-3 bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border-[hsl(var(--gold)/0.3)] flex-shrink-0">Preset</Badge>
                {isOwner && (
                  <button onClick={() => handleDeletePreset(preset.id)}
                    className="w-5 h-5 rounded flex items-center justify-center hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                    <Trash2 size={9} className="text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <Save size={14} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30 mb-1" />
            <p className="text-[9px] text-[hsl(var(--muted-foreground))]">
              {isOwner ? 'No presets yet. Save your current design as a preset above.' : 'No presets available yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Brand Assets */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Package size={11} className="text-[hsl(var(--gold))]" />
          <span className="text-[10px] font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider">Brand Assets</span>
          <Badge variant="secondary" className="ml-auto text-[7px] px-1 py-0 h-3.5">{filteredAssets.length}</Badge>
        </div>
        {filteredAssets.length > 0 ? (
          <div className="space-y-1.5">
            {filteredAssets.map((asset: any) => (
              <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg border border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)] bg-[#FDFBF7]/80 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-[hsl(var(--muted))] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {asset.thumbnail_url ? (
                    <img src={asset.thumbnail_url} alt="" className="w-full h-full object-contain"  loading="lazy" decoding="async" />
                  ) : (
                    <Package size={10} className="text-[hsl(var(--muted-foreground))]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-[hsl(var(--foreground))] truncate">{asset.name}</p>
                  <p className="text-[8px] text-[hsl(var(--muted-foreground))]">{formatDate(asset.created_at)}</p>
                </div>
                <Badge variant="secondary" className="text-[6px] px-1 py-0 h-3 jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30 flex-shrink-0">Asset</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-3">
            <Package size={14} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30 mb-1" />
            <p className="text-[9px] text-[hsl(var(--muted-foreground))]">No brand assets yet. Use "Save Asset" to add stamps.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Enhanced inline version history for the History tab */
function HistoryList(props: {
  projectId: string;
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  inkMode?: boolean;
  onSelectVersion: (v: any) => void;
  onSaveBoth: (v: any) => void;
  onDuplicate: (v: any) => void;
  onUploadNew: () => void;
  onCompare?: (concept: StampDesignConcept) => void;
  onSaveToLibrary?: (concept: StampDesignConcept) => void;
}) {
  const { user } = useAuth();
  const [versions, setVersions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadVersions();
  }, [props.projectId]);

  async function loadVersions() {
    setLoading(true);
    const { data } = await supabase
      .from('stamp_designs')
      .select('id, svg_source, template_key, created_at, is_favorite, source')
      .eq('project_id', props.projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setVersions(data);
    setLoading(false);
  }

  function detectSource(v: any): { label: string; color: string } {
    // Prefer dedicated source column if available, fall back to heuristic
    const src = v.source || '';
    if (src === 'restored') return { label: 'Restored', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (src === 'generated' || src === 'ai') return { label: 'Generated', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    if (src === 'manual') return { label: 'Manual', color: 'jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30' };
    // Heuristic fallback for rows without source column
    const tk = v.template_key || '';
    if (tk.includes('restored')) return { label: 'Restored', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    if (tk.includes('generated') || tk.includes('ai-')) return { label: 'Generated', color: 'bg-purple-100 text-purple-700 border-purple-200' };
    return { label: 'Manual', color: 'jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30' };
  }

  async function handleToggleFavorite(v: any) {
    const newVal = !v.is_favorite;
    await supabase.from('stamp_designs').update({ is_favorite: newVal }).eq('id', v.id);
    setVersions(prev => prev.map(ver => ver.id === v.id ? { ...ver, is_favorite: newVal } : ver));
    toast.success(newVal ? 'Added to favorites' : 'Removed from favorites');
  }

  async function handleSaveToLibrary(v: any) {
    if (!user?.id) return;
    try {
      const { error } = await supabase.from('brand_assets').insert({
        user_id: user.id,
        asset_type: 'stamp' as any,
        name: (v.template_key || 'Stamp').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        svg_content: v.svg_source?.slice(0, 100000),
      });
      if (error) throw error;
      toast.success('Saved to Brand Assets library');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save');
    }
  }

  function versionToConcept(v: any): StampDesignConcept {
    return {
      id: v.id,
      templateKey: v.template_key || 'history',
      label: (v.template_key || 'History').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      tags: [],
      svgSource: v.svg_source,
    };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={18} className="animate-spin text-[hsl(var(--gold))]" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8 space-y-2">
        <Clock size={24} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
        <p className="text-[11px] font-medium text-[hsl(var(--foreground))]">No Version History Yet</p>
        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Your design versions will appear here as you save and edit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-[hsl(var(--gold))]" />
          <span className="text-[10px] font-semibold text-[hsl(var(--foreground))]">Version History</span>
          <Badge variant="secondary" className="text-[7px] px-1 py-0 h-3.5">{versions.length}</Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {versions.slice(0, 20).map(v => {
          const source = detectSource(v);
          return (
            <div key={v.id} className="group bg-card/80 rounded-lg border border-dashed border-[hsl(var(--muted-foreground)/0.3)] hover:border-[hsl(var(--gold)/0.5)] transition-all">
              <div className="relative p-1.5 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-lg min-h-[70px]">
                {/* Source badge */}
                <Badge className={`absolute bottom-1 left-1 z-10 text-[6px] px-1 py-0 border ${source.color}`}>
                  {source.label}
                </Badge>
                {/* Favorite indicator */}
                {v.is_favorite && (
                  <Heart size={8} className="absolute top-1 right-1 z-10 fill-rose-500 text-rose-500" />
                )}
                <StampSVGRenderer svgSource={v.svg_source} tintColor={props.tintColor} secondaryColor={props.secondaryColor}
                  accentColor={props.accentColor} fontFamily={props.fontFamily} inkMode={props.inkMode} size={60} />
              </div>
              <div className="p-1 space-y-0.5">
                <Badge className="text-[6px] px-1 py-0 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]">
                  Historical
                </Badge>
                <p className="text-[7px] text-[hsl(var(--muted-foreground))]">
                  {relativeTime(v.created_at)}
                </p>
                <div className="flex flex-wrap gap-0.5">
                  <button onClick={() => props.onSelectVersion(v)}
                    className="flex-1 h-5 text-[7px] rounded bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white flex items-center justify-center gap-0.5 hover:opacity-90"
                    title="Restore this version">
                    <RotateCw size={7} /> Restore
                  </button>
                  <button onClick={() => props.onDuplicate(v)}
                    className="h-5 w-5 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)]"
                    title="Duplicate">
                    <Copy size={7} />
                  </button>
                  {props.onCompare && (
                    <button onClick={() => props.onCompare!(versionToConcept(v))}
                      className="h-5 w-5 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)]"
                      title="Compare">
                      <GitCompare size={7} />
                    </button>
                  )}
                  <button onClick={() => handleToggleFavorite(v)}
                    className="h-5 w-5 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-rose-50"
                    title={v.is_favorite ? 'Unfavorite' : 'Favorite'}>
                    <Heart size={7} className={v.is_favorite ? 'fill-rose-500 text-rose-500' : ''} />
                  </button>
                  <button onClick={() => handleSaveToLibrary(v)}
                    className="h-5 w-5 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)]"
                    title="Save to Library">
                    <Archive size={7} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Compact concept card with visual hierarchy */
function ConceptCard({
  concept, svgOverride, selectedId, tintColor, secondaryColor, accentColor, fontFamily, fontBold, fontItalic, manualFontSize, inkMode, togglingFav,
  onSelect, onToggleFav, onEditText, onPreview, onDelete, onDuplicate, onCompare, onSaveToLibrary, cardStyle
}: {
  concept: StampDesignConcept;
  svgOverride?: string;
  selectedId: string | null;
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontBold?: boolean;
  fontItalic?: boolean;
  manualFontSize?: number | null;
  inkMode?: boolean;
  togglingFav: string | null;
  onSelect: (c: StampDesignConcept) => void;
  onToggleFav: (c: StampDesignConcept) => void;
  onEditText: (c: StampDesignConcept) => void;
  onPreview?: (c: StampDesignConcept) => void;
  onDelete?: (c: StampDesignConcept) => void;
  onDuplicate?: (c: StampDesignConcept) => void;
  onCompare?: (c: StampDesignConcept) => void;
  onSaveToLibrary?: (c: StampDesignConcept) => void;
  cardStyle?: 'favorite' | 'generated';
}) {
  const isSelected = selectedId === concept.id;
  const isFav = concept.isFavorite;
  const displaySvg = svgOverride || concept.svgSource;

  // Visual hierarchy via border styles
  const borderClasses = isSelected
    ? 'border-blue-500 shadow-[0_0_0_3px_hsl(210_100%_50%/0.15)]'
    : cardStyle === 'favorite'
    ? 'border-rose-300 hover:border-rose-400'
    : 'border-[hsl(var(--gold)/0.2)] hover:border-[hsl(var(--gold)/0.5)]';

  return (
    <div
      className={`group bg-card/80 rounded-xl border-2 transition-all shadow-sm hover:shadow-md cursor-pointer ${borderClasses}`}
      onClick={() => onSelect(concept)}
    >
      <div className="relative p-2 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-xl min-h-[100px]">
        {isSelected && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center z-10">
            <Check size={8} className="text-white" />
          </div>
        )}
        {/* Favorite heart button — top-left */}
        <button onClick={e => { e.stopPropagation(); onToggleFav(concept); }} disabled={togglingFav === concept.id}
          className={`absolute top-1 left-1 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-rose-50 border border-rose-200 text-rose-500' : 'bg-[#FDFBF7]/80 border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100'}`}>
          {togglingFav === concept.id ? <Loader2 size={8} className="animate-spin" /> : <Heart size={8} className={isFav ? 'fill-rose-500' : ''} />}
        </button>
        {/* Delete + Duplicate + Compare — bottom-right */}
        <div className="absolute bottom-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onCompare && (
            <button onClick={e => { e.stopPropagation(); onCompare(concept); }}
              className="w-5 h-5 rounded bg-[#FDFBF7]/90 border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.1)]"
              title="Compare">
              <GitCompare size={8} />
            </button>
          )}
          {onSaveToLibrary && (
            <button onClick={e => { e.stopPropagation(); onSaveToLibrary(concept); }}
              className="w-5 h-5 rounded bg-[#FDFBF7]/90 border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.1)]"
              title="Save to Library">
              <Archive size={8} />
            </button>
          )}
          {onDuplicate && (
            <button onClick={e => { e.stopPropagation(); onDuplicate(concept); }}
              className="w-5 h-5 rounded bg-[#FDFBF7]/90 border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.1)]">
              <Copy size={8} />
            </button>
          )}
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(concept); }}
              className="w-5 h-5 rounded bg-[#FDFBF7]/90 border border-destructive/30 flex items-center justify-center hover:bg-destructive/10 text-destructive">
              <Trash2 size={8} />
            </button>
          )}
        </div>
        {/* Status badge — bottom-left (moved from top-left to avoid overlap with heart) */}
        <Badge className={`absolute bottom-1 left-1 z-10 text-[6px] px-1 py-0 border ${
 isSelected
 ? 'bg-blue-100 text-blue-700 border-blue-200'
 : cardStyle === 'favorite'
 ? 'bg-rose-100 text-rose-700 border-rose-200'
 : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]'
 }`}>
          {isSelected ? 'Applied' : cardStyle === 'favorite' ? 'Favorite' : 'Generated'}
        </Badge>
        <StampSVGRenderer
          svgSource={displaySvg}
          tintColor={tintColor}
          secondaryColor={secondaryColor}
          accentColor={accentColor}
          fontFamily={fontFamily}
          fontWeight={fontBold ? 'bold' : 'normal'}
          fontStyle={fontItalic ? 'italic' : 'normal'}
          fontSize={manualFontSize}
          inkMode={inkMode}
          size={90}
        />
      </div>
      <div className="p-1.5 space-y-1">
        <p className="text-[8px] font-medium text-[hsl(var(--foreground))] truncate">{concept.label}</p>
        <div className="flex gap-0.5">
          <button onClick={e => { e.stopPropagation(); if (onPreview) onPreview(concept); }}
            className="flex-1 h-5 text-[7px] rounded bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white flex items-center justify-center gap-0.5 hover:opacity-90">
            <Wand2 size={7} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}