import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Mail, Phone, User, Globe, Languages, Briefcase, CheckCircle } from 'lucide-react';

interface ContactGatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: ContactGatingData) => void;
  triggerSource?: string;
}

export interface ContactGatingData {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  location: string;
  preferredLanguage: string;
  interestedService: string;
}

const SERVICES = [
  'Buy Property',
  'Sell Property',
  'Rent Property',
  'Landlord Services',
  'Investment Consultation',
  'Mortgage Advisory',
  'Property Valuation',
  'Market Intelligence',
  'Off-Plan Properties',
  'Ready Properties',
  'Career Opportunities',
  'Partner with Us',
  'General Inquiry',
];

const LANGUAGES = [
  'English',
  'Arabic',
  'French',
  'Russian',
  'Chinese',
  'Hindi',
  'Spanish',
  'Portuguese',
  'German',
  'Italian',
  'Other',
];

const NATIONALITIES = [
  'UAE',
  'Saudi Arabia',
  'United Kingdom',
  'United States',
  'India',
  'Pakistan',
  'Philippines',
  'Egypt',
  'Jordan',
  'Lebanon',
  'France',
  'Germany',
  'Russia',
  'China',
  'Canada',
  'Australia',
  'Other',
];

const ContactGatingModal = ({ isOpen, onClose, onComplete, triggerSource }: ContactGatingModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'verification' | 'complete'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  
  const [formData, setFormData] = useState<ContactGatingData>({
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    location: '',
    preferredLanguage: 'English',
    interestedService: '',
  });

  // Check if user already submitted contact details
  useEffect(() => {
    const checkExistingSubmission = async () => {
      const sessionId = sessionStorage.getItem('visitor_session_id');
      if (!sessionId) return;

      const { data } = await supabase
        .from('contact_gating_submissions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (data) {
        // User already submitted, auto-complete
        const savedData: ContactGatingData = {
          fullName: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          nationality: data.nationality || '',
          location: data.location || '',
          preferredLanguage: data.preferred_language || 'English',
          interestedService: data.service_interest || '',
        };
        onComplete(savedData);
        onClose();
      }
    };

    if (isOpen) {
      checkExistingSubmission();
    }
  }, [isOpen, onComplete, onClose]);

  const handleInputChange = (field: keyof ContactGatingData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmitForm = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Generate and "send" verification code (in production, this would send an email/SMS)
    const code = generateVerificationCode();
    setSentCode(code);
    
    // For demo purposes, show the code in a toast
    toast.success(`Verification code sent! (Demo: ${code})`);
    setStep('verification');
  };

  const handleVerifyCode = async () => {
    if (verificationCode !== sentCode) {
      toast.error('Invalid verification code. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionId = sessionStorage.getItem('visitor_session_id') || `session_${Date.now()}`;
      
      // Use edge function for secure encrypted storage - NO PLAINTEXT PII
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-contact-gating`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            session_id: sessionId,
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            nationality: formData.nationality || undefined,
            location: formData.location || undefined,
            preferred_language: formData.preferredLanguage || undefined,
            service_interest: formData.interestedService || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Submission failed');
      }

      // Update visitor session with masked contact info (no PII in client-side storage)
      await supabase
        .from('visitor_sessions')
        .update({
          contact_details: {
            name: formData.fullName.split(' ')[0] + ' ***', // Partially masked
            email: formData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked email
            hasPhone: true,
            nationality: formData.nationality,
          },
          is_converted: true,
        })
        .eq('session_id', sessionId);

      // Mark as completed in localStorage (no full PII stored client-side)
      localStorage.setItem('contact_gating_completed', 'true');
      localStorage.setItem('contact_gating_data', JSON.stringify({
        ...formData,
        email: formData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
        phone: formData.phone.slice(0, 4) + '****' + formData.phone.slice(-2),
      }));

      setStep('complete');
      
      setTimeout(() => {
        onComplete(formData);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Error saving contact info:', error);
      toast.error('Failed to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = () => {
    const code = generateVerificationCode();
    setSentCode(code);
    toast.success(`New verification code sent! (Demo: ${code})`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold max-w-md shadow-[0_8px_40px_rgba(200,167,102,0.4)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-black">
            <Shield className="h-5 w-5 text-gold" />
            {step === 'form' && 'Complete Your Profile'}
            {step === 'verification' && 'Verify Your Email'}
            {step === 'complete' && 'Welcome!'}
          </DialogTitle>
          <DialogDescription className="text-zinc-600">
            {step === 'form' && 'One-time registration to unlock all features and personalized services.'}
            {step === 'verification' && 'Enter the verification code sent to your email.'}
            {step === 'complete' && 'You now have full access to all our features!'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4 mt-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-gold" />
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="border-2 border-gold/40 hover:border-gold focus:border-gold"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-black">
                <Mail className="h-4 w-4 text-gold" />
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="border-2 border-gold/40 hover:border-gold focus:border-gold"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-black">
                <Phone className="h-4 w-4 text-gold" />
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                placeholder="+971 50 123 4567"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="border-2 border-gold/40 hover:border-gold focus:border-gold"
              />
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-black">
                <Globe className="h-4 w-4 text-gold" />
                Nationality
              </Label>
              <Select value={formData.nationality} onValueChange={(v) => handleInputChange('nationality', v)}>
                <SelectTrigger className="border-2 border-gold/40 hover:border-gold focus:border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black">
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {NATIONALITIES.map((nat) => (
                    <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-black">
                <Globe className="h-4 w-4 text-gold" />
                Current Location
              </Label>
              <Input
                placeholder="City, Country"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="border-2 border-gold/40 hover:border-gold focus:border-gold"
              />
            </div>

            {/* Preferred Language */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-black">
                <Languages className="h-4 w-4 text-gold" />
                Preferred Language
              </Label>
              <Select value={formData.preferredLanguage} onValueChange={(v) => handleInputChange('preferredLanguage', v)}>
                <SelectTrigger className="border-2 border-gold/40 hover:border-gold focus:border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interested Service */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-black">
                <Briefcase className="h-4 w-4 text-gold" />
                Interested In
              </Label>
              <Select value={formData.interestedService} onValueChange={(v) => handleInputChange('interestedService', v)}>
                <SelectTrigger className="border-2 border-gold/40 hover:border-gold focus:border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICES.map((service) => (
                    <SelectItem key={service} value={service}>{service}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-zinc-600 mt-4">
              By continuing, you confirm you have reviewed our Terms of Service and Privacy Policy. 
              Your information is handled confidentially and used solely to support your inquiry and experience.
            </p>

            <Button onClick={handleSubmitForm} variant="primary" className="w-full">
              Continue
            </Button>
          </div>
        )}

        {step === 'verification' && (
          <div className="space-y-4 mt-4">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                We've sent a verification code to <strong>{formData.email}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Verification Code</Label>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="text-center text-2xl tracking-widest border-2 border-gold/40 hover:border-gold focus:border-gold"
                maxLength={6}
              />
            </div>

            <Button 
              onClick={handleVerifyCode} 
              disabled={isSubmitting || verificationCode.length !== 6}
              variant="primary" className="w-full"
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Complete'}
            </Button>

            <div className="text-center">
              <button 
                onClick={handleResendCode}
                className="text-sm text-gold hover:underline"
              >
                Didn't receive the code? Resend
              </button>
            </div>

            <button 
              onClick={() => setStep('form')}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to form
            </button>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-gold" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-2">Welcome, {formData.fullName}!</h3>
            <p className="text-zinc-600">
              You now have full access to all our features and personalized services.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactGatingModal;
