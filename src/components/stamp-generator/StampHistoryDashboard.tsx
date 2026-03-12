import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StampSVGRenderer } from '@/components/stamp-generator/StampSVGRenderer';
import {
  Stamp, ArrowLeft, ExternalLink, Download, Star, Search,
  Filter, Calendar, Layers, CheckCircle2, Clock, SlidersHorizontal,
  LayoutGrid, List, X
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface HistoryRow {
  design_id: string;
  project_id: string;
  project_name: string;
  company_name: string;
  template_key: string;
  svg_source: string | null;
  is_favorite: boolean;
  design_created_at: string;
  exported_at: string | null;
  export_status: string | null;
  style_snapshot_json: Record<string, unknown> | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const TEMPLATE_LABELS: Record<string, string> = {
  'classic-ring': 'Classic Ring',
  'modern-minimal': 'Modern Minimal',
  'luxury-ring': 'Luxury Ring',
  'bilingual-official': 'Bilingual Official',
  'geometric-modern': 'Geometric Modern',
  'vintage-seal': 'Vintage Seal',
  'arabic-modern': 'Arabic Modern',
  'corporate-rectangle': 'Corporate Rect',
  'oval-professional': 'Oval Professional',
  'bilingual-logo-center': 'Bilingual Logo Center',
  'ai-refined': 'AI Refined',
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function StampHistoryDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterExported, setFilterExported] = useState<'all' | 'exported' | 'draft'>('all');
  const [filterFav, setFilterFav] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'exported'>('newest');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth?redirect=/toolkit/stamp-generator/history', { replace: true }); return; }
    fetchHistory();
  }, [user, authLoading]);

  async function fetchHistory() {
    setLoading(true);
    // Join designs → projects → exports
    const { data, error } = await supabase
      .from('stamp_designs')
      .select(`
        id,
        project_id,
        template_key,
        svg_source,
        is_favorite,
        style_snapshot_json,
        created_at,
        stamp_projects!inner (
          id,
          project_name,
          company_name,
          user_id
        ),
        stamp_exports (
          created_at,
          status
        )
      `)
      .eq('stamp_projects.user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load history');
      setLoading(false);
      return;
    }

    const mapped: HistoryRow[] = (data || []).map((d: any) => {
      const exp = d.stamp_exports?.[0] ?? null;
      return {
        design_id: d.id,
        project_id: d.project_id,
        project_name: d.stamp_projects?.project_name ?? '—',
        company_name: d.stamp_projects?.company_name ?? '—',
        template_key: d.template_key ?? 'unknown',
        svg_source: d.svg_source,
        is_favorite: d.is_favorite ?? false,
        design_created_at: d.created_at,
        exported_at: exp?.created_at ?? null,
        export_status: exp?.status ?? null,
        style_snapshot_json: d.style_snapshot_json,
      };
    });

    setRows(mapped);
    setLoading(false);
  }

  // ── Filtered / sorted list ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x =>
        x.company_name.toLowerCase().includes(q) ||
        x.project_name.toLowerCase().includes(q) ||
        (TEMPLATE_LABELS[x.template_key] ?? x.template_key).toLowerCase().includes(q)
      );
    }
    if (filterFav) r = r.filter(x => x.is_favorite);
    if (filterExported === 'exported') r = r.filter(x => !!x.exported_at);
    if (filterExported === 'draft') r = r.filter(x => !x.exported_at);

    if (sortBy === 'oldest') r = [...r].sort((a, b) => a.design_created_at.localeCompare(b.design_created_at));
    else if (sortBy === 'exported') r = [...r].sort((a, b) => (b.exported_at ?? '').localeCompare(a.exported_at ?? ''));
    return r;
  }, [rows, search, filterFav, filterExported, sortBy]);

  // ── SVG tint from snapshot ──────────────────────────────────────────────────
  function getTint(row: HistoryRow) {
    const s = row.style_snapshot_json as any;
    return {
      primary: s?.primaryColor ?? '#1a2744',
      secondary: s?.secondaryColor,
      accent: s?.accentColor,
      font: s?.fontFamily,
    };
  }

  // ── Auth loading ────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-[hsl(var(--gold)/0.3)] border-t-[hsl(var(--gold))] animate-spin"/>
      </div>
    );
  }

  const exported = rows.filter(r => !!r.exported_at).length;
  const favorites = rows.filter(r => r.is_favorite).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* ── Header ── */}
      <div className="sticky top-0 lg:top-[48px] z-20 border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1.5 text-[hsl(var(--muted-foreground))]"
            onClick={() => navigate('/toolkit/stamp-generator/projects')}>
            <ArrowLeft size={15}/> Projects
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center shrink-0">
              <Stamp size={15} className="text-white"/>
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-[hsl(var(--foreground))] text-base leading-none">Stamp History</h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">All generated concepts across every project</p>
            </div>
          </div>
          {/* Summary chips */}
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-[hsl(var(--muted))] px-2.5 py-1 rounded-full text-[hsl(var(--foreground))]">
              {rows.length} designs
            </span>
            <span className="bg-[hsl(var(--gold)/0.1)] px-2.5 py-1 rounded-full text-[hsl(var(--gold-dark))] border border-[hsl(var(--gold)/0.3)]">
              {exported} exported
            </span>
            {favorites > 0 && (
              <span className="bg-amber-50 px-2.5 py-1 rounded-full text-amber-700 border border-amber-200">
                ★ {favorites} fav
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap gap-3 items-center border-b border-[hsl(var(--border)/0.5)]">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company, project, template…"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-[hsl(var(--border))] rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[hsl(var(--gold)/0.5)]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              <X size={12}/>
            </button>
          )}
        </div>

        {/* Export filter */}
        <div className="flex rounded-lg border border-[hsl(var(--border))] overflow-hidden text-xs">
          {(['all', 'exported', 'draft'] as const).map(f => (
            <button key={f}
              onClick={() => setFilterExported(f)}
              className={`px-3 py-1.5 capitalize transition-colors ${filterExported === f
                ? 'bg-[hsl(var(--gold))] text-white font-medium'
                : 'bg-white text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Favorites toggle */}
        <button
          onClick={() => setFilterFav(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${filterFav
            ? 'bg-amber-50 border-amber-300 text-amber-700'
            : 'bg-white border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
          <Star size={12} className={filterFav ? 'fill-amber-500 text-amber-500' : ''}/>
          Favorites
        </button>

        {/* Sort */}
        <div className="flex items-center gap-1.5 text-xs">
          <SlidersHorizontal size={13} className="text-[hsl(var(--muted-foreground))]"/>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="border border-[hsl(var(--border))] rounded-lg px-2 py-1.5 bg-white text-[hsl(var(--foreground))] focus:outline-none">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="exported">Export date</option>
          </select>
        </div>

        <div className="ml-auto flex rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <button onClick={() => setView('grid')}
            className={`p-1.5 transition-colors ${view === 'grid' ? 'bg-[hsl(var(--gold))] text-white' : 'bg-white text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
            <LayoutGrid size={14}/>
          </button>
          <button onClick={() => setView('list')}
            className={`p-1.5 transition-colors ${view === 'list' ? 'bg-[hsl(var(--gold))] text-white' : 'bg-white text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
            <List size={14}/>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className={view === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'
            : 'flex flex-col gap-3'}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`rounded-2xl bg-[hsl(var(--muted))] animate-pulse ${view === 'grid' ? 'h-52' : 'h-20'}`}/>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--gold)/0.1)] flex items-center justify-center mx-auto">
              <Stamp size={36} className="text-[hsl(var(--gold))]"/>
            </div>
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              {rows.length === 0 ? 'No stamp designs yet' : 'No designs match your filters'}
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-xs mx-auto">
              {rows.length === 0
                ? 'Generate your first AI stamp concept to see it here.'
                : 'Try clearing filters or adjusting your search.'}
            </p>
            {rows.length === 0 && (
              <Button onClick={() => navigate('/toolkit/stamp-generator/projects')}
                className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-2">
                <Stamp size={14}/> Go to Projects
              </Button>
            )}
          </div>
        ) : view === 'grid' ? (
          <GridView rows={filtered} getTint={getTint} navigate={navigate} />
        ) : (
          <ListView rows={filtered} getTint={getTint} navigate={navigate} />
        )}
      </div>
    </div>
  );
}

// ── Grid View ─────────────────────────────────────────────────────────────────
function GridView({ rows, getTint, navigate }: {
  rows: HistoryRow[];
  getTint: (r: HistoryRow) => { primary: string; secondary?: string; accent?: string; font?: string };
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {rows.map(row => {
        const tint = getTint(row);
        return (
          <div key={row.design_id}
            className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-all group overflow-hidden">

            {/* Thumbnail */}
            <div className="relative h-44 flex items-center justify-center bg-gradient-to-br from-[hsl(var(--pearl-1))] to-[hsl(var(--champagne-1))]">
              {row.svg_source ? (
                <StampSVGRenderer
                  svgSource={row.svg_source}
                  tintColor={tint.primary}
                  secondaryColor={tint.secondary}
                  accentColor={tint.accent}
                  fontFamily={tint.font}
                  size={130}
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-2 border-[hsl(var(--gold)/0.4)] flex items-center justify-center">
                  <Stamp size={28} className="text-[hsl(var(--gold))]"/>
                </div>
              )}

              {/* Badges overlay */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {row.is_favorite && (
                  <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">★ FAV</span>
                )}
                {row.exported_at && (
                  <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Download size={8}/> EXPORTED
                  </span>
                )}
              </div>
            </div>

            {/* Meta */}
            <div className="p-3 space-y-2">
              <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate leading-tight">
                {row.company_name}
              </p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                {row.project_name}
              </p>

              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[9px] px-1 py-0 truncate max-w-full">
                  {TEMPLATE_LABELS[row.template_key] ?? row.template_key}
                </Badge>
              </div>

              <div className="text-[10px] text-[hsl(var(--muted-foreground))] space-y-0.5">
                <div className="flex items-center gap-1">
                  <Calendar size={9}/> {fmtDate(row.design_created_at)}
                </div>
                {row.exported_at && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Download size={9}/> {fmtDate(row.exported_at)}
                  </div>
                )}
              </div>

              {/* CTA */}
              <Button
                size="sm"
                className="w-full h-7 text-xs bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1"
                onClick={() => navigate(`/toolkit/stamp-generator/${row.project_id}/generate`)}
              >
                <ExternalLink size={10}/> Open in Editor
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────
function ListView({ rows, getTint, navigate }: {
  rows: HistoryRow[];
  getTint: (r: HistoryRow) => { primary: string; secondary?: string; accent?: string; font?: string };
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rows.map(row => {
        const tint = getTint(row);
        return (
          <div key={row.design_id}
            className="bg-white rounded-xl border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-all flex items-center gap-4 px-4 py-3">

            {/* Thumbnail */}
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[hsl(var(--pearl-1))] to-[hsl(var(--champagne-1))] flex items-center justify-center shrink-0">
              {row.svg_source ? (
                <StampSVGRenderer
                  svgSource={row.svg_source}
                  tintColor={tint.primary}
                  secondaryColor={tint.secondary}
                  accentColor={tint.accent}
                  fontFamily={tint.font}
                  size={56}
                />
              ) : (
                <Stamp size={22} className="text-[hsl(var(--gold))]"/>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{row.company_name}</p>
                {row.is_favorite && <span className="text-amber-500 text-xs">★</span>}
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{row.project_name}</p>
              <div className="flex items-center gap-3 text-[10px] text-[hsl(var(--muted-foreground))] flex-wrap">
                <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                  <Layers size={8} className="mr-0.5"/>{TEMPLATE_LABELS[row.template_key] ?? row.template_key}
                </Badge>
                <span className="flex items-center gap-1"><Calendar size={9}/> {fmtDate(row.design_created_at)} {fmtTime(row.design_created_at)}</span>
                {row.exported_at ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 size={9}/> Exported {fmtDate(row.exported_at)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[hsl(var(--muted-foreground))]">
                    <Clock size={9}/> Draft
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-7 text-xs bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 gap-1"
                onClick={() => navigate(`/toolkit/stamp-generator/${row.project_id}/generate`)}
              >
                <ExternalLink size={11}/> Open Editor
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => navigate(`/toolkit/stamp-generator/${row.project_id}/gallery`)}
              >
                <Layers size={11}/> Gallery
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
