import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { 
  Users, 
  Upload, 
  FileCheck, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  AlertTriangle,
  PartyPopper,
  Sparkles,
  FileText,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { JJLogoImage } from "@/components/JJLogoImage";
import SignaturePad from "@/components/referral/SignaturePad";
import ReferralContract from "@/components/referral/ReferralContract";
import MainLayout from "@/components/MainLayout";
import { PhoneInput } from "@/components/ui/phone-input";

type OnboardingStep = 1 | 2 | 3 | 4;

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  passportNumber: string;
  passportFile: File | null;
  visaFile: File | null;
  emiratesIdFile: File | null;
  agreeToTerms: boolean;
  signatureDataUrl: string | null;
}

const STEPS = [
  { id: 1, title: "Join", icon: Users, description: "Basic Information" },
  { id: 2, title: "Documents", icon: Upload, description: "Upload ID & Visa" },
  { id: 3, title: "Contract", icon: FileCheck, description: "Sign Agreement" },
];

export default function ReferralOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: user?.email || "",
    phone: "",
    nationality: "",
    passportNumber: "",
    passportFile: null,
    visaFile: null,
    emiratesIdFile: null,
    agreeToTerms: false,
    signatureDataUrl: null,
  });

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'passportFile' | 'visaFile' | 'emiratesIdFile', file: File | null) => {
    updateFormData(field, file);
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return false;
    }
    if (!formData.nationality.trim()) {
      toast.error("Please enter your nationality");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.passportFile) {
      toast.error("Please upload your passport copy");
      return false;
    }
    if (!formData.passportNumber.trim()) {
      toast.error("Please enter your passport number");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.agreeToTerms) {
      toast.error("Please agree to the terms and conditions");
      return false;
    }
    if (!formData.signatureDataUrl) {
      toast.error("Please sign the contract");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) {
      return;
    }

    if (currentStep === 3) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id || 'guest'}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from('hr-documents')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('hr-documents')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Generate referral code
      const { data: codeData } = await supabase.rpc('generate_referral_code');
      const newReferralCode = codeData || `JJ${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Upload documents
      let passportUrl = null;
      let visaUrl = null;
      let emiratesIdUrl = null;

      if (formData.passportFile) {
        passportUrl = await uploadFile(formData.passportFile, 'referral-passports');
      }
      if (formData.visaFile) {
        visaUrl = await uploadFile(formData.visaFile, 'referral-visas');
      }
      if (formData.emiratesIdFile) {
        emiratesIdUrl = await uploadFile(formData.emiratesIdFile, 'referral-emirates-id');
      }

      // Create referral partner record with all new fields
      const { error: partnerError } = await supabase
        .from('referral_partners')
        .insert({
          user_id: user?.id || null,
          referral_code: newReferralCode,
          full_name: formData.fullName,
          email: formData.email,
          phone_e164: formData.phone,
          partner_type: 'individual',
          commission_rate: 5.00,
          status: 'pending',
          nationality: formData.nationality,
          passport_number: formData.passportNumber,
          signature_data_url: formData.signatureDataUrl,
          contract_signed_at: new Date().toISOString(),
        } as any);

      if (partnerError) {
        console.error('Error creating partner:', partnerError);
        toast.error("Failed to create referral partner account");
        setIsSubmitting(false);
        return;
      }

      // Send welcome email
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            to: formData.email,
            name: formData.fullName,
            type: 'referral_partner',
            referralCode: newReferralCode,
          }
        });
      } catch (emailError) {
        console.error('Email error:', emailError);
      }

      setReferralCode(newReferralCode);
      setShowSuccess(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 3) * 100;

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header - Larger logo with breathable spacing */}
          {/* Header - Large monogram only, no duplicate text */}
          <div className="text-center mb-10">
            <div className="flex flex-col items-center justify-center mb-6">
              <JJLogoImage variant="light" size="lg" className="w-40 h-40 md:w-48 md:h-48" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              <span className="text-gold">Join the Referral Circle</span>
            </h1>
            <p className="text-black font-semibold text-lg">
              Earn 5% or 2.5% Commission
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <Progress value={progress} className="h-2 mb-4" />
            <div className="flex justify-between">
              {STEPS.map((step) => (
                <div
                  key={step.id}
                  className="flex flex-col items-center"
                >
                  {/* Step indicators: white/champagne fill, gold border, transparent bg to show background, black/gold icon */}
                  <div 
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-300`}
                    style={{
                      background: currentStep >= step.id 
                        ? 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)'
                        : 'transparent',
                      border: currentStep >= step.id 
                        ? '2px solid rgba(200,167,102,0.6)'
                        : '2px solid rgba(0,0,0,0.3)',
                    }}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5 text-gold" />
                    ) : (
                      <step.icon className={`w-5 h-5 ${currentStep >= step.id ? 'text-black' : 'text-muted-foreground'}`} />
                    )}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${currentStep >= step.id ? 'text-black' : 'text-muted-foreground'}`}>{step.title}</span>
                  <span className="text-xs text-muted-foreground hidden sm:block">{step.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Card - White background with gold border */}
          <Card className="bg-white border-2 border-gold/40 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Basic Info */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-gold" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Join the Referral Circle</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        Enter your personal information to get started
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="fullName">Full Name (as on passport) *</Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => updateFormData('fullName', e.target.value)}
                          placeholder="Enter your full name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          placeholder="your@email.com"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number *</Label>
                        <PhoneInput
                          value={formData.phone}
                          onChange={(value) => updateFormData('phone', value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="nationality">Nationality *</Label>
                        <Input
                          id="nationality"
                          value={formData.nationality}
                          onChange={(e) => updateFormData('nationality', e.target.value)}
                          placeholder="e.g., United Arab Emirates"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Document Upload */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-gold" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Upload Your Documents</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        We need these for verification purposes
                      </p>
                    </div>

                    <div className="grid gap-6">
                      {/* Passport Number */}
                      <div>
                        <Label htmlFor="passportNumber">Passport Number *</Label>
                        <Input
                          id="passportNumber"
                          value={formData.passportNumber}
                          onChange={(e) => updateFormData('passportNumber', e.target.value)}
                          placeholder="Enter passport number"
                          className="mt-1"
                        />
                      </div>

                      {/* Passport Upload */}
                      <div>
                        <Label>Passport Copy *</Label>
                        <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-gold/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('passportFile', e.target.files?.[0] || null)}
                            className="hidden"
                            id="passport-upload"
                          />
                          <label htmlFor="passport-upload" className="cursor-pointer">
                            {formData.passportFile ? (
                              <div className="flex items-center justify-center gap-2 text-gold">
                                <CheckCircle className="w-5 h-5" />
                                <span>{formData.passportFile.name}</span>
                              </div>
                            ) : (
                              <>
                                <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload passport copy
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Visa Upload */}
                      <div>
                        <Label>Visa Copy (if applicable)</Label>
                        <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-gold/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('visaFile', e.target.files?.[0] || null)}
                            className="hidden"
                            id="visa-upload"
                          />
                          <label htmlFor="visa-upload" className="cursor-pointer">
                            {formData.visaFile ? (
                              <div className="flex items-center justify-center gap-2 text-gold">
                                <CheckCircle className="w-5 h-5" />
                                <span>{formData.visaFile.name}</span>
                              </div>
                            ) : (
                              <>
                                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload visa copy (optional)
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Emirates ID Upload */}
                      <div>
                        <Label>Emirates ID (if applicable)</Label>
                        <div className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-gold/50 transition-colors">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileChange('emiratesIdFile', e.target.files?.[0] || null)}
                            className="hidden"
                            id="emirates-upload"
                          />
                          <label htmlFor="emirates-upload" className="cursor-pointer">
                            {formData.emiratesIdFile ? (
                              <div className="flex items-center justify-center gap-2 text-gold">
                                <CheckCircle className="w-5 h-5" />
                                <span>{formData.emiratesIdFile.name}</span>
                              </div>
                            ) : (
                              <>
                                <CreditCard className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload Emirates ID (optional)
                                </p>
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Contract Signing */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileCheck className="w-8 h-8 text-gold" />
                      </div>
                      <h2 className="text-xl font-semibold text-foreground">Sign the Agreement</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        Review and sign the referral partner agreement
                      </p>
                    </div>

                    {/* Contract Preview */}
                    <div className="border border-border rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                      <ReferralContract
                        partnerName={formData.fullName}
                        partnerEmail={formData.email}
                        partnerPhone={formData.phone}
                        partnerNationality={formData.nationality}
                        passportNumber={formData.passportNumber}
                        commissionRate={5}
                        contractDate={new Date()}
                        signatureDataUrl={formData.signatureDataUrl}
                      />
                    </div>

                    {/* Signature */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground">Your Signature</h3>
                      <SignaturePad
                        onSignatureChange={(sig) => updateFormData('signatureDataUrl', sig)}
                        requiredIdMatch={true}
                      />
                    </div>

                    {/* Terms Agreement */}
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => updateFormData('agreeToTerms', checked === true)}
                      />
                      <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                        I have read and agree to the Referral Partner Agreement. I confirm that my signature 
                        matches my official identification document and that all information provided is accurate.
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation - Back (secondary) and Continue/Submit (primary) */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {currentStep === 3 ? 'Submit' : 'Continue'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={() => {}}>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <VisuallyHidden.Root>
              <DialogTitle>Application Submitted</DialogTitle>
            </VisuallyHidden.Root>
            
              <div className="text-center py-6">
              <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <PartyPopper className="w-10 h-10 text-gold" />
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Congratulations!
              </h2>
              <p className="text-muted-foreground mb-6">
                Welcome to the JBJ Global Real Estate Referral Circle!
              </p>

              {referralCode && (
                <div className="bg-muted/50 rounded-xl p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Your Referral Code:</p>
                  <p className="text-2xl font-bold text-gold">{referralCode}</p>
                </div>
              )}

              <div className="space-y-3 text-left bg-muted/30 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Your application has been successfully submitted</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Welcome email sent to {formData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span>Earn 5% or 2.5% commission on successful referrals</span>
                </div>
              </div>

              <Button
                onClick={() => navigate('/referral-partner')}
                variant="primary"
                className="w-full"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
