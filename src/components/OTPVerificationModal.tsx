import { useState, useEffect, useRef, forwardRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, Phone, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  type: 'email' | 'phone';
  value: string; // email or phone number
  fullName?: string;
}

const OTPVerificationModal = forwardRef<HTMLDivElement, OTPVerificationModalProps>(({
  isOpen, 
  onClose, 
  onVerified, 
  type, 
  value,
  fullName 
}, ref) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);

  // Send OTP on modal open
  useEffect(() => {
    if (isOpen && value) {
      sendOTP();
    }
  }, [isOpen, value]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendOTP = async () => {
    setIsSending(true);
    setError('');
    
    try {
      const functionName = type === 'email' ? 'send-email-otp' : 'send-sms-otp';
      const body = type === 'email' 
        ? { email: value, full_name: fullName }
        : { phone_number: value, user_id: 'guest-' + Date.now() };
      
      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) {
        let serverMessage = '';
        try {
          const ctx: any = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            serverMessage = (await ctx.json())?.error || '';
          } else if (ctx && typeof ctx.text === 'function') {
            const txt = await ctx.text();
            try { serverMessage = JSON.parse(txt)?.error || txt; } catch { serverMessage = txt; }
          }
        } catch { /* ignore */ }
        setError(serverMessage || "We couldn't send the code. Please try again in a moment.");
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      toast.success(`Verification code sent to your ${type}`);
      setCountdown(60); // 60 second cooldown
      
      // For development - show OTP in console
      if (data?.dev_otp) {
        console.log(`[DEV] OTP: ${data.dev_otp}`);
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError("We're sorry, there was a temporary issue. Please try again or contact us via WhatsApp or email.");
    } finally {
      setIsSending(false);
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const functionName = type === 'email' ? 'verify-email-otp' : 'verify-sms-otp';
      const body = type === 'email'
        ? { email: value, otp_code: otpCode }
        : { user_id: 'guest-' + Date.now(), otp_code: otpCode };

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      // Supabase-js returns non-2xx as `error` (FunctionsHttpError) with the
      // parsed body on error.context. Extract our { error: "..." } payload
      // so the user sees the real message instead of a generic toast / crash.
      if (error) {
        let serverMessage = '';
        try {
          const ctx: any = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const parsed = await ctx.json();
            serverMessage = parsed?.error || '';
          } else if (ctx && typeof ctx.text === 'function') {
            const txt = await ctx.text();
            try { serverMessage = JSON.parse(txt)?.error || txt; } catch { serverMessage = txt; }
          }
        } catch { /* ignore parse errors */ }
        setError(serverMessage || "We couldn't verify that code. Please request a new one and try again.");
        return;
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      setIsVerified(true);
      toast.success(`${type === 'email' ? 'Email' : 'Phone'} verified successfully!`);
      
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError("We're sorry, there was a temporary issue. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      setTimeout(() => verifyOTP(), 100);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const resetForm = () => {
    setOtp(['', '', '', '', '', '']);
    setError('');
    setIsVerified(false);
    inputRefs.current[0]?.focus();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#FDFBF7] border border-[#1A1A1A] text-white sm:max-w-md">
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

        {isVerified ? (
          <div className="py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Verified!</h3>
            <p className="text-white/70">Your {type} has been verified successfully.</p>
          </div>
        ) : (
          <>
            <DialogHeader className="text-center">
              <div className="w-14 h-14 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-xl flex items-center justify-center mx-auto mb-4">
                {type === 'email' ? (
                  <Mail className="w-7 h-7 text-[#1A1A1A]" />
                ) : (
                  <Phone className="w-7 h-7 text-[#1A1A1A]" />
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                Verify Your {type === 'email' ? 'Email' : 'Phone Number'}
              </DialogTitle>
              <DialogDescription className="text-white/70 mt-2">
                We've sent a 6-digit code to:
                <span dir="ltr" className="block text-[#1A1A1A] font-medium mt-1 text-base tracking-wide">
                  {type === 'phone' ? value.replace(/[^\d+\s-]/g, '') : value}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* OTP Input */}
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center text-2xl font-bold bg-[#1A1A1A] border-[#1A1A1A] text-white focus:border-[#B89555] rounded-lg ${
                      error ? 'border-red-500' : ''
                    }`}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              {/* Verify Button */}
              <Button
                onClick={verifyOTP}
                disabled={isVerifying || otp.some(d => !d)}
                className="w-full h-12 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>

              {/* Resend */}
              <div className="text-center">
                <p className="text-white/90 text-sm mb-2">Didn't receive the code?</p>
                <Button
                  variant="ghost"
                  onClick={() => {
                    resetForm();
                    sendOTP();
                  }}
                  disabled={countdown > 0 || isSending}
                  className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </Button>
              </div>

              {/* Help Text */}
              <p className="text-white/90 text-xs text-center">
                The code is valid for 10 minutes. Check your {type === 'email' ? 'inbox and spam folder' : 'messages'}.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});

OTPVerificationModal.displayName = 'OTPVerificationModal';

export default OTPVerificationModal;
