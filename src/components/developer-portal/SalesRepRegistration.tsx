import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserCheck, Loader2, Building2, Briefcase } from 'lucide-react';

interface SalesRepRegistrationProps {
  developerName: string;
  onRegistered: () => void;
}

const SalesRepRegistration = ({ developerName, onRegistered }: SalesRepRegistrationProps) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    role: 'sales_representative' as 'admin' | 'sales_representative',
    position: '',
    email: user?.email || '',
    phone: '',
    date_of_join: '',
  });

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.full_name || !form.email) {
      toast.error('Please fill in your name and email');
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
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@damac.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+971 50 123 4567" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Date of Joining Company</Label>
          <Input type="date" value={form.date_of_join} onChange={(e) => setForm(f => ({ ...f, date_of_join: e.target.value }))} />
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
