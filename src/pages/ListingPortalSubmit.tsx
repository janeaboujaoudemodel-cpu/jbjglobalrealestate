import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Upload, Sparkles, Home, Building,
  Hotel, Key, FileText, Camera, Loader2, Wand2, X, Eye,
  MapPin, Bed, Bath, Maximize, DollarSign, Calendar, Star,
  CheckCircle2, AlertCircle, Image, File, Trash2, Plus, RefreshCw,
  TrendingUp, Shield, User, Phone, Mail, CreditCard
} from 'lucide-react';
import jbjMonogram from "@/assets/jbj-monogram-light-transparent.png";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { UNIFIED_APPROVAL_WORKFLOW } from '@/config/listing-approval-workflow';

// Types
interface ExtractedListing {
  title: string;
  description: string;
  listing_type: string;
  listing_category: string;
  property_type: string;
  developer_name: string;
  project_name: string;
  location: string;
  emirate: string;
  area: string;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  price: number | null;
  price_per_sqft: number | null;
  furnishing: string;
  handover_date: string;
  payment_plan: string;
  amenities: string[];
  key_features: string[];
  floor_plans_detected: number;
  gallery_images_detected: number;
  confidence_score: number;
  extracted_highlights: string[];
}

interface UploadedDoc {
  id: string;
  file: File;
  name: string;
  type: 'image' | 'pdf' | 'document';
  preview?: string;
  status: 'pending' | 'uploading' | 'ready';
}

interface PricePrediction {
  estimatedValue: { low: number; high: number; mid: number };
  marketInsights: string;
  completionStatus: string;
  pricePerSqft: number;
}

const listingCategories = [
  { id: 'secondary_offplan', label: 'Secondary / Off-Plan', icon: Home, desc: 'Resale or under-construction property' },
  { id: 'ready', label: 'Ready to Move', icon: Building, desc: 'Completed property' },
  { id: 'land', label: 'Land', icon: MapPin, desc: 'Plot or land for sale' },
  { id: 'rental', label: 'Rental', icon: Key, desc: 'For rent' },
  { id: 'holiday_home', label: 'Holiday Home', icon: Hotel, desc: 'Short-term rental' },
];

const propertyTypes = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Duplex', 'Land', 'Office', 'Warehouse', 'Shop'];
const furnishingOptions = ['Furnished', 'Unfurnished', 'Semi-Furnished'];
const emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

const sellerRoles = [
  { value: 'owner', label: 'Property Owner' },
  { value: 'broker', label: 'Broker' },
  { value: 'investor', label: 'Investor' },
  { value: 'representative', label: 'Representative (POA)' },
];

// Pricing: Half of Property Finder/Bayut (~AED 300-500 per listing)
const LISTING_FEES = {
  direct: { amount: 199, label: 'AED 199', description: 'Your direct contact details shown on listing' },
  commission: { amount: 0, label: 'Free', description: 'JBJ handles enquiries. 1% sale / 5% rental commission on success' },
};

const PHASES = ['Upload', 'AI Extract', 'Price Predictor', 'Review & Edit', 'Pricing & Role', 'Submit for Approval'] as const;

const SESSION_KEY = 'jbj_listing_creator_state';

