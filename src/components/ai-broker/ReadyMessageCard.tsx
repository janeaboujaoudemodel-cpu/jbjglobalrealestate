import { Copy, MessageCircle, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  message: string;
  leadName?: string;
  leadPhone?: string | null;
  leadWhatsapp?: string | null;
}

export default function ReadyMessageCard({ message, leadName, leadPhone, leadWhatsapp }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Copied — paste into WhatsApp, email, or SMS");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const wa = (leadWhatsapp || leadPhone || "").replace(/[^\d]/g, "");
  const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(message)}` : null;

  return (
    <div className="rounded-xl border border-[#B89555] bg-[#FDFBF7] p-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 font-semibold">
          Ready to send {leadName ? `to ${leadName.split(" ")[0]}` : ""}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#B89555] text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="whitespace-pre-wrap text-sm text-[#1A1A1A] leading-relaxed">{message}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {waHref && (
          <a
            href={waHref} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
        <a
          href={`/broker/email?compose=1&body=${encodeURIComponent(message)}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#102540] text-[#102540] hover:bg-[#102540]/5"
        >
          <Mail className="h-3.5 w-3.5" /> Email composer
        </a>
      </div>
    </div>
  );
}
