/**
 * AssetLibraryDialog — owner's signature + stamp library, with capture & manage.
 */
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Star, Trash2, Check } from "lucide-react";
import { useOwnerAssets, OwnerAsset, AssetKind } from "./useOwnerAssets";
import SignatureCapture from "./SignatureCapture";
import StampUpload from "./StampUpload";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Optional: when set, picking an asset closes the dialog and invokes callback */
  onPick?: (asset: OwnerAsset) => void;
  initialTab?: AssetKind;
}

export default function AssetLibraryDialog({ open, onOpenChange, onPick, initialTab = "signature" }: Props) {
  const { signatures, stamps, upload, setDefault, remove } = useOwnerAssets();
  const [adding, setAdding] = useState<AssetKind | null>(null);

  const onAdd = async (kind: AssetKind, blob: Blob, label: string) => {
    const ext = (blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
    await upload(kind, blob, label, ext);
    setAdding(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/30" data-no-contrast-guard>
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Signatures &amp; Stamps</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/65">
            Saved here once — reusable on every document, every form.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={initialTab}>
          <TabsList className="grid w-full grid-cols-2 bg-[#F7F2EA] border border-[#B89555]/25">
            <TabsTrigger value="signature">Signatures ({signatures.length})</TabsTrigger>
            <TabsTrigger value="stamp">Stamps ({stamps.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="signature" className="space-y-3 mt-3">
            {adding === "signature" ? (
              <SignatureCapture
                onCapture={(b, l) => onAdd("signature", b, l)}
                onCancel={() => setAdding(null)}
              />
            ) : (
              <>
                <AssetGrid
                  assets={signatures} bgWhite
                  onPick={onPick ? (a) => { onPick(a); onOpenChange(false); } : undefined}
                  onSetDefault={(a) => setDefault(a.id, "signature")}
                  onRemove={remove}
                />
                <Button variant="outline" className="w-full" onClick={() => setAdding("signature")}>
                  <Plus className="w-4 h-4 mr-1.5" /> Add signature
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="stamp" className="space-y-3 mt-3">
            {adding === "stamp" ? (
              <StampUpload
                onCapture={(f, l) => onAdd("stamp", f, l)}
                onCancel={() => setAdding(null)}
              />
            ) : (
              <>
                <AssetGrid
                  assets={stamps}
                  onPick={onPick ? (a) => { onPick(a); onOpenChange(false); } : undefined}
                  onSetDefault={(a) => setDefault(a.id, "stamp")}
                  onRemove={remove}
                />
                <Button variant="outline" className="w-full" onClick={() => setAdding("stamp")}>
                  <Plus className="w-4 h-4 mr-1.5" /> Add stamp
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function AssetGrid({
  assets, onPick, onSetDefault, onRemove, bgWhite,
}: {
  assets: OwnerAsset[];
  onPick?: (a: OwnerAsset) => void;
  onSetDefault: (a: OwnerAsset) => void;
  onRemove: (a: OwnerAsset) => void;
  bgWhite?: boolean;
}) {
  if (assets.length === 0) {
    return (
      <div className="text-center text-[12px] text-[#1A1A1A]/60 py-8 border border-dashed border-[#B89555]/30 rounded-md bg-[#F7F2EA]">
        Nothing saved yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {assets.map((a) => (
        <div key={a.id} className="relative group rounded-md border border-[#B89555]/30 overflow-hidden bg-[#F7F2EA]">
          <div
            className={["h-24 flex items-center justify-center p-2 cursor-pointer",
              bgWhite ? "bg-white" : "bg-[#FDFBF7]"].join(" ")}
            onClick={() => onPick?.(a)}
            title={onPick ? "Insert into document" : a.label}
          >
            {a.signedUrl ? (
              <img src={a.signedUrl} alt={a.label} className="max-h-full max-w-full object-contain"  loading="lazy" decoding="async" />
            ) : (
              <div className="text-[10px] text-[#1A1A1A]/40">loading…</div>
            )}
          </div>
          <div className="px-2 py-1.5 flex items-center gap-1 border-t border-[#B89555]/20">
            <div className="text-[11px] text-[#1A1A1A] truncate flex-1">{a.label}</div>
            {a.is_default && <Star className="w-3 h-3 text-[#B89555] fill-[#B89555]" />}
          </div>
          <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#FDFBF7]/95 border-t border-[#B89555]/30 flex">
            {onPick && (
              <button onClick={() => onPick(a)} className="flex-1 py-1.5 text-[11px] text-[#1A1A1A] hover:bg-[#EFE6D6] flex items-center justify-center gap-1">
                <Check className="w-3 h-3" /> Use
              </button>
            )}
            {!a.is_default && (
              <button onClick={() => onSetDefault(a)} className="flex-1 py-1.5 text-[11px] text-[#1A1A1A] hover:bg-[#EFE6D6] flex items-center justify-center gap-1">
                <Star className="w-3 h-3" /> Default
              </button>
            )}
            <button onClick={() => onRemove(a)} className="flex-1 py-1.5 text-[11px] text-red-600 hover:bg-red-50 flex items-center justify-center gap-1">
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
