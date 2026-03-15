/**
 * StampSaveDialog — Post-save confirmation dialog with save type badge and navigation options.
 */
import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, FolderOpen, BookOpen, Pencil, Package } from 'lucide-react';

export type SaveType = 'draft' | 'design' | 'preset';

interface StampSaveDialogProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  savedAt: Date | null;
  saveType?: SaveType;
  onViewProjects: () => void;
  onOpenLibrary: () => void;
  onSaveAsAsset?: () => void;
}

const SAVE_TYPE_CONFIG: Record<SaveType, { label: string; badgeClass: string }> = {
  draft: { label: 'Draft Saved', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  design: { label: 'Design Saved', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  preset: { label: 'Preset Saved', badgeClass: 'bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))] border-[hsl(var(--gold)/0.3)]' },
};

export function StampSaveDialog({
  open, onClose, projectName, savedAt, saveType = 'design',
  onViewProjects, onOpenLibrary, onSaveAsAsset
}: StampSaveDialogProps) {
  const typeConfig = SAVE_TYPE_CONFIG[saveType];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
            <Check size={24} className="text-emerald-600" />
          </div>
          <DialogTitle className="text-center">Project Saved</DialogTitle>
          <DialogDescription className="text-center">
            <Badge className={`text-[9px] px-2 py-0.5 border ${typeConfig.badgeClass} mb-1`}>
              {typeConfig.label}
            </Badge>
            <span className="block font-semibold text-[hsl(var(--foreground))]">{projectName}</span>
            {savedAt && (
              <span className="block text-[11px] mt-0.5">
                {savedAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-2">
          <Button variant="outline" className="w-full justify-start gap-3 h-11 text-sm" onClick={onViewProjects}>
            <FolderOpen size={16} className="text-[hsl(var(--gold))]" />
            View in Projects
            <span className="ml-auto text-[10px] text-[hsl(var(--muted-foreground))]">Browse all saved stamps</span>
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-11 text-sm" onClick={onOpenLibrary}>
            <BookOpen size={16} className="text-[hsl(var(--gold))]" />
            Open Draft Library
            <span className="ml-auto text-[10px] text-[hsl(var(--muted-foreground))]">Side panel</span>
          </Button>
          {onSaveAsAsset && saveType === 'design' && (
            <Button variant="outline" className="w-full justify-start gap-3 h-11 text-sm border-emerald-200 hover:bg-emerald-50" onClick={() => { onSaveAsAsset(); onClose(); }}>
              <Package size={16} className="text-emerald-600" />
              Save as Brand Asset
              <span className="ml-auto text-[10px] text-[hsl(var(--muted-foreground))]">Reuse in other tools</span>
            </Button>
          )}
          <Button className="w-full justify-start gap-3 h-11 text-sm bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90"
            onClick={onClose}>
            <Pencil size={16} />
            Continue Editing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
