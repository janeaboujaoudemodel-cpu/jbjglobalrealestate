import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus, ArrowLeft, Trash2, Edit, Clock, CheckCircle,
  XCircle, Star, Award, Sparkles, Shield, Upload, RotateCcw, AlertTriangle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MyListing {
  id: string;
  title: string;
  listing_type: string;
  status: string;
  price: number;
  currency: string;
  is_featured: boolean;
  created_at: string;
  deleted_at: string | null;
  expires_at: string | null;
  edit_count: number;
  contact_mode: string | null;
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
  const [deletedListings, setDeletedListings] = useState<MyListing[]>([]);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);

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
      const all = listingsRes.data.map((d: any) => ({
        ...d,
        price: Number(d.price) || 0,
        deleted_at: d.deleted_at || null,
        expires_at: d.expires_at || null,
        edit_count: d.edit_count || 0,
        contact_mode: d.contact_mode || null,
      }));
      setListings(all.filter((l: MyListing) => !l.deleted_at));
      setDeletedListings(all.filter((l: MyListing) => !!l.deleted_at));
    }
    if (pointsRes.data) setPoints(pointsRes.data as PointsData);
    if (verRes.data) setVerification(verRes.data as Verification);
    setLoading(false);
  };

  const handleDeleteClick = (id: string) => {
    setListingToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!listingToDelete) return;
    // Soft delete
    const { error } = await supabase
      .from('portal_listings')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', listingToDelete);
    if (!error) {
      const deleted = listings.find(l => l.id === listingToDelete);
      if (deleted) {
        setListings(prev => prev.filter(l => l.id !== listingToDelete));
        setDeletedListings(prev => [{ ...deleted, deleted_at: new Date().toISOString() }, ...prev]);
      }
      toast.success('Listing moved to Recently Deleted');
    }
    setDeleteDialogOpen(false);
    setListingToDelete(null);
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase
      .from('portal_listings')
      .update({ deleted_at: null } as any)
      .eq('id', id);
    if (!error) {
      const restored = deletedListings.find(l => l.id === id);
      if (restored) {
        setDeletedListings(prev => prev.filter(l => l.id !== id));
        setListings(prev => [{ ...restored, deleted_at: null }, ...prev]);
      }
      toast.success('Listing restored');
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/listing-portal/submit?edit=${id}`);
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
      case 'approved': return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-[#C9A84C]" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-[#F5EBD7] text-[#8B7355] border-[#C9A84C]/30';
    }
  };

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (!user) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-black text-xl font-bold mb-4">Please sign in</h2>
          <Button onClick={() => navigate('/auth')} className="bg-gold hover:bg-gold/90 text-black">Sign In</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <div className="relative py-12 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => navigate('/listing-portal')} className="text-zinc-500 hover:text-gold mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portal
            </Button>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-bold text-black">My Listings</h1>
              <Button onClick={() => navigate('/listing-portal/submit')} className="bg-gold hover:bg-gold/90 text-black">
                <Plus className="w-4 h-4 mr-2" /> New Listing
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white border-2 border-gold/20 rounded-xl p-4 text-center">
                <Star className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-2xl font-bold text-black">{points?.points || 0}</p>
                <p className="text-xs text-zinc-500">Points</p>
              </div>
              <div className="bg-white border-2 border-gold/20 rounded-xl p-4 text-center">
                <Award className="w-5 h-5 text-gold mx-auto mb-1" />
                <p className="text-sm font-bold text-black capitalize">{points?.tier || 'Starter'}</p>
                <p className="text-xs text-zinc-500">Tier</p>
              </div>
              <div className="bg-white border-2 border-gold/20 rounded-xl p-4 text-center">
                <Sparkles className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-black">{points?.free_listings_remaining ?? 3}</p>
                <p className="text-xs text-zinc-500">Free Left</p>
              </div>
              <div className="bg-white border-2 border-gold/20 rounded-xl p-4 text-center">
                <Shield className={`w-5 h-5 mx-auto mb-1 ${verification?.status === 'verified' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                <p className="text-sm font-bold text-black capitalize">{verification?.status || 'Not Verified'}</p>
                <p className="text-xs text-zinc-500">Broker Status</p>
              </div>
            </div>

            {/* Verification */}
            {(!verification || verification.status === 'pending') && (
              <div className="bg-white border-2 border-gold/30 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-black font-semibold text-sm">Broker Verification</h3>
                    <p className="text-zinc-500 text-xs">
                      {verification?.status === 'pending' ? 'Your verification is under review' : 'Get verified to earn 2x points'}
                    </p>
                  </div>
                  {!verification && (
                    <Button size="sm" onClick={() => setShowVerForm(!showVerForm)} className="bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25">
                      <Upload className="w-3 h-3 mr-1" /> Verify
                    </Button>
                  )}
                </div>
                {showVerForm && (
                  <div className="mt-4 space-y-3">
                    <Input value={reraNumber} onChange={e => setReraNumber(e.target.value)} placeholder="RERA Number" className="bg-white border-gold/30 text-black" />
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" className="bg-white border-gold/30 text-black" />
                    <Button onClick={handleVerificationSubmit} size="sm" className="bg-gold hover:bg-gold/90 text-black">Submit Verification</Button>
                  </div>
                )}
              </div>
            )}

            {/* Tabs: Active / Recently Deleted */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('active')}
                className={activeTab === 'active' ? 'bg-gold text-black hover:bg-gold/90' : 'border-gold/30 text-black/60 hover:bg-gold/10'}
              >
                Active ({listings.length})
              </Button>
              <Button
                variant={activeTab === 'deleted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('deleted')}
                className={activeTab === 'deleted' ? 'bg-gold text-black hover:bg-gold/90' : 'border-gold/30 text-black/60 hover:bg-gold/10'}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Recently Deleted ({deletedListings.length})
              </Button>
            </div>

            {/* Listings */}
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
              </div>
            ) : activeTab === 'active' ? (
              listings.length === 0 ? (
                <div className="text-center py-12 bg-white/60 border-2 border-gold/20 rounded-2xl">
                  <h3 className="text-black font-semibold mb-2">No listings yet</h3>
                  <p className="text-zinc-500 text-sm mb-4">Submit your first property listing!</p>
                  <Button onClick={() => navigate('/listing-portal/submit')} className="bg-gold hover:bg-gold/90 text-black">Submit Listing</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {listings.map(listing => {
                    const daysLeft = getDaysUntilExpiry(listing.expires_at);
                    return (
                      <div key={listing.id} className="bg-white border-2 border-gold/20 rounded-xl p-4 flex items-center justify-between hover:border-gold/50 transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {statusIcon(listing.status)}
                            <h3 className="text-black font-medium text-sm">{listing.title}</h3>
                            {listing.is_featured && <Badge className="bg-gold/15 text-gold border-gold/30 text-[10px]">Featured</Badge>}
                            {listing.listing_type === 'rent' && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-[10px]">For Rent</Badge>
                            )}
                            {listing.listing_type === 'sale' && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]">For Sale</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <Badge className={`text-[10px] ${statusColor(listing.status)}`}>{listing.status}</Badge>
                            <span>{listing.currency} {listing.price.toLocaleString()}</span>
                            <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                            {listing.edit_count > 0 && (
                              <span className="text-black/40">Edited {listing.edit_count}x</span>
                            )}
                            {daysLeft !== null && daysLeft <= 7 && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]">
                                {daysLeft === 0 ? 'Expired' : `${daysLeft}d left`}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-gold" onClick={() => handleEdit(listing.id)} title="Edit listing">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-red-500" onClick={() => handleDeleteClick(listing.id)} title="Delete listing">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              deletedListings.length === 0 ? (
                <div className="text-center py-12 bg-white/60 border-2 border-gold/20 rounded-2xl">
                  <Trash2 className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                  <h3 className="text-black font-semibold mb-2">No deleted listings</h3>
                  <p className="text-zinc-500 text-sm">Deleted listings will appear here for restoration.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedListings.map(listing => (
                    <div key={listing.id} className="bg-white/60 border-2 border-red-200/50 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Trash2 className="w-4 h-4 text-red-400" />
                          <h3 className="text-black/50 font-medium text-sm line-through">{listing.title}</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span>{listing.currency} {listing.price.toLocaleString()}</span>
                          <span>Deleted {listing.deleted_at ? new Date(listing.deleted_at).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gold/30 text-gold hover:bg-gold/10"
                        onClick={() => handleRestore(listing.id)}
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border-2 border-gold/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-black">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Delete Listing?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-600">
              Are you sure you want to delete this listing? You can restore it anytime from the "Recently Deleted" tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gold/30 text-black hover:bg-gold/10">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 text-white hover:bg-red-600">
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default ListingPortalMyListings;