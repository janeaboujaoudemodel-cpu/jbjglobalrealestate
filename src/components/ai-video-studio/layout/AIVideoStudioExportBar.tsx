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
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur">
      {/* Export Presets */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 mr-2">Export As:</span>
        {EXPORT_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            size="sm"
            variant={selectedPreset === preset.id ? 'default' : 'outline'}
            onClick={() => onSelectPreset(preset.id)}
            className={
              selectedPreset === preset.id
                ? 'bg-gold text-black hover:bg-gold/90 border-gold'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }
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
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button
          size="sm"
          onClick={onExportAll}
          disabled={isExporting}
          className="bg-gradient-to-r from-gold to-amber-500 text-black font-medium hover:opacity-90"
        >
          <Package className="w-4 h-4 mr-2" />
          Download All (ZIP)
        </Button>
      </div>
    </div>
  );
}
