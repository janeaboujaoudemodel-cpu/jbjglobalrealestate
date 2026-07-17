/**
 * Owner-side uploader for developer company profile PDFs.
 * Uploads to the private `developer-profiles` bucket, records the doc in
 * developer_documents, then invokes ai-developer-profile-extract which
 * writes an entry into enrichment_review_drafts for owner review.
 */
import { useCallback, useState } from "react";
import { Upload, Loader2, FileText, Eye, EyeOff, Trash2, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

interface Props {
  developerId: string;
  developerName?: string;
}

interface DocRow {
  id: string;
  file_name: string | null;
  file_url: string;
  storage_path: string | null;
  doc_type: string;
  is_public: boolean;
  extracted_at: string | null;
}

const BUCKET = "developer-profiles";

const parseFunctionError = async (err: any) => {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err.context && typeof err.context.text === "function") {
    let body = "";
    try {
      body = await err.context.text();
      const parsed = JSON.parse(body);
      return parsed.error || parsed.message || parsed.detail || body;
    } catch {
      if (body) return body;
    }
  }
  let msg = err.message || "Unknown error";
  try {
    const parsed = JSON.parse(msg);
    return parsed.error || parsed.message || parsed.detail || msg;
  } catch {
    return msg;
  }
};

const extractionDataError = (data: any) => {
  if (!data || data.ok !== false) return null;
  return [data.error, data.detail].filter(Boolean).join(" · ") || "Extraction failed";
};

