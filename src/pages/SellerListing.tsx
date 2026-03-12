import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFormAutoSave } from "@/hooks/useFormAutoSave";
import { 
  User, Building2, DollarSign, Home, Camera, FileText, 
  CheckCircle2, ArrowRight, ArrowLeft, Loader2, 
  Phone, Mail, MessageCircle, Upload, Sparkles, Shield,
  Calculator, Plus, X, Wand2, AlertCircle
} from "lucide-react";
import { FormDraftBar } from "@/components/shared/FormDraftBar";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import SellerAssistant from "@/components/seller/SellerAssistant";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Form validation schema
const sellerListingSchema = z.object({
  // Step 1 - Seller Details
  seller_full_name: z.string().min(2, "Full name is required"),
  seller_phone: z.string().min(8, "Valid phone number is required"),
  seller_email: z.string().email("Valid email is required"),
  preferred_language: z.string().default("en"),
  preferred_contact_method: z.string().default("whatsapp"),
  seller_type: z.string().default("owner"),
  
  // Step 2 - Property Basics
  property_type: z.string().min(1, "Property type is required"),
  property_location: z.string().min(2, "Location is required"),
  community_building: z.string().optional(),
  bedrooms: z.number().optional(),
  property_size_sqft: z.number().optional(),
  property_status: z.string().default("vacant"),
  property_notes: z.string().optional(),
  
  // Step 3 - Pricing
  purchase_price: z.number().optional(),
  target_selling_price: z.number().min(1, "Target selling price is required"),
  minimum_acceptable_price: z.number().optional(),
  selling_urgency: z.string().default("90+"),
  estimated_range_min: z.number().optional(),
  estimated_range_max: z.number().optional(),
  estimated_note: z.string().optional(),
  
  // Step 4 - Condition
  is_furnished: z.boolean().default(false),
  has_upgrades: z.boolean().default(false),
  upgrade_details: z.string().optional(),
  key_highlights: z.array(z.string()).optional(),
  listing_description: z.string().optional(),
  
  // Step 7 - Confirmation
  submission_confirmed: z.boolean().default(false),
});

type SellerListingForm = z.infer<typeof sellerListingSchema>;

const STEPS = [
  { number: 1, title: "Seller Details", icon: User },
  { number: 2, title: "Property Basics", icon: Building2 },
  { number: 3, title: "Pricing", icon: DollarSign },
  { number: 4, title: "Condition & Upgrades", icon: Home },
  { number: 5, title: "Media Uploads", icon: Camera },
  { number: 6, title: "Documents Vault", icon: FileText },
  { number: 7, title: "Review & Submit", icon: CheckCircle2 },
];

const SellerListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showEvaluator, setShowEvaluator] = useState(false);
  const [isRunningEvaluator, setIsRunningEvaluator] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  // File uploads state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [floorPlanFiles, setFloorPlanFiles] = useState<File[]>([]);
  const [titleDeedFile, setTitleDeedFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [poaFile, setPoaFile] = useState<File | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([]);
  
  // Key highlights state
  const [highlights, setHighlights] = useState<string[]>([]);
  const [newHighlight, setNewHighlight] = useState("");

  const form = useForm<SellerListingForm>({
    resolver: zodResolver(sellerListingSchema),
    defaultValues: {
      seller_full_name: "",
      seller_phone: "",
      seller_email: user?.email || "",
      preferred_language: "en",
      preferred_contact_method: "whatsapp",
      seller_type: "owner",
      property_type: "",
      property_location: "",
      community_building: "",
      bedrooms: undefined,
      property_size_sqft: undefined,
      property_status: "vacant",
      property_notes: "",
      purchase_price: undefined,
      target_selling_price: undefined,
      minimum_acceptable_price: undefined,
      selling_urgency: "90+",
      estimated_range_min: undefined,
      estimated_range_max: undefined,
      estimated_note: "",
      is_furnished: false,
      has_upgrades: false,
      upgrade_details: "",
      key_highlights: [],
      listing_description: "",
      submission_confirmed: false,
    },
  });

  // Auto-save functionality
  const { clearDraft, hasDraft } = useFormAutoSave(form, {
    formId: "seller-listing",
    debounceMs: 1000,
    expiryHours: 72,
  });

  // Update email if user logs in
  useEffect(() => {
    if (user?.email && !form.getValues("seller_email")) {
      form.setValue("seller_email", user.email);
    }
  }, [user, form]);

  const addHighlight = () => {
    if (newHighlight.trim() && highlights.length < 10) {
      setHighlights([...highlights, newHighlight.trim()]);
      setNewHighlight("");
    }
  };

  const removeHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index));
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('seller-documents')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    return fileName;
  };

  // Run Property Evaluator with prefill and save-back
  const runPropertyEvaluator = async () => {
    setIsRunningEvaluator(true);
    try {
      const values = form.getValues();
      
      // Map seller listing fields to property-evaluation expected format
      const { data, error } = await supabase.functions.invoke('property-evaluation', {
        body: {
          property: {
            community: values.property_location || 'Dubai Marina',
            subCommunity: values.community_building || '',
            buildingName: values.community_building || '',
            propertyType: values.property_type === 'penthouse' ? 'penthouse' :
                          values.property_type === 'villa' ? 'villa' :
                          values.property_type === 'townhouse' ? 'townhouse' :
                          values.property_type === 'apartment' ? 'apartment' : 'apartment',
            bedrooms: values.bedrooms || 1,
            sizeInternal: values.property_size_sqft || 1000,
            floor: 10, // Default floor
            furnishedStatus: values.is_furnished ? 'furnished' : 'unfurnished',
            renovationCost: 0,
          }
        }
      });

      if (error) throw error;

      // Map response from property-evaluation to form fields
      if (data?.estimatedValue?.low && data?.estimatedValue?.high) {
        form.setValue("estimated_range_min", data.estimatedValue.low);
        form.setValue("estimated_range_max", data.estimatedValue.high);
        form.setValue("estimated_note", data.marketInsights || `AI estimate based on ${values.property_type} in ${values.property_location}. This is informational only.`);
        toast.success("Property evaluation complete!");
      } else {
        toast.info("Evaluation complete - please review the market insights.");
      }
    } catch (error) {
      console.error('Evaluator error:', error);
      toast.error("Could not run evaluator. Please try again.");
    } finally {
      setIsRunningEvaluator(false);
      setShowEvaluator(false);
    }
  };

  // Generate listing description using AI
  const generateListingDescription = async () => {
    setIsGeneratingDescription(true);
    try {
      const values = form.getValues();
      
      const prompt = `Generate a professional property listing description for:
- Property Type: ${values.property_type}
- Location: ${values.property_location}
- Building/Community: ${values.community_building || 'N/A'}
- Bedrooms: ${values.bedrooms === 0 ? 'Studio' : values.bedrooms || 'N/A'}
- Size: ${values.property_size_sqft?.toLocaleString() || 'N/A'} sq.ft
- Status: ${values.property_status}
- Furnished: ${values.is_furnished ? 'Yes' : 'No'}
- Upgrades: ${values.has_upgrades ? values.upgrade_details || 'Yes' : 'No'}
- Key Highlights: ${highlights.join(', ') || 'N/A'}

Requirements:
- Write 2-3 paragraphs, professional tone
- Highlight key features and location benefits
- Do NOT include pricing or promises of returns
- Do NOT make investment claims
- Keep it factual and appealing
- UAE Real Estate context`;

      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'system', content: 'You are a professional real estate copywriter for JBJ Global Real Estate. Write compelling, factual property descriptions. Never make investment claims or promises.' },
            { role: 'user', content: prompt }
          ],
          model: 'google/gemini-2.5-flash',
          max_tokens: 500,
        }
      });

      if (error) throw error;

      const description = data?.response || data?.content || '';
      if (description) {
        form.setValue("listing_description", description);
        toast.success("Description generated! Feel free to edit.");
      }
    } catch (error) {
      console.error('Description generation error:', error);
      toast.error("Could not generate description. Please try again.");
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const values = form.getValues();
    const sellerType = values.seller_type;
    
    switch (step) {
      case 1:
        return !!(values.seller_full_name && values.seller_phone && values.seller_email);
      case 2:
        return !!(values.property_type && values.property_location);
      case 3:
        return !!(values.target_selling_price && values.target_selling_price > 0);
      case 4:
        return true; // Optional step
      case 5:
        return true; // Optional but recommended
      case 6:
        // Title Deed is required
        if (!titleDeedFile) {
          toast.error("Title Deed is required");
          return false;
        }
        // POA is required if seller type is POA
        if (sellerType === 'poa' && !poaFile) {
          toast.error("Power of Attorney document is required for POA sellers");
          return false;
        }
        return true;
      case 7:
        return values.submission_confirmed === true;
      default:
        return true;
    }
  };

  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 7));
    } else if (currentStep !== 6) {
      toast.error("Please complete all required fields before continuing");
    }
  };

  const goToPrevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Please sign in to submit your listing");
      navigate("/auth");
      return;
    }

    if (!validateStep(7)) {
      toast.error("Please confirm your submission");
      return;
    }

    // Final document check
    if (!titleDeedFile) {
      toast.error("Title Deed is required before submission");
      return;
    }
    
    if (form.getValues("seller_type") === 'poa' && !poaFile) {
      toast.error("POA document is required for Power of Attorney sellers");
      return;
    }

    setIsSubmitting(true);

    try {
      const values = form.getValues();
      
      // Upload files
      const photoUrls: string[] = [];
      const videoUrls: string[] = [];
      const floorPlanUrls: string[] = [];
      const additionalDocUrls: string[] = [];
      
      for (const file of photoFiles) {
        const url = await uploadFile(file, 'photos');
        if (url) photoUrls.push(url);
      }
      
      for (const file of videoFiles) {
        const url = await uploadFile(file, 'videos');
        if (url) videoUrls.push(url);
      }
      
      for (const file of floorPlanFiles) {
        const url = await uploadFile(file, 'floor-plans');
        if (url) floorPlanUrls.push(url);
      }
      
      for (const file of additionalDocs) {
        const url = await uploadFile(file, 'additional');
        if (url) additionalDocUrls.push(url);
      }

      const titleDeedUrl = titleDeedFile ? await uploadFile(titleDeedFile, 'title-deeds') : null;
      const passportUrl = passportFile ? await uploadFile(passportFile, 'passports') : null;
      const poaUrl = poaFile ? await uploadFile(poaFile, 'poa') : null;

      // Submit to database
      const { data, error } = await supabase
        .from('seller_listings')
        .insert({
          user_id: user.id,
          seller_full_name: values.seller_full_name,
          seller_phone: values.seller_phone,
          seller_email: values.seller_email,
          preferred_language: values.preferred_language,
          preferred_contact_method: values.preferred_contact_method,
          seller_type: values.seller_type,
          property_type: values.property_type,
          property_location: values.property_location,
          community_building: values.community_building,
          bedrooms: values.bedrooms,
          property_size_sqft: values.property_size_sqft,
          property_status: values.property_status,
          property_notes: values.property_notes,
          purchase_price: values.purchase_price,
          target_selling_price: values.target_selling_price,
          minimum_acceptable_price: values.minimum_acceptable_price,
          selling_urgency: values.selling_urgency,
          is_furnished: values.is_furnished,
          has_upgrades: values.has_upgrades,
          upgrade_details: values.upgrade_details,
          key_highlights: highlights,
          listing_description: values.listing_description,
          photo_urls: photoUrls,
          video_urls: videoUrls,
          floor_plan_urls: floorPlanUrls,
          title_deed_url: titleDeedUrl,
          passport_url: passportUrl,
          poa_url: poaUrl,
          additional_doc_urls: additionalDocUrls,
          status: 'submitted',
          submission_confirmed: true,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Run AI scoring in background (non-blocking)
      try {
        const { data: scoreResult } = await supabase.functions.invoke('listing-score', {
          body: {
            listing: {
              title: values.listing_description?.substring(0, 100) || `${values.property_type} in ${values.property_location}`,
              description: values.listing_description,
              property_type: values.property_type,
              location: values.property_location,
              price: values.target_selling_price,
              bedrooms: values.bedrooms,
              area_sqft: values.property_size_sqft,
              images_count: photoUrls.length,
              has_documents: !!titleDeedUrl,
              source: 'manual',
            }
          }
        });
        if (scoreResult?.score) {
          await supabase.from('seller_listings').update({
            ai_score: scoreResult.score.overall_score,
            ai_score_data: scoreResult.score,
          } as any).eq('id', data.id);
        }
      } catch (scoreErr) {
        console.warn('AI scoring failed (non-blocking):', scoreErr);
      }

      setListingId(data.id);
      clearDraft();
      toast.success("Your listing has been submitted successfully!");
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error("Failed to submit listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success view
  if (listingId) {
    return (
      <>
        <SEOHead 
          title="Listing Submitted | JBJ Global Real Estate"
          description="Your property listing has been submitted successfully."
        />
        <main className="min-h-screen bg-black pt-24 pb-16">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-gold/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold/30">
                <CheckCircle2 className="w-10 h-10 text-gold" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Listing Submitted Successfully!</h1>
              <p className="text-zinc-400 mb-8">
                Thank you for submitting your property listing. Our team will review your submission and 
                contact you within 24-48 hours to discuss next steps.
              </p>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-gold font-semibold mb-3">What Happens Next?</h3>
                <ul className="space-y-2 text-zinc-300 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Our team will review your listing details and documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>We'll contact you via your preferred method to discuss pricing strategy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Once approved, your property will be marketed to qualified buyers</span>
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href={getWhatsAppUrl(`Hi, I just submitted a property listing (ID: ${listingId}). I'd like to discuss it further.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary">
                    <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                    Chat on WhatsApp
                  </Button>
                </a>
                <Button 
                  variant="secondary" 
                  onClick={() => navigate("/")}
                >
                  Return Home
                </Button>
              </div>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="List Your Property | Seller Listing Tool | JBJ Global Real Estate"
        description="Submit your property for sale with JBJ Global Real Estate. Our guided listing tool helps you provide all necessary details for a successful sale."
      />
      
      <main className="min-h-screen bg-black pt-20 pb-0">
        {/* Layer 2: Active Champagne Hero Section with proper gutters */}
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-t-2xl">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-black text-gold text-sm font-medium mb-4 border border-gold/30">
                Seller Listing Tool
              </span>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-3">
                List Your Property <span className="text-gold">for Sale</span>
              </h1>
              <p className="text-zinc-600 mb-6">
                Complete the form below to submit your property listing. Our team will contact you within 24-48 hours.
              </p>
              {hasDraft && (
                <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg text-sm text-gold inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Draft restored from your previous session
                </div>
              )}
              
              {/* Seller Assistant CTA - Premium 3D Primary Button - Scrolls to section */}
              <div className="mt-6">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setShowAssistant(true);
                    // Scroll to the assistant section after a brief delay
                    setTimeout(() => {
                      document.getElementById('seller-assistant-panel')?.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                      });
                    }, 100);
                  }}
                  className="px-8 py-4 text-sm"
                >
                  <Wand2 className="w-5 h-5" />
                  <span>Get Help with JBJ Seller Assistant</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Layer 2 continues for form content */}
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 pb-16 pt-8">
          <div className="container mx-auto px-4">
          {/* Progress Steps - Using champagne active color */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
              {STEPS.map((step, index) => (
                <div 
                  key={step.number}
                  className={`flex flex-col items-center min-w-[80px] cursor-pointer transition-all ${
                    currentStep === step.number 
                      ? 'text-black' 
                      : currentStep > step.number 
                        ? 'text-gold' 
                        : 'text-zinc-500'
                  }`}
                  onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all ${
                    currentStep === step.number 
                      ? 'bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-black text-black shadow-lg' 
                      : currentStep > step.number 
                        ? 'bg-white border-gold text-gold'
                        : 'bg-zinc-100 border-zinc-300 text-zinc-500'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs text-center whitespace-nowrap ${
                    currentStep === step.number ? 'text-black font-medium' : 'text-zinc-600'
                  }`}>{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content - White/Champagne/Gold Theme */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-2xl p-6 md:p-8 shadow-xl">
              <AnimatePresence mode="wait">
                {/* Step 1: Seller Details */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-black mb-2">Seller Details</h2>
                      <p className="text-zinc-600 text-sm">Tell us about yourself so we can contact you</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-black font-medium">Full Name <span className="text-gold">*</span></Label>
                        <Input
                          {...form.register("seller_full_name")}
                          placeholder="Enter your full name"
                          className="bg-zinc-50 border-zinc-300 text-black placeholder:text-gold mt-1 focus:border-gold"
                          style={{ textShadow: 'none' }}
                        />
                      </div>
                      <div>
                        <Label className="text-black font-medium">Phone Number <span className="text-gold">*</span></Label>
                        <Input
                          {...form.register("seller_phone")}
                          placeholder="+971 50 123 4567"
                          className="bg-zinc-50 border-zinc-300 text-black placeholder:text-gold mt-1 focus:border-gold"
                          style={{ textShadow: 'none' }}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Email Address <span className="text-gold">*</span></Label>
                      <Input
                        {...form.register("seller_email")}
                        type="email"
                        placeholder="your@email.com"
                        className="bg-zinc-50 border-zinc-300 text-black placeholder:text-gold mt-1 focus:border-gold"
                        style={{ textShadow: 'none' }}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-black font-medium">Preferred Language</Label>
                        <Select 
                          value={form.watch("preferred_language")} 
                          onValueChange={(v) => form.setValue("preferred_language", v)}
                        >
                          <SelectTrigger className="bg-zinc-50 border-zinc-300 text-black mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-zinc-200">
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="ru">Russian</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-black font-medium">Preferred Contact Method</Label>
                        <Select 
                          value={form.watch("preferred_contact_method")} 
                          onValueChange={(v) => form.setValue("preferred_contact_method", v)}
                        >
                          <SelectTrigger className="bg-zinc-50 border-zinc-300 text-black mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-zinc-200">
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="call">Phone Call</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-black font-medium mb-3 block">Seller Type <span className="text-gold">*</span></Label>
                      <RadioGroup 
                        value={form.watch("seller_type")} 
                        onValueChange={(v) => form.setValue("seller_type", v)}
                        className="grid grid-cols-2 md:grid-cols-3 gap-3"
                      >
                        {[
                          { value: "owner", label: "Property Owner" },
                          { value: "broker", label: "Broker" },
                          { value: "investor", label: "Investor" },
                          { value: "representative", label: "Representative" },
                          { value: "poa", label: "Power of Attorney" },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center">
                            <RadioGroupItem 
                              value={option.value} 
                              id={option.value}
                              className="border-gold/50"
                            />
                            <Label htmlFor={option.value} className="ml-2 text-zinc-700 cursor-pointer">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Property Basics */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-black mb-2">Property Details</h2>
                      <p className="text-zinc-600 text-sm">Tell us about your property</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-black font-medium">Property Type <span className="text-gold">*</span></Label>
                        <Select
                          value={form.watch("property_type")}
                          onValueChange={(v) => form.setValue("property_type", v)}
                        >
                          <SelectTrigger className="bg-zinc-50 border-zinc-300 text-black mt-1">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-zinc-200">
                            <SelectItem value="apartment">Apartment</SelectItem>
                            <SelectItem value="villa">Villa</SelectItem>
                            <SelectItem value="townhouse">Townhouse</SelectItem>
                            <SelectItem value="penthouse">Penthouse</SelectItem>
                            <SelectItem value="duplex">Duplex</SelectItem>
                            <SelectItem value="land">Land</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-black font-medium">Location / Area <span className="text-gold">*</span></Label>
                        <Input
                          {...form.register("property_location")}
                          placeholder="e.g., Downtown Dubai"
                          className="bg-zinc-50 border-zinc-300 text-black placeholder:text-gold mt-1 focus:border-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Community / Building Name</Label>
                      <Input
                        {...form.register("community_building")}
                        placeholder="e.g., Burj Khalifa, Palm Jumeirah"
                        className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 mt-1"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-black font-medium">Bedrooms</Label>
                        <Select
                          value={form.watch("bedrooms")?.toString()}
                          onValueChange={(v) => form.setValue("bedrooms", parseInt(v))}
                        >
                          <SelectTrigger className="bg-zinc-50 border-zinc-300 text-black mt-1">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-zinc-200">
                            <SelectItem value="0">Studio</SelectItem>
                            <SelectItem value="1">1 BR</SelectItem>
                            <SelectItem value="2">2 BR</SelectItem>
                            <SelectItem value="3">3 BR</SelectItem>
                            <SelectItem value="4">4 BR</SelectItem>
                            <SelectItem value="5">5 BR</SelectItem>
                            <SelectItem value="6">6+ BR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-black font-medium">Size (sq.ft)</Label>
                        <Input
                          type="number"
                          {...form.register("property_size_sqft", { valueAsNumber: true })}
                          placeholder="e.g., 1500"
                          className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-black font-medium mb-3 block">Property Status</Label>
                      <RadioGroup
                        value={form.watch("property_status")}
                        onValueChange={(v) => form.setValue("property_status", v)}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                      >
                        {[
                          { value: "vacant", label: "Vacant" },
                          { value: "tenanted", label: "Tenanted" },
                          { value: "ready", label: "Ready to Move" },
                          { value: "off-plan", label: "Off-Plan" },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center">
                            <RadioGroupItem
                              value={option.value}
                              id={`status-${option.value}`}
                              className="border-zinc-400"
                            />
                            <Label
                              htmlFor={`status-${option.value}`}
                              className="ml-2 text-zinc-700 cursor-pointer text-sm"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Additional Notes</Label>
                      <Textarea
                        {...form.register("property_notes")}
                        placeholder="Any other details about your property..."
                        className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 mt-1 min-h-[100px]"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Pricing */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-black mb-2">Pricing Information</h2>
                      <p className="text-zinc-600 text-sm">Help us understand your pricing expectations</p>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Purchase Price (AED) - Optional</Label>
                      <Input
                        type="number"
                        {...form.register("purchase_price", { valueAsNumber: true })}
                        placeholder="Original purchase price"
                        className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 mt-1"
                      />
                      <p className="text-zinc-500 text-xs mt-1">What you paid for the property</p>
                    </div>

                    <div>
                      <Label className="text-black font-medium">Target Selling Price (AED) *</Label>
                      <Input
                        type="number"
                        {...form.register("target_selling_price", { valueAsNumber: true })}
                        placeholder="Your desired selling price"
                        className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-black font-medium">Minimum Acceptable Price (AED) - Optional</Label>
                      <Input
                        type="number"
                        {...form.register("minimum_acceptable_price", { valueAsNumber: true })}
                        placeholder="Lowest price you'd accept"
                        className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-black font-medium mb-3 block">Selling Urgency</Label>
                      <RadioGroup
                        value={form.watch("selling_urgency")}
                        onValueChange={(v) => form.setValue("selling_urgency", v)}
                        className="grid grid-cols-3 gap-3"
                      >
                        {[
                          { value: "30", label: "Within 30 days" },
                          { value: "60", label: "Within 60 days" },
                          { value: "90+", label: "90+ days / Flexible" },
                        ].map((option) => (
                          <div key={option.value} className="flex items-center">
                            <RadioGroupItem
                              value={option.value}
                              id={`urgency-${option.value}`}
                              className="border-zinc-400"
                            />
                            <Label
                              htmlFor={`urgency-${option.value}`}
                              className="ml-2 text-zinc-700 cursor-pointer text-sm"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Property Evaluator Integration */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Calculator className="w-5 h-5 text-gold" />
                        <span className="text-black font-medium">Need help with pricing?</span>
                      </div>
                      <p className="text-zinc-600 text-sm mb-3">
                        Run our Property Evaluator to get an informational estimate based on market data.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gold text-gold hover:bg-gold/10"
                        onClick={() => setShowEvaluator(true)}
                        disabled={!form.getValues("property_type") || !form.getValues("property_location")}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Run Property Evaluator
                      </Button>

                      {/* Show estimate if available */}
                      {form.watch("estimated_range_min") && form.watch("estimated_range_max") && (
                        <div className="mt-4 p-3 bg-gold/10 border border-gold/20 rounded-lg">
                          <p className="text-gold text-sm font-medium mb-1">AI Estimate (Informational Only)</p>
                          <p className="text-black">
                            AED {form.watch("estimated_range_min")?.toLocaleString()} - AED {form.watch("estimated_range_max")?.toLocaleString()}
                          </p>
                          <p className="text-zinc-500 text-xs mt-1">{form.watch("estimated_note")}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Condition & Upgrades */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-black mb-2">Condition & Upgrades</h2>
                      <p className="text-zinc-600 text-sm">Tell us about the property's condition and any improvements</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="is_furnished"
                          checked={form.watch("is_furnished")}
                          onCheckedChange={(checked) => form.setValue("is_furnished", checked as boolean)}
                          className="border-zinc-400"
                        />
                        <Label htmlFor="is_furnished" className="text-black cursor-pointer">
                          Property is furnished
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="has_upgrades"
                          checked={form.watch("has_upgrades")}
                          onCheckedChange={(checked) => form.setValue("has_upgrades", checked as boolean)}
                          className="border-zinc-400"
                        />
                        <Label htmlFor="has_upgrades" className="text-black cursor-pointer">
                          Property has upgrades/renovations
                        </Label>
                      </div>
                    </div>

                    {form.watch("has_upgrades") && (
                      <div>
                        <Label className="text-black font-medium">Upgrade Details</Label>
                        <Textarea
                          {...form.register("upgrade_details")}
                          placeholder="Describe any upgrades, renovations, or improvements..."
                          className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 mt-1 min-h-[100px]"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-black font-medium mb-3 block">Key Highlights (up to 10)</Label>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          placeholder="e.g., Sea view, Private pool, Smart home"
                          className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHighlight())}
                        />
                        <Button 
                          type="button"
                          variant="primary"
                          onClick={addHighlight}
                          disabled={highlights.length >= 10}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {highlights.map((highlight, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gold/10 text-gold rounded-full text-sm border border-gold/20"
                          >
                            {highlight}
                            <button 
                              type="button"
                              onClick={() => removeHighlight(index)}
                              className="hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Listing Description with AI Generator */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-black font-medium">Listing Description</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateListingDescription}
                          disabled={isGeneratingDescription || !form.getValues("property_type")}
                          className="border-gold text-gold hover:bg-gold/10 text-xs"
                        >
                          {isGeneratingDescription ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Wand2 className="w-3 h-3 mr-1" />
                          )}
                          Generate Description
                        </Button>
                      </div>
                      <Textarea
                        {...form.register("listing_description")}
                        placeholder="Describe your property or use AI to generate a professional description..."
                        className="bg-zinc-50 border-zinc-300 text-black placeholder:text-zinc-400 mt-1 min-h-[150px]"
                      />
                      <p className="text-zinc-500 text-xs mt-1">
                        This description will be used in marketing materials (you can edit it)
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Media Uploads */}
                {currentStep === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-black mb-2">Media Uploads</h2>
                      <p className="text-zinc-600 text-sm">Upload photos and videos of your property</p>
                    </div>

                    <div className="space-y-6">
                      {/* Photos */}
                      <div>
                        <Label className="text-black font-medium mb-2 block">Property Photos</Label>
                        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-gold transition-colors bg-zinc-50">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label htmlFor="photo-upload" className="cursor-pointer">
                            <Camera className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                            <p className="text-zinc-600">Click to upload photos</p>
                            <p className="text-zinc-400 text-xs mt-1">JPG, PNG up to 10MB each</p>
                          </label>
                        </div>
                        {photoFiles.length > 0 && (
                          <p className="text-gold text-sm mt-2">{photoFiles.length} photo(s) selected</p>
                        )}
                      </div>

                      {/* Videos */}
                      <div>
                        <Label className="text-black font-medium mb-2 block">Property Videos (optional)</Label>
                        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-gold transition-colors bg-zinc-50">
                          <input
                            type="file"
                            multiple
                            accept="video/*"
                            onChange={(e) => setVideoFiles(Array.from(e.target.files || []))}
                            className="hidden"
                            id="video-upload"
                          />
                          <label htmlFor="video-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                            <p className="text-zinc-600">Click to upload videos</p>
                            <p className="text-zinc-400 text-xs mt-1">MP4, MOV up to 100MB each</p>
                          </label>
                        </div>
                        {videoFiles.length > 0 && (
                          <p className="text-gold text-sm mt-2">{videoFiles.length} video(s) selected</p>
                        )}
                      </div>

                      {/* Floor Plans */}
                      <div>
                        <Label className="text-black font-medium mb-2 block">Floor Plans (optional)</Label>
                        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-gold transition-colors bg-zinc-50">
                          <input
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={(e) => setFloorPlanFiles(Array.from(e.target.files || []))}
                            className="hidden"
                            id="floorplan-upload"
                          />
                          <label htmlFor="floorplan-upload" className="cursor-pointer">
                            <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                            <p className="text-zinc-600">Click to upload floor plans</p>
                            <p className="text-zinc-400 text-xs mt-1">PDF, JPG, PNG</p>
                          </label>
                        </div>
                        {floorPlanFiles.length > 0 && (
                          <p className="text-gold text-sm mt-2">{floorPlanFiles.length} floor plan(s) selected</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 6: Documents Vault */}
                {currentStep === 6 && (
                  <motion.div
                    key="step6"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-black mb-2">Documents Vault</h2>
                      <p className="text-zinc-600 text-sm">Upload required documents securely. These are only visible to you and our team.</p>
                    </div>

                    <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <p className="text-black text-sm">
                        Your documents are encrypted and stored securely. Only authorized team members can access them.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Title Deed - REQUIRED */}
                      <div>
                        <Label className="text-black font-medium mb-2 flex items-center gap-2">
                          Title Deed <span className="text-red-500">*</span>
                          {!titleDeedFile && (
                            <span className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Required
                            </span>
                          )}
                        </Label>
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-zinc-50 ${
                          titleDeedFile ? 'border-green-500' : 'border-zinc-300 hover:border-gold'
                        }`}>
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => setTitleDeedFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="titledeed-upload"
                          />
                          <label htmlFor="titledeed-upload" className="cursor-pointer">
                            <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                            <p className="text-zinc-600">Upload Title Deed</p>
                          </label>
                        </div>
                        {titleDeedFile && (
                          <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {titleDeedFile.name}
                          </p>
                        )}
                      </div>

                      {/* Passport/Emirates ID */}
                      <div>
                        <Label className="text-black font-medium mb-2 block">Passport / Emirates ID</Label>
                        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-gold transition-colors bg-zinc-50">
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="passport-upload"
                          />
                          <label htmlFor="passport-upload" className="cursor-pointer">
                            <User className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                            <p className="text-zinc-600">Upload ID Document</p>
                          </label>
                        </div>
                        {passportFile && (
                          <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {passportFile.name}
                          </p>
                        )}
                      </div>

                      {/* POA (Required if seller type is POA) */}
                      {form.watch("seller_type") === "poa" && (
                        <div>
                          <Label className="text-black font-medium mb-2 flex items-center gap-2">
                            Power of Attorney <span className="text-red-500">*</span>
                            {!poaFile && (
                              <span className="text-red-500 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Required for POA
                              </span>
                            )}
                          </Label>
                          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-zinc-50 ${
                            poaFile ? 'border-green-500' : 'border-zinc-300 hover:border-gold'
                          }`}>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              onChange={(e) => setPoaFile(e.target.files?.[0] || null)}
                              className="hidden"
                              id="poa-upload"
                            />
                            <label htmlFor="poa-upload" className="cursor-pointer">
                              <FileText className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                              <p className="text-zinc-600">Upload POA Document</p>
                            </label>
                          </div>
                          {poaFile && (
                            <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              {poaFile.name}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Additional Documents */}
                      <div>
                        <Label className="text-black font-medium mb-2 block">Additional Documents (optional)</Label>
                        <div className="border-2 border-dashed border-zinc-300 rounded-lg p-6 text-center hover:border-gold transition-colors bg-zinc-50">
                          <input
                            type="file"
                            multiple
                            accept="application/pdf,image/*"
                            onChange={(e) => setAdditionalDocs(Array.from(e.target.files || []))}
                            className="hidden"
                            id="additional-upload"
                          />
                          <label htmlFor="additional-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                            <p className="text-zinc-600">Upload any other documents</p>
                          </label>
                        </div>
                        {additionalDocs.length > 0 && (
                          <p className="text-gold text-sm mt-2">{additionalDocs.length} additional document(s) selected</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 7: Review & Submit */}
                {currentStep === 7 && (
                  <motion.div
                    key="step7"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-black mb-2">Review & Submit</h2>
                      <p className="text-zinc-600 text-sm">Please review your information before submitting</p>
                    </div>

                    <div className="space-y-4">
                      {/* Seller Summary */}
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                        <h3 className="text-gold font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Seller Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-zinc-500">Name:</p>
                          <p className="text-black">{form.getValues("seller_full_name")}</p>
                          <p className="text-zinc-500">Phone:</p>
                          <p className="text-black">{form.getValues("seller_phone")}</p>
                          <p className="text-zinc-500">Email:</p>
                          <p className="text-black">{form.getValues("seller_email")}</p>
                          <p className="text-zinc-500">Type:</p>
                          <p className="text-black capitalize">{form.getValues("seller_type")}</p>
                        </div>
                      </div>

                      {/* Property Summary */}
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                        <h3 className="text-gold font-semibold mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Property Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-zinc-500">Type:</p>
                          <p className="text-black capitalize">{form.getValues("property_type")}</p>
                          <p className="text-zinc-500">Location:</p>
                          <p className="text-black">{form.getValues("property_location")}</p>
                          {form.getValues("bedrooms") !== undefined && (
                            <>
                              <p className="text-zinc-500">Bedrooms:</p>
                              <p className="text-black">{form.getValues("bedrooms") === 0 ? "Studio" : form.getValues("bedrooms")}</p>
                            </>
                          )}
                          {form.getValues("property_size_sqft") && (
                            <>
                              <p className="text-zinc-500">Size:</p>
                              <p className="text-black">{form.getValues("property_size_sqft")?.toLocaleString()} sq.ft</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pricing Summary */}
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                        <h3 className="text-gold font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Pricing
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-zinc-500">Target Price:</p>
                          <p className="text-black">AED {form.getValues("target_selling_price")?.toLocaleString()}</p>
                          <p className="text-zinc-500">Urgency:</p>
                          <p className="text-black">{form.getValues("selling_urgency")} days</p>
                        </div>
                      </div>

                      {/* Files Summary */}
                      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
                        <h3 className="text-gold font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Uploaded Files
                        </h3>
                        <div className="text-sm space-y-1">
                          <p className="text-zinc-600">{photoFiles.length} photos uploaded</p>
                          <p className="text-zinc-600">{videoFiles.length} videos uploaded</p>
                          <p className={`flex items-center gap-1 ${titleDeedFile ? 'text-green-600' : 'text-red-500'}`}>
                            {titleDeedFile ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            Title Deed {titleDeedFile ? '✓' : '(Required)'}
                          </p>
                          <p className="text-zinc-600">{passportFile ? "✓" : "✗"} ID Document</p>
                          {form.getValues("seller_type") === 'poa' && (
                            <p className={`flex items-center gap-1 ${poaFile ? 'text-green-600' : 'text-red-500'}`}>
                              {poaFile ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              POA Document {poaFile ? '✓' : '(Required)'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="flex items-start space-x-3 p-4 bg-gold/10 border border-gold/30 rounded-lg">
                      <Checkbox
                        id="submission_confirmed"
                        checked={form.watch("submission_confirmed")}
                        onCheckedChange={(checked) => form.setValue("submission_confirmed", checked as boolean)}
                        className="mt-1 border-zinc-400"
                      />
                      <Label htmlFor="submission_confirmed" className="text-black cursor-pointer text-sm leading-relaxed">
                        I confirm that all the information provided above is accurate and complete. I understand that 
                        JBJ Global Real Estate will review my submission and contact me to discuss next steps.
                      </Label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons - Primary Style */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gold/20">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={goToPrevStep}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < 7 ? (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={goToNextStep}
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !form.watch("submission_confirmed") || !titleDeedFile || (form.getValues("seller_type") === 'poa' && !poaFile)}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        <span>Submit Listing</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* AI Assistant Panel Toggle - Removed duplicate button, keeping only top one */}

            {/* AI Assistant Panel */}
            <AnimatePresence>
              {showAssistant && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <SellerAssistant 
                    formData={form.getValues()}
                    currentStep={currentStep}
                    onClose={() => setShowAssistant(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
      </main>

      {/* Property Evaluator Dialog */}
      <Dialog open={showEvaluator} onOpenChange={setShowEvaluator}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-gold flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Property Evaluator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-zinc-400 text-sm">
              Run our AI-powered evaluator to get an informational estimate for your property based on current market data.
            </p>
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="text-zinc-300"><span className="text-zinc-500">Type:</span> {form.getValues("property_type") || 'Not set'}</p>
              <p className="text-zinc-300"><span className="text-zinc-500">Location:</span> {form.getValues("property_location") || 'Not set'}</p>
              <p className="text-zinc-300"><span className="text-zinc-500">Bedrooms:</span> {form.getValues("bedrooms") === 0 ? 'Studio' : form.getValues("bedrooms") || 'Not set'}</p>
              <p className="text-zinc-300"><span className="text-zinc-500">Size:</span> {form.getValues("property_size_sqft")?.toLocaleString() || 'Not set'} sq.ft</p>
            </div>
            <p className="text-zinc-500 text-xs">
              Note: This is an AI-generated informational estimate only and should not be relied upon for pricing decisions.
            </p>
            <div className="flex gap-3 justify-end">
                <Button 
                  variant="secondary"
                  onClick={() => setShowEvaluator(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary"
                  onClick={runPropertyEvaluator}
                  disabled={isRunningEvaluator}
                >
                  {isRunningEvaluator ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Run Evaluation
                    </>
                  )}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SellerListing;
