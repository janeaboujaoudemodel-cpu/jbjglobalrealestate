import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  FileSignature,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Eye,
  Loader2,
  Trash2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/MainLayout";
import SignaturePad from "@/components/referral/SignaturePad";
import AISignatureGenerator from "@/components/signature/AISignatureGenerator";
import { format } from "date-fns";

interface ReferralPartner {
  id: string;
  referral_code: string;
  full_name: string;
  email: string;
  phone_e164: string | null;
  nationality: string | null;
  status: string;
  commission_rate: number;
  created_at: string;
}

interface CodeUsage {
  id: string;
  referral_code: string;
  used_by_name: string;
  used_by_email: string;
  used_by_phone: string | null;
  property_interest: string | null;
  source: string;
  status: string;
  created_at: string;
  referral_partner_id: string | null;
}

export default function ReferralAdmin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState("");
  const [searchResults, setSearchResults] = useState<ReferralPartner[]>([]);
  const [codeUsages, setCodeUsages] = useState<CodeUsage[]>([]);
  const [allPartners, setAllPartners] = useState<ReferralPartner[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [companySignature, setCompanySignature] = useState<string | null>(null);
  const [companyStampText, setCompanyStampText] = useState("JBJ Global Real Estate L.L.C.");
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ReferralPartner | null>(null);

  useEffect(() => {
    loadSettings();
    loadAllPartners();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('referral_settings')
      .select('*');

    if (data && !error) {
      const signatureSetting = data.find((s: any) => s.setting_key === 'company_signature_url');
      const stampSetting = data.find((s: any) => s.setting_key === 'company_stamp_text');
      if (signatureSetting?.setting_value) setCompanySignature(signatureSetting.setting_value);
      if (stampSetting?.setting_value) setCompanyStampText(stampSetting.setting_value);
    }
  };

  const loadAllPartners = async () => {
    const { data, error } = await supabase
      .from('referral_partners')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && !error) {
      setAllPartners(data as ReferralPartner[]);
    }
  };

  const handleSearch = async () => {
    if (!searchCode.trim()) {
      toast.error("Please enter a referral code to search");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setCodeUsages([]);

    try {
      // Search for partner by code
      const { data: partners, error: partnerError } = await supabase
        .from('referral_partners')
        .select('*')
        .ilike('referral_code', `%${searchCode.trim()}%`);

      if (partnerError) throw partnerError;

      setSearchResults(partners as ReferralPartner[] || []);

      // Search for code usages
      const { data: usages, error: usageError } = await supabase
        .from('referral_code_usages')
        .select('*')
        .ilike('referral_code', `%${searchCode.trim()}%`)
        .order('created_at', { ascending: false });

      if (!usageError && usages) {
        setCodeUsages(usages as CodeUsage[]);
      }

      if (partners?.length === 0) {
        toast.info("No partners found with this referral code");
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error("Failed to search. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const saveCompanySignature = async () => {
    if (!companySignature) {
      toast.error("Please draw your signature first");
      return;
    }

    setIsSavingSignature(true);

    try {
      const { error } = await supabase
        .from('referral_settings')
        .update({ setting_value: companySignature })
        .eq('setting_key', 'company_signature_url');

      if (error) throw error;

      toast.success("Company signature saved successfully!");
    } catch (error) {
      console.error('Save signature error:', error);
      toast.error("Failed to save signature");
    } finally {
      setIsSavingSignature(false);
    }
  };

  const saveStampText = async () => {
    try {
      const { error } = await supabase
        .from('referral_settings')
        .update({ setting_value: companyStampText })
        .eq('setting_key', 'company_stamp_text');

      if (error) throw error;

      toast.success("Company stamp text saved!");
    } catch (error) {
      console.error('Save stamp error:', error);
      toast.error("Failed to save stamp text");
    }
  };

  const clearSignature = async () => {
    try {
      const { error } = await supabase
        .from('referral_settings')
        .update({ setting_value: null })
        .eq('setting_key', 'company_signature_url');

      if (error) throw error;

      setCompanySignature(null);
      toast.success("Signature cleared");
    } catch (error) {
      console.error('Clear signature error:', error);
      toast.error("Failed to clear signature");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'converted':
        return <Badge className="jj-surface-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30/30"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'expired':
      case 'inactive':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Referral Management</h1>
              <p className="text-muted-foreground">Search codes, view usages, and manage company signature</p>
            </div>
          </div>

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="search">
                <Search className="w-4 h-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="partners">
                <Users className="w-4 h-4 mr-2" />
                Partners
              </TabsTrigger>
              <TabsTrigger value="signature">
                <FileSignature className="w-4 h-4 mr-2" />
                Signature
              </TabsTrigger>
            </TabsList>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-6">
              <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#1A1A1A]" />
                    Search Referral Code
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter referral code (e.g., JJ-ABC123)"
                      value={searchCode}
                      onChange={(e) => setSearchCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1"
                    />
                    <Button
                      variant="primary"
                      onClick={handleSearch}
                      disabled={isSearching}
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </Button>
                  </div>

                  {/* Search Results - Partner */}
                  {searchResults.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h3 className="font-semibold text-foreground">Partner Found:</h3>
                      {searchResults.map((partner) => (
                        <div
                          key={partner.id}
                          className="p-4 bg-muted/50 rounded-xl border border-border"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-foreground">{partner.full_name}</p>
                              <p className="text-sm text-muted-foreground">{partner.email}</p>
                              {partner.phone_e164 && (
                                <p className="text-sm text-muted-foreground">{partner.phone_e164}</p>
                              )}
                              {partner.nationality && (
                                <p className="text-sm text-muted-foreground">Nationality: {partner.nationality}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-[#1A1A1A]">{partner.referral_code}</p>
                              {getStatusBadge(partner.status)}
                              <p className="text-sm text-muted-foreground mt-1">
                                {partner.commission_rate}% commission
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Joined: {format(new Date(partner.created_at), 'PPP')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search Results - Code Usages */}
                  {codeUsages.length > 0 && (
                    <div className="space-y-4 mt-6">
                      <h3 className="font-semibold text-foreground">Code Usage History ({codeUsages.length}):</h3>
                      <div className="space-y-2">
                        {codeUsages.map((usage) => (
                          <div
                            key={usage.id}
                            className="p-3 bg-[#FDFBF7] rounded-lg border border-border text-sm"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-foreground">{usage.used_by_name}</p>
                                <p className="text-muted-foreground">{usage.used_by_email}</p>
                                {usage.property_interest && (
                                  <p className="text-muted-foreground">Interest: {usage.property_interest}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge variant="outline" className="capitalize">{usage.source.replace('_', ' ')}</Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(usage.created_at), 'PPp')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="partners" className="space-y-6">
              <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#1A1A1A]" />
                    Recent Referral Partners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allPartners.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No referral partners yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {allPartners.map((partner) => (
                        <div
                          key={partner.id}
                          className="p-4 bg-muted/30 rounded-xl border border-border hover:border-[#B89555]/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSearchCode(partner.referral_code);
                            setSelectedPartner(partner);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-[#EFE6D6]/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-[#1A1A1A]" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{partner.full_name}</p>
                                <p className="text-sm text-muted-foreground">{partner.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-[#1A1A1A]">{partner.referral_code}</p>
                              {getStatusBadge(partner.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Signature Tab */}
            <TabsContent value="signature" className="space-y-6">
              {/* AI Signature Generator */}
              <Card className="bg-card border-2 border-[#B89555]/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
                    AI Signature Designer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-6">
                    Type your name and our AI will generate a professional signature for you.
                  </p>
                  <AISignatureGenerator
                    onSignatureGenerated={(signature) => {
                      setCompanySignature(signature);
                      toast.success("AI signature set! Click 'Save Company Signature' to save it.");
                    }}
                    defaultName="Jane Bou Jaoude"
                  />
                </CardContent>
              </Card>

              <Card className="bg-card border-2 border-[#B89555]/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-[#1A1A1A]" />
                    Company Signature for Contracts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    This signature will automatically appear on all referral partner contracts and certificates.
                  </p>

                  {/* Current Signature Preview */}
                  {companySignature && (
                    <div className="space-y-2">
                      <Label>Current Signature:</Label>
                      <div className="p-4 bg-card border-2 border-dashed border-[#B89555]/40 rounded-xl">
                        <img
                          src={companySignature}
                          alt="Company Signature"
                          className="max-h-24 mx-auto"
                         loading="lazy" decoding="async" />
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={clearSignature}
                        className="mt-2"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Signature
                      </Button>
                    </div>
                  )}

                  {/* Manual Signature Pad */}
                  <div className="space-y-2">
                    <Label>{companySignature ? 'Or Draw Manually:' : 'Draw Signature Manually:'}</Label>
                    <SignaturePad
                      onSignatureChange={setCompanySignature}
                      requiredIdMatch={false}
                    />
                  </div>

                  <Button
                    variant="primary"
                    onClick={saveCompanySignature}
                    disabled={isSavingSignature || !companySignature}
                    className="w-full"
                  >
                    {isSavingSignature ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Save Company Signature
                  </Button>

                  {/* Company Stamp Text */}
                  <div className="pt-6 border-t border-border space-y-4">
                    <div className="space-y-2">
                      <Label>Company Stamp Text</Label>
                      <Input
                        value={companyStampText}
                        onChange={(e) => setCompanyStampText(e.target.value)}
                        placeholder="JBJ Global Real Estate L.L.C."
                      />
                      <p className="text-xs text-muted-foreground">
                        This text will appear as a stamp below the signature on contracts.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={saveStampText}
                    >
                      Save Stamp Text
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
