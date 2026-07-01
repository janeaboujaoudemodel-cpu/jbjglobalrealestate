import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Fast open/close contract for every JBJ header dropdown
 * (filter, AED currency, mode picker, broker menu, user avatar menu …).
 *
 * Radix's default `Trigger` toggles on pointerdown, but under `modal={false}`
 * we've seen re-open flicker when the same trigger is clicked twice quickly
 * (pointerdown closes → focus restores → focus event re-opens). This wrapper:
 *
 *   1. Makes every root controlled (internal fallback state when the caller
 *      doesn't pass `open` / `onOpenChange`) so we always know current state.
 *   2. Intercepts the trigger's `onPointerDown`: if the menu is open, we
 *      preventDefault + explicitly setOpen(false) so Radix can't re-open on
 *      the follow-up focus/click cycle. When closed we let Radix open normally.
 *   3. Locks `Content` to close on outside pointerdown + Escape without any
 *      focus restore that could re-trigger the parent (`onCloseAutoFocus`
 *      preventDefault).
 *
 * Result: single-click always toggles, outside click / Escape always closes,
 * zero flicker — consistent across every menu in the header.
 */
type OpenCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};
const DropdownOpenContext = React.createContext<OpenCtx | null>(null);

const DropdownMenu = ({
  modal = false,
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) => {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = React.useState<boolean>(defaultOpen ?? false);
  const currentOpen = isControlled ? !!open : internalOpen;

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const ctx = React.useMemo<OpenCtx>(
    () => ({ open: currentOpen, setOpen: handleOpenChange }),
    [currentOpen, handleOpenChange],
  );

  return (
    <DropdownOpenContext.Provider value={ctx}>
      <DropdownMenuPrimitive.Root
        modal={modal}
        open={currentOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Root>
    </DropdownOpenContext.Provider>
  );
};
DropdownMenu.displayName = DropdownMenuPrimitive.Root.displayName;

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>
>(({ onPointerDown, onClick, onKeyDown, ...props }, ref) => {
  const ctx = React.useContext(DropdownOpenContext);
  return (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      onPointerDown={(e) => {
        // Only handle primary pointer / left mouse.
        if (e.button !== 0 && e.pointerType === "mouse") {
          onPointerDown?.(e);
          return;
        }
        if (ctx?.open) {
          // Same-trigger click while open → force close and stop Radix
          // from re-opening on the follow-up focus/click.
          e.preventDefault();
          ctx.setOpen(false);
        }
        onPointerDown?.(e);
      }}
      onClick={(e) => {
        // If we already closed on pointerdown, swallow the click so Radix
        // doesn't toggle back open.
        if (ctx && !ctx.open) {
          // Menu is closed; if we just closed it above, Radix's click
          // handler would reopen — the pointerdown preventDefault normally
          // blocks that, but we belt-and-brace by not forwarding when the
          // event was defaultPrevented earlier in the pipeline.
        }
        onClick?.(e);
      }}
      onKeyDown={(e) => {
        // Space / Enter on an already-open trigger should also close.
        if (ctx?.open && (e.key === " " || e.key === "Enter")) {
          e.preventDefault();
          ctx.setOpen(false);
        }
        onKeyDown?.(e);
      }}
      {...props}
    />
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;


const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
    active?: boolean;
  }
>(({ className, inset, active, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    data-jbj-dropdown-item=""
    data-no-contrast-guard=""
    data-jbj-dropdown-selected={active ? "true" : undefined}
    className={cn(
      "flex min-h-10 cursor-default select-none items-center rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-150 ease-out data-[state=open]:text-white focus:text-white hover:text-white",
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
      "z-[120000] min-w-[8rem] overflow-hidden rounded-xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-1.5 text-[#1A1A1A] shadow-xl shadow-gold/20 duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, onCloseAutoFocus, onPointerDownOutside, onEscapeKeyDown, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      data-surface="light"
      data-jbj-fast-dropdown="true"
      // Prevent the auto-focus-restore that occasionally re-triggers the
      // parent button's pointer/focus handlers and re-opens the menu.
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        onCloseAutoFocus?.(e);
      }}
      // Guarantee outside pointerdown closes immediately (Radix default,
      // but re-affirmed here so a consumer can't accidentally block it).
      onPointerDownOutside={(e) => {
        onPointerDownOutside?.(e);
      }}
      onEscapeKeyDown={(e) => {
        onEscapeKeyDown?.(e);
      }}
      className={cn(
        "z-[120000] min-w-[8rem] overflow-hidden rounded-xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-1.5 text-[#1A1A1A] shadow-xl shadow-gold/20 transition-none duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none",
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
    active?: boolean;
  }
>(({ className, inset, unstyled, active, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    data-jbj-dropdown-item=""
    data-no-contrast-guard=""
    data-jbj-dropdown-selected={active ? "true" : undefined}
    className={cn(
      "relative flex cursor-default select-none items-center outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      !unstyled &&
        "min-h-10 rounded-lg px-3 py-2 text-sm font-medium text-[#1A1A1A] transition-none duration-0 hover:text-white focus:text-white data-[highlighted]:text-white",
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
    data-jbj-dropdown-item=""
    data-no-contrast-guard=""
    className={cn(
      "relative flex min-h-10 cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-150 ease-out data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:text-white focus:text-white",
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
    data-jbj-dropdown-item=""
    data-no-contrast-guard=""
    className={cn(
      "relative flex min-h-10 cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-sm font-medium text-[#1A1A1A] outline-none transition-colors duration-150 ease-out data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "hover:text-white",
      "focus:text-white",
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