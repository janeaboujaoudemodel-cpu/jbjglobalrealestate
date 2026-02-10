import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

// === DEFAULT (Light/Champagne) SelectTrigger ===
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] px-3 py-2 text-sm text-black ring-offset-background placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      "touch-action-manipulation",
      className,
    )}
    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-gold opacity-70" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

// === DARK SelectTrigger (for AI tools on dark backgrounds) ===
const SelectTriggerDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border",
      "bg-zinc-800/80 border-zinc-600 text-white",
      "hover:border-zinc-500 focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900",
      "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      "px-3 py-2 text-sm ring-offset-background",
      className,
    )}
    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-zinc-400 opacity-70" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTriggerDark.displayName = "SelectTriggerDark";

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4 text-gold" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4 text-gold" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

// === DARK Scroll Buttons ===
const SelectScrollUpButtonDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4 text-zinc-400" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButtonDark.displayName = "SelectScrollUpButtonDark";

const SelectScrollDownButtonDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4 text-zinc-400" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButtonDark.displayName = "SelectScrollDownButtonDark";

// === DEFAULT (Light/Champagne) SelectContent ===
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        // z-[10200] ensures Select menu is ABOVE dialog overlay (z-10050) and content
        "relative z-[10200] max-h-96 min-w-[8rem] overflow-hidden rounded-xl",
        // Solid opaque background - no transparency issues
        "border-2 border-gold/50 bg-[#FDFBF7] text-black",
        // Strong shadow for visibility
        "shadow-[0_10px_40px_rgba(0,0,0,0.3),0_4px_15px_rgba(200,167,102,0.4)]",
        // Animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

// === DARK SelectContent (for AI tools on dark backgrounds) ===
const SelectContentDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-[10200] max-h-96 min-w-[8rem] overflow-hidden rounded-xl",
        "bg-zinc-900 border-2 border-zinc-700 text-white",
        "shadow-[0_10px_40px_rgba(0,0,0,0.5),0_4px_15px_rgba(0,0,0,0.3)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButtonDark />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButtonDark />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContentDark.displayName = "SelectContentDark";

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold text-black", className)} {...props} />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

// === DARK SelectLabel ===
const SelectLabelDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold text-white", className)} {...props} />
));
SelectLabelDark.displayName = "SelectLabelDark";

// === DEFAULT (Light/Champagne) SelectItem ===
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm text-black outline-none transition-all duration-200",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      // Normal: black text. Hover/Focus: gold text with 3D effect
      "hover:bg-gold/15 hover:text-gold hover:shadow-[0_4px_15px_rgba(200,167,102,0.25)] hover:-translate-y-0.5",
      "focus:bg-gold/15 focus:text-gold focus:shadow-[0_4px_15px_rgba(200,167,102,0.25)] focus:-translate-y-0.5",
      "data-[highlighted]:bg-gold/15 data-[highlighted]:text-gold data-[highlighted]:shadow-[0_4px_15px_rgba(200,167,102,0.25)] data-[highlighted]:-translate-y-0.5",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-gold" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

// === DARK SelectItem (for AI tools on dark backgrounds) ===
const SelectItemDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-all duration-200",
      "text-white",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "hover:bg-zinc-700 hover:text-white",
      "focus:bg-zinc-700 focus:text-white",
      "data-[highlighted]:bg-zinc-700 data-[highlighted]:text-white",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-emerald-400" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItemDark.displayName = "SelectItemDark";

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-gold/20", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// === DARK SelectSeparator ===
const SelectSeparatorDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-zinc-700", className)} {...props} />
));
SelectSeparatorDark.displayName = "SelectSeparatorDark";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectTriggerDark,
  SelectContent,
  SelectContentDark,
  SelectLabel,
  SelectLabelDark,
  SelectItem,
  SelectItemDark,
  SelectSeparator,
  SelectSeparatorDark,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectScrollUpButtonDark,
  SelectScrollDownButtonDark,
};