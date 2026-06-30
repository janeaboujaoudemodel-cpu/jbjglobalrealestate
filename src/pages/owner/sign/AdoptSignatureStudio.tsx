import { useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IconTile } from "@/components/ui/icon-tile";
import {
  Stamp,
  PenLine,
  CheckCircle2,
  Loader2,
  Upload,
  ArrowLeft,
  Trash2,
  Star,
} from "lucide-react";
import ESignaturePad from "@/components/e-signature/ESignaturePad";
import {
  useApplyAdoptSignature,
  useOwnerSignatureAssets,
  useSaveSignatureAsset,
  type SignatureAssetKind,
  type OwnerSignatureAsset,
} from "@/hooks/useOwnerSignatureAssets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/* -----------------------------------------------------------
 * Profile-level Signature & Stamp manager.
 *
 *  • Two assets only: SIGNATURE (your handwritten autograph)
 *    and STAMP (your company stamp / chop). "Initials" is no
 *    longer collected here — when a contract field needs initials
 *    they are auto-derived from the recipient name inside the
 *    signing surface (see FieldContentRenderer.getInitials).
 *
 *  • Each section supports two capture modes:
 *      – Upload (primary, expected default for stamps)
 *      – Draw    (secondary, ideal for quick signatures on touch
 *                  devices)
 *
 *  • Saving sets the new asset as the user's default of that kind,
 *    so the in-contract "Adopt & Sign" flow can broadcast it to every
 *    matching field on every page DocuSign-style.
 * ----------------------------------------------------------- */

interface AssetSectionProps {
  kind: "signature" | "stamp";
  title: string;
  description: string;
  uploadHint: string;
}

