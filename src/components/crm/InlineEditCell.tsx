import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditCellProps {
  leadId: string;
  field: string;
  value: string | null;
  placeholder?: string;
  onSuccess?: () => void;
  className?: string;
  hasOwnerAccess?: boolean;
}

const InlineEditCell = ({
  leadId,
  field,
  value,
  placeholder = "—",
  onSuccess,
  className,
  hasOwnerAccess = false,
}: InlineEditCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === (value || "")) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      // Build update object based on field
      const updateData: Record<string, any> = {};
      
      if (field === "email_lower") {
        const normalized = editValue.toLowerCase().trim();
        updateData.email_lower = normalized || null;
        updateData.email_normalized = normalized || null;
      } else if (field === "phone_e164") {
        // Normalize phone number
        let normalized = editValue.replace(/[^\d+]/g, "");
        if (!normalized.startsWith("+") && normalized.length >= 9) {
          normalized = "+971" + (normalized.startsWith("0") ? normalized.slice(1) : normalized);
        }
        updateData.phone_e164 = normalized || null;
        updateData.phone_raw = editValue || null;
        updateData.phone_normalized = normalized.replace(/\D/g, "") || null;
      } else {
        updateData[field] = editValue || null;
      }

      const { error } = await supabase
        .from("crm_leads")
        .update(updateData as any)
        .eq("id", leadId);

      if (error) throw error;

      toast.success("Updated successfully");
      onSuccess?.();
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update:", err);
      toast.error("Failed to update lead");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!hasOwnerAccess) {
    return (
      <span className={cn("text-sm", className)}>
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-6 text-xs bg-muted border-border px-1 py-0 w-28"
          disabled={saving}
        />
        <button
          onClick={handleSave}
          className="p-0.5 hover:jj-surface-emerald-soft rounded text-green-500"
          disabled={saving}
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          onClick={handleCancel}
          className="p-0.5 hover:bg-red-500/20 rounded text-red-500"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        "group flex items-center gap-1 text-sm hover:bg-muted/50 rounded px-1 py-0.5 -ml-1 transition-colors cursor-pointer",
        className
      )}
      title="Click to edit"
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export default InlineEditCell;
