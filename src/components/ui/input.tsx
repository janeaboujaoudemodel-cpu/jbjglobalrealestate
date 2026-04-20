import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-surface="light"
        className={cn(
          "flex h-10 w-full rounded-xl px-4 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
          "bg-white border-2 border-gray-300",
          "hover:border-gray-400 focus:border-black",
          "text-black focus:text-black",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
