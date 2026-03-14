import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, AlertTriangle, CheckCircle2, Clock, Reply, Bell } from "lucide-react";

interface Email {
  id: string;
  from: string;
  subject: string;
  read: boolean;
  starred: boolean;
  folder: string;
}

interface EmailProductivityPanelProps {
  emails: Email[];
  analysisCache: Map<string, { needs_reply: boolean; priority: string; action_items: string[] }>;
  onSelectEmail: (id: string) => void;
}

export default function EmailProductivityPanel({
  emails,
  analysisCache,
  onSelectEmail,
}: EmailProductivityPanelProps) {
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
    { label: "Needs Reply", value: needsReply.length, icon: Reply, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: "Urgent", value: urgentEmails.length, icon: AlertTriangle, color: "text-red-600 bg-red-50 border-red-200" },
    { label: "Starred", value: starredEmails.length, icon: Bell, color: "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/30" },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-[#C9A84C]" />
        <span className="text-sm font-semibold text-black">Email Productivity</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map(s => (
          <div key={s.label} className={`rounded-lg border p-2.5 text-center ${s.color}`}>
            <s.icon className="w-4 h-4 mx-auto mb-1" />
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[10px] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Reply Queue */}
      {needsReply.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2">Reply Queue</p>
          <ScrollArea className="max-h-32">
            <div className="space-y-1">
              {needsReply.map(e => (
                <button
                  key={e.id}
                  onClick={() => onSelectEmail(e.id)}
                  className="w-full text-left px-3 py-2 rounded-lg border border-[#C9A84C]/15 hover:bg-[#C9A84C]/5 transition-colors"
                >
                  <p className="text-xs font-medium text-black truncate">{e.subject}</p>
                  <p className="text-[10px] text-black/50">{e.from}</p>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Action Items */}
      {allActionItems.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2">Tasks from Emails</p>
          <ScrollArea className="max-h-40">
            <ul className="space-y-1.5">
              {allActionItems.map((ai, i) => (
                <li
                  key={i}
                  className="text-xs text-black/70 flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-[#C9A84C]/5 cursor-pointer"
                  onClick={() => onSelectEmail(ai.emailId)}
                >
                  <CheckCircle2 className="w-3 h-3 text-[#C9A84C] mt-0.5 flex-shrink-0" />
                  <span>{ai.item}</span>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}

      {needsReply.length === 0 && allActionItems.length === 0 && (
        <div className="text-center py-6 text-black/40">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">All caught up!</p>
          <p className="text-[10px]">No pending actions</p>
        </div>
      )}
    </div>
  );
}
