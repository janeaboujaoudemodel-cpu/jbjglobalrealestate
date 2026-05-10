import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IconTile } from "@/components/ui/icon-tile";
import { Stamp, PenLine, Type, CheckCircle2, Loader2 } from "lucide-react";
import ESignaturePad from "@/components/e-signature/ESignaturePad";
import {
  useApplyAdoptSignature,
  useOwnerSignatureAssets,
  useSaveSignatureAsset,
  type SignatureAssetKind,
} from "@/hooks/useOwnerSignatureAssets";

interface PadSectionProps {
  kind: SignatureAssetKind;
  title: string;
  description: string;
}

function PadSection({ kind, title, description }: PadSectionProps) {
  const [data, setData] = useState<string | null>(null);
  const { data: assets = [] } = useOwnerSignatureAssets(kind);
  const save = useSaveSignatureAsset();

  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/20">
      <CardHeader>
        <CardTitle className="text-[#1A1A1A] text-base flex items-center gap-2">
          <IconTile icon={kind === "stamp" ? Stamp : kind === "initial" ? Type : PenLine} tone="gold" size="sm" />
          {title}
        </CardTitle>
        <p className="text-sm text-[#1A1A1A]/70">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-[#FDFBF7] border-2 border-dashed border-[#B89555]/30 rounded-md p-2">
          <ESignaturePad onSignatureChange={setData} height={150} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="gold"
            size="sm"
            disabled={!data || save.isPending}
            onClick={() =>
              data &&
              save.mutate({ kind, image_data_url: data, makeDefault: true, label: `Default ${kind}` })
            }
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Adopt as default
          </Button>
        </div>
        {assets.length > 0 && (
          <div className="pt-3 border-t border-[#B89555]/15">
            <p className="text-xs text-[#1A1A1A]/70 mb-2">Saved {kind}s:</p>
            <div className="flex flex-wrap gap-2">
              {assets.map((a) => (
                <div
                  key={a.id}
                  className={`relative bg-white border rounded-md p-1 ${a.is_default ? "border-[#B89555] ring-1 ring-gold" : "border-[#B89555]/20"}`}
                >
                  <img src={a.image_url} alt={a.kind} className="h-12 w-auto" />
                  {a.is_default && (
                    <span className="absolute -top-2 -right-2 bg-[#EFE6D6] text-[#1A1A1A] text-[9px] font-bold px-1.5 py-0.5 rounded">
                      DEFAULT
                    </span>
                  )}
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
  const { data: initials = [] } = useOwnerSignatureAssets("initial");
  const sig = signatures.find((s) => s.is_default) ?? signatures[0];
  const stamp = stamps.find((s) => s.is_default) ?? stamps[0];
  const init = initials.find((s) => s.is_default) ?? initials[0];

  async function applyToEnvelope() {
    if (!envelopeId || !sig) return;
    const res = await apply.mutateAsync({
      envelope_id: envelopeId,
      signature_asset_id: sig.id,
      stamp_asset_id: stamp?.id,
      initials_asset_id: init?.id,
    });
    if (res?.ok) navigate("/owner/contracts");
  }

  return (
    <div className="p-6 space-y-6 bg-[#FDFBF7] min-h-screen">
      <div className="flex items-center gap-3">
        <IconTile icon={Stamp} tone="purple" />
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Adopt Signature Studio</h1>
          <p className="text-sm text-[#1A1A1A]/70">
            Sign once → applies to every signature, initial, stamp, and date field on the document.
          </p>
        </div>
      </div>

      <Tabs defaultValue="signature">
        <TabsList className="bg-[#F7F2EA] border border-[#B89555]/20">
          <TabsTrigger value="signature" className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
            Signature
          </TabsTrigger>
          <TabsTrigger value="initial" className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
            Initials
          </TabsTrigger>
          <TabsTrigger value="stamp" className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]">
            Stamp
          </TabsTrigger>
        </TabsList>
        <TabsContent value="signature" className="mt-4">
          <PadSection kind="signature" title="Your Signature" description="Drawn here once, used everywhere — DocuSign-style adopt." />
        </TabsContent>
        <TabsContent value="initial" className="mt-4">
          <PadSection kind="initial" title="Your Initials" description="Used for short field placements." />
        </TabsContent>
        <TabsContent value="stamp" className="mt-4">
          <PadSection kind="stamp" title="Your Stamp" description="Official company stamp — applied to every stamp field." />
        </TabsContent>
      </Tabs>

      {envelopeId && (
        <Card className="bg-[#F7F2EA] border-[#B89555]/20">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">Apply to envelope #{envelopeId.slice(0, 8)}</p>
              <p className="text-xs text-[#1A1A1A]/70">
                Auto-fills every signature, initial, stamp, and date field. Saves to Contract Vault.
              </p>
            </div>
            <Button variant="gold" onClick={applyToEnvelope} disabled={!sig || apply.isPending}>
              {apply.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Sign & file
            </Button>
          </CardContent>
        </Card>
      )}

      {!envelopeId && (
        <p className="text-xs text-[#1A1A1A]/60">
          Open a contract from the Contract Vault to apply your adopted signature.
        </p>
      )}
    </div>
  );
}
