import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Crown, Search, UserPlus, Gift, Calendar, Star, Shield, 
  CheckCircle, XCircle, Eye, Edit, Trash2, Building, Briefcase,
  GraduationCap, Users, PartyPopper
} from 'lucide-react';
import { format } from 'date-fns';

interface VIPClient {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  nationality: string | null;
  vip_category: string;
  profession: string | null;
  job_title: string | null;
  organization: string | null;
  is_verified: boolean;
  hide_from_public: boolean;
  loyalty_points: number;
  properties_purchased: number;
  total_investment_value: number;
  created_at: string;
}

interface RegisteredUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
  };
}

const VIP_CATEGORIES = [
  { value: 'government_official', label: 'Government Official', icon: Building },
  { value: 'doctor', label: 'Doctor', icon: Shield },
  { value: 'lawyer', label: 'Lawyer', icon: Briefcase },
  { value: 'architect', label: 'Architect', icon: Building },
  { value: 'engineer', label: 'Engineer', icon: Building },
  { value: 'phd_holder', label: 'PhD Holder', icon: GraduationCap },
  { value: 'masters_holder', label: "Master's Holder", icon: GraduationCap },
  { value: 'investor', label: 'Investor', icon: Star },
  { value: 'existing_buyer', label: 'Existing Buyer', icon: CheckCircle },
  { value: 'loyal_customer', label: 'Loyal Customer', icon: Crown },
];

