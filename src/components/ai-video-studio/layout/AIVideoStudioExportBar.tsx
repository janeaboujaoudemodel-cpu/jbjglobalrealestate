import React from 'react';
import { Package, Sparkles, X } from 'lucide-react';
import { EXPORT_PRESETS, ExportPreset } from '../types';
import { BeautyAdjustments } from '../features/BeautyFiltersPanel';

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
    <div className="flex flex-col" style={{ background: '#090910', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Filter banner */}
      {hasFilter && (
        <div
          className="flex items-center gap-2 px-4 py-1.5"
          style={{ background: 'rgba(200,168,122,0.06)', borderBottom: '1px solid rgba(200,168,122,0.15)' }}
        >
          <Sparkles className="w-3 h-3 shrink-0" style={{ color: '#C8A87A' }} />
          <span className="text-[10px] font-semibold" style={{ color: '#C8A87A' }}>Beauty filter baked into export:</span>
          <span className="text-[10px] flex-1 truncate" style={{ color: '#8A8A9A' }}>{filterSummary}</span>
          <button
            onClick={onClearExportFilter}
            className="transition-opacity hover:opacity-70"
            style={{ color: '#C8A87A' }}
            title="Remove filter from export"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2">
        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs mr-1 font-semibold tracking-wide uppercase" style={{ color: '#C8A87A' }}>Export As:</span>
          {EXPORT_PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: isActive ? 'rgba(200,168,122,0.12)' : '#1E1E28',
                  border: isActive ? '1px solid rgba(200,168,122,0.4)' : '1px solid rgba(255,255,255,0.07)',
                  color: isActive ? '#C8A87A' : '#8A8A9A',
                }}
              >
                <span>{preset.icon}</span>
                <span className="hidden sm:inline">{preset.name}</span>
                <span className="text-xs opacity-60 ml-1 hidden md:inline">{preset.aspectRatio}</span>
              </button>
            );
          })}
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportAll}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all disabled:opacity-40"
            style={{
              background: '#C8A87A',
              color: '#0A0A0F',
              boxShadow: '0 0 16px rgba(200,168,122,0.2)',
            }}
          >
            <Package className="w-3.5 h-3.5" />
            Download All (ZIP)
          </button>
        </div>
      </div>
    </div>
  );
}
