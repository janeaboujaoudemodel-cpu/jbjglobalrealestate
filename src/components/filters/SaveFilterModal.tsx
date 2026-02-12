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
      <DialogContent className="sm:max-w-[440px] bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
        <DialogHeader>
          <DialogTitle className="text-black text-lg font-bold">
            Give name for your saved filter
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="relative">
            <Input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Enter filter name..."
              className="h-12 pr-10 bg-white border-2 border-gold/30 text-black placeholder:text-zinc-400 focus:border-gold"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            {filterName && (
              <button
                onClick={() => setFilterName("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-black/50 leading-relaxed">
            Start with the customer's last name or first name or company name to easily identify who the filter is for.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 border-gold/30 text-black hover:bg-white/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!filterName.trim()}
              className="flex-1 h-11 bg-gradient-to-r from-gold to-gold-dark text-black font-bold hover:brightness-110 disabled:opacity-50"
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
