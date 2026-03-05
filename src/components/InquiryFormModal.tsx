import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Loader2, Send, CheckCircle, Crown, Sparkles, CheckCircle2, XCircle, Shield, Target, Briefcase, Users, Home, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getCountryList, getLanguageList } from '@/constants/localeOptions';
import { useLanguage } from '@/contexts/LanguageContext';
import OTPVerificationModal from '@/components/OTPVerificationModal';
import { PhoneInput, getPhoneValidation } from '@/components/ui/phone-input';
import { CONTACT_INFO } from '@/constants/stats';
import { useFormAutoSave } from '@/hooks/useFormAutoSave';

// Stricter email validation
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const inquirySchema = z.object({
  fullName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .min(1, '⚠️ This field is required.')
    .max(255, 'Email is too long')
    .regex(emailRegex, '⚠️ Please enter a valid email address.'),
  phone: z.string()
    .min(1, '⚠️ This field is required.'),
  nationality: z.string().min(1, '⚠️ Please select your nationality'),
  language: z.string().min(1, '⚠️ Please select your preferred language'),
  role: z.enum(['buyer', 'broker', 'visitor'], { required_error: '⚠️ Please select your role' }),
  buyerType: z.enum(['homeowner', 'investor']).optional(),
  message: z.string().max(1000).optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface InquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
  propertyName?: string;
  context?: Record<string, string>;
  skipVerification?: boolean; // Only skip if explicitly set (e.g. already verified users)
  preselectedRole?: 'buyer' | 'broker' | 'visitor';
}

const InquiryFormModal = ({ 
  isOpen, 
  onClose, 
  source = 'general', 
  propertyName, 
  context,
  skipVerification = false, // Email verification enabled by default
  preselectedRole
}: InquiryFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [showEmailOTP, setShowEmailOTP] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<InquiryFormData | null>(null);
  const { t, isRTL } = useLanguage();
  
  const countries = getCountryList('en');
  const languages = getLanguageList();

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      nationality: '',
      language: '',
      role: preselectedRole,
      buyerType: undefined,
      message: '',
    },
    mode: 'onChange',
  });

  // Auto-save form progress with encryption - prevents data loss on crash/refresh
  const { clearDraft } = useFormAutoSave(form, {
    formId: `inquiry_${source}`,
    debounceMs: 500,
    excludeFields: [], // Save all fields for user convenience
    expiryHours: 24, // Drafts expire after 24 hours
  });

  const watchRole = form.watch('role');

  // Reset verification state when modal closes (but keep draft for next time)
  useEffect(() => {
    if (!isOpen) {
      setEmailVerified(false);
      setPendingFormData(null);
      setEmailStatus('idle');
      // Don't reset form - keep draft for next time
    }
  }, [isOpen]);

  // Update role when preselectedRole changes
  useEffect(() => {
    if (preselectedRole && isOpen) {
      form.setValue('role', preselectedRole);
    }
  }, [preselectedRole, isOpen, form]);

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
      // Validate phone using PhoneInput validation
      const phoneValidation = getPhoneValidation(data.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.message);
        setIsSubmitting(false);
        return;
      }

      const normalizedPhone = data.phone.replace(/[\s\-\(\)]/g, '');
      const normalizedEmail = data.email.toLowerCase().trim();

      // Determine the display source for inquiry hub tracking
      const displaySource = propertyName 
        ? `Property Inquiry - ${propertyName}` 
        : source === 'general' ? 'Main Page Pop-up'
        : source === 'popup_main' ? 'Main Page Pop-up'
        : source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Call backend edge function to capture lead with detailed source tracking
      const { data: captureResult, error: captureError } = await supabase.functions.invoke('capture-lead', {
        body: {
          email: normalizedEmail,
          fullName: data.fullName,
          phone: normalizedPhone,
          nationality: data.nationality,
          language: data.language,
          source: 'website',
          subSource: displaySource,
          pageSource: typeof window !== 'undefined' ? window.location.pathname : null,
          role: data.role,
          buyerType: data.buyerType,
          message: data.message,
        },
      });

      if (captureError || (captureResult as any)?.error) {
        throw new Error((captureResult as any)?.error || captureError?.message || 'Failed to save lead');
      }

      // Also save to inquiries table for Inquiry Management Hub
      try {
        await supabase.from('inquiries').insert({
          full_name: data.fullName,
          email: normalizedEmail,
          phone: normalizedPhone,
          inquiry_type: data.role === 'buyer' ? (data.buyerType === 'investor' ? 'Investment Inquiry' : 'Property Inquiry') : 'General Inquiry',
          subject: propertyName ? `Inquiry: ${propertyName}` : `${displaySource} Registration`,
          message: data.message || null,
          property_name: propertyName || null,
          source: displaySource,
          status: 'pending',
        });
      } catch (inquiryErr) {
        console.warn('Inquiry hub insert failed (lead still saved):', inquiryErr);
      }

      // Best-effort admin notification (must NOT block the user submission)
      try {
        await supabase.functions.invoke('send-inquiry-email', {
          body: {
            ...data,
            phone: normalizedPhone,
            email: normalizedEmail,
            source,
            propertyName,
            context: {
              ...context,
              role: data.role,
              buyerType: data.buyerType || '',
              emailVerified: emailVerified ? 'Yes' : 'No',
            },
          },
        });
      } catch (notifyErr) {
        console.warn('Inquiry notification exception (lead still saved):', notifyErr);
      }

      // Save to localStorage for future forms
      localStorage.setItem('jj_captured_lead', JSON.stringify({
        email: normalizedEmail,
        fullName: data.fullName,
        phone: normalizedPhone,
        nationality: data.nationality,
        language: data.language,
      }));

      const firstName = data.fullName.split(' ')[0];
      setIsSuccess(true);
      
      // Clear the saved draft ONLY after successful submission
      clearDraft();
      
      toast.success(`✅ Thank you, ${firstName}! Our team will contact you shortly.`);
      
      // DO NOT auto-close - let user manually close the success modal
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
    // Validate phone before proceeding
    const phoneValidation = getPhoneValidation(data.phone);
    if (!phoneValidation.isValid) {
      // Don't set form error - PhoneInput shows its own validation
      toast.error('⚠️ Please enter a valid phone number including the full country code.');
      return;
    }

    // If buyer role but no buyer type selected
    if (data.role === 'buyer' && !data.buyerType) {
      form.setError('buyerType', { message: 'Please select if you are a Homeowner or Investor' });
      return;
    }

    // Always require email verification unless explicitly skipped
    if (!skipVerification && !emailVerified) {
      setPendingFormData(data);
      setShowEmailOTP(true);
      return;
    }

    // Otherwise, complete submission directly
    await completeSubmission(data);
  };

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={(open) => {
          // Prevent closing during submission to avoid data loss
          if (!open && !isSubmitting) {
            onClose();
          }
        }}
      >
        <DialogContent 
          className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 text-zinc-900 max-w-lg p-0 max-h-[90vh] overflow-y-auto shadow-2xl shadow-gold/20"
          dir={isRTL ? 'rtl' : 'ltr'}
          onInteractOutside={(e) => {
            // Prevent closing when interacting with popovers (SearchableSelect dropdowns)
            const target = e.target as HTMLElement;
            if (target?.closest('[data-radix-popper-content-wrapper]') || target?.closest('[role="listbox"]') || isSubmitting) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing on escape during submission
            if (isSubmitting) {
              e.preventDefault();
            }
          }}
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
              {/* Close button for success screen */}
              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                  form.reset();
                  setEmailStatus('idle');
                  setEmailVerified(false);
                  setPendingFormData(null);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 hover:text-black transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-3">Welcome to the Community!</h3>
              <p className="text-zinc-600 mb-6">You've successfully registered. We'll be in touch via WhatsApp shortly.</p>
              
              {/* Manual close button */}
              <Button
                onClick={() => {
                  setIsSuccess(false);
                  onClose();
                  form.reset();
                  setEmailStatus('idle');
                  setEmailVerified(false);
                  setPendingFormData(null);
                }}
                className="bg-gradient-to-r from-gold via-gold-light to-gold text-black hover:opacity-90 font-semibold px-8 py-2 rounded-lg"
              >
                Close
              </Button>
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
                  className="text-2xl font-bold text-center text-black"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {propertyName ? `Inquire About ${propertyName}` : 'Join Our Community'}
                </DialogTitle>
                <p className="text-zinc-600 text-sm text-center mt-2">Register to receive exclusive updates and property insights</p>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* ROLE SELECTION - Mandatory */}
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 text-sm">I am a... *</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange('buyer');
                              if (form.getValues('buyerType')) {
                                // Keep existing buyer type
                              }
                            }}
                            className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1 ${
                              field.value === 'buyer' 
                                ? 'border-gold bg-gold/10 text-gold' 
                                : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                            }`}
                          >
                            <Target className="w-5 h-5" />
                            <span className="text-xs font-medium">Buyer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange('broker');
                              form.setValue('buyerType', undefined);
                            }}
                            className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1 ${
                              field.value === 'broker' 
                                ? 'border-gold bg-gold/10 text-gold' 
                                : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                            }`}
                          >
                            <Briefcase className="w-5 h-5" />
                            <span className="text-xs font-medium">Broker</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange('visitor');
                              form.setValue('buyerType', undefined);
                            }}
                            className={`p-3 rounded-lg border transition-all duration-200 flex flex-col items-center gap-1 ${
                              field.value === 'visitor' 
                                ? 'border-gold bg-gold/10 text-gold' 
                                : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                            }`}
                          >
                            <Users className="w-5 h-5" />
                            <span className="text-xs font-medium">Visitor</span>
                          </button>
                        </div>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* BUYER TYPE - Only shown when Buyer is selected */}
                  {watchRole === 'buyer' && (
                    <FormField
                      control={form.control}
                      name="buyerType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-700 text-sm">Looking to... *</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => field.onChange('homeowner')}
                              className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                                field.value === 'homeowner' 
                                  ? 'border-gold bg-gold/10 text-gold' 
                                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                              }`}
                            >
                              <Home className="w-4 h-4" />
                              <span className="text-sm font-medium">Buy a Home</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => field.onChange('investor')}
                              className={`p-3 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                                field.value === 'investor' 
                                  ? 'border-gold bg-gold/10 text-gold' 
                                  : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                              }`}
                            >
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-sm font-medium">Invest</span>
                            </button>
                          </div>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 text-sm">{t('inquiry.fullName')} *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="h-12 bg-white border-2 border-gold/50 hover:border-gold text-black placeholder:text-zinc-400 focus:border-gold rounded-lg"
                            placeholder="John Doe"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Email Field - Full Width */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 text-sm flex items-center gap-2">
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
                            className={`h-12 bg-white text-black placeholder:text-zinc-400 rounded-lg w-full border-2 ${
                              emailStatus === 'valid' ? 'border-green-500/60 focus:border-green-500' :
                              emailStatus === 'invalid' ? 'border-red-500/60 focus:border-red-500' :
                              'border-gold/50 hover:border-gold focus:border-gold'
                            }`}
                            placeholder="email@example.com"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Phone Field - Full Width */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-700 text-sm">{t('inquiry.phone')} *</FormLabel>
                        <FormControl>
                          <PhoneInput 
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              // Clear form error when user types
                              if (fieldState.error) {
                                form.clearErrors('phone');
                              }
                            }}
                            showValidation={true}
                            className="w-full"
                            variant="light"
                          />
                        </FormControl>
                        {/* Only show form error if PhoneInput has no local number (empty field) */}
                        {fieldState.error && (!field.value || field.value.length <= 5) && (
                          <p className="text-red-400 text-xs">{fieldState.error.message}</p>
                        )}
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-700 text-sm">{t('inquiry.nationality')} *</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={countries}
                              placeholder="Select nationality"
                              searchPlaceholder="Search countries..."
                              priorityItem="United Arab Emirates"
                            />
                          </FormControl>
                          <FormMessage className="text-red-400 text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-700 text-sm">{t('inquiry.language')} *</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              value={field.value}
                              onChange={field.onChange}
                              options={languages}
                              placeholder="Select language"
                              searchPlaceholder="Search languages..."
                              priorityItem="English"
                            />
                          </FormControl>
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
                        <FormLabel className="text-zinc-700 text-sm">{t('inquiry.message')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className="min-h-[80px] bg-white border-zinc-200 text-black placeholder:text-zinc-400 focus:border-gold rounded-lg resize-none"
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
                    className="w-full h-14 bg-gradient-to-r from-gold via-gold-light to-gold text-black hover:opacity-90 font-bold text-base shadow-xl shadow-gold/20 rounded-lg mt-4 border-2 border-gold-dark flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Crown className="w-5 h-5" />
                        <span>{!skipVerification && !emailVerified ? 'Verify & Submit' : t('inquiry.submit')}</span>
                      </>
                    )}
                  </Button>

                  {/* Security & Privacy Notice */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200 mt-3">
                    <Shield className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <p className="text-zinc-600 text-xs leading-relaxed">
                      Your information is securely stored in the JBJ Global Real Estate system for service and quality purposes. We never share your data with third parties.
                    </p>
                  </div>

                  {/* Registration note */}
                  <p className="text-zinc-500 text-xs text-center pt-2">
                    By registering, you'll join our exclusive community and receive updates via WhatsApp.
                  </p>
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
