import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PhoneInput, getPhoneValidation } from "@/components/ui/phone-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { getLanguageList, LANGUAGE_FLAGS } from "@/constants/localeOptions";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { MessageCircle, Phone, Send, Loader2, CheckCircle, Clock, Calendar } from "lucide-react";

const ctaFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100),
  email: z.string().email("Please enter a valid Email address"),
  phone: z.string()
    .min(1, "Phone number is required")
    .refine((val) => {
      const validation = getPhoneValidation(val);
      return validation.isValid;
    }, (val) => ({
      message: getPhoneValidation(val).message
    })),
  language: z.string().min(1, "Please select your preferred language"),
  preferredTime: z.string().optional(),
  contactMethod: z.string().optional(),
  preferredDate: z.string().optional(),
  message: z.string().max(1000).optional(),
});

type CTAFormData = z.infer<typeof ctaFormSchema>;

interface CallToActionSectionProps {
  projectName: string;
  projectId?: string;
}

/**
 * CTA section matching Provident's "The best deals are our expertise – register now" section.
 * Includes callback form and WhatsApp button.
 */
export function CallToActionSection({ projectName, projectId }: CallToActionSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { captureLead } = useLeadCapture();
  const languageOptions = getLanguageList();

  const form = useForm<CTAFormData>({
    resolver: zodResolver(ctaFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      language: "",
      preferredTime: "",
      contactMethod: "",
      preferredDate: "",
      message: "",
    },
  });

  const onSubmit = async (data: CTAFormData) => {
    setIsSubmitting(true);
    try {
      await captureLead({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        language: data.language,
      }, `project-cta-${projectId || projectName}`, "client");

      setIsSuccess(true);
      toast.success("Your request has been submitted! We'll call you back shortly.");
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Something went wrong. Please try again or contact us via WhatsApp.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = `Hi, I'm interested in ${projectName}. Please share more details and call me back.`;

  return (
    <section className="py-16 md:py-20">
      <div className="jj-card-inner bg-gradient-to-br from-card via-card to-gold/5 border-2 border-gold/40 p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: Text content */}
          <div>
            <h2 className="text-h3 font-bold text-foreground mb-4">
              Request a Call Back Now
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              Partner with Dubai's leading real estate brokerage. Share your details, and our off-plan property expert will call you back shortly.
            </p>
            
            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <a href={getWhatsAppUrl(whatsappMessage)} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg" className="gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Chat with us now
                </Button>
              </a>
              <a href={`tel:${CONTACT_INFO.phone.replace(/\s/g, "")}`}>
                <Button variant="outline" size="lg" className="gap-2">
                  <Phone className="w-5 h-5" />
                  Call us now
                </Button>
              </a>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gold" />
                Licensed RERA Broker
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gold" />
                Trusted by 1000+ clients
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-gold" />
                Expert guidance
              </span>
            </div>
          </div>

          {/* Right: Form - FIXED: Champagne gradient, gold borders, no black */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/60 rounded-xl p-6 md:p-8 shadow-lg">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Thank You!</h3>
                <p className="text-zinc-600">We'll call you back shortly.</p>
                <Button 
                  onClick={() => setIsSuccess(false)}
                  variant="primary"
                  className="mt-4"
                >
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium">Full Name *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your full name" 
                            {...field}
                            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 focus:border-gold text-black rounded-lg"
                          />
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
                        <FormLabel className="text-black font-medium">Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="your@email.com" 
                            {...field}
                            className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 focus:border-gold text-black rounded-lg"
                          />
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
                        <FormLabel className="text-black font-medium">Phone *</FormLabel>
                        <FormControl>
                          <PhoneInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Your phone number"
                            variant="light"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium">Preferred Language *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 hover:border-gold focus:border-gold text-black rounded-lg h-12">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languageOptions.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                <span className="flex items-center gap-2">
                                  <span>{LANGUAGE_FLAGS[lang] || ""}</span>
                                  <span>{lang}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preferred Time to Call */}
                  <FormField
                    control={form.control}
                    name="preferredTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gold" />
                          Preferred Time to Call
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 hover:border-gold focus:border-gold text-black rounded-lg h-12">
                              <SelectValue placeholder="Select time slot" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">Morning (9AM - 12PM)</SelectItem>
                            <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                            <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                            <SelectItem value="anytime">Anytime</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preferred Contact Method */}
                  <FormField
                    control={form.control}
                    name="contactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium flex items-center gap-1.5">
                          <MessageCircle className="w-3.5 h-3.5 text-gold" />
                          Preferred Contact Method
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 hover:border-gold focus:border-gold text-black rounded-lg h-12">
                              <SelectValue placeholder="How should we contact you?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="phone">Phone Call</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="zoom">Video Call (Zoom)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-black font-medium">Message (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell us about your requirements..."
                            {...field}
                            className="min-h-[80px] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 focus:border-gold text-black rounded-lg"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    size="lg"
                    variant="primary"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Request a Call Back Now
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CallToActionSection;
