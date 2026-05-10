import { useState } from "react";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AuditorForcePasswordChangeProps {
  displayName: string;
  onPasswordChanged: (newPassword: string) => Promise<void>;
}

const AuditorForcePasswordChange = ({
  displayName,
  onPasswordChanged,
}: AuditorForcePasswordChangeProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await onPasswordChanged(password);
      toast.success("Password changed successfully! You can now access the platform.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-[#EFE6D6]/10 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-[#1A1A1A]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome, {displayName}
          </h1>
          <p className="text-white/70">
            For security, you must set a new password before accessing the platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/90" />
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="pl-10 pr-10 bg-[#FDFBF7] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/90 hover:text-white/85"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/90" />
            <Input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="pl-10 bg-[#FDFBF7] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-bold"
          >
            {isSubmitting ? "Changing Password..." : "Set New Password & Continue"}
          </Button>
        </form>

        <p className="text-[#1A1A1A]/70 text-xs text-center mt-6">
          Read-Only Audit Access • You can view all pages but cannot make changes
        </p>
      </div>
    </div>
  );
};

export default AuditorForcePasswordChange;