export default function OwnerCompanyProfileUploader({ developerId, developerName }: Props) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["developer-documents", developerId],
    enabled: !!developerId,
    queryFn: async (): Promise<DocRow[]> => {
      const { data, error } = await supabase
        .from("developer_documents")
        .select("id, file_name, file_url, storage_path, doc_type, is_public, extracted_at")
        .eq("developer_id", developerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["developer-documents", developerId] });
    qc.invalidateQueries({ queryKey: ["developer-company-profile", developerId] });
    qc.invalidateQueries({ queryKey: ["enrichment-drafts"] });
    qc.invalidateQueries({ queryKey: ["admin-developer"] });
    qc.invalidateQueries({ queryKey: ["developer"] });
    qc.invalidateQueries({ queryKey: ["project"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const [lastExtraction, setLastExtraction] = useState<string[] | null>(null);
  const [foundFields, setFoundFields] = useState<Array<{ key: string; label: string; preview: string }> | null>(null);
  const [missingFields, setMissingFields] = useState<Array<{ key: string; label: string }> | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [bulkLinksText, setBulkLinksText] = useState("");
  const [runningIntel, setRunningIntel] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const runIntelExtract = async () => {
    const links = bulkLinksText.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
    setRunningIntel(true);
    try {
      toast.message("Reading website + links with AI…", { duration: 4000 });
      const { data, error } = await supabase.functions.invoke("developer-intel-extract", {
        body: { developerId, websiteUrl: websiteUrl.trim() || undefined, bulkLinks: links },
      });
      if (error) throw error;
      const dataError = extractionDataError(data);
      if (dataError) throw new Error(dataError);
      const preview = (data as { preview?: Record<string, unknown> } | null)?.preview ?? {};
      const keys = Object.keys(preview).filter((k) => preview[k] != null && preview[k] !== "");
      toast.success(
        keys.length
          ? `AI drafted ${keys.length} field${keys.length > 1 ? "s" : ""} — review in Enrichment audit log`
          : "AI ran but found no confirmed facts. Try a different source.",
      );
      qc.invalidateQueries({ queryKey: ["enrichment-drafts"] });
    } catch (e) {
      toast.error(await parseFunctionError(e));
    } finally {
      setRunningIntel(false);
    }
  };

  const upload = useCallback(async (files: FileList | File[]) => {
    if (!files || (files as FileList).length === 0) return;
    setBusy(true);
    setLastExtraction(null);
    setFoundFields(null);
    setMissingFields(null);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const path = `${developerId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "application/pdf" });
        if (upErr) throw upErr;

        // Private bucket → create a signed URL that outlives the AI extraction call.
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 6);
        const fileUrl = signed?.signedUrl || "";

        const { data: docRow, error: dbErr } = await supabase.from("developer_documents").insert({
          developer_id: developerId,
          doc_type: "company_profile",
          file_url: fileUrl,
          file_name: file.name,
          storage_path: path,
          file_size: file.size,
          is_public: true,
        }).select("id").single();
        if (dbErr) throw dbErr;

        // Await the AI extraction so the user sees exactly what got written.
        toast.message(`Reading ${file.name} with AI…`, { duration: 4000 });
        const { data: aiData, error: aiErr } = await supabase.functions.invoke(
          "ai-developer-profile-extract",
          { body: { developerId, fileUrl, fileName: file.name, documentId: docRow.id } },
        );
        if (aiErr) {
          toast.error(`AI extraction failed: ${await parseFunctionError(aiErr)}`);
        } else {
          const dataError = extractionDataError(aiData);
          if (dataError) {
            toast.error(`AI extraction failed: ${dataError}`);
            continue;
          }
          const updated: string[] = (aiData as any)?.updatedFields ?? [];
          setLastExtraction(updated);
          setFoundFields((aiData as any)?.foundFields ?? null);
          setMissingFields((aiData as any)?.missingFields ?? null);
          if (updated.length > 0) {
            toast.success(`AI wrote ${updated.length} field${updated.length > 1 ? "s" : ""} into the developer profile`);
          } else {
            toast.message("AI ran but found no new information in this file");
          }
        }
        ok++;
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Upload failed");
      }
    }
    if (ok) toast.success(`Uploaded ${ok} file${ok > 1 ? "s" : ""}`);
    setBusy(false);
    refresh();
  }, [developerId]);

  const togglePublic = async (d: DocRow) => {
    const { error } = await supabase.from("developer_documents").update({ is_public: !d.is_public }).eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success(!d.is_public ? "Now visible on developer page" : "Hidden from public");
    refresh();
  };

  const remove = async (d: DocRow) => {
    if (!confirm(`Delete "${d.file_name || d.doc_type}"?`)) return;
    if (d.storage_path) await supabase.storage.from(BUCKET).remove([d.storage_path]);
    const { error } = await supabase.from("developer_documents").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  const [reExtractingId, setReExtractingId] = useState<string | null>(null);
  const reExtract = async (d: DocRow) => {
    setReExtractingId(d.id);
    try {
      // Regenerate a fresh signed URL — the one stored in file_url may have expired.
      let fileUrl = d.file_url;
      if (d.storage_path) {
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(d.storage_path, 60 * 60 * 6);
        if (signed?.signedUrl) fileUrl = signed.signedUrl;
      }
      toast.message(`Re-reading ${d.file_name || "profile"} with AI…`);
      const { data: aiData, error: aiErr } = await supabase.functions.invoke(
        "ai-developer-profile-extract",
        { body: { developerId, fileUrl, fileName: d.file_name, documentId: d.id } },
      );
      if (aiErr) {
        toast.error(`AI extraction failed: ${await parseFunctionError(aiErr)}`);
      } else {
        const dataError = extractionDataError(aiData);
        if (dataError) throw new Error(dataError);
        const updated: string[] = (aiData as any)?.updatedFields ?? [];
        setLastExtraction(updated);
        setFoundFields((aiData as any)?.foundFields ?? null);
        setMissingFields((aiData as any)?.missingFields ?? null);
        if (updated.length > 0) toast.success(`AI wrote ${updated.length} field${updated.length > 1 ? "s" : ""}`);
        else toast.message("AI ran but found no new information");
      }
      refresh();
    } catch (e: any) {
      toast.error(await parseFunctionError(e));
    } finally {
      setReExtractingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-[#B89555]/40 bg-[#FDFBF7] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
            Owner · Company Profiles
          </p>
          <p className="text-[11px] text-[#1A1A1A]/55">
            Upload the developer's official PDF. AI reads it and instantly writes the description and profile fields for {developerName || "this developer"}. You can still edit every field manually below.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/owner/enrichment-review" className="text-xs font-semibold text-[#064E3B] hover:underline">
            Audit log →
          </Link>
          <button
            type="button"
            onClick={() => setMinimized((v) => !v)}
            className="inline-grid h-8 w-8 place-items-center rounded-full border border-[#B89555]/40 bg-white text-[#064E3B] hover:bg-[#F7F2EA]"
            title={minimized ? "Expand company profiles" : "Minimize company profiles"}
          >
            {minimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!minimized && (
        <>

      {/* AI intel from website + bulk links */}
      <div className="mb-4 rounded-lg border border-[#064E3B]/25 bg-gradient-to-br from-[#F0FDF4] to-[#FDFBF7] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#064E3B]" />
          <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#064E3B]">
            AI Intel — website & links
          </span>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://developer-website.com"
            className="w-full rounded-md border border-[#B89555]/40 bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#064E3B]"
          />
          <textarea
            value={bulkLinksText}
            onChange={(e) => setBulkLinksText(e.target.value)}
            placeholder="Paste Google Drive links, press pages, brochure URLs — one per line"
            rows={2}
            className="w-full rounded-md border border-[#B89555]/40 bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#064E3B] resize-none"
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[11px] text-[#1A1A1A]/60">
            AI reads every source, rewrites the bio in premium magazine style, and drafts CEO / founder / HQ / notable projects for your review.
          </p>
          <button
            type="button"
            onClick={runIntelExtract}
            disabled={runningIntel}
            data-no-contrast-guard
            className="jbj-force-white-button shrink-0 inline-flex items-center gap-1.5 rounded-md border border-[#064E3B] px-3 py-1.5 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "#064E3B",
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
            }}
          >
            {runningIntel ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
            {runningIntel ? "Reading sources…" : "Extract intel"}
          </button>
        </div>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer?.files?.length) upload(e.dataTransfer.files); }}
        className={`block border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition ${
          drag ? "bg-[#EFE6D6] border-[#B89555]" : "border-[#B89555]/50 hover:bg-[#F7F2EA]"
        }`}
      >
        <input type="file" multiple accept=".pdf,application/pdf,image/*" className="hidden" disabled={busy}
          onChange={(e) => e.target.files && upload(e.target.files)} />
        {busy ? <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#B89555]" /> : <Upload className="w-6 h-6 mx-auto text-[#B89555]" />}
        <div className="mt-2 text-sm font-semibold text-[#1A1A1A]">
          {busy ? "Uploading & extracting with AI…" : "Drop company profile PDFs here"}
        </div>
        <div className="text-xs text-[#1A1A1A]/60 mt-0.5 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI extracts every field and replaces the description automatically
        </div>
      </label>

      {lastExtraction && lastExtraction.length > 0 && (
        <div
          data-no-contrast-guard
          className="mt-3 rounded-md px-3 py-2 text-xs"
          style={{ backgroundColor: "#FFFFFF", color: "#064E3B", border: "1px solid rgba(6,78,59,0.25)" }}
        >
          <span className="font-semibold" style={{ color: "#064E3B" }}>
            AI updated {lastExtraction.length} field{lastExtraction.length > 1 ? "s" : ""}:
          </span>{" "}
          <span style={{ color: "#1A1A1A" }}>{lastExtraction.join(", ")}</span>
        </div>
      )}
      {lastExtraction && lastExtraction.length === 0 && !foundFields && (
        <div
          data-no-contrast-guard
          className="mt-3 rounded-md px-3 py-2 text-xs"
          style={{ backgroundColor: "#FFFFFF", color: "#92400E", border: "1px solid rgba(180,83,9,0.3)" }}
        >
          AI ran but did not find any new fields in the uploaded file.
        </div>
      )}

      {(foundFields || missingFields) && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* FOUND */}
          <div
            data-no-contrast-guard
            className="rounded-md border p-3"
            style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(6,78,59,0.25)" }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: "#064E3B" }}>
              Found in the PDF ({foundFields?.length ?? 0})
            </div>
            {foundFields && foundFields.length > 0 ? (
              <ul className="space-y-1.5">
                {foundFields.map((f) => (
                  <li key={f.key} className="text-xs leading-snug">
                    <span className="font-semibold" style={{ color: "#064E3B" }}>✓ {f.label}:</span>{" "}
                    <span style={{ color: "#1A1A1A" }}>{f.preview}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs" style={{ color: "#1A1A1A" }}>Nothing extracted — try a clearer profile PDF.</div>
            )}
          </div>

          {/* MISSING */}
          <div
            data-no-contrast-guard
            className="rounded-md border p-3"
            style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(180,83,9,0.3)" }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2" style={{ color: "#92400E" }}>
              Missing — please add manually ({missingFields?.length ?? 0})
            </div>
            {missingFields && missingFields.length > 0 ? (
              <ul className="grid grid-cols-1 gap-1">
                {missingFields.map((f) => (
                  <li key={f.key} className="text-xs" style={{ color: "#1A1A1A" }}>
                    <span style={{ color: "#92400E" }}>✗</span> {f.label}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs" style={{ color: "#1A1A1A" }}>Every field was found — no manual entry needed.</div>
            )}
          </div>
        </div>
      )}

      {docs.length > 0 && (
        <div className="mt-3 divide-y divide-[#B89555]/15 rounded-md border border-[#B89555]/20 bg-white">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <FileText className="w-4 h-4 text-[#B89555] shrink-0" />
              <span className="font-medium text-[#1A1A1A] truncate flex-1">{d.file_name || d.doc_type}</span>
              {d.extracted_at && <span className="text-[10px] text-emerald-800 uppercase tracking-wider">AI ✓</span>}
              <a
                href={d.file_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Preview"
                className="inline-grid place-items-center w-7 h-7 rounded-full border border-[#B89555]/40 bg-white hover:bg-[#F7F2EA] text-[#064E3B]"
              >
                <Eye className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => reExtract(d)}
                disabled={reExtractingId === d.id}
                title="Re-run AI extraction"
                className="inline-grid place-items-center w-7 h-7 rounded-full border border-[#064E3B]/30 bg-white hover:bg-[#F7F2EA] text-[#064E3B] disabled:opacity-50"
              >
                {reExtractingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => togglePublic(d)}
                data-no-contrast-guard
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border border-[#B89555]/40 bg-white hover:bg-[#F7F2EA] text-[#064E3B]"
                style={{ backgroundColor: "#FFFFFF", color: "#064E3B" }}
              >
                {d.is_public ? <><Eye className="w-3.5 h-3.5" /> Public</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
              </button>
              <button onClick={() => remove(d)}
                title="Delete"
                className="inline-grid place-items-center w-7 h-7 rounded-full border border-[#B91C1C]/30 bg-white text-[#B91C1C] hover:bg-[#FCE8E8]">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
