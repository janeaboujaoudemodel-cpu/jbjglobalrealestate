import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Undo2, Redo2, Save, Download, Settings, FileVideo,
  Check, Edit2, Loader2
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
  projectName, onRename, onNewProject, onUndo, onRedo,
  canUndo, canRedo, renderJob, onExport,
}: AIVideoStudioTopBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(projectName);

  const handleSave = () => { onRename(editName); setIsEditing(false); };

  const getRenderStatus = () => {
    if (!renderJob) return null;
    switch (renderJob.status) {
      case 'queued':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#C8A87A' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>In Queue…</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#A78BFA' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Rendering {renderJob.progress}%</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-sm" style={{ color: '#34D399' }}>
            <Check className="w-4 h-4" />
            <span>Ready to Download</span>
          </div>
        );
      case 'failed':
        return <div className="text-sm" style={{ color: '#E05252' }}>Render Failed</div>;
      default:
        return null;
    }
  };

  return (
    <div
      className="flex items-center justify-between px-6 min-h-[64px]"
      style={{
        background: 'linear-gradient(90deg, #0A0A0F 0%, #111118 50%, #0A0A0F 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Left — Logo & Project Name */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(200,168,122,0.12)', border: '1px solid rgba(200,168,122,0.3)' }}
          >
            <FileVideo className="w-4 h-4" style={{ color: '#C8A87A' }} />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-sm tracking-wide leading-tight" style={{ color: '#C8A87A' }}>
              JBJ AI Video Studio™
            </span>
            <span className="text-[9px] tracking-widest uppercase leading-tight" style={{ color: '#8A8A9A' }}>
              Professional Suite
            </span>
          </div>
        </div>

        <div className="h-8 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-8 w-48 text-sm border-0"
              style={{ background: '#1E1E28', color: '#F1F0EE', border: '1px solid rgba(200,168,122,0.25)' }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <button
              onClick={handleSave}
              className="p-1.5 rounded"
              style={{ color: '#C8A87A' }}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setEditName(projectName); setIsEditing(true); }}
            className="flex items-center gap-2 transition-opacity hover:opacity-80 group"
          >
            <span className="text-sm font-medium" style={{ color: '#F1F0EE' }}>{projectName}</span>
            <Edit2 className="w-3 h-3 opacity-40 group-hover:opacity-80" style={{ color: '#8A8A9A' }} />
          </button>
        )}
      </div>

      {/* Center — Undo/Redo & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded transition-opacity disabled:opacity-20"
            style={{ color: '#8A8A9A' }}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded transition-opacity disabled:opacity-20"
            style={{ color: '#8A8A9A' }}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
        {getRenderStatus()}
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNewProject}
          className="px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-80"
          style={{
            background: '#1E1E28',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F1F0EE',
          }}
        >
          New
        </button>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-80"
          style={{
            background: '#1E1E28',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F1F0EE',
          }}
          title="Auto-saved to Lovable Cloud"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all"
          style={{
            background: '#C8A87A',
            color: '#0A0A0F',
            boxShadow: '0 0 16px rgba(200,168,122,0.25)',
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        <button
          className="p-1.5 rounded-md transition-opacity hover:opacity-80"
          style={{
            background: '#1E1E28',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#8A8A9A',
          }}
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
