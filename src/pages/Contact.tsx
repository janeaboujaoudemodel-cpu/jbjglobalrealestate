import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Phone, Mail, Calendar, ArrowUpRight, MessageCircle, Send, Loader2, Shield, CheckCircle, ExternalLink, Download, Share2, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PhoneInput, getPhoneValidation } from "@/components/ui/phone-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl, getEmailUrl } from "@/constants/stats";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLeadCapture } from "@/hooks/useLeadCapture";
import { getCountryList, getLanguageList } from "@/constants/localeOptions";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Link } from "react-router-dom";
import { CalendlyEmbed } from "@/components/marketing/CalendlyEmbed";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { MeetingBookingModal } from "@/components/MeetingBookingModal";
import SupportTicketBox from "@/components/SupportTicketBox";
import contactHeroVideo from "@/assets/videos/services-hero.mp4";

const consultationSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address").max(255),
  phone: z.string()
    .min(1, "Phone number is required")
    .refine((val) => {
      const validation = getPhoneValidation(val);
      return validation.isValid;
    }, (val) => ({
      message: getPhoneValidation(val).message
    })),
  nationality: z.string().min(1, "Please select your nationality"),
  language: z.string().min(1, "Please select your preferred language"),
  currentLocation: z.string().min(2, "Please enter your current location").max(100),
  serviceNeeded: z.string().min(1, "Please select a service"),
  budgetRange: z.string().optional(),
  timeline: z.string().optional(),
  referralCode: z.string().max(20).optional(),
  message: z.string().max(1000, "Message must be less than 1000 characters").optional(),
  confirmAccurate: z.boolean().refine((val) => val === true, {
    message: "Please confirm the information is accurate",
  }),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms of Service and Privacy Policy",
  }),
  marketingConsent: z.boolean().optional(),
});

type ConsultationFormData = z.infer<typeof consultationSchema>;

const SERVICE_OPTIONS = [
  { value: "buy-sell", label: "Buy / Sell Brokerage" },
  { value: "rent", label: "Rent Brokerage" },
  { value: "holiday-homes", label: "Holiday Homes (Short-Term)" },
  { value: "partner-mortgage", label: "Partner Introduction: Mortgage" },
  { value: "partner-legal", label: "Partner Introduction: Legal" },
  { value: "partner-concierge", label: "Partner Introduction: Concierge" },
];

const BUDGET_OPTIONS = [
  { value: "under-1m", label: "Under AED 1 Million" },
  { value: "1m-3m", label: "AED 1 - 3 Million" },
  { value: "3m-5m", label: "AED 3 - 5 Million" },
  { value: "5m-10m", label: "AED 5 - 10 Million" },
  { value: "10m-25m", label: "AED 10 - 25 Million" },
  { value: "over-25m", label: "Over AED 25 Million" },
  { value: "prefer-not", label: "Prefer Not to Say" },
];

