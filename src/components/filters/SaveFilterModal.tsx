import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SaveFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
}

const SaveFilterModal = ({ open, onOpenChange, onSave }: SaveFilterModalProps) => {
  const [filterName, setFilterName] = useState("");

  const handleSave = () => {
    if (filterName.trim()) {
      onSave(filterName.trim());
      setFilterName("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#064E3B]/30">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] text-lg font-bold">
            Give name for your saved filter
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Enter filter name..."
              className="h-12 pr-10 bg-[#FDFBF7] border border-[#064E3B]/35 text-[#1A1A1A] placeholder:text-[#1A1A1A]/85 focus:border-[#064E3B]/70"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            {filterName && (
              <button
                onClick={() => setFilterName("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-[#1A1A1A] leading-relaxed">
            Start with the customer's last name or first name or company name to easily identify who the filter is for.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 border-[#064E3B]/25 text-[#1A1A1A] hover:bg-[#FDFBF7]/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!filterName.trim()}
              className="allow-white flex-1 h-11 jj-pill-emerald-metallic text-white font-bold hover:brightness-110 disabled:opacity-50"
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveFilterModal;
