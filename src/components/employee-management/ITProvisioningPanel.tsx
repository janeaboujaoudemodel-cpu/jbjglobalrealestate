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
  const [tempPassword, setTempPassword] = useState('');
  const [emailSignature, setEmailSignature] = useState('');
  const [grantCRM, setGrantCRM] = useState(true);
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);

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
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const generateSignature = (name: string, title: string, department: string) => {
    return `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
  <p style="margin: 0; font-weight: bold; color: #C8A766;">${name}</p>
  <p style="margin: 2px 0; color: #666;">${title}</p>
  <p style="margin: 2px 0; color: #666;">${department} | JBJ Global Real Estate</p>
  <p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">
    Tel: +971 4 XXX XXXX | Email: ${generateEmail(name)}<br/>
    Web: www.jbjglobalrealestate.com
  </p>
  <img src="https://jbjglobalrealestate.com/logo.png" alt="JBJ Global" style="height: 40px; margin-top: 8px;"/>
</div>`.trim();
  };

  const handleStartProvisioning = (app: PendingApplication) => {
    setSelectedApp(app);
    setGeneratedEmail(generateEmail(app.full_name));
    setTempPassword(generatePassword());
    setEmailSignature(generateSignature(app.full_name, app.job_title, app.department));
    setShowProvisionDialog(true);
  };

  const handleProvision = async () => {
    if (!selectedApp) return;
    
    setProvisioning(true);
    try {
      // Update application status
      await supabase
        .from('new_joiner_applications')
        .update({
          status: 'completed',
          generated_email: generatedEmail,
          it_completed_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

      // Create provisioning record
      await supabase
        .from('it_provisioning_records')
        .insert({
          application_id: selectedApp.id,
          employee_email: generatedEmail,
          temporary_password: '***SECURED***', // Don't store actual password
          email_signature_html: emailSignature,
          crm_access_granted: grantCRM,
          welcome_email_sent: sendWelcomeEmail,
          welcome_email_sent_at: sendWelcomeEmail ? new Date().toISOString() : null,
          status: 'completed'
        });

      // Log the journey event
      await supabase
        .from('employee_journey_logs')
        .insert({
          event_type: 'hired',
          event_category: 'it',
          new_value: { 
            email: generatedEmail, 
            department: selectedApp.department,
            role: selectedApp.crm_role 
          },
          notes: `IT provisioning completed. Email: ${generatedEmail}`
        });

      toast.success('Employee provisioned successfully!');
      setShowProvisionDialog(false);
      fetchPendingApplications();
      onRefresh();
    } catch (error) {
      console.error('Provisioning error:', error);
      toast.error('Failed to provision employee');
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
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-amber-500/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Awaiting Setup</p>
                <p className="text-2xl font-bold text-amber-600">
                  {applications.filter(a => a.status === 'hr_approved').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-purple-500/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">In Progress</p>
                <p className="text-2xl font-bold text-purple-600">
                  {applications.filter(a => a.status === 'it_processing').length}
                </p>
              </div>
              <Monitor className="w-8 h-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-green-500/40">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500">Completed Today</p>
                <p className="text-2xl font-bold text-green-600">0</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provisioning Queue */}
      <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-black flex items-center gap-2">
              <Key className="w-5 h-5 text-gold" />
              IT Provisioning Queue
            </CardTitle>
            <CardDescription className="text-zinc-600">
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
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-4" />
              <p className="text-zinc-500">All caught up! No pending provisioning tasks.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {filteredApps.map((app) => (
                  <div 
                    key={app.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-white/50 border border-gold/20 hover:border-gold/40 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <p className="font-medium text-black">{app.full_name}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Briefcase className="w-3 h-3" />
                          <span>{app.job_title}</span>
                          <span>•</span>
                          <Building2 className="w-3 h-3" />
                          <span>{app.department}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
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
        <DialogContent className="max-w-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
          <DialogHeader>
            <DialogTitle className="text-black flex items-center gap-2">
              <Key className="w-5 h-5 text-gold" />
              Provision Employee: {selectedApp?.full_name}
            </DialogTitle>
            <DialogDescription className="text-zinc-600">
              Generate email, password, signature, and grant system access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Email Generation */}
            <div className="space-y-2">
              <Label className="text-black">Company Email</Label>
              <div className="flex gap-2">
                <Input 
                  value={generatedEmail}
                  onChange={(e) => setGeneratedEmail(e.target.value)}
                  className="bg-white border-gold/30 text-black"
                />
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(generatedEmail, 'Email')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Password Generation */}
            <div className="space-y-2">
              <Label className="text-black">Temporary Password</Label>
              <div className="flex gap-2">
                <Input 
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  className="bg-white border-gold/30 text-black font-mono"
                />
                <Button variant="ghost" size="icon" onClick={() => setTempPassword(generatePassword())}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(tempPassword, 'Password')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-zinc-500">Employee must change on first login</p>
            </div>

            {/* Email Signature Preview */}
            <div className="space-y-2">
              <Label className="text-black">Email Signature</Label>
              <div className="bg-white border border-gold/30 rounded-lg p-4">
                <div dangerouslySetInnerHTML={{ __html: emailSignature }} />
              </div>
            </div>

            {/* Access Options */}
            <div className="space-y-3 p-4 bg-white/50 rounded-lg border border-gold/20">
              <Label className="text-black font-medium">Access & Notifications</Label>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="grantCRM" 
                  checked={grantCRM} 
                  onCheckedChange={(v) => setGrantCRM(v as boolean)} 
                />
                <label htmlFor="grantCRM" className="text-sm text-zinc-700">
                  Grant CRM access based on role ({selectedApp?.crm_role})
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="sendWelcome" 
                  checked={sendWelcomeEmail} 
                  onCheckedChange={(v) => setSendWelcomeEmail(v as boolean)} 
                />
                <label htmlFor="sendWelcome" className="text-sm text-zinc-700">
                  Send welcome email with credentials
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
