import React, { useState, useEffect, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Sparkles } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthMode = "signin" | "signup" | "forgot" | "reset";

const Auth = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signInWithGoogle, resetPassword, updatePassword, signOut, loading } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
    // Check if user is coming from password reset link
    const modeParam = searchParams.get("mode");
    if (modeParam === "reset") {
      setMode("reset");
    }
  }, [searchParams]);


  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    
    if (mode !== "reset") {
      try {
        emailSchema.parse(email);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.email = e.errors[0].message;
        }
      }
    }

    if (mode !== "forgot") {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }
    }

    if (mode === "reset" && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created successfully! Welcome to JJ Global Capital.");
          navigate("/");
        }
      } else if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back! Signed in successfully.");
          navigate("/");
        }
      } else if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password reset link sent! Check your email.");
          setMode("signin");
        }
      } else if (mode === "reset") {
        const { error } = await updatePassword(password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Password updated successfully! Welcome back.");
          navigate("/");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case "signup": return "Create Account";
      case "forgot": return "Reset Password";
      case "reset": return "Set New Password";
      default: return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "signup": return "Join JJ Global Capital's exclusive network";
      case "forgot": return "Enter your email to receive a reset link";
      case "reset": return "Enter your new password below";
      default: return "Sign in to access your account";
    }
  };

  // If already signed in, let the user explicitly continue, sign out, or switch accounts.
  if (user && mode !== "reset") {
    return (
      <div
        ref={ref}
        className="min-h-screen flex items-center justify-center py-12 px-4 bg-zinc-950"
      >
        {/* Premium gradient background */}
        <div
          className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.12) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, hsl(40 32% 51% / 0.06) 0%, transparent 60%)",
          }}
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-4 shadow-lg shadow-gold/20">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <h1
                className="text-white text-3xl font-bold mb-2"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                You’re signed in
              </h1>
              <p className="text-zinc-400">
                Signed in as <span className="text-white">{user.email}</span>
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => navigate("/")}
                className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20"
              >
                Continue
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await signOut();
                    toast.success("Signed out.");
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    setMode("signin");
                  } catch (e) {
                    toast.error("Could not sign out. Please try again.");
                  }
                }}
                className="w-full h-12 border-zinc-700 text-white hover:bg-zinc-800 hover:border-gold/30 rounded-xl"
              >
                Sign out
              </Button>
            </div>

            <p className="mt-6 text-center text-zinc-500 text-sm">
              If you still see “Coming Soon” after signing in, that account doesn’t have admin access yet.
            </p>
          </div>

          <p className="text-center text-zinc-600 text-sm mt-6">
            © {new Date().getFullYear()} JJ Global Capital. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="min-h-screen flex items-center justify-center py-12 px-4 bg-zinc-950"
    >
      {/* Premium gradient background */}
      <div
        className="absolute top-0 left-0 right-0 h-[50%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.12) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 100%, hsl(40 32% 51% / 0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* Back button for forgot/reset modes */}
          {(mode === "forgot" || mode === "reset") && (
            <button
              onClick={() => setMode("signin")}
              className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Sign In</span>
            </button>
          )}

          <div className="text-center mb-8">
            {/* Premium logo/icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center mb-4 shadow-lg shadow-gold/20">
              <Sparkles className="w-8 h-8 text-black" />
            </div>
            <h1
              className="text-white text-3xl font-bold mb-2"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {getTitle()}
            </h1>
            <p className="text-zinc-400">
              {getSubtitle()}
            </p>
          </div>

          {/* Google Sign In - only for signin/signup modes */}
          {(mode === "signin" || mode === "signup") && (
            <>
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-xl flex items-center justify-center gap-3 mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-zinc-900 text-zinc-500">or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field - not shown in reset mode */}
            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-12 bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold focus:ring-gold/20"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password field - not shown in forgot mode */}
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  {mode === "reset" ? "New Password" : "Password"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold focus:ring-gold/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>
            )}

            {/* Confirm Password field - only in reset mode */}
            {mode === "reset" && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 h-12 bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold focus:ring-gold/20"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Forgot Password link - only in signin mode */}
            {mode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-gold hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black" />
              ) : mode === "signup" ? (
                "Create Account"
              ) : mode === "forgot" ? (
                "Send Reset Link"
              ) : mode === "reset" ? (
                "Update Password"
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Toggle signin/signup */}
          {(mode === "signin" || mode === "signup") && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setErrors({});
                }}
                className="text-gold hover:underline"
              >
                {mode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          )}

          {/* Continue as Guest */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 text-zinc-400 hover:text-white border border-zinc-700 rounded-xl hover:bg-zinc-800 hover:border-gold/30 transition-all flex items-center justify-center gap-2"
            >
              Continue as Guest
            </button>
            <p className="text-center text-zinc-600 text-xs mt-3">
              Save favorites and shortlist properties without an account
            </p>
          </div>
        </div>

        {/* JJ Global Capital branding */}
        <p className="text-center text-zinc-600 text-sm mt-6">
          © {new Date().getFullYear()} JJ Global Capital. All rights reserved.
        </p>
      </div>
    </div>
  );
});

Auth.displayName = "Auth";

export default Auth;