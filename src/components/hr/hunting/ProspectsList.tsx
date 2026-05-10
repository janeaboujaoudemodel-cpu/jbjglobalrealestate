import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Search,
  MoreVertical,
  Mail,
  Phone,
  Linkedin,
  Building2,
  MapPin,
  Star,
  MessageSquare,
  UserCheck,
  UserX
} from 'lucide-react';
import { useHuntingSystem, HuntTargetType, HuntProspect, ProspectStatus } from '@/hooks/useHuntingSystem';
import { Textarea } from '@/components/ui/textarea';

interface ProspectsListProps {
  targetType: HuntTargetType;
}

export function ProspectsList({ targetType }: ProspectsListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | 'all'>('all');
  const [newProspect, setNewProspect] = useState<Partial<HuntProspect>>({
    full_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    company: '',
    job_title: '',
    location: '',
    notes: '',
  });

  const { 
    prospects, 
    loading, 
    fetchProspects, 
    addProspect,
    updateProspectStatus,
    campaigns
  } = useHuntingSystem();

  useEffect(() => {
    fetchProspects(undefined, targetType);
  }, [targetType, fetchProspects]);

  const filteredProspects = prospects
    .filter(p => p.target_type === targetType)
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p => 
      searchQuery === '' ||
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleAddProspect = async () => {
    if (!newProspect.full_name) {
      return;
    }
    
    await addProspect({
      full_name: newProspect.full_name,
      target_type: targetType,
      status: 'new',
      source: 'manual',
      email: newProspect.email || undefined,
      phone: newProspect.phone || undefined,
      linkedin_url: newProspect.linkedin_url || undefined,
      company: newProspect.company || undefined,
      job_title: newProspect.job_title || undefined,
      location: newProspect.location || undefined,
      notes: newProspect.notes || undefined,
    });
    setIsAddOpen(false);
    setNewProspect({
      full_name: '',
      email: '',
      phone: '',
      linkedin_url: '',
      company: '',
      job_title: '',
      location: '',
      notes: '',
    });
    fetchProspects(undefined, targetType);
  };

  const getStatusBadge = (status: ProspectStatus) => {
    const config: Record<ProspectStatus, { color: string; label: string }> = {
      new: { color: 'bg-muted text-muted-foreground', label: 'New' },
      contacted: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', label: 'Contacted' },
      responded: { color: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30', label: 'Responded' },
      qualified: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', label: 'Qualified' },
      negotiating: { color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', label: 'Negotiating' },
      converted: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', label: 'Converted' },
      rejected: { color: 'bg-red-500/10 text-red-600 border-red-500/30', label: 'Rejected' },
      not_interested: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/30', label: 'Not Interested' },
    };
    return config[status];
  };

  const targetLabels = {
    investor: { singular: 'Investor', plural: 'Investors' },
    broker: { singular: 'Broker', plural: 'Brokers' },
    employee: { singular: 'Candidate', plural: 'Candidates' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${targetLabels[targetType].plural.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProspectStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="responded">Responded</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="negotiating">Negotiating</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Add {targetLabels[targetType].singular}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New {targetLabels[targetType].singular}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="John Doe"
                    value={newProspect.full_name}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    placeholder="Company name"
                    value={newProspect.company || ''}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newProspect.email || ''}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    placeholder="+971 50 123 4567"
                    value={newProspect.phone || ''}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    placeholder="Senior Broker"
                    value={newProspect.job_title || ''}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, job_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Dubai, UAE"
                    value={newProspect.location || ''}
                    onChange={(e) => setNewProspect(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>LinkedIn URL</Label>
                <Input
                  placeholder="https://linkedin.com/in/username"
                  value={newProspect.linkedin_url || ''}
                  onChange={(e) => setNewProspect(prev => ({ ...prev, linkedin_url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes about this prospect..."
                  value={newProspect.notes || ''}
                  onChange={(e) => setNewProspect(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button variant="primary" onClick={handleAddProspect} disabled={!newProspect.full_name}>
                Add {targetLabels[targetType].singular}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Prospects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89555]" />
        </div>
      ) : filteredProspects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">No {targetLabels[targetType].plural} Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters.'
                : `Add your first ${targetLabels[targetType].singular.toLowerCase()} to start tracking.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredProspects.map((prospect) => {
            const statusConfig = getStatusBadge(prospect.status);
            return (
              <Card key={prospect.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#EFE6D6]/10 text-[#1A1A1A]">
                        {prospect.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate text-foreground">{prospect.full_name}</h4>
                        <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        {prospect.ai_score && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="h-3 w-3" />
                            {prospect.ai_score}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        {prospect.job_title && (
                          <span>{prospect.job_title}</span>
                        )}
                        {prospect.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {prospect.company}
                          </span>
                        )}
                        {prospect.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {prospect.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1">
                      {prospect.email && (
                        <Button variant="secondary" size="icon" asChild>
                          <a href={`mailto:${prospect.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {prospect.phone && (
                        <Button variant="secondary" size="icon" asChild>
                          <a href={`tel:${prospect.phone}`}>
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {prospect.linkedin_url && (
                        <Button variant="secondary" size="icon" asChild>
                          <a href={prospect.linkedin_url} target="_blank" rel="noopener noreferrer">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => updateProspectStatus(prospect.id, 'contacted')}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Mark Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateProspectStatus(prospect.id, 'qualified')}>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Mark Qualified
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateProspectStatus(prospect.id, 'converted')}>
                            <Star className="h-4 w-4 mr-2" />
                            Mark Converted
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateProspectStatus(prospect.id, 'not_interested')}
                            className="text-orange-500"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Not Interested
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProspectsList;
