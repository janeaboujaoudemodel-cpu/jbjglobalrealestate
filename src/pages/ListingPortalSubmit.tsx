import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  ArrowLeft, ArrowRight, Check, Upload, Sparkles, Home, Building,
  Hotel, Key, FileText, Camera, Loader2, Wand2, X, Eye,
  MapPin, Bed, Bath, Maximize, DollarSign, Calendar, Star,
  CheckCircle2, AlertCircle, Image, File, Trash2, Plus, RefreshCw
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const listingCategories = [
  { id: 'resale', label: 'Resale', icon: Home, desc: 'Secondary market property' },
  { id: 'ready', label: 'Ready to Move', icon: Building, desc: 'Completed property' },
  { id: 'off_plan', label: 'Off-Plan', icon: Calendar, desc: 'Under construction' },
  { id: 'land', label: 'Land', icon: MapPin, desc: 'Plot or land for sale' },
  { id: 'rental', label: 'Rental', icon: Key, desc: 'For rent' },
  { id: 'holiday_home', label: 'Holiday Home', icon: Hotel, desc: 'Short-term rental' },
];

const propertyTypes = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Duplex', 'Land', 'Office', 'Warehouse', 'Shop'];
const furnishingOptions = ['Furnished', 'Unfurnished', 'Semi-Furnished'];
const emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

