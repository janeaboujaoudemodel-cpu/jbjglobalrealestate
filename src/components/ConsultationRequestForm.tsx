/**
 * ConsultationRequestForm - Properties Page Version
 * Enhanced with lead qualification fields: nationality, language, preferred time, contact method
 */

import { useMemo, useState } from "react";
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
import { getCountryList, getLanguageList, COUNTRY_FLAGS, LANGUAGE_FLAGS } from "@/constants/localeOptions";

const consultationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone number is required")
    .refine((val) => getPhoneValidation(val).isValid, (val) => ({
      message: getPhoneValidation(val).message
    })),
  serviceNeeded: z.string().min(1, "Please select a service"),
  bedrooms: z.string().optional(),
  sizeBucket: z.string().optional(),
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

const BEDROOM_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "1", label: "1 BR" },
  { value: "2", label: "2 BR" },
  { value: "3", label: "3 BR" },
  { value: "4", label: "4 BR" },
  { value: "5", label: "5 BR" },
  { value: "6", label: "6 BR" },
  { value: "7+", label: "7+ BR" },
];

const SIZE_BUCKETS = [
  { value: "any", label: "Any" },
  { value: "lt-800", label: "< 800 sqft" },
  { value: "800-1200", label: "800 – 1,200 sqft" },
  { value: "1200-1800", label: "1,200 – 1,800 sqft" },
  { value: "1800-2500", label: "1,800 – 2,500 sqft" },
  { value: "2500-plus", label: "2,500+ sqft" },
];

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
  const countryList = useMemo(() => getCountryList(), []);
  const languageList = useMemo(() => getLanguageList(), []);

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      serviceNeeded: "",
      bedrooms: "",
      sizeBucket: "any",
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
        message: data.message,
        context: {
          serviceNeeded: data.serviceNeeded,
          timeline: data.timeline,
          preferredTime: data.preferredTime,
          contactMethod: data.contactMethod,
          budgetRange: data.budgetRange,
          bedrooms: data.bedrooms,
          sizeBucket: data.sizeBucket,
          projectName,
          projectId,
        },
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

  // Clean field recipe — no boxed background, no thick frame.
  // The global gold-hairline lock in src/index.css paints rest/hover/focus borders.
  const selectTriggerClass = "h-12 bg-transparent rounded-lg text-[#1A1A1A]";
  const selectContentClass = "";
  const inputClass = "h-12 bg-transparent rounded-lg text-[#1A1A1A]";

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-2xl p-8 text-center max-w-2xl mx-auto ${className}`}
      >
        <div className="w-16 h-16 bg-[#EFE6D6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-[#1A1A1A]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Request Received!
        </h3>
        <p className="text-[#1A1A1A]/70">
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
        data-form-shell
        className={`jbj-form-shell bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/35 rounded-2xl p-5 sm:p-6 md:p-7 shadow-[0_18px_46px_rgba(184,149,85,0.16),0_2px_8px_rgba(0,0,0,0.06)] max-w-3xl mx-auto ${className}`}
      style={{ transform: 'perspective(1200px) rotateX(1deg)' }}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div data-emerald-action="true" className="jj-emerald-action inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs uppercase tracking-wider mb-3">
          <Calendar className="w-3 h-3" />
          Expert Consultation
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-[#1A1A1A]">
          {projectName ? (
            <>Register Interest in <span className="text-[#1A1A1A]">{projectName}</span></>
          ) : (
            title
          )}
        </h3>
        <p className="text-[#1A1A1A]/70 text-sm mt-2">{subtitle}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-form-shell>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Bedrooms — multi-select segmented pills */}
          <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => {
              const selected = (field.value || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const toggle = (v: string) => {
                const next = selected.includes(v)
                  ? selected.filter((x) => x !== v)
                  : [...selected, v];
                field.onChange(next.join(","));
              };
              return (
                <FormItem>
                  <p className="text-[#1A1A1A] text-sm font-medium mb-2">Bedrooms <span className="text-[#1A1A1A]/55 font-normal">(select one or more)</span></p>
              <div className="rounded-xl border border-[#B89555]/30 p-4 md:p-5 bg-[#FDFBF7]/35">
                    <div className="flex flex-wrap gap-2">
                      {BEDROOM_OPTIONS.map((b) => {
                        const active = selected.includes(b.value);
                        return (
                          <button
                            key={b.value}
                            type="button"
                            onClick={() => toggle(b.value)}
                            data-emerald-action={active ? "true" : undefined}
                            className={
                              active
                                ? "jj-emerald-action h-10 px-4 rounded-full text-sm font-medium border"
                                : "h-10 px-4 rounded-full text-sm font-medium bg-[#FDFBF7] text-[#1A1A1A]/80 border border-[#B89555]/40 hover:border-[#B89555] hover:bg-[#EFE6D6]/60"
                            }
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </FormItem>
              );
            }}
          />

          {/* Preferred Size — multi-select bucket pills */}
          <FormField
            control={form.control}
            name="sizeBucket"
            render={({ field }) => {
              const selected = (field.value || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              const toggle = (v: string) => {
                if (v === "any") {
                  field.onChange("any");
                  return;
                }
                const without = selected.filter((x) => x !== "any");
                const next = without.includes(v)
                  ? without.filter((x) => x !== v)
                  : [...without, v];
                field.onChange(next.length ? next.join(",") : "any");
              };
              return (
                <FormItem>
                  <p className="text-[#1A1A1A] text-sm font-medium mb-2">Preferred Size <span className="text-[#1A1A1A]/55 font-normal">(select one or more)</span></p>
                  <div className="rounded-xl border border-[#B89555]/30 p-4 md:p-5 bg-[#FDFBF7]/35">
                    <div className="flex flex-wrap gap-2">
                      {SIZE_BUCKETS.map((b) => {
                        const active =
                          (b.value === "any" && (!selected.length || selected.includes("any"))) ||
                          selected.includes(b.value);
                        return (
                          <button
                            key={b.value}
                            type="button"
                            onClick={() => toggle(b.value)}
                            data-emerald-action={active ? "true" : undefined}
                            className={
                              active
                                ? "jj-emerald-action h-10 px-4 rounded-full text-sm font-medium border"
                                : "h-10 px-4 rounded-full text-sm font-medium bg-[#FDFBF7] text-[#1A1A1A]/80 border border-[#B89555]/40 hover:border-[#B89555] hover:bg-[#EFE6D6]/60"
                            }
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[#1A1A1A]/60 text-xs mt-2">Optional — helps us match you to the right unit mix.</p>
                </FormItem>
              );
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <SelectContent className={`${selectContentClass} max-h-[300px] overflow-y-auto`}>
                      {countryList.map((n) => (
                        <SelectItem key={n} value={n}>{COUNTRY_FLAGS[n] ? `${COUNTRY_FLAGS[n]} ${n}` : n}</SelectItem>
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
                    <SelectContent className={`${selectContentClass} max-h-[300px] overflow-y-auto`}>
                      {languageList.map((l) => (
                        <SelectItem key={l} value={l}>{LANGUAGE_FLAGS[l] ? `${LANGUAGE_FLAGS[l]} ${l}` : l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="min-h-[80px] bg-transparent text-[#1A1A1A] resize-none rounded-lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3 border-t border-[#B89555]/20">
            <FormField
              control={form.control}
              name="agreeTerms"
              render={({ field }) => (
                <FormItem className="form-checkbox-row flex items-start gap-3 space-y-0 flex-1 min-w-0 pr-1">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    className="mt-0.5"
                    data-no-contrast-guard
                    />
                  </FormControl>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[#1A1A1A] text-sm leading-tight font-normal">
                      I agree to the <a href="/terms" className="text-[#1A1A1A] underline">Terms</a> and <a href="/privacy" className="text-[#1A1A1A] underline">Privacy Policy</a> *
                    </p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              data-emerald-action="true"
              className="jj-emerald-action h-14 px-8 text-base font-bold inline-flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto rounded-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <span>Request Consultation</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
};

export default ConsultationRequestForm;
