import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Key, Mail, Lock, Monitor, CheckCircle, Clock, AlertCircle,
  Copy, Send, RefreshCw, User, Building2, Briefcase
} from 'lucide-react';
import { format } from 'date-fns';

interface PendingApplication {
  id: string;
  full_name: string;
  email: string;
  department: string;
  job_title: string;
  crm_role: string;
  status: string;
  hr_approved_at: string | null;
  created_at: string;
}

interface ITProvisioningPanelProps {
  searchQuery: string;
  onRefresh: () => void;
}

const ITProvisioningPanel: React.FC<ITProvisioningPanelProps> = ({ searchQuery, onRefresh }) => {
  const [applications, setApplications] = useState<PendingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<PendingApplication | null>(null);
  const [showProvisionDialog, setShowProvisionDialog] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  
  // Provisioning form state
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [emailSignature, setEmailSignature] = useState('');
  const [grantCRM, setGrantCRM] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [testMode, setTestMode] = useState(true); // default: preview to owner first

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const fetchPendingApplications = async () => {
    try {
      const { data } = await supabase
        .from('new_joiner_applications')
        .select('*')
        .in('status', ['hr_approved', 'it_processing'])
        .order('created_at', { ascending: true });

      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = (fullName: string) => {
    const nameParts = fullName.toLowerCase().split(' ');
    const firstName = nameParts[0] || 'user';
    const lastName = nameParts[nameParts.length - 1] || '';
    return `${firstName}.${lastName}@jbjglobalrealestate.com`.replace(/\s+/g, '');
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    const arr = new Uint32Array(12);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((n) => chars[n % chars.length]).join('');
  };

  const generateSignature = (name: string, title: string, department: string) => {
    // Escape HTML to prevent XSS from unsanitized application fields
    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    return `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <p style="margin: 0; font-weight: bold; color: #B89555;">${esc(name)}</p>
  <p style="margin: 2px 0; color: #666;">${esc(title)}</p>
  <p style="margin: 2px 0; color: #666;">${esc(department)} | JBJ Global Real Estate</p>
  <p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">
    Tel: +971 4 XXX XXXX | Email: ${generateEmail(name)}<br/>
    Web: www.jbjglobalrealestate.com
  </p>
  <img src="https://jbjglobalrealestate.com/logo.png" alt="JBJ GLOBAL REAL ESTATE" style="height: 40px; margin-top: 8px;" loading="lazy" decoding="async" />
</div>`.trim();
  };

  const handleStartProvisioning = (app: PendingApplication) => {
    setSelectedApp(app);
    setGeneratedEmail(generateEmail(app.full_name));
    setPersonalEmail(app.email || '');
    setTempPassword(generatePassword());
    setEmailSignature(generateSignature(app.full_name, app.job_title, app.department));
    setTestMode(true);
    setShowProvisionDialog(true);
  };

  const handleProvision = async () => {
    if (!selectedApp) return;

    setProvisioning(true);
    try {
      // 1. Call edge function: creates auth user, assigns role, sends branded email
      const { data: result, error: fnErr } = await supabase.functions.invoke(
        'provision-employee-account',
        {
          body: {
            application_id: selectedApp.id,
            employee_email: generatedEmail,
            personal_email: personalEmail,
            full_name: selectedApp.full_name,
            job_title: selectedApp.job_title,
            department: selectedApp.department,
            crm_role: selectedApp.crm_role,
            temporary_password: tempPassword,
            email_signature_html: emailSignature,
            grant_crm: grantCRM,
            test_mode: testMode && sendWelcomeEmail,
          },
        }
      );

      if (fnErr || !(result as any)?.ok) {
        throw new Error((result as any)?.error || fnErr?.message || 'Provisioning failed');
      }

      const deliveredTo = (result as any).delivered_to;

      // 2. Update application status
      await supabase
        .from('new_joiner_applications')
        .update({
          status: 'completed',
          generated_email: generatedEmail,
          it_completed_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq('id', selectedApp.id);

      // 3. Provisioning record (temporary_password is NEVER persisted — delivered via welcome email only)
      await supabase
        .from('it_provisioning_records')
        .insert({
          application_id: selectedApp.id,
          employee_email: generatedEmail,
          email_signature_html: emailSignature,
          crm_access_granted: grantCRM,
          welcome_email_sent: sendWelcomeEmail,
          welcome_email_sent_at: sendWelcomeEmail ? new Date().toISOString() : null,
          status: 'completed',
        });

      // 4. Journey log
      await supabase
        .from('employee_journey_logs')
        .insert({
          event_type: 'hired',
          event_category: 'it',
          new_value: {
            email: generatedEmail,
            department: selectedApp.department,
            role: selectedApp.crm_role,
            invite_delivered_to: deliveredTo,
            test_mode: testMode,
          },
          notes: testMode
            ? `Provisioned. Test invite routed to ${deliveredTo} for owner preview.`
            : `Provisioned. Welcome email sent to ${deliveredTo}.`,
        });

      toast.success(
        testMode && sendWelcomeEmail
          ? `Test invite sent to ${deliveredTo} — review, then re-run with test mode off.`
          : `Employee provisioned — invite sent to ${deliveredTo}.`
      );
      setShowProvisionDialog(false);
      fetchPendingApplications();
      onRefresh();
    } catch (error: any) {
      console.error('Provisioning error:', error);
      toast.error(error?.message || 'Failed to provision employee');
    } finally {
      setProvisioning(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const filteredApps = applications.filter(app => 
    app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-amber-500/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1A1A1A]/70">Awaiting Setup</p>
                <p className="text-2xl font-bold text-amber-600">
                  {applications.filter(a => a.status === 'hr_approved').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-purple-500/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1A1A1A]/70">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {applications.filter(a => a.status === 'it_processing').length}
                </p>
              </div>
              <Monitor className="w-8 h-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[color:var(--emerald-1)]/30/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#1A1A1A]/70">Completed Today</p>
                <p className="text-2xl font-bold text-[color:var(--emerald-1)]">0</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provisioning Queue */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-[#1A1A1A] flex items-center gap-2">
              <Key className="w-5 h-5 text-[#1A1A1A]" />
              IT Provisioning Queue
            </CardTitle>
            <CardDescription className="text-[#1A1A1A]/70">
              HR-approved joiners ready for email, credentials, and CRM access
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchPendingApplications}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#B89555]" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500/60 mx-auto mb-4" />
              <p className="text-[#1A1A1A]/70">All caught up! No pending provisioning tasks.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredApps.map((app) => (
                  <div 
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[#FDFBF7]/50 border border-[#B89555]/20 hover:border-[#B89555]/40 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-[#1A1A1A]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{app.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
                          <Briefcase className="w-3 h-3" />
                          <span>{app.job_title}</span>
                          <span>•</span>
                          <Building2 className="w-3 h-3" />
                          <span>{app.department}</span>
                        </div>
                        <p className="text-xs text-[#1A1A1A]/70 mt-1">
                          HR approved: {app.hr_approved_at ? format(new Date(app.hr_approved_at), 'MMM d, yyyy') : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${
 app.status === 'hr_approved' 
 ? 'bg-blue-500/20 text-blue-700 border-blue-500/30' 
 : 'bg-purple-500/20 text-purple-700 border-purple-500/30'
 } border`}>
                        {app.status === 'hr_approved' ? 'Ready' : 'In Progress'}
                      </Badge>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleStartProvisioning(app)}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Provision
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Provisioning Dialog */}
      <Dialog open={showProvisionDialog} onOpenChange={setShowProvisionDialog}>
        <DialogContent className="max-w-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
              <Key className="w-5 h-5 text-[#1A1A1A]" />
              Provision Employee: {selectedApp?.full_name}
            </DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/70">
              Generate email, password, signature, and grant system access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email Generation */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Company Email</Label>
              <div className="flex gap-2">
                <Input 
                  value={generatedEmail}
                  onChange={(e) => setGeneratedEmail(e.target.value)}
                  className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
                />
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedEmail, 'Email')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Personal Email (invite delivery target) */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Personal Email (invite recipient)</Label>
              <Input
                type="email"
                value={personalEmail}
                onChange={(e) => setPersonalEmail(e.target.value)}
                placeholder="employee@personal.com"
                className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
              />
              <p className="text-xs text-[#1A1A1A]/70">Credentials are sent here. Falls back to company email if empty.</p>
            </div>

            {/* Password Generation */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Temporary Password</Label>
              <div className="flex gap-2">
                <Input 
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] font-mono"
                />
                <Button variant="ghost" size="icon" onClick={() => setTempPassword(generatePassword())}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(tempPassword, 'Password')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-[#1A1A1A]/70">Employee must change on first login</p>
            </div>

            {/* Email Signature Preview */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]">Email Signature</Label>
              <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: emailSignature }} />
              </div>
            </div>

            {/* Access Options */}
            <div className="space-y-3 p-4 bg-[#FDFBF7]/50 rounded-lg border border-[#B89555]/20">
              <Label className="text-[#1A1A1A] font-medium">Access & Notifications</Label>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="grantCRM" 
                  checked={grantCRM} 
                  onCheckedChange={(v) => setGrantCRM(v as boolean)} 
                />
                <label htmlFor="grantCRM" className="text-sm text-[#1A1A1A]/70">
                  Grant CRM access based on role ({selectedApp?.crm_role})
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendWelcome"
                  checked={sendWelcomeEmail}
                  onCheckedChange={(v) => setSendWelcomeEmail(v as boolean)}
                />
                <label htmlFor="sendWelcome" className="text-sm text-[#1A1A1A]/70">
                  Send welcome email with credentials
                </label>
              </div>
              <div className="flex items-center gap-2 pt-2 mt-2 border-t border-[#B89555]/20">
                <Checkbox
                  id="testMode"
                  checked={testMode}
                  onCheckedChange={(v) => setTestMode(v as boolean)}
                  disabled={!sendWelcomeEmail}
                />
                <label htmlFor="testMode" className="text-sm text-[#1A1A1A]">
                  <span className="font-medium">Send first invite to me (test mode)</span>
                  <span className="block text-xs text-[#1A1A1A]/60">Routes to infoo.jane@gmail.com so you can preview before the joiner receives it.</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowProvisionDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleProvision}
              disabled={provisioning}
            >
              {provisioning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Provisioning...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Provisioning
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ITProvisioningPanel;