const ListingPortalSubmit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isOwner } = useAuth();
  const creatorRef = useRef<HTMLDivElement>(null);
  
  // Read purpose from URL: ?purpose=sale or ?purpose=rent
  const urlPurpose = searchParams.get('purpose');
  const initialListingType = urlPurpose === 'rent' ? 'rent' : 'sale';
  const initialCategory = urlPurpose === 'rent' ? 'rental' : 'secondary_offplan';

  // Restore from sessionStorage on mount
  const savedState = (() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();
  
  const [phase, setPhase] = useState<'upload' | 'extracting' | 'pricing_ai' | 'review' | 'pricing_role' | 'submitting' | 'success'>(
    savedState?.phase && savedState.phase !== 'success' ? savedState.phase : 'upload'
  );
  const [listingCategory, setListingCategory] = useState(savedState?.listingCategory || initialCategory);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedListing | null>(savedState?.extractedData || null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>(savedState?.uploadedImageUrls || []);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [pricePrediction, setPricePrediction] = useState<PricePrediction | null>(savedState?.pricePrediction || null);
  const [isRunningPredictor, setIsRunningPredictor] = useState(false);
  const [sellerRole, setSellerRole] = useState(savedState?.sellerRole || 'owner');
  const [contactMode, setContactMode] = useState<'direct' | 'commission'>(savedState?.contactMode || 'commission');
  
  const [form, setForm] = useState(savedState?.form || {
    title: '', description: '', listing_type: initialListingType, listing_category: initialCategory,
    property_type: '', developer_name: '', project_name: '',
    location: '', emirate: 'Dubai', area: '',
    bedrooms: '', bathrooms: '', area_sqft: '', price: '',
    furnishing: '', handover_date: '', payment_plan: '',
    amenities: [] as string[], key_features: [] as string[],
  });

  // Persist state to sessionStorage on changes
  useEffect(() => {
    if (phase === 'success') {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    const stateToSave = { phase, form, listingCategory, uploadedImageUrls, extractedData, pricePrediction, sellerRole, contactMode };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stateToSave));
  }, [phase, form, listingCategory, uploadedImageUrls, extractedData, pricePrediction, sellerRole, contactMode]);

  // Scroll to creator section on phase changes
  useEffect(() => {
    if (creatorRef.current) {
      const headerOffset = 100;
      const elementTop = creatorRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, elementTop - headerOffset), behavior: 'smooth' });
    }
  }, [phase]);

  const getPhaseIndex = () => {
    switch (phase) {
      case 'upload': return 0;
      case 'extracting': return 1;
      case 'pricing_ai': return 2;
      case 'review': return 3;
      case 'pricing_role': return 4;
      case 'submitting': return 5;
      default: return 0;
    }
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  if (!user) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-black text-xl font-bold mb-4">Please sign in to submit a listing</h2>
          <Button onClick={() => navigate('/auth')} className="bg-gold hover:bg-gold/90 text-black border-0">
            Sign In
          </Button>
        </div>
      </section>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newDocs: UploadedDoc[] = files.map(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        type: isImage ? 'image' : isPdf ? 'pdf' : 'document',
        preview: isImage ? URL.createObjectURL(file) : undefined,
        status: 'pending' as const,
      };
    });
    setUploadedDocs(prev => [...prev, ...newDocs]);
  };

  const removeDoc = (id: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== id));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const runAIExtraction = async () => {
    if (uploadedDocs.length === 0) {
      toast.error('Please upload at least one document');
      return;
    }
    
    setPhase('extracting');
    
    try {
      const documents = [];
      const imageUrls: string[] = [];

      for (const doc of uploadedDocs) {
        const base64 = await fileToBase64(doc.file);
        
        if (doc.type === 'image') {
          documents.push({ type: 'image', name: doc.name, base64, mime_type: doc.file.type });
          const fileName = `${user.id}/listings/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error } = await supabase.storage.from('listing-documents').upload(fileName, doc.file, { contentType: doc.file.type });
          if (!error) {
            const { data: urlData } = supabase.storage.from('listing-documents').getPublicUrl(fileName);
            imageUrls.push(urlData.publicUrl);
          }
        } else if (doc.type === 'pdf') {
          documents.push({ type: 'image', name: doc.name, base64, mime_type: 'application/pdf' });
          const fileName = `${user.id}/listings/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          await supabase.storage.from('listing-documents').upload(fileName, doc.file, { contentType: doc.file.type });
        } else {
          documents.push({ type: 'text', name: doc.name, content: await doc.file.text() });
        }
      }

      setUploadedImageUrls(imageUrls);

      const { data, error } = await supabase.functions.invoke('ai-listing-extractor', {
        body: { documents, listing_category: listingCategory }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Extraction failed');

      const extracted = data.data as ExtractedListing;
      setExtractedData(extracted);

      setForm({
        title: extracted.title || '',
        description: extracted.description || '',
        listing_type: extracted.listing_type || 'sale',
        listing_category: extracted.listing_category || listingCategory,
        property_type: extracted.property_type || '',
        developer_name: extracted.developer_name || '',
        project_name: extracted.project_name || '',
        location: extracted.location || '',
        emirate: extracted.emirate || 'Dubai',
        area: extracted.area || '',
        bedrooms: extracted.bedrooms?.toString() || '',
        bathrooms: extracted.bathrooms?.toString() || '',
        area_sqft: extracted.area_sqft?.toString() || '',
        price: extracted.price?.toString() || '',
        furnishing: extracted.furnishing || '',
        handover_date: extracted.handover_date || '',
        payment_plan: extracted.payment_plan || '',
        amenities: extracted.amenities || [],
        key_features: extracted.key_features || [],
      });

      setPhase('pricing_ai');
      toast.success(`AI extracted ${Object.values(extracted).filter(v => v !== null && v !== '' && v !== undefined).length} fields from your documents!`);

    } catch (err: any) {
      console.error('Extraction error:', err);
      toast.error(err.message || 'AI extraction failed. You can fill in details manually.');
      setPhase('pricing_ai');
    }
  };

  const runPricePredictor = async () => {
    setIsRunningPredictor(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-price-predictor', {
        body: {
          location: form.location || form.area || '',
          propertyType: form.property_type?.toLowerCase() || 'apartment',
          bedrooms: form.bedrooms || '2',
          size: form.area_sqft || '',
          developerName: form.developer_name || '',
          projectName: form.project_name || '',
          completionYear: form.handover_date || '',
          currentPrice: form.price || '',
          paymentPlan: form.payment_plan || '',
          amenities: form.amenities || [],
          keyFeatures: form.key_features || [],
          listingCategory: listingCategory || '',
          furnishing: form.furnishing || '',
          bathrooms: form.bathrooms || '',
          emirate: form.emirate || 'Dubai',
        }
      });

      if (error) throw error;

      if (data?.success && data?.estimatedPrice) {
        const band = data.confidenceBand || { low: 0, mid: data.estimatedPrice, high: 0 };
        setPricePrediction({
          estimatedValue: { 
            low: band.low || Math.round(data.estimatedPrice * 0.9), 
            mid: band.mid || data.estimatedPrice, 
            high: band.high || Math.round(data.estimatedPrice * 1.1) 
          },
          marketInsights: data.prediction || data.marketPositionReason || '',
          completionStatus: data.constructionProgress || data.marketPosition || 'N/A',
          pricePerSqft: data.pricePerSqFt || 0,
        });
        if (!form.price && (band.mid || data.estimatedPrice)) {
          setForm(f => ({ ...f, price: Math.round(band.mid || data.estimatedPrice).toString() }));
        }
        toast.success('AI Price prediction complete!');
      } else {
        throw new Error('No estimate returned');
      }
    } catch (err: any) {
      console.error('Price predictor error:', err);
      // Fallback: client-side basic estimate
      const size = form.area_sqft ? parseFloat(form.area_sqft) : 1000;
      const avgPricePerSqft = 1200;
      const mid = Math.round(size * avgPricePerSqft);
      setPricePrediction({
        estimatedValue: { low: Math.round(mid * 0.85), high: Math.round(mid * 1.15), mid },
        marketInsights: 'Basic estimate based on Dubai average pricing. AI-powered analysis was unavailable.',
        completionStatus: 'Basic Estimate',
        pricePerSqft: avgPricePerSqft,
      });
      if (!form.price) {
        setForm(f => ({ ...f, price: mid.toString() }));
      }
      toast.info('Using basic price estimate (AI unavailable)');
    } finally {
      setIsRunningPredictor(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error('Please provide a listing title');
      return;
    }
    
    setPhase('submitting');
    
    try {
      const { data, error } = await supabase
        .from('portal_listings')
        .insert({
          user_id: user.id,
          listing_type: form.listing_type,
          listing_category: form.listing_category,
          title: form.title,
          description: form.description,
          location: form.location,
          emirate: form.emirate,
          area: form.area,
          price: form.price ? parseFloat(form.price) : null,
          currency: 'AED',
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
          area_sqft: form.area_sqft ? parseFloat(form.area_sqft) : null,
          property_type: form.property_type,
          furnishing: form.furnishing,
          images: uploadedImageUrls,
          developer_name: form.developer_name || null,
          project_name: form.project_name || null,
          handover_date: form.handover_date || null,
          payment_plan: form.payment_plan || null,
          amenities: form.amenities,
          key_features: form.key_features,
          ai_extracted_data: extractedData || {},
          ai_quality_score: extractedData?.confidence_score || 0,
          source_documents: uploadedDocs.map(d => ({ name: d.name, type: d.type })),
          gallery_images: uploadedImageUrls,
          status: isOwner ? 'approved' : 'pending',
          contact_mode: contactMode,
          listing_fee: contactMode === 'direct' ? LISTING_FEES.direct.amount : 0,
          seller_role: sellerRole,
          approval_status: isOwner ? 'approved' : 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Create approval workflow entries
      if (!isOwner) {
        const approvalEntries = UNIFIED_APPROVAL_WORKFLOW.map(step => ({
          listing_id: data.id,
          listing_type: 'portal_listing',
          step_number: step.step,
          step_name: step.name,
          approver_role: step.role,
          approver_name: step.approverName,
          approver_email: step.approverEmail,
          approver_photo: step.approverPhoto,
          approver_title: step.approverTitle,
          approver_department: step.approverDepartment,
          status: 'pending',
        }));

        await supabase.from('listing_approvals').insert(approvalEntries as any);
      } else {
        // Owner self-approval — only step 4
        await supabase.from('listing_approvals').insert({
          listing_id: data.id,
          listing_type: 'portal_listing',
          step_number: 4,
          step_name: 'Final Approval',
          approver_role: 'founder',
          approver_name: 'Jane Bou Jaoude',
          approver_email: 'janeabujaudenails@gmail.com',
          approver_photo: '',
          approver_title: 'Founder & CEO',
          approver_department: 'Executive',
          status: 'approved',
          approved_at: new Date().toISOString(),
        } as any);
      }

      // Run AI scoring (non-blocking)
      try {
        const { data: scoreResult } = await supabase.functions.invoke('listing-score', {
          body: { listing: { ...form, images_count: uploadedImageUrls.length, source: 'ai_extraction' } }
        });
        if (scoreResult?.score) {
          await supabase.from('portal_listings').update({
            ai_quality_score: scoreResult.score.overall_score,
            ai_extracted_data: { ...(extractedData || {}), ai_score: scoreResult.score },
          } as any).eq('id', data.id);
        }
      } catch (scoreErr) {
        console.warn('AI scoring failed (non-blocking):', scoreErr);
      }

      setSubmittedId(data.id);
      setPhase('success');
      toast.success(isOwner ? 'Listing approved and published!' : 'Listing submitted for approval!');

    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error('Failed to submit listing. Please try again.');
      setPhase('pricing_role');
    }
  };

  // ========== SUCCESS PHASE ==========
  if (phase === 'success') {
    return (
      <section className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-black mb-4">
              {isOwner ? 'Listing Approved & Published!' : 'Listing Submitted for Approval!'}
            </h1>
            <p className="text-zinc-600 mb-8">
              {isOwner 
                ? 'Your listing has been approved and is now live on the portal.'
                : 'Your listing has been submitted for review. You will receive notifications as it progresses through approval stages.'}
            </p>

            {/* Approval Workflow Visual */}
            {!isOwner && (
              <div className="bg-white/70 border-2 border-gold/20 rounded-xl p-6 mb-8 text-left">
                <h3 className="text-gold font-semibold mb-4">Approval Stages</h3>
                <div className="space-y-3">
                  {UNIFIED_APPROVAL_WORKFLOW.map((step) => (
                    <div key={step.step} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold text-xs font-bold">{step.step}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-black text-sm font-medium">{step.name}</p>
                        <p className="text-zinc-500 text-xs">{step.approverName} — {step.approverTitle}</p>
                      </div>
                      <Badge className="bg-gold/10 text-gold border-gold/30 text-xs">Pending</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/listing-portal/my-listings')} className="bg-gold hover:bg-gold/90 text-black border-0">
                View My Listings
              </Button>
              <Button onClick={() => navigate('/listing-portal')} className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 text-black hover:border-gold">
                Back to Portal
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="relative py-12 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div ref={creatorRef} className="max-w-3xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/listing-portal')} className="text-zinc-600 hover:text-black mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
            </Button>

            {/* Header */}
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-gold/15 text-gold border-gold/40 px-4 py-1.5">
                <Wand2 className="w-3.5 h-3.5 mr-2" /> AI-Powered
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-black mb-2">
                Smart Listing Creator
              </h1>
              <p className="text-zinc-600 text-sm">
                Upload your documents and let AI create a professional listing for you
              </p>
            </div>

            {/* Progress indicator — 6 steps */}
            <div className="flex gap-1.5 mb-8">
              {PHASES.map((step, i) => {
                const stepIndex = getPhaseIndex();
                return (
                  <div key={step} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all ${i <= stepIndex ? 'bg-gold' : 'bg-gold/20'}`} />
                    <p className={`text-[9px] mt-1 text-center ${i <= stepIndex ? 'text-gold' : 'text-zinc-400'}`}>{step}</p>
                  </div>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {/* ========== UPLOAD PHASE ========== */}
              {phase === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 -m-3 rounded-3xl bg-white/40 border border-gold/15" />
                    <div className="relative space-y-6 p-3">
                      {/* Category Selection */}
                      <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                        <h2 className="text-black font-semibold mb-4">What type of listing?</h2>
                        <div className="flex flex-wrap justify-center gap-3">
                          {listingCategories.map(cat => {
                            const Icon = cat.icon;
                            const isSelected = listingCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => setListingCategory(cat.id)}
                                className={`relative p-4 rounded-2xl border-2 text-left transition-all w-[calc(33.333%-0.5rem)] min-w-[160px] ${
                                  isSelected
                                    ? 'bg-gold/10 border-gold/50 text-black shadow-lg shadow-gold/15'
                                    : 'bg-white/60 border-gold/15 text-zinc-600 hover:border-gold/30'
                                }`}
                              >
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                                <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-gold' : 'text-zinc-400'}`} />
                                <div className="font-medium text-sm">{cat.label}</div>
                                <div className="text-xs text-zinc-500">{cat.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Upload Zone */}
                      <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                        <h2 className="text-black font-semibold mb-2">Upload Documents</h2>
                        <p className="text-zinc-500 text-xs mb-4">
                          Upload PDF brochures, floor plans, fact sheets, property photos, reservation forms, agreements — AI will extract everything
                        </p>
                        
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleFileDrop}
                          className="border-2 border-dashed border-gold/40 rounded-xl p-8 text-center hover:border-gold/70 transition-all cursor-pointer bg-[#FDFBF7]/50"
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <Upload className="w-10 h-10 text-gold mx-auto mb-3" />
                          <p className="text-black font-medium mb-1">Drop files here or click to browse</p>
                          <p className="text-zinc-500 text-xs">
                            PDF, JPG, PNG, DOCX, XLSX — up to 20MB each
                          </p>
                          <input
                            id="file-input"
                            type="file"
                            multiple
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>

                        {uploadedDocs.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {uploadedDocs.map(doc => (
                              <div key={doc.id} className="flex items-center gap-3 bg-white/80 border border-gold/20 rounded-lg p-3">
                                {doc.preview ? (
                                  <img src={doc.preview} alt="" className="w-10 h-10 rounded object-cover" />
                                ) : doc.type === 'pdf' ? (
                                  <div className="w-10 h-10 bg-red-500/10 rounded flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-red-500" />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center">
                                    <File className="w-5 h-5 text-blue-500" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-black text-sm truncate">{doc.name}</p>
                                  <p className="text-zinc-500 text-xs">
                                    {(doc.file.size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                </div>
                                <button onClick={() => removeDoc(doc.id)} className="p-1.5 hover:bg-gold/10 rounded-lg">
                                  <X className="w-4 h-4 text-zinc-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={runAIExtraction}
                          disabled={uploadedDocs.length === 0}
                          className="flex-1 bg-gold hover:bg-gold/90 text-black border-0 h-12 text-base disabled:opacity-50"
                        >
                          <Sparkles className="w-5 h-5 mr-2" />
                          Extract with AI ({uploadedDocs.length} {uploadedDocs.length === 1 ? 'file' : 'files'})
                        </Button>
                        <Button
                          onClick={() => setPhase('pricing_ai')}
                          className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 text-black hover:border-gold h-12"
                        >
                          Skip — Fill Manually
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========== EXTRACTING PHASE ========== */}
              {phase === 'extracting' && (
                <motion.div
                  key="extracting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/70 border-2 border-gold/20 rounded-2xl p-12 text-center"
                >
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <img
                      src={jbjMonogram}
                      alt="Loading"
                      className="w-full h-full object-contain animate-pulse"
                      style={{ filter: "drop-shadow(0 0 20px rgba(200,167,102,0.4))" }}
                    />
                  </div>
                  <h2 className="text-black text-xl font-bold mb-2">AI is analyzing your documents...</h2>
                  <p className="text-zinc-600 text-sm mb-6">
                    Extracting property details, images, floor plans, and generating your listing
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Reading documents', 'Detecting images', 'Extracting details', 'Generating description'].map((step) => (
                      <Badge key={step} className="bg-gold/10 text-gold border-gold/30">
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        {step}
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ========== PRICE PREDICTOR PHASE ========== */}
              {phase === 'pricing_ai' && (
                <motion.div
                  key="pricing_ai"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 -m-3 rounded-3xl bg-white/40 border border-gold/15" />
                    <div className="relative space-y-6 p-3">
                      <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-gold" />
                          </div>
                          <div>
                            <h2 className="text-black font-bold text-lg">AI Price Predictor</h2>
                            <p className="text-zinc-500 text-xs">Get an AI-powered market price estimate based on location, size, and market data</p>
                          </div>
                        </div>

                        {/* Quick summary of extracted data */}
                        {extractedData && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-3 text-center">
                              <MapPin className="w-4 h-4 text-gold mx-auto mb-1" />
                              <p className="text-xs text-zinc-500">Location</p>
                              <p className="text-black text-sm font-medium truncate">{form.location || 'N/A'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-3 text-center">
                              <Bed className="w-4 h-4 text-gold mx-auto mb-1" />
                              <p className="text-xs text-zinc-500">Bedrooms</p>
                              <p className="text-black text-sm font-medium">{form.bedrooms || 'N/A'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-3 text-center">
                              <Maximize className="w-4 h-4 text-gold mx-auto mb-1" />
                              <p className="text-xs text-zinc-500">Area</p>
                              <p className="text-black text-sm font-medium">{form.area_sqft ? `${parseInt(form.area_sqft).toLocaleString()} sqft` : 'N/A'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/20 rounded-lg p-3 text-center">
                              <Building className="w-4 h-4 text-gold mx-auto mb-1" />
                              <p className="text-xs text-zinc-500">Type</p>
                              <p className="text-black text-sm font-medium capitalize">{form.property_type || 'N/A'}</p>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={runPricePredictor}
                          disabled={isRunningPredictor}
                          className="w-full bg-gold hover:bg-gold/90 text-black border-0 h-12 text-base"
                        >
                          {isRunningPredictor ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Market Data...</>
                          ) : (
                            <><TrendingUp className="w-5 h-5 mr-2" /> Run Price Prediction</>
                          )}
                        </Button>

                        {/* Price Prediction Results */}
                        {pricePrediction && (
                          <div className="mt-6 space-y-4">
                            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-5">
                              <h3 className="text-black font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                Estimated Market Value
                              </h3>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-zinc-500 text-xs mb-1">Low</p>
                                  <p className="text-black font-bold text-lg">AED {pricePrediction.estimatedValue.low.toLocaleString()}</p>
                                </div>
                                <div className="border-x border-emerald-200">
                                  <p className="text-zinc-500 text-xs mb-1">Recommended</p>
                                  <p className="text-emerald-700 font-bold text-xl">AED {pricePrediction.estimatedValue.mid.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 text-xs mb-1">High</p>
                                  <p className="text-black font-bold text-lg">AED {pricePrediction.estimatedValue.high.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>

                            {pricePrediction.marketInsights && (
                              <div className="bg-white/80 border border-gold/20 rounded-xl p-4">
                                <p className="text-zinc-600 text-sm">{pricePrediction.marketInsights}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setPhase('upload')}
                          className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 text-black hover:border-gold h-12"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button
                          onClick={() => setPhase('review')}
                          className="flex-1 bg-gold hover:bg-gold/90 text-black border-0 h-12 text-base"
                        >
                          Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========== REVIEW PHASE ========== */}
              {phase === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 -m-3 rounded-3xl bg-white/40 border border-gold/15" />
                    <div className="relative space-y-6 p-3">
                      {/* AI Confidence Banner */}
                      {extractedData && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
                          extractedData.confidence_score >= 80 
                            ? 'bg-emerald-50 border-emerald-300' 
                            : extractedData.confidence_score >= 50 
                            ? 'bg-amber-50 border-amber-300' 
                            : 'bg-red-50 border-red-300'
                        }`}>
                          {extractedData.confidence_score >= 80 ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-black text-sm font-medium">
                              AI Confidence: {extractedData.confidence_score}%
                            </p>
                            <p className="text-zinc-600 text-xs">
                              {extractedData.confidence_score >= 80 
                                ? 'High confidence — review and continue' 
                                : 'Please review and edit the details below'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setPhase('upload'); }}
                            className="text-zinc-600 hover:text-black"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" /> Re-extract
                          </Button>
                        </div>
                      )}

                      {/* Listing Card Preview */}
                      {(form.title || uploadedImageUrls.length > 0) && (
                        <div className="bg-white border-2 border-gold/30 rounded-2xl overflow-hidden shadow-sm">
                          <div className="relative">
                            {uploadedImageUrls.length > 0 ? (
                              <img src={uploadedImageUrls[0]} alt="" className="w-full h-48 object-cover" />
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] flex items-center justify-center">
                                <Image className="w-12 h-12 text-gold/30" />
                              </div>
                            )}
                            {form.listing_category && (
                              <Badge className="absolute top-3 left-3 bg-black/70 text-white border-0 text-xs">
                                {listingCategories.find(c => c.id === form.listing_category)?.label}
                              </Badge>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="text-black font-bold text-lg mb-1">{form.title || 'Untitled Listing'}</h3>
                            <p className="text-zinc-500 text-sm flex items-center gap-1 mb-3">
                              <MapPin className="w-3.5 h-3.5" /> {form.location || form.emirate}
                            </p>
                            <div className="flex items-center gap-4 text-zinc-600 text-sm mb-3">
                              {form.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {form.bedrooms} BR</span>}
                              {form.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {form.bathrooms} BA</span>}
                              {form.area_sqft && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {parseInt(form.area_sqft).toLocaleString()} sqft</span>}
                            </div>
                            {form.price && (
                              <p className="text-gold font-bold text-xl">AED {parseInt(form.price).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Gallery Preview */}
                      {uploadedImageUrls.length > 1 && (
                        <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                          <h3 className="text-black font-semibold mb-3 flex items-center gap-2">
                            <Image className="w-4 h-4 text-gold" />
                            Gallery ({uploadedImageUrls.length} photos)
                          </h3>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {uploadedImageUrls.map((url, i) => (
                              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-gold/20">
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Main Details Form */}
                      <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6 space-y-4">
                        <h3 className="text-black font-semibold mb-1">Listing Details</h3>
                        
                        <div>
                          <label className="text-xs text-zinc-600 mb-1 block">Title *</label>
                          <Input
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="e.g. Luxury 3BR Villa in Palm Jumeirah"
                            className="bg-white border-gold/30 text-black"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-zinc-600 mb-1 block">Description</label>
                          <Textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Property description..."
                            className="bg-white border-gold/30 text-black min-h-[100px]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Category</label>
                            <Select value={form.listing_category} onValueChange={v => setForm(f => ({ ...f, listing_category: v }))}>
                              <SelectTrigger className="bg-white border-gold/30 text-black">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {listingCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Property Type</label>
                            <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                              <SelectTrigger className="bg-white border-gold/30 text-black">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {propertyTypes.map(t => <SelectItem key={t} value={t.toLowerCase()}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Developer</label>
                            <Input
                              value={form.developer_name}
                              onChange={e => setForm(f => ({ ...f, developer_name: e.target.value }))}
                              placeholder="e.g. Emaar"
                              className="bg-white border-gold/30 text-black"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Project / Building</label>
                            <Input
                              value={form.project_name}
                              onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
                              placeholder="e.g. Creek Harbour"
                              className="bg-white border-gold/30 text-black"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Emirate</label>
                            <Select value={form.emirate} onValueChange={v => setForm(f => ({ ...f, emirate: v }))}>
                              <SelectTrigger className="bg-white border-gold/30 text-black">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {emirates.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Location / Area</label>
                            <Input
                              value={form.location}
                              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                              placeholder="e.g. Dubai Marina"
                              className="bg-white border-gold/30 text-black"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Price (AED)</label>
                            <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-white border-gold/30 text-black" />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Bedrooms</label>
                            <Input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} className="bg-white border-gold/30 text-black" />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Bathrooms</label>
                            <Input type="number" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} className="bg-white border-gold/30 text-black" />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Area (sqft)</label>
                            <Input type="number" value={form.area_sqft} onChange={e => setForm(f => ({ ...f, area_sqft: e.target.value }))} className="bg-white border-gold/30 text-black" />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Furnishing</label>
                            <Select value={form.furnishing} onValueChange={v => setForm(f => ({ ...f, furnishing: v }))}>
                              <SelectTrigger className="bg-white border-gold/30 text-black">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {furnishingOptions.map(f => <SelectItem key={f} value={f.toLowerCase().replace(' ', '_')}>{f}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Handover</label>
                            <Input value={form.handover_date} onChange={e => setForm(f => ({ ...f, handover_date: e.target.value }))} placeholder="e.g. Q4 2026" className="bg-white border-gold/30 text-black" />
                          </div>
                          <div>
                            <label className="text-xs text-zinc-600 mb-1 block">Payment Plan</label>
                            <Input value={form.payment_plan} onChange={e => setForm(f => ({ ...f, payment_plan: e.target.value }))} placeholder="e.g. 60/40" className="bg-white border-gold/30 text-black" />
                          </div>
                        </div>
                      </div>

                      {/* Key Features */}
                      {form.key_features.length > 0 && (
                        <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                          <h3 className="text-black font-semibold mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4 text-gold" />
                            Key Features
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {form.key_features.map((f, i) => (
                              <Badge key={i} className="bg-gold/10 text-gold border-gold/30 px-3 py-1">
                                {f}
                                <button onClick={() => setForm(prev => ({ ...prev, key_features: prev.key_features.filter((_, idx) => idx !== i) }))} className="ml-2">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amenities */}
                      {form.amenities.length > 0 && (
                        <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                          <h3 className="text-black font-semibold mb-3">Amenities</h3>
                          <div className="flex flex-wrap gap-2">
                            {form.amenities.map((a, i) => (
                              <Badge key={i} className="bg-white border-gold/20 text-zinc-700 px-3 py-1">
                                {a}
                                <button onClick={() => setForm(prev => ({ ...prev, amenities: prev.amenities.filter((_, idx) => idx !== i) }))} className="ml-2">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setPhase('pricing_ai')}
                          className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 text-black hover:border-gold h-12"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button
                          onClick={() => setPhase('pricing_role')}
                          disabled={!form.title.trim()}
                          className="flex-1 bg-gold hover:bg-gold/90 text-black border-0 h-12 text-base disabled:opacity-50"
                        >
                          Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========== PRICING & ROLE PHASE ========== */}
              {phase === 'pricing_role' && (
                <motion.div
                  key="pricing_role"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 -m-3 rounded-3xl bg-white/40 border border-gold/15" />
                    <div className="relative space-y-6 p-3">
                      {/* Role Selection */}
                      <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                        <h3 className="text-black font-semibold mb-4 flex items-center gap-2">
                          <User className="w-4 h-4 text-gold" />
                          Your Role
                        </h3>
                        <RadioGroup value={sellerRole} onValueChange={setSellerRole} className="grid grid-cols-2 gap-3">
                          {sellerRoles.map(role => (
                            <div key={role.value} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                              sellerRole === role.value ? 'bg-gold/10 border-gold/50 shadow-md shadow-gold/10' : 'bg-white/60 border-gold/15 hover:border-gold/30'
                            }`}>
                              <RadioGroupItem value={role.value} id={`role-${role.value}`} className="border-gold/50" />
                              <Label htmlFor={`role-${role.value}`} className="text-black text-sm cursor-pointer">{role.label}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Contact & Pricing Model */}
                      <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                        <h3 className="text-black font-semibold mb-2 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gold" />
                          Listing Contact & Pricing
                        </h3>
                        <p className="text-zinc-500 text-xs mb-4">Choose how enquiries are handled for your listing</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Direct Contact Option */}
                          <button
                            onClick={() => setContactMode('direct')}
                            className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                              contactMode === 'direct' 
                                ? 'bg-gold/10 border-gold/50 shadow-lg shadow-gold/15' 
                                : 'bg-white/60 border-gold/15 hover:border-gold/30'
                            }`}
                          >
                            {contactMode === 'direct' && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4 text-gold" />
                              <span className="text-black font-semibold text-sm">Direct Contact</span>
                            </div>
                            <p className="text-gold font-bold text-lg mb-1">{LISTING_FEES.direct.label}</p>
                            <p className="text-zinc-500 text-xs">{LISTING_FEES.direct.description}</p>
                            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-2">
                              <p className="text-emerald-700 text-xs font-medium">50% less than Property Finder & Bayut</p>
                            </div>
                          </button>

                          {/* Commission Option */}
                          <button
                            onClick={() => setContactMode('commission')}
                            className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                              contactMode === 'commission' 
                                ? 'bg-gold/10 border-gold/50 shadow-lg shadow-gold/15' 
                                : 'bg-white/60 border-gold/15 hover:border-gold/30'
                            }`}
                          >
                            {contactMode === 'commission' && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-gold" />
                              <span className="text-black font-semibold text-sm">Commission-Based</span>
                            </div>
                            <p className="text-gold font-bold text-lg mb-1">{LISTING_FEES.commission.label}</p>
                            <p className="text-zinc-500 text-xs">{LISTING_FEES.commission.description}</p>
                            <div className="mt-3 bg-gold/5 border border-gold/20 rounded-2xl p-2">
                              <p className="text-gold text-xs font-medium">JBJ handles all enquiries professionally</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Approval Preview */}
                      {!isOwner && (
                        <div className="bg-white/70 border-2 border-gold/20 rounded-2xl p-6">
                          <h3 className="text-black font-semibold mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gold" />
                            Approval Workflow
                          </h3>
                          <p className="text-zinc-500 text-xs mb-4">Your listing will go through these approval stages before publishing</p>
                          <div className="space-y-3">
                            {UNIFIED_APPROVAL_WORKFLOW.map((step) => (
                              <div key={step.step} className="flex items-center gap-3">
                                <img src={step.approverPhoto} alt="" className="w-9 h-9 rounded-full object-cover border border-gold/30" />
                                <div className="flex-1">
                                  <p className="text-black text-sm font-medium">{step.name}</p>
                                  <p className="text-zinc-500 text-xs">{step.approverName} — {step.approverTitle}</p>
                                </div>
                                <Badge className="bg-gold/10 text-gold border-gold/30 text-xs">Step {step.step}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isOwner && (
                        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            <div>
                              <p className="text-black font-semibold text-sm">Owner Auto-Approval</p>
                              <p className="text-zinc-600 text-xs">As the Owner, your listing will be approved and published immediately upon submission.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setPhase('review')}
                          className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 text-black hover:border-gold h-12"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          className="flex-1 bg-gold hover:bg-gold/90 text-black border-0 h-12 text-base"
                        >
                          <Check className="w-5 h-5 mr-2" />
                          {isOwner ? 'Approve & Publish' : 'Submit for Approval'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========== SUBMITTING PHASE ========== */}
              {phase === 'submitting' && (
                <motion.div
                  key="submitting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/70 border-2 border-gold/20 rounded-2xl p-12 text-center"
                >
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <img
                      src={jbjMonogram}
                      alt="Loading"
                      className="w-full h-full object-contain animate-pulse"
                      style={{ filter: "drop-shadow(0 0 20px rgba(200,167,102,0.4))" }}
                    />
                  </div>
                  <h2 className="text-black text-xl font-bold">
                    {isOwner ? 'Approving & publishing...' : 'Submitting for approval...'}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ListingPortalSubmit;
