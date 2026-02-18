import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Undo2, 
  Redo2, 
  Save, 
  Download, 
  Settings, 
  FileVideo,
  Check,
  Edit2,
  Loader2
} from 'lucide-react';
import { RenderJob } from '../types';

interface AIVideoStudioTopBarProps {
  projectName: string;
  onRename: (name: string) => void;
  onNewProject: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  renderJob?: RenderJob | null;
  onExport: () => void;
}

export function AIVideoStudioTopBar({
  projectName,
  onRename,
  onNewProject,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  renderJob,
  onExport,
}: AIVideoStudioTopBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(projectName);

  const handleSave = () => {
    onRename(editName);
    setIsEditing(false);
  };

  const getRenderStatus = () => {
    if (!renderJob) return null;

    switch (renderJob.status) {
      case 'queued':
        return (
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>In Queue...</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Rendering {renderJob.progress}%</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Check className="w-4 h-4" />
            <span>Ready to Download</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <span>Render Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-600">
      {/* Left Section - Logo & Project Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileVideo className="w-6 h-6 text-amber-400" />
          <span className="font-bold text-amber-400 text-base hidden sm:inline tracking-wide">JBJ AI Video Studio™</span>
        </div>

        <div className="h-6 w-px bg-slate-500" />

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 w-48 bg-slate-700 border-slate-500 text-white text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <Button size="sm" variant="ghost" onClick={handleSave} className="text-white hover:text-amber-400">
              <Check className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => { setEditName(projectName); setIsEditing(true); }}
            className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors group"
          >
            <span className="text-sm font-medium">{projectName}</span>
            <Edit2 className="w-3 h-3 opacity-60 group-hover:opacity-100" />
          </button>
        )}
      </div>

      {/* Center Section - Undo/Redo & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
        {getRenderStatus()}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewProject}
          className="px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-400 text-slate-100 bg-slate-700 hover:bg-slate-600 hover:border-slate-300 transition-all"
        >
          New
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border border-slate-400 text-slate-100 bg-slate-700 hover:bg-slate-600 hover:border-slate-300 transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <button
          className="p-1.5 rounded-md text-slate-200 hover:text-white border border-slate-500 bg-slate-700 hover:bg-slate-600 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

