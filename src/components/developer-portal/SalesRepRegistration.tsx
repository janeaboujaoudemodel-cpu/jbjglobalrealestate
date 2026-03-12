import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAgreementSaver } from '@/hooks/useAgreementSaver';
import { toast } from 'sonner';
import { UserCheck, Loader2, Building2, Briefcase, Upload, FileText, X, ShieldAlert, Lock, Crown, Users, CheckCircle2, Handshake } from 'lucide-react';
import { LanguageMultiSelect } from '@/components/ui/language-multi-select';

// LOCKED: Full company name — never abbreviate
const COMPANY_FULL_NAME = 'JBJ GLOBAL REAL ESTATE';

const IMPORTANT_NOTICE_TEXT = `All information you upload must be accurate and verifiable. Uploading misleading, false, or fraudulent information will result in a permanent ban from the platform. ${COMPANY_FULL_NAME} reserves the right to verify your identity with your employer at any time.`;

const USAGE_RIGHTS_TEXT = `By registering on the ${COMPANY_FULL_NAME} Developer Portal, you gain access to:

• Submit projects directly to our broker network for fast-track visibility
• Request and schedule project briefings with our sales teams
• Upload marketing materials, brochures, and project documents
• Track your project listing status in real-time
• Manage launch events and developer invitations
• Access our CRM pipeline for your submitted projects

This portal is provided exclusively for authorized representatives of real estate developers. Your account and all uploaded content remain subject to review and approval by ${COMPANY_FULL_NAME}. We reserve the right to revoke access at any time if the terms are violated.`;

const ROLE_OPTIONS = [
  { value: 'owner_ceo', label: 'Owner / CEO', icon: Crown, description: 'Company owner or chief executive' },
  { value: 'admin', label: 'Admin / Manager', icon: Building2, description: 'Administrative or management role' },
  { value: 'sales_representative', label: 'Sales Representative', icon: Briefcase, description: 'Sales manager or agent' },
  { value: 'channel_partner', label: 'Channel Partner', icon: Users, description: 'External partner or broker liaison' },
];

interface SalesRepRegistrationProps {
  developerName: string;
  onRegistered: () => void;
}

