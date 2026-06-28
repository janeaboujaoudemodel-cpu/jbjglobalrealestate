import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const DropdownMenu = ({ modal = false, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) => (
  <DropdownMenuPrimitive.Root modal={modal} {...props} />
);
DropdownMenu.displayName = DropdownMenuPrimitive.Root.displayName;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex min-h-10 cursor-default select-none items-center rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-75 data-[state=open]:bg-[rgba(6,78,59,0.10)] data-[state=open]:text-[#064E3B] focus:bg-[rgba(6,78,59,0.10)] focus:text-[#064E3B] hover:bg-[rgba(6,78,59,0.10)] hover:text-[#064E3B]",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    data-surface="light"
    className={cn(
      "z-[10000] min-w-[8rem] overflow-hidden rounded-xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-1.5 text-[#1A1A1A] shadow-xl shadow-gold/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-75",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      data-surface="light"
      className={cn(
        "z-[10000] min-w-[8rem] overflow-hidden rounded-xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-1.5 text-[#1A1A1A] shadow-xl shadow-gold/20 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-75",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

/**
 * `unstyled` skips the default gold hover/focus/lift treatment so consumers
 * (e.g. ModeSwitcher) can fully own row styling via inline styles or their
 * own utilities without fighting class precedence or needing `!important`.
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    unstyled?: boolean;
  }
>(({ className, inset, unstyled, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      !unstyled &&
        "min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-colors duration-75 hover:bg-[color:var(--emerald-soft-bg)] hover:text-[color:var(--emerald-1)] focus:bg-[color:var(--emerald-soft-bg)] focus:text-[color:var(--emerald-1)] data-[highlighted]:bg-[color:var(--emerald-soft-bg)] data-[highlighted]:text-[color:var(--emerald-1)]",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex min-h-10 cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-75 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "hover:bg-[color:var(--emerald-soft-bg)] hover:text-[color:var(--emerald-1)] focus:bg-[color:var(--emerald-soft-bg)] focus:text-[color:var(--emerald-1)]",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center rounded border border-[color:var(--emerald-1)]/45 bg-[#FDFBF7] data-[state=checked]:bg-[color:var(--emerald-1)]">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-3 w-3 text-white" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex min-h-10 cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-75 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "hover:bg-[rgba(6,78,59,0.10)] hover:text-[#064E3B]",
      "focus:bg-[rgba(6,78,59,0.10)] focus:text-[#064E3B]",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-gold text-[#1A1A1A]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-[#1A1A1A]", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-[#EFE6D6]/20", className)} {...props} />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return <span className={cn("ml-auto text-xs tracking-widest text-[#1A1A1A]/70", className)} {...props} />;
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};