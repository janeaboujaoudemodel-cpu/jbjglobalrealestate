import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StampSVGRenderer } from './StampSVGRenderer';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Trash2, RotateCcw, ChevronDown, Save, Archive } from 'lucide-react';

export interface DeletedStamp {
  id: string;
  svg_source: string;
  template_key: string;
  deleted_at: string;
  label: string;
}

interface StampRecentlyDeletedProps {
  items: DeletedStamp[];
  tintColor: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  inkMode?: boolean;
  onRecover: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onAdaptAndSave: (item: DeletedStamp) => void;
}

export function StampRecentlyDeleted({
  items,
  tintColor,
  secondaryColor,
  accentColor,
  fontFamily,
  inkMode,
  onRecover,
  onPermanentDelete,
  onAdaptAndSave,
}: StampRecentlyDeletedProps) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between py-2 px-1 text-[11px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
          <div className="flex items-center gap-1.5">
            <Archive size={11} />
            <span>Recently Deleted ({items.length})</span>
          </div>
          <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 pb-3">
          <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Items auto-delete after 30 days</p>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
            {items.map(item => {
              const daysLeft = Math.max(0, 30 - Math.floor((Date.now() - new Date(item.deleted_at).getTime()) / 86400000));
              return (
                <div key={item.id} className="bg-card/60 rounded-xl border border-[hsl(var(--border))] opacity-70 hover:opacity-100 transition-opacity">
                  <div className="relative p-2 flex items-center justify-center bg-[hsl(var(--muted)/0.3)] rounded-t-xl min-h-[100px]">
                    <div className="absolute top-1 right-1 text-[7px] px-1 py-0.5 rounded bg-destructive/10 text-destructive font-medium">
                      {daysLeft}d left
                    </div>
                    <StampSVGRenderer svgSource={item.svg_source} tintColor={tintColor} secondaryColor={secondaryColor} accentColor={accentColor} fontFamily={fontFamily} inkMode={inkMode} size={90} />
                  </div>
                  <div className="p-1.5 space-y-1">
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] truncate">{item.label}</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline"
                        className="flex-1 h-5 text-[8px] gap-0.5 border-[hsl(var(--gold)/0.3)] text-[hsl(var(--gold-dark))]"
                        onClick={() => onRecover(item.id)}>
                        <RotateCcw size={7} /> Recover
                      </Button>
                      <button onClick={() => onPermanentDelete(item.id)}
                        className="h-5 w-5 rounded border border-destructive/30 flex items-center justify-center hover:bg-destructive/10 text-destructive/70">
                        <Trash2 size={7} />
                      </button>
                    </div>
                    <Button size="sm" variant="ghost"
                      className="w-full h-5 text-[8px] gap-0.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--gold-dark))]"
                      onClick={() => onAdaptAndSave(item)}>
                      <Save size={7} /> Adapt & Save
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
