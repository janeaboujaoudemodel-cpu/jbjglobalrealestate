import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, CheckCircle, Crown, Sparkles, CheckCircle2, XCircle, Shield, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { getCountryList, getLanguageList } from '@/constants/localeOptions';
import { useLanguage } from '@/contexts/LanguageContext';
import OTPVerificationModal from '@/components/OTPVerificationModal';
import { CONTACT_INFO } from '@/constants/stats';

// E.164 phone validation: must start with + and have 7-15 digits
const phoneRegex = /^\+[1-9]\d{6,14}$/;

// Stricter email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const inquirySchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .regex(emailRegex, 'Please enter a valid email address'),
  phone: z.string()
    .min(8, 'Please enter a valid phone number including country code')
    .max(20, 'Phone number is too long')
    .refine((val) => {
      const cleaned = val.replace(/[\s\-\(\)]/g, '');
      return phoneRegex.test(cleaned) || /^\+\d{7,15}$/.test(cleaned);
    }, 'Please enter a valid phone number including country code (e.g., +971 50 123 4567)'),
  nationality: z.string().min(1, 'Please select your nationality'),
  language: z.string().min(1, 'Please select your preferred language'),
  message: z.string().max(1000).optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface InquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
  propertyName?: string;
  context?: Record<string, string>;
  requireVerification?: boolean;
}

// Normalize phone to E.164 format
const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '');
};

