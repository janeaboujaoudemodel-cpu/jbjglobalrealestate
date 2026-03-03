import React, { useState, useEffect, useRef, forwardRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Scan, KeyRound, CheckCircle2, Loader2, Shield, UserCheck } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { z } from "zod";
import { JJLogoImage } from "@/components/JJLogoImage";
import { useBiometricAuth } from "@/hooks/useBiometricAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type AuthMode =
  | "signin"
  | "signup"
  | "forgot"          // enter email → sends OTP
  | "verify-otp"      // enter 6-digit code (password reset)
  | "reset"           // set new password after OTP verified
  | "verify-email"    // post-signup "check your email" screen
  | "otp-login";      // login via email code

const RESEND_COOLDOWN_SECONDS = 60;

const Auth = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn, signUp, updatePassword, signOut, loading, isOwner } = useAuth();
  const { isAvailable: isBiometricAvailable, authenticate: biometricAuth, hasStoredCredential, isLoading: biometricLoading } = useBiometricAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; otp?: string }>({});
  const [showReactivationDialog, setShowReactivationDialog] = useState(false);
  const [reactivationEmail, setReactivationEmail] = useState("");
  const [reactivationPassword, setReactivationPassword] = useState("");
  const [reactivating, setReactivating] = useState(false);
  const [isReactivationPreview, setIsReactivationPreview] = useState(false);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  // Handle mode from URL (e.g. magic link redirect)
  useEffect(() => {
    const modeParam = searchParams.get("mode");
    if (modeParam === "reset") setMode("reset");
  }, [searchParams]);

  // Test-only: force reactivation dialog preview via /auth?test_reactivation=1
  // Available to owner OR inside preview environment only (never on production domain)
  useEffect(() => {
    if (searchParams.get("test_reactivation") !== "1") return;

    const hostname = window.location.hostname;
    const isPreviewEnv = hostname.includes("lovableproject.com") || hostname.includes("id-preview--");
    if (!isOwner && !isPreviewEnv) return;

    setIsReactivationPreview(true);
    setReactivationEmail(searchParams.get("test_email") || email || "preview@jbj.test");
    setReactivationPassword("__preview__");
    setShowReactivationDialog(true);
  }, [searchParams, email, isOwner]);

  // ─── Validation ────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (["signin", "signup", "forgot", "otp-login"].includes(mode)) {
      try { emailSchema.parse(email); } catch (e) {
        if (e instanceof z.ZodError) newErrors.email = e.errors[0].message;
      }
    }

    if (["signin", "signup"].includes(mode)) {
      try { passwordSchema.parse(password); } catch (e) {
        if (e instanceof z.ZodError) newErrors.password = e.errors[0].message;
      }
    }

    if (mode === "reset") {
      try { passwordSchema.parse(password); } catch (e) {
        if (e instanceof z.ZodError) newErrors.password = e.errors[0].message;
      }
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    }

    if (mode === "signup" && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (mode === "verify-otp" && (!/^\d{6}$/.test(otpCode))) {
      newErrors.otp = "Enter the 6-digit code from your email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Send OTP (shared helper) ──────────────────────────────
  const sendOtp = async (targetEmail: string) => {
    const { data, error } = await supabase.functions.invoke("send-email-otp", {
      body: { email: targetEmail },
    });
    if (error) throw new Error(error.message || "Failed to send code");
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // ─── Verify OTP (shared helper) ────────────────────────────
  const verifyOtp = async (targetEmail: string, code: string) => {
    const { data, error } = await supabase.functions.invoke("verify-email-otp", {
      body: { email: targetEmail, otp_code: code },
    });
    if (error) throw new Error(error.message || "Verification failed");
    if (data?.error) throw new Error(data.error);
    return data;
  };

  // ─── Handle Resend Code ────────────────────────────────────
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    try {
      await sendOtp(email);
      startCooldown();
      toast.success("A new code has been sent to your email.");
    } catch (err: any) {
      toast.error(err.message || "Could not resend code. Please try again.");
    }
  };

  // ─── Main Submit ───────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      switch (mode) {
        case "signup": {
          const { error } = await signUp(email, password);
          if (error) {
            if (error.message.includes("already registered")) {
              toast.error("This email is already registered. Please sign in instead.");
            } else {
              toast.error(error.message);
            }
          } else {
            // Send welcome email
            try {
              await supabase.functions.invoke("send-welcome-email", {
                body: { userId: "pending", email, fullName: email.split("@")[0] },
              });
            } catch { /* non-critical */ }
            setMode("verify-email");
          }
          break;
        }

        case "signin": {
          const { error } = await signIn(email, password);
          if (error) {
            // Check if account is deactivated/banned — offer reactivation
            if (error.message.includes("banned") || error.message.includes("User is banned")) {
              setReactivationEmail(email);
              setReactivationPassword(password);
              setShowReactivationDialog(true);
            } else if (error.message.includes("Email not confirmed")) {
              toast.error("Please verify your email before signing in. Check your inbox.");
            } else if (error.message.includes("Invalid login credentials")) {
              toast.error("Invalid email or password. Please try again.");
            } else {
              toast.error(error.message);
            }
          } else {
            toast.success("Welcome back!");
            navigate("/");
          }
          break;
        }

        case "forgot": {
          // Send OTP for password reset — never leak whether email exists
          try {
            await sendOtp(email);
            startCooldown();
            setMode("verify-otp");
          } catch {
            // Show generic success even on failure to not leak email existence
          }
          toast.success("If an account exists with this email, a verification code has been sent.");
          break;
        }

        case "verify-otp": {
          await verifyOtp(email, otpCode);
          toast.success("Code verified! Set your new password.");
          setMode("reset");
          break;
        }

        case "reset": {
          // Use OTP-based reset if coming from verify-otp flow
          const { data, error: resetError } = await supabase.functions.invoke("reset-password-with-otp", {
            body: { email, otp_code: otpCode, new_password: password },
          });

          if (resetError || data?.error) {
            toast.error(data?.error || resetError?.message || "Failed to reset password");
          } else {
            toast.success("Password updated! You can now sign in.");
            // Send confirmation email
            try {
              await supabase.functions.invoke("send-password-change-confirmation", {
                body: { email },
              });
            } catch { /* non-critical */ }
            setPassword("");
            setConfirmPassword("");
            setOtpCode("");
            setMode("signin");
          }
          break;
        }

        case "otp-login": {
          // Step 1: Send OTP, then transition to verify step
          try {
            await sendOtp(email);
            startCooldown();
            toast.success("Check your email for the sign-in code.");
            setMode("verify-otp");
            // Store that this is a login flow (not reset)
            sessionStorage.setItem("otp_flow", "login");
          } catch {
            toast.success("If an account exists, a code has been sent.");
          }
          break;
        }

        default:
          break;
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReactivateAccount = async () => {
    if (isReactivationPreview) {
      setShowReactivationDialog(false);
      setIsReactivationPreview(false);
      toast.success("Preview complete — this popup only appears in real cases for users.");
      return;
    }

    setReactivating(true);
    try {
      // Call reactivate endpoint (no auth needed - uses service role)
      const { data, error } = await supabase.functions.invoke('account-lifecycle-reactivate', {
        body: { email: reactivationEmail, password: reactivationPassword },
      });
      
      if (error || data?.error) throw new Error(data?.error || error?.message || 'Reactivation failed');

      setShowReactivationDialog(false);
      toast.success("Your account has been reactivated! Welcome back.");
      
      // Now sign in
      const { error: signInError } = await signIn(reactivationEmail, reactivationPassword);
      if (signInError) {
        toast.error("Account reactivated, but sign-in failed. Please try signing in again.");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reactivate account. Please contact support.");
    } finally {
      setReactivating(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "apple") => {
    setIsSubmitting(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider);
      if (result?.error) {
        toast.error(`There was an issue with ${provider === "google" ? "Google" : "Apple"} sign-in. Please try again.`);
      }
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricSignIn = async () => {
    setIsSubmitting(true);
    try {
      const result = await biometricAuth(true);
      if (result.success) {
        const storedUser = localStorage.getItem("jbj_biometric_user");
        if (storedUser) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            toast.success("Welcome back! Signed in with Face ID.");
            navigate("/");
          } else {
            toast.info("Please enter your password to complete sign-in.");
            setEmail(storedUser);
          }
        }
      } else if (result.fallbackUsed) {
        toast.info(result.error || "Please sign in with email and password.");
      } else {
        toast.error(result.error || "Biometric authentication failed.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  // ─── Already signed in ────────────────────────────────────
  if (user && mode !== "reset" && !isReactivationPreview) {
    return (
      <div ref={ref} className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-xl">
            <div className="flex justify-center mb-8"><JJLogoImage variant="light" size="md" /></div>
            <div className="text-center mb-8">
              <h1 className="text-black text-2xl font-semibold mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>You're Signed In</h1>
              <p className="text-gray-600 text-sm">Welcome back, <span className="text-gold font-medium">{user.email}</span></p>
            </div>
            <div className="space-y-3">
              <Button type="button" onClick={() => navigate("/my-dashboard")} className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 hover:scale-[1.02]">Go to My Dashboard</Button>
              <Button type="button" onClick={() => navigate("/")} className="w-full h-12 bg-white border border-gray-200 hover:border-gold/50 text-black font-semibold rounded-xl transition-all duration-300 hover:bg-gray-50">Go to Home</Button>
              <Button type="button" variant="outline" onClick={async () => { try { await signOut(); toast.success("Signed out."); setEmail(""); setPassword(""); setConfirmPassword(""); setMode("signin"); } catch { toast.error("Could not sign out."); } }} className="w-full h-12 border-gray-300 text-black hover:bg-gray-50 hover:border-gold/50 rounded-xl transition-all duration-300">Sign Out</Button>
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs mt-8">© {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
        </div>
      </div>
    );
  }

  // ─── Post-signup "Check your email" screen ─────────────────
  if (mode === "verify-email") {
    return (
      <div ref={ref} className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-white via-gray-50 to-white">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-xl text-center">
            <div className="flex justify-center mb-6"><JJLogoImage variant="light" size="md" /></div>
            <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-black text-2xl font-semibold mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>Check Your Email</h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">
              We've sent a verification email to
            </p>
            <p className="text-black font-medium text-sm mb-6">{email}</p>
            <p className="text-gray-500 text-sm mb-8">
              Click the link in the email to verify your account. The link expires in 24 hours.
            </p>
            <div className="space-y-3">
              <Button type="button" onClick={() => { setMode("signin"); }} className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20">
                Back to Sign In
              </Button>
              <p className="text-gray-400 text-xs">
                Didn't receive the email? Check your spam folder or{" "}
                <button type="button" onClick={() => { setMode("signup"); }} className="text-gold hover:underline">try again</button>.
              </p>
            </div>
          </div>
          <p className="text-center text-gray-400 text-xs mt-8">© {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
        </div>
      </div>
    );
  }

  // ─── Title / subtitle helpers ──────────────────────────────
  const getTitle = () => {
    switch (mode) {
      case "signup": return "Join Our Network";
      case "forgot": return "Reset Your Password";
      case "verify-otp": return "Enter Verification Code";
      case "reset": return "Create New Password";
      case "otp-login": return "Sign In with Email Code";
      default: return "Welcome Back";
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case "signup": return "Create your account to access exclusive UAE Real Estate opportunities";
      case "forgot": return "Enter your email address and we'll send you a 6-digit verification code";
      case "verify-otp": return `Enter the 6-digit code sent to ${email}`;
      case "reset": return "Please enter your new password below";
      case "otp-login": return "We'll send a sign-in code to your email";
      default: return "Greetings from JBJ Global Real Estate. We're delighted to have you back.";
    }
  };

  const canGoBack = ["forgot", "verify-otp", "reset", "otp-login"].includes(mode);

  return (
    <div ref={ref} className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-white via-gray-50 to-white">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-xl">
          {/* Back button */}
          {canGoBack && (
            <button
              onClick={() => {
                if (mode === "verify-otp") setMode("forgot");
                else if (mode === "reset") setMode("verify-otp");
                else setMode("signin");
                setOtpCode("");
                setErrors({});
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-gold mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          )}

          {/* Logo */}
          <div className="flex justify-center mb-8"><JJLogoImage variant="light" size="md" /></div>

          <div className="text-center mb-8">
            <h1 className="text-black text-2xl font-semibold mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>{getTitle()}</h1>
            <p className="text-gray-600 text-sm leading-relaxed">{getSubtitle()}</p>
          </div>

          {/* Social + Biometric (signin / signup only) */}
          {(mode === "signin" || mode === "signup") && (
            <>
              {mode === "signin" && isBiometricAvailable && hasStoredCredential && (
                <Button type="button" onClick={handleBiometricSignIn} disabled={isSubmitting || biometricLoading} className="w-full h-14 bg-gradient-to-r from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-white font-medium rounded-xl flex items-center justify-center gap-3 mb-4 border border-zinc-700 transition-all duration-300 shadow-lg">
                  <Scan className="w-6 h-6" /><span className="text-base">Sign in with Face ID</span>
                </Button>
              )}

              <div className="flex gap-3 mb-4">
                <Button type="button" onClick={() => handleSocialSignIn("google")} disabled={isSubmitting} className="flex-1 h-12 bg-white hover:bg-gray-50 text-black font-medium rounded-xl flex items-center justify-center gap-2 border border-gray-300 hover:border-gold/50 transition-all duration-300 shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
                <Button type="button" onClick={() => handleSocialSignIn("apple")} disabled={isSubmitting} className="flex-1 h-12 bg-black hover:bg-zinc-900 text-white font-medium rounded-xl flex items-center justify-center gap-2 border border-black transition-all duration-300 shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400">or continue with email</span></div>
              </div>
            </>
          )}

          {/* ─── OTP Entry Screen ──────────────────────────── */}
          {mode === "verify-otp" ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-gold" />
                </div>
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(val) => { setOtpCode(val); setErrors((e) => ({ ...e, otp: undefined })); }}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="w-12 h-14 text-xl border-gray-300 focus:border-gold" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {errors.otp && <p className="text-red-500 text-sm">{errors.otp}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting || otpCode.length !== 6} className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20 transition-all duration-300">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Code"}
              </Button>

              {/* Resend with cooldown */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0}
                  className={`text-sm transition-colors ${resendCooldown > 0 ? "text-gray-400 cursor-not-allowed" : "text-gold hover:text-gold-dark hover:underline"}`}
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          ) : (
            /* ─── Standard Form ─────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
              {/* Email field — shown on signin, signup, forgot, otp-login */}
              {["signin", "signup", "forgot", "otp-login"].includes(mode) && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-black font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gold focus:ring-gold/20 rounded-xl transition-all duration-300" />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>
              )}

              {/* Password field — signin, signup */}
              {["signin", "signup"].includes(mode) && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-black font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gold focus:ring-gold/20 rounded-xl transition-all duration-300" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                </div>
              )}

              {/* New password fields — reset mode */}
              {mode === "reset" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-black font-medium">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input id="password" name="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gold focus:ring-gold/20 rounded-xl transition-all duration-300" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-black font-medium">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="pl-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gold focus:ring-gold/20 rounded-xl transition-all duration-300" />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                  </div>
                </>
              )}

              {/* Confirm password — signup */}
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-black font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input id="confirmPassword" name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="pl-12 h-12 bg-gray-50 border-gray-200 text-black placeholder:text-gray-400 focus:border-gold focus:ring-gold/20 rounded-xl transition-all duration-300" />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Forgot password link */}
              {mode === "signin" && (
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setMode("otp-login")} className="text-sm text-gray-500 hover:text-gold transition-colors flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5" /> Sign in with code
                  </button>
                  <button type="button" onClick={() => setMode("forgot")} className="text-sm text-gold hover:text-gold-dark hover:underline transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black font-semibold rounded-xl shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-gold/40 hover:scale-[1.02]">
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === "signup" ? (
                  "Create Account"
                ) : mode === "forgot" ? (
                  "Send Verification Code"
                ) : mode === "reset" ? (
                  "Update Password"
                ) : mode === "otp-login" ? (
                  "Send Sign-In Code"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          )}

          {/* Toggle signin/signup */}
          {(mode === "signin" || mode === "signup") && (
            <div className="mt-6 text-center">
              <button
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrors({}); }}
                className="text-gold hover:text-gold-dark hover:underline transition-colors"
              >
                {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          )}

          {/* Continue as Guest */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <button onClick={() => navigate("/")} className="w-full h-12 border border-gray-200 hover:border-gold/50 rounded-xl text-black font-medium hover:bg-gray-50 transition-all duration-300">
              Continue as Guest
            </button>
            <p className="text-center text-gray-400 text-xs mt-3">Save favorites and shortlist properties without an account</p>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-8">© {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
      </div>

      {/* Account Reactivation Dialog */}
      <AlertDialog
        open={showReactivationDialog}
        onOpenChange={(open) => {
          setShowReactivationDialog(open);
          if (!open && isReactivationPreview) setIsReactivationPreview(false);
        }}
      >
        <AlertDialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
              <UserCheck className="h-7 w-7 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl text-foreground">
              {isReactivationPreview ? "We Found Your Account (Preview)" : "We Found Your Account"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-4 text-sm text-muted-foreground">
                <p>
                  We identified an existing account associated with <strong className="text-foreground">{reactivationEmail}</strong> that was previously deactivated or scheduled for deletion.
                </p>
                <div className="bg-white/60 rounded-lg p-4 border border-emerald-200 text-left space-y-2">
                  <p className="font-semibold text-foreground text-sm">Your options:</p>
                   <ul className="space-y-1.5 text-xs">
                    <li className="flex items-start gap-2">
                      <Shield className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                      <span><strong>Reactivate</strong> — Restore your account, profile, and data instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="h-3.5 w-3.5 mt-0.5 text-emerald-600 shrink-0" />
                      <span><strong>Create New</strong> — Start fresh with a new account using a different email</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 pt-4 sm:flex-col">
            <AlertDialogAction
              onClick={handleReactivateAccount}
              disabled={reactivating}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-black font-semibold whitespace-nowrap px-6 h-12 rounded-xl"
            >
              {reactivating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
              Reactivate My Account
            </AlertDialogAction>
            <AlertDialogCancel
              disabled={reactivating}
              onClick={() => {
                setShowReactivationDialog(false);
                if (isReactivationPreview) {
                  setIsReactivationPreview(false);
                  return;
                }
                setEmail("");
                setPassword("");
                setMode("signup");
              }}
              className="w-full border-2 border-gold/40 text-black font-semibold hover:bg-gold/10 h-12 rounded-xl mt-0"
            >
              Create New Account
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

Auth.displayName = "Auth";

export default Auth;
