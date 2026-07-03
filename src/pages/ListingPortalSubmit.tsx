import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayFirstName } from '@/hooks/useDisplayFirstName';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Upload, Sparkles, Home, Building,
  Hotel, Key, FileText, Camera, Loader2, Wand2, X, Eye,
  MapPin, Bed, Bath, Maximize, DollarSign, Calendar, Star,
  CheckCircle2, AlertCircle, Image, File, Trash2, Plus, RefreshCw,
  TrendingUp, Shield, User, Phone, Mail, CreditCard, Link as LinkIcon, FileText as FileTextIcon, Globe
} from 'lucide-react';
import { FormDraftBar } from "@/components/shared/FormDraftBar";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
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
  { id: 'secondary_offplan', label: 'Secondary / Off-Plan', icon: Home, desc: 'Resale or under-construction' },
  { id: 'ready', label: 'Ready to Move', icon: Building, desc: 'Completed property' },
  { id: 'land', label: 'Land', icon: MapPin, desc: 'Plot or land for sale' },
  { id: 'rental', label: 'Rental', icon: Key, desc: 'Long or short-term rental' },
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

const EMERALD = '#064E3B';
const EMERALD_DEEP = '#042C1C';
const EMERALD_BLACK = '#000000';
const EMERALD_OMBRE = 'linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)';
const EMERALD_OMBRE_SOFT = 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 54%, #EAF7F1 100%)';
const EMERALD_DARK_PANEL = 'linear-gradient(135deg, rgba(6,78,59,0.96) 0%, rgba(4,44,28,0.98) 58%, rgba(0,0,0,1) 100%)';
const EMERALD_FIELD = 'bg-[#FDFBF7] border-2 border-[#064E3B]/45 focus:border-[#064E3B] focus-visible:ring-[#064E3B]/30 text-[#1A1A1A]';

