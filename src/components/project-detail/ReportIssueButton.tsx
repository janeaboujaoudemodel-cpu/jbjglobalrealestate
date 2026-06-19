import { useState } from "react";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ISSUE_TYPES = [
  "Incorrect Price",
  "Incorrect Availability",
  "Incorrect Payment Plan",
  "Incorrect Information",
  "Incorrect Details",
  "Incorrect Location",
  "Updated Project Information",
  "Other",
];

interface ReportIssueButtonProps {
  projectName: string;
  projectId?: string;
  projectSlug?: string;
  className?: string;
}

export default function ReportIssueButton({ 
  projectName, 
  projectId,
  projectSlug,
  className = "" 
}: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!issueType) {
      toast.error("Please select an issue type");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Save to project_reports table
      const { error: reportError } = await supabase.from("project_reports").insert({
        project_id: projectId || projectSlug || projectName,
        issue_type: issueType,
        description: description || null,
      });
      if (reportError) throw reportError;

      // 2. Also create a support ticket for the Customer Happiness Center
      const ticketNumber = `ISS-${Date.now().toString(36).toUpperCase()}`;
      const { error: ticketError } = await supabase.from("support_tickets").insert({
        ticket_number: ticketNumber,
        full_name: "Website User",
        email: "issue-report@system.local",
        subject: `[Project Issue] ${projectName} — ${issueType}`,
        description: `Issue Type: ${issueType}\nProject: ${projectName}\nProject ID: ${projectId || projectSlug || 'N/A'}\n\n${description || 'No additional details provided.'}`,
        service_category: "project_issue",
        status: "open",
        priority: "medium",
      });
      // Non-critical: don't fail if ticket creation fails
      if (ticketError) {
        console.warn("Support ticket creation failed (non-critical):", ticketError);
      }

      toast.success("Thank you! Your report has been submitted.");
      setOpen(false);
      setIssueType("");
      setDescription("");
    } catch (err) {
      console.error("Report submission failed:", err);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Premium champagne issue-report panel (replaces dark-red banner) */}
      <div
        data-no-backdrop-blur
        className={`rounded-2xl border border-[#B89555]/45 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-5 flex items-center justify-between gap-4 flex-wrap shadow-[0_6px_24px_rgba(184,149,85,0.18),inset_0_1px_0_rgba(255,255,255,0.6)] ${className}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-[#F7F2EA] flex items-center justify-center flex-shrink-0 ring-1 ring-[#B89555]/55">
            <AlertTriangle className="w-5 h-5 text-[#B89555]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] tracking-wide">Noticed something incorrect?</p>
            <p className="text-xs text-[#1A1A1A]/65 mt-0.5">Help us keep this project up-to-date</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="jj-cta-gold-metallic inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold whitespace-nowrap"
        >
          <AlertCircle className="w-4 h-4" />
          Report an issue
        </button>
      </div>

      {/* Report Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/55">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
              <AlertTriangle className="w-5 h-5 text-[#B89555]" />
              Report an Issue
            </DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/70">
              Noticed something incorrect? Help us keep <strong>{projectName}</strong> up-to-date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">Issue Type</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger className="h-11 border-[#B89555]/55 hover:border-[#B89555] focus:border-[#B89555]">
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-[#1A1A1A] mb-1.5 block">Tell us what seems wrong</label>
              <Textarea
                placeholder="Please describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="border-[#B89555]/55 hover:border-[#B89555] focus:border-[#B89555]"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !issueType}
              className="jj-cta-gold-metallic w-full h-11 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