const ListingPortalSubmit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Phases: upload → extracting → review → submitting → success
  const [phase, setPhase] = useState<'upload' | 'extracting' | 'review' | 'submitting' | 'success'>('upload');
  const [listingCategory, setListingCategory] = useState('resale');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedListing | null>(null);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  
  // Editable form state (populated from AI extraction)
  const [form, setForm] = useState({
    title: '', description: '', listing_type: 'sale', listing_category: 'resale',
    property_type: '', developer_name: '', project_name: '',
    location: '', emirate: 'Dubai', area: '',
    bedrooms: '', bathrooms: '', area_sqft: '', price: '',
    furnishing: '', handover_date: '', payment_plan: '',
    amenities: [] as string[], key_features: [] as string[],
  });

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }, []);

  if (!user) {
    return (
      <section className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl font-bold mb-4">Please sign in to submit a listing</h2>
          <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
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
      // Convert files to base64 for the AI
      const documents = [];
      const imageUrls: string[] = [];

      for (const doc of uploadedDocs) {
        const base64 = await fileToBase64(doc.file);
        
        if (doc.type === 'image') {
          documents.push({
            type: 'image',
            name: doc.name,
            base64,
            mime_type: doc.file.type,
          });
          
          // Upload image to storage for the gallery
          const fileName = `${user.id}/listings/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error } = await supabase.storage
            .from('listing-documents')
            .upload(fileName, doc.file, { contentType: doc.file.type });
          
          if (!error) {
            const { data: urlData } = supabase.storage
              .from('listing-documents')
              .getPublicUrl(fileName);
            imageUrls.push(urlData.publicUrl);
          }
        } else if (doc.type === 'pdf') {
          // For PDFs, send as image (Gemini can read PDFs as images)
          documents.push({
            type: 'image',
            name: doc.name,
            base64,
            mime_type: 'application/pdf',
          });
          
          // Also upload PDF to storage
          const fileName = `${user.id}/listings/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          await supabase.storage
            .from('listing-documents')
            .upload(fileName, doc.file, { contentType: doc.file.type });
        } else {
          // Text-based docs
          documents.push({
            type: 'text',
            name: doc.name,
            content: await doc.file.text(),
          });
        }
      }

      setUploadedImageUrls(imageUrls);

      // Call AI extraction
      const { data, error } = await supabase.functions.invoke('ai-listing-extractor', {
        body: { documents, listing_category: listingCategory }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Extraction failed');

      const extracted = data.data as ExtractedListing;
      setExtractedData(extracted);

      // Populate form with extracted data
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

      setPhase('review');
      toast.success(`AI extracted ${Object.values(extracted).filter(v => v !== null && v !== '' && v !== undefined).length} fields from your documents!`);

    } catch (err: any) {
      console.error('Extraction error:', err);
      toast.error(err.message || 'AI extraction failed. You can fill in details manually.');
      // Fall back to manual entry
      setPhase('review');
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
          status: 'pending',
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Run AI scoring in background (non-blocking)
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
      toast.success('Listing submitted for approval!');

    } catch (err: any) {
      console.error('Submit error:', err);
      toast.error('Failed to submit listing. Please try again.');
      setPhase('review');
    }
  };

  // ========== SUCCESS PHASE ==========
  if (phase === 'success') {
    return (
      <section className="min-h-screen bg-black pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Listing Submitted Successfully!</h1>
            <p className="text-zinc-400 mb-8">
              Your listing has been submitted for review. You'll receive a notification once it's approved and published on the portal.
            </p>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-fuchsia-400 font-semibold mb-3">What Happens Next?</h3>
              <ul className="space-y-2 text-zinc-300 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-fuchsia-400 mt-0.5 flex-shrink-0" />
                  <span>Our team will review your listing details and documents</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-fuchsia-400 mt-0.5 flex-shrink-0" />
                  <span>You'll see the approval status in your dashboard & notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-fuchsia-400 mt-0.5 flex-shrink-0" />
                  <span>Once approved, your listing goes live on the JBJ Portal</span>
                </li>
              </ul>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/listing-portal/my-listings')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
                View My Listings
              </Button>
              <Button onClick={() => navigate('/listing-portal')} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Back to Portal
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-screen bg-black">
      <div className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-black to-purple-900/15" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/listing-portal')} className="text-zinc-400 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
            </Button>

            {/* Header */}
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 px-4 py-1.5">
                <Wand2 className="w-3.5 h-3.5 mr-2" /> AI-Powered
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Smart Listing Creator
              </h1>
              <p className="text-zinc-400 text-sm">
                Upload your documents and let AI create a professional listing for you
              </p>
            </div>

            {/* Progress indicator */}
            <div className="flex gap-2 mb-8">
              {['Upload', 'AI Extract', 'Review & Edit', 'Submit'].map((step, i) => {
                const stepIndex = phase === 'upload' ? 0 : phase === 'extracting' ? 1 : phase === 'review' ? 2 : 3;
                return (
                  <div key={step} className="flex-1">
                    <div className={`h-1.5 rounded-full transition-all ${i <= stepIndex ? 'bg-fuchsia-500' : 'bg-zinc-800'}`} />
                    <p className={`text-[10px] mt-1 text-center ${i <= stepIndex ? 'text-fuchsia-400' : 'text-zinc-600'}`}>{step}</p>
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
                  {/* Category Selection */}
                  <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-4">What type of listing?</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {listingCategories.map(cat => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setListingCategory(cat.id)}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              listingCategory === cat.id
                                ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-white'
                                : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                            }`}
                          >
                            <Icon className="w-5 h-5 mb-2" />
                            <div className="font-medium text-sm">{cat.label}</div>
                            <div className="text-xs text-zinc-500">{cat.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upload Zone */}
                  <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-6">
                    <h2 className="text-white font-semibold mb-2">Upload Documents</h2>
                    <p className="text-zinc-500 text-xs mb-4">
                      Upload PDF brochures, floor plans, fact sheets, property photos, Word docs, Excel files — AI will extract everything
                    </p>
                    
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleFileDrop}
                      className="border-2 border-dashed border-fuchsia-500/30 rounded-xl p-8 text-center hover:border-fuchsia-500/60 transition-all cursor-pointer"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <Upload className="w-10 h-10 text-fuchsia-400 mx-auto mb-3" />
                      <p className="text-white font-medium mb-1">Drop files here or click to browse</p>
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

                    {/* Uploaded Files List */}
                    {uploadedDocs.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {uploadedDocs.map(doc => (
                          <div key={doc.id} className="flex items-center gap-3 bg-zinc-800/50 border border-zinc-700 rounded-lg p-3">
                            {doc.preview ? (
                              <img src={doc.preview} alt="" className="w-10 h-10 rounded object-cover" />
                            ) : doc.type === 'pdf' ? (
                              <div className="w-10 h-10 bg-red-500/20 rounded flex items-center justify-center">
                                <FileText className="w-5 h-5 text-red-400" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center">
                                <File className="w-5 h-5 text-blue-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{doc.name}</p>
                              <p className="text-zinc-500 text-xs">
                                {(doc.file.size / 1024 / 1024).toFixed(1)} MB · {doc.type.toUpperCase()}
                              </p>
                            </div>
                            <button onClick={() => removeDoc(doc.id)} className="p-1.5 hover:bg-zinc-700 rounded-lg">
                              <X className="w-4 h-4 text-zinc-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Extract Button */}
                  <div className="flex gap-3">
                    <Button
                      onClick={runAIExtraction}
                      disabled={uploadedDocs.length === 0}
                      className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white h-12 text-base"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Extract with AI ({uploadedDocs.length} {uploadedDocs.length === 1 ? 'file' : 'files'})
                    </Button>
                    <Button
                      onClick={() => setPhase('review')}
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-12"
                    >
                      Skip — Fill Manually
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ========== EXTRACTING PHASE ========== */}
              {phase === 'extracting' && (
                <motion.div
                  key="extracting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-12 text-center"
                >
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin" />
                    <Wand2 className="w-8 h-8 text-fuchsia-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h2 className="text-white text-xl font-bold mb-2">AI is analyzing your documents...</h2>
                  <p className="text-zinc-400 text-sm mb-6">
                    Extracting property details, images, floor plans, and generating your listing
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['Reading documents', 'Detecting images', 'Extracting details', 'Generating description'].map((step, i) => (
                      <Badge key={step} className="bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20">
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        {step}
                      </Badge>
                    ))}
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
                  {/* AI Confidence Banner */}
                  {extractedData && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                      extractedData.confidence_score >= 80 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : extractedData.confidence_score >= 50 
                        ? 'bg-amber-500/10 border-amber-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}>
                      {extractedData.confidence_score >= 80 ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">
                          AI Confidence: {extractedData.confidence_score}%
                        </p>
                        <p className="text-zinc-400 text-xs">
                          {extractedData.confidence_score >= 80 
                            ? 'High confidence — review and submit' 
                            : 'Please review and edit the details below'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setPhase('upload'); }}
                        className="text-zinc-400 hover:text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" /> Re-extract
                      </Button>
                    </div>
                  )}

                  {/* Gallery Preview */}
                  {uploadedImageUrls.length > 0 && (
                    <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-6">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Image className="w-4 h-4 text-fuchsia-400" />
                        Gallery ({uploadedImageUrls.length} photos)
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {uploadedImageUrls.map((url, i) => (
                          <div key={i} className="aspect-square rounded-lg overflow-hidden border border-zinc-700">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Main Details Form */}
                  <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-6 space-y-4">
                    <h3 className="text-white font-semibold mb-1">Listing Details</h3>
                    
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Title *</label>
                      <Input
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Luxury 3BR Villa in Palm Jumeirah"
                        className="bg-zinc-800/50 border-zinc-600 text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Description</label>
                      <Textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Property description..."
                        className="bg-zinc-800/50 border-zinc-600 text-white min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Category</label>
                        <Select value={form.listing_category} onValueChange={v => setForm(f => ({ ...f, listing_category: v }))}>
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {listingCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Property Type</label>
                        <Select value={form.property_type} onValueChange={v => setForm(f => ({ ...f, property_type: v }))}>
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-600 text-white">
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
                        <label className="text-xs text-zinc-400 mb-1 block">Developer</label>
                        <Input
                          value={form.developer_name}
                          onChange={e => setForm(f => ({ ...f, developer_name: e.target.value }))}
                          placeholder="e.g. Emaar"
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Project / Building</label>
                        <Input
                          value={form.project_name}
                          onChange={e => setForm(f => ({ ...f, project_name: e.target.value }))}
                          placeholder="e.g. Creek Harbour"
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Emirate</label>
                        <Select value={form.emirate} onValueChange={v => setForm(f => ({ ...f, emirate: v }))}>
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {emirates.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Location / Area</label>
                        <Input
                          value={form.location}
                          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                          placeholder="e.g. Dubai Marina"
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Price (AED)</label>
                        <Input
                          type="number"
                          value={form.price}
                          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Bedrooms</label>
                        <Input
                          type="number"
                          value={form.bedrooms}
                          onChange={e => setForm(f => ({ ...f, bedrooms: e.target.value }))}
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Bathrooms</label>
                        <Input
                          type="number"
                          value={form.bathrooms}
                          onChange={e => setForm(f => ({ ...f, bathrooms: e.target.value }))}
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Area (sqft)</label>
                        <Input
                          type="number"
                          value={form.area_sqft}
                          onChange={e => setForm(f => ({ ...f, area_sqft: e.target.value }))}
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Furnishing</label>
                        <Select value={form.furnishing} onValueChange={v => setForm(f => ({ ...f, furnishing: v }))}>
                          <SelectTrigger className="bg-zinc-800/50 border-zinc-600 text-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {furnishingOptions.map(f => <SelectItem key={f} value={f.toLowerCase().replace(' ', '_')}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Handover</label>
                        <Input
                          value={form.handover_date}
                          onChange={e => setForm(f => ({ ...f, handover_date: e.target.value }))}
                          placeholder="e.g. Q4 2026"
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Payment Plan</label>
                        <Input
                          value={form.payment_plan}
                          onChange={e => setForm(f => ({ ...f, payment_plan: e.target.value }))}
                          placeholder="e.g. 60/40"
                          className="bg-zinc-800/50 border-zinc-600 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Key Features */}
                  {form.key_features.length > 0 && (
                    <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-6">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4 text-fuchsia-400" />
                        Key Features
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {form.key_features.map((f, i) => (
                          <Badge key={i} className="bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20 px-3 py-1">
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
                    <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-6">
                      <h3 className="text-white font-semibold mb-3">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {form.amenities.map((a, i) => (
                          <Badge key={i} className="bg-zinc-800 text-zinc-300 border-zinc-700 px-3 py-1">
                            {a}
                            <button onClick={() => setForm(prev => ({ ...prev, amenities: prev.amenities.filter((_, idx) => idx !== i) }))} className="ml-2">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Submit Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setPhase('upload')}
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-12"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!form.title.trim()}
                      className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white h-12 text-base"
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Submit for Approval
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ========== SUBMITTING PHASE ========== */}
              {phase === 'submitting' && (
                <motion.div
                  key="submitting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-2xl p-12 text-center"
                >
                  <Loader2 className="w-12 h-12 text-fuchsia-400 animate-spin mx-auto mb-4" />
                  <h2 className="text-white text-xl font-bold">Submitting your listing...</h2>
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
