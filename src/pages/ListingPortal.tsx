import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import {
  Search, MapPin, Bed, Bath, Maximize, ArrowRight, Plus,
  Sparkles, Building, Home, Hotel, FileText, Wand2,
  ClipboardCheck, Upload, Eye, Star, DollarSign
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  listing_type: string;
  location: string;
  emirate: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  property_type: string;
  images: string[];
  is_featured: boolean;
}

const typeFilters = [
  { id: 'all', label: 'All', icon: Building },
  { id: 'sale', label: 'For Sale', icon: Home },
  { id: 'yearly_rent', label: 'Yearly Rent', icon: Building },
  { id: 'short_term_rental', label: 'Short-term', icon: Hotel },
  { id: 'holiday_home', label: 'Holiday Home', icon: Hotel },
];

const ListingPortal = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState<'manual' | 'ai' | null>(null);

  const handlePurposeSelect = (purpose: 'sale' | 'rent') => {
    if (selectedMethod === 'manual') {
      navigate(`/seller-listing?purpose=${purpose}`);
    } else {
      navigate(`/listing-portal/submit?purpose=${purpose}`);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [typeFilter]);

  const fetchListings = async () => {
    setLoading(true);
    let query = supabase
      .from('portal_listings')
      .select('*')
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (typeFilter !== 'all') {
      query = query.eq('listing_type', typeFilter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setListings(data.map(d => ({
        ...d,
        images: (d.images as string[]) || [],
        price: Number(d.price) || 0,
        bedrooms: d.bedrooms || 0,
        bathrooms: d.bathrooms || 0,
        area_sqft: Number(d.area_sqft) || 0,
      })));
    }
    setLoading(false);
  };

  const filtered = listings.filter(l =>
    !search || l.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.location?.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  return (
    <>
      <SEOHead
        title="Listing Portal | JBJ Global Real Estate"
        description="List your property for sale or rent using our manual form or AI-powered listing creator. Browse approved listings across the UAE."
      />
      <section className="relative w-full min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Hero */}
        <div className="relative py-16 md:py-20 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Badge className="mb-4 bg-gold/15 text-gold border-gold/40 px-4 py-2">
                <Building className="w-4 h-4 mr-2" />
                JBJ Listing Portal
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-3">
                List Your Property with{" "}
                <span className="text-gold">JBJ</span>
              </h1>
              <p className="text-zinc-600 mb-2">
                Submit your property for sale or rent — manually or with AI assistance.
              </p>
              <p className="text-zinc-500 text-sm">
                All listings are reviewed by our team and AI scoring before going live.
              </p>
            </motion.div>

            {/* Two Cards: Manual vs AI — with background layer */}
            {!selectedMethod ? (
              <div className="max-w-4xl mx-auto mb-16">
                <div className="relative">
                  <div className="absolute inset-0 -m-4 rounded-3xl bg-white/50 border border-gold/20 shadow-[0_8px_40px_rgba(200,167,102,0.12)]" />
                  <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                    {/* Manual Listing Card */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      onClick={() => setSelectedMethod('manual')}
                      className="group cursor-pointer bg-white border-2 border-gold/30 rounded-2xl p-8 hover:border-gold/70 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.25)] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/8 to-transparent rounded-bl-full" />
                      <div className="relative z-10">
                        <div className="w-14 h-14 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mb-5">
                          <ClipboardCheck className="w-7 h-7 text-gold" />
                        </div>
                        <h2 className="text-xl font-bold text-black mb-2">Manual Listing</h2>
                        <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                          Fill in your property details step by step. Upload photos, documents, and set your price manually with full control.
                        </p>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center gap-2 text-zinc-700 text-sm">
                            <FileText className="w-4 h-4 text-gold" />
                            Step-by-step guided form
                          </li>
                          <li className="flex items-center gap-2 text-zinc-700 text-sm">
                            <Upload className="w-4 h-4 text-gold" />
                            Upload photos & documents
                          </li>
                          <li className="flex items-center gap-2 text-zinc-700 text-sm">
                            <Star className="w-4 h-4 text-gold" />
                            AI description generator included
                          </li>
                        </ul>
                        <div className="flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                          <span>Start Manual Listing</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>

                    {/* AI Listing Card */}
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      onClick={() => setSelectedMethod('ai')}
                      className="group cursor-pointer bg-white border-2 border-gold/30 rounded-2xl p-8 hover:border-gold/70 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.25)] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold/8 to-transparent rounded-bl-full" />
                      <Badge className="absolute top-4 right-4 bg-gold/15 text-gold border-gold/40 text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Powered
                      </Badge>
                      <div className="relative z-10">
                        <div className="w-14 h-14 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mb-5">
                          <Wand2 className="w-7 h-7 text-gold" />
                        </div>
                        <h2 className="text-xl font-bold text-black mb-2">List with AI</h2>
                        <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                          Upload brochures, photos, or documents and let AI extract all property details automatically.
                        </p>
                        <ul className="space-y-2 mb-6">
                          <li className="flex items-center gap-2 text-zinc-700 text-sm">
                            <Wand2 className="w-4 h-4 text-gold" />
                            AI extracts all property data
                          </li>
                          <li className="flex items-center gap-2 text-zinc-700 text-sm">
                            <Eye className="w-4 h-4 text-gold" />
                            Review & edit before submitting
                          </li>
                          <li className="flex items-center gap-2 text-zinc-700 text-sm">
                            <Sparkles className="w-4 h-4 text-gold" />
                            Supports brochures, PDFs & images
                          </li>
                        </ul>
                        <div className="flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                          <span>Start AI Listing</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            ) : (
              /* Sale / Rent Selection Step */
              <div className="max-w-4xl mx-auto mb-16">
                <div className="relative">
                  <div className="absolute inset-0 -m-4 rounded-3xl bg-white/50 border border-gold/20 shadow-[0_8px_40px_rgba(200,167,102,0.12)]" />
                  <div className="relative p-4">
                    <button
                      onClick={() => setSelectedMethod(null)}
                      className="flex items-center gap-2 text-zinc-500 hover:text-gold text-sm mb-6 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                      Back to listing method
                    </button>
                    <h2 className="text-xl font-bold text-black text-center mb-2">
                      What would you like to list for?
                    </h2>
                    <p className="text-zinc-500 text-sm text-center mb-8">
                      Choose whether you're listing your property for sale or for rent
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => handlePurposeSelect('sale')}
                        className="group cursor-pointer bg-white border-2 border-gold/30 rounded-2xl p-8 hover:border-gold/70 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.25)] text-center"
                      >
                        <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mx-auto mb-5">
                          <DollarSign className="w-8 h-8 text-gold" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">List for Sale</h3>
                        <p className="text-zinc-600 text-sm mb-4">
                          Sell your property at the best market price with professional listing support.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                          <span>Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        onClick={() => handlePurposeSelect('rent')}
                        className="group cursor-pointer bg-white border-2 border-gold/30 rounded-2xl p-8 hover:border-gold/70 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.25)] text-center"
                      >
                        <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-xl flex items-center justify-center mx-auto mb-5">
                          <Home className="w-8 h-8 text-gold" />
                        </div>
                        <h3 className="text-xl font-bold text-black mb-2">List for Rent</h3>
                        <p className="text-zinc-600 text-sm mb-4">
                          Find reliable tenants for your property with our rental listing service.
                        </p>
                        <div className="flex items-center justify-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                          <span>Continue</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* My Listings Button — solid, not faded */}
            <div className="text-center mb-8">
              <Button
                onClick={() => navigate('/listing-portal/my-listings')}
                className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 text-black hover:border-gold hover:shadow-[0_4px_20px_rgba(200,167,102,0.3)] px-8 py-3 h-auto"
              >
                <Eye className="w-4 h-4 mr-2 text-gold" />
                View My Listings
              </Button>
            </div>
          </div>
        </div>

        {/* Browse Approved Listings */}
        <div className="container mx-auto px-4 pb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-black mb-2">Browse Listed Properties</h2>
            <p className="text-zinc-500 text-sm">Approved listings across the UAE</p>
          </div>

          {/* Search & Filters */}
          <div className="max-w-5xl mx-auto mb-8 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or location..."
                className="pl-12 bg-white border-gold/30 text-black placeholder:text-zinc-400 h-12"
              />
            </div>
            <div className="space-y-2">
              {/* Row 1: All, For Sale, Yearly Rent */}
              <div className="flex justify-center gap-2">
                {typeFilters.filter(f => ['all', 'sale', 'yearly_rent'].includes(f.id)).map(f => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setTypeFilter(f.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border transition-all ${
                        typeFilter === f.id
                          ? 'bg-gold/20 border-gold/50 text-gold'
                          : 'bg-white border-gold/20 text-zinc-600 hover:border-gold/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {f.label}
                    </button>
                  );
                })}
              </div>
              {/* Row 2: Short-term, Holiday Home — centered */}
              <div className="flex justify-center gap-2 max-w-md mx-auto">
                {typeFilters.filter(f => ['short_term_rental', 'holiday_home'].includes(f.id)).map(f => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setTypeFilter(f.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm border transition-all ${
                        typeFilter === f.id
                          ? 'bg-gold/20 border-gold/50 text-gold'
                          : 'bg-white border-gold/20 text-zinc-600 hover:border-gold/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="max-w-5xl mx-auto">
            {/* Background layer behind listings */}
            <div className="relative">
              <div className="absolute inset-0 -m-4 rounded-3xl bg-white/40 border border-gold/15" />
              <div className="relative p-4">
                {loading ? (
                  <div className="text-center py-20">
                    <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-500">Loading listings...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-20 bg-white/60 border border-gold/20 rounded-2xl">
                    <Building className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                    <h3 className="text-black font-semibold mb-2">No listings yet</h3>
                    <p className="text-zinc-500 text-sm mb-4">Be the first to submit a property listing!</p>
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => navigate('/seller-listing')}
                        className="bg-gold hover:bg-gold/90 text-black border-0"
                      >
                        <ClipboardCheck className="w-4 h-4 mr-2" /> Manual Listing
                      </Button>
                      <Button
                        onClick={() => navigate('/listing-portal/submit')}
                        className="bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 text-black hover:border-gold"
                      >
                        <Wand2 className="w-4 h-4 mr-2 text-gold" /> AI Listing
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(listing => (
                      <motion.div
                        key={listing.id}
                        className="bg-white border-2 border-gold/20 rounded-2xl overflow-hidden hover:border-gold/50 transition-all group hover:shadow-[0_8px_30px_rgba(200,167,102,0.2)]"
                        whileHover={{ y: -4 }}
                      >
                        <div className="h-48 bg-[#F5F0E6] relative">
                          {listing.images[0] ? (
                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building className="w-12 h-12 text-zinc-400" />
                            </div>
                          )}
                          {listing.is_featured && (
                            <Badge className="absolute top-3 left-3 bg-gold text-black text-xs border-0">Featured</Badge>
                          )}
                          <Badge className="absolute top-3 right-3 bg-white/90 text-zinc-700 text-xs border-gold/20">
                            {listing.listing_type === 'sale' ? 'For Sale' : listing.listing_type === 'yearly_rent' ? 'Rent' : listing.listing_type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="p-4">
                          <h3 className="text-black font-semibold text-sm mb-1 line-clamp-1">{listing.title}</h3>
                          {listing.location && (
                            <p className="text-zinc-500 text-xs flex items-center gap-1 mb-2">
                              <MapPin className="w-3 h-3" /> {listing.location}
                            </p>
                          )}
                          <p className="text-gold font-bold text-lg mb-3">
                            {formatPrice(listing.price, listing.currency)}
                          </p>
                          <div className="flex gap-4 text-zinc-500 text-xs">
                            {listing.bedrooms > 0 && (
                              <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {listing.bedrooms}</span>
                            )}
                            {listing.bathrooms > 0 && (
                              <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {listing.bathrooms}</span>
                            )}
                            {listing.area_sqft > 0 && (
                              <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {listing.area_sqft} sqft</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ListingPortal;