function AssetSection({ kind, title, description, uploadHint }: AssetSectionProps) {
  const Icon = kind === "stamp" ? Stamp : PenLine;
  const [mode, setMode] = useState<"upload" | "draw">("upload");
  const [drawn, setDrawn] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const { data: assets = [] } = useOwnerSignatureAssets(kind);
  const save = useSaveSignatureAsset();

  const candidate = mode === "draw" ? drawn : uploaded;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setUploaded(reader.result as string);
    reader.readAsDataURL(f);
  };

  const saveAsset = () => {
    if (!candidate) {
      toast.error(mode === "draw" ? "Draw something first" : "Choose an image first");
      return;
    }
    save.mutate(
      { kind, image_data_url: candidate, makeDefault: true, label: `Default ${kind}` },
      {
        onSuccess: () => {
          setDrawn(null);
          setUploaded(null);
          if (fileRef.current) fileRef.current.value = "";
        },
      },
    );
  };

  const makeDefault = async (assetId: string) => {
    try {
      await supabase
        .from("owner_signature_assets" as any)
        .update({ is_default: false })
        .eq("kind", kind);
      await supabase
        .from("owner_signature_assets" as any)
        .update({ is_default: true })
        .eq("id", assetId);
      qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
      toast.success("Default updated");
    } catch (e: any) {
      toast.error(e.message || "Could not update default");
    }
  };

  const removeAsset = async (asset: OwnerSignatureAsset) => {
    if (!confirm(`Delete this ${kind}?`)) return;
    try {
      if (asset.storage_path) {
        await supabase.storage.from("owner-signature-assets").remove([asset.storage_path]);
      }
      await supabase.from("owner_signature_assets" as any).delete().eq("id", asset.id);
      qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
      toast.success("Removed");
    } catch (e: any) {
      toast.error(e.message || "Could not delete");
    }
  };

  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/25">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <IconTile icon={Icon} tone="gold" />
          <div className="flex-1">
            <CardTitle className="text-[#1A1A1A] text-lg leading-tight">{title}</CardTitle>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">{description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Capture modes — clean two-pill toggle, no overlap */}
        <div className="inline-flex rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-1">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={
              "px-4 h-9 rounded-md text-xs font-semibold flex items-center gap-1.5 transition " +
              (mode === "upload"
                ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50"
                : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]")
            }
          >
            <Upload className="h-3.5 w-3.5" />
            Upload image
          </button>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={
              "px-4 h-9 rounded-md text-xs font-semibold flex items-center gap-1.5 transition " +
              (mode === "draw"
                ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/50"
                : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]")
            }
          >
            <PenLine className="h-3.5 w-3.5" />
            Draw
          </button>
        </div>

        {mode === "upload" ? (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={onFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full bg-[#FDFBF7] border-2 border-dashed border-[#B89555]/35 hover:border-[#B89555] rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition min-h-[180px]"
            >
              {uploaded ? (
                <img src={uploaded} alt={`${kind} preview`} className="max-h-[140px] w-auto"  loading="lazy" decoding="async" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-[#B89555]" />
                  <span className="text-sm font-semibold text-[#1A1A1A]">
                    Click to upload your {kind}
                  </span>
                  <span className="text-xs text-[#1A1A1A]/60 text-center max-w-[320px]">
                    {uploadHint}
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-[#FDFBF7] border-2 border-dashed border-[#B89555]/35 rounded-xl p-2">
            <ESignaturePad onSignatureChange={setDrawn} height={180} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="gold" disabled={!candidate || save.isPending} onClick={saveAsset}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Save as my default {kind}
          </Button>
        </div>

        {assets.length > 0 && (
          <div className="pt-4 border-t border-[#B89555]/15">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#1A1A1A]/60 mb-3">
              Saved {kind}s
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {assets.map((a) => (
                <div
                  key={a.id}
                  className={
                    "group relative bg-white rounded-lg p-3 flex flex-col items-center justify-between gap-2 border " +
                    (a.is_default ? "border-[#B89555] ring-1 ring-[#B89555]/40" : "border-[#B89555]/20")
                  }
                >
                  <img src={a.image_url} alt={a.kind} className="h-14 w-auto object-contain"  loading="lazy" decoding="async" />
                  {a.is_default ? (
                    <span className="text-[10px] font-bold tracking-wide text-[#B89555] uppercase">
                      Default
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeDefault(a.id)}
                      className="text-[10px] font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A] flex items-center gap-1"
                    >
                      <Star className="h-3 w-3" />
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAsset(a)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition p-1 rounded bg-white/90 hover:bg-red-50 text-red-600"
                    title={`Delete ${kind}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdoptSignatureStudio() {
  const { envelopeId } = useParams<{ envelopeId?: string }>();
  const navigate = useNavigate();
  const apply = useApplyAdoptSignature();

  const { data: signatures = [] } = useOwnerSignatureAssets("signature");
  const { data: stamps = [] } = useOwnerSignatureAssets("stamp");
  const sig = signatures.find((s) => s.is_default) ?? signatures[0];
  const stamp = stamps.find((s) => s.is_default) ?? stamps[0];

  async function applyToEnvelope() {
    if (!envelopeId || !sig) return;
    const res = await apply.mutateAsync({
      envelope_id: envelopeId,
      signature_asset_id: sig.id,
      stamp_asset_id: stamp?.id,
    });
    if (res?.ok) navigate("/owner/contracts");
  }

  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <IconTile icon={PenLine} tone="gold" />
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Signature &amp; Stamp</h1>
            <p className="text-sm text-[#1A1A1A]/70 max-w-2xl">
              Save your handwritten signature and your company stamp once. They auto-apply to every
              matching field on every page when you sign a contract — DocuSign-style.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-[#B89555]/40 text-[#1A1A1A]"
        >
          <Link to="/owner/contracts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contract Vault
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="signature">
        <TabsList className="bg-[#F7F2EA] border border-[#B89555]/25 h-11 p-1 gap-1">
          <TabsTrigger
            value="signature"
            className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:border data-[state=active]:border-[#B89555]/50 px-5 h-9 text-sm font-semibold"
          >
            <PenLine className="h-4 w-4 mr-2" />
            Signature
          </TabsTrigger>
          <TabsTrigger
            value="stamp"
            className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:border data-[state=active]:border-[#B89555]/50 px-5 h-9 text-sm font-semibold"
          >
            <Stamp className="h-4 w-4 mr-2" />
            Stamp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signature" className="mt-5">
          <AssetSection
            kind="signature"
            title="Your Signature"
            description="The handwritten autograph that appears anywhere a contract asks you to sign. Saved once, broadcast to every signature field DocuSign-style."
            uploadHint="PNG or JPG, transparent background recommended. Max 5MB."
          />
        </TabsContent>

        <TabsContent value="stamp" className="mt-5">
          <AssetSection
            kind="stamp"
            title="Your Company Stamp"
            description="The official JBJ Global Real Estate stamp. Applied to every stamp field on signed agreements."
            uploadHint="Upload a clean scan of your company stamp. PNG with transparent background gives the cleanest overlay."
          />
        </TabsContent>
      </Tabs>

      {envelopeId && (
        <Card className="bg-[#F7F2EA] border-[#B89555]/25">
          <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                Apply to envelope #{envelopeId.slice(0, 8)}
              </p>
              <p className="text-xs text-[#1A1A1A]/70">
                Auto-fills every signature, stamp, and date field on every page. Final PDF is stored
                in the Contract Vault.
              </p>
            </div>
            <Button variant="gold" onClick={applyToEnvelope} disabled={!sig || apply.isPending}>
              {apply.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Sign &amp; file
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
