/**
 * Public Company Profile card for developer pages.
 * - If the developer has a public developer_documents row (doc_type=company_profile),
 *   shows a Download PDF button (uses a fresh signed URL).
 * - Otherwise shows a "Request company profile" button that logs to
 *   public.company_profile_requests.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  developerId: string;
  developerName: string;
}

const BUCKET = "developer-profiles";

export default function CompanyProfileCard({ developerId, developerName }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [showForm, setShowForm] = useState(false);

  const { data: doc, isLoading } = useQuery({
    queryKey: ["developer-company-profile", developerId],
    enabled: !!developerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_documents")
        .select("id, file_name, storage_path")
        .eq("developer_id", developerId)
        .eq("doc_type", "company_profile")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const download = async () => {
    if (!doc?.storage_path) return;
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60 * 10);
      if (error || !data?.signedUrl) throw error || new Error("Could not create link");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const submitRequest = async () => {
    if (!form.email && !form.phone) {
      toast.error("Add an email or phone so we can send it to you");
      return;
    }
    setRequesting(true);
    const { error } = await supabase.from("company_profile_requests").insert({
      developer_id: developerId,
      requester_name: form.name || null,
      requester_email: form.email || null,
      requester_phone: form.phone || null,
    });
    setRequesting(false);
    if (error) return toast.error(error.message);
    setRequested(true);
    toast.success("Request sent — we'll email you the profile shortly");
  };

  if (isLoading) return null;

  return (
    <div
      className="rounded-xl border border-[#B89555]/45 p-4 flex flex-col gap-3"
      style={{
        background: "linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)",
        boxShadow: "0 0 15px rgba(184,149,85,0.18), inset 0 1px 2px rgba(255,255,255,0.4)",
      }}
    >
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#064E3B]" />
        <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/75">
          Company Profile
        </span>
      </div>

      <p className="text-sm text-[#1A1A1A]/80 leading-snug">
        {doc
          ? `Download the official ${developerName} company profile.`
          : `Request the official ${developerName} company profile — we'll send it to you.`}
      </p>

      {doc ? (
        <button
          onClick={download}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-[#064E3B] text-white hover:bg-[#042C1C] disabled:opacity-60"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download PDF
        </button>
      ) : requested ? (
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold bg-emerald-100 text-emerald-900">
          <Check className="w-4 h-4" /> Request received
        </div>
      ) : !showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-[#064E3B] text-white hover:bg-[#042C1C]"
        >
          <Send className="w-4 h-4" /> Request company profile
        </button>
      ) : (
        <div className="grid gap-2">
          <input type="text" placeholder="Your name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3 py-2 rounded-md border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]" />
          <input type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3 py-2 rounded-md border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]" />
          <input type="tel" placeholder="Phone (optional)" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="px-3 py-2 rounded-md border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A]" />
          <button
            onClick={submitRequest}
            disabled={requesting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold bg-[#064E3B] text-white hover:bg-[#042C1C] disabled:opacity-60"
          >
            {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send request
          </button>
        </div>
      )}
    </div>
  );
}
