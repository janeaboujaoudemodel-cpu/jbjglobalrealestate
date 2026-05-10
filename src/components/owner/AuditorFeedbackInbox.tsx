import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

/**
 * AuditorFeedbackInbox — Owner-side widget showing unread auditor feedback count + quick preview.
 * Designed to be placed in MegaMenuAccount or owner dashboard.
 */
const AuditorFeedbackInbox = ({ onClose }: { onClose?: () => void }) => {
  const { isOwner } = useAuth();

  const { data: feedback } = useQuery({
    queryKey: ["auditor-feedback-unread"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditor_feedback")
        .select("id, feedback_type, note_text, prompt_text, page_url, created_at, status")
        .eq("status", "new")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: isOwner,
    refetchInterval: 30000,
  });

  if (!isOwner || !feedback?.length) return null;

  return (
    <div className="mt-3 pt-3 border-t border-[#B89555]/20">
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A] font-bold flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Auditor Reports
        </p>
        <Badge className="bg-red-500 text-white text-[10px] px-1.5">{feedback.length}</Badge>
      </div>
      <div className="space-y-1">
        {feedback.slice(0, 3).map((f: any) => (
          <Link
            key={f.id}
            to="/owner/external-access"
            onClick={onClose}
            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#EFE6D6]/10 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#1A1A1A] flex-shrink-0" />
            <span className="text-xs text-[#1A1A1A] truncate flex-1">
              {f.note_text?.substring(0, 40) || f.prompt_text?.substring(0, 40) || "New feedback"}
            </span>
            <span className="text-[10px] text-[#1A1A1A]/40 flex-shrink-0">
              {new Date(f.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </Link>
        ))}
      </div>
      <Link
        to="/owner/external-access"
        onClick={onClose}
        className="block text-center text-xs text-[#1A1A1A] font-semibold mt-2 hover:underline"
      >
        View all feedback →
      </Link>
    </div>
  );
};

export default AuditorFeedbackInbox;
