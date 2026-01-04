import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, CreditCard, Lock, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const JJ_HOLDING_URL = "https://jjholdinggroup.com";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export function PaymentModal({ open, onOpenChange, onSuccess, userInfo }: PaymentModalProps) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<"USD" | "AED">("USD");
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "paypal" | "crypto">("bank");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"info" | "payment" | "confirmation">("info");

  const price = currency === "USD" ? 100 : 367; // 1 USD ≈ 3.67 AED
  const currencySymbol = currency === "USD" ? "$" : "AED ";

  const bankDetails = {
    bankName: "Emirates NBD",
    accountName: "JJ Global Capital LLC",
    iban: "AE12 0260 0010 1234 5678 901",
    swift: "EABORAC1XXX",
    reference: `AIPF-${Date.now().toString(36).toUpperCase()}`,
  };

  const handleSubmitPayment = async () => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      return;
    }

    setIsProcessing(true);
    try {
      // Create pending membership
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { error } = await supabase.from("memberships").insert({
        user_id: user.id,
        email: userInfo.email,
        full_name: userInfo.fullName,
        phone: userInfo.phone,
        plan_type: "yearly",
        price_usd: 100,
        currency,
        status: "pending",
        payment_method: paymentMethod,
        payment_reference: bankDetails.reference,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      // Send confirmation email to company
      try {
        await supabase.functions.invoke("send-market-report-email", {
          body: {
            to: "invest@jjglobalcapital.com",
            subject: `New AI Property Finder Membership - ${userInfo.fullName}`,
            html: `
              <h2>New Membership Subscription</h2>
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-b from-purple-950 via-zinc-950 to-black border-purple-900/50 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        {paymentStep === "info" && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <DialogTitle className="text-2xl text-center">Unlock AI Property Finder</DialogTitle>
              <DialogDescription className="text-center text-zinc-400">
                Get 1-year access to our exclusive AI-powered property analysis
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Benefits */}
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 space-y-3">
                <h4 className="text-white font-semibold">What You Get:</h4>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>AI-powered property analysis based on government data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Detailed Excel comparison of top 3 recommended properties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Personalized recommendations based on your exact criteria</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Direct consultation with our expert advisors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span>Unlimited access for 12 months</span>
                  </li>
                </ul>
              </div>

              {/* Currency Selection */}
              <div className="space-y-3">
                <Label className="text-white">Select Currency</Label>
                <RadioGroup value={currency} onValueChange={(v) => setCurrency(v as "USD" | "AED")} className="flex gap-4">
                  <label className={`flex-1 cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${currency === "USD" ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="USD" className="sr-only" />
                    <div className="text-2xl font-bold text-white">$100</div>
                    <div className="text-sm text-zinc-400">USD / Year</div>
                  </label>
                  <label className={`flex-1 cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${currency === "AED" ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="AED" className="sr-only" />
                    <div className="text-2xl font-bold text-white">AED 367</div>
                    <div className="text-sm text-zinc-400">AED / Year</div>
                  </label>
                </RadioGroup>
              </div>

              <Button 
                onClick={() => setPaymentStep("payment")} 
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-6 text-lg hover:from-purple-500 hover:to-purple-700"
              >
                Continue to Payment
              </Button>

              <p className="text-purple-300/60 text-xs text-center">
                Software developed by <span className="text-white">Jane Abou Jaoude</span><br />
                Powered by <span className="text-white">JJ Global Capital</span> • Part of{" "}
                <a href={JJ_HOLDING_URL} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
                  JJ Holding Group
                </a>
              </p>
            </div>
          </>
        )}

        {paymentStep === "payment" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Complete Payment</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Total: {currencySymbol}{price} for 1 year access
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-white">Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "bank" | "paypal" | "crypto")} className="space-y-3">
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentMethod === "bank" ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="bank" className="text-purple-500" />
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="text-white font-medium">Bank Transfer</div>
                      <div className="text-xs text-zinc-400">Direct transfer to our bank account</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentMethod === "paypal" ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="paypal" className="text-purple-500" />
                    <div className="w-5 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">P</div>
                    <div>
                      <div className="text-white font-medium">PayPal</div>
                      <div className="text-xs text-zinc-400">Pay securely with PayPal</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all ${paymentMethod === "crypto" ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-600"}`}>
                    <RadioGroupItem value="crypto" className="text-purple-500" />
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
                    <Lock className="w-4 h-4 text-purple-400" />
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
                    <div className="flex justify-between bg-purple-500/10 p-2 rounded">
                      <span className="text-purple-300">Reference:</span>
                      <span className="text-white font-bold">{bankDetails.reference}</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500">Please include the reference number in your transfer</p>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-zinc-300 mb-2">Send payment to:</p>
                  <p className="text-white font-semibold">payments@jjglobalcapital.com</p>
                  <p className="text-xs text-zinc-500 mt-2">Reference: {bankDetails.reference}</p>
                </div>
              )}

              {paymentMethod === "crypto" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-zinc-300 mb-2">Contact us for crypto payment:</p>
                  <p className="text-white font-semibold">invest@jjglobalcapital.com</p>
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
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-500 hover:to-purple-700"
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
              <DialogTitle className="text-2xl">Payment Submitted!</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Thank you for subscribing to AI Property Finder
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4 text-center">
              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                <p className="text-zinc-300 text-sm mb-2">Your Reference Number:</p>
                <p className="text-white text-xl font-bold font-mono">{bankDetails.reference}</p>
              </div>

              <div className="text-zinc-400 text-sm space-y-2">
                <p>We will verify your payment within 24-48 hours.</p>
                <p>Once verified, you'll receive an email confirmation and full access to the AI Property Finder.</p>
              </div>

              <Button 
                onClick={handleComplete}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-6 text-lg hover:from-purple-500 hover:to-purple-700"
              >
                Continue to Results
              </Button>

              <p className="text-purple-300/60 text-xs">
                Questions? Contact <a href="mailto:invest@jjglobalcapital.com" className="text-white hover:underline">invest@jjglobalcapital.com</a>
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
