import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  onConfirm: () => void;
  isFinalDelete?: boolean;
}

const DeleteLeadDialog: React.FC<DeleteLeadDialogProps> = ({
  open,
  onOpenChange,
  leadName,
  onConfirm,
  isFinalDelete = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center">
              {isFinalDelete ? (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              ) : (
                <Trash2 className="w-6 h-6 text-red-600" />
              )}
            </div>
            <AlertDialogTitle className="text-[#1A1A1A] text-xl">
              {isFinalDelete ? "Permanently Delete Lead?" : "Move to Deleted?"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-[#1A1A1A]/70 text-base">
            {isFinalDelete ? (
              <>
                This action <strong className="text-red-600">cannot be undone</strong>. 
                The lead <strong className="text-[#1A1A1A]">"{leadName}"</strong> will be permanently 
                erased from the database.
              </>
            ) : (
              <>
                The lead <strong className="text-[#1A1A1A]">"{leadName}"</strong> will be moved to 
                the Deleted Leads section. You can restore it later or permanently delete it.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3 mt-4">
          <AlertDialogCancel className="bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:border-[#B89555]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={isFinalDelete 
              ? "bg-red-600 text-white hover:bg-red-700 border-0" 
              : "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90 border-0"
            }
          >
            {isFinalDelete ? "Delete Forever" : "Move to Deleted"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteLeadDialog;