const InquiryFormModal = ({ 
  isOpen, 
  onClose, 
  source = 'general', 
  propertyName, 
  context,
  requireVerification = false 
}: InquiryFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<InquiryFormData | null>(null);
  const { captureLead, leadData } = useLeadCapture();
  const { t, isRTL } = useLanguage();
  
  const countries = getCountryList();
  const languages = getLanguageList();

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      fullName: leadData?.fullName || '',
      email: leadData?.email || '',
      phone: leadData?.phone || '',
      nationality: leadData?.nationality || '',
      language: leadData?.language || '',
      message: '',
    },
    mode: 'onChange',
  });

  // Reset verification state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmailVerified(false);
      setPendingFormData(null);
      setEmailStatus('idle');
      setPhoneStatus('idle');
    }
  }, [isOpen]);

  // Real-time email validation
  const validateEmailRealtime = (email: string) => {
    if (!email) {
      setEmailStatus('idle');
      return;
    }
    if (emailRegex.test(email)) {
      setEmailStatus('valid');
    } else {
      setEmailStatus('invalid');
    }
  };

  // Real-time phone validation
  const validatePhoneRealtime = (phone: string) => {
    if (!phone) {
      setPhoneStatus('idle');
      return;
    }
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    if (phoneRegex.test(cleaned) || /^\+\d{7,15}$/.test(cleaned)) {
      setPhoneStatus('valid');
    } else {
      setPhoneStatus('invalid');
    }
  };

  const handleEmailVerified = async () => {
    setEmailVerified(true);
    setShowEmailOTP(false);
    
    // If we have pending form data, complete the submission
    if (pendingFormData) {
      await completeSubmission(pendingFormData);
    }
  };

  const completeSubmission = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      const normalizedPhone = normalizePhone(data.phone);
      const normalizedEmail = data.email.toLowerCase().trim();

      // Determine contact type from role
      const contactType = context?.role === 'broker' ? 'broker' : 'client';

      // Capture lead to BOTH leads table AND crm_leads
      await captureLead({
        email: normalizedEmail,
        fullName: data.fullName,
        phone: normalizedPhone,
        nationality: data.nationality,
        language: data.language,
      }, source, contactType);

      // Send email notification via edge function
      const { error } = await supabase.functions.invoke('send-inquiry-email', {
        body: {
          ...data,
          phone: normalizedPhone,
          email: normalizedEmail,
          source,
          propertyName,
          context: {
            ...context,
            emailVerified: emailVerified ? 'Yes' : 'No',
          },
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('✅ Thank you! Our team will contact you shortly.');
      
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        form.reset();
        setEmailStatus('idle');
        setPhoneStatus('idle');
        setEmailVerified(false);
        setPendingFormData(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error(
        "We're sorry, there was a temporary issue. Please try again or contact us via WhatsApp or email.",
        {
          action: {
            label: 'WhatsApp',
            onClick: () => window.open(`https://wa.me/${CONTACT_INFO.phone.replace(/[^0-9]/g, '')}`, '_blank'),
          },
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: InquiryFormData) => {
    // If verification is required and email not verified, show OTP modal
    if (requireVerification && !emailVerified) {
      setPendingFormData(data);
      setShowEmailOTP(true);
      return;
    }

    // Otherwise, complete submission directly
    await completeSubmission(data);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent 
          className="bg-black border border-zinc-800 text-white max-w-lg p-0 overflow-hidden"
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Premium top gradient glow */}
          <div
            className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.25) 0%, transparent 70%)',
            }}
          />

          {/* Gold accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

          {isSuccess ? (
            <div className="relative px-8 py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Thank You!</h3>
              <p className="text-zinc-400 mb-4">Our team will contact you shortly.</p>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
                <p>You can also reach us at:</p>
                <p className="text-gold font-medium mt-1">{CONTACT_INFO.phone}</p>
              </div>
            </div>
          ) : (
            <div className="relative px-6 pt-8 pb-6">
              <DialogHeader className="mb-6">
                {/* Premium Icon */}
                <div className="text-center mb-4">
                  <div className="relative inline-flex">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold via-gold-light to-gold-dark flex items-center justify-center shadow-2xl shadow-gold/30">
                      <Crown className="w-8 h-8 text-black" />
                    </div>
                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-gold animate-pulse" />
                  </div>
                </div>
                
                <DialogTitle 
                  className="text-2xl font-bold text-center"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    background: 'linear-gradient(135deg, #ffffff 0%, hsl(40 32% 51%) 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {propertyName ? `Inquire About ${propertyName}` : t('inquiry.title')}
                </DialogTitle>
                <p className="text-zinc-400 text-sm text-center mt-2">{t('inquiry.subtitle')}</p>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-sm">{t('inquiry.fullName')} *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="h-12 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg"
                            placeholder="John Doe"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-400 text-sm flex items-center gap-2">
                            {t('inquiry.email')} *
                            {emailStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {emailStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                            {emailVerified && <span title="Verified"><Shield className="w-4 h-4 text-green-500" /></span>}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              onChange={(e) => {
                                field.onChange(e);
                                validateEmailRealtime(e.target.value);
                                // Reset verification if email changes
                                if (emailVerified) setEmailVerified(false);
                              }}
                              className={`h-12 bg-zinc-900/80 text-white placeholder:text-zinc-500 rounded-lg ${
                                emailStatus === 'valid' ? 'border-green-500/50 focus:border-green-500' :
                                emailStatus === 'invalid' ? 'border-red-500/50 focus:border-red-500' :
                                'border-zinc-700/50 focus:border-gold'
                              }`}
                              placeholder="email@example.com"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-400 text-sm flex items-center gap-2">
                            {t('inquiry.phone')} *
                            {phoneStatus === 'valid' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {phoneStatus === 'invalid' && <XCircle className="w-4 h-4 text-red-500" />}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="tel"
                              onChange={(e) => {
                                field.onChange(e);
                                validatePhoneRealtime(e.target.value);
                              }}
                              className={`h-12 bg-zinc-900/80 text-white placeholder:text-zinc-500 rounded-lg ${
                                phoneStatus === 'valid' ? 'border-green-500/50 focus:border-green-500' :
                                phoneStatus === 'invalid' ? 'border-red-500/50 focus:border-red-500' :
                                'border-zinc-700/50 focus:border-gold'
                              }`}
                              placeholder="+971 50 123 4567"
                            />
                          </FormControl>
                          {phoneStatus === 'invalid' && (
                            <p className="text-red-400 text-xs mt-1">Please enter a valid phone number including country code</p>
                          )}
                          {phoneStatus === 'idle' && (
                            <p className="text-xs text-zinc-500 mt-1">Include country code (e.g., +971)</p>
                          )}
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-400 text-sm">{t('inquiry.nationality')} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                              {countries.map((country) => (
                                <SelectItem key={country} value={country} className="text-white hover:bg-zinc-800">
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-400 text-sm">{t('inquiry.language')} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                              {languages.map((lang) => (
                                <SelectItem key={lang} value={lang} className="text-white hover:bg-zinc-800">
                                  {lang}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-sm">{t('inquiry.message')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="min-h-[80px] bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg resize-none"
                            placeholder="Tell us about your requirements..."
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-gradient-to-r from-gold via-gold-light to-gold text-black hover:opacity-90 font-semibold text-base shadow-xl shadow-gold/20 rounded-lg mt-4"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        {requireVerification && !emailVerified ? 'Verify & Submit' : t('inquiry.submit')}
                      </>
                    )}
                  </Button>

                  {/* Alternative Contact */}
                  <div className="text-center pt-2">
                    <p className="text-zinc-500 text-xs">
                      Or reach us directly via{' '}
                      <a 
                        href={`https://wa.me/${CONTACT_INFO.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-500 hover:underline inline-flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        WhatsApp
                      </a>
                    </p>
                  </div>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showEmailOTP}
        onClose={() => {
          setShowEmailOTP(false);
          setPendingFormData(null);
        }}
        onVerified={handleEmailVerified}
        type="email"
        value={pendingFormData?.email || ''}
        fullName={pendingFormData?.fullName}
      />
    </>
  );
};

export default InquiryFormModal;
