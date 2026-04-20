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
      {/* Yellow Banner */}
      <div data-no-backdrop-blur className={`rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-950 via-red-900 to-red-950 p-5 flex items-center justify-between gap-4 flex-wrap shadow-[0_6px_30px_rgba(220,38,38,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 ring-2 ring-red-400/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <AlertTriangle className="w-6 h-6 text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">Noticed something incorrect?</p>
            <p className="text-xs text-red-300/90 mt-0.5">Help us keep this project up-to-date</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-red-400/70 bg-red-600 text-white text-sm font-bold hover:bg-red-500 hover:border-red-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 whitespace-nowrap shadow-[0_4px_15px_rgba(220,38,38,0.4)]"
        >
          <AlertCircle className="w-4 h-4" />
          Report an issue
        </button>
      </div>

      {/* Report Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Report an Issue
            </DialogTitle>
            <DialogDescription>
              Noticed something incorrect? Help us keep <strong>{projectName}</strong> up-to-date.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Issue Type</label>
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
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
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tell us what seems wrong</label>
              <Textarea
                placeholder="Please describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !issueType}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
