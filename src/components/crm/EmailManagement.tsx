import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Plus,
  Copy,
  Check,
  Search,
  Key,
  Shield,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Server,
  Download,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { allTeamMembers, TeamMember } from '@/config/team-members';

interface EmployeeEmail {
  id: string;
  employee_name: string;
  email_prefix: string;
  email_address: string;
  department: string | null;
  position: string | null;
  password_hash: string;
  quota_mb: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Generate a strong 16-character password
const generatePassword = (): string => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*';
  const all = upper + lower + digits + special;

  let password = '';
  // Ensure at least one of each type
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = 4; i < 16; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
};

// Generate email prefix from name
const generatePrefix = (name: string): string => {
  const parts = name.toLowerCase().trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[parts.length - 1]}`.replace(/[^a-z.]/g, '');
  }
  return parts[0].replace(/[^a-z]/g, '');
};

const DOMAIN = 'jbj.ae';

const EmailManagement = () => {
  const [emails, setEmails] = useState<EmployeeEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmployeeEmail | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newPrefix, setNewPrefix] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newQuota, setNewQuota] = useState(1024);
  const [creating, setCreating] = useState(false);

  // Password reset
  const [resetPassword, setResetPassword] = useState('');

  // Created credentials to show
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    password: string;
    name: string;
  } | null>(null);

  // Team members without emails yet
  const availableMembers = useMemo(() => {
    const existingPrefixes = emails.map((e) => e.email_prefix.toLowerCase());
    return allTeamMembers.filter((m) => {
      const prefix = generatePrefix(m.name);
      return !existingPrefixes.includes(prefix);
    });
  }, [emails]);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch emails:', error);
      toast.error('Failed to load email accounts');
    } else {
      setEmails((data as EmployeeEmail[]) || []);
    }
    setLoading(false);
  };

  const handleSelectMember = (member: TeamMember) => {
    setNewName(member.name);
    setNewPrefix(generatePrefix(member.name));
    setNewDepartment(member.department);
    setNewPosition(member.role);
    setNewPassword(generatePassword());
  };

  const handleCreateEmail = async () => {
    if (!newPrefix || !newName) {
      toast.error('Name and email prefix are required');
      return;
    }

    const emailAddress = `${newPrefix}@${DOMAIN}`;

    // Check if exists
    const existing = emails.find(
      (e) => e.email_address.toLowerCase() === emailAddress.toLowerCase()
    );
    if (existing) {
      toast.error(`${emailAddress} already exists`);
      return;
    }

    setCreating(true);

    const password = newPassword || generatePassword();

    const { data, error } = await supabase
      .from('employee_emails')
      .insert({
        employee_name: newName,
        email_prefix: newPrefix,
        email_address: emailAddress,
        department: newDepartment || null,
        position: newPosition || null,
        password_hash: password, // In a real system this would be hashed
        quota_mb: newQuota,
        status: 'active',
        created_by: (await supabase.auth.getUser()).data.user?.id || '',
      })
      .select()
      .single();

    if (error) {
      console.error('Create email error:', error);
      toast.error('Failed to create email account');
    } else {
      toast.success(`✅ ${emailAddress} created successfully!`);
      setCreatedCreds({ email: emailAddress, password, name: newName });
      setShowCreateDialog(false);
      setShowCredentialsDialog(true);
      fetchEmails();
      // Reset form
      setNewName('');
      setNewPrefix('');
      setNewDepartment('');
      setNewPosition('');
      setNewPassword('');
      setNewQuota(1024);
    }
    setCreating(false);
  };

  const handleResetPassword = async () => {
    if (!selectedEmail || !resetPassword) return;

    const { error } = await supabase
      .from('employee_emails')
      .update({ password_hash: resetPassword })
      .eq('id', selectedEmail.id);

    if (error) {
      toast.error('Failed to reset password');
    } else {
      toast.success(`Password reset for ${selectedEmail.email_address}`);
      setShowPasswordDialog(false);
      setResetPassword('');
      setSelectedEmail(null);
      fetchEmails();
    }
  };

  const handleSuspend = async (email: EmployeeEmail) => {
    const newStatus = email.status === 'active' ? 'suspended' : 'active';
    const { error } = await supabase
      .from('employee_emails')
      .update({ status: newStatus })
      .eq('id', email.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(
        `${email.email_address} ${newStatus === 'active' ? 'activated' : 'suspended'}`
      );
      fetchEmails();
    }
  };

  const handleDelete = async (email: EmployeeEmail) => {
    if (!confirm(`Delete ${email.email_address}? This cannot be undone.`)) return;

    const { error } = await supabase
      .from('employee_emails')
      .update({ status: 'deleted' })
      .eq('id', email.id);

    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success(`${email.email_address} deleted`);
      fetchEmails();
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredEmails = emails.filter((e) => {
    if (e.status === 'deleted') return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.employee_name.toLowerCase().includes(q) ||
      e.email_address.toLowerCase().includes(q) ||
      (e.department && e.department.toLowerCase().includes(q))
    );
  });

  const activeCount = emails.filter((e) => e.status === 'active').length;
  const suspendedCount = emails.filter((e) => e.status === 'suspended').length;

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );

  const exportCredentials = () => {
    if (!createdCreds) return;
    const text = `JBJ Global Real Estate — Employee Email Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Employee: ${createdCreds.name}
