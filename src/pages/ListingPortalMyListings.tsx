import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus, ArrowLeft, Trash2, Edit, Eye, Clock, CheckCircle,
  XCircle, Star, Award, Sparkles, Shield, Upload
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MyListing {
  id: string;
  title: string;
  listing_type: string;
  status: string;
  price: number;
  currency: string;
  is_featured: boolean;
  created_at: string;
}

interface PointsData {
  points: number;
  total_listings: number;
  free_listings_remaining: number;
  tier: string;
}

interface Verification {
  status: string;
  rera_number: string;
  company_name: string;
}

const ListingPortalMyListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listings, setListings] = useState<MyListing[]>([]);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);

  // Verification form
  const [reraNumber, setReraNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showVerForm, setShowVerForm] = useState(false);

  useEffect(() => {
    if (user?.id) fetchAll();
  }, [user?.id]);

  const fetchAll = async () => {
    setLoading(true);
    const [listingsRes, pointsRes, verRes] = await Promise.all([
      supabase.from('portal_listings').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
      supabase.from('portal_points').select('*').eq('user_id', user!.id).single(),
      supabase.from('broker_verifications').select('*').eq('user_id', user!.id).single(),
    ]);

    if (listingsRes.data) {
      setListings(listingsRes.data.map(d => ({
        ...d,
        price: Number(d.price) || 0,
      })));
    }
    if (pointsRes.data) setPoints(pointsRes.data as PointsData);
    if (verRes.data) setVerification(verRes.data as Verification);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    const { error } = await supabase.from('portal_listings').delete().eq('id', id);
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== id));
      toast.success('Listing deleted');
    }
  };

  const handleVerificationSubmit = async () => {
    if (!reraNumber.trim()) { toast.error('Enter RERA number'); return; }
    const { error } = await supabase.from('broker_verifications').upsert({
      user_id: user!.id,
      rera_number: reraNumber,
      company_name: companyName,
      status: 'pending',
    }, { onConflict: 'user_id' });
    if (!error) {
      toast.success('Verification submitted!');
      setShowVerForm(false);
      fetchAll();
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  if (!user) {
    return (
      <section className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl font-bold mb-4">Please sign in</h2>
          <Button onClick={() => navigate('/auth')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">Sign In</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-screen bg-black">
      <div className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 via-black to-purple-900/15" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/listing-portal')} className="text-zinc-400 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
            </Button>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-white">My Listings</h1>
              <Button onClick={() => navigate('/listing-portal/submit')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> New Listing
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-xl p-4 text-center">
                <Star className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{points?.points || 0}</p>
                <p className="text-xs text-zinc-500">Points</p>
              </div>
              <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-xl p-4 text-center">
                <Award className="w-5 h-5 text-fuchsia-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-white capitalize">{points?.tier || 'Starter'}</p>
                <p className="text-xs text-zinc-500">Tier</p>
              </div>
              <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-xl p-4 text-center">
                <Sparkles className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-2xl font-bold text-white">{points?.free_listings_remaining ?? 3}</p>
                <p className="text-xs text-zinc-500">Free Left</p>
              </div>
              <div className="bg-zinc-900/60 border border-fuchsia-500/20 rounded-xl p-4 text-center">
                <Shield className={`w-5 h-5 mx-auto mb-1 ${verification?.status === 'verified' ? 'text-emerald-400' : 'text-zinc-600'}`} />
                <p className="text-sm font-bold text-white capitalize">{verification?.status || 'Not Verified'}</p>
                <p className="text-xs text-zinc-500">Broker Status</p>
              </div>
            </div>

            {/* Verification */}
            {(!verification || verification.status === 'pending') && (
              <div className="bg-zinc-900/60 border border-amber-500/30 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold text-sm">Broker Verification</h3>
                    <p className="text-zinc-500 text-xs">
                      {verification?.status === 'pending' ? 'Your verification is under review' : 'Get verified to earn 2x points'}
                    </p>
                  </div>
                  {!verification && (
                    <Button size="sm" onClick={() => setShowVerForm(!showVerForm)} className="bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Upload className="w-3 h-3 mr-1" /> Verify
                    </Button>
                  )}
                </div>
                {showVerForm && (
                  <div className="mt-4 space-y-3">
                    <Input value={reraNumber} onChange={e => setReraNumber(e.target.value)} placeholder="RERA Number" className="bg-zinc-800/50 border-zinc-600 text-white" />
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" className="bg-zinc-800/50 border-zinc-600 text-white" />
                    <Button onClick={handleVerificationSubmit} size="sm" className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">Submit Verification</Button>
                  </div>
                )}
              </div>
            )}

            {/* Listings */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mx-auto" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 bg-zinc-900/40 border border-zinc-800 rounded-2xl">
                <h3 className="text-white font-semibold mb-2">No listings yet</h3>
                <p className="text-zinc-500 text-sm mb-4">Submit your first property listing!</p>
                <Button onClick={() => navigate('/listing-portal/submit')} className="bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white">Submit Listing</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map(listing => (
                  <div key={listing.id} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-fuchsia-500/30 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {statusIcon(listing.status)}
                        <h3 className="text-white font-medium text-sm">{listing.title}</h3>
                        {listing.is_featured && <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">Featured</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <Badge className={`text-[10px] ${statusColor(listing.status)}`}>{listing.status}</Badge>
                        <span>{listing.currency} {listing.price.toLocaleString()}</span>
                        <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="text-zinc-500 hover:text-red-400" onClick={() => handleDelete(listing.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ListingPortalMyListings;