const TIMELINE_OPTIONS = [
  { value: "immediate", label: "Immediate (Within 1 Month)" },
  { value: "1-3-months", label: "1 - 3 Months" },
  { value: "3-6-months", label: "3 - 6 Months" },
  { value: "6-12-months", label: "6 - 12 Months" },
  { value: "over-12", label: "Over 12 Months" },
  { value: "just-exploring", label: "Just Exploring" },
];

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { t } = useLanguage();
  const { captureLead } = useLeadCapture();
  
  const countries = getCountryList();
  const languages = getLanguageList();

  const form = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      nationality: "",
      language: "",
      currentLocation: "",
      serviceNeeded: "",
      budgetRange: "",
      timeline: "",
      referralCode: "",
      message: "",
      confirmAccurate: false,
      agreeTerms: false,
      marketingConsent: false,
    },
  });

  const onSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);
    try {
      // 1) Capture lead - saves to BOTH leads AND crm_leads tables (CRITICAL)
      const leadCaptured = await captureLead({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        nationality: data.nationality,
        language: data.language,
        currentLocation: data.currentLocation,
      }, "contact-consultation", "client");

      if (!leadCaptured) {
        throw new Error('Lead capture failed');
      }

      // 2) If referral code provided, record the usage
      if (data.referralCode && data.referralCode.trim()) {
        try {
          // Find the partner by code
          const { data: partner } = await supabase
            .from('referral_partners')
            .select('id')
            .eq('referral_code', data.referralCode.toUpperCase().trim())
            .single();

          // Record usage even if partner not found (for tracking attempts)
          await supabase
            .from('referral_code_usages')
            .insert({
              referral_code: data.referralCode.toUpperCase().trim(),
              referral_partner_id: partner?.id || null,
              used_by_name: data.fullName,
              used_by_email: data.email,
              used_by_phone: data.phone,
              property_interest: data.serviceNeeded,
              source: 'contact_form',
              status: 'pending',
            });
        } catch (refErr) {
          console.warn('Referral code tracking failed:', refErr);
        }
      }

      // 3) Best-effort admin notification (must NOT block user submission)
      try {
        await supabase.functions.invoke("send-inquiry-email", {
          body: {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            nationality: data.nationality,
            language: data.language,
            source: "contact-consultation",
            context: {
              currentLocation: data.currentLocation,
              serviceNeeded: data.serviceNeeded,
              budgetRange: data.budgetRange || "Not specified",
              timeline: data.timeline || "Not specified",
              marketingConsent: data.marketingConsent ? "Yes" : "No",
              referralCode: data.referralCode || "None",
            },
            message: data.message,
          },
        });
      } catch (notifyErr) {
        console.warn('Admin notification failed (lead still saved):', notifyErr);
      }

      setIsSuccess(true);
      toast.success("Your inquiry has been submitted successfully!");
      form.reset();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("We're sorry, there was a temporary issue. Please try again or contact us via WhatsApp or email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [phoneActionsOpen, setPhoneActionsOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  const handlePhoneAction = (action: string) => {
    const phoneNumber = CONTACT_INFO.phone.replace(/\s/g, '');
    switch(action) {
      case 'call':
        window.location.href = `tel:${phoneNumber}`;
        break;
      case 'whatsapp':
        window.open(getWhatsAppUrl(), '_blank', 'noopener,noreferrer');
        break;
      case 'save':
        // Create vCard
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:JBJ Global Real Estate
TEL:${phoneNumber}
EMAIL:${CONTACT_INFO.email}
ORG:JBJ Global Real Estate
END:VCARD`;
        const blob = new Blob([vcard], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'JBJ-Global-Real-Estate.vcf';
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Contact saved!");
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: 'JBJ Global Real Estate',
            text: `Contact JBJ Global Real Estate: ${phoneNumber}`,
            url: window.location.href,
          });
        } else {
          navigator.clipboard.writeText(phoneNumber);
          toast.success("Phone number copied!");
        }
        break;
    }
    setPhoneActionsOpen(false);
  };

  const contactCards = [
    {
      icon: MapPin,
      title: "Location",
      value: "Dubai, United Arab Emirates",
      action: null,
      iconColor: "text-gold",
      titleColor: "text-black",
      valueColor: "text-gold",
      clickable: false,
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+971-5659-11000",
      action: 'phone-actions',
      iconColor: "text-gold",
      titleColor: "text-black",
      valueColor: "text-gold hover:underline",
      clickable: true,
    },
    {
      icon: Mail,
      title: "Email",
      value: CONTACT_INFO.email,
      action: getEmailUrl(),
      iconColor: "text-gold",
      titleColor: "text-black",
      valueColor: "text-gold hover:underline",
      clickable: true,
    },
    {
      icon: Calendar,
      title: "Business Hours",
      value: "Mon–Sun | 9AM–9PM UAE",
      action: null,
      iconColor: "text-gold",
      titleColor: "text-black",
      valueColor: "text-gold",
      clickable: false,
    },
  ];

  return (
    <>
      <SEOHead {...pagesSEO.contact} />
      <div className="min-h-screen bg-black">
      {/* Hero Section with Video */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover"
          >
            <source src={contactHeroVideo} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black" />
        </div>
        <div className="relative container mx-auto px-4">
          <p className="text-gold text-sm uppercase tracking-[0.2em] mb-4">Real Estate Brokerage</p>
          <h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Contact JBJ Global Real Estate
          </h1>
          <p className="text-white text-xl md:text-2xl font-medium max-w-3xl leading-relaxed mb-4">
            Professional Support. Clear Communication. Trusted Guidance.
          </p>
          <p className="text-zinc-300 text-base md:text-lg max-w-3xl leading-relaxed">
            Whether you are an investor, property owner, broker, or partner, our team is here to support you with accurate information, structured guidance, and accountable follow-up. Choose the option below that best fits your request.
          </p>
        </div>
      </section>

      {/* Contact Cards - 3-Layer System with thin black contour */}
      <section className="py-10 bg-black">
        {/* Thin black contour + Active Champagne Layer */}
        <div className="mx-3 md:mx-4 lg:mx-6 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-3">
          {/* Inner Champagne Layer */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-10 shadow-[0_0_15px_rgba(200,167,102,0.22)]">
            <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {contactCards.map((card) => (
                <div
                  key={card.title}
                  onClick={() => {
                    if (card.action === "phone-actions") setPhoneActionsOpen(true);
                    else if (card.action === "meeting") setMeetingModalOpen(true);
                    else if (card.action && card.clickable) window.location.href = card.action;
                  }}
                  className={`group bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-xl p-5 transition-all duration-300 hover:border-black hover:shadow-[0_0_25px_rgba(200,167,102,0.28),0_18px_50px_rgba(0,0,0,0.35)] hover:-translate-y-1 hover:scale-[1.02] ${card.clickable ? "cursor-pointer" : ""}`}
                >
                  <div className="w-10 h-10 bg-transparent border-2 border-gold/50 rounded-lg flex items-center justify-center mb-3 transition-all duration-300 group-hover:border-black group-hover:bg-gold/10 group-hover:scale-110">
                    <card.icon className="w-5 h-5 text-gold transition-all duration-300 group-hover:text-black" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1 text-black transition-colors">{card.title}</h3>
                  <p className="text-sm text-gold transition-colors group-hover:text-black/80">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Form Section - Form IS the 3rd layer (directly on active champagne, no extra pearl wrapper) */}
      <section className="py-16 md:py-20 bg-black">
        {/* Thin black contour + Active Champagne Layer */}
        <div className="mx-3 md:mx-4 lg:mx-6 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-4 md:p-6">
          {/* Form IS the 3rd layer - champagne pearl styling */}
          <div className="max-w-3xl mx-auto">
            {isSuccess ? (
              /* Success State */
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-2xl p-8 md:p-12 text-center shadow-[0_8px_30px_rgba(200,167,102,0.35)]">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Thank You for Your Inquiry
                </h2>
                <p className="text-zinc-600 text-lg mb-6">
                  We have received your consultation request and will be in touch soon.
                </p>
                <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-xl p-6 text-left max-w-md mx-auto">
                  <h3 className="text-gold font-semibold mb-3 text-sm uppercase tracking-wider">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-black"><span className="text-zinc-600">Phone:</span> {CONTACT_INFO.phone}</p>
                    <p className="text-black"><span className="text-zinc-600">Email:</span> {CONTACT_INFO.email}</p>
                    <p className="text-black"><span className="text-zinc-600">WhatsApp:</span> {CONTACT_INFO.phone}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsSuccess(false)}
                  variant="primary"
                  className="mt-8 px-8"
                >
                  Submit Another Inquiry
                </Button>
              </div>
            ) : (
              /* Form */
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-2xl p-6 md:p-10 shadow-[0_8px_30px_rgba(200,167,102,0.35),0_4px_15px_rgba(0,0,0,0.15)]">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-7 h-7 text-gold" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Request a Consultation
                  </h2>
                  <p className="text-zinc-600 text-sm">
                    If you would like to speak with our team regarding buying, selling, renting, investment guidance, market intelligence, or partner introductions, request a consultation through this form. Consultations focus on real estate brokerage guidance and structured introductions within our licensed scope.
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                        <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black text-sm font-medium">Full Name *</FormLabel>
                            <FormControl>
                               <Input 
                                {...field} 
                                className="h-12 border-2 border-gold/40 hover:border-gold focus:border-gold rounded-lg"
                                placeholder="John Doe"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-black text-sm font-medium">Email Address *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email"
                                className="h-12 border-2 border-gold/40 hover:border-gold focus:border-gold rounded-lg"
                                  placeholder="email@example.com"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => {
                            const phoneValue = field.value;
                            const cleanPhone = phoneValue.replace(/[^0-9+]/g, '');
                            const hasValidPhone = cleanPhone.length >= 8;
                            const whatsappUrl = hasValidPhone 
                              ? `https://wa.me/${cleanPhone.replace('+', '')}` 
                              : null;
                            
                            return (
                              <FormItem>
                                <FormLabel className="text-zinc-700 text-sm font-medium">Phone Number *</FormLabel>
                                <div className="flex gap-2">
                                  <FormControl>
                                    <PhoneInput
                                      value={field.value}
                                      onChange={field.onChange}
                                    />
                                  </FormControl>
                                  {whatsappUrl && (
                                    <a
                                      href={whatsappUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-shrink-0 h-12 px-3 bg-green-600 hover:bg-green-500 text-white rounded-md flex items-center justify-center transition-colors"
                                      title="Chat on WhatsApp"
                                    >
                                      <MessageCircle className="w-5 h-5 text-white" />
                                    </a>
                                  )}
                                </div>
                                <FormMessage className="text-red-500 text-xs" />
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="nationality"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-700 text-sm font-medium">Nationality *</FormLabel>
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
                              <FormMessage className="text-red-500 text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="language"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-700 text-sm font-medium">Preferred Language *</FormLabel>
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
                              <FormMessage className="text-red-500 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="currentLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-700 text-sm font-medium">Current Location (Country & City) *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="h-12 border-2 border-gold/40 hover:border-gold focus:border-gold rounded-lg"
                                placeholder="e.g., Dubai, UAE or London, UK"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Service Selection */}
                    <div className="h-px bg-zinc-200 my-6" />
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="serviceNeeded"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-700 text-sm font-medium">Service Needed *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 border-gold/40 hover:border-gold focus:border-gold rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black">
                                   <SelectValue placeholder="Select a service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SERVICE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value} className="text-black hover:bg-zinc-100">
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="budgetRange"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-700 text-sm font-medium">Budget Range (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                   <SelectTrigger className="h-12 border-2 border-gold/40 hover:border-gold focus:border-gold rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black">
                                     <SelectValue placeholder="Select budget" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BUDGET_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="text-black hover:bg-zinc-100">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="timeline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-700 text-sm font-medium">Timeline (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                   <SelectTrigger className="h-12 border-2 border-gold/40 hover:border-gold focus:border-gold rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black">
                                     <SelectValue placeholder="Select timeline" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIMELINE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="text-black hover:bg-zinc-100">
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Referral Code */}
                      <FormField
                        control={form.control}
                        name="referralCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-700 text-sm font-medium">Referral Code (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="h-12 border-2 border-gold/40 hover:border-gold focus:border-gold rounded-lg uppercase"
                                placeholder="e.g., JJ-ABC123"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground mt-1">
                              If you were referred by a partner, enter their code here
                            </p>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-700 text-sm font-medium">Additional Message (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="min-h-[100px] border-2 border-gold/40 hover:border-gold focus:border-gold resize-none rounded-lg"
                                placeholder="Tell us more about your requirements..."
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="h-px bg-zinc-200 my-6" />

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="confirmAccurate"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                                className="border-zinc-400 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-zinc-700 text-sm font-normal cursor-pointer">
                                I confirm the information provided is accurate. *
                              </FormLabel>
                              <FormMessage className="text-red-500 text-xs" />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="agreeTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                                className="border-zinc-400 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-zinc-700 text-sm font-normal cursor-pointer">
                                I agree to the{" "}
                                <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>
                                {" "}and{" "}
                                <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>. *
                              </FormLabel>
                              <FormMessage className="text-red-500 text-xs" />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="marketingConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox 
                                checked={field.value} 
                                onCheckedChange={field.onChange}
                                className="border-zinc-400 data-[state=checked]:bg-gold data-[state=checked]:border-gold mt-0.5"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-zinc-700 text-sm font-normal cursor-pointer">
                                I would like to receive updates and market insights. (Optional)
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Submit Button - 3D Premium Primary Style */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative w-full inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
                        border: '2px solid rgba(200,167,102,0.5)',
                        boxShadow: `
                          0 10px 30px rgba(200,167,102,0.4),
                          0 6px 15px rgba(0,0,0,0.2),
                          inset 0 2px 4px rgba(255,255,255,0.9),
                          inset 0 -2px 4px rgba(200,167,102,0.2),
                          0 0 20px rgba(200,167,102,0.3)
                        `,
                      }}
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                      <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                      <span className="relative flex items-center justify-center gap-2">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 text-gold animate-spin" />
                            <span className="text-gold">Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                            <span className="text-black group-hover:text-gold transition-colors">Start Your</span>
                            <span className="text-gold group-hover:text-black transition-colors">Inquiry</span>
                          </>
                        )}
                      </span>
                    </button>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Support Ticket Section - Above "Prefer to Reach Us Directly" */}
      <SupportTicketBox />

      {/* Direct Contact CTAs - "Prefer to Reach Us Directly" - Cards ARE the 3rd layer (on active champagne) */}
      {/* Direct Contact Section */}
      <section className="py-12 bg-black">
        {/* Thin black contour + Active Champagne Layer */}
        <div className="mx-3 md:mx-4 lg:mx-6 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-6 md:p-8">
          <h2 className="text-center text-2xl md:text-3xl font-bold mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
            <span className="text-black">Prefer to Reach Us</span>{" "}
            <span className="text-gold">Directly?</span>
          </h2>
          <p className="text-center text-zinc-600 text-sm mb-6 max-w-2xl mx-auto">
            For general inquiries, consultations, or non-technical requests, you may contact us through the channels below.
          </p>
          {/* Cards are the 3rd layer - champagne pearl styling */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* WhatsApp CTA */}
            <a 
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-xl p-5 transition-all group hover:shadow-lg hover:shadow-gold/30 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-green-500/30">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-black font-semibold mb-0.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                  WhatsApp
                </h3>
                <p className="text-gold text-sm">+971-5659-11000</p>
              </div>
            </a>

            {/* Call CTA */}
            <a 
              href={getCallUrl()}
              className="flex items-center gap-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold rounded-xl p-5 transition-all group hover:shadow-lg hover:shadow-gold/30 hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-black font-semibold mb-0.5" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Call Us
                </h3>
                <p className="text-gold text-sm">+971-5659-11000</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Important Notice - 3-Layer System */}
      <section className="py-10 bg-black">
        {/* Thin black contour + Active Champagne Layer */}
        <div className="mx-3 md:mx-4 lg:mx-6 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-3">
          {/* Inner Pearl Layer */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-8 shadow-[0_0_15px_rgba(200,167,102,0.22)]">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-gold" />
                </div>
                <h3 className="text-black font-semibold text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
                  <span className="text-gold">Important</span> Notice
                </h3>
              </div>
              
              <p className="text-zinc-700 text-sm leading-relaxed">
                JBJ Global Real Estate is a licensed real estate brokerage in Dubai for buying, selling, and renting properties. We do not provide legal, mortgage, or immigration services directly. Where required, we may introduce independent, licensed partners. Any engagement with partner services is contracted directly between the client and the partner under the partner's own licence and terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Appointments Section - 3-Layer System */}
      <section className="py-10 bg-black">
        {/* Thin black contour + Active Champagne Layer */}
        <div className="mx-3 md:mx-4 lg:mx-6 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-3">
          {/* Inner Pearl Layer */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-8 shadow-[0_0_15px_rgba(200,167,102,0.22)]">
            <div className="max-w-3xl mx-auto text-center">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-black font-semibold text-lg mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                Appointments
              </h3>
              <p className="text-zinc-700 text-sm leading-relaxed">
                If an in-person meeting is required, availability is confirmed by appointment only after initial contact or ticket submission.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing Statement - 3-Layer System */}
      <section className="py-10 bg-black">
        {/* Thin black contour + Active Champagne Layer */}
        <div className="mx-3 md:mx-4 lg:mx-6 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark rounded-2xl border border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.18)] p-3">
          {/* Inner Pearl Layer */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-6 md:p-8 shadow-[0_0_15px_rgba(200,167,102,0.22)]">
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-zinc-700 text-base leading-relaxed">
                At JBJ Global Real Estate, communication is handled with structure, discretion, and accountability. We look forward to assisting you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Phone Actions Dialog */}
      <Dialog open={phoneActionsOpen} onOpenChange={setPhoneActionsOpen}>
        <DialogContent className="max-w-sm bg-white border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-black text-lg font-semibold">Contact Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Button 
              onClick={() => handlePhoneAction('call')}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white justify-start gap-3"
            >
              <PhoneCall className="w-5 h-5" />
              Call Now
            </Button>
            <Button 
              onClick={() => handlePhoneAction('whatsapp')}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white justify-start gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </Button>
            <Button 
              onClick={() => handlePhoneAction('save')}
              variant="outline"
              className="w-full h-12 border-zinc-300 text-zinc-700 hover:bg-zinc-50 justify-start gap-3"
            >
              <Download className="w-5 h-5" />
              Save Contact
            </Button>
            <Button 
              onClick={() => handlePhoneAction('share')}
              variant="outline"
              className="w-full h-12 border-zinc-300 text-zinc-700 hover:bg-zinc-50 justify-start gap-3"
            >
              <Share2 className="w-5 h-5" />
              Share Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meeting Booking Modal */}
      <MeetingBookingModal 
        open={meetingModalOpen} 
        onOpenChange={setMeetingModalOpen} 
      />

      </div>
    </>
  );
};

export default Contact;
