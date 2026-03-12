import React from 'react';
import { Package, Sparkles, X, Monitor, Smartphone, Square, RectangleVertical } from 'lucide-react';
import { EXPORT_PRESETS, ExportPreset } from '../types';
import { BeautyAdjustments } from '../features/BeautyFiltersPanel';

/** SVG platform icons mapped by preset icon key */
const PresetIcon = ({ iconKey }: { iconKey: string }) => {
  switch (iconKey) {
    case 'reels':
      return <Smartphone className="w-3.5 h-3.5" />;
    case 'youtube':
      return <Monitor className="w-3.5 h-3.5" />;
    case 'instagram':
      return <Square className="w-3.5 h-3.5" />;
    case 'portrait':
      return <RectangleVertical className="w-3.5 h-3.5" />;
    default:
      return <Monitor className="w-3.5 h-3.5" />;
  }
};

interface AIVideoStudioExportBarProps {
  selectedPreset: string;
  onSelectPreset: (presetId: string) => void;
  onExportSingle: (preset: ExportPreset) => void;
  onExportAll: () => void;
  isExporting: boolean;
  exportBeautyFilter?: BeautyAdjustments | null;
  onClearExportFilter?: () => void;
}

export function AIVideoStudioExportBar({
  selectedPreset, onSelectPreset, onExportSingle, onExportAll,
  isExporting, exportBeautyFilter, onClearExportFilter,
}: AIVideoStudioExportBarProps) {
  const hasFilter = exportBeautyFilter != null;

  const filterSummary = hasFilter ? Object.entries(exportBeautyFilter!)
    .filter(([, v]) => (v as number) !== 0)
    .map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)} ${(v as number) > 0 ? '+' : ''}${v}`)
    .join(' · ') : '';

  return (
    <div className="flex flex-col" style={{ background: '#0A0A10', borderTop: '1px solid rgba(184,148,62,0.12)' }}>
      {/* Filter banner */}
      {hasFilter && (
        <div
          className="flex items-center gap-2 px-4 py-1.5"
          style={{ background: 'rgba(184,148,62,0.06)', borderBottom: '1px solid rgba(184,148,62,0.15)' }}
        >
          <Sparkles className="w-3 h-3 shrink-0" style={{ color: '#B8943E' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#B8943E' }}>Beauty filter baked into export:</span>
          <span className="text-[10px] flex-1 truncate" style={{ color: '#8A8A9A' }}>{filterSummary}</span>
          <button
            onClick={onClearExportFilter}
            className="transition-opacity hover:opacity-70"
            style={{ color: '#B8943E' }}
            title="Remove filter from export"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs mr-1 font-semibold tracking-wide uppercase" style={{ color: '#B8943E' }}>Export:</span>
          {EXPORT_PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: isActive ? 'rgba(184,148,62,0.12)' : 'rgba(255,255,255,0.04)',
                  border: isActive ? '1px solid rgba(184,148,62,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  color: isActive ? '#B8943E' : '#8A8A9A',
                }}
              >
                <PresetIcon iconKey={preset.icon} />
                <span className="hidden sm:inline">{preset.name}</span>
                <span className="text-[10px] opacity-50 ml-0.5 hidden md:inline">{preset.aspectRatio}</span>
              </button>
            );
          })}
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportAll}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #D4C4A8, #B8943E)',
              color: '#0A0A0F',
              boxShadow: '0 0 16px rgba(184,148,62,0.2)',
            }}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download All (ZIP)</span>
            <span className="sm:hidden">ZIP</span>
          </button>
        </div>
      </div>
    </div>
  );
}
