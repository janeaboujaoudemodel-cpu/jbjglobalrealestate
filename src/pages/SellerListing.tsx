import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useDisplayFirstName } from "@/hooks/useDisplayFirstName";
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
  Calculator, Plus, X, Wand2, AlertCircle, Briefcase, TrendingUp, UserCheck, ScrollText
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
  const firstName = useDisplayFirstName("there");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Purpose-aware labelling: ?purpose=rent → Landlord wording, otherwise Seller wording.
  const isRent = searchParams.get("purpose") === "rent";
  const party = isRent ? "Landlord" : "Seller";
  const partyLower = isRent ? "landlord" : "seller";
  const actionNoun = isRent ? "Rent" : "Sale";
  const actionVerbCap = isRent ? "Rent Out" : "Sell";
  const pricingHeading = isRent ? "Rental Pricing" : "Pricing Information";
  const priceFieldLabel = isRent ? "Target Monthly Rent (AED) *" : "Target Selling Price (AED) *";
  const minPriceLabel = isRent ? "Minimum Acceptable Rent (AED) - Optional" : "Minimum Acceptable Price (AED) - Optional";
  const purchasePriceLabel = isRent ? "Current Market Value (AED) - Optional" : "Purchase Price (AED) - Optional";
  const urgencyLabel = isRent ? "Listing Urgency" : "Selling Urgency";
  const STEPS_LABELS = {
    1: `${party} Details`,
    2: "Property Basics",
    3: isRent ? "Rental Pricing" : "Pricing",
    4: "Condition & Upgrades",
    5: "Media Uploads",
    6: "Documents Vault",
    7: "Review & Submit",
  } as const;
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
        <main className="min-h-screen bg-[#FDFBF7] pt-12 pb-16">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-gold/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#B89555]/30">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-4">Listing Submitted Successfully!</h1>
              <p className="text-white/70 mb-8">
                Thank you for submitting your property listing. Our team will review your submission and 
                contact you within 24-48 hours to discuss next steps.
              </p>
              <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6 mb-8 text-left">
                <h3 className="text-white font-semibold mb-3">What Happens Next?</h3>
                <ul className="space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                    <span>Our team will review your listing details and documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                    <span>We'll contact you via your preferred method to discuss pricing strategy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
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
        title={`List Your Property | ${party} Listing Tool | JBJ Global Real Estate`}
        description={`Submit your property to ${actionVerbCap.toLowerCase()} with JBJ Global Real Estate. Our guided listing tool helps you provide all necessary details for a successful ${actionNoun.toLowerCase()}.`}
      />
      
      <main data-manual-listing-shell className="min-h-screen pt-6 pb-12 md:pb-16" style={{ background: "linear-gradient(135deg, #022C22 0%, #064E3B 50%, #0B0B0B 100%)" }}>
        {/* Layer 2: Emerald ombre hero */}
        <div style={{ background: "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)" }}>
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto text-center">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                data-no-contrast-guard
                style={{
                  background: "rgba(255,255,255,0.10)",
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.35)",
                  boxShadow: "0 6px 16px -8px rgba(0,0,0,0.35)",
                }}
              >
                {party} Listing Tool
              </span>
              <h1
                className="text-3xl md:text-4xl font-bold mb-3"
                data-no-contrast-guard
                style={{
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                  textShadow: "0 2px 18px rgba(0,0,0,0.35)",
                  letterSpacing: "-0.02em",
                }}
              >
                Welcome, {firstName} — List Your Property for {actionNoun}
              </h1>
              <p className="mb-6" data-no-contrast-guard style={{ color: "rgba(255,255,255,0.9)", WebkitTextFillColor: "rgba(255,255,255,0.9)" }}>
                {user ? `Glad to have you back, ${firstName}. ` : ""}Complete the form below to submit your property listing. Our team will contact you within 24-48 hours.
              </p>
            </div>
          </div>
          {/* Full edge-to-edge draft bar */}
          <div className="w-full px-0">
            <div className="w-full [&>div]:rounded-none [&>div]:border-x-0 [&>div]:px-4 md:[&>div]:px-8">
              <FormDraftBar
                hasDraft={hasDraft}
                onSaveDraft={() => { /* auto-save handles this */ toast.success("Draft auto-saved"); }}
                onReset={() => { clearDraft(); form.reset(); setHighlights([]); setPhotoFiles([]); setVideoFiles([]); setFloorPlanFiles([]); setTitleDeedFile(null); setPassportFile(null); setPoaFile(null); setAdditionalDocs([]); setCurrentStep(1); }}
                onNew={() => { clearDraft(); form.reset(); setHighlights([]); setPhotoFiles([]); setVideoFiles([]); setFloorPlanFiles([]); setTitleDeedFile(null); setPassportFile(null); setPoaFile(null); setAdditionalDocs([]); setCurrentStep(1); }}
                label={`${party} Listing`}
                theme="dark"
              />
            </div>
          </div>
          <div className="container mx-auto px-4 pb-8">
            <div className="max-w-4xl mx-auto text-center">

              {/* Seller Assistant CTA — emerald ombre primary */}
              <div className="mt-6">
                <button
                  type="button"
                  data-no-contrast-guard
                   data-seller-assistant-cta
                  onClick={() => {
                    setShowAssistant(true);
                  }}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md text-sm font-bold transition-all hover:brightness-110"
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#FFFFFF",
                    WebkitTextFillColor: "#FFFFFF",
                    border: "1.5px solid #10B981",
                    boxShadow: "0 10px 28px -12px rgba(16,185,129,0.55)",
                  }}
                >
                  <svg
                    data-assistant-magic-icon
                    data-no-contrast-guard
                    data-on-dark
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="w-5 h-5 shrink-0 allow-white jj-icon-keep"
                    fill="none"
                    color="#FFFFFF"
                    stroke="#FFFFFF"
                    style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
                  >
                    <path d="M15 4V2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 16v-2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 9h2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 9h2" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.8 11.8 19 13" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 9h.01" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.8 6.2 19 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="m3 21 9-9" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12.2 6.2 11 5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Get Help with JBJ {party} Assistant</span>
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Layer 2 continues for form content */}
        <div className="pb-16 pt-8 relative" style={{ background: "linear-gradient(135deg, #022C22 0%, #064E3B 50%, #0B0B0B 100%)" }}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(circle at 85% 12%, rgba(16,185,129,0.22) 0%, transparent 55%)" }}
          />
          <div className="container mx-auto px-4 relative">
          {/* Progress Steps - on solid emerald, white glyphs */}
          <div className="max-w-4xl mx-auto mb-8" data-no-contrast-guard data-allow-dark-cta>
            <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">

              {STEPS.map((step, index) => (
                <div 
                  key={step.number}
                  data-no-contrast-guard
                  className="flex flex-col items-center min-w-[80px] cursor-pointer transition-all"
                  onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all ${
 currentStep === step.number 
 ? 'border-white text-white shadow-lg [&_svg]:!text-white' 
 : currentStep > step.number 
 ? 'border-white/80 text-white [&_svg]:!text-white'
 : 'border-white/40 text-white/70 [&_svg]:!text-white/70'
 }`}
                   style={{
                    background: 'var(--jj-official-emerald-surface, #064E3B)',
                    backgroundColor: '#064E3B',
                    boxShadow: currentStep === step.number ? '0 8px 20px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)' : 'inset 0 1px 0 rgba(255,255,255,0.10)',
                  }}>

                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className="text-xs text-center whitespace-nowrap"
                    style={{
                      color: currentStep === step.number ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                      WebkitTextFillColor: currentStep === step.number ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                      fontWeight: currentStep === step.number ? 600 : 400,
                    }}
                  >{STEPS_LABELS[step.number as keyof typeof STEPS_LABELS] ?? step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Content - light champagne card on emerald backdrop */}
          <div className="max-w-3xl mx-auto px-2 sm:px-4">
            <div
              data-no-contrast-guard
              data-tool-emerald
              data-seller-form-scope
              className="rounded-2xl p-8 sm:p-10 md:p-12 lg:p-14 shadow-xl"
              style={{
                background: "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #000000 100%)",
                border: "1.5px solid rgba(16,185,129,0.35)",
                boxShadow: "0 28px 70px -30px rgba(0,0,0,0.7)",
                color: "#FFFFFF",
                padding: "clamp(32px, 4vw, 56px)",
                boxSizing: "border-box",
              }}
            >
              <style>{`
                [data-seller-form-scope] input::placeholder,
                [data-seller-form-scope] textarea::placeholder {
                  color: #FFFFFF !important;
                  -webkit-text-fill-color: #FFFFFF !important;
                  opacity: 0.85 !important;
                }
              `}</style>

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
                      <h2 className="text-xl md:text-2xl font-bold mb-2" data-no-contrast-guard style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",letterSpacing:"-0.01em"}}>{party} Details</h2>
                      <p className="text-sm" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",opacity:0.85}}>Tell us about yourself so we can contact you</p>
                    </div>


                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Full Name <span style={{color:"#B91C1C"}}>*</span></Label>
                        <Input
                          {...form.register("seller_full_name")}
                          placeholder="Enter your full name"
                          className="mt-1 bg-white/10 border border-white/25 text-white placeholder:text-white/90 focus-visible:ring-2 focus-visible:ring-[#0F5132] focus-visible:border-[#0F5132]" style={{border:"1.5px solid rgba(16,185,129,0.45)",textShadow:"none"}}
                        />
                      </div>
                      <div>
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Phone Number <span style={{color:"#B91C1C"}}>*</span></Label>
                        <Input
                          {...form.register("seller_phone")}
                          placeholder="+971 50 123 4567"
                          className="mt-1 bg-white/10 border border-white/25 text-white placeholder:text-white/90 focus-visible:ring-2 focus-visible:ring-[#0F5132] focus-visible:border-[#0F5132]" style={{border:"1.5px solid rgba(16,185,129,0.45)",textShadow:"none"}}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Email Address <span style={{color:"#B91C1C"}}>*</span></Label>
                      <Input
                        {...form.register("seller_email")}
                        type="email"
                        placeholder="your@email.com"
                        className="mt-1 bg-white/10 border border-white/25 text-white placeholder:text-white/90 focus-visible:ring-2 focus-visible:ring-[#0F5132] focus-visible:border-[#0F5132]" style={{border:"1.5px solid rgba(16,185,129,0.45)",textShadow:"none"}}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Preferred Language</Label>
                        <Select 
                          value={form.watch("preferred_language")} 
                          onValueChange={(v) => form.setValue("preferred_language", v)}
                        >
                          <SelectTrigger className="mt-1 bg-white/10 border border-white/25 text-white" style={{border:"1.5px solid rgba(16,185,129,0.45)"}}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#065F46]/40">
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="ru">Russian</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Preferred Contact Method</Label>
                        <Select 
                          value={form.watch("preferred_contact_method")} 
                          onValueChange={(v) => form.setValue("preferred_contact_method", v)}
                        >
                          <SelectTrigger className="mt-1 bg-white/10 border border-white/25 text-white" style={{border:"1.5px solid rgba(16,185,129,0.45)"}}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#065F46]/40">
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="call">Phone Call</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="font-semibold mb-3 block" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>{party} Type <span style={{color:"#B91C1C"}}>*</span></Label>
                      <RadioGroup
                        value={form.watch("seller_type")}
                        onValueChange={(v) => form.setValue("seller_type", v)}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                      >
                        {[
                          { value: "owner", label: "Property Owner", Icon: Home },
                          { value: "broker", label: "Broker", Icon: Briefcase },
                          { value: "investor", label: "Investor", Icon: TrendingUp },
                          { value: "representative", label: "Representative", Icon: UserCheck },
                          { value: "poa", label: "Power of Attorney", Icon: ScrollText },
                        ].map((option) => {
                          const active = form.watch("seller_type") === option.value;
                          const Icon = option.Icon;
                          return (
                            <label
                              key={option.value}
                              htmlFor={option.value}
                              className="relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all min-h-[56px]"
                              style={{
                                background: active
                                  ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                                  : "rgba(255,255,255,0.06)",
                                border: active
                                  ? "1.5px solid #10B981"
                                  : "1.5px solid rgba(255,255,255,0.28)",
                                boxShadow: active ? "0 10px 24px -12px rgba(16,185,129,0.65)" : "none",
                              }}
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={option.value}
                                className="sr-only"
                              />
                              <span
                                aria-hidden
                                className="shrink-0 inline-flex items-center justify-center rounded-full"
                                style={{
                                  width: 34,
                                  height: 34,
                                  aspectRatio: "1 / 1",
                                  background: active ? "rgba(255,255,255,0.22)" : "rgba(16,185,129,0.22)",
                                  border: active ? "1.5px solid rgba(255,255,255,0.55)" : "1.5px solid rgba(16,185,129,0.55)",
                                }}
                              >
                                <Icon style={{ width: 18, height: 18, color: "#FFFFFF" }} strokeWidth={2.25} />
                              </span>
                              <span className="font-semibold text-sm md:text-base leading-tight" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                                {option.label}
                              </span>
                              {active && (
                                <span
                                  aria-hidden
                                  className="ml-auto inline-flex items-center justify-center rounded-full"
                                  style={{
                                    width: 22,
                                    height: 22,
                                    background: "#FFFFFF",
                                    color: "#047857",
                                  }}
                                >
                                  <CheckCircle2 style={{ width: 16, height: 16, color: "#047857" }} strokeWidth={2.5} />
                                </span>
                              )}
                            </label>
                          );
                        })}
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
                      <h2 className="text-xl md:text-2xl font-bold mb-2" data-no-contrast-guard style={{background:"linear-gradient(135deg,#022C22 0%,#0F5132 50%,#064E3B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"-0.01em"}}>Property Details</h2>
                      <p className="text-sm" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",opacity:0.85}}>Tell us about your property</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Property Type <span style={{color:"#B91C1C"}}>*</span></Label>
                        <Select
                          value={form.watch("property_type")}
                          onValueChange={(v) => form.setValue("property_type", v)}
                        >
                          <SelectTrigger className="mt-1 bg-white/10 border border-white/25 text-white" style={{border:"1.5px solid rgba(16,185,129,0.45)"}}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#065F46]/40">
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
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Location / Area <span style={{color:"#B91C1C"}}>*</span></Label>
                        <Input
                          {...form.register("property_location")}
                          placeholder="e.g., Downtown Dubai"
                          className="mt-1 bg-white/10 border border-white/25 text-white placeholder:text-white/90 focus-visible:ring-2 focus-visible:ring-[#0F5132] focus-visible:border-[#0F5132]" style={{border:"1.5px solid rgba(16,185,129,0.45)"}}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Community / Building Name</Label>
                      <Input
                        {...form.register("community_building")}
                        placeholder="e.g., Burj Khalifa, Palm Jumeirah"
                        className="bg-white/10 border border-white/25 text-white placeholder:text-white/70 mt-1"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Bedrooms</Label>
                        <Select
                          value={form.watch("bedrooms")?.toString()}
                          onValueChange={(v) => form.setValue("bedrooms", parseInt(v))}
                        >
                          <SelectTrigger className="mt-1 bg-white/10 border border-white/25 text-white" style={{border:"1.5px solid rgba(16,185,129,0.45)"}}>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#065F46]/40">
                            <SelectItem value="0">Studio</SelectItem>
                            <SelectItem value="1">1 BR</SelectItem>
                            <SelectItem value="2">2 BR</SelectItem>
                            <SelectItem value="3">3 BR</SelectItem>
                            <SelectItem value="4">4 BR</SelectItem>
                            <SelectItem value="5">5 BR</SelectItem>
                            <SelectItem value="6">6 BR</SelectItem>
                            <SelectItem value="7">7+ BR</SelectItem>

                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Size (sq.ft)</Label>
                        <Input
                          type="number"
                          {...form.register("property_size_sqft", { valueAsNumber: true })}
                          placeholder="e.g., 1500"
                          className="bg-white/10 border border-white/25 text-white placeholder:text-white/70 mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="font-semibold mb-3 block" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Property Status</Label>
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
                              className="border-[#B89555]/30"
                            />
                            <Label
                              htmlFor={`status-${option.value}`}
                              className="ml-2 text-white/70 cursor-pointer text-sm"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Additional Notes</Label>
                      <Textarea
                        {...form.register("property_notes")}
                        placeholder="Any other details about your property..."
                        className="bg-white/10 border border-white/25 text-white placeholder:text-white/70 mt-1 min-h-[100px]"
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
                      <h2 className="text-xl md:text-2xl font-bold mb-2" data-no-contrast-guard style={{background:"linear-gradient(135deg,#022C22 0%,#0F5132 50%,#064E3B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"-0.01em"}}>{pricingHeading}</h2>
                      <p className="text-sm" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",opacity:0.85}}>{isRent ? "Help us understand your rental expectations" : "Help us understand your pricing expectations"}</p>
                    </div>

                    <div>
                      <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>{purchasePriceLabel}</Label>
                      <Input
                        type="number"
                        {...form.register("purchase_price", { valueAsNumber: true })}
                        placeholder={isRent ? "Estimated current value" : "Original purchase price"}
                        className="bg-white/10 border border-white/25 text-white placeholder:text-white/70 mt-1"
                      />
                      <p className="text-white/70 text-xs mt-1">{isRent ? "Approximate current market value" : "What you paid for the property"}</p>
                    </div>

                    <div>
                      <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>{priceFieldLabel}</Label>
                      <Input
                        type="number"
                        {...form.register("target_selling_price", { valueAsNumber: true })}
                        placeholder={isRent ? "Your desired monthly rent" : "Your desired selling price"}
                        className="bg-white/10 border border-white/25 text-white placeholder:text-white/70 mt-1"
                      />
                    </div>

                    <div>
                      <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>{minPriceLabel}</Label>
                      <Input
                        type="number"
                        {...form.register("minimum_acceptable_price", { valueAsNumber: true })}
                        placeholder={isRent ? "Lowest monthly rent you'd accept" : "Lowest price you'd accept"}
                        className="bg-white/10 border border-white/25 text-white placeholder:text-white/70 mt-1"
                      />
                    </div>

                    <div>
                      <Label className="font-semibold mb-3 block" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>{urgencyLabel}</Label>
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
                              className="border-[#B89555]/30"
                            />
                            <Label
                              htmlFor={`urgency-${option.value}`}
                              className="ml-2 text-white/70 cursor-pointer text-sm"
                            >
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Property Evaluator Integration */}
                    <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Calculator className="w-5 h-5 text-white" />
                        <span className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Need help with pricing?</span>
                      </div>
                      <p className="text-white/70 text-sm mb-3">
                        Run our Property Evaluator to get an informational estimate based on market data.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#B89555] text-white hover:bg-[#EFE6D6]/10"
                        onClick={() => setShowEvaluator(true)}
                        disabled={!form.getValues("property_type") || !form.getValues("property_location")}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Run Property Evaluator
                      </Button>

                      {/* Show estimate if available */}
                      {form.watch("estimated_range_min") && form.watch("estimated_range_max") && (
                        <div className="mt-4 p-3 bg-[#EFE6D6]/10 border border-[#B89555]/20 rounded-lg">
                          <p className="text-white text-sm font-medium mb-1">AI Estimate (Informational Only)</p>
                          <p className="text-white">
                            AED {form.watch("estimated_range_min")?.toLocaleString()} - AED {form.watch("estimated_range_max")?.toLocaleString()}
                          </p>
                          <p className="text-white/70 text-xs mt-1">{form.watch("estimated_note")}</p>
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
                      <h2 className="text-xl md:text-2xl font-bold mb-2" data-no-contrast-guard style={{background:"linear-gradient(135deg,#022C22 0%,#0F5132 50%,#064E3B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"-0.01em"}}>Condition & Upgrades</h2>
                      <p className="text-sm" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",opacity:0.85}}>Tell us about the property's condition and any improvements</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="is_furnished"
                          checked={form.watch("is_furnished")}
                          onCheckedChange={(checked) => form.setValue("is_furnished", checked as boolean)}
                          className="border-[#B89555]/30"
                        />
                        <Label htmlFor="is_furnished" className="text-white cursor-pointer">
                          Property is furnished
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="has_upgrades"
                          checked={form.watch("has_upgrades")}
                          onCheckedChange={(checked) => form.setValue("has_upgrades", checked as boolean)}
                          className="border-[#B89555]/30"
                        />
                        <Label htmlFor="has_upgrades" className="text-white cursor-pointer">
                          Property has upgrades/renovations
                        </Label>
                      </div>
                    </div>

                    {form.watch("has_upgrades") && (
                      <div>
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Upgrade Details</Label>
                        <Textarea
                          {...form.register("upgrade_details")}
                          placeholder="Describe any upgrades, renovations, or improvements..."
                          className="bg-white/10 border border-white/25 text-white placeholder:text-white/70 mt-1 min-h-[100px]"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="font-semibold mb-3 block" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Key Highlights (up to 10)</Label>
                      <div className="flex gap-2 mb-3">
                        <Input
                          value={newHighlight}
                          onChange={(e) => setNewHighlight(e.target.value)}
                          placeholder="e.g., Sea view, Private pool, Smart home"
                          className="bg-white/10 border border-white/25 text-white placeholder:text-white/70"
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
                            className="inline-flex items-center gap-1 px-3 py-1 bg-[#EFE6D6]/10 text-white rounded-full text-sm border border-[#B89555]/20"
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
                        <Label className="font-semibold" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",fontSize:"13px",letterSpacing:"0.01em"}}>Listing Description</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateListingDescription}
                          disabled={isGeneratingDescription || !form.getValues("property_type")}
                          className="border-[#B89555] text-white hover:bg-[#EFE6D6]/10 text-xs"
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
                        className="bg-white/10 border border-white/25 text-white placeholder:text-white/70 mt-1 min-h-[150px]"
                      />
                      <p className="text-white/70 text-xs mt-1">
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
                      <h2 className="text-xl md:text-2xl font-bold mb-2" data-no-contrast-guard style={{background:"linear-gradient(135deg,#022C22 0%,#0F5132 50%,#064E3B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"-0.01em"}}>Media Uploads</h2>
                      <p className="text-sm" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",opacity:0.85}}>Upload photos and videos of your property</p>
                    </div>

                    <div className="space-y-6">
                      {/* Photos */}
                      <div>
                        <Label className="text-white font-medium mb-2 block">Property Photos</Label>
                        <div className="border-2 border-dashed border-[#B89555]/30 rounded-lg p-6 text-center hover:border-[#B89555] transition-colors bg-[#F7F2EA]">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label htmlFor="photo-upload" className="cursor-pointer">
                            <Camera className="w-8 h-8 text-white/70 mx-auto mb-2" />
                            <p className="text-white/70">Click to upload photos</p>
                            <p className="text-white/70 text-xs mt-1">JPG, PNG up to 10MB each</p>
                          </label>
                        </div>
                        {photoFiles.length > 0 && (
                          <p className="text-white text-sm mt-2">{photoFiles.length} photo(s) selected</p>
                        )}
                      </div>

                      {/* Videos */}
                      <div>
                        <Label className="text-white font-medium mb-2 block">Property Videos (optional)</Label>
                        <div className="border-2 border-dashed border-[#B89555]/30 rounded-lg p-6 text-center hover:border-[#B89555] transition-colors bg-[#F7F2EA]">
                          <input
                            type="file"
                            multiple
                            accept="video/*"
                            onChange={(e) => setVideoFiles(Array.from(e.target.files || []))}
                            className="hidden"
                            id="video-upload"
                          />
                          <label htmlFor="video-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-white/70 mx-auto mb-2" />
                            <p className="text-white/70">Click to upload videos</p>
                            <p className="text-white/70 text-xs mt-1">MP4, MOV up to 100MB each</p>
                          </label>
                        </div>
                        {videoFiles.length > 0 && (
                          <p className="text-white text-sm mt-2">{videoFiles.length} video(s) selected</p>
                        )}
                      </div>

                      {/* Floor Plans */}
                      <div>
                        <Label className="text-white font-medium mb-2 block">Floor Plans (optional)</Label>
                        <div className="border-2 border-dashed border-[#B89555]/30 rounded-lg p-6 text-center hover:border-[#B89555] transition-colors bg-[#F7F2EA]">
                          <input
                            type="file"
                            multiple
                            accept="image/*,application/pdf"
                            onChange={(e) => setFloorPlanFiles(Array.from(e.target.files || []))}
                            className="hidden"
                            id="floorplan-upload"
                          />
                          <label htmlFor="floorplan-upload" className="cursor-pointer">
                            <FileText className="w-8 h-8 text-white/70 mx-auto mb-2" />
                            <p className="text-white/70">Click to upload floor plans</p>
                            <p className="text-white/70 text-xs mt-1">PDF, JPG, PNG</p>
                          </label>
                        </div>
                        {floorPlanFiles.length > 0 && (
                          <p className="text-white text-sm mt-2">{floorPlanFiles.length} floor plan(s) selected</p>
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
                      <h2 className="text-xl md:text-2xl font-bold mb-2" data-no-contrast-guard style={{background:"linear-gradient(135deg,#022C22 0%,#0F5132 50%,#064E3B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"-0.01em"}}>Documents Vault</h2>
                      <p className="text-sm" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",opacity:0.85}}>Upload required documents securely. These are only visible to you and our team.</p>
                    </div>

                    <div className="bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg p-4 flex items-start gap-3">
                      <Shield className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <p className="text-white text-sm">
                        Your documents are encrypted and stored securely. Only authorized team members can access them.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Title Deed - REQUIRED */}
                      <div>
                        <Label className="text-white font-medium mb-2 flex items-center gap-2">
                          Title Deed <span className="text-red-500">*</span>
                          {!titleDeedFile && (
                            <span className="text-red-500 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Required
                            </span>
                          )}
                        </Label>
                        <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-[#F7F2EA] ${
 titleDeedFile ? 'border-[color:var(--emerald-1)]/30' : 'border-[#B89555]/30 hover:border-[#B89555]'
 }`}>
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => setTitleDeedFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="titledeed-upload"
                          />
                          <label htmlFor="titledeed-upload" className="cursor-pointer">
                            <FileText className="w-8 h-8 text-white/70 mx-auto mb-2" />
                            <p className="text-white/70">Upload Title Deed</p>
                          </label>
                        </div>
                        {titleDeedFile && (
                          <p className="text-[color:var(--emerald-1)] text-sm mt-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {titleDeedFile.name}
                          </p>
                        )}
                      </div>

                      {/* Passport/Emirates ID */}
                      <div>
                        <Label className="text-white font-medium mb-2 block">Passport / Emirates ID</Label>
                        <div className="border-2 border-dashed border-[#B89555]/30 rounded-lg p-6 text-center hover:border-[#B89555] transition-colors bg-[#F7F2EA]">
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
                            className="hidden"
                            id="passport-upload"
                          />
                          <label htmlFor="passport-upload" className="cursor-pointer">
                            <User className="w-8 h-8 text-white/70 mx-auto mb-2" />
                            <p className="text-white/70">Upload ID Document</p>
                          </label>
                        </div>
                        {passportFile && (
                          <p className="text-[color:var(--emerald-1)] text-sm mt-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {passportFile.name}
                          </p>
                        )}
                      </div>

                      {/* POA (Required if seller type is POA) */}
                      {form.watch("seller_type") === "poa" && (
                        <div>
                          <Label className="text-white font-medium mb-2 flex items-center gap-2">
                            Power of Attorney <span className="text-red-500">*</span>
                            {!poaFile && (
                              <span className="text-red-500 text-xs flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Required for POA
                              </span>
                            )}
                          </Label>
                          <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-[#F7F2EA] ${
 poaFile ? 'border-[color:var(--emerald-1)]/30' : 'border-[#B89555]/30 hover:border-[#B89555]'
 }`}>
                            <input
                              type="file"
                              accept="application/pdf,image/*"
                              onChange={(e) => setPoaFile(e.target.files?.[0] || null)}
                              className="hidden"
                              id="poa-upload"
                            />
                            <label htmlFor="poa-upload" className="cursor-pointer">
                              <FileText className="w-8 h-8 text-white/70 mx-auto mb-2" />
                              <p className="text-white/70">Upload POA Document</p>
                            </label>
                          </div>
                          {poaFile && (
                            <p className="text-[color:var(--emerald-1)] text-sm mt-2 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              {poaFile.name}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Additional Documents */}
                      <div>
                        <Label className="text-white font-medium mb-2 block">Additional Documents (optional)</Label>
                        <div className="border-2 border-dashed border-[#B89555]/30 rounded-lg p-6 text-center hover:border-[#B89555] transition-colors bg-[#F7F2EA]">
                          <input
                            type="file"
                            multiple
                            accept="application/pdf,image/*"
                            onChange={(e) => setAdditionalDocs(Array.from(e.target.files || []))}
                            className="hidden"
                            id="additional-upload"
                          />
                          <label htmlFor="additional-upload" className="cursor-pointer">
                            <Upload className="w-8 h-8 text-white/70 mx-auto mb-2" />
                            <p className="text-white/70">Upload any other documents</p>
                          </label>
                        </div>
                        {additionalDocs.length > 0 && (
                          <p className="text-white text-sm mt-2">{additionalDocs.length} additional document(s) selected</p>
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
                      <h2 className="text-xl md:text-2xl font-bold mb-2" data-no-contrast-guard style={{background:"linear-gradient(135deg,#022C22 0%,#0F5132 50%,#064E3B 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",letterSpacing:"-0.01em"}}>Review & Submit</h2>
                      <p className="text-sm" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",opacity:0.85}}>Please review your information before submitting</p>
                    </div>

                    <div className="space-y-4">
                      {/* Party Summary */}
                      <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {party} Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-white/70">Name:</p>
                          <p className="text-white">{form.getValues("seller_full_name")}</p>
                          <p className="text-white/70">Phone:</p>
                          <p className="text-white">{form.getValues("seller_phone")}</p>
                          <p className="text-white/70">Email:</p>
                          <p className="text-white">{form.getValues("seller_email")}</p>
                          <p className="text-white/70">Type:</p>
                          <p className="text-white capitalize">{form.getValues("seller_type")}</p>
                        </div>
                      </div>

                      {/* Property Summary */}
                      <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Property Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-white/70">Type:</p>
                          <p className="text-white capitalize">{form.getValues("property_type")}</p>
                          <p className="text-white/70">Location:</p>
                          <p className="text-white">{form.getValues("property_location")}</p>
                          {form.getValues("bedrooms") !== undefined && (
                            <>
                              <p className="text-white/70">Bedrooms:</p>
                              <p className="text-white">{form.getValues("bedrooms") === 0 ? "Studio" : form.getValues("bedrooms")}</p>
                            </>
                          )}
                          {form.getValues("property_size_sqft") && (
                            <>
                              <p className="text-white/70">Size:</p>
                              <p className="text-white">{form.getValues("property_size_sqft")?.toLocaleString()} sq.ft</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pricing Summary */}
                      <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Pricing
                        </h3>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-white/70">Target Price:</p>
                          <p className="text-white">AED {form.getValues("target_selling_price")?.toLocaleString()}</p>
                          <p className="text-white/70">Urgency:</p>
                          <p className="text-white">{form.getValues("selling_urgency")} days</p>
                        </div>
                      </div>

                      {/* Files Summary */}
                      <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-lg p-4">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Uploaded Files
                        </h3>
                        <div className="text-sm space-y-1">
                          <p className="text-white/70">{photoFiles.length} photos uploaded</p>
                          <p className="text-white/70">{videoFiles.length} videos uploaded</p>
                          <p className={`flex items-center gap-1 ${titleDeedFile ? 'text-[color:var(--emerald-1)]' : 'text-red-500'}`}>
                            {titleDeedFile ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            Title Deed {titleDeedFile ? '✓' : '(Required)'}
                          </p>
                          <p className="text-white/70">{passportFile ? "✓" : "✗"} ID Document</p>
                          {form.getValues("seller_type") === 'poa' && (
                            <p className={`flex items-center gap-1 ${poaFile ? 'text-[color:var(--emerald-1)]' : 'text-red-500'}`}>
                              {poaFile ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              POA Document {poaFile ? '✓' : '(Required)'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="flex items-start space-x-3 p-4 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-lg">
                      <Checkbox
                        id="submission_confirmed"
                        checked={form.watch("submission_confirmed")}
                        onCheckedChange={(checked) => form.setValue("submission_confirmed", checked as boolean)}
                        className="mt-1 border-[#B89555]/30"
                      />
                      <Label htmlFor="submission_confirmed" className="text-white cursor-pointer text-sm leading-relaxed">
                        I confirm that all the information provided above is accurate and complete. I understand that 
                        JBJ Global Real Estate will review my submission and contact me to discuss next steps.
                      </Label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons - Primary Style */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#0F5132]/25">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  disabled={currentStep === 1}
                  data-no-contrast-guard
                  className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-sm font-bold transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    color: "#FFFFFF",
                    WebkitTextFillColor: "#FFFFFF",
                    border: "1.5px solid #10B981",
                    boxShadow: "0 10px 24px -12px rgba(16,185,129,0.55)",
                  }}
                >
                  <ArrowLeft className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                  <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Previous</span>
                </button>

                {currentStep < 7 ? (
                  <button
                    type="button"
                    onClick={goToNextStep}
                    data-no-contrast-guard
                    className="inline-flex items-center gap-2 px-6 h-11 rounded-md text-sm font-bold transition-all hover:brightness-110"
                    style={{
                      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                      color: "#FFFFFF",
                      WebkitTextFillColor: "#FFFFFF",
                      border: "1.5px solid #10B981",
                      boxShadow: "0 10px 24px -12px rgba(16,185,129,0.55)",
                    }}
                  >
                    <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Next Step</span>
                    <ArrowRight className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                  </button>

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
        <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Property Evaluator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm" style={{color:"#FFFFFF",WebkitTextFillColor:"#FFFFFF",opacity:0.85}}>
              Run our AI-powered evaluator to get an informational estimate for your property based on current market data.
            </p>
            <div className="bg-[#F7F2EA]/50 rounded-lg p-4 space-y-2 text-sm">
              <p className="text-white/70"><span className="text-white/70">Type:</span> {form.getValues("property_type") || 'Not set'}</p>
              <p className="text-white/70"><span className="text-white/70">Location:</span> {form.getValues("property_location") || 'Not set'}</p>
              <p className="text-white/70"><span className="text-white/70">Bedrooms:</span> {form.getValues("bedrooms") === 0 ? 'Studio' : form.getValues("bedrooms") || 'Not set'}</p>
              <p className="text-white/70"><span className="text-white/70">Size:</span> {form.getValues("property_size_sqft")?.toLocaleString() || 'Not set'} sq.ft</p>
            </div>
            <p className="text-white/70 text-xs">
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