const VIPClientManager = () => {
  const [vipClients, setVipClients] = useState<VIPClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // New VIP form state
  const [newVIP, setNewVIP] = useState({
    user_id: '',
    email: '',
    full_name: '',
    phone: '',
    nationality: '',
    vip_category: 'investor',
    profession: '',
    job_title: '',
    organization: '',
  });

  useEffect(() => {
    fetchVIPClients();
  }, []);

  const fetchVIPClients = async () => {
    try {
      const { data, error } = await supabase
        .from('vip_clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVipClients(data || []);
    } catch (error) {
      console.error('Error fetching VIP clients:', error);
      toast.error('Failed to load VIP clients');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) return;
    
    setSearchingUsers(true);
    try {
      // Search in leads table
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, email, full_name, phone')
        .or(`email.ilike.%${userSearchQuery}%,full_name.ilike.%${userSearchQuery}%`)
        .limit(10);

      if (leadError) throw leadError;

      // Map lead data
      const results = (leadData || []).map(l => ({ 
        id: l.id, 
        email: l.email, 
        name: l.full_name, 
        phone: l.phone, 
        source: 'lead' 
      }));

      const unique = results.filter((item, index, self) =>
        index === self.findIndex(t => t.email === item.email)
      );

      setSearchResults(unique);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearchingUsers(false);
    }
  };

  const selectUserForVIP = (user: any) => {
    setNewVIP({
      ...newVIP,
      user_id: user.id,
      email: user.email || '',
      full_name: user.name || '',
      phone: user.phone || '',
    });
    setSearchResults([]);
  };

  const addVIPClient = async () => {
    if (!newVIP.email || !newVIP.full_name || !newVIP.vip_category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('vip_clients')
        .insert({
          user_id: newVIP.user_id || null,
          email: newVIP.email,
          full_name: newVIP.full_name,
          phone: newVIP.phone || null,
          nationality: newVIP.nationality || null,
          vip_category: newVIP.vip_category as any,
          profession: newVIP.profession || null,
          job_title: newVIP.job_title || null,
          organization: newVIP.organization || null,
          is_verified: true,
        });

      if (error) throw error;

      toast.success('VIP client added successfully');
      setShowAddDialog(false);
      setNewVIP({
        user_id: '',
        email: '',
        full_name: '',
        phone: '',
        nationality: '',
        vip_category: 'investor',
        profession: '',
        job_title: '',
        organization: '',
      });
      fetchVIPClients();
    } catch (error) {
      console.error('Error adding VIP client:', error);
      toast.error('Failed to add VIP client');
    }
  };

  const toggleVerification = async (client: VIPClient) => {
    try {
      const { error } = await supabase
        .from('vip_clients')
        .update({ 
          is_verified: !client.is_verified,
          verified_at: !client.is_verified ? new Date().toISOString() : null,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast.success(client.is_verified ? 'VIP status revoked' : 'VIP status verified');
      fetchVIPClients();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification');
    }
  };

  const deleteVIPClient = async (id: string) => {
    if (!confirm('Are you sure you want to remove this VIP client?')) return;

    try {
      const { error } = await supabase
        .from('vip_clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('VIP client removed');
      fetchVIPClients();
    } catch (error) {
      console.error('Error deleting VIP client:', error);
      toast.error('Failed to remove VIP client');
    }
  };

  const filteredClients = vipClients.filter(client => {
    const matchesSearch = 
      client.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || client.vip_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const cat = VIP_CATEGORIES.find(c => c.value === category);
    return cat?.icon || Crown;
  };

  const getCategoryLabel = (category: string) => {
    const cat = VIP_CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-gold" />
            VIP Client Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage VIP clients, loyalty programs, and exclusive events
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button variant="dark">
              <UserPlus className="h-4 w-4 mr-2" />
              Add VIP Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New VIP Client</DialogTitle>
              <DialogDescription>
                Search for a registered user or enter details manually
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              {/* Search for existing users */}
              <div className="space-y-2">
                <Label>Search Registered Users</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by email or name..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  />
                  <Button onClick={searchUsers} disabled={searchingUsers} variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => selectUserForVIP(user)}
                        className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium">{user.name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={newVIP.full_name}
                      onChange={(e) => setNewVIP({ ...newVIP, full_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newVIP.email}
                      onChange={(e) => setNewVIP({ ...newVIP, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={newVIP.phone}
                      onChange={(e) => setNewVIP({ ...newVIP, phone: e.target.value })}
                      placeholder="+971 50 123 4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input
                      value={newVIP.nationality}
                      onChange={(e) => setNewVIP({ ...newVIP, nationality: e.target.value })}
                      placeholder="UAE"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>VIP Category *</Label>
                  <Select
                    value={newVIP.vip_category}
                    onValueChange={(value) => setNewVIP({ ...newVIP, vip_category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VIP_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input
                      value={newVIP.job_title}
                      onChange={(e) => setNewVIP({ ...newVIP, job_title: e.target.value })}
                      placeholder="CEO"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <Input
                      value={newVIP.organization}
                      onChange={(e) => setNewVIP({ ...newVIP, organization: e.target.value })}
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <Button onClick={addVIPClient} className="w-full bg-gold hover:bg-gold-dark text-black">
                  <Crown className="h-4 w-4 mr-2" />
                  Add VIP Client
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-gold/20 to-gold/5 border-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-gold" />
              <div>
                <p className="text-2xl font-bold">{vipClients.length}</p>
                <p className="text-xs text-muted-foreground">Total VIPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{vipClients.filter(c => c.is_verified).length}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {vipClients.filter(c => c.vip_category === 'investor' || c.vip_category === 'existing_buyer').length}
                </p>
                <p className="text-xs text-muted-foreground">Investors</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gold/15 to-gold/5 border-gold/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-gold" />
              <div>
                <p className="text-2xl font-bold">
                  {vipClients.filter(c => c.vip_category === 'government_official').length}
                </p>
                <p className="text-xs text-muted-foreground">Government</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {VIP_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* VIP Clients List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold mx-auto" />
            <p className="text-muted-foreground mt-2">Loading VIP clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="py-12">
            <CardContent className="text-center">
              <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No VIP Clients Found</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Add your first VIP client to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => {
            const CategoryIcon = getCategoryIcon(client.vip_category);
            return (
              <Card key={client.id} className="hover:border-gold/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
                        <CategoryIcon className="h-6 w-6 text-gold" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{client.full_name}</h3>
                          {client.is_verified && (
                            <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {client.hide_from_public && (
                            <Badge variant="outline" className="text-xs">
                              <Eye className="h-3 w-3 mr-1" />
                              Hidden
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className="bg-gold/20 text-gold border-gold/30">
                            {getCategoryLabel(client.vip_category)}
                          </Badge>
                          {client.organization && (
                            <Badge variant="outline" className="text-xs">
                              {client.organization}
                            </Badge>
                          )}
                          {client.loyalty_points > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              {client.loyalty_points} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVerification(client)}
                        className={client.is_verified ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
                      >
                        {client.is_verified ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Revoke
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVIPClient(client.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VIPClientManager;
