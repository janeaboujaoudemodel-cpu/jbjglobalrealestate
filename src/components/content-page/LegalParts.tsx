/**
 * Shared primitives for Legal / Policy pages built on ContentPageShell.
 * See .lovable/memory/ui-ux/visual-standards/content-page-layout-standard.md
 */
import { ReactNode } from "react";

export const HEADING_FONT = {
  fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
};

export const SectionCard = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    data-surface="light"
    data-legal-section-card
    style={{ color: "#1A1A1A", background: "transparent" }}
    className={
      "relative border-0 shadow-none p-2 sm:p-3 md:p-4 " +
      className
    }
  >
    {children}
  </div>
);

export const SectionHeading = ({
  number,
  icon: Icon,
  children,
}: {
  number: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}) => (
    <div className="flex items-baseline gap-3 sm:gap-4 mb-5 sm:mb-6">
    <span
      data-surface="emerald"
      className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 shrink-0 rounded-full bg-[image:var(--jj-emerald-ombre)] text-white text-sm font-semibold"
      aria-hidden
    >
      {number}
    </span>
    <h2
      className="text-2xl sm:text-3xl md:text-[32px] font-semibold text-[#0d3a2b] tracking-tight leading-tight flex items-center gap-3"
      style={HEADING_FONT}
    >
      {Icon && <Icon className="w-6 h-6 text-[#B89555]" />}
      {children}
    </h2>
  </div>
);

export const SectionDivider = () => (
  <div className="my-10 sm:my-12 flex items-center gap-4" aria-hidden>
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#B89555]/30 to-transparent" />
    <span className="h-1.5 w-1.5 rounded-full bg-[#B89555]/60" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#B89555]/30 to-transparent" />
  </div>
);

export const BulletList = ({ items }: { items: ReactNode[] }) => (
  <ul className="space-y-2.5">
    {items.map((item, i) => (
      <li key={i} className="flex gap-3 text-[#1A1A1A]/80 leading-relaxed text-[15px]">
        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#B89555] shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const LegalFooter = ({
  leftLink,
  rightLink,
}: {
  leftLink: { to: string; label: string };
  rightLink: { to: string; label: string };
}) => {
  const year = new Date().getFullYear();
  return (
    <div className="mt-14 sm:mt-16 pt-8 border-t border-[#B89555]/25 text-center">
      <p className="text-[#1A1A1A]/75 text-sm">
        &copy; {year} JBJ Global Real Estate. All Rights Reserved.
      </p>
      <div className="flex justify-center gap-4 mt-3 text-sm">
        <a
          href={leftLink.to}
          className="text-[#064E3B] font-medium hover:underline underline-offset-2"
        >
          {leftLink.label}
        </a>
        <span className="text-[#B89555]/60">|</span>
        <a
          href={rightLink.to}
          className="text-[#064E3B] font-medium hover:underline underline-offset-2"
        >
          {rightLink.label}
        </a>
      </div>
    </div>
  );
};
