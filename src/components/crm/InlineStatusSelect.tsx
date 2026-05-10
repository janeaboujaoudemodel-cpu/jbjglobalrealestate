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
        className="w-auto min-w-[120px] h-7 border-0 bg-transparent p-0 focus:ring-0 [&>svg]:hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <LeadStatusBadge status={currentStatus} size="sm" />
      </SelectTrigger>
      <SelectContent 
        position="popper"
        side="bottom"
        align="start"
        sideOffset={6}
        avoidCollisions={false}
        className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 shadow-xl max-h-96 rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* POSITIVE - Green */}
        <div className="px-2 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Positive
        </div>
        {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
          <SelectItem 
            key={status.value} 
            value={status.value} 
            className="text-[#1A1A1A] hover:bg-[#B89555]/10 pl-4 focus:bg-[#B89555]/15 focus:text-[#1A1A1A]"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              {status.label}
            </div>
          </SelectItem>
        ))}
        
        {/* NEUTRAL */}
        <div className="px-2 py-1.5 text-xs font-bold text-[#1A1A1A]/70 uppercase tracking-wide mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#B89555]" />
          Neutral
        </div>
        {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
          <SelectItem 
            key={status.value} 
            value={status.value} 
            className="text-[#1A1A1A] hover:bg-[#B89555]/10 pl-4 focus:bg-[#B89555]/15 focus:text-[#1A1A1A]"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B89555] flex-shrink-0" />
              {status.label}
            </div>
          </SelectItem>
        ))}
        
        {/* NEGATIVE - Red */}
        <div className="px-2 py-1.5 text-xs font-bold text-red-700 uppercase tracking-wide mt-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Negative
        </div>
        {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
          <SelectItem 
            key={status.value} 
            value={status.value} 
            className="text-[#1A1A1A] hover:bg-[#B89555]/10 pl-4 focus:bg-[#B89555]/15 focus:text-[#1A1A1A]"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
              {status.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
