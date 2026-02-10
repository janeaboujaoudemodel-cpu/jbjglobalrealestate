import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, MapPin, Bed, Bath, Maximize, ArrowRight, Plus,
  Sparkles, SlidersHorizontal, Building, Home, Hotel
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
    <section className="relative w-full min-h-screen bg-black">
      {/* Hero */}
      <div className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-black to-purple-900/15" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Badge className="mb-4 bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Property Portal
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
              JBJ Listing{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">Portal</span>
            </h1>
            <p className="text-zinc-400 mb-6">Browse properties for sale and rent across the UAE.</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate('/listing-portal/submit')}
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Submit Your Listing
              </Button>
              <Button
                onClick={() => navigate('/listing-portal/my-listings')}
                variant="outline"
                className="border-fuchsia-500/40 text-fuchsia-300 hover:bg-fuchsia-500/20"
              >
                My Listings
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">
        {/* Search & Filters */}
        <div className="max-w-5xl mx-auto mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or location..."
              className="pl-12 bg-zinc-900/60 border-fuchsia-500/30 text-white placeholder:text-zinc-500 h-12"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map(f => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(f.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm border transition-all ${
                    typeFilter === f.id
                      ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300'
                      : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Listings Grid */}
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-500">Loading listings...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
              <Building className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">No listings yet</h3>
              <p className="text-zinc-500 text-sm mb-4">Be the first to submit a property listing!</p>
              <Button
                onClick={() => navigate('/listing-portal/submit')}
                className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white"
              >
                Submit Listing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(listing => (
                <motion.div
                  key={listing.id}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden hover:border-fuchsia-500/40 transition-all group"
                  whileHover={{ y: -4 }}
                >
                  <div className="h-48 bg-zinc-800 relative">
                    {listing.images[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building className="w-12 h-12 text-zinc-600" />
                      </div>
                    )}
                    {listing.is_featured && (
                      <Badge className="absolute top-3 left-3 bg-amber-500 text-black text-xs">Featured</Badge>
                    )}
                    <Badge className="absolute top-3 right-3 bg-zinc-900/80 text-zinc-300 text-xs border-zinc-700">
                      {listing.listing_type === 'sale' ? 'For Sale' : listing.listing_type === 'yearly_rent' ? 'Rent' : listing.listing_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{listing.title}</h3>
                    {listing.location && (
                      <p className="text-zinc-500 text-xs flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" /> {listing.location}
                      </p>
                    )}
                    <p className="text-fuchsia-400 font-bold text-lg mb-3">
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
    </section>
  );
};

export default ListingPortal;
