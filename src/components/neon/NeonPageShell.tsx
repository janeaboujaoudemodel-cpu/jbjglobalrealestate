import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NeonPageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Premium neon page shell — deep navy + cyan/violet/magenta glow orbs.
 * Drop-in replacement for the outermost <div> on News, Market Intelligence,
 * Guides, FAQ, Books, Investor Education and Golden Visa pages.
 *
 * Behaviour:
 *  - Adds `data-neon-page` which scopes the global neon CSS overrides
 *    (champagne bands flatten to transparent, ink text → ombre-white,
 *    gold accents → cyan, cards → dark glass).
 *  - Renders two drifting blurred orbs (cyan + magenta) behind content.
 *  - Respects prefers-reduced-motion.
 */
export const NeonPageShell = ({ children, className }: NeonPageShellProps) => (
  <div data-neon-page className={cn("relative", className)}>
    {children}
  </div>
);

export default NeonPageShell;
