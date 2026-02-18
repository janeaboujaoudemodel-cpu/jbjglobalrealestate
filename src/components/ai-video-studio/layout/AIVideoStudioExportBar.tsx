import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Package } from 'lucide-react';
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
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-slate-700">
      {/* Export Presets */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-300 mr-2 font-medium">Export As:</span>
        {EXPORT_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            size="sm"
            onClick={() => onSelectPreset(preset.id)}
            className={
              selectedPreset === preset.id
                ? 'border border-amber-400 bg-amber-400/20 text-amber-300 font-semibold hover:bg-amber-400/30'
                : 'border border-slate-500 bg-slate-800 text-slate-200 hover:border-amber-400 hover:text-amber-300 hover:bg-slate-700'
            }
            variant="outline"
          >
            <span className="mr-1.5">{preset.icon}</span>
            <span className="hidden sm:inline">{preset.name}</span>
            <span className="text-xs opacity-70 ml-1.5 hidden md:inline">
              {preset.aspectRatio}
            </span>
          </Button>
        ))}
      </div>

      {/* Export Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const preset = EXPORT_PRESETS.find(p => p.id === selectedPreset);
            if (preset) onExportSingle(preset);
          }}
          disabled={isExporting}
          className="border border-amber-400/60 text-amber-300 hover:bg-amber-400/10 hover:border-amber-400 hover:text-amber-200 disabled:opacity-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          size="sm"
          onClick={onExportAll}
          disabled={isExporting}
          className="bg-amber-500 text-black font-bold hover:bg-amber-400 disabled:opacity-50"
        >
          <Package className="w-4 h-4 mr-2" />
          Download All (ZIP)
        </Button>
      </div>
    </div>
  );
}
