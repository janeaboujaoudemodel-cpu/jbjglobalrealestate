import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

// === DEFAULT SelectTrigger — White-dominant ===
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "jbj-form-field flex min-h-10 w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 [&>span]:min-w-0 [&>span]:whitespace-normal [&>span]:break-words [&>span]:[overflow-wrap:anywhere] [&>span]:leading-snug [&>span]:text-left [&>span]:overflow-visible [&>span]:text-clip",
      "touch-action-manipulation",
      className,
    )}
    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-[#064E3B] opacity-100" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

// === DARK SelectTrigger ===
const SelectTriggerDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex min-h-10 w-full cursor-pointer items-center justify-between rounded-lg border",
      "bg-[#04231A] border-white/40 text-white",
      "hover:border-white/70 focus:ring-2 focus:ring-[#10B981]/45 focus:ring-offset-2 focus:ring-offset-[#02100A]",
      "disabled:cursor-not-allowed disabled:opacity-50 [&>span]:min-w-0 [&>span]:whitespace-normal [&>span]:break-words [&>span]:[overflow-wrap:anywhere] [&>span]:leading-snug [&>span]:text-left [&>span]:overflow-visible [&>span]:text-clip",
      "px-3 py-2 text-sm ring-offset-background",
      className,
    )}
    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-white opacity-100" />
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
    <ChevronUp className="h-4 w-4 text-white" />
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
    <ChevronDown className="h-4 w-4 text-white" />
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
    <ChevronUp className="h-4 w-4 text-white" />
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
    <ChevronDown className="h-4 w-4 text-white" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButtonDark.displayName = "SelectScrollDownButtonDark";

// === DEFAULT SelectContent — White-dominant ===
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      data-surface="emerald"
      data-no-contrast-guard
      className={cn(
        "jbj-form-popover relative z-[120000] max-h-96 min-w-[8rem] overflow-hidden rounded-xl max-w-[calc(100vw-2rem)] duration-0",
        "text-white bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/30",
        "shadow-[0_18px_50px_rgba(0,0,0,0.42),0_0_28px_rgba(6,78,59,0.24)]",
        "data-[state=open]:animate-none data-[state=closed]:animate-none",
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
            "w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>

      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

// === DARK SelectContent ===
const SelectContentDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-[120000] max-h-96 min-w-[8rem] overflow-hidden rounded-xl duration-0",
        "bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/30 text-white",
        "shadow-[0_10px_40px_rgba(0,0,0,0.5),0_4px_15px_rgba(0,0,0,0.3)]",
        "data-[state=open]:animate-none data-[state=closed]:animate-none",
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
  <SelectPrimitive.Label ref={ref} className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold text-[#1A1A1A]", className)} {...props} />
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

// === DEFAULT SelectItem — White-dominant ===
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "jbj-form-option relative flex h-auto min-h-10 w-full min-w-0 cursor-pointer select-none items-start rounded-lg py-2 pl-3 pr-8 text-sm text-white outline-none transition-colors duration-150 whitespace-normal overflow-visible",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "hover:bg-white/12 hover:text-white",
      "focus:bg-white/12 focus:text-white",
      "data-[highlighted]:bg-white/12 data-[highlighted]:text-white",
      "data-[highlighted]:[&_svg]:text-white data-[highlighted]:[&_*]:text-white",
      "data-[state=checked]:bg-[#065F46] data-[state=checked]:text-white data-[state=checked]:font-semibold",
      className,
    )}
    {...props}
  >
    <SelectPrimitive.ItemText className="min-w-0 w-full flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug text-left overflow-visible">
      {children}
    </SelectPrimitive.ItemText>
    <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-white" strokeWidth={3} />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

// === DARK SelectItem ===
const SelectItemDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex h-auto min-h-10 w-full min-w-0 cursor-pointer select-none items-start rounded-lg py-2 pl-8 pr-3 text-sm outline-none transition-all duration-200 whitespace-normal overflow-visible",
      "text-white",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "hover:bg-white/12 hover:text-white",
      "focus:bg-white/12 focus:text-white",
      "data-[highlighted]:bg-white/12 data-[highlighted]:text-white",
      "data-[state=checked]:bg-[#065F46] data-[state=checked]:text-white data-[state=checked]:font-semibold",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-white" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText className="min-w-0 w-full flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug text-left overflow-visible">
      {children}
    </SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItemDark.displayName = "SelectItemDark";

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-[#EFE6D6]", className)} {...props} />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// === DARK SelectSeparator ===
const SelectSeparatorDark = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-[#1A1A1A]", className)} {...props} />
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
