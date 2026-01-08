import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Lock, Shield, CheckCircle2, Sparkles, Crown, RefreshCw, Zap, Star, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  mode?: "vip" | "regenerate";
}

export function PaymentModal({ open, onOpenChange, onSuccess, userInfo, mode = "vip" }: PaymentModalProps) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<"USD" | "AED">("USD");
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "paypal" | "crypto">("bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"info" | "payment" | "confirmation">("info");

  const price = currency === "USD" ? 100 : 367;
  const currencySymbol = currency === "USD" ? "$" : "AED ";

  const bankDetails = {
    bankName: "Emirates NBD",
    accountName: "JBJ Global Real Estate L.L.C",
    iban: "AE12 0260 0010 1234 5678 901",
    swift: "EABORAC1XXX",
    reference: `AIVIP-${Date.now().toString(36).toUpperCase()}`,
  };

  const handleSubmitPayment = async () => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    setIsProcessing(true);
    try {
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { error } = await supabase.from("memberships").insert({
        user_id: user.id,
        email: userInfo.email,
        full_name: userInfo.fullName,
        phone: userInfo.phone,
        plan_type: "vip_yearly",
        price_usd: 100,
        currency,
        status: "pending",
        payment_method: paymentMethod,
        payment_reference: bankDetails.reference,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      try {
        await supabase.functions.invoke("send-market-report-email", {
          body: {
            to: "contact@jbj.ae",
            subject: `New VIP AI Package Subscription - ${userInfo.fullName}`,
            html: `
              <h2>New VIP AI Package Subscription</h2>
              <p><strong>Name:</strong> ${userInfo.fullName}</p>
              <p><strong>Email:</strong> ${userInfo.email}</p>
              <p><strong>Phone:</strong> ${userInfo.phone}</p>
              <p><strong>Amount:</strong> ${currencySymbol}${price}</p>
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Reference:</strong> ${bankDetails.reference}</p>
              <p><strong>Status:</strong> Pending Verification</p>
            `,
          },
        });
      } catch (emailError) {
        console.error("Email notification failed:", emailError);
      }

      setPaymentStep("confirmation");
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComplete = () => {
    onSuccess();
    onOpenChange(false);
    setPaymentStep("info");
  };

  const vipBenefits = [
    { icon: RefreshCw, text: "Unlimited AI Property Matchmaker regenerations" },
    { icon: FileSpreadsheet, text: "Unlimited AI Comparison Analysis reports" },
    { icon: Sparkles, text: "Priority access to new AI features" },
    { icon: Zap, text: "Instant AI-powered market insights" },
    { icon: Star, text: "VIP consultation with property experts" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-zinc-950 via-zinc-900 to-black border-gold/30 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        {paymentStep === "info" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold via-gold to-gold-dark flex items-center justify-center shadow-lg shadow-gold/30">
                  <Crown className="w-10 h-10 text-black" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-center">
                {mode === "regenerate" ? "Unlock Unlimited Regenerations" : "Upgrade to VIP Package"}
              </DialogTitle>
              <DialogDescription className="text-center text-zinc-400">
                Get unlimited access to all AI-powered property tools for 1 year
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* VIP Benefits */}
              <div className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-xl p-5 space-y-4">
                <h4 className="text-gold font-semibold flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  VIP Package Benefits
                </h4>
                <ul className="space-y-3">
                  {vipBenefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                      <benefit.icon className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span>{benefit.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Free vs VIP Comparison */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <p className="text-zinc-500 text-xs mb-2">Free Trial</p>
                  <p className="text-white font-semibold mb-2">One-Time Use</p>
                  <ul className="text-zinc-400 text-xs space-y-1">
                    <li>✓ 1 Property Match</li>
                    <li>✓ 1 AI Comparison</li>
                    <li className="text-zinc-600">✗ No regenerations</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-gold/20 to-gold/5 rounded-xl p-4 border border-gold/40">
                  <p className="text-gold text-xs mb-2">VIP Package</p>
                  <p className="text-white font-semibold mb-2">${price}/Year</p>
                  <ul className="text-zinc-300 text-xs space-y-1">
                    <li>✓ Unlimited Matches</li>
                    <li>✓ Unlimited Analysis</li>
                    <li>✓ Priority Support</li>
                  </ul>
                </div>
              </div>

              {/* Currency Selection */}
              <div className="space-y-3">
                <Label className="text-white">Select Currency</Label>
                <RadioGroup value={currency} onValueChange={(v) => setCurrency(v as "USD" | "AED")} className="flex gap-4">
                  <label className={`flex-1 cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${currency === "USD" ? "border-gold bg-gold/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="USD" className="sr-only" />
                    <div className="text-2xl font-bold text-white">$100</div>
                    <div className="text-sm text-zinc-400">USD / Year</div>
                  </label>
                  <label className={`flex-1 cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${currency === "AED" ? "border-gold bg-gold/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="AED" className="sr-only" />
                    <div className="text-2xl font-bold text-white">AED 367</div>
                    <div className="text-sm text-zinc-400">AED / Year</div>
                  </label>
                </RadioGroup>
              </div>

              <Button 
                onClick={() => setPaymentStep("payment")} 
                className="w-full bg-gradient-to-r from-gold via-gold to-gold-dark text-black py-6 text-lg hover:brightness-110 font-semibold"
              >
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to VIP
              </Button>

              <p className="text-zinc-500 text-xs text-center">
                Software developed by <span className="text-white">Jane Abou Jaoude</span><br />
                Powered by <span className="text-white">JBJ Global Real Estate</span>
              </p>
            </div>
          </>
        )}

        {paymentStep === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Crown className="w-5 h-5 text-gold" />
                Complete VIP Payment
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Total: {currencySymbol}{price} for 1 year VIP access
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-white">Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "bank" | "paypal" | "crypto")} className="space-y-3">
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentMethod === "bank" ? "border-gold bg-gold/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="bank" className="text-gold" />
                    <CreditCard className="w-5 h-5 text-gold" />
                    <div>
                      <div className="text-white font-medium">Bank Transfer</div>
                      <div className="text-xs text-zinc-400">Direct transfer to our bank</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentMethod === "paypal" ? "border-gold bg-gold/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="paypal" className="text-gold" />
                    <div className="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">P</div>
                    <div>
                      <div className="text-white font-medium">PayPal</div>
                      <div className="text-xs text-zinc-400">Pay securely with PayPal</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentMethod === "crypto" ? "border-gold bg-gold/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="crypto" className="text-gold" />
                    <div className="w-5 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">₿</div>
                    <div>
                      <div className="text-white font-medium">Cryptocurrency</div>
                      <div className="text-xs text-zinc-400">Bitcoin, Ethereum, USDT</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Bank Details */}
              {paymentMethod === "bank" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <h4 className="text-white font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gold" />
                    Bank Transfer Details
                  </h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Bank:</span>
                      <span className="text-white">{bankDetails.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Account Name:</span>
                      <span className="text-white">{bankDetails.accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">IBAN:</span>
                      <span className="text-white font-mono text-xs">{bankDetails.iban}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">SWIFT:</span>
                      <span className="text-white">{bankDetails.swift}</span>
                    </div>
                    <div className="flex justify-between bg-gold/10 p-2 rounded border border-gold/30">
                      <span className="text-gold">Reference:</span>
                      <span className="text-white font-bold">{bankDetails.reference}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">Please include the reference number in your transfer</p>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-zinc-300 mb-2">Send payment to:</p>
                  <p className="text-white font-semibold">contact@jbj.ae</p>
                  <p className="text-xs text-zinc-500 mt-2">Reference: {bankDetails.reference}</p>
                </div>
              )}

              {paymentMethod === "crypto" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-zinc-300 mb-2">Contact us for crypto payment:</p>
                  <p className="text-white font-semibold">contact@jbj.ae</p>
                  <p className="text-xs text-zinc-500 mt-2">Reference: {bankDetails.reference}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setPaymentStep("info")}
                  className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmitPayment}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-gold via-gold to-gold-dark text-black hover:brightness-110 font-semibold"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      I've Made the Payment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {paymentStep === "confirmation" && (
          <>
            <DialogHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl">VIP Payment Submitted!</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Welcome to the VIP AI Package
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 text-center">
              <div className="bg-gold/10 border border-gold/30 rounded-xl p-4">
                <p className="text-zinc-300 text-sm mb-2">Your Reference Number:</p>
                <p className="text-white text-xl font-bold font-mono">{bankDetails.reference}</p>
              </div>

              <div className="text-zinc-400 text-sm space-y-2">
                <p>We will verify your payment within 24-48 hours.</p>
                <p>Once verified, you'll have full VIP access to all AI tools with unlimited regenerations.</p>
              </div>

              <Button 
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-gold via-gold to-gold-dark text-black py-6 text-lg hover:brightness-110 font-semibold"
              >
                <Crown className="w-5 h-5 mr-2" />
                Continue
              </Button>

              <p className="text-zinc-500 text-xs">
                Questions? Contact <a href="mailto:contact@jjglobalcapital.com" className="text-gold hover:underline">contact@jjglobalcapital.com</a>
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
