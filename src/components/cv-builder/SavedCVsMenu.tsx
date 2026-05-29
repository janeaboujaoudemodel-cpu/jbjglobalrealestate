import { useState } from "react";
import { FolderOpen, Trash2, RotateCcw, Eye, Pencil, Loader2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { SavedCVRow } from "@/hooks/useUserCVs";

interface Props {
  items: SavedCVRow[];
  trashed: SavedCVRow[];
  loading?: boolean;
  onOpen: (row: SavedCVRow) => void;
  onSoftDelete: (id: string) => Promise<void> | void;
  onRestore: (id: string) => Promise<void> | void;
  onHardDelete: (id: string) => Promise<void> | void;
}

export function SavedCVsMenu({ items, trashed, loading, onOpen, onSoftDelete, onRestore, onHardDelete }: Props) {
  const [active, setActive] = useState<SavedCVRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SavedCVRow | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="w-4 h-4 mr-1.5" /> Saved CVs ({items.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
          <DropdownMenuLabel>Your saved CVs</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {loading && (
            <div className="px-2 py-3 text-xs text-[#1A1A1A]/60 flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Loading…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="px-2 py-3 text-xs text-[#1A1A1A]/60">
              You haven't saved any CV yet. Click "Save" or "Download" to keep one here.
            </div>
          )}
          {items.map((row) => (
            <DropdownMenuItem
              key={row.id}
              onSelect={(e) => { e.preventDefault(); setActive(row); }}
              className="cursor-pointer flex flex-col items-start gap-0.5 py-2"
            >
              <span className="text-[13px] font-medium text-[#1A1A1A] truncate w-full">{row.title || "Untitled CV"}</span>
              <span className="text-[10px] text-[#1A1A1A]/55">
                Updated {new Date(row.updated_at).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))}
          {trashed.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/55">
                Recently deleted
              </DropdownMenuLabel>
              {trashed.map((row) => (
                <DropdownMenuItem
                  key={row.id}
                  onSelect={(e) => { e.preventDefault(); setActive(row); }}
                  className="cursor-pointer flex items-center justify-between py-2"
                >
                  <span className="text-[12px] text-[#1A1A1A]/70 truncate">{row.title}</span>
                  <RotateCcw className="w-3.5 h-3.5 text-[#1A1A1A]/55" />
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{active?.title || "CV"}</DialogTitle>
          </DialogHeader>
          {active && (
            <Tabs defaultValue="actions">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="meta">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="actions" className="space-y-2 pt-3">
                {!active.deleted_at ? (
                  <>
                    <Button variant="outline" className="w-full justify-start" onClick={() => { onOpen(active); setActive(null); }}>
                      <Eye className="w-4 h-4 mr-2" /> Preview
                    </Button>
                    <Button className="w-full justify-start" onClick={() => { onOpen(active); setActive(null); }}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={async () => { await onSoftDelete(active.id); setActive(null); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" className="w-full justify-start" onClick={async () => { await onRestore(active.id); setActive(null); }}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Restore
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={() => { setConfirmDelete(active); setActive(null); }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete permanently
                    </Button>
                  </>
                )}
              </TabsContent>
              <TabsContent value="meta" className="text-xs text-[#1A1A1A]/70 pt-3 space-y-1">
                <p>Created: {new Date(active.created_at).toLocaleString()}</p>
                <p>Updated: {new Date(active.updated_at).toLocaleString()}</p>
                {active.deleted_at && <p>Deleted: {new Date(active.deleted_at).toLocaleString()}</p>}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Permanently delete this CV?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#1A1A1A]/70">This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={async () => {
                if (confirmDelete) await onHardDelete(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
