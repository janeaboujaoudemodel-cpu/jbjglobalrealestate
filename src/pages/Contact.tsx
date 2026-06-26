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

import SupportTicketBox from "@/components/SupportTicketBox";
import { IconTile } from "@/components/ui/icon-tile";
import contactHeroVideoAsset from "@/assets/videos/services-hero.mp4.asset.json";
const contactHeroVideo = contactHeroVideoAsset.url;
import VideoBackground from "@/components/VideoBackground";

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
      iconColor: "text-[#1A1A1A]",
      titleColor: "text-[#1A1A1A]",
      valueColor: "text-[#1A1A1A]",
      clickable: false,
    },
    {
      icon: Phone,
      title: "Phone",
      value: "+971-5659-11000",
      action: 'phone-actions',
      iconColor: "text-[#1A1A1A]",
      titleColor: "text-[#1A1A1A]",
      valueColor: "text-[#1A1A1A] hover:underline",
      clickable: true,
    },
    {
      icon: Mail,
      title: "Email",
      value: CONTACT_INFO.email,
      action: getEmailUrl(),
      iconColor: "text-[#1A1A1A]",
      titleColor: "text-[#1A1A1A]",
      valueColor: "text-[#1A1A1A] hover:underline",
      clickable: true,
    },
    {
      icon: Calendar,
      title: "Business Hours",
      value: "Mon–Sun | 9AM–9PM UAE",
      action: null,
      iconColor: "text-[#1A1A1A]",
      titleColor: "text-[#1A1A1A]",
      valueColor: "text-[#1A1A1A]",
      clickable: false,
    },
  ];

  return (
    <>
      <SEOHead {...pagesSEO.contact} />
      <div className="min-h-screen bg-[#F7F2EA]" data-marketing-page>
      {/* Hero Section with Video */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-20 overflow-hidden" data-surface="dark" data-hero-dark>
        <div className="absolute inset-0">
          <VideoBackground src={contactHeroVideo} poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <p data-no-contrast-guard className="text-xs uppercase tracking-[0.32em] mb-5" style={{ color: '#E8C77A' }}>JBJ Global Real Estate</p>
          <h1
            data-no-contrast-guard
            className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-5 max-w-4xl mx-auto leading-[1.1]"
            style={{ color: '#ffffff' }}
          >
            A direct line to our team.
          </h1>
          <p data-no-contrast-guard className="text-base md:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.88)' }}>
            Professional support, clear communication, trusted guidance. Whether you are an investor, owner, broker or partner, our team is ready to assist with accurate information and accountable follow up.
          </p>
        </div>
      </section>

      {/* Contact Cards - clean champagne band, no black gutter */}
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-5 md:p-6 shadow-[0_2px_12px_rgba(184,149,85,0.08)]">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#B89555]/20">
              {contactCards.map((card) => (
                <div
                  key={card.title}
                  onClick={() => {
                    if (card.action === "phone-actions") setPhoneActionsOpen(true);
                    else if (card.action === "meeting") window.location.assign("/book");
                    else if (card.action && card.clickable) window.location.href = card.action;
                  }}
                  className={`group flex flex-col items-center text-center px-4 py-3 transition-all duration-300 ${card.clickable ? "cursor-pointer hover:-translate-y-0.5" : ""}`}
                >
                  <div className="w-11 h-11 rounded-full border border-[#B89555]/50 bg-[#F7F2EA] flex items-center justify-center mb-3 transition-all duration-300 group-hover:border-[#B89555] group-hover:bg-[#EFE6D6]">
                    <card.icon className="w-[18px] h-[18px] text-[#1A1A1A]" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55 mb-1.5 font-medium">{card.title}</p>
                  <p className="text-sm font-medium text-[#1A1A1A] leading-snug">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Consultation Form Section */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">

          <div className="max-w-3xl mx-auto">
            {isSuccess ? (
              /* Success State */
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-2xl p-8 md:p-12 text-center shadow-[0_8px_30px_rgba(200,167,102,0.35)]">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-4">
                  Thank You for Your Inquiry
                </h2>
                <p className="text-[#1A1A1A]/70 text-lg mb-6">
                  We have received your consultation request and will be in touch soon.
                </p>
                <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-6 text-left max-w-md mx-auto">
                  <h3 className="text-[#1A1A1A] font-semibold mb-3 text-sm uppercase tracking-wider">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-[#1A1A1A]"><span className="text-[#1A1A1A]/70">Phone:</span> {CONTACT_INFO.phone}</p>
                    <p className="text-[#1A1A1A]"><span className="text-[#1A1A1A]/70">Email:</span> {CONTACT_INFO.email}</p>
                    <p className="text-[#1A1A1A]"><span className="text-[#1A1A1A]/70">WhatsApp:</span> {CONTACT_INFO.phone}</p>
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
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-2xl p-6 md:p-10 shadow-[0_8px_30px_rgba(200,167,102,0.35),0_4px_15px_rgba(0,0,0,0.15)]">
                <div className="text-center mb-8">
                  <IconTile icon={Shield} tone="ink" size="lg" className="mx-auto mb-4" />

                  <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-2">
                    Request a Consultation
                  </h2>
                  <p className="text-[#1A1A1A]/70 text-sm">
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
                            <FormLabel className="text-[#1A1A1A] text-sm font-medium">Full Name *</FormLabel>
                            <FormControl>
                               <Input 
                                {...field} 
                                className="h-12 border-2 border-[#B89555]/40 hover:border-[#B89555] focus:border-[#B89555] rounded-lg"
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
                              <FormLabel className="text-[#1A1A1A] text-sm font-medium">Email Address *</FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type="email"
                                className="h-12 border-2 border-[#B89555]/40 hover:border-[#B89555] focus:border-[#B89555] rounded-lg"
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
                                <FormLabel className="text-[#1A1A1A] text-sm font-semibold">Phone Number *</FormLabel>
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
                                      className="flex-shrink-0 h-12 px-3 jj-surface-emerald hover:jj-surface-emerald text-white rounded-md flex items-center justify-center transition-colors"
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
                              <FormLabel className="text-[#1A1A1A]/70 text-sm font-medium">Nationality *</FormLabel>
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
                              <FormLabel className="text-[#1A1A1A]/70 text-sm font-medium">Preferred Language *</FormLabel>
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
                            <FormLabel className="text-[#1A1A1A]/70 text-sm font-medium">Current Location (Country & City) *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="h-12 border-2 border-[#B89555]/40 hover:border-[#B89555] focus:border-[#B89555] rounded-lg"
                                placeholder="e.g., Dubai, UAE or London, UK"
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Service Selection */}
                    <div className="h-px bg-[#EFE6D6] my-6" />
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="serviceNeeded"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#1A1A1A]/70 text-sm font-medium">Service Needed *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 border-2 border-[#B89555]/40 hover:border-[#B89555] focus:border-[#B89555] rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A]">
                                   <SelectValue placeholder="Select a service" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SERVICE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value} className="text-[#1A1A1A] hover:bg-[#F7F2EA]">
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
                              <FormLabel className="text-[#1A1A1A]/70 text-sm font-medium">Budget Range (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                   <SelectTrigger className="h-12 border-2 border-[#B89555]/40 hover:border-[#B89555] focus:border-[#B89555] rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A]">
                                     <SelectValue placeholder="Select budget" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {BUDGET_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="text-[#1A1A1A] hover:bg-[#F7F2EA]">
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
                              <FormLabel className="text-[#1A1A1A]/70 text-sm font-medium">Timeline (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                   <SelectTrigger className="h-12 border-2 border-[#B89555]/40 hover:border-[#B89555] focus:border-[#B89555] rounded-lg bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A]">
                                     <SelectValue placeholder="Select timeline" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIMELINE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value} className="text-[#1A1A1A] hover:bg-[#F7F2EA]">
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
                            <FormLabel className="text-[#1A1A1A]/70 text-sm font-medium">Referral Code (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="h-12 border-2 border-[#B89555]/40 hover:border-[#B89555] focus:border-[#B89555] rounded-lg uppercase"
                                placeholder="e.g., JJ-ABC123"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <p className="text-xs text-[#1A1A1A]/60 mt-1">
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
                            <FormLabel className="text-[#1A1A1A]/70 text-sm font-medium">Additional Message (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                className="min-h-[100px] border-2 border-[#B89555]/40 hover:border-[#B89555] focus:border-[#B89555] resize-none rounded-lg"
                                placeholder="Tell us more about your requirements..."
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Checkboxes */}
                    <div className="h-px bg-[#EFE6D6] my-6" />

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
                                className="border-[#B89555]/30 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-[#1A1A1A]/70 text-sm font-normal cursor-pointer">
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
                                className="border-[#B89555]/30 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-[#1A1A1A]/70 text-sm font-normal cursor-pointer">
                                I agree to the{" "}
                                <Link to="/terms" className="text-[#1A1A1A] hover:underline">Terms of Service</Link>
                                {" "}and{" "}
                                <Link to="/privacy" className="text-[#1A1A1A] hover:underline">Privacy Policy</Link>. *
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
                                className="border-[#B89555]/30 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-[#1A1A1A]/70 text-sm font-normal cursor-pointer">
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
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F7F2EA 100%)',
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
                            <Loader2 className="w-5 h-5 text-[#1A1A1A] animate-spin" />
                            <span className="text-[#1A1A1A]">Submitting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
                            <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Start Your</span>
                            <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Inquiry</span>
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

      {/* Direct Contact Section */}
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-6 md:p-8 shadow-[0_2px_12px_rgba(184,149,85,0.08)]">
            <h2 className="text-center text-2xl md:text-3xl font-light tracking-tight text-[#1A1A1A] mb-3">
              Prefer to reach us directly?
            </h2>
            <p className="text-center text-[#1A1A1A]/65 text-sm mb-6 max-w-2xl mx-auto">
              For general inquiries, consultations or non-technical requests, contact us through the channels below.
            </p>
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-[#F7F2EA] border border-[#B89555]/40 rounded-xl p-5 transition-all group hover:border-[#B89555] hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 bg-[#FDFBF7] border border-[#B89555]/40 rounded-full flex items-center justify-center group-hover:bg-[#EFE6D6] transition-colors">
                  <MessageCircle className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55 font-medium mb-0.5">WhatsApp</p>
                  <p className="text-[#1A1A1A] text-sm font-medium">+971-5659-11000</p>
                </div>
              </a>

              <a
                href={getCallUrl()}
                className="flex items-center gap-4 bg-[#F7F2EA] border border-[#B89555]/40 rounded-xl p-5 transition-all group hover:border-[#B89555] hover:-translate-y-0.5"
              >
                <div className="w-11 h-11 bg-[#FDFBF7] border border-[#B89555]/40 rounded-full flex items-center justify-center group-hover:bg-[#EFE6D6] transition-colors">
                  <Phone className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55 font-medium mb-0.5">Call Us</p>
                  <p className="text-[#1A1A1A] text-sm font-medium">+971-5659-11000</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-6 md:p-8 shadow-[0_2px_12px_rgba(184,149,85,0.08)] max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <IconTile icon={Shield} tone="ink" size="md" />
              <h3 className="text-[#1A1A1A] font-semibold text-lg">Important Notice</h3>
            </div>
            <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">
              JBJ Global Real Estate is a licensed real estate brokerage in Dubai for buying, selling and renting properties. We do not provide legal, mortgage or immigration services directly. Where required, we may introduce independent, licensed partners. Any engagement with partner services is contracted directly between the client and the partner under the partner's own licence and terms.
            </p>
          </div>
        </div>
      </section>

      {/* Appointments + Closing - combined to reduce vertical gap */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-6 md:p-8 shadow-[0_2px_12px_rgba(184,149,85,0.08)] max-w-4xl mx-auto text-center">
            <IconTile icon={Calendar} tone="ink" size="md" className="mx-auto mb-4" />
            <h3 className="text-[#1A1A1A] font-semibold text-lg mb-2">Appointments</h3>
            <p className="text-[#1A1A1A]/70 text-sm leading-relaxed mb-5 max-w-2xl mx-auto">
              If an in-person meeting is required, availability is confirmed by appointment only after initial contact or ticket submission.
            </p>
            <div className="h-px w-24 bg-[#B89555]/40 mx-auto mb-5" />
            <p className="text-[#1A1A1A]/70 text-sm leading-relaxed max-w-2xl mx-auto">
              At JBJ Global Real Estate, communication is handled with structure, discretion and accountability. We look forward to assisting you.
            </p>
          </div>
        </div>
      </section>


      {/* Phone Actions Dialog */}
      <Dialog open={phoneActionsOpen} onOpenChange={setPhoneActionsOpen}>
        <DialogContent className="max-w-sm bg-[#FDFBF7] border-[#B89555]/30">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] text-lg font-semibold">Contact Options</DialogTitle>
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
              className="w-full h-12 jj-surface-emerald hover:jj-surface-emerald text-white justify-start gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </Button>
            <Button 
              onClick={() => handlePhoneAction('save')}
              variant="outline"
              className="w-full h-12 border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#F7F2EA] justify-start gap-3"
            >
              <Download className="w-5 h-5" />
              Save Contact
            </Button>
            <Button 
              onClick={() => handlePhoneAction('share')}
              variant="outline"
              className="w-full h-12 border-[#B89555]/30 text-[#1A1A1A]/70 hover:bg-[#F7F2EA] justify-start gap-3"
            >
              <Share2 className="w-5 h-5" />
              Share Contact
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </>
  );
};

export default Contact;
