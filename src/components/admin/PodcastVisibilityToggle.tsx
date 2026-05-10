import { useState } from "react";
import { usePodcastVisibility } from "@/contexts/PodcastVisibilityContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Eye, EyeOff, Mic, Loader2 } from "lucide-react";
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
 * PodcastVisibilityToggle - Admin control for toggling JBJ Podcast section visibility.
 * 
 * This component provides a secure interface for admins to:
 * - View current podcast section visibility status
 * - Toggle visibility on/off with confirmation
 * - Understand the implications of each action
 * 
 * Note: Admins/Owners always see the podcast section for testing purposes.
 */
export const PodcastVisibilityToggle = () => {
  const { isPodcastVisible, isLoading, setPodcastVisibility } = usePodcastVisibility();
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
      await setPodcastVisibility(pendingValue);
      toast.success(
        pendingValue 
          ? "JBJ Podcast section is now visible to all users" 
          : "JBJ Podcast section is now hidden from public users"
      );
    } catch (error) {
      console.error("Error updating podcast visibility:", error);
      toast.error("Failed to update podcast visibility. Please ensure you have admin permissions.");
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
              <Mic className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <CardTitle className="text-[#1A1A1A] text-lg">JBJ Podcast Visibility</CardTitle>
              <CardDescription className="text-[#1A1A1A]/70">
                Control podcast section visibility on homepage
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#FDFBF7]/50 border border-[#B89555]/20">
            <div className="flex items-center gap-3">
              {isPodcastVisible ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <p className="font-medium text-[#1A1A1A]">
                  {isPodcastVisible ? "Visible on Homepage" : "Hidden from Homepage"}
                </p>
                <p className="text-sm text-[#1A1A1A]/70">
                  {isPodcastVisible
                    ? "The JBJ Podcast section appears on the homepage for all viewers — including you."
                    : "The JBJ Podcast section is hidden from every homepage feed, including yours."
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={isPodcastVisible}
              onCheckedChange={handleToggleRequest}
              disabled={isUpdating}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className={`flex-1 border-2 ${
                isPodcastVisible 
                  ? "border-amber-500 text-amber-700 hover:bg-amber-50" 
                  : "border-green-500 text-green-700 hover:bg-green-50"
              }`}
              onClick={() => handleToggleRequest(!isPodcastVisible)}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isPodcastVisible ? (
                <EyeOff className="w-4 h-4 mr-2" />
              ) : (
                <Eye className="w-4 h-4 mr-2" />
              )}
              {isPodcastVisible ? "Hide from Public" : "Make Public"}
            </Button>
          </div>

          {/* Info Notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How this toggle works</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>This switch controls the homepage section for <strong>all viewers</strong>, including the owner.</li>
                <li>The podcast studio and individual episode pages are unaffected — they remain accessible directly.</li>
                <li>Flip it on whenever you want the podcast block to surface on the public homepage.</li>
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
                  Make Podcast Public?
                </>
              ) : (
                <>
                  <EyeOff className="w-5 h-5 text-amber-600" />
                  Hide Podcast Section?
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#1A1A1A]/70">
              {pendingValue ? (
                <>
                  This will make the <strong>JBJ Podcast section visible</strong> to all website visitors:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>The podcast section will appear on the homepage</li>
                    <li>All users can access podcast episodes</li>
                    <li>Episode streaming will be available to everyone</li>
                  </ul>
                </>
              ) : (
                <>
                  This will <strong>hide the JBJ Podcast section</strong> from every homepage feed:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>No visitors will see the podcast block on the homepage.</li>
                    <li>You will also stop seeing it on your own homepage.</li>
                    <li>Direct podcast pages and the studio remain available.</li>
                  </ul>
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
              {pendingValue ? "Make Public" : "Hide Section"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PodcastVisibilityToggle;
