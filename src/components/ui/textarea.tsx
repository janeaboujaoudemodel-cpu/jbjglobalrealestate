import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      data-surface="light"
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border-2 border-[#B89555]/40 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]",
        "hover:border-[#B89555]/60 focus:border-[#B89555]",
        // LOCKED: Textarea text is ALWAYS black - never white
        "text-[#1A1A1A] focus:text-[#1A1A1A]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
