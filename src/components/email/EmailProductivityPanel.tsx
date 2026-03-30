import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Mail, AlertTriangle, CheckCircle2, Clock, Reply, Bell,
  Sparkles, Zap, Image, Stamp, FileSignature, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import QuickCalendarWidget from "@/components/shared/QuickCalendarWidget";
import QuickNoteWidget from "@/components/shared/QuickNoteWidget";
import EmailAutomationPanel from "@/components/email/EmailAutomationPanel";

interface Email {
  id: string;
  from: string;
  subject: string;
  read: boolean;
  starred: boolean;
  folder: string;
}

interface AnalysisData {
  needs_reply: boolean;
  priority: string;
  action_items: string[];
}

interface BrandAssetQuick {
  id: string;
  name: string;
  asset_type: string;
  thumbnail_url: string | null;
  svg_content: string | null;
}

interface EmailProductivityPanelProps {
  emails: Email[];
  analysisCache: Map<string, AnalysisData>;
  onSelectEmail: (id: string) => void;
  selectedEmailSubject?: string;
  onBulkAnalyze?: () => void;
}

export default function EmailProductivityPanel({
  emails,
  analysisCache,
  onSelectEmail,
  selectedEmailSubject,
  onBulkAnalyze,
}: EmailProductivityPanelProps) {
  const [brandAssets, setBrandAssets] = useState<BrandAssetQuick[]>([]);
  const [activeSection, setActiveSection] = useState<"overview" | "automation">("overview");

  const inboxEmails = emails.filter(e => e.folder === "inbox");
  const unreadEmails = inboxEmails.filter(e => !e.read);
  const starredEmails = inboxEmails.filter(e => e.starred);

  const needsReply = inboxEmails.filter(e => {
    const cached = analysisCache.get(e.id);
    return cached?.needs_reply;
  });

  const urgentEmails = inboxEmails.filter(e => {
    const cached = analysisCache.get(e.id);
    return cached?.priority === "urgent" || cached?.priority === "high";
  });

  const allActionItems = Array.from(analysisCache.entries())
    .flatMap(([emailId, data]) =>
      (data.action_items || []).map(item => ({ emailId, item }))
    )
    .slice(0, 10);

  const stats = [
    { label: "Unread", value: unreadEmails.length, icon: Mail, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { label: "Reply", value: needsReply.length, icon: Reply, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Urgent", value: urgentEmails.length, icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
    { label: "Starred", value: starredEmails.length, icon: Bell, color: "text-[#B89555] bg-[#B89555]/10 border-[#B89555]/30" },
  ];

  // Load brand assets for quick access
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("brand_assets")
          .select("id, name, asset_type, thumbnail_url, svg_content")
          .eq("user_id", user.id)
          .in("asset_type", ["stamp", "signature", "letterhead", "logo"])
          .limit(6);
        if (data) setBrandAssets(data as BrandAssetQuick[]);
      } catch {
        // silently fail
      }
    };
    loadAssets();
  }, []);

  const assetIcons: Record<string, React.ReactNode> = {
    stamp: <Stamp className="w-3 h-3 text-[#B89555]" />,
    signature: <FileSignature className="w-3 h-3 text-[#B89555]" />,
    letterhead: <Mail className="w-3 h-3 text-[#B89555]" />,
    logo: <Image className="w-3 h-3 text-[#B89555]" />,
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-[#B89555]" />
          <span className="text-sm font-semibold text-black">Productivity Hub</span>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-1 bg-[#F7F2EA] rounded-lg p-0.5">
          <button
            className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-all ${
              activeSection === "overview"
                ? "bg-white text-black shadow-sm"
                : "text-black/50 hover:text-black/70"
            }`}
            onClick={() => setActiveSection("overview")}
          >
            Overview
          </button>
          <button
            className={`flex-1 text-[10px] font-medium py-1.5 rounded-md transition-all ${
              activeSection === "automation"
                ? "bg-white text-black shadow-sm"
                : "text-black/50 hover:text-black/70"
            }`}
            onClick={() => setActiveSection("automation")}
          >
            Automation
          </button>
        </div>

        {activeSection === "overview" ? (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-2">
              {stats.map(s => (
                <div key={s.label} className={`rounded-lg border p-2 text-center ${s.color}`}>
                  <s.icon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <p className="text-base font-bold">{s.value}</p>
                  <p className="text-[9px] font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            {onBulkAnalyze && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-[10px] border-[#B89555]/20 text-[#B89555] hover:bg-[#B89555]/10"
                onClick={onBulkAnalyze}
              >
                <Zap className="w-3 h-3 mr-1" /> Bulk AI Analyze Inbox
              </Button>
            )}

            <Separator className="bg-[#B89555]/10" />

            {/* Calendar Widget */}
            <QuickCalendarWidget source="email" prefillTitle={selectedEmailSubject} />

            <Separator className="bg-[#B89555]/10" />

            {/* Notes Widget */}
            <QuickNoteWidget source="email" prefillTitle={selectedEmailSubject} />

            <Separator className="bg-[#B89555]/10" />

            {/* Reply Queue */}
            {needsReply.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2">Reply Queue</p>
                <div className="space-y-1">
                  {needsReply.map(e => (
                    <button
                      key={e.id}
                      onClick={() => onSelectEmail(e.id)}
                      className="w-full text-left px-3 py-2 rounded-lg border border-[#B89555]/15 hover:bg-[#B89555]/5 transition-colors"
                    >
                      <p className="text-xs font-medium text-black truncate">{e.subject}</p>
                      <p className="text-[10px] text-black/50">{e.from}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {allActionItems.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2">Tasks from Emails</p>
                <div className="space-y-1">
                  {allActionItems.map((ai, i) => (
                    <div
                      key={i}
                      className="text-xs text-black/70 flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-[#B89555]/5 cursor-pointer"
                      onClick={() => onSelectEmail(ai.emailId)}
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#B89555] mt-0.5 flex-shrink-0" />
                      <span>{ai.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Brand Assets Quick Access */}
            {brandAssets.length > 0 && (
              <>
                <Separator className="bg-[#B89555]/10" />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">Brand Assets</p>
                    <a href="/owner/brand-assets" className="text-[10px] text-[#B89555] hover:underline flex items-center gap-0.5">
                      <ExternalLink className="w-2.5 h-2.5" /> Manage
                    </a>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {brandAssets.map(asset => (
                      <div
                        key={asset.id}
                        className="flex flex-col items-center bg-white/70 rounded-lg border border-[#B89555]/15 p-2 hover:border-[#B89555]/30 cursor-pointer transition-colors"
                        title={asset.name}
                      >
                        {asset.thumbnail_url ? (
                          <img src={asset.thumbnail_url} alt={asset.name} className="w-8 h-8 object-contain rounded" />
                        ) : (
                          <div className="w-8 h-8 flex items-center justify-center">
                            {assetIcons[asset.asset_type] || <Image className="w-4 h-4 text-black/30" />}
                          </div>
                        )}
                        <span className="text-[8px] text-black/50 mt-1 truncate max-w-full">{asset.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {needsReply.length === 0 && allActionItems.length === 0 && (
              <div className="text-center py-4 text-black/40">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                <p className="text-xs">All caught up!</p>
                <p className="text-[10px]">No pending actions</p>
              </div>
            )}
          </>
        ) : (
          <EmailAutomationPanel onSelectEmail={onSelectEmail} />
        )}
      </div>
    </ScrollArea>
  );
}
