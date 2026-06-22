import { useState } from "react";
import { useTeamPageVisibility } from "@/contexts/TeamPageVisibilityContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Users, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

/**
 * TeamPageVisibilityToggle - Admin control to show/hide the public /team page.
 * When hidden, visitors hitting /team are redirected to /about.
 */
export const TeamPageVisibilityToggle = () => {
  const { isTeamPageVisible, isLoading, setTeamPageVisibility } = useTeamPageVisibility();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (next: boolean) => {
    setIsUpdating(true);
    try {
      await setTeamPageVisibility(next);
      toast.success(next ? "Team page is now visible to the public" : "Team page has been hidden from the public");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update team page visibility. Admin permission required.");
    } finally {
      setIsUpdating(false);
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
    <Card className="border-[#B89555]/30 bg-gradient-to-br from-champagne-light to-champagne">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <CardTitle className="text-[#1A1A1A] text-lg">Team Page Visibility</CardTitle>
            <CardDescription className="text-[#1A1A1A]/70">
              Controls the public <code className="text-[#1A1A1A]">/team</code> page
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#FDFBF7]/60 border border-[#B89555]/20">
          <div className="flex items-center gap-3">
            {isTeamPageVisible ? <Eye className="w-5 h-5 text-[color:var(--emerald-1)]" /> : <EyeOff className="w-5 h-5 text-amber-600" />}
            <div>
              <p className="font-medium text-[#1A1A1A]">
                {isTeamPageVisible ? "Team page is public" : "Team page is hidden"}
              </p>
              <p className="text-sm text-[#1A1A1A]/70">
                {isTeamPageVisible
                  ? "Anyone can visit /team and view all departments."
                  : "Visitors hitting /team are redirected to /about. Owner preview still works while logged in."}
              </p>
            </div>
          </div>
          <Switch checked={isTeamPageVisible} onCheckedChange={handleToggle} disabled={isUpdating} />
        </div>

        <Button
          variant="outline"
          className={`w-full border-2 ${
 isTeamPageVisible
 ? "border-amber-500 text-amber-700 hover:bg-amber-50"
 : "border-[color:var(--emerald-1)]/30 text-[color:var(--emerald-1)] hover:jj-emerald-soft"
 }`}
          onClick={() => handleToggle(!isTeamPageVisible)}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : isTeamPageVisible ? (
            <EyeOff className="w-4 h-4 mr-2" />
          ) : (
            <Eye className="w-4 h-4 mr-2" />
          )}
          {isTeamPageVisible ? "Hide Team Page" : "Make Team Page Public"}
        </Button>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FDFBF7] border border-[#B89555]/30">
          <AlertTriangle className="w-5 h-5 text-[#B89555] mt-0.5 flex-shrink-0" />
          <div className="text-sm text-[#1A1A1A]/80">
            <p className="font-medium mb-1 text-[#1A1A1A]">How it works</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Hides the entire /team route from public visitors.</li>
              <li>Content is hidden, never deleted — restore anytime.</li>
              <li>Owners signed in still see /team for review/preview.</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamPageVisibilityToggle;
