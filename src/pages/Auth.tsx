import React, { useState, useEffect, forwardRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Fingerprint, Scan } from "lucide-react";
import { z } from "zod";
import { JJLogoImage } from "@/components/JJLogoImage";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthMode = "signin" | "signup" | "forgot" | "reset";

const Auth = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, signInWithGoogle, resetPassword, updatePassword, signOut, loading } = useAuth();
  const { isAvailable: isBiometricAvailable, authenticate: biometricAuth, hasStoredCredential, isLoading: biometricLoading } = useBiometricAuth();
  
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  useEffect(() => {
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

    if ((mode === "signup" || mode === "reset") && password !== confirmPassword) {
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
          toast.success("Account created successfully! Welcome to JBJ GLOBAL REAL ESTATE.");
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
        if (error.message.includes("provider")) {
          toast.error("Google sign-in is temporarily unavailable. Please use email/password or try again later.");
        } else if (error.message.includes("popup")) {
          toast.error("Sign-in popup was blocked. Please allow popups and try again.");
        } else if (error.message.includes("network")) {
          toast.error("Network error. Please check your connection and try again.");
        } else {
          toast.error("We're sorry, there was a temporary issue. Please try again or contact us via WhatsApp or email.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await biometricAuth(true);
      
      if (result.success) {
        const storedUser = localStorage.getItem('jbj_biometric_user');
        if (storedUser) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            toast.success('Welcome back! Signed in with Face ID.');
            navigate('/');
          } else {
            toast.info('Please enter your password to complete sign-in.');
            setEmail(storedUser);
          }
        }
      } else if (result.fallbackUsed) {
        toast.info(result.error || 'Please sign in with email and password.');
      } else {
        toast.error(result.error || 'Biometric authentication failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  const getTitle = () => {
    switch (mode) {
      case "signup": return "Join Our Network";
      case "forgot": return "Reset Your Password";
      case "reset": return "Create New Password";
      default: return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "signup": return "Create your account to access exclusive UAE Real Estate opportunities";
      case "forgot": return "Enter your email address and we'll send you a secure reset link";
      case "reset": return "Please enter your new password below";
      default: return "Greetings from JBJ Global Real Estate. We're delighted to have you back.";
    }
  };

  // If already signed in
  if (user && mode !== "reset") {
    return (
      <div
        ref={ref}
        className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-white via-gray-50 to-white"
      >
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
        />

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-xl">
            <div className="flex justify-center mb-8">
              <JJLogoImage variant="light" size="md" />
            </div>

            <div className="text-center mb-8">
              <h1
                className="text-black text-2xl font-semibold mb-3"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                You're Signed In
              </h1>
              <p className="text-gray-600 text-sm">
                Welcome back, <span className="text-gold font-medium">{user.email}</span>
              </p>
            </div>

            <div className="space-y-4">
              <Button
                type="button"
                onClick={() => navigate("/my-dashboard")}
                className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 hover:scale-[1.02]"
              >
                Go to My Dashboard
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await signOut();
                    toast.success("Signed out successfully.");
                    setEmail("");
                    setPassword("");
                    setConfirmPassword("");
                    setMode("signin");
                  } catch (e) {
                    toast.error("Could not sign out. Please try again.");
                  }
                }}
                className="w-full h-12 border-gray-300 text-black hover:bg-gray-50 hover:border-gold/50 rounded-xl transition-all duration-300"
              >
                Sign Out
              </Button>
            </div>
          </div>

          <p className="text-center text-gray-400 text-xs mt-8">
            © {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-white via-gray-50 to-white"
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-xl">
          {/* Back button for forgot/reset modes */}
          {(mode === "forgot" || mode === "reset") && (
            <button
              onClick={() => setMode("signin")}
              className="flex items-center gap-2 text-gray-500 hover:text-gold mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Sign In</span>
            </button>
          )}

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <JJLogoImage variant="light" size="md" />
          </div>

          <div className="text-center mb-8">
            <h1
              className="text-black text-2xl font-semibold mb-3"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {getTitle()}
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {getSubtitle()}
            </p>
          </div>

          {/* Biometric & Google Sign In */}
          {(mode === "signin" || mode === "signup") && (
            <>
              {/* Face ID / Touch ID Button */}
              {mode === "signin" && isBiometricAvailable && hasStoredCredential && (
                <Button
                  type="button"
                  onClick={handleBiometricSignIn}
                  disabled={isSubmitting || biometricLoading}
                  className="w-full h-14 bg-gradient-to-r from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-white font-medium rounded-xl flex items-center justify-center gap-3 mb-4 border border-zinc-700 transition-all duration-300 shadow-lg"
                >
                  <Scan className="w-6 h-6" />
                  <span className="text-base">Sign in with Face ID</span>
                </Button>
              )}

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full h-12 bg-white hover:bg-gray-50 text-black font-medium rounded-xl flex items-center justify-center gap-3 mb-4 border border-gray-300 hover:border-gold/50 transition-all duration-300 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-400">or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            {/* Email field */}
            {mode !== "reset" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-black font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gold focus:ring-gold/20 rounded-xl transition-all duration-300"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
            )}

            {/* Password field */}
            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-black font-medium">
                  {mode === "reset" ? "New Password" : "Password"}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gold focus:ring-gold/20 rounded-xl transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>
            )}

            {/* Confirm Password — on signup AND reset */}
            {(mode === "signup" || mode === "reset") && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-black font-medium">
                  Confirm {mode === "reset" ? "New " : ""}Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gold focus:ring-gold/20 rounded-xl transition-all duration-300"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Forgot Password link */}
            {mode === "signin" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-sm text-gold hover:text-gold-dark hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 hover:scale-[1.02]"
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
                className="text-gold hover:text-gold-dark hover:underline transition-colors"
              >
                {mode === "signin"
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          )}

          {/* Continue as Guest */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate("/")}
              className="w-full h-12 border border-gray-200 hover:border-gold/50 rounded-xl text-black font-medium hover:bg-gray-50 transition-all duration-300"
            >
              Continue as Guest
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">
              Save favorites and shortlist properties without an account
            </p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">
          © {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
        </p>
      </div>
    </div>
  );
});

Auth.displayName = "Auth";

export default Auth;
