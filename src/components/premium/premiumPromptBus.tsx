/**
 * Tiny event bus so `useRequireAuth()` can open the shared prompt modal
 * from anywhere in the tree without threading props everywhere.
 */
import type { PremiumActionKey } from "@/config/premiumActions";

export type PremiumPromptPayload = {
  actionLabel: string;
  actionKey: PremiumActionKey;
  next: string;
};

type Listener = (p: PremiumPromptPayload) => void;
const listeners = new Set<Listener>();

export function openPremiumPrompt(p: PremiumPromptPayload) {
  listeners.forEach((l) => l(p));
}

export function subscribePremiumPrompt(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}
