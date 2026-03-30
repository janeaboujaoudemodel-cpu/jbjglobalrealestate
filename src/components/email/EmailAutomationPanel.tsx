import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap, Clock, BellRing, Tag, MessageSquare, Plus, X, Calendar,
  Sparkles, FileText, CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

interface FollowUpReminder {
  id: string;
  emailId: string;
  emailSubject: string;
  dueDate: string;
  completed: boolean;
}

interface AutoReplyTemplate {
  id: string;
  name: string;
  body: string;
  isActive: boolean;
}

interface EmailAutomationPanelProps {
  onSelectEmail?: (id: string) => void;
}

const DEFAULT_TEMPLATES: AutoReplyTemplate[] = [
  { id: "ooo", name: "Out of Office", body: "Thank you for your email. I am currently out of the office and will respond upon my return.", isActive: false },
  { id: "ack", name: "Acknowledgment", body: "Thank you for your message. I have received it and will follow up shortly.", isActive: false },
  { id: "fwd", name: "Forwarding Notice", body: "Thank you for reaching out. I am forwarding your message to the relevant team member.", isActive: false },
];

export default function EmailAutomationPanel({ onSelectEmail }: EmailAutomationPanelProps) {
  const [autoCategize, setAutoCategize] = useState(true);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [smartLabels, setSmartLabels] = useState(false);
  const [templates, setTemplates] = useState<AutoReplyTemplate[]>(DEFAULT_TEMPLATES);
  const [followUps, setFollowUps] = useState<FollowUpReminder[]>([]);
  const [showAddReminder, setShowAddReminder] = useState(false);

  const toggleTemplate = (id: string) => {
    setTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
    const tmpl = templates.find(t => t.id === id);
    if (tmpl) {
      toast.success(tmpl.isActive ? `${tmpl.name} disabled` : `${tmpl.name} enabled`);
    }
  };

  const completeReminder = (id: string) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, completed: true } : f));
    toast.success("Follow-up completed");
  };

  const pendingFollowUps = followUps.filter(f => !f.completed);

  return (
    <div className="space-y-4">
      {/* Automation Toggles */}
      <div>
        <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Automation
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-[#B89555]" />
              <span className="text-xs text-black">Auto-categorize emails</span>
            </div>
            <Switch checked={autoCategize} onCheckedChange={setAutoCategize} className="h-4 w-7 data-[state=checked]:bg-[#B89555]" />
          </div>
          <div className="flex items-center justify-between bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-[#B89555]" />
              <span className="text-xs text-black">Auto-suggest replies</span>
            </div>
            <Switch checked={autoSuggest} onCheckedChange={setAutoSuggest} className="h-4 w-7 data-[state=checked]:bg-[#B89555]" />
          </div>
          <div className="flex items-center justify-between bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 text-[#B89555]" />
              <span className="text-xs text-black">Smart labels</span>
            </div>
            <Switch checked={smartLabels} onCheckedChange={setSmartLabels} className="h-4 w-7 data-[state=checked]:bg-[#B89555]" />
          </div>
        </div>
      </div>

      {/* Auto-Reply Templates */}
      <div>
        <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-2 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> Auto-Reply Templates
        </p>
        <div className="space-y-1">
          {templates.map(t => (
            <div key={t.id} className="flex items-center justify-between bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3 h-3 text-[#B89555] flex-shrink-0" />
                <span className="text-xs text-black truncate">{t.name}</span>
                {t.isActive && (
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-[8px] px-1 h-3.5">Active</Badge>
                )}
              </div>
              <Switch checked={t.isActive} onCheckedChange={() => toggleTemplate(t.id)} className="h-4 w-7 data-[state=checked]:bg-green-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Follow-up Reminders */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider flex items-center gap-1">
            <BellRing className="w-3 h-3" /> Follow-up Reminders
          </p>
          <Badge className="bg-[#B89555]/10 text-[#B89555] border-[#B89555]/20 text-[9px] h-4 px-1.5">
            {pendingFollowUps.length}
          </Badge>
        </div>
        {pendingFollowUps.length > 0 ? (
          <ScrollArea className="max-h-28">
            <div className="space-y-1">
              {pendingFollowUps.map(f => (
                <div
                  key={f.id}
                  className="flex items-center gap-2 bg-white/70 rounded-lg border border-[#B89555]/15 px-3 py-2 cursor-pointer hover:bg-[#B89555]/5"
                  onClick={() => onSelectEmail?.(f.emailId)}
                >
                  <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-black truncate">{f.emailSubject}</p>
                    <p className="text-[10px] text-black/40">{new Date(f.dueDate).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 hover:bg-green-100"
                    onClick={(e) => { e.stopPropagation(); completeReminder(f.id); }}
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-[10px] text-black/30 text-center py-2">No pending follow-ups</p>
        )}
      </div>
    </div>
  );
}
