/**
 * StampRightPanel — Tabbed right panel: Concepts, Favorites, AI Variations, History, Library.
 */
import React, { useState, useEffect } from 'react';
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
  BookOpen, Save, FolderOpen, RotateCw, Pencil, X
} from 'lucide-react';
import DesignFavoriteButton from '@/components/toolkit/DesignFavoriteButton';
import { toast } from 'sonner';

const CONCEPTS_PER_PAGE = 6;

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
}

export function StampRightPanel(props: StampRightPanelProps) {
  const [conceptPage, setConceptPage] = useState(0);
  const [activeTab, setActiveTab] = useState('concepts');

  // Build concepts list: standard first (excluded from regular list), then the rest
  const nonStandardConcepts = props.standardConcept
    ? props.concepts.filter(c => c.id !== props.standardConcept!.id)
    : props.concepts;
  const totalPages = Math.ceil(nonStandardConcepts.length / CONCEPTS_PER_PAGE);
  const pagedConcepts = nonStandardConcepts.slice(conceptPage * CONCEPTS_PER_PAGE, (conceptPage + 1) * CONCEPTS_PER_PAGE);

  return (
    <div className="w-[340px] xl:w-[400px] flex-shrink-0 min-w-0 flex flex-col overflow-hidden bg-white/80 border-l border-[hsl(var(--border))]">
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
          <TabsTrigger value="concepts" className="text-[9px] px-1.5 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            Concepts
            {props.concepts.length > 0 && <Badge variant="secondary" className="ml-1 text-[7px] px-1 py-0 h-3.5">{props.concepts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="favorites" className="text-[9px] px-1.5 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            Favorites
            {props.favoriteConcepts.length > 0 && <Badge variant="secondary" className="ml-1 text-[7px] px-1 py-0 h-3.5">{props.favoriteConcepts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="variations" className="text-[9px] px-1.5 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            Variations
            {props.variations.length > 0 && <Badge variant="secondary" className="ml-1 text-[7px] px-1 py-0 h-3.5">{props.variations.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="library" className="text-[9px] px-1.5 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            <BookOpen size={9} className="mr-0.5" /> Library
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[9px] px-1.5 flex-1 data-[state=active]:text-[hsl(var(--foreground))]">
            History
          </TabsTrigger>
        </TabsList>

        {/* Concepts Tab */}
        <TabsContent value="concepts" className="flex-1 overflow-y-auto p-3 mt-0 space-y-3">
          {/* Pinned Standard Model Card */}
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
                    onDuplicate={props.onDuplicate} />
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

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="flex-1 overflow-y-auto p-3 mt-0 space-y-3">
          {props.favoriteConcepts.length > 0 ? (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
              {props.favoriteConcepts.map(c => (
                <ConceptCard key={c.id} concept={c} svgOverride={props.svgOverrides[c.id]}
                  selectedId={props.selectedId} tintColor={props.tintColor} secondaryColor={props.secondaryColor}
                  accentColor={props.accentColor} fontFamily={props.fontFamily} fontBold={props.fontBold}
                  fontItalic={props.fontItalic} manualFontSize={props.manualFontSize} inkMode={props.inkMode}
                  togglingFav={props.togglingFav} onSelect={props.onSelect} onToggleFav={props.onToggleFav}
                  onEditText={props.onEditText} onPreview={props.onPreview} onDelete={props.onDelete}
                  onDuplicate={props.onDuplicate} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-2">
              <Heart size={24} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">No favorites yet — click the heart on any concept</p>
            </div>
          )}
        </TabsContent>

        {/* Variations Tab */}
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
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Generate AI variations of your current design</p>
              <Button size="sm" onClick={props.onGenerateVariations}
                className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white text-[10px]">
                <Sparkles size={10} className="mr-1" /> Generate Variations
              </Button>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 overflow-y-auto p-3 mt-0 space-y-4">
          {/* Version History inline */}
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

/** Inline version history for the History tab (replaces the modal StampVersionSelector) */
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
}) {
  const [versions, setVersions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadVersions();
  }, [props.projectId]);

  async function loadVersions() {
    setLoading(true);
    const { supabase } = await import('@/integrations/supabase/client');
    const { useAuth } = await import('@/contexts/AuthContext');
    // Direct query — we're inside authenticated context
    const { data } = await supabase
      .from('stamp_designs')
      .select('id, svg_source, template_key, created_at, is_favorite')
      .eq('project_id', props.projectId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setVersions(data);
    setLoading(false);
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
        <Clock size={20} className="text-[hsl(var(--muted-foreground))] mx-auto opacity-30" />
        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">No version history yet</p>
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
      <div className="grid grid-cols-3 gap-2">
        {versions.slice(0, 12).map(v => (
          <div key={v.id} className="group bg-card/80 rounded-lg border border-[hsl(var(--gold)/0.2)] hover:border-[hsl(var(--gold)/0.5)] transition-all">
            <div className="relative p-1.5 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-lg min-h-[70px]">
              <StampSVGRenderer svgSource={v.svg_source} tintColor={props.tintColor} secondaryColor={props.secondaryColor}
                accentColor={props.accentColor} fontFamily={props.fontFamily} inkMode={props.inkMode} size={60} />
            </div>
            <div className="p-1 space-y-0.5">
              <p className="text-[7px] text-[hsl(var(--muted-foreground))]">
                {new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex gap-0.5">
                <button onClick={() => props.onSelectVersion(v)}
                  className="flex-1 h-5 text-[7px] rounded bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white flex items-center justify-center gap-0.5 hover:opacity-90">
                  <Check size={7} /> Use
                </button>
                <button onClick={() => props.onDuplicate(v)}
                  className="h-5 w-5 rounded border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.06)]">
                  <Copy size={7} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact concept card for the right panel grid */
function ConceptCard({
  concept, svgOverride, selectedId, tintColor, secondaryColor, accentColor, fontFamily, fontBold, fontItalic, manualFontSize, inkMode, togglingFav,
  onSelect, onToggleFav, onEditText, onPreview, onDelete, onDuplicate
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
}) {
  const isSelected = selectedId === concept.id;
  const isFav = concept.isFavorite;
  const displaySvg = svgOverride || concept.svgSource;

  return (
    <div
      className={`group bg-card/80 rounded-xl border-2 transition-all shadow-sm hover:shadow-md cursor-pointer ${isSelected ? 'border-[hsl(var(--gold))] shadow-[0_0_0_3px_hsl(var(--gold)/0.15)]' : 'border-[hsl(var(--gold)/0.2)] hover:border-[hsl(var(--gold)/0.5)]'}`}
      onClick={() => onSelect(concept)}
    >
      <div className="relative p-2 flex items-center justify-center bg-[hsl(var(--pearl-1))] rounded-t-xl min-h-[100px]">
        {isSelected && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center z-10">
            <Check size={8} className="text-white" />
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); onToggleFav(concept); }} disabled={togglingFav === concept.id}
          className={`absolute top-1 left-1 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all ${isFav ? 'bg-rose-50 border border-rose-200 text-rose-500' : 'bg-white/80 border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100'}`}>
          {togglingFav === concept.id ? <Loader2 size={8} className="animate-spin" /> : <Heart size={8} className={isFav ? 'fill-rose-500' : ''} />}
        </button>
        {/* Delete + Duplicate */}
        <div className="absolute bottom-1 right-1 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDuplicate && (
            <button onClick={e => { e.stopPropagation(); onDuplicate(concept); }}
              className="w-5 h-5 rounded bg-white/90 border border-[hsl(var(--border))] flex items-center justify-center hover:bg-[hsl(var(--gold)/0.1)]">
              <Copy size={8} />
            </button>
          )}
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); onDelete(concept); }}
              className="w-5 h-5 rounded bg-white/90 border border-destructive/30 flex items-center justify-center hover:bg-destructive/10 text-destructive">
              <Trash2 size={8} />
            </button>
          )}
        </div>
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
