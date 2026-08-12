import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Paperclip, Star, AlertTriangle, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxEmail } from "./useInboxData";

const URGENCY_TONE: Record<string, string> = {
  critical: "bg-[#7F1D1D] text-white border-transparent",
  high: "bg-[#9A3412] text-white border-transparent",
  normal: "bg-[#064E3B] text-white border-transparent",
  low: "bg-[#1F2937] text-white border-transparent",
};

const SLA_TONE: Record<string, string> = {
  breached: "bg-[#7F1D1D] text-white border-transparent",
  at_risk: "bg-[#92400E] text-white border-transparent",
  on_track: "bg-[#064E3B] text-white border-transparent",
};

interface Props {
  emails: InboxEmail[];
  loading: boolean;
  selectedId: string | null;
  checkedIds: string[];
  onOpen: (email: InboxEmail) => void;
  onToggleCheck: (id: string) => void;
}

const InboxMessageList: React.FC<Props> = ({
  emails,
  loading,
  selectedId,
  checkedIds,
  onOpen,
  onToggleCheck,
}) => {
  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-black/5" />
        ))}
      </div>
    );
  }

  if (!emails.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-semibold text-[#0F172A]">No messages match this view</p>
        <p className="text-xs text-[#0F172A]/70">
          Adjust the folder or filters, or run a sync to pull the latest mail.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-black/5">
      {emails.map((email) => {
        const active = email.id === selectedId;
        return (
          <li key={email.id}>
            <div
              className={cn(
                "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors",
                active ? "bg-[#064E3B] text-white" : "hover:bg-black/[0.04]",
              )}
            >
              <div className="pt-1">
                <Checkbox
                  checked={checkedIds.includes(email.id)}
                  onCheckedChange={() => onToggleCheck(email.id)}
                  aria-label="Select email"
                />
              </div>
              <button
                type="button"
                onClick={() => onOpen(email)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "truncate text-sm",
                      email.is_unread ? "font-bold" : "font-medium",
                      active ? "text-white" : "text-[#0F172A]",
                    )}
                  >
                    {email.from_name || email.from_email || "Unknown sender"}
                  </span>
                  {email.is_starred && (
                    <Star className="h-3.5 w-3.5 shrink-0 fill-[#B8860B] text-[#B8860B]" />
                  )}
                  {email.has_attachments && (
                    <Paperclip className={cn("h-3.5 w-3.5 shrink-0", active ? "text-white" : "text-[#0F172A]/60")} />
                  )}
                  <span className={cn("ml-auto shrink-0 text-[11px]", active ? "text-white/80" : "text-[#0F172A]/60")}>
                    {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-0.5 truncate text-sm",
                    email.is_unread ? "font-semibold" : "font-normal",
                    active ? "text-white" : "text-[#0F172A]",
                  )}
                >
                  {email.subject || "(no subject)"}
                </p>
                <p className={cn("mt-0.5 line-clamp-1 text-xs", active ? "text-white/75" : "text-[#0F172A]/70")}>
                  {email.ai_summary || email.snippet || ""}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {email.urgency && (
                    <Badge className={cn("h-5 whitespace-nowrap px-2 text-[10px] uppercase tracking-wide", URGENCY_TONE[email.urgency] ?? URGENCY_TONE.normal)}>
                      {email.urgency}
                    </Badge>
                  )}
                  {email.category && (
                    <Badge className="h-5 whitespace-nowrap border-transparent bg-[#0F172A] px-2 text-[10px] uppercase tracking-wide text-white">
                      {email.category}
                    </Badge>
                  )}
                  {email.sla_state && email.sla_state !== "on_track" && (
                    <Badge className={cn("h-5 gap-1 whitespace-nowrap px-2 text-[10px] uppercase tracking-wide", SLA_TONE[email.sla_state])}>
                      {email.sla_state === "breached" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {email.sla_state === "breached" ? "SLA breached" : "SLA at risk"}
                    </Badge>
                  )}
                  {email.requires_reply && !email.is_responded && (
                    <Badge className="h-5 whitespace-nowrap border-transparent bg-[#B8860B] px-2 text-[10px] uppercase tracking-wide text-white">
                      Awaiting reply
                    </Badge>
                  )}
                  {email.ai_summary && (
                    <Sparkles className={cn("h-3.5 w-3.5", active ? "text-white/80" : "text-[#B8860B]")} />
                  )}
                </div>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default InboxMessageList;
