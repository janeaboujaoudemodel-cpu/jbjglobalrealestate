import React from 'react';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { EXPORT_PRESETS, ExportPreset } from '../types';

interface AIVideoStudioExportBarProps {
  selectedPreset: string;
  onSelectPreset: (presetId: string) => void;
  onExportSingle: (preset: ExportPreset) => void;
  onExportAll: () => void;
  isExporting: boolean;
}

export function AIVideoStudioExportBar({
  selectedPreset,
  onSelectPreset,
  onExportSingle,
  onExportAll,
  isExporting,
}: AIVideoStudioExportBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-t border-slate-600">
      {/* Export Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-amber-300 mr-1 font-semibold tracking-wide uppercase">Export As:</span>
        {EXPORT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset.id)}
            className={
              selectedPreset === preset.id
                ? 'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold border border-amber-400 bg-amber-400/25 text-amber-200 transition-all'
                : 'flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-400 bg-slate-700 text-slate-100 hover:border-amber-400 hover:text-amber-300 hover:bg-slate-600 transition-all'
            }
          >
            <span>{preset.icon}</span>
            <span className="hidden sm:inline">{preset.name}</span>
            <span className="text-xs opacity-70 ml-1 hidden md:inline">{preset.aspectRatio}</span>
          </button>
        ))}
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExportAll}
          disabled={isExporting}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40 transition-all"
        >
          <Package className="w-3.5 h-3.5" />
          Download All (ZIP)
        </button>
      </div>
    </div>

  );
}
