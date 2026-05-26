import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

/**
 * Canonical empty-state primitive for the Careers Portal.
 *
 * Replaces fabricated numbers, fake "connect" buttons, and placeholder activity.
 * If no real data exists, render this — never invented metrics.
 *
 * Champagne theme, single 1px gold hairline, ink text. No gray. No purple.
 */
export default function CareersEmptyState({
  icon: Icon,
  title,
  body,
  badge,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="bg-[#F7F2EA] border border-[#B89555]/40 rounded-2xl shadow-none">
      <CardContent className="py-14 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
          <Icon className="h-8 w-8 text-[#1A1A1A]" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1A1A] mb-1.5">{title}</h3>
        <p className="text-sm text-[#1A1A1A]/70 max-w-lg mx-auto">{body}</p>
        {badge && (
          <p className="mt-4 inline-block text-[11px] tracking-[0.18em] uppercase text-[#1A1A1A]/70 border border-[#B89555]/40 rounded-full px-3 py-1 bg-white/40">
            {badge}
          </p>
        )}
        {children && <div className="mt-5">{children}</div>}
      </CardContent>
    </Card>
  );
}
