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
import { UserCheck, Loader2, Building2, Briefcase, Upload, FileText, X, ShieldAlert, Lock, Crown, Users, CheckCircle2, Handshake, HelpCircle } from 'lucide-react';
import { LanguageMultiSelect } from '@/components/ui/language-multi-select';
import { PhoneInputWithCountry } from '@/components/ui/phone-input-with-country';
import { NationalitySelect } from '@/components/developer-portal/NationalitySelect';

// LOCKED: Full company name — never abbreviate
const COMPANY_FULL_NAME = 'JBJ GLOBAL REAL ESTATE';

const IMPORTANT_NOTICE_TEXT = `All information you upload must be accurate and verifiable. Uploading misleading, false, or fraudulent information will result in a permanent ban from the platform. ${COMPANY_FULL_NAME} reserves the right to verify with the employer about his identity or about the project's information details.`;

const USAGE_RIGHTS_TEXT = `By registering on the ${COMPANY_FULL_NAME} Developer Portal, you gain access to:

• Submit projects directly to our broker network for fast-track visibility
• Request and schedule project briefings with our sales teams
• Upload marketing materials, brochures, and project documents
• Track your project listing status in real-time
• Manage launch events and developer invitations
• Track your submission status and receive updates on your projects

This portal is provided exclusively for authorized representatives of real estate developers. Your account and all uploaded content remain subject to review and approval by ${COMPANY_FULL_NAME}. We reserve the right to revoke access at any time if the terms are violated.`;

const ROLE_OPTIONS = [
  { value: 'owner_ceo', label: 'Owner / CEO / Founder', icon: Crown, description: 'Company owner, CEO, or founder' },
  { value: 'admin', label: 'Admin / Manager', icon: Building2, description: 'Administrative or management role' },
  { value: 'sales_representative', label: 'Sales Representative', icon: Briefcase, description: 'Sales manager or agent' },
  { value: 'channel_partner', label: 'Channel Partner', icon: Users, description: 'External partner or broker liaison' },
  { value: 'other', label: 'Other', icon: HelpCircle, description: 'Please specify your role' },
];

const OWNER_ROLES = ['owner_ceo'];

interface SalesRepRegistrationProps {
  developerName: string;
  onRegistered: () => void;
}

