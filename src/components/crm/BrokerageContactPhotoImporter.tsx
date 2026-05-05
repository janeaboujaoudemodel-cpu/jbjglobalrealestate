import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, UploadCloud, Copy, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type { BrokerageAgentDraft } from "./BrokerageAgentsEditor";

interface Props {
  brokerageId?: string;
  brokerageName?: string;
  onExtracted: (rows: BrokerageAgentDraft[]) => void;
}

interface ExtractedContact {
  name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  role?: string | null;
  source_image?: string | null;
}

const MAX_FILES = 300;

export function BrokerageContactPhotoImporter({
  brokerageId,
  brokerageName,
  onExtracted,
}: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ uploaded: number; total: number } | null>(null);
  const [results, setResults] = useState<ExtractedContact[]>([]);
  const [draft, setDraft] = useState("");

  const buildOutreachDraft = (contacts: ExtractedContact[]) => {
    const list = contacts
      .map(
        (c, i) =>
          `${i + 1}. ${c.name || "Unknown"} — ${c.phone || c.whatsapp || "no number"}`
      )
      .join("\n");
    return `Hello,\n\nThis is Jane Bouchra Jajeh, Founder & CEO of JBJ GLOBAL REAL ESTATE.\n\nI am updating our records for ${brokerageName || "your agency"} and I would like to confirm a few details with you:\n\n1) Could you please confirm your full name?\n2) Are you still working with ${brokerageName || "this agency"}?\n3) What is the best WhatsApp number to reach you on?\n\nFor reference, here is the contact list I have on file:\n\n${list}\n\nThank you for taking a moment to update me.\n\nWarm regards,\nJane Bouchra Jajeh\nFounder & CEO — JBJ GLOBAL REAL ESTATE`;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    if (files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} photos per batch`);
      return;
    }
    setBusy(true);
    setResults([]);
    setProgress({ uploaded: 0, total: files.length });
    const paths: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${user.id}/${brokerageId || "unfiled"}/${Date.now()}_${i}_${safe}`;
        const { error } = await supabase.storage
          .from("brokerage-contact-photos")
          .upload(path, f, { upsert: false, contentType: f.type });
        if (error) throw error;
        paths.push(path);
        setProgress({ uploaded: i + 1, total: files.length });
      }

      toast.message("Uploaded — extracting contacts with AI…");
      const { data, error } = await supabase.functions.invoke("extract-brokerage-contacts", {
        body: { paths, brokerage_name: brokerageName || null },
      });
      if (error) throw error;
      const contacts: ExtractedContact[] = (data as any)?.contacts || [];
      setResults(contacts);
      setDraft(buildOutreachDraft(contacts));
      toast.success(`Extracted ${contacts.length} contacts`);
    } catch (e: any) {
      toast.error(e.message || "Could not extract contacts");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const acceptAll = () => {
    const drafts: BrokerageAgentDraft[] = results.map((c) => ({
      name: c.name || "Unknown",
      phone: c.phone || "",
      whatsapp: c.whatsapp || c.phone || "",
      role: c.role || "",
      status: "unknown",
      source: "ai_photo_import",
      photo_path: c.source_image || undefined,
    }));
    onExtracted(drafts);
    toast.success(`Added ${drafts.length} brokers — review and save the agency`);
    setResults([]);
    setDraft("");
  };

  const downloadXlsx = () => {
    const rows = results.map((c, i) => ({
      "#": i + 1,
      Name: c.name || "Unknown",
      Phone: c.phone || "",
      WhatsApp: c.whatsapp || c.phone || "",
      Role: c.role || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 4 }, { wch: 26 }, { wch: 18 }, { wch: 18 }, { wch: 22 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contacts");
    XLSX.writeFile(wb, `${(brokerageName || "agency").replace(/\W+/g, "_")}_contacts.xlsx`);
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft);
    toast.success("Outreach message copied");
  };

  return (
    <div className="border-t border-[#B89555]/20 pt-3 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#B89555]" />
        <div className="text-sm font-semibold text-[#1A1A1A]">
          AI WhatsApp / contact screenshot importer
        </div>
      </div>
      <p className="text-xs text-[#1A1A1A]/70">
        Drop up to {MAX_FILES} photos (JPG, PNG, HEIC, PDF). The AI reads each image, extracts every
        broker name + WhatsApp number it can find (unknown names are kept as "Unknown") and prepares
        a ready-to-send outreach message and Excel sheet.
      </p>

      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-[#B89555]/40 rounded-lg p-4 bg-[#F7F2EA] cursor-pointer text-sm text-[#1A1A1A]/80 hover:bg-[#EFE6D6] transition">
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {progress
              ? `Uploading ${progress.uploaded}/${progress.total}…`
              : "Working…"}
          </>
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            Click to choose images, or drag &amp; drop here
          </>
        )}
        <Input
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          disabled={busy}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#1A1A1A]">
            Extracted contacts ({results.length})
          </div>
          <div className="max-h-48 overflow-y-auto rounded-md border border-[#B89555]/20 bg-[#FDFBF7]">
            <table className="w-full text-xs">
              <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
                <tr>
                  <th className="text-left p-2">#</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">WhatsApp</th>
                  <th className="text-left p-2">Role</th>
                </tr>
              </thead>
              <tbody>
                {results.map((c, i) => (
                  <tr key={i} className="border-t border-[#B89555]/15">
                    <td className="p-2">{i + 1}</td>
                    <td className="p-2">{c.name || "Unknown"}</td>
                    <td className="p-2">{c.phone || "—"}</td>
                    <td className="p-2">{c.whatsapp || c.phone || "—"}</td>
                    <td className="p-2">{c.role || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="gold" onClick={acceptAll}>
              Add {results.length} brokers to this agency
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={downloadXlsx}>
              <Download className="w-3 h-3 mr-1" /> Download Excel
            </Button>
          </div>

          <div>
            <div className="text-xs font-semibold text-[#1A1A1A] mb-1">
              Suggested outreach message (paste into WhatsApp/email)
            </div>
            <textarea
              rows={6}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full text-xs rounded-md border border-[#B89555]/30 bg-[#FDFBF7] p-2 text-[#1A1A1A]"
            />
            <div className="flex justify-end mt-1">
              <Button type="button" size="sm" variant="outline" onClick={copyDraft}>
                <Copy className="w-3 h-3 mr-1" /> Copy message
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
