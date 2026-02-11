/**
 * ConsultationRequestForm - Properties Page Version
 * Enhanced with lead qualification fields: nationality, language, preferred time, contact method
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { PhoneInput, getPhoneValidation } from "@/components/ui/phone-input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLeadCapture } from "@/hooks/useLeadCapture";

const consultationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone number is required")
    .refine((val) => getPhoneValidation(val).isValid, (val) => ({
      message: getPhoneValidation(val).message
    })),
  serviceNeeded: z.string().min(1, "Please select a service"),
  nationality: z.string().optional(),
  preferredLanguage: z.string().optional(),
  preferredTime: z.string().optional(),
  contactMethod: z.string().optional(),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
  message: z.string().max(500).optional(),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms of Service and Privacy Policy",
  }),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

const SERVICE_OPTIONS = [
  { value: "buy", label: "Buy Property" },
  { value: "sell", label: "Sell Property" },
  { value: "rent", label: "Rent Property" },
  { value: "invest", label: "Investment Advisory" },
  { value: "golden-visa", label: "Golden Visa Consultation" },
  { value: "other", label: "Other Inquiry" },
];

const TIMELINE_OPTIONS = [
  { value: "immediate", label: "Immediately" },
  { value: "1-3-months", label: "1 - 3 Months" },
  { value: "3-6-months", label: "3 - 6 Months" },
  { value: "6-12-months", label: "6 - 12 Months" },
  { value: "just-exploring", label: "Just Exploring" },
];

const NATIONALITIES = [
  "UAE", "India", "Pakistan", "United Kingdom", "Russia", "China",
  "Philippines", "Egypt", "Jordan", "Lebanon", "Saudi Arabia",
  "Iran", "Germany", "France", "Canada", "United States",
  "Australia", "South Africa", "Nigeria", "Brazil", "Other",
];

const LANGUAGES = [
  "English", "Arabic", "Hindi", "Russian", "Chinese", "French",
  "Urdu", "Tagalog", "German", "Spanish", "Other",
];

const CONTACT_TIMES = [
  "Morning (9AM-12PM)", "Afternoon (12PM-5PM)", "Evening (5PM-9PM)", "Anytime",
];

const CONTACT_METHODS = [
  "Phone Call", "WhatsApp", "Email", "Video Call",
];

const BUDGET_RANGES = [
  "Under AED 500K", "AED 500K - 1M", "AED 1M - 2M", "AED 2M - 5M",
  "AED 5M - 10M", "AED 10M+",
];

interface ConsultationRequestFormProps {
  className?: string;
  title?: string;
  subtitle?: string;
  projectId?: string;
  projectName?: string;
}

export const ConsultationRequestForm = ({
  className = "",
  title = "Request a Consultation",
  subtitle = "Connect with our expert team for personalized guidance on your property journey.",
  projectId,
  projectName,
}: ConsultationRequestFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { captureLead } = useLeadCapture();

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      serviceNeeded: "",
      nationality: "",
      preferredLanguage: "",
      preferredTime: "",
      contactMethod: "",
      budgetRange: "",
      timeline: "",
      message: "",
      agreeTerms: false,
    },
  });

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);
    try {
      const source = projectId 
        ? `project-interest-${projectId}` 
        : "properties-consultation";

      const leadCaptured = await captureLead({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        nationality: data.nationality,
        language: data.preferredLanguage,
      }, source, "client");

      if (!leadCaptured) {
        throw new Error('Lead capture failed');
      }

      try {
        await supabase.functions.invoke("send-inquiry-email", {
          body: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            source: source,
            context: {
              serviceNeeded: data.serviceNeeded,
              timeline: data.timeline || "Not specified",
              nationality: data.nationality || "Not specified",
              preferredLanguage: data.preferredLanguage || "Not specified",
              preferredTime: data.preferredTime || "Not specified",
              contactMethod: data.contactMethod || "Not specified",
              budgetRange: data.budgetRange || "Not specified",
              projectName: projectName || undefined,
              projectId: projectId || undefined,
            },
            message: data.message,
          },
        });
      } catch (err) {
        console.warn('Notification failed:', err);
      }

      setIsSuccess(true);
      toast.success("Consultation request submitted successfully!");
      form.reset();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectTriggerClass = "h-12 bg-white border-2 border-gold/50 hover:border-gold focus:border-gold rounded-lg";
  const selectContentClass = "bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50";
  const inputClass = "h-12 bg-white border-2 border-gold/50 hover:border-gold focus:border-gold text-black rounded-lg";

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-2xl p-8 text-center max-w-xl mx-auto ${className}`}
      >
        <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-gold" />
        </div>
        <h3 className="text-xl font-semibold text-black mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
          Request Received!
        </h3>
        <p className="text-zinc-600">
          Our team will reach out within 24 hours to schedule your consultation.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(200,167,102,0.35)] max-w-xl mx-auto ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-xs uppercase tracking-wider text-gold mb-3">
          <Calendar className="w-3 h-3" />
          Expert Consultation
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
          {projectName ? (
            <>Register Interest in <span className="text-gold">{projectName}</span></>
          ) : (
            title
          )}
        </h3>
        <p className="text-zinc-600 text-sm mt-2">{subtitle}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Full Name *" {...field} className={inputClass} />
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
                <FormControl>
                  <Input type="email" placeholder="Email Address *" {...field} className={inputClass} />
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
                <FormControl>
                  <PhoneInput
                    placeholder="Phone Number *"
                    value={field.value}
                    onChange={field.onChange}
                    variant="light"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="serviceNeeded"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Service Needed *" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {SERVICE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeline"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Timeline" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {TIMELINE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="nationality"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Nationality" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {NATIONALITIES.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredLanguage"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Preferred Language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="preferredTime"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Preferred Time" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {CONTACT_TIMES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactMethod"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectTriggerClass}>
                        <SelectValue placeholder="Contact Method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={selectContentClass}>
                      {CONTACT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="budgetRange"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className={selectTriggerClass}>
                      <SelectValue placeholder="Budget Range (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={selectContentClass}>
                    {BUDGET_RANGES.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Additional details (optional)"
                    {...field}
                    className="min-h-[80px] bg-white border-2 border-gold/50 hover:border-gold focus:border-gold text-black resize-none rounded-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeTerms"
            render={({ field }) => (
              <FormItem className="flex items-start gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="border-gold/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
                  />
                </FormControl>
                <p className="text-black text-sm leading-tight font-normal">
                  I agree to the <a href="/terms" className="text-gold underline">Terms</a> and <a href="/privacy" className="text-gold underline">Privacy Policy</a> *
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-base font-bold relative overflow-hidden group"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
              border: '2px solid rgba(200,167,102,0.6)',
              boxShadow: '0 10px 30px rgba(200,167,102,0.4)',
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 text-black">
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-black group-hover:text-gold transition-colors">Request</span>
                <span className="text-gold group-hover:text-black transition-colors">Consultation</span>
                <Send className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
              </span>
            )}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
};

export default ConsultationRequestForm;
