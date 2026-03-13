import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";

type ActionGateReason =
  | "save_favorite"
  | "add_shortlist"
  | "compare"
  | "download"
  | "book_consultation"
  | "request_callback"
  | "submit_form"
  | "access_dashboard"
  | "access_portal"
  | "access_tools"
  | "view_documents"
  | "general";

interface ActionGateContextType {
  /** Show the gate modal with a reason */
  requireAuth: (reason?: ActionGateReason) => void;
  /** Wrap an action — runs it if authenticated, otherwise shows gate */
  gatedAction: (callback: () => void, reason?: ActionGateReason) => void;
  /** Whether the gate modal is currently open */
  isGateOpen: boolean;
  /** Close the gate modal */
  closeGate: () => void;
  /** The reason the gate was triggered */
  gateReason: ActionGateReason | null;
}

const ActionGateContext = createContext<ActionGateContextType | null>(null);

export const ActionGateProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState<ActionGateReason | null>(null);

  const requireAuth = useCallback((reason: ActionGateReason = "general") => {
    if (!user) {
      setGateReason(reason);
      setIsGateOpen(true);
    }
  }, [user]);

  const gatedAction = useCallback((callback: () => void, reason: ActionGateReason = "general") => {
    if (user) {
      callback();
    } else {
      setGateReason(reason);
      setIsGateOpen(true);
    }
  }, [user]);

  const closeGate = useCallback(() => {
    setIsGateOpen(false);
    setGateReason(null);
  }, []);

  return (
    <ActionGateContext.Provider value={{ requireAuth, gatedAction, isGateOpen, closeGate, gateReason }}>
      {children}
    </ActionGateContext.Provider>
  );
};

export const useActionGate = () => {
  const ctx = useContext(ActionGateContext);
  if (!ctx) throw new Error("useActionGate must be used within ActionGateProvider");
  return ctx;
};
