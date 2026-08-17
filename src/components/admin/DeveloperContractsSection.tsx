/**
 * DeveloperContractsSection
 *
 * Owner/admin-only card that lists signed brokerage contracts saved to a
 * developer profile. Files live in the private `developer-contracts` storage
 * bucket; metadata lives in `public.developer_contracts`. Downloads use
 * signed URLs so the bucket stays private.
 */
import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { safeOpen } from "@/utils/safeUrl";

type Props = {
  developerId: string;
  developerName?: string | null;
  canEdit: boolean;
};

type ContractRow = {
  id: string;
  developer_id: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  source: string;
  notes: string | null;
  created_at: string;
};

const BUCKET = "developer-contracts";

function formatBytes(n: number | null) {
  if (!n && n !== 0) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DeveloperContractsSection({ developerId, developerName, canEdit }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ["dev-contracts", developerId],
    enabled: !!developerId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("developer_contracts")
        .select("id, developer_id, file_path, file_name, mime_type, size_bytes, source, notes, created_at")
        .eq("developer_id", developerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContractRow[];
    },
  });

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file || !developerId) return;
      setUploading(true);
      try {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${developerId}/${Date.now()}_${safe}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (upErr) throw upErr;

        const { data: userData } = await supabase.auth.getUser();
        const { error: insErr } = await (supabase as any).from("developer_contracts").insert({
          developer_id: developerId,
          file_path: path,
          file_name: file.name,
          mime_type: file.type || null,
          size_bytes: file.size,
          source: "upload",
          uploaded_by: userData?.user?.id ?? null,
        });
        if (insErr) throw insErr;

        toast.success(`Contract saved for ${developerName || "developer"}`);
        qc.invalidateQueries({ queryKey: ["dev-contracts", developerId] });
      } catch (e: any) {
        toast.error(`Upload failed: ${e?.message || "unknown error"}`);
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [developerId, developerName, qc]
  );

  const handleDownload = async (c: ContractRow) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(c.file_path, 300);
    if (error || !data?.signedUrl) {
      toast.error(`Download failed: ${error?.message || "no url"}`);
      return;
    }
    safeOpen(data.signedUrl);
  };

  const handleDelete = async (c: ContractRow) => {
    if (!window.confirm(`Delete contract "${c.file_name}"? This cannot be undone.`)) return;
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove([c.file_path]);
    if (rmErr) {
      toast.error(`Storage delete failed: ${rmErr.message}`);
      return;
    }
    const { error: delErr } = await (supabase as any)
      .from("developer_contracts")
      .delete()
      .eq("id", c.id);
    if (delErr) {
      toast.error(`Record delete failed: ${delErr.message}`);
      return;
    }
    toast.success("Contract removed");
    qc.invalidateQueries({ queryKey: ["dev-contracts", developerId] });
  };

  return (
    <Card className="border border-emerald-900/15 bg-white" data-no-contrast-guard="true">
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base font-black text-[#0F1A16] flex items-center gap-2">
            <FileText className="size-4 text-[#064E3B]" />
            Signed Contracts
          </CardTitle>
          <p className="text-xs text-[#4B5D55] mt-1">
            Countersigned brokerage agreements &amp; registration confirmations from {developerName || "this developer"}.
          </p>
        </div>
        {canEdit && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/*,.doc,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <Button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                background: "#064E3B",
                color: "#FFFFFF",
                border: "1px solid #064E3B",
              }}
              className="!text-white"
            >
              {uploading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
              Upload contract
            </Button>
          </>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[#4B5D55]">
            <Loader2 className="size-4 animate-spin" /> Loading contracts…
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#4B5D55] border border-dashed border-emerald-900/20 rounded-lg">
            No contracts saved yet. Upload the countersigned agreement to keep it on file.
          </div>
        ) : (
          <ul className="divide-y divide-emerald-900/10 rounded-lg border border-emerald-900/10 overflow-hidden">
            {contracts.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2 bg-white">
                <span className="inline-grid place-items-center size-9 rounded-md bg-[#064E3B]/8 border border-emerald-900/10">
                  <FileText className="size-4 text-[#064E3B]" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F1A16] truncate">{c.file_name}</p>
                  <p className="text-[11px] text-[#4B5D55]">
                    {c.source} · {formatBytes(c.size_bytes)} ·{" "}
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDownload(c)}>
                  <Download className="size-4 mr-1" /> Download
                </Button>
                {canEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(c)}
                    className="text-red-600 hover:!text-red-700"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
