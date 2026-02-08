import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check, Shield, Users } from "lucide-react";

interface ApprovalConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  approverEmail: string | null;
  onConfirm: () => void;
  mode: "all" | "selected";
  /** Optional: breakdown by source (provident, reelly, etc.) */
  sourceBreakdown?: { source: string; count: number }[];
}

export function ApprovalConfirmDialog({
  open,
  onOpenChange,
  count,
  approverEmail,
  onConfirm,
  mode,
  sourceBreakdown,
}: ApprovalConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  
  // Require typing the count to confirm large batches
  const requiresTypedConfirmation = count >= 100;
  const expectedConfirmation = count.toString();
  const isConfirmValid = !requiresTypedConfirmation || confirmText === expectedConfirmation;

  const handleConfirm = () => {
    if (isConfirmValid) {
      setConfirmText("");
      onConfirm();
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConfirmText("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-amber-500" />
            Confirm Batch Approval
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              {/* Main count */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-foreground font-medium">Projects to Approve</span>
                  <Badge 
                    variant="outline" 
                    className="text-xl px-4 py-2 bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
                  >
                    {count.toLocaleString()}
                  </Badge>
                </div>

                {/* Source breakdown if available */}
                {sourceBreakdown && sourceBreakdown.length > 1 && (
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
                    {sourceBreakdown.map((s) => (
                      <div key={s.source} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{s.source}</span>
                        <span className="font-medium text-foreground">{s.count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Approver info */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Approver:</span>
                <span className="text-sm font-medium text-foreground">
                  {approverEmail || "Unknown"}
                </span>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-200">
                  <p className="font-medium">This action will:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-red-700 dark:text-red-300">
                    <li>Create <strong>{count.toLocaleString()}</strong> new live projects</li>
                    <li>Remove them from the pending queue</li>
                    <li>Record your email as the approver</li>
                    <li>Cannot be bulk-undone</li>
                  </ul>
                </div>
              </div>

              {/* Typed confirmation for large batches */}
              {requiresTypedConfirmation && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-count" className="text-foreground">
                    Type <span className="font-mono font-bold text-amber-600">{expectedConfirmation}</span> to confirm:
                  </Label>
                  <Input
                    id="confirm-count"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={`Enter ${expectedConfirmation}`}
                    className="font-mono text-lg text-center"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmValid}
            className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
          >
            <Check className="h-4 w-4 mr-2" />
            {mode === "all" ? "Approve All" : "Approve Selected"} ({count})
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
