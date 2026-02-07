import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LeadStatusBadge, { PIPELINE_STATUSES } from "@/components/crm/LeadStatusBadge";

interface InlineStatusSelectProps {
  leadId: string;
  currentStatus: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function InlineStatusSelect({ 
  leadId, 
  currentStatus, 
  onStatusChange 
}: InlineStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('crm_leads')
        .update({ pipeline_stage: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['crm-leads-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['owner-newest-leads'] });
      
      toast.success(`Status updated to ${PIPELINE_STATUSES.find(s => s.value === newStatus)?.label || newStatus}`);
      onStatusChange?.(newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select 
      value={currentStatus} 
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger 
        className="w-auto min-w-[120px] h-7 border-0 bg-transparent p-0 focus:ring-0"
        onClick={(e) => e.stopPropagation()}
      >
        <LeadStatusBadge status={currentStatus} size="sm" />
      </SelectTrigger>
      <SelectContent 
        className="bg-zinc-800 border-zinc-700 max-h-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-xs font-semibold text-emerald-400 uppercase">Positive</div>
        {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
          <SelectItem 
            key={status.value} 
            value={status.value} 
            className="text-white hover:bg-zinc-700"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.color}`} />
              {status.label}
            </div>
          </SelectItem>
        ))}
        <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase mt-1">Neutral</div>
        {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
          <SelectItem 
            key={status.value} 
            value={status.value} 
            className="text-white hover:bg-zinc-700"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.color}`} />
              {status.label}
            </div>
          </SelectItem>
        ))}
        <div className="px-2 py-1 text-xs font-semibold text-red-400 uppercase mt-1">Negative</div>
        {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
          <SelectItem 
            key={status.value} 
            value={status.value} 
            className="text-white hover:bg-zinc-700"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${status.color}`} />
              {status.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
