import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Crown, CheckCircle2, Phone, Mail, Shield, AlertCircle, Tag, X, ArrowRight, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import RoleSelector, { type UserRole } from "./RoleSelector";
import AddonSelector from "./AddonSelector";
import ContentTermsAcceptance from "./ContentTermsAcceptance";

interface TierData {
  id: string;
  name: string;
  price: number;
  priceAed: number;
  yearlyPrice: number;
  yearlyPriceAed: number;
  trialDays: number;
  aiCredits: number;
}

interface BrokerPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: TierData;
  billingPeriod: "monthly" | "yearly";
  onSuccess: () => void;
}

interface DiscountInfo {
  valid: boolean;
  discountType?: "percentage" | "fixed" | "free";
  discountValue?: number;
  description?: string;
  codeId?: string;
}

type SignupStep = "role" | "info" | "addons" | "terms" | "confirmation";

export default function BrokerPaymentModal({
  open,
  onOpenChange,
  tier,
  billingPeriod,
  onSuccess,
}: BrokerPaymentModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<SignupStep>("role");
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "AED">("USD");
  
  // Role selection
  const [selectedRole, setSelectedRole] = useState<UserRole>("broker");
  
  // Add-on selection
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  
  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Discount code state
  const [discountCode, setDiscountCode] = useState("");
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountInfo | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "",
    companyName: "",
    reraNumber: "",
  });

  const basePrice = currency === "USD" 
    ? (billingPeriod === "yearly" ? tier.yearlyPrice : tier.price)
    : (billingPeriod === "yearly" ? tier.yearlyPriceAed : tier.priceAed);
  
  // Calculate discounted price
  const calculateFinalPrice = () => {
    if (!appliedDiscount || !appliedDiscount.valid) return basePrice;
    
    if (appliedDiscount.discountType === "free") return 0;
    if (appliedDiscount.discountType === "percentage") {
      return Math.round(basePrice * (1 - (appliedDiscount.discountValue || 0) / 100));
    }
    if (appliedDiscount.discountType === "fixed") {
      return Math.max(0, basePrice - (appliedDiscount.discountValue || 0));
    }
    return basePrice;
  };
  
  const finalPrice = calculateFinalPrice();
  const currencySymbol = currency === "USD" ? "$" : "AED ";
  const paymentReference = `BT-${tier.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast.error("Please enter a discount code");
      return;
    }

    if (!formData.email) {
      toast.error("Please enter your email first");
      return;
    }

    setIsValidatingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-discount-code", {
        body: {
          action: "validate",
          code: discountCode.trim(),
          userEmail: formData.email,
          userId: user?.id,
          tier: tier.id,
        },
      });

      if (error) throw error;

      if (data.valid) {
        setAppliedDiscount(data);
        toast.success(
          data.discountType === "free" 
            ? "🎉 Complimentary access applied!" 
            : `${data.discountValue}% discount applied!`
        );
      } else {
        toast.error(data.error || "Invalid discount code");
        setAppliedDiscount(null);
      }
    } catch (error) {
      console.error("Error validating discount code:", error);
      toast.error("Failed to validate code. Please try again.");
    } finally {
      setIsValidatingCode(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);
    try {
      const trialEndsAt = new Date();
      // If free access, skip trial
      const effectiveTrialDays = appliedDiscount?.discountType === "free" ? 0 : tier.trialDays;
      trialEndsAt.setDate(trialEndsAt.getDate() + effectiveTrialDays);

      const expiresAt = new Date(trialEndsAt);
      if (billingPeriod === "yearly") {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Status is "active" if free or fully discounted, otherwise "trial"
      const subscriptionStatus = appliedDiscount?.discountType === "free" || finalPrice === 0 ? "active" : "trial";

      const { data: subscription, error } = await supabase.from("broker_subscriptions").insert({
        user_id: user.id,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        company_name: formData.companyName,
        rera_number: formData.reraNumber,
        tier: tier.id,
        status: subscriptionStatus,
        price_usd: billingPeriod === "yearly" ? tier.yearlyPrice : tier.price,
        currency,
        payment_method: appliedDiscount?.discountType === "free" ? "complimentary" : "manual",
        payment_reference: paymentReference,
        trial_ends_at: effectiveTrialDays > 0 ? trialEndsAt.toISOString() : null,
        starts_at: appliedDiscount?.discountType === "free" ? new Date().toISOString() : null,
        expires_at: expiresAt.toISOString(),
        ai_credits_limit: tier.aiCredits === -1 ? null : tier.aiCredits,
        user_role: selectedRole,
        selected_addons: selectedAddons,
        terms_accepted_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      // Record discount usage if applicable
      if (appliedDiscount?.valid && appliedDiscount.codeId) {
        await supabase.functions.invoke("validate-discount-code", {
          body: {
            action: "apply",
            codeId: appliedDiscount.codeId,
            userId: user.id,
            userEmail: formData.email,
            originalPrice: basePrice,
            finalPrice: finalPrice,
            subscriptionId: subscription?.id,
          },
        });
      }

      // Send notification email
      try {
        await supabase.functions.invoke("send-market-report-email", {
          body: {
            to: "invest@jjglobalcapital.com",
            subject: `New Broker Toolkit Subscription - ${tier.name}${appliedDiscount?.valid ? " (Discount Applied)" : ""}`,
            html: `
              <h2>New Broker Toolkit Subscription</h2>
              <p><strong>Plan:</strong> ${tier.name} (${billingPeriod})</p>
              <p><strong>Name:</strong> ${formData.fullName}</p>
              <p><strong>Email:</strong> ${formData.email}</p>
              <p><strong>Phone:</strong> ${formData.phone}</p>
              <p><strong>Company:</strong> ${formData.companyName || "N/A"}</p>
              <p><strong>RERA:</strong> ${formData.reraNumber || "N/A"}</p>
              <p><strong>Original Price:</strong> ${currencySymbol}${basePrice}</p>
              ${appliedDiscount?.valid ? `
                <p><strong>Discount:</strong> ${appliedDiscount.discountType === "free" ? "Complimentary Access" : `${appliedDiscount.discountValue}%`}</p>
                <p><strong>Final Price:</strong> ${currencySymbol}${finalPrice}</p>
              ` : ""}
              <p><strong>Reference:</strong> ${paymentReference}</p>
              <p><strong>Status:</strong> ${subscriptionStatus === "active" ? "Active (Complimentary)" : `Trial (${tier.trialDays} days)`}</p>
            `,
          },
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }

      setStep("confirmation");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Failed to create subscription. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onOpenChange(false);
    setStep("role");
    setAppliedDiscount(null);
    setDiscountCode("");
    setSelectedRole("broker");
    setSelectedAddons([]);
    setTermsAccepted(false);
  };

  const goToNextStep = () => {
    if (step === "role") setStep("info");
    else if (step === "info") setStep("addons");
    else if (step === "addons") setStep("terms");
  };

  const goToPreviousStep = () => {
    if (step === "info") setStep("role");
    else if (step === "addons") setStep("info");
    else if (step === "terms") setStep("addons");
  };

  const getStepNumber = () => {
    const steps: SignupStep[] = ["role", "info", "addons", "terms"];
    return steps.indexOf(step) + 1;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-black border-gold/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Step indicator */}
        {step !== "confirmation" && (
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                className={`w-2 h-2 rounded-full transition-all ${
                  num === getStepNumber()
                    ? "w-8 bg-gold"
                    : num < getStepNumber()
                    ? "bg-green-500"
                    : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: Role Selection */}
        {step === "role" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                Welcome to Broker Toolkit
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-400">
                {tier.name} Plan • Step 1 of 4
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <RoleSelector 
                selectedRole={selectedRole} 
                onRoleChange={setSelectedRole} 
              />
            </div>

            <Button
              onClick={goToNextStep}
              className="w-full bg-gradient-to-r from-gold via-gold to-gold-dark text-black py-6 text-lg hover:brightness-110 font-semibold"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </>
        )}

        {/* Step 2: Personal Info */}
        {step === "info" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold via-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/30">
                  <Crown className="w-8 h-8 text-black" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-center">
                {appliedDiscount?.discountType === "free" 
                  ? "Activate Complimentary Access" 
                  : `Start Your ${tier.trialDays}-Day Free Trial`}
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-400">
                {tier.name} Plan - {appliedDiscount?.valid && finalPrice !== basePrice ? (
                  <>
                    <span className="line-through text-zinc-500">{currencySymbol}{basePrice}</span>
                    {" "}
                    <span className="text-green-400 font-semibold">{currencySymbol}{finalPrice}</span>
                  </>
                ) : (
                  <>{currencySymbol}{basePrice}</>
                )}
                /{billingPeriod === "yearly" ? "year" : "month"} • Step 2 of 4
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!appliedDiscount?.valid && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-200 font-medium mb-1">Payment Gateway Coming Soon</p>
                    <p className="text-amber-200/70">
                      Online card payments will be available soon. For now, please contact us 
                      after registration to complete your payment via bank transfer.
                    </p>
                  </div>
                </div>
              )}

              {appliedDiscount?.valid && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-green-400 font-medium">
                          {appliedDiscount.discountType === "free" 
                            ? "🎉 Complimentary Access" 
                            : `${appliedDiscount.discountValue}% Discount Applied`}
                        </p>
                        {appliedDiscount.description && (
                          <p className="text-green-300/70 text-xs">{appliedDiscount.description}</p>
                        )}
                      </div>
                    </div>
                    <button onClick={removeDiscount} className="text-zinc-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label className="text-white">Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white">Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white">Phone Number *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+971 XX XXX XXXX"
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white">Company Name</Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your brokerage company"
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white">RERA Number</Label>
                  <Input
                    value={formData.reraNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, reraNumber: e.target.value }))}
                    placeholder="Your RERA registration number"
                    className="bg-zinc-900 border-zinc-700 text-white mt-1"
                  />
                </div>
              </div>

              {/* Discount Code Input */}
              {!appliedDiscount?.valid && (
                <div className="space-y-2">
                  <Label className="text-white">Have a discount code?</Label>
                  <div className="flex gap-2">
                    <Input
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="bg-zinc-900 border-zinc-700 text-white uppercase"
                      maxLength={20}
                    />
                    <Button
                      type="button"
                      onClick={validateDiscountCode}
                      disabled={isValidatingCode || !discountCode.trim()}
                      variant="outline"
                      className="border-gold text-gold hover:bg-gold/10 shrink-0"
                    >
                      {isValidatingCode ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Currency Selection */}
              <div className="space-y-2">
                <Label className="text-white">Preferred Currency</Label>
                <RadioGroup 
                  value={currency} 
                  onValueChange={(v) => setCurrency(v as "USD" | "AED")} 
                  className="flex gap-4"
                >
                  <label className={`flex-1 cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${currency === "USD" ? "border-gold bg-gold/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="USD" className="sr-only" />
                    <div className="text-lg font-bold text-white">
                      ${billingPeriod === "yearly" ? tier.yearlyPrice : tier.price}
                    </div>
                    <div className="text-xs text-zinc-400">USD</div>
                  </label>
                  <label className={`flex-1 cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${currency === "AED" ? "border-gold bg-gold/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="AED" className="sr-only" />
                    <div className="text-lg font-bold text-white">
                      {billingPeriod === "yearly" ? tier.yearlyPriceAed : tier.priceAed}
                    </div>
                    <div className="text-xs text-zinc-400">AED</div>
                  </label>
                </RadioGroup>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={goToPreviousStep}
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={goToNextStep}
                  disabled={!formData.fullName || !formData.email || !formData.phone}
                  className="flex-1 bg-gradient-to-r from-gold via-gold to-gold-dark text-black py-6 text-lg hover:brightness-110 font-semibold"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Add-ons Selection */}
        {step === "addons" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                Customize Your Package
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-400">
                Add extra tools or courses • Step 3 of 4
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 max-h-[50vh] overflow-y-auto">
              <AddonSelector
                selectedTier={tier.id}
                selectedAddons={selectedAddons}
                onAddonsChange={setSelectedAddons}
                currency={currency}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={goToPreviousStep}
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={goToNextStep}
                className="flex-1 bg-gradient-to-r from-gold via-gold to-gold-dark text-black py-6 text-lg hover:brightness-110 font-semibold"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Terms & Confirmation */}
        {step === "terms" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl text-center">
                Review & Accept Terms
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-400">
                Final step • Step 4 of 4
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <ContentTermsAcceptance
                isAccepted={termsAccepted}
                onAcceptanceChange={setTermsAccepted}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={goToPreviousStep}
                variant="outline"
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isProcessing || !termsAccepted}
                className="flex-1 bg-gradient-to-r from-gold via-gold to-gold-dark text-black py-6 text-lg hover:brightness-110 font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : appliedDiscount?.discountType === "free" ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Activate Free Access
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Start Free Trial
                  </>
                )}
              </Button>
            </div>

            <p className="text-zinc-500 text-xs text-center">
              By starting your trial, you agree to our terms of service. 
              {!appliedDiscount?.valid && " You will be contacted for payment setup before the trial ends."}
            </p>
          </>
        )}
        {step === "confirmation" && (
          <>
            <DialogHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl">Welcome to Broker Toolkit!</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {appliedDiscount?.discountType === "free" 
                  ? "Your complimentary access is now active"
                  : `Your ${tier.trialDays}-day free trial has started`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 text-center">
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
                <p className="text-zinc-300 text-sm mb-2">Your Reference Number:</p>
                <p className="text-white text-xl font-bold font-mono">{paymentReference}</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                <p className="text-zinc-300 font-medium">Next Steps:</p>
                <ol className="text-sm text-zinc-400 text-left space-y-2">
                  <li>1. Explore the Broker Toolkit dashboard</li>
                  <li>2. Start your training courses</li>
                  <li>3. Generate your first property PDF</li>
                  {!appliedDiscount?.valid && (
                    <li>4. We'll contact you before trial ends for payment</li>
                  )}
                </ol>
              </div>

              {!appliedDiscount?.valid && (
                <div className="text-zinc-400 text-sm space-y-2">
                  <p className="font-medium text-white">Need to activate immediately?</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a
                      href="https://wa.me/971565911000?text=Hi%2C%20I%20want%20to%20activate%20my%20Broker%20Toolkit%20subscription.%20Reference%3A%20"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      +971 56 591 1000
                    </a>
                    <a
                      href="mailto:invest@JJGlobalCapital.com"
                      className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      invest@JJGlobalCapital.com
                    </a>
                  </div>
                </div>
              )}

              <Button
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-gold via-gold to-gold-dark text-black py-6 text-lg hover:brightness-110 font-semibold"
              >
                <Crown className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
