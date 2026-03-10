/**
 * LANDLORD RENTAL PORTAL
 * Premium portal for landlords to list their rental properties
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Shield, Clock, CheckCircle2, Users, TrendingUp, ArrowRight, Home, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { RentalListingForm } from '@/components/rental/RentalListingForm';
import { ApprovalWorkflowTimeline } from '@/components/rental/ApprovalWorkflowTimeline';
import { CongratulationsModal } from '@/components/rental/CongratulationsModal';
import { useRentalListings, RentalListing } from '@/hooks/useRentalListings';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const BENEFITS = [
  {
    icon: Users,
    title: 'Access Premium Tenants',
    description: 'Connect with verified, qualified tenants actively searching for rental properties in the UAE.',
  },
  {
    icon: Shield,
    title: 'Verified Listings',
    description: 'Our multi-step approval process ensures only quality listings appear on our platform.',
  },
  {
    icon: TrendingUp,
    title: 'Maximum Exposure',
    description: 'Your property will be featured across our network of investors and home seekers.',
  },
  {
    icon: Clock,
    title: 'Quick Approval',
    description: 'Our streamlined process gets your listing live within 24-48 hours.',
  },
];

const LANDLORD_GUIDE_STEPS = [
  {
    step: 1,
    title: 'Submit Your Listing',
    description: 'Fill out our comprehensive listing form with your property details, photos, and rental terms.',
  },
  {
    step: 2,
    title: 'Review Process',
    description: 'Our team reviews your listing to ensure it meets our quality standards and compliance requirements.',
  },
  {
    step: 3,
    title: 'Executive Approval',
    description: 'Senior leadership reviews and approves your listing for publication.',
  },
  {
    step: 4,
    title: 'Go Live',
    description: 'Your listing is published and starts receiving inquiries from qualified tenants.',
  },
];

export default function LandlordRentalPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { listings, isLoading, getApprovalStatus } = useRentalListings();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [showCongrats, setShowCongrats] = useState(false);
  const [approvedListing, setApprovedListing] = useState<RentalListing | null>(null);

  // Check for newly approved listings
  useEffect(() => {
    const newlyLive = listings.find(l => 
      l.status === 'live' && 
      l.went_live_at && 
      new Date(l.went_live_at).getTime() > Date.now() - 60000 // Within last minute
    );
    if (newlyLive && !showCongrats) {
      setApprovedListing(newlyLive);
      setShowCongrats(true);
    }
  }, [listings]);

  const handleListingSuccess = (listing: RentalListing) => {
    setActiveTab('my-listings');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      pending_review: { label: 'Pending Review', className: 'bg-amber-100 text-amber-700' },
      admin_approved: { label: 'Admin Approved', className: 'bg-blue-100 text-blue-700' },
      assistant_approved: { label: 'Executive Approved', className: 'bg-purple-100 text-purple-700' },
      founder_approved: { label: 'CEO Approved', className: 'bg-green-100 text-green-700' },
      live: { label: 'Live', className: 'bg-green-500 text-white' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
      withdrawn: { label: 'Withdrawn', className: 'bg-gray-100 text-gray-600' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Champagne Theme */}
      <section className="relative py-20 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gold/10 to-champagne/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-champagne/20 to-gold/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-4 bg-gradient-to-r from-gold/20 to-champagne/20 text-foreground border-gold/30">
              <Home className="h-3 w-3 mr-1" />
              Landlord Portal
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              List Your Property for{' '}
              <span className="bg-gradient-to-r from-gold via-amber-500 to-champagne bg-clip-text text-transparent">
                Rent
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join the UAE's most prestigious rental platform. Connect with verified tenants and maximize your property's earning potential with JBJ Global Real Estate.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => isAuthenticated ? setActiveTab('list-property') : navigate('/auth?redirect=/landlord-portal?tab=list-property')}
                className="bg-gradient-to-r from-gold to-champagne text-black hover:opacity-90 shadow-lg shadow-gold/20 h-14 px-8 text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                List Your Property
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setActiveTab('guide')}
                className="h-14 px-8 text-lg border-gold/30 hover:bg-gold/5"
              >
                How It Works
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-white/80 backdrop-blur-sm border border-gold/30 hover:border-gold/60 transition-colors hover:shadow-[0_8px_30px_rgba(200,167,102,0.3)] rounded-2xl">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-4">
                      <benefit.icon className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="font-semibold mb-2 text-black">{benefit.title}</h3>
                    <p className="text-sm text-zinc-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/60 border border-gold/30 mb-8">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                Overview
              </TabsTrigger>
              <TabsTrigger value="guide" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                Landlord Guide
              </TabsTrigger>
              <TabsTrigger value="list-property" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                List Property
              </TabsTrigger>
              {isAuthenticated && (
                <TabsTrigger value="my-listings" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                  My Listings
                  {listings.length > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-zinc-700">
                      {listings.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white/80 backdrop-blur-sm border border-gold/30 rounded-2xl shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-black">Why List With Us?</CardTitle>
                    <CardDescription className="text-zinc-600">
                      JBJ Global Real Estate offers unparalleled exposure and service
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      'Access to 10,000+ verified tenants',
                      'Professional photography services available',
                      'Dedicated account manager',
                      'Market analysis and pricing guidance',
                      'Legal documentation support',
                      'Tenant verification and background checks',
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-zinc-300">{item}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">Approval Process</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Our quality assurance workflow
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {LANDLORD_GUIDE_STEPS.map((step, index) => (
                        <div key={step.step} className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-champagne flex items-center justify-center flex-shrink-0 text-black font-semibold text-sm">
                            {step.step}
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{step.title}</h4>
                            <p className="text-sm text-zinc-400">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => isAuthenticated ? setActiveTab('list-property') : navigate('/auth?redirect=/landlord-portal?tab=list-property')}
                  className="bg-gradient-to-r from-gold to-champagne text-black hover:opacity-90 h-14 px-8"
                >
                  Start Listing Your Property
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </TabsContent>

            {/* Guide Tab */}
            <TabsContent value="guide" className="space-y-8">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Complete Landlord Guide</CardTitle>
                  <CardDescription className="text-zinc-400">
                    Everything you need to know about listing your rental property
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {LANDLORD_GUIDE_STEPS.map((step, index) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      {index < LANDLORD_GUIDE_STEPS.length - 1 && (
                        <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-zinc-700" />
                      )}
                      <div className="flex gap-6">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-champagne flex items-center justify-center flex-shrink-0 text-black font-bold z-10">
                          {step.step}
                        </div>
                        <div className="flex-1 pb-8">
                          <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                          <p className="text-zinc-400">{step.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => isAuthenticated ? setActiveTab('list-property') : navigate('/auth?redirect=/landlord-portal?tab=list-property')}
                  className="bg-gradient-to-r from-gold to-champagne text-black hover:opacity-90 h-14 px-8"
                >
                  Ready to List? Start Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </TabsContent>

            {/* List Property Tab */}
            <TabsContent value="list-property">
              {!isAuthenticated ? (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-16 w-16 text-gold mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Sign In to List Your Property
                    </h3>
                    <p className="text-zinc-400 mb-6">
                      Create an account or sign in to submit your rental listing
                    </p>
                    <Button
                      onClick={() => navigate('/auth?redirect=/landlord-portal?tab=list-property')}
                      className="bg-gradient-to-r from-gold to-champagne text-black hover:opacity-90"
                    >
                      Sign In / Register
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">Submit Your Rental Listing</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Complete the form below to list your property for rent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RentalListingForm onSuccess={handleListingSuccess} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* My Listings Tab */}
            {isAuthenticated && (
              <TabsContent value="my-listings" className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full mx-auto" />
                    <p className="text-zinc-400 mt-4">Loading your listings...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-12 text-center">
                      <Home className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">
                        No Listings Yet
                      </h3>
                      <p className="text-zinc-400 mb-6">
                        You haven't submitted any rental listings yet
                      </p>
                      <Button
                        onClick={() => setActiveTab('list-property')}
                        className="bg-gradient-to-r from-gold to-champagne text-black hover:opacity-90"
                      >
                        Create Your First Listing
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {listings.map((listing) => {
                      const approvalStatus = getApprovalStatus(listing);
                      return (
                        <Card key={listing.id} className="bg-zinc-900 border-zinc-800">
                          <CardContent className="p-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                              {/* Listing Info */}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-white">
                                      {listing.property_title}
                                    </h3>
                                    <p className="text-zinc-400 text-sm">
                                      {listing.community}, {listing.emirate}
                                    </p>
                                  </div>
                                  {getStatusBadge(listing.status)}
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs text-zinc-500">Type</p>
                                    <p className="text-zinc-300 capitalize">{listing.property_type}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-zinc-500">Bedrooms</p>
                                    <p className="text-zinc-300">{listing.bedrooms || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-zinc-500">Annual Rent</p>
                                    <p className="text-zinc-300">AED {listing.annual_rent?.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-zinc-500">Submitted</p>
                                    <p className="text-zinc-300">{format(new Date(listing.created_at), 'PP')}</p>
                                  </div>
                                </div>

                                {/* Quick Status */}
                                <div className="flex items-center gap-2 text-sm">
                                  {listing.status !== 'live' && listing.status !== 'rejected' && (
                                    <span className="text-amber-500">
                                      Step {approvalStatus.currentStep} of 3 — In Progress
                                    </span>
                                  )}
                                  {listing.status === 'live' && (
                                    <span className="text-green-500">Your listing is live</span>
                                  )}
                                  {listing.status === 'rejected' && (
                                    <span className="text-red-500">{listing.rejection_reason || 'Listing was rejected'}</span>
                                  )}
                                </div>
                              </div>

                              {/* Approval Timeline */}
                              <div className="lg:w-96 lg:border-l lg:border-zinc-800 lg:pl-6">
                                <ApprovalWorkflowTimeline
                                  steps={approvalStatus.steps}
                                  currentStep={approvalStatus.currentStep}
                                  isLive={approvalStatus.isLive}
                                  isRejected={approvalStatus.isRejected}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>

      {/* Congratulations Modal */}
      {approvedListing && (
        <CongratulationsModal
          isOpen={showCongrats}
          onClose={() => setShowCongrats(false)}
          listingTitle={approvedListing.property_title}
          listingId={approvedListing.id}
        />
      )}
    </div>
  );
}
