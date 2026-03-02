import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Trash2,
  Save,
  Shield,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Loader2,
  Pencil,
  ArrowLeft,
  CheckCircle,
  X
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const UserProfile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Profile form state
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Email change state - OTP based
  const [newEmail, setNewEmail] = useState("");
  const [showEmailChangeDialog, setShowEmailChangeDialog] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState<'input' | 'verify'>('input');
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth?redirect=/profile');
      return;
    }
    
    // Load user data
    const metadata = user.user_metadata || {};
    setDisplayName(metadata.full_name || metadata.name || user.email?.split('@')[0] || '');
    setPhone(metadata.phone || '');
    setPhotoUrl(metadata.avatar_url || metadata.picture || null);
    setEmailNotifications(Boolean((metadata as any).email_notifications ?? true));
    setLoading(false);
  }, [user, navigate]);

  const handleEmailNotificationsToggle = async (checked: boolean) => {
    if (!user) return;
    const prev = emailNotifications;
    setEmailNotifications(checked);
    setSavingNotifications(true);
    try {
      // Update auth metadata
      const { error } = await supabase.auth.updateUser({
        data: { email_notifications: checked },
      });
      if (error) throw error;

      // Sync with newsletter system (real backend wiring)
      await supabase.functions.invoke('update-email-preferences', {
        body: {
          email: user.email,
          marketing_enabled: checked,
          source: 'settings_toggle',
        },
      });

      toast.success(
        checked
          ? "Marketing emails enabled. Manage categories in Email Preferences."
          : "You will no longer receive marketing emails."
      );
    } catch (error: any) {
      console.error("Error updating notification preference:", error);
      setEmailNotifications(prev);
      toast.error(error?.message || "Failed to update notification preference");
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName,
          phone: phone,
        }
      });

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: urlData.publicUrl
        }
      });

      if (updateError) throw updateError;

      setPhotoUrl(urlData.publicUrl);
      toast.success("Photo uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          avatar_url: null
        }
      });

      if (error) throw error;
      setPhotoUrl(null);
      toast.success("Photo removed");
    } catch (error: any) {
      console.error("Error removing photo:", error);
      toast.error(error.message || "Failed to remove photo");
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Send password change confirmation email (non-blocking)
      supabase.functions.invoke('send-password-change-confirmation', {
        body: {
          email: user?.email,
          name: user?.user_metadata?.full_name || user?.user_metadata?.name || null,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        },
      }).catch(err => console.warn('Password change email warning:', err));
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  // Send OTP to new email
  const handleSendEmailOtp = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("New email is the same as current email");
      return;
    }

    setSendingOtp(true);
    try {
      const response = await supabase.functions.invoke('send-email-otp', {
        body: { 
          email: newEmail,
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0]
        }
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data?.error) throw new Error(data.error);

      // Always show success message - never display OTP to users
      toast.success("Verification code sent to your email. Please check your inbox and spam folder.");
      
      // Log for debugging only (not visible to users)
      if (data?.dev_otp) {
        console.log('[DEV] OTP for debugging:', data.dev_otp);
      }
      
      setEmailChangeStep('verify');
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  };

  // Verify OTP and change email
  const handleVerifyAndChangeEmail = async () => {
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setVerifyingEmail(true);
    try {
      // Step 1: Verify the OTP
      const verifyResponse = await supabase.functions.invoke('verify-email-otp', {
        body: { 
          email: newEmail,
          otp_code: otpCode
        }
      });

      if (verifyResponse.error) throw verifyResponse.error;
      
      const verifyData = verifyResponse.data;
      if (verifyData?.error) throw new Error(verifyData.error);

      // Step 2: Change the email using the new edge function
      const changeResponse = await supabase.functions.invoke('change-user-email', {
        body: { new_email: newEmail }
      });

      if (changeResponse.error) throw changeResponse.error;
      
      const changeData = changeResponse.data;
      if (changeData?.error) throw new Error(changeData.error);

      toast.success("Email changed successfully! Please sign in with your new email.");
      
      // Close dialog and reset state
      setShowEmailChangeDialog(false);
      resetEmailChangeState();
      
      // Sign out user so they can log in with new email
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      console.error("Error verifying/changing email:", error);
      toast.error(error.message || "Failed to change email");
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Reset email change state
  const resetEmailChangeState = () => {
    setNewEmail("");
    setOtpCode("");
    setEmailChangeStep('input');
  };

  // Handle dialog close
  const handleEmailDialogClose = (open: boolean) => {
    if (!open) {
      resetEmailChangeState();
    }
    setShowEmailChangeDialog(open);
  };

  const [accountDialogType, setAccountDialogType] = useState<'deactivate' | 'delete' | null>(null);
  const [accountActionLoading, setAccountActionLoading] = useState(false);

  const openAccountDialog = (type: 'deactivate' | 'delete') => {
    setAccountDialogType(type);
  };

  const switchDeleteToDeactivate = () => {
    // Close current dialog first to avoid focus-trap/overlay lock, then open deactivation confirmation.
    setAccountDialogType(null);
    window.setTimeout(() => {
      setAccountDialogType('deactivate');
    }, 60);
  };

  const executeAccountLifecycle = async (action: 'deactivate' | 'delete') => {
    setAccountActionLoading(true);
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('Request timed out. Please try again.')), 15000);
      });

      const invokePromise = supabase.functions.invoke('account-lifecycle', {
        body: { action },
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]) as {
        data: any;
        error: any;
      };

      if (error || data?.error) throw error || new Error(data?.error || 'Action failed');

      toast.success(action === 'delete'
        ? 'Your account has been scheduled for deletion. You have 30 days to recover it by signing in again.'
        : 'Your account has been deactivated. You can recover it anytime by signing in again.');

      setAccountDialogType(null);
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      console.error('Account lifecycle error:', error);
      toast.error(error?.message || 'Failed to update account status');
      setAccountDialogType(null);
    } finally {
      setAccountActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out failed:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  // Handle tab from query params
  const tabFromQuery = searchParams.get('tab');
  const defaultTab = tabFromQuery === 'settings' ? 'settings' : 'profile';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-black">
        <div className="mx-3 md:mx-4 lg:mx-6 my-6 rounded-2xl border border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </div>

          {/* Profile Card */}
          <Card className="mb-8 border border-border shadow-lg bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar Section */}
                <div className="relative">
                  <Avatar className="h-28 w-28 border-4 border-border/60">
                    <AvatarImage src={photoUrl || ""} alt={displayName} />
                    <AvatarFallback className="text-3xl [background:var(--jj-gradient-active)] text-foreground font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <label 
                    htmlFor="photo-upload" 
                    className="absolute bottom-0 right-0 p-2 [background:var(--jj-gradient-active)] text-foreground rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </div>

                {/* Info Section */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                    <Badge variant="outline" className="border-gold/60 text-foreground bg-gold/10 font-semibold">
                      <User className="h-3 w-3 mr-1 text-gold" />
                      Member
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {photoUrl && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemovePhoto}
                      className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
              <TabsTrigger value="profile" className="data-[state=active]:[background:var(--jj-gradient-active)] data-[state=active]:text-foreground">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:[background:var(--jj-gradient-active)] data-[state=active]:text-foreground">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:[background:var(--jj-gradient-active)] data-[state=active]:text-foreground">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="flex items-center gap-2 text-foreground font-medium">
                        <User className="h-4 w-4 text-gold" />
                        Display Name
                      </Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                        className="border-2 border-gold/50 focus:border-gold hover:border-gold transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2 text-foreground font-medium">
                        <Mail className="h-4 w-4 text-gold" />
                        Email Address
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-muted flex-1 border-2 border-gold/30"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowEmailChangeDialog(true)}
                          className="shrink-0 border-gold/50 hover:border-gold"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Change
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">Click Change to update your email with verification</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 text-foreground font-medium">
                        <Phone className="h-4 w-4 text-gold" />
                        Phone Number
                      </Label>
                      <PhoneInput
                        value={phone}
                        onChange={(value) => setPhone(value || '')}
                        placeholder="Enter phone number"
                        variant="light"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile} disabled={saving} variant="primary">
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="flex items-center gap-2 text-foreground font-medium">
                        <Lock className="h-4 w-4 text-gold" />
                        New Password
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-foreground font-medium">
                        <Lock className="h-4 w-4 text-gold" />
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleChangePassword} 
                      disabled={changingPassword || !newPassword || !confirmPassword}
                      variant="primary"
                    >
                      {changingPassword ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-gold/30 bg-gold/5">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-gold" />
                      <div>
                        <p className="font-medium text-foreground">Marketing & Campaign Emails</p>
                        <p className="text-sm text-muted-foreground">
                          {emailNotifications ? "You are receiving marketing emails" : "Marketing emails are disabled"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={handleEmailNotificationsToggle}
                      disabled={savingNotifications}
                      aria-label="Toggle email notifications"
                    />
                  </div>
                  
                  <a
                    href="/email-preferences"
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-gold/40 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gold" />
                      <div>
                        <p className="font-medium text-foreground">Manage Email Preferences</p>
                        <p className="text-sm text-muted-foreground">Choose which categories of emails you receive</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-gold transition-colors" />
                  </a>

                  <Separator />

                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-destructive">Deactivate Account</p>
                        <p className="text-sm text-destructive/80">Hide your profile &amp; pause access. Recover anytime.</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => openAccountDialog('deactivate')}
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-destructive">Delete Account</p>
                        <p className="text-sm text-destructive/80">Permanently remove your account after 30 days</p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => openAccountDialog('delete')}
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-destructive">Sign Out</p>
                        <p className="text-sm text-destructive/80">Sign out of your account on this device</p>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleSignOut}
                        className="border-destructive/40 text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          </div>
        </div>
      </div>
      
      {/* Email Change Dialog - OTP Based */}
      <Dialog open={showEmailChangeDialog} onOpenChange={handleEmailDialogClose}>
        <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Mail className="h-5 w-5 text-gold" />
              Change Email Address
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {emailChangeStep === 'input' 
                ? "Enter your new email address. We'll send a verification code to confirm ownership."
                : `Enter the 6-digit code sent to ${newEmail}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {emailChangeStep === 'input' ? (
            // Step 1: Enter new email
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Current Email</Label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">New Email Address</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                  disabled={sendingOtp}
                />
              </div>
            </div>
          ) : (
            // Step 2: Enter OTP code
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  A 6-digit verification code has been sent to:
                </p>
                <p className="font-medium text-foreground mb-6">{newEmail}</p>
                
                <div className="flex justify-center mb-4">
                  <InputOTP 
                    maxLength={6} 
                    value={otpCode} 
                    onChange={setOtpCode}
                    disabled={verifyingEmail}
                  >
                    <InputOTPGroup className="gap-1.5 sm:gap-2 flex-wrap justify-center">
                      <InputOTPSlot index={0} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gold/50 text-foreground text-lg sm:text-xl font-bold bg-white rounded-lg" />
                      <InputOTPSlot index={1} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gold/50 text-foreground text-lg sm:text-xl font-bold bg-white rounded-lg" />
                      <InputOTPSlot index={2} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gold/50 text-foreground text-lg sm:text-xl font-bold bg-white rounded-lg" />
                      <InputOTPSlot index={3} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gold/50 text-foreground text-lg sm:text-xl font-bold bg-white rounded-lg" />
                      <InputOTPSlot index={4} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gold/50 text-foreground text-lg sm:text-xl font-bold bg-white rounded-lg" />
                      <InputOTPSlot index={5} className="w-10 h-12 sm:w-12 sm:h-14 border-2 border-gold/50 text-foreground text-lg sm:text-xl font-bold bg-white rounded-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Didn't receive the code?{" "}
                  <button 
                    type="button"
                    onClick={() => {
                      setOtpCode("");
                      handleSendEmailOtp();
                    }}
                    className="text-gold hover:underline"
                    disabled={sendingOtp}
                  >
                    {sendingOtp ? "Sending..." : "Resend"}
                  </button>
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {emailChangeStep === 'verify' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setEmailChangeStep('input');
                  setOtpCode("");
                }}
                disabled={verifyingEmail}
                className="sm:mr-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => handleEmailDialogClose(false)}
              disabled={sendingOtp || verifyingEmail}
            >
              Cancel
            </Button>
            {emailChangeStep === 'input' ? (
              <Button 
                variant="primary" 
                onClick={handleSendEmailOtp} 
                disabled={sendingOtp || !newEmail}
              >
                {sendingOtp ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Verification Code
              </Button>
            ) : (
              <Button 
                variant="primary" 
                onClick={handleVerifyAndChangeEmail} 
                disabled={verifyingEmail || otpCode.length !== 6}
              >
                {verifyingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verify & Change Email
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Premium Account Lifecycle Dialogs */}
      <AlertDialog open={accountDialogType === 'deactivate'} onOpenChange={(open) => !open && setAccountDialogType(null)}>
        <AlertDialogContent className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setAccountDialogType(null)}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-background/70 text-foreground transition-colors hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>

          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center">
              <Lock className="h-7 w-7 text-amber-700" />
            </div>
            <AlertDialogTitle className="text-center text-xl text-foreground pr-10">
              Deactivate Your Account
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-4 text-sm text-muted-foreground">
                <p>
                  Deactivating your account will immediately hide all your personal information and remove your visibility from the platform.
                </p>
                <div className="bg-white/60 rounded-lg p-4 border border-gold/20 text-left space-y-2">
                  <p className="font-semibold text-foreground text-sm">What happens when you deactivate:</p>
                  <ul className="space-y-1.5 text-xs sm:text-sm">
                    <li className="flex items-start gap-2 leading-relaxed">
                      <Shield className="h-3.5 w-3.5 mt-0.5 text-amber-700 shrink-0" />
                      Your profile and data are hidden from view.
                    </li>
                    <li className="flex items-start gap-2 leading-relaxed">
                      <Shield className="h-3.5 w-3.5 mt-0.5 text-amber-700 shrink-0" />
                      Your account is securely stored for recovery.
                    </li>
                    <li className="flex items-start gap-2 leading-relaxed">
                      <Shield className="h-3.5 w-3.5 mt-0.5 text-amber-700 shrink-0" />
                      Sign in anytime to reactivate your account instantly.
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row sm:flex-wrap gap-2 pt-2">
            <AlertDialogCancel className="w-full sm:flex-1 min-w-0 border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 text-[13px] sm:text-sm">
              Keep My Account
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeAccountLifecycle('deactivate')}
              disabled={accountActionLoading}
              className="w-full sm:flex-1 min-w-0 border border-amber-500/50 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 text-[13px] sm:text-sm"
            >
              {accountActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Deactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={accountDialogType === 'delete'} onOpenChange={(open) => !open && setAccountDialogType(null)}>
        <AlertDialogContent className="relative w-full max-w-[calc(100vw-1.5rem)] sm:max-w-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setAccountDialogType(null)}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-background/70 text-foreground transition-colors hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>

          <AlertDialogHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center">
              <Trash2 className="h-7 w-7 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl text-foreground pr-10">
              Delete Your Account Permanently
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-center space-y-4 text-sm text-muted-foreground">
                <p>
                  Are you sure you want to permanently delete your account? Your data will be permanently erased after the recovery period.
                </p>
                <div className="bg-white/60 rounded-lg p-4 border border-red-200 text-left space-y-2">
                  <p className="font-semibold text-foreground text-sm">Before you proceed:</p>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li className="flex items-start gap-2 leading-relaxed">
                      <Shield className="h-3.5 w-3.5 mt-0.5 text-red-500 shrink-0" />
                      You have a <strong>30-day recovery window</strong> and can restore your account anytime by signing in again during that period.
                    </li>
                    <li className="flex items-start gap-2 leading-relaxed">
                      <Shield className="h-3.5 w-3.5 mt-0.5 text-red-500 shrink-0" />
                      After 30 days, all your data will be permanently deleted.
                    </li>
                    <li className="flex items-start gap-2 leading-relaxed">
                      <Shield className="h-3.5 w-3.5 mt-0.5 text-red-500 shrink-0" />
                      This includes your profile, preferences, and activity history.
                    </li>
                  </ul>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-left">
                  <p className="text-xs text-amber-800">
                    <strong>Not sure?</strong> We recommend deactivating your account instead. You can hide your profile and come back anytime without losing any data.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="flex-col sm:flex-row sm:flex-wrap gap-2 pt-2">
            <AlertDialogCancel
              className="w-full sm:flex-1 min-w-0 border-emerald-500/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 text-[13px] sm:text-sm"
            >
              Keep My Account
            </AlertDialogCancel>

            <button
              type="button"
              onClick={switchDeleteToDeactivate}
              disabled={accountActionLoading}
              className="inline-flex h-10 w-full sm:flex-1 min-w-0 items-center justify-center gap-2 rounded-md border border-amber-500/50 bg-amber-50 px-3 text-[13px] sm:text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-50 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              <Lock className="h-4 w-4 shrink-0" />
              Deactivate Instead
            </button>

            <AlertDialogAction
              onClick={() => executeAccountLifecycle('delete')}
              disabled={accountActionLoading}
              className="w-full sm:flex-1 min-w-0 border border-red-500/40 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 text-[13px] sm:text-sm"
            >
              {accountActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserProfile;
