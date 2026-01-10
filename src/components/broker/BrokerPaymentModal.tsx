// Payment functionality has been removed - All features are now FREE
// This file is kept for backwards compatibility

interface TierData {
  id: string;
  name: string;
  price: number;
  priceAed: number;
  yearlyPrice: number;
  yearlyPriceAed: number;
  trialDays: number;
  aiCredits: number;
}

interface BrokerPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: TierData;
  billingPeriod: "monthly" | "yearly";
  onSuccess: () => void;
}

export default function BrokerPaymentModal({
  open,
  onOpenChange,
  onSuccess,
}: BrokerPaymentModalProps) {
  // Auto-call success since everything is free now
  if (open) {
    setTimeout(() => {
      onSuccess();
      onOpenChange(false);
    }, 100);
  }
  
  return null;
}
