import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PenTool, Type, Upload, Loader2 } from "lucide-react";
import ESignaturePad from "./ESignaturePad";
import { toast } from "sonner";

const SCRIPT_FONTS = [
  { name: "Caveat", family: "'Caveat', cursive" },
  { name: "Dancing Script", family: "'Dancing Script', cursive" },
  { name: "Great Vibes", family: "'Great Vibes', cursive" },
  { name: "Allison", family: "'Allison', cursive" },
  { name: "Sacramento", family: "'Sacramento', cursive" },
];

interface AdoptAndSignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientName: string;
  fieldType: "signature" | "initials" | "stamp";
  onAdopt: (result: { signatureUrl: string; initialsUrl: string; broadcast: boolean; saveDefault: boolean }) => void;
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0]?.toUpperCase() || "").join("").slice(0, 4);
}

function textToDataUrl(text: string, fontFamily: string, width = 600, height = 180): string {
  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#1a1a1a";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  // pick the largest font size that fits
  let size = 110;
  while (size > 18) {
    ctx.font = `${size}px ${fontFamily}`;
    if (ctx.measureText(text).width < width - 40) break;
    size -= 4;
  }
  ctx.font = `${size}px ${fontFamily}`;
  ctx.fillText(text, width / 2, height / 2);
  return canvas.toDataURL("image/png");
}

export default function AdoptAndSignDialog({
  open,
  onOpenChange,
  recipientName,
  fieldType,
  onAdopt,
}: AdoptAndSignDialogProps) {
  const [tab, setTab] = useState<"draw" | "type" | "upload">("draw");
  const [drawnUrl, setDrawnUrl] = useState<string | null>(null);
  const [typedName, setTypedName] = useState(recipientName);
  const [typedInitials, setTypedInitials] = useState(getInitials(recipientName));
  const [selectedFont, setSelectedFont] = useState(SCRIPT_FONTS[0].family);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState(true);
  const [saveDefault, setSaveDefault] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTypedName(recipientName);
      setTypedInitials(getInitials(recipientName));
    }
  }, [open, recipientName]);

  // Inject Google Fonts once
  useEffect(() => {
    const id = "adopt-sign-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Dancing+Script:wght@500;700&family=Great+Vibes&family=Allison&family=Sacramento&display=swap";
    document.head.appendChild(link);
  }, []);

  const handleAdopt = () => {
    setBusy(true);
    try {
      let signatureUrl: string | null = null;
      let initialsUrl: string | null = null;

      if (tab === "draw") {
        if (!drawnUrl) {
          toast.error("Please draw your signature");
          setBusy(false);
          return;
        }
        signatureUrl = drawnUrl;
        // Auto-derive initials from the drawn signature (use the typed initials text rendered in script)
        initialsUrl = textToDataUrl(typedInitials, SCRIPT_FONTS[0].family, 280, 160);
      } else if (tab === "type") {
        if (!typedName.trim()) {
          toast.error("Please enter your name");
          setBusy(false);
          return;
        }
        signatureUrl = textToDataUrl(typedName, selectedFont, 600, 180);
        initialsUrl = textToDataUrl(typedInitials || getInitials(typedName), selectedFont, 280, 160);
      } else {
        if (!uploadUrl) {
          toast.error("Please upload an image");
          setBusy(false);
          return;
        }
        signatureUrl = uploadUrl;
        initialsUrl = textToDataUrl(typedInitials, SCRIPT_FONTS[0].family, 280, 160);
      }

      onAdopt({
        signatureUrl: signatureUrl!,
        initialsUrl: initialsUrl!,
        broadcast,
        saveDefault,
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setUploadUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adopt & Sign</DialogTitle>
          <DialogDescription>
            Choose how you want to sign. Your signature will be saved and auto-applied to every field that needs it.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="draw"><PenTool className="w-4 h-4 mr-2" />Draw</TabsTrigger>
            <TabsTrigger value="type"><Type className="w-4 h-4 mr-2" />Type</TabsTrigger>
            <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" />Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-3 pt-3">
            <ESignaturePad onSignatureChange={(url) => setDrawnUrl(url)} height={200} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Full name</Label>
                <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Initials</Label>
                <Input value={typedInitials} onChange={(e) => setTypedInitials(e.target.value)} maxLength={6} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Full name</Label>
                <Input value={typedName} onChange={(e) => setTypedName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Initials</Label>
                <Input value={typedInitials} onChange={(e) => setTypedInitials(e.target.value)} maxLength={6} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Style</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SCRIPT_FONTS.map((f) => (
                  <button
                    key={f.name}
                    type="button"
                    onClick={() => setSelectedFont(f.family)}
                    className={`px-4 py-3 rounded-lg border text-2xl text-left transition ${
                      selectedFont === f.family ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/.05)]" : "border-border hover:border-[hsl(var(--gold)/.4)]"
                    }`}
                    style={{ fontFamily: f.family }}
                  >
                    {typedName || "Your Name"}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3 pt-3">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl py-10 hover:border-[hsl(var(--gold)/.5)] transition"
            >
              {uploadUrl ? (
                <img src={uploadUrl} alt="signature" className="max-h-32 mx-auto"  loading="lazy" decoding="async" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Click to upload signature image (PNG/JPG, transparent recommended)</span>
                </div>
              )}
            </button>
            <div>
              <Label className="text-xs">Initials</Label>
              <Input value={typedInitials} onChange={(e) => setTypedInitials(e.target.value)} maxLength={6} />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-2 pt-2 border-t">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={broadcast} onCheckedChange={(c) => setBroadcast(!!c)} />
            Auto-fill <strong>every</strong> signature/initials field assigned to me on every page
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={saveDefault} onCheckedChange={(c) => setSaveDefault(!!c)} />
            Save as my default — apply automatically next time
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={handleAdopt} disabled={busy} className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Adopt & Sign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
