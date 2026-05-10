import { useState } from "react";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
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
 * FounderVisibilityToggle - Admin control for toggling founder visibility.
 * 
 * This component provides a secure interface for admins to:
 * - View current founder visibility status
 * - Toggle visibility on/off with confirmation
 * - Understand the implications of each action
 */
export const FounderVisibilityToggle = () => {
  const { isFounderVisible, isLoading, setFounderVisibility } = useFounderVisibility();
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
      await setFounderVisibility(pendingValue);
      toast.success(
        pendingValue 
          ? "Founder content is now visible across the website" 
          : "Founder content has been hidden across the website"
      );
    } catch (error) {
      console.error("Error updating founder visibility:", error);
      toast.error("Failed to update founder visibility. Please ensure you have admin permissions.");
    } finally {
      setIsUpdating(false);
      setIsConfirmOpen(false);
      setPendingValue(null);
    }
  };

  const handleCancel = () => {
    setIsConfirmOpen(false);
    setPendingValue(null);
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
              <Shield className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <CardTitle className="text-[#1A1A1A] text-lg">Founder Visibility Control</CardTitle>
              <CardDescription className="text-[#1A1A1A]/70">
                Global toggle for all founder-related content
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#FDFBF7]/50 border border-[#B89555]/20">
            <div className="flex items-center gap-3">
              {isFounderVisible ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-[#1A1A1A]">
                  {isFounderVisible ? "Founder Content Visible" : "Founder Content Hidden"}
                </p>
                <p className="text-sm text-[#1A1A1A]/70">
                  {isFounderVisible 
                    ? "All founder references, images, and names are displayed" 
                    : "Founder content is hidden across the entire website"
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={isFounderVisible}
              onCheckedChange={handleToggleRequest}
              disabled={isUpdating}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className={`flex-1 border-2 ${
                isFounderVisible 
                  ? "border-amber-500 text-amber-700 hover:bg-amber-50" 
                  : "border-green-500 text-green-700 hover:bg-green-50"
              }`}
              onClick={() => handleToggleRequest(!isFounderVisible)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isFounderVisible ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {isFounderVisible ? "Hide Founder Content" : "Restore Founder Content"}
            </Button>
          </div>

          {/* Info Notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Important Information</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>This toggle affects the <strong>entire website</strong> instantly</li>
                <li>Content is <strong>hidden only</strong>, never deleted</li>
                <li>Restoration returns content to its <strong>exact original state</strong></li>
                <li>All changes are <strong>logged</strong> in the audit trail</li>
                <li>This is for compliance purposes only</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-[#FDFBF7] border-[#B89555]/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
              {pendingValue ? (
                <>
                  <Eye className="w-5 h-5 text-green-600" />
                  Restore Founder Content?
                </>
              ) : (
                <>
                  <EyeOff className="w-5 h-5 text-amber-600" />
                  Hide Founder Content?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1A1A1A]/70">
              {pendingValue ? (
                <>
                  This will <strong>restore all founder-related content</strong> across the entire website, including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Founder name and title</li>
                    <li>Founder images and photos</li>
                    <li>Founder references in footer and legal disclaimers</li>
                    <li>The Founder & Leadership page</li>
                  </ul>
                </>
              ) : (
                <>
                  This will <strong>hide all founder-related content</strong> across the entire website, including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Founder name and title</li>
                    <li>Founder images and photos</li>
                    <li>Founder references in footer and legal disclaimers</li>
                    <li>Navigation links to Founder page</li>
                  </ul>
                  <p className="mt-3 font-medium text-amber-700">
                    Note: Content is hidden only, never deleted. Restoration is instant.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} className="border-[#B89555]/30">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={pendingValue 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-amber-600 hover:bg-amber-700 text-white"
              }
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {pendingValue ? "Restore Content" : "Hide Content"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default FounderVisibilityToggle;
