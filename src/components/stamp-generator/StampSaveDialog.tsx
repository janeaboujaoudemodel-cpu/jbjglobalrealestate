/**
 * StampSaveDialog — Post-save confirmation dialog with navigation options.
 */
import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, FolderOpen, BookOpen, Pencil } from 'lucide-react';

interface StampSaveDialogProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  savedAt: Date | null;
  onViewProjects: () => void;
  onOpenLibrary: () => void;
}

export function StampSaveDialog({
  open, onClose, projectName, savedAt, onViewProjects, onOpenLibrary
}: StampSaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
            <Check size={24} className="text-emerald-600" />
          </div>
          <DialogTitle className="text-center">Project Saved</DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-semibold text-[hsl(var(--foreground))]">{projectName}</span>
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