const ListingPortalSubmit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isOwner } = useAuth();
  const firstName = useDisplayFirstName("there");
  
  // Read purpose from URL: ?purpose=sale or ?purpose=rent
  const urlPurpose = searchParams.get('purpose');
  const isRent = urlPurpose === 'rent';
  const initialListingType = isRent ? 'rent' : 'sale';
  const initialCategory = isRent ? 'rental' : 'secondary_offplan';
  const party = isRent ? 'Landlord' : 'Seller';
  const actionNoun = isRent ? 'Rent' : 'Sale';
  const actionVerb = isRent ? 'rental' : 'sale';
  const priceLabel = isRent ? 'Monthly Rent (AED)' : 'Price (AED)';

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
  const [sourceUrl, setSourceUrl] = useState(savedState?.sourceUrl || '');
  const [sourceText, setSourceText] = useState(savedState?.sourceText || '');
  
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
    const stateToSave = { phase, form, listingCategory, uploadedImageUrls, extractedData, pricePrediction, sellerRole, contactMode, sourceUrl, sourceText };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stateToSave));
  }, [phase, form, listingCategory, uploadedImageUrls, extractedData, pricePrediction, sellerRole, contactMode, sourceUrl, sourceText]);

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
      <section data-ai-listing-shell className="min-h-screen flex items-center justify-center" style={{ background: EMERALD_OMBRE }}>
        <div className="text-center rounded-3xl p-8 border border-white/35" style={{ background: EMERALD_DARK_PANEL }}>
          <h2 className="text-white text-xl font-bold mb-4" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Please sign in to submit a listing</h2>
          <Button onClick={() => navigate('/auth')} className="border-0" style={{ background: '#064E3B', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
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
    if (uploadedDocs.length === 0 && !sourceUrl.trim() && !sourceText.trim()) {
      toast.error('Please upload documents, enter a URL, or paste text');
      return;
    }
    
    setPhase('extracting');
    
    try {
      const documents = [];
      const imageUrls: string[] = [];

      // Process uploaded files
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

      // Add user-pasted text as a document
      if (sourceText.trim()) {
        documents.push({ type: 'text', name: 'User-provided description', content: sourceText.trim() });
      }

      // Universal Link Extractor — handles Google Drive, property portals, any URL
      let scrapedContent = '';
      if (sourceUrl.trim()) {
        try {
          toast.info('Extracting content from link...', { duration: 3000 });
          const { data: linkResult, error: linkError } = await supabase.functions.invoke('universal-link-extractor', {
            body: { url: sourceUrl.trim(), extract_mode: 'property_listing' }
          });
          if (!linkError && linkResult?.success) {
            // If the universal extractor returned structured data, use it directly
            if (linkResult.data) {
              const ld = linkResult.data;
              // Push extracted content as text document for the AI listing extractor
              const extractedSummary = JSON.stringify(ld, null, 2);
              documents.push({ type: 'text', name: `Extracted: ${sourceUrl}`, content: extractedSummary.substring(0, 15000) });
              scrapedContent = extractedSummary;

              // If the extractor found images, add them
              if (linkResult.images?.length > 0) {
                imageUrls.push(...linkResult.images.slice(0, 10));
              }

              // Show what was detected
              const urlType = linkResult.url_type || 'generic';
              const typeLabels: Record<string, string> = {
                google_drive: '📁 Google Drive',
                property_portal: '🏠 Property Portal',
                pdf_direct: '📄 PDF',
                image_direct: '🖼️ Image',
                generic: '🌐 Website',
              };
              toast.success(`${typeLabels[urlType] || 'Link'} content extracted successfully!`);
            }
          } else {
            // Fallback to Firecrawl scrape
            const { data: scrapeResult, error: scrapeError } = await supabase.functions.invoke('firecrawl-scrape', {
              body: { url: sourceUrl.trim(), options: { formats: ['markdown'], onlyMainContent: true } }
            });
            if (!scrapeError && (scrapeResult?.data?.markdown || scrapeResult?.markdown)) {
              scrapedContent = scrapeResult?.data?.markdown || scrapeResult?.markdown || '';
              documents.push({ type: 'text', name: `Scraped: ${sourceUrl}`, content: scrapedContent.substring(0, 15000) });
            }
          }
        } catch (urlErr) {
          console.warn('URL extraction failed, continuing with other sources:', urlErr);
          toast.info('Could not extract from URL, continuing with uploaded files');
        }
      }

      if (documents.length === 0) {
        toast.error('No extractable content found. Please upload files, enter a URL, or paste text.');
        setPhase('upload');
        return;
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
      toast.error(err?.message || 'Failed to submit listing. Please try again.');
    }
  };

  // ========== SUCCESS PHASE ==========
  if (phase === 'success') {
    return (
      <section
        data-ai-listing-shell
        className="min-h-screen pt-24 pb-16"
        style={{ background: EMERALD_OMBRE }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-20 h-20 jj-surface-emerald/15 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[color:var(--emerald-1)]/30/30">
              <CheckCircle2 className="w-10 h-10 text-[color:var(--emerald-1)]" />
            </div>
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              {isOwner ? 'Listing Approved & Published!' : 'Listing Submitted for Approval!'}
            </h1>
            <p className="text-[#1A1A1A]/70 mb-8">
              {isOwner 
                ? 'Your listing has been approved and is now live on the portal.'
                : 'Your listing has been submitted for review. You will receive notifications as it progresses through approval stages.'}
            </p>

            {/* Approval Workflow Visual */}
            {!isOwner && (
              <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6 mb-8 text-left">
                <h3 className="text-[#1A1A1A] font-semibold mb-4">Approval Stages</h3>
                <div className="space-y-3">
                  {UNIFIED_APPROVAL_WORKFLOW.map((step) => (
                    <div key={step.step} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EFE6D6]/10 border border-[#B89555]/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-[#1A1A1A]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[#1A1A1A] text-sm font-medium">{step.name}</p>
                        <p className="text-[#1A1A1A]/70 text-xs">{step.approverName} — {step.approverTitle}</p>
                      </div>
                      <Badge className="bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30 text-xs">Pending</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/listing-portal/my-listings')} className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] border-0">
                View My Listings
              </Button>
              <Button onClick={() => navigate('/listing-portal')} className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/50 text-[#1A1A1A] hover:border-[#B89555] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
                Back to Portal
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  const PHASE_ICONS = [Upload, Sparkles, TrendingUp, Eye, CreditCard, Check];
  const phaseIndex = getPhaseIndex();

  return (
    <main
      data-ai-listing-shell
      className="min-h-screen"
      style={{ background: EMERALD_OMBRE }}
    >
      {/* Unified emerald-black header — edge to edge, no champagne layer */}
      <div style={{ background: EMERALD_OMBRE }} className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 85% 12%, rgba(16,185,129,0.18) 0%, transparent 55%)" }}
        />
        <div className="container mx-auto px-4 pt-8 pb-6 relative">
          <div className="max-w-5xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => navigate('/listing-portal')}
              data-no-contrast-guard
              data-back-to-portal
              data-allow-dark-cta
              className="mb-4 hover:bg-white/10"
              style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
            >
              <span className="jj-arrow-anim inline-flex mr-2" style={{ color: '#FFFFFF' }}>
                <ArrowLeft className="w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
              </span>
              <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Back to Portal</span>
            </Button>

            <div className="text-center">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                data-no-contrast-guard
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                <Wand2 className="w-3.5 h-3.5" /> AI-Powered · {party} Listing Tool
              </span>
              <h1
                className="text-3xl md:text-4xl font-bold mb-3"
                data-no-contrast-guard
                style={{
                  color: '#FFFFFF',
                  WebkitTextFillColor: '#FFFFFF',
                  letterSpacing: "-0.02em",
                }}
              >
                Welcome, {firstName} — {party} Listing Portal for {actionNoun}
              </h1>
              <p className="mb-6" style={{ color: 'rgba(255,255,255,0.82)' }}>
                Upload your documents and let AI create a professional {actionVerb} listing for you.
              </p>

              <div className="[&>div]:mb-0" data-no-contrast-guard data-allow-dark-cta>
                <FormDraftBar
                  hasDraft={phase !== 'upload' || uploadedDocs.length > 0}
                  onSaveDraft={() => {
                    const stateToSave = { phase, form, listingCategory, uploadedImageUrls, extractedData, pricePrediction, sellerRole, contactMode, sourceUrl, sourceText };
                    sessionStorage.setItem(SESSION_KEY, JSON.stringify(stateToSave));
                    toast.success("Draft saved successfully");
                  }}
                  onReset={() => {
                    sessionStorage.removeItem(SESSION_KEY);
                    setPhase('upload');
                    setUploadedDocs([]);
                    setExtractedData(null);
                    setUploadedImageUrls([]);
                    setPricePrediction(null);
                    setForm({ title: '', description: '', listing_type: initialListingType, listing_category: initialCategory, property_type: '', developer_name: '', project_name: '', location: '', emirate: 'Dubai', area: '', bedrooms: '', bathrooms: '', area_sqft: '', price: '', furnishing: '', handover_date: '', payment_plan: '', amenities: [], key_features: [] });
                    toast.info("Form cleared");
                  }}
                  onNew={() => {
                    sessionStorage.removeItem(SESSION_KEY);
                    setPhase('upload');
                    setUploadedDocs([]);
                    setExtractedData(null);
                    setUploadedImageUrls([]);
                    setPricePrediction(null);
                    setForm({ title: '', description: '', listing_type: initialListingType, listing_category: initialCategory, property_type: '', developer_name: '', project_name: '', location: '', emirate: 'Dubai', area: '', bedrooms: '', bathrooms: '', area_sqft: '', price: '', furnishing: '', handover_date: '', payment_plan: '', amenities: [], key_features: [] });
                    toast.info("New listing started");
                  }}
                  label="Listing"
                  theme="dark"
                />
              </div>
            </div>

            {/* Horizontal step header — connected, no gap */}
            <div className="mt-8" data-no-contrast-guard data-allow-dark-cta>
              <div className="flex items-center justify-between overflow-x-auto pb-2 gap-2">
              {PHASES.map((step, i) => {
                const Icon = PHASE_ICONS[i] || Sparkles;
                const isActive = i === phaseIndex;
                const isDone = i < phaseIndex;
                return (
                  <div
                    key={step}
                    data-no-contrast-guard
                    className="flex flex-col items-center min-w-[88px] transition-all"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all ${
 isActive
 ? 'border-white text-white shadow-lg [&_svg]:!text-white'
 : isDone
 ? 'border-white/80 text-white [&_svg]:!text-white'
 : 'border-white/40 text-white/70 [&_svg]:!text-white/70'
 }`}
                      style={{
                        background: 'var(--jj-official-emerald-surface, #064E3B)',
                        backgroundColor: '#064E3B',
                        boxShadow: isActive
                          ? '0 8px 20px -8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.10)',
                      }}
                    >
                      {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className="text-xs text-center whitespace-nowrap"
                      style={{
                        color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                        WebkitTextFillColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase content — same emerald black continuum */}
      <div className="pb-16 pt-4 relative" style={{ background: EMERALD_OMBRE }}>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto">
            <div
              className="rounded-2xl p-6 md:p-8 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(6,78,59,0.55) 0%, rgba(4,44,28,0.75) 100%)',
                border: "1.5px solid rgba(255,255,255,0.18)",
                boxShadow: "0 24px 60px -28px rgba(0,0,0,0.75)",
              }}
            >
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
                    <div className="relative space-y-6">
                      {/* Category Selection */}
                      <div className="bg-white/[0.06] border border-white/15 rounded-2xl p-6 jj-emerald-anim-border">
                        <h2 className="text-white font-semibold mb-4">What type of listing?</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {listingCategories.map(cat => {
                            const Icon = cat.icon;
                            const isSelected = listingCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => setListingCategory(cat.id)}
                                className={`relative flex flex-col items-start text-left p-4 pr-8 rounded-2xl border-2 transition-all w-full min-w-0 overflow-hidden ${
 isSelected
 ? 'bg-white/15 border-white text-white shadow-lg'
 : 'bg-white/[0.04] border-white/25 text-white/80 hover:border-white/70'
 }`}
                              >
                                {isSelected && (
                                  <div
                                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                                    data-no-contrast-guard
                                    data-allow-dark-cta
                                    style={{ backgroundColor: '#0A0A0A' }}
                                  >
                                    <Check
                                      className="w-3.5 h-3.5"
                                      data-no-contrast-guard
                                      style={{ color: '#FFFFFF' }}
                                    />
                                  </div>
                                )}
                                <Icon className="w-5 h-5 mb-2 shrink-0" style={{color: isSelected ? EMERALD : '#0A6B53'}} />
                                <div className="font-medium text-sm leading-tight w-full break-words">{cat.label}</div>
                                <div className="text-xs text-white/70 leading-tight w-full break-words mt-1">{cat.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Upload Zone */}
                      <div className="bg-white/[0.06] border border-white/15 rounded-2xl p-6 jj-emerald-anim-border">
                        <h2 className="text-white font-semibold mb-2">Upload Documents</h2>
                        <p className="text-white/70 text-xs mb-4">
                          Upload PDF brochures, floor plans, fact sheets, property photos, reservation forms, agreements — AI will extract everything
                        </p>
                        
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleFileDrop}
                          className="border-2 border-dashed border-white/40 rounded-xl p-8 text-center hover:border-white transition-all cursor-pointer bg-white/[0.04]"
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <Upload className="w-10 h-10 mx-auto mb-3" style={{color: EMERALD}} />
                          <p className="text-white font-medium mb-1">Drop files here or click to browse</p>
                          <p className="text-white/70 text-xs">
                            Any file — PDF, images, Word, Excel, PowerPoint, CSV, TXT, ZIP… up to 100MB each
                          </p>
                          <input
                            id="file-input"
                            type="file"
                            multiple
                            accept="*/*"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>

                        {uploadedDocs.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {uploadedDocs.map(doc => (
                              <div key={doc.id} className="flex items-center gap-3 bg-white/[0.08] border border-white/20 border border-white/20 rounded-lg p-3">
                                {doc.preview ? (
                                  <img src={doc.preview} alt="" className="w-10 h-10 rounded object-cover"  loading="lazy" decoding="async" />
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
                                  <p className="text-white text-sm truncate">{doc.name}</p>
                                  <p className="text-white/70 text-xs">
                                    {(doc.file.size / 1024 / 1024).toFixed(1)} MB
                                  </p>
                                </div>
                                <button onClick={() => removeDoc(doc.id)} className="p-1.5 hover:bg-white/10 rounded-lg">
                                  <X className="w-4 h-4 text-white/70" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Universal Link Input */}
                      <div className="bg-white/[0.06] border border-white/15 rounded-2xl p-6 jj-emerald-anim-border">
                        <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4" style={{color: EMERALD}} />
                          Paste Any Link
                        </h2>
                        <p className="text-white/70 text-xs mb-3">
                          Google Drive folders/files, property portals, PDFs, brochures, MOUs — AI extracts everything automatically
                        </p>
                        <Input
                          value={sourceUrl}
                          onChange={e => setSourceUrl(e.target.value)}
                          placeholder="https://drive.google.com/... or any property listing URL"
                          className={EMERALD_FIELD}
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {['Google Drive', 'Property Finder', 'Bayut', 'Dubizzle', 'Developer Sites', 'Any URL'].map(tag => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/10 text-white border border-white/30 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>

                      {/* Paste Text Input */}
                      <div className="bg-white/[0.06] border border-white/15 rounded-2xl p-6 jj-emerald-anim-border">
                        <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <FileTextIcon className="w-4 h-4" style={{color: EMERALD}} />
                          Paste Text / Description (Optional)
                        </h2>
                        <p className="text-white/70 text-xs mb-3">
                          Paste any property description, spec sheet, or text content for AI to analyze
                        </p>
                        <Textarea
                          value={sourceText}
                          onChange={e => setSourceText(e.target.value)}
                          placeholder="Paste property description, features, specs, brochure text..."
                          className={`${EMERALD_FIELD} min-h-[100px]`}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={runAIExtraction}
                          disabled={uploadedDocs.length === 0 && !sourceUrl.trim() && !sourceText.trim()}
                          data-allow-dark-cta
                          data-no-contrast-guard
                          style={{
                            background: EMERALD_OMBRE,
                            border: '2px solid #FFFFFF',
                            color: '#FFFFFF',
                            WebkitTextFillColor: '#FFFFFF',
                            boxShadow: '0 10px 28px -12px rgba(6,78,59,0.75)',
                          }}
                          className="flex-1 h-12 text-base font-semibold rounded-md disabled:opacity-50 hover:brightness-110 transition-all"
                        >
                          <Sparkles className="w-5 h-5 mr-2 !text-white" style={{ color: '#FFFFFF' }} data-no-contrast-guard />
                          <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                            Extract with AI
                          </span>
                        </Button>
                        <Button
                          onClick={() => setPhase('pricing_ai')}
                          data-allow-dark-cta
                          className="jj-emerald-ghost h-12 px-6 font-semibold rounded-md transition-all duration-300"
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
                  className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-12 text-center"
                >
                  <BrandedLoader variant="light" text="AI is analyzing..." className="min-h-0 py-8" />
                  <h2 className="text-[#1A1A1A] text-xl font-bold mb-2 mt-4">AI is analyzing your documents...</h2>
                  <p className="text-[#1A1A1A]/70 text-sm mb-6">
                    Extracting property details, images, floor plans, and generating your listing
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Reading documents', 'Detecting images', 'Extracting details', 'Generating description'].map((step) => (
                      <Badge key={step} className="bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30">
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
                    <div className="absolute inset-0 -m-3 rounded-3xl bg-[#FDFBF7]/40 border border-[#B89555]/15" />
                    <div className="relative space-y-6 p-3">
                      <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-[#1A1A1A]" />
                          </div>
                          <div>
                            <h2 className="text-[#1A1A1A] font-bold text-lg">AI Price Predictor</h2>
                            <p className="text-[#1A1A1A]/70 text-xs">Get an AI-powered market price estimate based on location, size, and market data</p>
                          </div>
                        </div>

                        {/* Quick summary of extracted data */}
                        {extractedData && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20 rounded-lg p-3 text-center">
                              <MapPin className="w-4 h-4 text-[#1A1A1A] mx-auto mb-1" />
                              <p className="text-xs text-[#1A1A1A]/70">Location</p>
                              <p className="text-[#1A1A1A] text-sm font-medium truncate">{form.location || 'N/A'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20 rounded-lg p-3 text-center">
                              <Bed className="w-4 h-4 text-[#1A1A1A] mx-auto mb-1" />
                              <p className="text-xs text-[#1A1A1A]/70">Bedrooms</p>
                              <p className="text-[#1A1A1A] text-sm font-medium">{form.bedrooms || 'N/A'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20 rounded-lg p-3 text-center">
                              <Maximize className="w-4 h-4 text-[#1A1A1A] mx-auto mb-1" />
                              <p className="text-xs text-[#1A1A1A]/70">Area</p>
                              <p className="text-[#1A1A1A] text-sm font-medium">{form.area_sqft ? `${parseInt(form.area_sqft).toLocaleString()} sqft` : 'N/A'}</p>
                            </div>
                            <div className="bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] border border-[#B89555]/20 rounded-lg p-3 text-center">
                              <Building className="w-4 h-4 text-[#1A1A1A] mx-auto mb-1" />
                              <p className="text-xs text-[#1A1A1A]/70">Type</p>
                              <p className="text-[#1A1A1A] text-sm font-medium capitalize">{form.property_type || 'N/A'}</p>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={runPricePredictor}
                          disabled={isRunningPredictor}
                          className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] border-0 h-12 text-base"
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
                            <div className="jj-emerald-soft border-2 border-[color:var(--emerald-1)]/30 rounded-xl p-5">
                              <h3 className="text-[#1A1A1A] font-semibold mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[color:var(--emerald-1)]" />
                                Estimated Market Value
                              </h3>
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <p className="text-[#1A1A1A]/70 text-xs mb-1">Low</p>
                                  <p className="text-[#1A1A1A] font-bold text-lg">AED {pricePrediction.estimatedValue.low.toLocaleString()}</p>
                                </div>
                                <div className="border-x border-[color:var(--emerald-1)]/30">
                                  <p className="text-[#1A1A1A]/70 text-xs mb-1">Recommended</p>
                                  <p className="text-[color:var(--emerald-1)] font-bold text-xl">AED {pricePrediction.estimatedValue.mid.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[#1A1A1A]/70 text-xs mb-1">High</p>
                                  <p className="text-[#1A1A1A] font-bold text-lg">AED {pricePrediction.estimatedValue.high.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>

                            {pricePrediction.marketInsights && (
                              <div className="bg-[#FDFBF7]/80 border border-[#B89555]/20 rounded-xl p-4">
                                <p className="text-[#1A1A1A]/70 text-sm">{pricePrediction.marketInsights}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setPhase('upload')}
                          className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/50 text-[#1A1A1A] hover:border-[#B89555] h-12 hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button
                          onClick={() => setPhase('review')}
                          className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] border-0 h-12 text-base"
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
                    <div className="absolute inset-0 -m-3 rounded-3xl bg-[#FDFBF7]/40 border border-[#B89555]/15" />
                    <div className="relative space-y-6 p-3">
                      {/* AI Confidence Banner */}
                      {extractedData && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl border-2 ${
 extractedData.confidence_score >= 80 
 ? 'jj-emerald-soft border-[color:var(--emerald-1)]/30' 
 : extractedData.confidence_score >= 50 
 ? 'bg-amber-50 border-amber-300' 
 : 'bg-red-50 border-red-300'
 }`}>
                          {extractedData.confidence_score >= 80 ? (
                            <CheckCircle2 className="w-5 h-5 text-[color:var(--emerald-1)] flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="text-[#1A1A1A] text-sm font-medium">
                              AI Confidence: {extractedData.confidence_score}%
                            </p>
                            <p className="text-[#1A1A1A]/70 text-xs">
                              {extractedData.confidence_score >= 80 
                                ? 'High confidence — review and continue' 
                                : 'Please review and edit the details below'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setPhase('upload'); }}
                            className="text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                          >
                            <RefreshCw className="w-4 h-4 mr-1" /> Re-extract
                          </Button>
                        </div>
                      )}

                      {/* Listing Card Preview */}
                      {(form.title || uploadedImageUrls.length > 0) && (
                        <div className="bg-[#FDFBF7] border-2 border-[#B89555]/30 rounded-2xl overflow-hidden shadow-sm">
                          <div className="relative">
                            {uploadedImageUrls.length > 0 ? (
                              <img src={uploadedImageUrls[0]} alt="" className="w-full h-48 object-cover"  loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-full h-48 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] flex items-center justify-center">
                                <Image className="w-12 h-12 text-[#1A1A1A]/70" />
                              </div>
                            )}
                            {form.listing_category && (
                              <Badge className="absolute top-3 left-3 bg-[#1A1A1A]/70 text-white border-0 text-xs">
                                {listingCategories.find(c => c.id === form.listing_category)?.label}
                              </Badge>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="text-[#1A1A1A] font-bold text-lg mb-1">{form.title || 'Untitled Listing'}</h3>
                            <p className="text-[#1A1A1A]/70 text-sm flex items-center gap-1 mb-3">
                              <MapPin className="w-3.5 h-3.5" /> {form.location || form.emirate}
                            </p>
                            <div className="flex items-center gap-4 text-[#1A1A1A]/70 text-sm mb-3">
                              {form.bedrooms && <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {form.bedrooms} BR</span>}
                              {form.bathrooms && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {form.bathrooms} BA</span>}
                              {form.area_sqft && <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {parseInt(form.area_sqft).toLocaleString()} sqft</span>}
                            </div>
                            {form.price && (
                              <p className="text-[#1A1A1A] font-bold text-xl">AED {parseInt(form.price).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Gallery Preview */}
                      {uploadedImageUrls.length > 1 && (
                        <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6">
                          <h3 className="text-[#1A1A1A] font-semibold mb-3 flex items-center gap-2">
                            <Image className="w-4 h-4 text-[#1A1A1A]" />
                            Gallery ({uploadedImageUrls.length} photos)
                          </h3>
                          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                            {uploadedImageUrls.map((url, i) => (
                              <div key={i} className="aspect-square rounded-lg overflow-hidden border border-[#B89555]/20">
                                <img src={url} alt="" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Main Details Form */}
                      <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6 space-y-4">
                        <h3 className="text-[#1A1A1A] font-semibold mb-1">{party} Listing Details — For {actionNoun}</h3>
                        
                        <div>
                          <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Title *</label>
                          <Input
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="e.g. Luxury 3BR Villa in Palm Jumeirah"
                            className={EMERALD_FIELD}
                          />
                        </div>

                        <div>
                          <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Description</label>
                          <Textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="Property description..."
                            className={`${EMERALD_FIELD} min-h-[100px]`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Category</label>
                            <Select value={form.listing_category} onValueChange={v => setForm(f => ({ ...f, listing_category: v }))}>
                              <SelectTrigger className={EMERALD_FIELD}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {listingCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Property Type</label>
                            <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                              <SelectTrigger className={EMERALD_FIELD}>
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
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Developer</label>
                            <Input
                              value={form.developer_name}
                              onChange={e => setForm(f => ({ ...f, developer_name: e.target.value }))}
                              placeholder="e.g. Emaar"
                              className={EMERALD_FIELD}
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Project / Building</label>
                            <Input
                              value={form.project_name}
                              onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
                              placeholder="e.g. Creek Harbour"
                              className={EMERALD_FIELD}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Emirate</label>
                            <Select value={form.emirate} onValueChange={v => setForm(f => ({ ...f, emirate: v }))}>
                              <SelectTrigger className={EMERALD_FIELD}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {emirates.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Location / Area</label>
                            <Input
                              value={form.location}
                              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                              placeholder="e.g. Dubai Marina"
                              className={EMERALD_FIELD}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">{priceLabel}</label>
                            <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className={EMERALD_FIELD} />
                          </div>
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Bedrooms</label>
                            <Input type="number" value={form.bedrooms} onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))} className={EMERALD_FIELD} />
                          </div>
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Bathrooms</label>
                            <Input type="number" value={form.bathrooms} onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))} className={EMERALD_FIELD} />
                          </div>
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Area (sqft)</label>
                            <Input type="number" value={form.area_sqft} onChange={e => setForm(f => ({ ...f, area_sqft: e.target.value }))} className={EMERALD_FIELD} />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Furnishing</label>
                            <Select value={form.furnishing} onValueChange={v => setForm(f => ({ ...f, furnishing: v }))}>
                              <SelectTrigger className={EMERALD_FIELD}>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {furnishingOptions.map(f => <SelectItem key={f} value={f.toLowerCase().replace(' ', '_')}>{f}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Handover</label>
                            <Input value={form.handover_date} onChange={e => setForm(f => ({ ...f, handover_date: e.target.value }))} placeholder="e.g. Q4 2026" className={EMERALD_FIELD} />
                          </div>
                          <div>
                            <label className="text-xs text-[#1A1A1A]/70 mb-1 block">Payment Plan</label>
                            <Input value={form.payment_plan} onChange={e => setForm(f => ({ ...f, payment_plan: e.target.value }))} placeholder="e.g. 60/40" className={EMERALD_FIELD} />
                          </div>
                        </div>
                      </div>

                      {/* Key Features */}
                      {form.key_features.length > 0 && (
                        <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6">
                          <h3 className="text-[#1A1A1A] font-semibold mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4 text-[#1A1A1A]" />
                            Key Features
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {form.key_features.map((f, i) => (
                              <Badge key={i} className="bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30 px-3 py-1">
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
                        <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6">
                          <h3 className="text-[#1A1A1A] font-semibold mb-3">Amenities</h3>
                          <div className="flex flex-wrap gap-2">
                            {form.amenities.map((a, i) => (
                              <Badge key={i} className="bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A]/70 px-3 py-1">
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
                          className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/50 text-[#1A1A1A] hover:border-[#B89555] h-12 hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button
                          onClick={() => setPhase('pricing_role')}
                          disabled={!form.title.trim()}
                          className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] border-0 h-12 text-base disabled:opacity-50"
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
                    <div className="absolute inset-0 -m-3 rounded-3xl bg-[#FDFBF7]/40 border border-[#B89555]/15" />
                    <div className="relative space-y-6 p-3">
                      {/* Role Selection */}
                      <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6">
                        <h3 className="text-[#1A1A1A] font-semibold mb-4 flex items-center gap-2">
                          <User className="w-4 h-4 text-[#1A1A1A]" />
                          Your Role as {party}
                        </h3>
                        <RadioGroup value={sellerRole} onValueChange={setSellerRole} className="grid grid-cols-2 gap-3">
                          {sellerRoles.map(role => (
                            <div key={role.value} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
 sellerRole === role.value ? 'bg-[#EFE6D6]/10 border-[#B89555]/50 shadow-md shadow-gold/10' : 'bg-[#FDFBF7]/60 border-[#B89555]/15 hover:border-[#B89555]/30'
 }`}>
                              <RadioGroupItem value={role.value} id={`role-${role.value}`} className="border-[#B89555]/50" />
                              <Label htmlFor={`role-${role.value}`} className="text-[#1A1A1A] text-sm cursor-pointer">{role.label}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Contact & Pricing Model */}
                      <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6">
                        <h3 className="text-[#1A1A1A] font-semibold mb-2 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#1A1A1A]" />
                          Listing Contact & Pricing
                        </h3>
                        <p className="text-[#1A1A1A]/70 text-xs mb-4">Choose how enquiries are handled for your listing</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Direct Contact Option */}
                          <button
                            onClick={() => setContactMode('direct')}
                            className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
 contactMode === 'direct' 
 ? 'bg-[#EFE6D6]/10 border-[#B89555]/50 shadow-lg shadow-gold/15' 
 : 'bg-[#FDFBF7]/60 border-[#B89555]/15 hover:border-[#B89555]/30'
 }`}
                          >
                            {contactMode === 'direct' && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-[#EFE6D6] rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <Phone className="w-4 h-4 text-[#1A1A1A]" />
                              <span className="text-[#1A1A1A] font-semibold text-sm">Direct Contact</span>
                            </div>
                            <p className="text-[#1A1A1A] font-bold text-lg mb-1">{LISTING_FEES.direct.label}</p>
                            <p className="text-[#1A1A1A]/70 text-xs">{LISTING_FEES.direct.description}</p>
                            <div className="mt-3 jj-emerald-soft border border-[color:var(--emerald-1)]/30 rounded-2xl p-2">
                              <p className="text-[color:var(--emerald-1)] text-xs font-medium">50% less than Property Finder & Bayut</p>
                            </div>
                          </button>

                          {/* Commission Option */}
                          <button
                            onClick={() => setContactMode('commission')}
                            className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
 contactMode === 'commission' 
 ? 'bg-[#EFE6D6]/10 border-[#B89555]/50 shadow-lg shadow-gold/15' 
 : 'bg-[#FDFBF7]/60 border-[#B89555]/15 hover:border-[#B89555]/30'
 }`}
                          >
                            {contactMode === 'commission' && (
                              <div className="absolute top-3 right-3 w-6 h-6 bg-[#EFE6D6] rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-[#1A1A1A]" />
                              <span className="text-[#1A1A1A] font-semibold text-sm">Commission-Based</span>
                            </div>
                            <p className="text-[#1A1A1A] font-bold text-lg mb-1">{LISTING_FEES.commission.label}</p>
                            <p className="text-[#1A1A1A]/70 text-xs">{LISTING_FEES.commission.description}</p>
                            <div className="mt-3 bg-[#EFE6D6]/5 border border-[#B89555]/20 rounded-2xl p-2">
                              <p className="text-[#1A1A1A] text-xs font-medium">JBJ handles all enquiries professionally</p>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Approval Preview */}
                      {!isOwner && (
                        <div className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-6">
                          <h3 className="text-[#1A1A1A] font-semibold mb-4 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-[#1A1A1A]" />
                            Approval Workflow
                          </h3>
                          <p className="text-[#1A1A1A]/70 text-xs mb-4">Your listing will go through these approval stages before publishing</p>
                          <div className="space-y-3">
                            {UNIFIED_APPROVAL_WORKFLOW.map((step) => (
                              <div key={step.step} className="flex items-center gap-3">
                                <img src={step.approverPhoto} alt="" className="w-9 h-9 rounded-full object-cover border border-[#B89555]/30"  loading="lazy" decoding="async" />
                                <div className="flex-1">
                                  <p className="text-[#1A1A1A] text-sm font-medium">{step.name}</p>
                                  <p className="text-[#1A1A1A]/70 text-xs">{step.approverName} — {step.approverTitle}</p>
                                </div>
                                <Badge className="bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30 text-xs flex items-center gap-1"><Check className="w-3 h-3" /> Step {step.step}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isOwner && (
                        <div className="jj-emerald-soft border-2 border-[color:var(--emerald-1)]/30 rounded-2xl p-5">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-[color:var(--emerald-1)]" />
                            <div>
                              <p className="text-[#1A1A1A] font-semibold text-sm">Owner Auto-Approval</p>
                              <p className="text-[#1A1A1A]/70 text-xs">As the Owner, your listing will be approved and published immediately upon submission.</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setPhase('review')}
                          className="bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/50 text-[#1A1A1A] hover:border-[#B89555] h-12 hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300"
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                        <Button
                          onClick={handleSubmit}
                          className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] border-0 h-12 text-base"
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
                  className="bg-[#FDFBF7]/70 border-2 border-[#B89555]/20 rounded-2xl p-12 text-center"
                >
                  <BrandedLoader variant="light" text={isOwner ? 'Approving...' : 'Submitting...'} className="min-h-0 py-8" />
                  <h2 className="text-[#1A1A1A] text-xl font-bold mt-4">
                    {isOwner ? 'Approving & publishing...' : 'Submitting for approval...'}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </main>

  );
};

export default ListingPortalSubmit;
