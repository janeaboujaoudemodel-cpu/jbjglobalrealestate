import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Plus, 
  Play, 
  Pause, 
  MoreVertical,
  Users,
  MessageSquare,
  CheckCircle,
  Target
} from 'lucide-react';
import { useHuntingSystem, HuntTargetType, HuntCampaign, CampaignStatus } from '@/hooks/useHuntingSystem';
import { formatDistanceToNow } from 'date-fns';

interface CampaignManagerProps {
  targetType: HuntTargetType;
}

export function CampaignManager({ targetType }: CampaignManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    description: '',
    message_template: '',
    auto_follow_up: false,
    follow_up_days: 3,
  });

  const { 
    campaigns, 
    loading, 
    fetchCampaigns, 
    createCampaign, 
    updateCampaign,
    templates,
    fetchTemplates 
  } = useHuntingSystem();

  useEffect(() => {
    fetchCampaigns(targetType);
    fetchTemplates(targetType);
  }, [targetType, fetchCampaigns, fetchTemplates]);

  const filteredCampaigns = campaigns.filter(c => c.target_type === targetType);

  const handleCreate = async () => {
    await createCampaign({
      ...newCampaign,
      target_type: targetType,
      status: 'draft' as CampaignStatus,
    });
    setIsCreateOpen(false);
    setNewCampaign({
      name: '',
      description: '',
      message_template: '',
      auto_follow_up: false,
      follow_up_days: 3,
    });
  };

  const handleStatusChange = async (campaign: HuntCampaign, status: CampaignStatus) => {
    await updateCampaign(campaign.id, { 
      status,
      start_date: status === 'active' ? new Date().toISOString() : campaign.start_date,
    });
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'paused': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'completed': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const targetLabel = {
    investor: 'Investor',
    broker: 'Broker',
    employee: 'Talent',
  }[targetType];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{targetLabel} Campaigns</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create {targetLabel} Hunting Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  placeholder={`e.g., Q1 ${targetLabel} Outreach`}
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Campaign goals and target criteria..."
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Message Template</Label>
                {templates.length > 0 ? (
                  <Select
                    value={newCampaign.message_template}
                    onValueChange={(v) => setNewCampaign(prev => ({ ...prev, message_template: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.content}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Textarea
                    placeholder="Enter your outreach message..."
                    value={newCampaign.message_template}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, message_template: e.target.value }))}
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Follow-up</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically send follow-up messages
                  </p>
                </div>
                <Switch
                  checked={newCampaign.auto_follow_up}
                  onCheckedChange={(v) => setNewCampaign(prev => ({ ...prev, auto_follow_up: v }))}
                />
              </div>

              {newCampaign.auto_follow_up && (
                <div className="space-y-2">
                  <Label>Follow-up After (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={newCampaign.follow_up_days}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, follow_up_days: parseInt(e.target.value) }))}
                  />
                </div>
              )}

              <Button onClick={handleCreate} variant="primary" className="w-full" disabled={!newCampaign.name}>
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89555]" />
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">No Campaigns Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first {targetLabel.toLowerCase()} hunting campaign to start finding prospects.
            </p>
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground">{campaign.name}</h4>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {campaign.description}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{campaign.total_prospects} prospects</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{campaign.contacted_count} contacted</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <CheckCircle className="h-4 w-4" />
                        <span>{campaign.conversion_count} converted</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Created {formatDistanceToNow(new Date(campaign.created_at))} ago
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => handleStatusChange(campaign, 'active')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {campaign.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleStatusChange(campaign, 'paused')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button 
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusChange(campaign, 'active')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CampaignManager;
