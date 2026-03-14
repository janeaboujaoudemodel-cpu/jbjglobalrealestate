import { useState, useCallback, useRef } from "react";

export type StepUpSeverity = "normal" | "critical";

const ELEVATED_SESSION_MS = 10 * 60 * 1000; // 10 minutes

interface UseStepUpAuthReturn {
  /** True if user has an elevated session (recently re-authenticated) */
  isElevated: boolean;
  /** Call to require step-up auth. Returns a promise that resolves when authenticated. */
  requireStepUp: (
    actionLabel: string,
    severity: StepUpSeverity,
    onConfirmed: () => void
  ) => void;
  /** Grant elevated access (called by ReAuthModal on success) */
  grantElevatedAccess: () => void;
  /** Modal state */
  modalOpen: boolean;
  modalActionLabel: string;
  modalSeverity: StepUpSeverity;
  onModalOpenChange: (open: boolean) => void;
  onModalSuccess: () => void;
}

export function useStepUpAuth(): UseStepUpAuthReturn {
  const [elevatedUntil, setElevatedUntil] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalActionLabel, setModalActionLabel] = useState("");
  const [modalSeverity, setModalSeverity] = useState<StepUpSeverity>("normal");
  const callbackRef = useRef<(() => void) | null>(null);

  const isElevated = elevatedUntil ? Date.now() < elevatedUntil : false;

  const grantElevatedAccess = useCallback(() => {
    setElevatedUntil(Date.now() + ELEVATED_SESSION_MS);
  }, []);

  const requireStepUp = useCallback(
    (actionLabel: string, severity: StepUpSeverity, onConfirmed: () => void) => {
      // Critical actions always require re-auth
      if (severity !== "critical" && isElevated) {
        onConfirmed();
        return;
      }

      callbackRef.current = onConfirmed;
      setModalActionLabel(actionLabel);
      setModalSeverity(severity);
      setModalOpen(true);
    },
    [isElevated]
  );

  const onModalSuccess = useCallback(() => {
    grantElevatedAccess();
    callbackRef.current?.();
    callbackRef.current = null;
  }, [grantElevatedAccess]);

  const onModalOpenChange = useCallback((open: boolean) => {
    setModalOpen(open);
    if (!open) callbackRef.current = null;
  }, []);

  return {
    isElevated,
    requireStepUp,
    grantElevatedAccess,
    modalOpen,
    modalActionLabel,
    modalSeverity,
    onModalOpenChange,
    onModalSuccess,
  };
}
