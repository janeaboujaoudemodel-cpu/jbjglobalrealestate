import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PhoneInput, getPhoneValidation } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Gift, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MainLayout from "@/components/MainLayout";
import { JJLogoImage } from "@/components/JJLogoImage";
import { SEOHead } from "@/components/SEOHead";

const redeemSchema = z.object({
  referralCode: z.string()
    .min(3, "Please enter a valid referral code")
    .max(20, "Referral code is too long"),
  fullName: z.string()
    .min(2, "Full name is required")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .email("Please enter a valid email address")
    .max(255),
  phone: z.string()
    .min(1, "Phone number is required")
    .refine((val) => {
      const validation = getPhoneValidation(val);
      return validation.isValid;
    }, (val) => ({
      message: getPhoneValidation(val).message
    })),
  propertyInterest: z.string()
    .max(500, "Please keep your interest description under 500 characters")
    .optional(),
});

type RedeemFormData = z.infer<typeof redeemSchema>;

export default function RedeemReferral() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);

  const form = useForm<RedeemFormData>({
    resolver: zodResolver(redeemSchema),
    defaultValues: {
      referralCode: "",
      fullName: "",
      email: "",
      phone: "",
      propertyInterest: "",
    },
  });

  const onSubmit = async (data: RedeemFormData) => {
    setIsSubmitting(true);

    try {
      // First, verify the referral code exists
      const { data: partner, error: partnerError } = await supabase
        .from('referral_partners')
        .select('id, full_name, referral_code')
        .eq('referral_code', data.referralCode.toUpperCase().trim())
        .single();

      if (partnerError || !partner) {
        toast.error("Invalid referral code. Please check and try again.");
        setIsSubmitting(false);
        return;
      }

      // Record the code usage
      const { error: usageError } = await supabase
        .from('referral_code_usages')
        .insert({
          referral_code: data.referralCode.toUpperCase().trim(),
          referral_partner_id: partner.id,
          used_by_name: data.fullName,
          used_by_email: data.email,
          used_by_phone: data.phone,
          property_interest: data.propertyInterest || null,
          source: 'dedicated_page',
          status: 'pending',
        });

      if (usageError) {
        console.error('Usage error:', usageError);
        toast.error("Failed to submit. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setPartnerName(partner.full_name);
      setIsSuccess(true);
      toast.success("Referral code applied successfully!");
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <SEOHead
        title="Redeem Referral Code | JBJ Global Real Estate"
        description="Enter your referral code to unlock exclusive benefits when purchasing property with JBJ Global Real Estate."
      />
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] py-12 px-4">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <JJLogoImage variant="light" size="lg" className="w-32 h-32 mx-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              <span className="text-[#1A1A1A]">Redeem Your Referral Code</span>
            </h1>
            <p className="text-muted-foreground">
              Enter the referral code you received to unlock exclusive benefits
            </p>
          </div>

          <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/40 shadow-lg">
            <CardContent className="p-6 md:p-8">
              {isSuccess ? (
                /* Success State */
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Referral Code Applied! 🎉
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {partnerName ? (
                      <>You've been referred by <span className="font-semibold text-[#1A1A1A]">{partnerName}</span>.</>
                    ) : (
                      "Your referral code has been successfully applied."
                    )}
                  </p>
                  <div className="bg-muted/50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-muted-foreground">
                      Our team will contact you shortly to discuss your property interests and how we can help you.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsSuccess(false);
                      form.reset();
                    }}
                    className="w-full"
                  >
                    Submit Another Code
                  </Button>
                </div>
              ) : (
                /* Form */
                <>
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-[#EFE6D6]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Gift className="w-7 h-7 text-[#1A1A1A]" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Enter Your Details
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      We'll verify your referral and reach out to assist you
                    </p>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                      <FormField
                        control={form.control}
                        name="referralCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referral Code *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g., JJ-ABC123"
                                className="uppercase"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter your full name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="your@email.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number *</FormLabel>
                            <FormControl>
                              <PhoneInput
                                value={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="propertyInterest"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Interest (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Tell us about the property you're interested in..."
                                className="min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                        className="w-full"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Gift className="w-4 h-4 mr-2" />
                        )}
                        Apply Referral Code
                        {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                      </Button>
                    </form>
                  </Form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
