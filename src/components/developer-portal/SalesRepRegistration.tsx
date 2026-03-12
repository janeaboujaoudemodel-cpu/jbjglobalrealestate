import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserCheck, Loader2, Building2, Briefcase, Upload, FileText, X, ShieldAlert } from 'lucide-react';
import { LanguageMultiSelect } from '@/components/ui/language-multi-select';

interface SalesRepRegistrationProps {
  developerName: string;
  onRegistered: () => void;
}

const SalesRepRegistration = ({ developerName, onRegistered }: SalesRepRegistrationProps) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const idFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: '',
    role: 'sales_representative' as 'admin' | 'sales_representative',
    position: '',
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
    setSubmitting(true);
    try {
      const { error } = await supabase.from('developer_representatives').insert({
        user_id: user.id,
        developer_name: developerName,
        role: form.role,
        full_name: form.full_name,
        position: form.position || null,
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
    <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <UserCheck className="w-5 h-5 text-gold" />
          Register as {form.role === 'admin' ? 'Developer Admin' : 'Sales Representative'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Create your profile under <strong>{developerName}</strong> to access briefing requests and document uploads.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Banner */}
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-800">
            <p className="font-bold mb-1">⚠️ Important Notice</p>
            <p>All information you upload must be accurate and verifiable. Uploading misleading, false, or fraudulent information will result in a <strong>permanent ban</strong> from the platform. JBJ Global reserves the right to verify your identity with your employer at any time.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Your Role *</Label>
          <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v as any }))}>
            <SelectTrigger className="border-gold/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Developer Admin
                </div>
              </SelectItem>
              <SelectItem value="sales_representative">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Sales Representative / Manager
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="John Smith" />
          </div>
          <div className="space-y-2">
            <Label>Position / Title</Label>
            <Input value={form.position} onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Senior Sales Manager" />
          </div>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date of Joining Company</Label>
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

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          <strong>Application Process:</strong> Your registration will go through 3 stages — <em>Received → Under Review → Approved</em>. 
          You'll receive an email confirmation at each stage.
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12"
        >
          {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : 'Submit Registration'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SalesRepRegistration;
