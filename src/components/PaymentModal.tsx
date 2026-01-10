// Payment functionality has been removed - All features are now FREE
// This file is kept for backwards compatibility but returns null

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  mode?: "vip" | "regenerate";
}

export function PaymentModal({ open, onOpenChange, onSuccess }: PaymentModalProps) {
  // Auto-call success since everything is free now
  if (open) {
    setTimeout(() => {
      onSuccess();
      onOpenChange(false);
    }, 100);
  }
  
  return null;
}