const SalesRepRegistration = ({ developerName, onRegistered }: SalesRepRegistrationProps) => {
  const { user } = useAuth();
  const { saveAgreement } = useAgreementSaver();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const idFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: '',
    role: 'sales_representative',
    email: user?.email || '',
    personal_email: '',
    phone: '',
    date_of_join: '',
    nationality: '',
    gender: '',
    years_in_real_estate: '',
    languages: [] as string[],
    verification_document_url: '',
    verification_document_name: '',
  });

  const selectedRole = ROLE_OPTIONS.find(r => r.value === form.role);

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingId(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `rep-verification/${user.id}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('documents').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      setForm(f => ({ ...f, verification_document_url: urlData.publicUrl, verification_document_name: file.name }));
      toast.success('Document uploaded');
    } catch (err: any) {
      toast.error('Failed to upload document');
    } finally {
      setUploadingId(false);
      if (idFileRef.current) idFileRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.full_name || !form.email || !form.phone) {
      toast.error('Please fill in your name, company email, and phone number');
      return;
    }
    if (!developerName) {
      toast.error('Developer name is required. Please select your developer before registering.');
      return;
    }
    if (!agreedToTerms) {
      toast.error('You must agree to the Terms & Conditions to register');
      return;
    }

    setSubmitting(true);
    try {
      // Save the agreement first
      await saveAgreement({
        agreementType: 'developer_portal_usage',
        agreementVersion: '1.0',
        agreementSnapshot: {
          important_notice: IMPORTANT_NOTICE_TEXT,
          usage_rights: USAGE_RIGHTS_TEXT,
          company_name: COMPANY_FULL_NAME,
          developer_name: developerName,
          role: form.role,
          accepted_at: new Date().toISOString(),
        },
        consentDetails: {
          agreed_to_terms: true,
          agreed_to_usage_rights: true,
          agreed_to_important_notice: true,
        },
      });

      const { error } = await supabase.from('developer_representatives').insert({
        user_id: user.id,
        developer_name: developerName,
        role: form.role,
        full_name: form.full_name,
        position: selectedRole?.label || form.role,
        email: form.email,
        phone: form.phone || null,
        date_of_join: form.date_of_join || null,
        nationality: form.nationality || null,
        gender: form.gender || null,
        years_in_real_estate: form.years_in_real_estate ? parseInt(form.years_in_real_estate) : null,
        languages: form.languages.length > 0 ? form.languages : null,
      } as any);
      if (error) throw error;
      toast.success('Registration submitted! You will receive a confirmation email once reviewed.');
      onRegistered();
    } catch (err: any) {
      toast.error(err.message || 'Failed to register');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-xl md:text-2xl">
            <UserCheck className="w-6 h-6 text-gold" />
            Register as Developer Representative
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete this registration to unlock the full {COMPANY_FULL_NAME} Developer Portal.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Important Notice */}
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs text-red-800">
              <p className="font-bold mb-1">⚠️ Important Notice — {COMPANY_FULL_NAME}</p>
              <p>{IMPORTANT_NOTICE_TEXT}</p>
            </div>
          </div>

          {/* Usage Rights & Benefits */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex gap-3">
            <Handshake className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <p className="font-bold mb-1">📋 Usage Rights & Benefits — {COMPANY_FULL_NAME}</p>
              <p className="whitespace-pre-line">{USAGE_RIGHTS_TEXT}</p>
            </div>
          </div>

          {/* Developer Name (Locked) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              Developer / Company You Represent
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            </Label>
            <div className="relative">
              <Input
                value={developerName || 'Not selected — please select your developer first'}
                readOnly
                disabled
                className="bg-muted/50 cursor-not-allowed pr-10 font-medium"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground">This is locked to the developer you selected. Contact support to change it after registration.</p>
          </div>

          {/* Your Role / Position */}
          <div className="space-y-2">
            <Label>Your Role / Position *</Label>
            <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger className="border-gold/20 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">— {opt.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="John Smith" />
          </div>

          {/* Emails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@damac.com" />
            </div>
            <div className="space-y-2">
              <Label>Personal Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input type="email" value={form.personal_email} onChange={(e) => setForm(f => ({ ...f, personal_email: e.target.value }))} placeholder="john.personal@gmail.com" />
            </div>
          </div>

          {/* Phone & Nationality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number *</Label>
              <Input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+971 50 123 4567" />
            </div>
            <div className="space-y-2">
              <Label>Nationality</Label>
              <Input value={form.nationality} onChange={(e) => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="e.g. Indian, British, Lebanese" />
            </div>
          </div>

          {/* Gender & Years */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v }))}>
                <SelectTrigger className="border-gold/20">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Years in Real Estate</Label>
              <Input type="number" min="0" max="50" value={form.years_in_real_estate} onChange={(e) => setForm(f => ({ ...f, years_in_real_estate: e.target.value }))} placeholder="e.g. 5" />
            </div>
          </div>

          {/* Date of Joining & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Date of Joining Company
                {developerName && <span className="text-[10px] text-muted-foreground font-normal">at {developerName}</span>}
              </Label>
              <Input type="date" value={form.date_of_join} onChange={(e) => setForm(f => ({ ...f, date_of_join: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Languages Spoken</Label>
              <LanguageMultiSelect value={form.languages} onChange={(v) => setForm(f => ({ ...f, languages: v }))} />
            </div>
          </div>

          {/* ID / Employee Card Upload */}
          <div className="space-y-2">
            <Label>ID / Employee Card <span className="text-muted-foreground text-xs">(proof of employment)</span></Label>
            <p className="text-xs text-muted-foreground">Upload your employee ID card, business card, or company badge to verify your association.</p>
            {form.verification_document_url ? (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-gold/20">
                <FileText className="w-4 h-4 text-gold shrink-0" />
                <span className="text-sm text-foreground truncate flex-1">{form.verification_document_name}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, verification_document_url: '', verification_document_name: '' }))} className="text-muted-foreground hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gold/40 rounded-xl p-6 text-center hover:border-gold/70 transition-colors cursor-pointer bg-card/50"
                onClick={() => idFileRef.current?.click()}
              >
                {uploadingId ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 mx-auto text-gold/60 mb-2" />
                    <p className="text-xs font-medium text-foreground">Click to upload ID or employee card</p>
                    <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, or PDF</p>
                  </>
                )}
                <input ref={idFileRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf,.webp" onChange={handleIdUpload} />
              </div>
            )}
          </div>

          {/* Application Process Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>Application Process:</strong> Your registration will go through 3 stages — <em>Received → Under Review → Approved</em>. 
            You'll receive an email confirmation at each stage.
          </div>

          {/* T&C Agreement Checkbox */}
          <div className="border-2 border-gold/30 rounded-xl p-4 bg-gradient-to-br from-[hsl(40,40%,97%)] to-[hsl(38,35%,94%)]">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-0.5 border-gold data-[state=checked]:bg-gold data-[state=checked]:text-black"
              />
              <label htmlFor="agree-terms" className="text-xs text-foreground cursor-pointer leading-relaxed">
                I have read and agree to the <strong>Terms & Conditions</strong>, <strong>Usage Rights</strong>, and <strong>Important Notice</strong> of {COMPANY_FULL_NAME}. 
                I confirm that all information I provide is accurate and that I am an authorized representative of the developer I have selected.
              </label>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !agreedToTerms || !developerName}
            className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12 disabled:opacity-50"
          >
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit Registration</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesRepRegistration;
