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
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 backdrop-blur">
      {/* Left Section - Logo & Project Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FileVideo className="w-6 h-6 text-gold" />
          <span className="font-semibold text-gold text-lg hidden sm:inline">JBJ AI Video Studio™</span>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 w-48 bg-slate-800 border-slate-700 text-white text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <Button size="sm" variant="ghost" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => {
              setEditName(projectName);
              setIsEditing(true);
            }}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <span className="text-sm font-medium">{projectName}</span>
            <Edit2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Center Section - Undo/Redo & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onUndo}
            disabled={!canUndo}
            className="text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRedo}
            disabled={!canRedo}
            className="text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        {getRenderStatus()}
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onNewProject}
          className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-500"
        >
          New
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-500"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button
          size="sm"
          onClick={onExport}
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
