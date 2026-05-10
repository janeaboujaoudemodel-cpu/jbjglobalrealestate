import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ForcePasswordChangeProps {
  onComplete: () => void;
  userName?: string;
}

export function ForcePasswordChange({ onComplete, userName }: ForcePasswordChangeProps) {
  const { signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("One number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("One special character");
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      setErrors(passwordErrors);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors(["Passwords do not match"]);
      return;
    }

    setIsSubmitting(true);

    try {
      // Update password in auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Update CRM profile to mark password as changed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("crm_users_profile")
          .update({
            force_password_change: false,
            password_changed_at: new Date().toISOString(),
            first_login_at: new Date().toISOString(),
            login_count: 0, // Reset so next login triggers welcome
          })
          .eq("user_id", user.id);
      }

      toast.success("Password updated successfully!", {
        description: "Please login again with your new password.",
      });
      
      // Show success screen instead of completing
      setPasswordChanged(true);
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error("Failed to update password", {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginAgain = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  // Show success screen after password change
  if (passwordChanged) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md bg-[#1A1A1A]/80 border-emerald-500/30 backdrop-blur-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Password Updated!
            </CardTitle>
            <CardDescription className="text-[#1A1A1A]/70">
              Your new password has been saved successfully. Please login again with your new password to continue.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
              <p className="text-emerald-300 text-sm">
                For security, you'll be signed out and redirected to the login page.
              </p>
            </div>
            
            <Button
              onClick={handleLoginAgain}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#1A1A1A] font-semibold py-3"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login with New Password
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-[#1A1A1A]/80 border-amber-500/30 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#1A1A1A]" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Welcome{userName ? `, ${userName}` : ""}!
          </CardTitle>
          <CardDescription className="text-[#1A1A1A]/70">
            For your security, please create a new password. This is a one-time setup.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-200">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#1A1A1A]/50 border-slate-600 text-white pr-10"
                  placeholder="Enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-[#1A1A1A]/50 border-slate-600 text-white"
                placeholder="Confirm your new password"
                required
              />
            </div>

            {errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
                  <AlertCircle className="w-4 h-4" />
                  Password requirements:
                </div>
                <ul className="text-red-300 text-xs space-y-1 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-[#1A1A1A] text-sm font-medium mb-2">
                <ShieldCheck className="w-4 h-4" />
                Security Tips
              </div>
              <ul className="text-amber-200/80 text-xs space-y-1">
                <li>• Save your password in a password manager</li>
                <li>• Don't share your password with anyone</li>
                <li>• Use a unique password for this account</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#1A1A1A] font-semibold py-3"
            >
              {isSubmitting ? "Updating..." : "Set New Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
