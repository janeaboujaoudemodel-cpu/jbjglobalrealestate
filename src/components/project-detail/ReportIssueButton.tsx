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
      <div className={`rounded-xl border-2 border-red-500/40 bg-gradient-to-r from-red-950 to-red-900/90 p-4 flex items-center justify-between gap-4 flex-wrap shadow-[0_4px_20px_rgba(220,38,38,0.15)] ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 ring-2 ring-red-400/30">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/95">Noticed something incorrect?</p>
            <p className="text-xs text-red-300/80">Help us keep this project up-to-date</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border-2 border-red-400/60 bg-red-600 text-white text-sm font-semibold hover:bg-red-500 hover:border-red-400 transition-colors whitespace-nowrap shadow-lg shadow-red-900/30"
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
