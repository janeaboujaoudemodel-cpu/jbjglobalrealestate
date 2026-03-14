import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Reply, Pencil, AlertTriangle, CheckCircle2, Clock, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailAnalysis {
  summary_en: string;
  summary_ar: string;
  suggested_reply: string;
  priority: string;
  action_items: string[];
  needs_reply: boolean;
  cached?: boolean;
}

interface EmailAssistantPanelProps {
  emailId: string;
  emailSubject: string;
  emailBody: string;
  onUseAsReply: (text: string) => void;
  onEditDraft: (text: string) => void;
  onAnalysisComplete?: (emailId: string, analysis: { needs_reply: boolean; priority: string; action_items: string[] }) => void;
}

const PRIORITY_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  urgent: { color: "bg-red-100 text-red-700 border-red-300", icon: <AlertTriangle className="w-3 h-3" />, label: "Urgent" },
  high: { color: "bg-amber-100 text-amber-700 border-amber-300", icon: <Zap className="w-3 h-3" />, label: "High" },
  normal: { color: "bg-blue-100 text-blue-700 border-blue-300", icon: <Clock className="w-3 h-3" />, label: "Normal" },
  low: { color: "bg-zinc-100 text-zinc-600 border-zinc-300", icon: <CheckCircle2 className="w-3 h-3" />, label: "Low" },
};

export default function EmailAssistantPanel({
  emailId,
  emailSubject,
  emailBody,
  onUseAsReply,
  onEditDraft,
  onAnalysisComplete,
}: EmailAssistantPanelProps) {
  const [analysis, setAnalysis] = useState<EmailAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastAnalyzedId, setLastAnalyzedId] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (!emailId || !emailBody) return;
    if (lastAnalyzedId === emailId && analysis) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-email-assistant", {
        body: { action: "summarize", emailId, subject: emailSubject, body: emailBody },
      });
      if (error) throw error;
      const result = data as EmailAnalysis;
      setAnalysis(result);
      setLastAnalyzedId(emailId);

      // Feed results back to parent for productivity panel
      onAnalysisComplete?.(emailId, {
        needs_reply: result.needs_reply,
        priority: result.priority,
        action_items: result.action_items,
      });
    } catch (err: any) {
      console.error("Email analysis error:", err);
      toast.error("Failed to analyze email");
    } finally {
      setLoading(false);
    }
  }, [emailId, emailSubject, emailBody, lastAnalyzedId, analysis, onAnalysisComplete]);

  useEffect(() => {
    analyze();
  }, [analyze]);

  const priorityCfg = PRIORITY_CONFIG[analysis?.priority || "normal"] || PRIORITY_CONFIG.normal;

  return (
    <div className="mt-8 p-4 rounded-xl border-2 border-[#C9A84C]/20 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-sm font-semibold text-black">Amanda Clarke — Executive Assistant</span>
          {analysis && (
            <Badge className={`${priorityCfg.color} text-[9px] gap-1`}>
              {priorityCfg.icon} {priorityCfg.label}
            </Badge>
          )}
        </div>
        {analysis?.cached && (
          <span className="text-[9px] text-black/30">cached</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 rounded-lg" />
            <Skeleton className="h-24 rounded-lg" />
          </div>
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : analysis ? (
        <>
          {/* Bilingual Summaries */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white/70 rounded-lg border border-[#C9A84C]/15 p-3">
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">Summary (EN)</p>
              <p className="text-xs text-black/70 leading-relaxed">{analysis.summary_en}</p>
            </div>
            <div className="bg-white/70 rounded-lg border border-[#C9A84C]/15 p-3" dir="rtl">
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1 text-right">ملخص (AR)</p>
              <p className="text-xs text-black/70 leading-relaxed text-right">{analysis.summary_ar}</p>
            </div>
          </div>

          {/* Suggested Reply */}
          {analysis.suggested_reply && (
            <div className="bg-white/70 rounded-lg border border-[#C9A84C]/15 p-3 mb-3">
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">Suggested Reply</p>
              <p className="text-xs text-black/70 leading-relaxed">{analysis.suggested_reply}</p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] border-[#C9A84C]/30 text-[#C9A84C]"
                  onClick={() => onUseAsReply(analysis.suggested_reply)}
                >
                  <Reply className="w-3 h-3 mr-1" /> Use as Reply
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] border-[#C9A84C]/30 text-black/60"
                  onClick={() => onEditDraft(analysis.suggested_reply)}
                >
                  <Pencil className="w-3 h-3 mr-1" /> Edit Draft
                </Button>
              </div>
            </div>
          )}

          {/* Action Items */}
          {analysis.action_items && analysis.action_items.length > 0 && (
            <div className="bg-white/70 rounded-lg border border-[#C9A84C]/15 p-3">
              <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2">Action Items</p>
              <ul className="space-y-1">
                {analysis.action_items.map((item, i) => (
                  <li key={i} className="text-xs text-black/70 flex items-start gap-2">
                    <span className="text-[#C9A84C] mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-black/40 text-center py-4">Select an email to analyze</p>
      )}
    </div>
  );
}
