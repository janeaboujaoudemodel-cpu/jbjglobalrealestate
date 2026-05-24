import { useState } from "react";
import { useConsVisibility } from "@/contexts/ConsVisibilityContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Eye, EyeOff, ThumbsDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

/**
 * ConsVisibilityToggle — single global toggle that hides/shows every
 * AI-generated "Cons" section site-wide (projects, areas, developers, compare).
 * Default: hidden.
 */
export const ConsVisibilityToggle = () => {
  const { isConsVisible, isLoading, setConsVisibility } = useConsVisibility();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleRequest = (newValue: boolean) => {
    setPendingValue(newValue);
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (pendingValue === null) return;
    setIsUpdating(true);
    try {
      await setConsVisibility(pendingValue);
      toast.success(
        pendingValue
          ? "Cons sections are now visible across the website"
          : "Cons sections are now hidden across the website"
      );
    } catch (error) {
      console.error("Error updating cons visibility:", error);
      toast.error("Failed to update. Please ensure you have admin permissions.");
    } finally {
      setIsUpdating(false);
      setIsConfirmOpen(false);
      setPendingValue(null);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-[#B89555]/30 bg-gradient-to-br from-champagne-light to-champagne">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#1A1A1A]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-[#B89555]/30 bg-gradient-to-br from-champagne-light to-champagne">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
              <ThumbsDown className="w-5 h-5 text-[#B89555]" />
            </div>
            <div>
              <CardTitle className="text-[#1A1A1A] text-lg">Project Cons Visibility</CardTitle>
              <CardDescription className="text-[#1A1A1A]/70">
                One global switch for all AI "Cons" sections across the entire website
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#FDFBF7]/50 border border-[#B89555]/20">
            <div className="flex items-center gap-3">
              {isConsVisible ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-[#1A1A1A]">
                  {isConsVisible ? "Cons Sections Visible" : "Cons Sections Hidden"}
                </p>
                <p className="text-sm text-[#1A1A1A]/70">
                  {isConsVisible
                    ? "AI Cons are displayed on project, area, developer & compare pages"
                    : "No negative points are shown anywhere on the website"}
                </p>
              </div>
            </div>
            <Switch
              checked={isConsVisible}
              onCheckedChange={handleToggleRequest}
              disabled={isUpdating}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className={`flex-1 border-2 ${
                isConsVisible
                  ? "border-amber-500 text-amber-700 hover:bg-amber-50"
                  : "border-green-500 text-green-700 hover:bg-green-50"
              }`}
              onClick={() => handleToggleRequest(!isConsVisible)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isConsVisible ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {isConsVisible ? "Hide Cons Site-wide" : "Show Cons Site-wide"}
            </Button>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What this controls</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>All published projects (AI Analyzer Cons card)</li>
                <li>All draft / pending-approval projects</li>
                <li>All upcoming projects, with no exception</li>
                <li>Area & developer AI analyzers, plus the Compare page</li>
                <li>Pros stays visible and expands to fill the layout cleanly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-[#FDFBF7] border-[#B89555]/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
              {pendingValue ? (
                <><Eye className="w-5 h-5 text-green-600" /> Show Cons site-wide?</>
              ) : (
                <><EyeOff className="w-5 h-5 text-amber-600" /> Hide Cons site-wide?</>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1A1A1A]/70">
              {pendingValue
                ? "Every AI Cons section will become visible again across the entire website."
                : "Every AI Cons section will be removed from view across projects, areas, developers and the Compare page. Nothing is deleted — flip back on at any time."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#B89555]/30">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={pendingValue
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {pendingValue ? "Show Cons" : "Hide Cons"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ConsVisibilityToggle;
