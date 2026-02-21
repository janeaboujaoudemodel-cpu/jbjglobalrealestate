import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Clock, CheckCircle, XCircle, AlertCircle,
  Eye, Edit, Key, Send, MoreVertical, Filter,
  Building2, Globe, Languages, Mail, Phone,
  IdCard, UserCheck, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  languages: string[];
  job_title: string;
  department: string;
  crm_role: string;
  reports_to: string;
  photo_url: string;
  status: string;
  generated_email: string;
  generated_company_id: string;
  created_at: string;
  completed_at: string;
  it_notes: string;
}

interface NewJoinerApplicationsListProps {
  searchQuery: string;
  onRefresh: () => void;
}

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', color: 'bg-orange-500', icon: Clock },
  it_processing: { label: 'IT Processing', color: 'bg-blue-500', icon: AlertCircle },
  webdev_update: { label: 'Web Dev Update', color: 'bg-purple-500', icon: Edit },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle }
};

const NewJoinerApplicationsList: React.FC<NewJoinerApplicationsListProps> = ({
  searchQuery,
  onRefresh
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    companyId: ''
  });

  useEffect(() => {
    fetchApplications();
  }, [filterStatus]);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('new_joiner_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      app.full_name.toLowerCase().includes(search) ||
      app.email?.toLowerCase().includes(search) ||
      app.department.toLowerCase().includes(search) ||
      app.job_title.toLowerCase().includes(search)
    );
  });

  const handleProcessApplication = async (application: Application) => {
    setSelectedApplication(application);
    setCredentials({
      email: application.email || `${application.full_name.toLowerCase().replace(/\s+/g, '.')}@jbj.ae`,
      password: generateSecurePassword(),
      companyId: ''
    });
    setShowCredentialsDialog(true);
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateCRMAccount = async () => {
    if (!selectedApplication) return;
    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-crm-user', {
        body: {
          email: credentials.email,
          password: credentials.password,
          displayName: selectedApplication.full_name,
          crmRole: selectedApplication.crm_role,
          jobTitle: selectedApplication.job_title,
          phone: selectedApplication.phone
        }
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from('new_joiner_applications')
        .update({
          status: 'webdev_update',
          generated_email: credentials.email,
          generated_company_id: data.user?.company_id || credentials.companyId,
          crm_user_id: data.user?.id,
          approved_at: new Date().toISOString(),
          it_notes: `CRM account created. Email: ${credentials.email}`
        })
        .eq('id', selectedApplication.id);

      if (updateError) throw updateError;

      await supabase
        .from('new_joiner_status_history')
        .insert({
          application_id: selectedApplication.id,
          status: 'webdev_update',
          notes: `CRM account created with email ${credentials.email}`
        });

      toast.success('CRM account created successfully!');
      setShowCredentialsDialog(false);
      fetchApplications();
      onRefresh();
    } catch (error: any) {
      console.error('Error creating CRM account:', error);
      toast.error(error.message || 'Failed to create CRM account');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('new_joiner_applications')
        .update({ 
          status: newStatus,
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', applicationId);

      if (error) throw error;

      await supabase
        .from('new_joiner_status_history')
        .insert({
          application_id: applicationId,
          status: newStatus
        });

      toast.success(`Application status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`);
      fetchApplications();
      onRefresh();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-black/60" />
          <span className="text-black/60 text-sm">Filter by status:</span>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48 bg-white border-2 border-gold/30 text-black">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-2 border-gold/30 z-50">
            <SelectItem value="all" className="text-black hover:bg-gold/10">All Applications</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key} className="text-black hover:bg-gold/10">
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Applications Grid */}
      {filteredApplications.length === 0 ? (
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 text-gold mx-auto mb-4" />
            <p className="text-black/60">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredApplications.map((application, index) => {
              const statusConfig = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = statusConfig?.icon || Clock;

              return (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white border-2 border-gold/30 hover:border-gold/50 transition-all group">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gold/10 overflow-hidden border border-gold/30">
                            {application.photo_url ? (
                              <img 
                                src={application.photo_url} 
                                alt={application.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-6 h-6 text-gold" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-black">{application.full_name}</h3>
                            <p className="text-sm text-gold">{application.job_title}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-black/60 hover:text-black">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-white border-2 border-gold/30 z-50">
                            <DropdownMenuItem 
                              className="text-black hover:bg-gold/10"
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            {application.status === 'pending_review' && (
                              <DropdownMenuItem 
                                className="text-black hover:bg-gold/10"
                                onClick={() => handleProcessApplication(application)}
                              >
                                <Key className="w-4 h-4 mr-2" /> Create CRM Account
                              </DropdownMenuItem>
                            )}
                            {application.status === 'webdev_update' && (
                              <DropdownMenuItem 
                                className="text-green-600 hover:bg-gold/10"
                                onClick={() => handleStatusChange(application.id, 'completed')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-black/60">
                          <Building2 className="w-4 h-4" />
                          <span>{application.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-black/60">
                          <Globe className="w-4 h-4" />
                          <span>{application.nationality}</span>
                        </div>
                        {application.generated_company_id && (
                          <div className="flex items-center gap-2 text-gold">
                            <IdCard className="w-4 h-4" />
                            <span className="font-mono">{application.generated_company_id}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gold/10 flex items-center justify-between">
                        <Badge className={`${statusConfig?.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig?.label}
                        </Badge>
                        <span className="text-xs text-black/50">
                          {format(new Date(application.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-white border-2 border-gold/30 text-black max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gold">Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gold/10 overflow-hidden border-2 border-gold/30">
                  {selectedApplication.photo_url ? (
                    <img 
                      src={selectedApplication.photo_url} 
                      alt={selectedApplication.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-gold" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black">{selectedApplication.full_name}</h2>
                  <p className="text-gold">{selectedApplication.job_title}</p>
                  {selectedApplication.generated_company_id && (
                    <p className="text-sm text-black/60 font-mono mt-1">
                      ID: {selectedApplication.generated_company_id}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-black/60">Department</Label>
                  <p className="text-black">{selectedApplication.department}</p>
                </div>
                <div>
                  <Label className="text-black/60">CRM Role</Label>
                  <p className="text-black capitalize">{selectedApplication.crm_role.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-black/60">Nationality</Label>
                  <p className="text-black">{selectedApplication.nationality}</p>
                </div>
                <div>
                  <Label className="text-black/60">Languages</Label>
                  <p className="text-black">{selectedApplication.languages?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-black/60">Email</Label>
                  <p className="text-black">{selectedApplication.generated_email || selectedApplication.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-black/60">Phone</Label>
                  <p className="text-black">{selectedApplication.phone || 'N/A'}</p>
                </div>
              </div>

              {selectedApplication.it_notes && (
                <div>
                  <Label className="text-black/60">IT Notes</Label>
                  <p className="text-black bg-gold/5 border border-gold/20 p-3 rounded-lg mt-1">
                    {selectedApplication.it_notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="bg-white border-2 border-gold/30 text-black max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gold flex items-center gap-2">
              <Key className="w-5 h-5" />
              Create CRM Credentials
            </DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="text-center p-4 bg-gold/5 border border-gold/20 rounded-lg">
                <p className="text-black/60">Creating account for</p>
                <p className="text-xl font-bold text-black">{selectedApplication.full_name}</p>
                <p className="text-gold">{selectedApplication.job_title} - {selectedApplication.department}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-black/60 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gold" />
                    Email Address
                  </Label>
                  <Input
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white border-2 border-gold/30 text-black font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-black/60 flex items-center gap-2">
                    <Key className="w-4 h-4 text-gold" />
                    Temporary Password
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={credentials.password}
                      onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-white border-2 border-gold/30 text-black font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCredentials(prev => ({ ...prev, password: generateSecurePassword() }))}
                      className="border-gold/30 text-black hover:bg-gold/10"
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-black/50">
                    User will be required to change password on first login
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gold/20">
                <Button
                  variant="outline"
                  onClick={() => setShowCredentialsDialog(false)}
                  className="border-gold/30 text-black hover:bg-gold/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCRMAccount}
                  disabled={isProcessing}
                  className="bg-gold text-black hover:bg-gold/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewJoinerApplicationsList;
