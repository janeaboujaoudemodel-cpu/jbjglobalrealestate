/**
 * ConfirmTicketDialog
 *
 * Premium "confirm ticket" review modal shown after the visitor clicks
 * "Request {time} on {date}". Displays the full summary of the booking,
 * requires two locked terms before submit:
 *
 *   1. Cancellation terms checkbox
 *      ("≥ 14:00 → 6 h notice · before 14:00 → 24 h notice").
 *   2. Accuracy & contact-consent checkbox
 *      (confirms details are accurate + permits JBJ to email about this meeting).
 *
 * Only when BOTH are checked does "Agree & submit" enable.
 */
import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Video, User as UserIcon, Mail, Phone, Briefcase, FileText, Loader2 } from "lucide-react";

export interface ConfirmTicketSummary {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  serviceTypeLabel: string;
  meetingTopic: string;
  proposalPreview?: string | null;
  attachmentName?: string | null;
  date: Date;          // selected date (year shown = 2026 etc.)
  time: string;        // "HH:MM" Dubai
  durationMin: number;
  locationLabel: string; // "Dubai office" | "Online · Google Meet"
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  summary: ConfirmTicketSummary | null;
  submitting: boolean;
  onConfirm: () => void; // parent enforces both flags via `canSubmit`
}

export function ConfirmTicketDialog({ open, onOpenChange, summary, submitting, onConfirm }: Props) {
  const [agreeCancel, setAgreeCancel] = useState(false);
  const [agreeAccurate, setAgreeAccurate] = useState(false);

  const canSubmit = agreeCancel && agreeAccurate && !submitting;

  const longDate = useMemo(() => {
    if (!summary) return "";
    return summary.date.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }, [summary]);

  if (!summary) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!submitting) onOpenChange(v); }}>
      <DialogContent className="max-w-lg bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A]">
        <DialogHeader>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#B89555]">Confirm your ticket</p>
          <DialogTitle className="text-xl font-semibold">
            Review &amp; submit your meeting request
          </DialogTitle>
          <p className="text-xs text-[#1A1A1A]/70">
            Please review the details below. Once submitted, Jane's office will be notified immediately.
          </p>
        </DialogHeader>

        {/* Ticket summary */}
        <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-4 text-sm space-y-2">
          <div className="flex items-start gap-2"><Calendar className="w-4 h-4 text-[#B89555] mt-0.5" />
            <div><span className="font-medium">{longDate}</span> · {summary.time} (Dubai)</div></div>
          <div className="flex items-start gap-2"><Clock className="w-4 h-4 text-[#B89555] mt-0.5" />
            <div>{summary.durationMin} minutes</div></div>
          <div className="flex items-start gap-2">
            {summary.locationLabel.toLowerCase().startsWith("online")
              ? <Video className="w-4 h-4 text-[#B89555] mt-0.5" />
              : <MapPin className="w-4 h-4 text-[#B89555] mt-0.5" />}
            <div>{summary.locationLabel}</div>
          </div>
          <hr className="border-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/50 to-transparent my-1" />
          <div className="flex items-start gap-2"><UserIcon className="w-4 h-4 text-[#B89555] mt-0.5" />
            <div>{summary.fullName} · {summary.company}</div></div>
          <div className="flex items-start gap-2"><Mail className="w-4 h-4 text-[#B89555] mt-0.5" />
            <div className="break-all">{summary.email}</div></div>
          <div className="flex items-start gap-2"><Phone className="w-4 h-4 text-[#B89555] mt-0.5" />
            <div>{summary.phone}</div></div>
          <hr className="border-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/50 to-transparent my-1" />
          <div className="flex items-start gap-2"><Briefcase className="w-4 h-4 text-[#B89555] mt-0.5" />
            <div><span className="font-medium">{summary.serviceTypeLabel}</span></div></div>
          <div className="flex items-start gap-2"><FileText className="w-4 h-4 text-[#B89555] mt-0.5" />
            <div className="whitespace-pre-wrap"><span className="text-[#1A1A1A]/70 text-xs uppercase tracking-[0.16em] block mb-0.5">Topic</span>{summary.meetingTopic}</div></div>
          {(summary.proposalPreview || summary.attachmentName) && (
            <div className="flex items-start gap-2"><FileText className="w-4 h-4 text-[#B89555] mt-0.5" />
              <div className="text-xs text-[#1A1A1A]/80">
                <span className="uppercase tracking-[0.16em] block mb-0.5 text-[#1A1A1A]/70">Proposal</span>
                {summary.attachmentName && <div>Attached: {summary.attachmentName}</div>}
                {summary.proposalPreview && <div className="line-clamp-3">{summary.proposalPreview}</div>}
              </div>
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="space-y-3 mt-1">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={agreeCancel}
              onCheckedChange={(v) => setAgreeCancel(Boolean(v))}
              className="mt-0.5 border-[#B89555]/60 data-[state=checked]:bg-[#B89555] data-[state=checked]:text-white"
            />
            <span className="text-xs text-[#1A1A1A]/85 leading-relaxed">
              <span className="font-semibold text-[#1A1A1A]">I agree to the cancellation terms.</span>{" "}
              Meetings at <strong>14:00 or later</strong> require <strong>at least 6 hours</strong> notice to cancel
              or reschedule. Meetings <strong>before 14:00</strong> require <strong>24 hours</strong> notice.
              For assistance, write to <a href="mailto:contact@jbj.ae" className="underline decoration-[#B89555] underline-offset-2">contact@jbj.ae</a>.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={agreeAccurate}
              onCheckedChange={(v) => setAgreeAccurate(Boolean(v))}
              className="mt-0.5 border-[#B89555]/60 data-[state=checked]:bg-[#B89555] data-[state=checked]:text-white"
            />
            <span className="text-xs text-[#1A1A1A]/85 leading-relaxed">
              <span className="font-semibold text-[#1A1A1A]">I confirm my details are accurate</span>{" "}
              and I consent to JBJ Global Real Estate contacting me by email, phone or WhatsApp
              about this meeting and related follow-ups, in line with the Privacy Policy.
            </span>
          </label>
        </div>

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}
            className="bg-white border-[#B89555]/30">
            Back to edit
          </Button>
          <Button variant="gold" onClick={onConfirm} disabled={!canSubmit}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Agree &amp; submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