Email: ${createdCreds.email}
Password: ${createdCreds.password}

Mail Server Settings:
━━━━━━━━━━━━━━━━━━━━
IMAP Server: mail.${DOMAIN}
IMAP Port: 993 (SSL/TLS)

SMTP Server: mail.${DOMAIN}
SMTP Port: 465 (SSL/TLS)

Webmail: https://mail.${DOMAIN}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated on: ${new Date().toLocaleDateString()}
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${createdCreds.email}-credentials.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Credentials file downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-crm-text flex items-center gap-2">
            <Mail className="h-5 w-5 text-gold" />
            JBJ Email Accounts
          </h3>
          <p className="text-sm text-crm-text-muted mt-1">
            Manage employee @{DOMAIN} email credentials
          </p>
        </div>
        <Button
          onClick={() => {
            setNewPassword(generatePassword());
            setShowCreateDialog(true);
          }}
          className="bg-gold hover:bg-gold/90 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Email Account
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-white border-crm-border">
          <CardContent className="p-4 text-center">
            <Mail className="h-5 w-5 text-gold mx-auto mb-1" />
            <p className="text-2xl font-bold text-crm-text">{activeCount}</p>
            <p className="text-xs text-crm-text-muted">Active Accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-crm-border">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-crm-text">{suspendedCount}</p>
            <p className="text-xs text-crm-text-muted">Suspended</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-crm-border">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-crm-text">{availableMembers.length}</p>
            <p className="text-xs text-crm-text-muted">Without Email</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-crm-text-muted" />
        <Input
          placeholder="Search by name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-white border-crm-border text-crm-text placeholder:text-crm-text-muted"
        />
      </div>

      {/* Email List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {loading ? (
            <Card className="bg-white border-crm-border">
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-gold mx-auto mb-3" />
                <p className="text-crm-text-muted">Loading email accounts...</p>
              </CardContent>
            </Card>
          ) : filteredEmails.length === 0 ? (
            <Card className="bg-white border-crm-border">
              <CardContent className="py-12 text-center">
                <Mail className="h-12 w-12 text-crm-text-muted/30 mx-auto mb-4" />
                <p className="text-crm-text-muted font-medium">No email accounts yet</p>
                <p className="text-xs text-crm-text-muted mt-1">
                  Click "Create Email Account" to generate the first one
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEmails.map((email) => (
              <Card
                key={email.id}
                className="bg-white border-crm-border hover:border-gold/40 transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5 text-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-crm-text truncate">
                          {email.employee_name}
                        </p>
                        <p className="text-sm text-gold font-medium truncate">
                          {email.email_address}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {email.department && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-crm-text-muted border-crm-border"
                            >
                              {email.department}
                            </Badge>
                          )}
                          {email.position && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-crm-text-muted border-crm-border"
                            >
                              {email.position}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        className={
                          email.status === 'active'
                            ? 'bg-green-500/20 text-green-600 border-green-500/30'
                            : 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
                        }
                      >
                        {email.status}
                      </Badge>

                      {/* Show password */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() =>
                          setShowPasswords((p) => ({
                            ...p,
                            [email.id]: !p[email.id],
                          }))
                        }
                      >
                        {showPasswords[email.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>

                      {showPasswords[email.id] && (
                        <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                          <code className="text-xs text-crm-text font-mono">
                            {email.password_hash}
                          </code>
                          <CopyButton text={email.password_hash} field={`pass-${email.id}`} />
                        </div>
                      )}

                      <CopyButton text={email.email_address} field={`email-${email.id}`} />

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          setSelectedEmail(email);
                          setResetPassword(generatePassword());
                          setShowPasswordDialog(true);
                        }}
                      >
                        <Key className="h-4 w-4 text-blue-500" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSuspend(email)}
                      >
                        <Shield
                          className={`h-4 w-4 ${email.status === 'active' ? 'text-yellow-500' : 'text-green-500'}`}
                        />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleDelete(email)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create Email Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-crm-text flex items-center gap-2">
              <Mail className="h-5 w-5 text-gold" />
              Create JBJ Email Account
            </DialogTitle>
            <DialogDescription>
              Generate a professional @{DOMAIN} email for an employee
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Select from Team */}
            {availableMembers.length > 0 && (
              <div>
                <Label className="text-crm-text text-sm font-medium">
                  Quick Select Employee
                </Label>
                <Select
                  onValueChange={(val) => {
                    const member = allTeamMembers.find((m) => m.id === val);
                    if (member) handleSelectMember(member);
                  }}
                >
                  <SelectTrigger className="bg-white border-crm-border text-crm-text">
                    <SelectValue placeholder="Choose from team..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {availableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} — {m.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-crm-text text-sm">Full Name *</Label>
                <Input
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNewPrefix(generatePrefix(e.target.value));
                  }}
                  placeholder="Jane Doe"
                  className="bg-white border-crm-border text-crm-text"
                />
              </div>
              <div>
                <Label className="text-crm-text text-sm">Department</Label>
                <Input
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="Sales"
                  className="bg-white border-crm-border text-crm-text"
                />
              </div>
            </div>

            <div>
              <Label className="text-crm-text text-sm">Position</Label>
              <Input
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                placeholder="Senior Broker"
                className="bg-white border-crm-border text-crm-text"
              />
            </div>

            {/* Email Preview */}
            <div>
              <Label className="text-crm-text text-sm">Email Address *</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newPrefix}
                  onChange={(e) =>
                    setNewPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, ''))
                  }
                  placeholder="firstname.lastname"
                  className="bg-white border-crm-border text-crm-text"
                />
                <span className="text-crm-text font-medium shrink-0">@{DOMAIN}</span>
              </div>
            </div>

            {/* Password */}
            <div>
              <Label className="text-crm-text text-sm flex items-center gap-2">
                Password
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setNewPassword(generatePassword())}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white border-crm-border text-crm-text font-mono"
                />
                <CopyButton text={newPassword} field="new-pass" />
              </div>
            </div>

            {/* Quota */}
            <div>
              <Label className="text-crm-text text-sm">Storage Quota (MB)</Label>
              <Select
                value={String(newQuota)}
                onValueChange={(v) => setNewQuota(Number(v))}
              >
                <SelectTrigger className="bg-white border-crm-border text-crm-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="512">512 MB</SelectItem>
                  <SelectItem value="1024">1 GB</SelectItem>
                  <SelectItem value="2048">2 GB</SelectItem>
                  <SelectItem value="5120">5 GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              className="border-crm-border text-crm-text"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateEmail}
              disabled={creating || !newPrefix || !newName}
              className="bg-gold hover:bg-gold/90 text-white"
            >
              {creating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Card Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-crm-text flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Email Account Created!
            </DialogTitle>
            <DialogDescription>
              Save these credentials — the password won't be shown again unless you view it
              from the list.
            </DialogDescription>
          </DialogHeader>

          {createdCreds && (
            <div className="space-y-4">
              {/* Credentials */}
              <Card className="bg-gradient-to-br from-gold/5 to-gold/10 border-gold/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-crm-text-muted">Employee</p>
                      <p className="font-semibold text-crm-text">{createdCreds.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-crm-text-muted">Email</p>
                      <p className="font-mono text-sm text-gold font-semibold">
                        {createdCreds.email}
                      </p>
                    </div>
                    <CopyButton text={createdCreds.email} field="cred-email" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-crm-text-muted">Password</p>
                      <p className="font-mono text-sm text-crm-text">
                        {createdCreds.password}
                      </p>
                    </div>
                    <CopyButton text={createdCreds.password} field="cred-pass" />
                  </div>
                </CardContent>
              </Card>

              {/* Server Settings */}
              <Card className="bg-white border-crm-border">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm text-crm-text flex items-center gap-2">
                    <Server className="h-4 w-4 text-gold" />
                    Mail Server Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-crm-text-muted">IMAP Server</p>
                      <p className="text-crm-text font-mono">mail.{DOMAIN}</p>
                    </div>
                    <div>
                      <p className="text-crm-text-muted">IMAP Port</p>
                      <p className="text-crm-text font-mono">993 (SSL)</p>
                    </div>
                    <div>
                      <p className="text-crm-text-muted">SMTP Server</p>
                      <p className="text-crm-text font-mono">mail.{DOMAIN}</p>
                    </div>
                    <div>
                      <p className="text-crm-text-muted">SMTP Port</p>
                      <p className="text-crm-text font-mono">465 (SSL)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={exportCredentials}
              className="border-crm-border text-crm-text gap-2"
            >
              <Download className="h-4 w-4" />
              Download Credentials
            </Button>
            <Button
              onClick={() => setShowCredentialsDialog(false)}
              className="bg-gold hover:bg-gold/90 text-white"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle className="text-crm-text flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-500" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              {selectedEmail?.email_address}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-crm-text text-sm flex items-center gap-2">
                New Password
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setResetPassword(generatePassword())}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate
                </Button>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="bg-white border-crm-border text-crm-text font-mono"
                />
                <CopyButton text={resetPassword} field="reset-pass" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(false)}
              className="border-crm-border text-crm-text"
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailManagement;
