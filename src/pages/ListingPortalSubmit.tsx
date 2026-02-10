import { useState } from 'react';
import { motion } from 'framer-motion';
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
  Hotel, Key, FileText, Camera, Phone, Mail, User as UserIcon
} from 'lucide-react';

const steps = ['Type', 'Details', 'Photos', 'Documents', 'Contact', 'Review'];

const listingTypes = [
  { id: 'sale', label: 'For Sale', icon: Home, desc: 'Sell a property' },
  { id: 'yearly_rent', label: 'Yearly Rent', icon: Key, desc: 'Long-term rental' },
  { id: 'short_term_rental', label: 'Short-term Rental', icon: Hotel, desc: 'Monthly/weekly' },
  { id: 'holiday_home', label: 'Holiday Home', icon: Building, desc: 'Vacation rental' },
];

const propertyTypes = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Studio', 'Duplex', 'Land', 'Commercial'];
const furnishingOptions = ['Furnished', 'Unfurnished', 'Semi-Furnished'];
const emirates = ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'];

const ListingPortalSubmit = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [listingType, setListingType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [emirate, setEmirate] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSqft, setAreaSqft] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [furnishing, setFurnishing] = useState('');
  const [rentFrequency, setRentFrequency] = useState('yearly');
  const [cheques, setCheques] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [titleDeedUrl, setTitleDeedUrl] = useState('');
  const [passportUrl, setPassportUrl] = useState('');
  const [useCompanyContact, setUseCompanyContact] = useState(true);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) continue;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImages(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadDocToStorage = async (dataUrl: string, folder: string): Promise<string | null> => {
    if (!user?.id) return null;
    try {
      const base64Content = dataUrl.replace(/^data:\w+\/\w+;base64,/, '');
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      const mimeMatch = dataUrl.match(/^data:(\w+\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const ext = mimeType.split('/')[1] || 'pdf';
      const blob = new Blob([bytes], { type: mimeType });
      const fileName = `${user.id}/${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('portal-documents').upload(fileName, blob, { contentType: mimeType });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('portal-documents').getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch (e) {
      console.error('Upload error:', e);
      return null;
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'deed' | 'passport') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const url = await uploadDocToStorage(dataUrl, type);
      if (url) {
        if (type === 'deed') setTitleDeedUrl(url);
        else setPassportUrl(url);
        toast.success(`${type === 'deed' ? 'Title deed' : 'Passport'} uploaded`);
      } else {
        toast.error('Upload failed');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !listingType) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('portal_listings').insert({
        user_id: user.id,
        listing_type: listingType,
        title, description, location, emirate,
        price: price ? parseFloat(price) : null,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area_sqft: areaSqft ? parseFloat(areaSqft) : null,
        property_type: propertyType,
        furnishing,
        rent_frequency: listingType !== 'sale' ? rentFrequency : null,
        cheques: cheques ? parseInt(cheques) : null,
        images,
        title_deed_url: titleDeedUrl || null,
        passport_copy_url: passportUrl || null,
        use_company_contact: useCompanyContact,
        contact_name: useCompanyContact ? null : contactName,
        contact_phone: useCompanyContact ? null : contactPhone,
        contact_email: useCompanyContact ? null : contactEmail,
        status: 'pending',
      });

      if (error) throw error;

      // Update points
      const { data: existingPoints } = await supabase
        .from('portal_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingPoints) {
        await supabase.from('portal_points').update({
          total_listings: (existingPoints.total_listings || 0) + 1,
        }).eq('user_id', user.id);
      } else {
        await supabase.from('portal_points').insert({
          user_id: user.id,
          total_listings: 1,
        });
      }

      toast.success('Listing submitted! Pending approval.');
      navigate('/listing-portal/my-listings');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit listing');
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    switch (currentStep) {
      case 0: return !!listingType;
      case 1: return !!title.trim();
      default: return true;
    }
  };

  return (
    <section className="relative w-full min-h-screen bg-black">
      <div className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-black to-purple-900/15" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/listing-portal')} className="text-zinc-400 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
            </Button>
            <h1 className="text-2xl font-bold text-white mb-6">Submit Your Listing</h1>

            {/* Progress */}
            <div className="flex gap-1 mb-8">
              {steps.map((s, i) => (
                <div key={s} className="flex-1">
                  <div className={`h-1.5 rounded-full ${i <= currentStep ? 'bg-fuchsia-500' : 'bg-zinc-800'}`} />
                  <p className={`text-[10px] mt-1 ${i <= currentStep ? 'text-fuchsia-400' : 'text-zinc-600'}`}>{s}</p>
                </div>
              ))}
            </div>

            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900/60 border border-fuchsia-500/30 rounded-2xl p-6"
            >
              {/* Step 0: Type */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold">What type of listing?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {listingTypes.map(t => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setListingType(t.id)}
                          className={`p-4 rounded-xl border text-left transition-all ${
                            listingType === t.id
                              ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-white'
                              : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-2" />
                          <div className="font-medium text-sm">{t.label}</div>
                          <div className="text-xs text-zinc-500">{t.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 1: Details */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold">Property Details</h2>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Title *</label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Luxury 2BR in Downtown" className="bg-zinc-800/50 border-zinc-600 text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Description</label>
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the property..." className="bg-zinc-800/50 border-zinc-600 text-white min-h-[80px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Emirate</label>
                      <select value={emirate} onChange={e => setEmirate(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm">
                        <option value="">Select</option>
                        {emirates.map(em => <option key={em} value={em}>{em}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Location</label>
                      <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Area/community" className="bg-zinc-800/50 border-zinc-600 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Property Type</label>
                      <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm">
                        <option value="">Select</option>
                        {propertyTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Price (AED)</label>
                      <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" className="bg-zinc-800/50 border-zinc-600 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Bedrooms</label>
                      <Input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} className="bg-zinc-800/50 border-zinc-600 text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Bathrooms</label>
                      <Input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} className="bg-zinc-800/50 border-zinc-600 text-white" />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Area (sqft)</label>
                      <Input type="number" value={areaSqft} onChange={e => setAreaSqft(e.target.value)} className="bg-zinc-800/50 border-zinc-600 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1 block">Furnishing</label>
                      <select value={furnishing} onChange={e => setFurnishing(e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-600 text-white rounded-lg px-3 py-2 text-sm">
                        <option value="">Select</option>
                        {furnishingOptions.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    {listingType !== 'sale' && (
                      <div>
                        <label className="text-xs text-zinc-400 mb-1 block">Cheques</label>
                        <Input type="number" value={cheques} onChange={e => setCheques(e.target.value)} placeholder="1-12" className="bg-zinc-800/50 border-zinc-600 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Photos */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold">Photos (up to 10)</h2>
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">×</button>
                      </div>
                    ))}
                    {images.length < 10 && (
                      <label className="aspect-square rounded-lg border-2 border-dashed border-fuchsia-500/30 flex flex-col items-center justify-center cursor-pointer hover:border-fuchsia-500/60">
                        <Camera className="w-6 h-6 text-fuchsia-400 mb-1" />
                        <span className="text-xs text-zinc-500">Add Photo</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Documents */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold">Documents</h2>
                  <div className="space-y-3">
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                      <label className="text-sm text-white font-medium mb-2 block">Title Deed</label>
                      {titleDeedUrl ? (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <Check className="w-4 h-4" /> Uploaded
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 text-fuchsia-400 text-sm cursor-pointer">
                          <Upload className="w-4 h-4" /> Upload document
                          <input type="file" accept="image/*,.pdf" onChange={e => handleDocUpload(e, 'deed')} className="hidden" />
                        </label>
                      )}
                    </div>
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4">
                      <label className="text-sm text-white font-medium mb-2 block">Passport Copy</label>
                      {passportUrl ? (
                        <div className="flex items-center gap-2 text-emerald-400 text-sm">
                          <Check className="w-4 h-4" /> Uploaded
                        </div>
                      ) : (
                        <label className="flex items-center gap-2 text-fuchsia-400 text-sm cursor-pointer">
                          <Upload className="w-4 h-4" /> Upload document
                          <input type="file" accept="image/*,.pdf" onChange={e => handleDocUpload(e, 'passport')} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Contact */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold">Contact Preference</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => setUseCompanyContact(true)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        useCompanyContact ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="font-medium text-sm">Use JBJ Contact Details</div>
                      <div className="text-xs text-zinc-500 mt-1">Free — JBJ handles inquiries and connects you with buyers</div>
                    </button>
                    <button
                      onClick={() => setUseCompanyContact(false)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        !useCompanyContact ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-white' : 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className="font-medium text-sm">Use My Own Contact</div>
                      <div className="text-xs text-zinc-500 mt-1">Paid tier — your details shown on the listing</div>
                    </button>
                  </div>
                  {!useCompanyContact && (
                    <div className="space-y-3 pt-2">
                      <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Your name" className="bg-zinc-800/50 border-zinc-600 text-white" />
                      <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="Phone number" className="bg-zinc-800/50 border-zinc-600 text-white" />
                      <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="Email address" className="bg-zinc-800/50 border-zinc-600 text-white" />
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="text-white font-semibold">Review Your Listing</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-zinc-500">Type:</span><span className="text-white">{listingTypes.find(t => t.id === listingType)?.label}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Title:</span><span className="text-white">{title}</span></div>
                    {emirate && <div className="flex justify-between"><span className="text-zinc-500">Emirate:</span><span className="text-white">{emirate}</span></div>}
                    {location && <div className="flex justify-between"><span className="text-zinc-500">Location:</span><span className="text-white">{location}</span></div>}
                    {price && <div className="flex justify-between"><span className="text-zinc-500">Price:</span><span className="text-fuchsia-400 font-bold">AED {parseInt(price).toLocaleString()}</span></div>}
                    {propertyType && <div className="flex justify-between"><span className="text-zinc-500">Type:</span><span className="text-white">{propertyType}</span></div>}
                    <div className="flex justify-between"><span className="text-zinc-500">Photos:</span><span className="text-white">{images.length}</span></div>
                    <div className="flex justify-between"><span className="text-zinc-500">Contact:</span><span className="text-white">{useCompanyContact ? 'JBJ Contact' : 'Own Contact'}</span></div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-xs">
                    Your listing will be submitted for review. Once approved, it will appear on the portal.
                  </div>
                </div>
              )}
            </motion.div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                variant="outline"
                className="border-zinc-600 text-zinc-400"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canNext()}
                  className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white"
                >
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white"
                >
                  {submitting ? 'Submitting...' : 'Submit Listing'}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ListingPortalSubmit;