const SalesRepRegistration = ({ developerName, onRegistered }: SalesRepRegistrationProps) => {
  const { user } = useAuth();
  const { saveAgreement } = useAgreementSaver();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const idFileRef = useRef<HTMLInputElement>(null);
  const passportFileRef = useRef<HTMLInputElement>(null);
  const tradeLicenseFileRef = useRef<HTMLInputElement>(null);
  const reraFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: '',
    role: 'sales_representative',
    custom_role_title: '',
    email: user?.email || '',
    personal_email: '',
    phone: '',
    personal_phone: '',
    date_of_join: '',
    nationality: '',
    gender: '',
    years_in_real_estate: '',
    languages: [] as string[],
    verification_document_url: '',
    verification_document_name: '',
    passport_document_url: '',
    passport_document_name: '',
    trade_license_url: '',
    trade_license_name: '',
    rera_document_url: '',
    rera_document_name: '',
  });

  const selectedRole = ROLE_OPTIONS.find(r => r.value === form.role);
  const isOwnerRole = OWNER_ROLES.includes(form.role);
  const isOtherRole = form.role === 'other';

  const handleDocUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: string,
    urlKey: string,
    nameKey: string,
    fileRef: React.RefObject<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingDoc(docType);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `rep-verification/${user.id}/${docType}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from('documents').upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      setForm(f => ({ ...f, [urlKey]: urlData.publicUrl, [nameKey]: file.name }));
      toast.success(`${docType.replace(/_/g, ' ')} uploaded`);
    } catch (err: any) {
      toast.error(`Failed to upload ${docType.replace(/_/g, ' ')}`);
    } finally {
      setUploadingDoc(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleDocUpload(e, 'employee_id', 'verification_document_url', 'verification_document_name', idFileRef);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.full_name || !form.email || !form.phone) {
      toast.error('Please fill in your name, company email, and company phone number');
      return;
    }
    if (!developerName) {
      toast.error('Developer name is required. Please select your developer before registering.');
      return;
    }
    if (isOtherRole && !form.custom_role_title.trim()) {
      toast.error('Please provide your role title');
      return;
    }
    if (!form.nationality) {
      toast.error('Please select your nationality');
      return;
    }
    if (!form.gender) {
      toast.error('Please select your gender');
      return;
    }
    if (!form.years_in_real_estate) {
      toast.error('Please enter your years of experience in real estate');
      return;
    }
    if (form.languages.length === 0) {
      toast.error('Please select at least one language you speak');
      return;
    }
    if (!form.date_of_join) {
      toast.error('Please enter your date of joining the company');
      return;
    }
    if (isOwnerRole) {
      if (!form.verification_document_url) {
        toast.error('Please upload your ID document');
        return;
      }
      if (!form.passport_document_url) {
        toast.error('Please upload your passport');
        return;
      }
      if (!form.trade_license_url) {
        toast.error('Please upload your trade license');
        return;
      }
      if (!form.rera_document_url) {
        toast.error('Please upload your RERA document');
        return;
      }
    }
    if (!agreedToTerms) {
      toast.error('You must agree to the Terms & Conditions to register');
      return;
    }

    setSubmitting(true);
    try {
      await saveAgreement({
        agreementType: 'developer_portal_usage',
        agreementVersion: '1.0',
        agreementSnapshot: {
          important_notice: IMPORTANT_NOTICE_TEXT,
          usage_rights: USAGE_RIGHTS_TEXT,
          company_name: COMPANY_FULL_NAME,
          developer_name: developerName,
          role: form.role,
          custom_role_title: form.custom_role_title || null,
          accepted_at: new Date().toISOString(),
        },
        consentDetails: {
          agreed_to_terms: true,
          agreed_to_usage_rights: true,
          agreed_to_important_notice: true,
        },
      });

      const effectivePosition = isOtherRole ? form.custom_role_title : (selectedRole?.label || form.role);

      const { error } = await supabase.from('developer_representatives').insert({
        user_id: user.id,
        developer_name: developerName,
        role: form.role,
        full_name: form.full_name,
        position: effectivePosition,
        email: form.email,
        phone: form.phone || null,
        personal_email: form.personal_email || null,
        personal_phone: form.personal_phone || null,
        company_phone: form.phone || null,
        date_of_join: form.date_of_join || null,
        nationality: form.nationality || null,
        gender: form.gender || null,
        years_in_real_estate: form.years_in_real_estate ? parseInt(form.years_in_real_estate) : null,
        languages: form.languages.length > 0 ? form.languages : null,
        custom_role_title: form.custom_role_title || null,
        passport_document_url: form.passport_document_url || null,
        trade_license_url: form.trade_license_url || null,
        rera_document_url: form.rera_document_url || null,
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

  const DocUploadField = ({
    label,
    description,
    urlKey,
    nameKey,
    fileRef,
    docType,
    required = false,
  }: {
    label: string;
    description: string;
    urlKey: string;
    nameKey: string;
    fileRef: React.RefObject<HTMLInputElement>;
    docType: string;
    required?: boolean;
  }) => {
    const url = (form as any)[urlKey];
    const name = (form as any)[nameKey];
    const isUploading = uploadingDoc === docType;
    return (
      <div className="space-y-2">
        <Label>{label} {required && <span className="text-destructive">*</span>}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
        {url ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-[#B89555]/20">
            <FileText className="w-4 h-4 text-[#1A1A1A] shrink-0" />
            <span className="text-sm text-foreground truncate flex-1">{name}</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, [urlKey]: '', [nameKey]: '' }))} className="text-muted-foreground hover:text-destructive">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-[#B89555]/40 rounded-xl p-4 text-center hover:border-[#B89555]/70 transition-colors cursor-pointer bg-card/50"
            onClick={() => fileRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
              </div>
            ) : (
              <>
                <Upload className="w-5 h-5 mx-auto text-[#1A1A1A]/70 mb-1" />
                <p className="text-xs font-medium text-foreground">Click to upload</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, or PDF</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,.webp"
              onChange={(e) => handleDocUpload(e, docType, urlKey, nameKey, fileRef)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-xl md:text-2xl">
            <UserCheck className="w-6 h-6 text-[#1A1A1A]" />
            Register as Developer or Sales
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
              <p className="font-bold mb-1">Important Notice — {COMPANY_FULL_NAME}</p>
              <p>{IMPORTANT_NOTICE_TEXT}</p>
            </div>
          </div>

          {/* Usage Rights & Benefits */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 flex gap-3">
            <Handshake className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <p className="font-bold mb-1">Usage Rights & Benefits — {COMPANY_FULL_NAME}</p>
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
            <p className="text-[10px] text-muted-foreground">This is locked to the developer you selected. You can change it later from your profile — changes require re-approval.</p>
          </div>

          {/* Your Role / Position */}
          <div className="space-y-2">
            <Label>Your Role / Position *</Label>
            <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v, custom_role_title: '' }))}>
              <SelectTrigger className="border-[#B89555]/20 h-12">
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

          {/* Custom Role Title (when Other is selected) */}
          {isOtherRole && (
            <div className="space-y-2">
              <Label>Please Provide Your Role *</Label>
              <Input
                value={form.custom_role_title}
                onChange={(e) => setForm(f => ({ ...f, custom_role_title: e.target.value }))}
                placeholder="e.g. Marketing Director, PR Manager, Legal Advisor"
                className="border-[#B89555]/30"
              />
            </div>
          )}

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
              <Label className="flex items-center gap-1.5">
                Personal Email <span className="text-muted-foreground text-xs">(optional)</span>
                <Lock className="w-3 h-3 text-muted-foreground" />
              </Label>
              <Input type="email" value={form.personal_email} onChange={(e) => setForm(f => ({ ...f, personal_email: e.target.value }))} placeholder="john.personal@gmail.com" />
              <p className="text-[10px] text-muted-foreground">Restricted. Used as a backup contact only.</p>
            </div>
          </div>

          {/* Phone Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Phone *</Label>
              <PhoneInputWithCountry
                value={form.phone}
                onChange={(v) => setForm(f => ({ ...f, phone: v }))}
                placeholder="50 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Personal Phone <span className="text-muted-foreground text-xs">(optional)</span>
                <Lock className="w-3 h-3 text-muted-foreground" />
              </Label>
              <PhoneInputWithCountry
                value={form.personal_phone}
                onChange={(v) => setForm(f => ({ ...f, personal_phone: v }))}
                placeholder="55 987 6543"
              />
              <p className="text-[10px] text-muted-foreground">Restricted. Used as a backup contact only.</p>
            </div>
          </div>

          {/* Nationality & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nationality *</Label>
              <NationalitySelect
                value={form.nationality}
                onChange={(v) => setForm(f => ({ ...f, nationality: v }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender *</Label>
              <Select value={form.gender} onValueChange={(v) => setForm(f => ({ ...f, gender: v }))}>
                <SelectTrigger className="border-[#B89555]/20">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Years & Date of Joining */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Years in Real Estate *</Label>
              <Input type="number" min="0" max="50" value={form.years_in_real_estate} onChange={(e) => setForm(f => ({ ...f, years_in_real_estate: e.target.value }))} placeholder="e.g. 5" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                Date of Joining Company *
                {developerName && <span className="text-[10px] text-muted-foreground font-normal">at {developerName}</span>}
              </Label>
              <Input type="date" value={form.date_of_join} onChange={(e) => setForm(f => ({ ...f, date_of_join: e.target.value }))} />
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label>Languages Spoken *</Label>
            <LanguageMultiSelect value={form.languages} onChange={(v) => setForm(f => ({ ...f, languages: v }))} />
          </div>

          {/* ID / Employee Card Upload */}
          <DocUploadField
            label={isOwnerRole ? "ID Document" : "ID / Employee Card"}
            description={isOwnerRole ? "Upload your government-issued ID (Emirates ID, national ID, etc.)" : "Upload your employee ID card, business card, or company badge to verify your association."}
            urlKey="verification_document_url"
            nameKey="verification_document_name"
            fileRef={idFileRef}
            docType="employee_id"
            required={isOwnerRole}
          />

          {/* Owner/CEO mandatory documents */}
          {isOwnerRole && (
            <div className="space-y-4 p-4 rounded-xl border-2 border-[#B89555]/30 bg-[#EFE6D6]/5">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#1A1A1A]" />
                Owner / CEO Verification Documents
              </p>
              <p className="text-xs text-muted-foreground">As a company owner or CEO, the following documents are mandatory for verification.</p>
              
              <DocUploadField
                label="Passport"
                description="Upload a clear copy of your passport"
                urlKey="passport_document_url"
                nameKey="passport_document_name"
                fileRef={passportFileRef}
                docType="passport"
                required
              />
              <DocUploadField
                label="Trade License"
                description="Upload your company trade license"
                urlKey="trade_license_url"
                nameKey="trade_license_name"
                fileRef={tradeLicenseFileRef}
                docType="trade_license"
                required
              />
              <DocUploadField
                label="RERA Document"
                description="Upload your RERA registration or broker card"
                urlKey="rera_document_url"
                nameKey="rera_document_name"
                fileRef={reraFileRef}
                docType="rera_document"
                required
              />
            </div>
          )}

          {/* Application Process Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <strong>Application Process:</strong> Your registration will go through 3 stages — <em>Received → Under Review → Approved</em>. 
            You'll receive an email confirmation at each stage.
          </div>

          {/* T&C Agreement Checkbox */}
          <div className="border-2 border-[#B89555]/30 rounded-xl p-4 bg-gradient-to-br from-[hsl(40,40%,97%)] to-[hsl(38,35%,94%)]">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-0.5 border-[#B89555] data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:text-[#1A1A1A]"
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
            className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-[#B89555]/40 text-foreground font-bold h-12 disabled:opacity-50"
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