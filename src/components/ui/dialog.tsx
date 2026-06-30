import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Wrap Radix Dialog.Root with a body-lock safety net.
 * If a portal teardown races with a parent unmount (e.g. when the parent
 * remounts the modal mid-close), Radix can leave `pointer-events: none`
 * on <body>, which freezes the whole UI. We re-check shortly after each
 * close and clear the inline style if no other dialog is still open.
 */
const Dialog: typeof DialogPrimitive.Root = ({ open, onOpenChange, ...props }) => {
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      onOpenChange?.(next);
      if (!next && typeof document !== "undefined") {
        window.setTimeout(() => {
          // Only unlock when there are no Radix dialog overlays still mounted.
          const stillOpen = document.querySelector('[role="dialog"][data-state="open"]');
          if (!stillOpen && document.body.style.pointerEvents === "none") {
            document.body.style.pointerEvents = "";
          }
        }, 0);
      }
    },
    [onOpenChange],
  );
  return <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} {...props} />;
};


const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[120000] bg-[#1A1A1A]/60 duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onPointerDownOutside, onInteractOutside, ...props }, ref) => {
  // Guard: prevent dialog from closing when clicking inside Radix Popper portals (Select, Popover, etc.)
  const handlePointerDownOutside: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>['onPointerDownOutside'] = (e) => {
    const target = e.target as HTMLElement;
    // If the click is inside a Radix popper portal, prevent the dialog from treating it as "outside"
    if (target?.closest?.('[data-radix-popper-content-wrapper]')) {
      e.preventDefault();
      return;
    }
    // Otherwise, call any user-provided handler
    onPointerDownOutside?.(e);
  };

  const handleInteractOutside: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>['onInteractOutside'] = (e) => {
    const target = e.target as HTMLElement;
    if (target?.closest?.('[data-radix-popper-content-wrapper]')) {
      e.preventDefault();
      return;
    }
    onInteractOutside?.(e);
  };

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-surface="light"
        className={cn(
          "fixed left-[50%] top-[50%] z-[120001] grid w-[calc(100vw-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-4 sm:p-6 shadow-lg duration-0 data-[state=open]:animate-none data-[state=closed]:animate-none rounded-lg sm:rounded-lg max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg",
          className,
        )}
        onPointerDownOutside={handlePointerDownOutside}
        onInteractOutside={handleInteractOutside}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/30 opacity-90 ring-offset-background transition-all duration-200 hover:opacity-100 hover:shadow-[0_4px_15px_rgba(200,167,102,0.3)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 disabled:pointer-events-none z-20">
          <X className="h-4 w-4 text-[#1A1A1A]" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-[#1A1A1A]", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-[#1A1A1A]/70", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};