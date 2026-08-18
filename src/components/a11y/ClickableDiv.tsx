import * as React from "react";

/**
 * Drop-in replacement for a plain `<div onClick={...}>` that also needs to
 * be keyboard-operable. Renders as a real `<div>` (same tag, same classes —
 * no layout/CSS impact), adding role="button", tabIndex, and an onKeyDown
 * that fires onClick for Enter/Space.
 *
 * Only fires from a keydown that lands on the div itself
 * (e.target === e.currentTarget) — if a real focusable child (button, link,
 * input) is nested inside and handles its own Enter/Space activation, that
 * activation's native click already bubbles up to this div's onClick, same
 * as it would for a real mouse click. Re-firing onClick here too would
 * double-invoke it; the target check keeps keyboard behavior matched to
 * existing mouse-click behavior instead of adding a new failure mode.
 */
export interface ClickableDivProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onClick"> {
  onClick: React.MouseEventHandler<HTMLDivElement>;
  disabled?: boolean;
}

export const ClickableDiv = React.forwardRef<HTMLDivElement, ClickableDivProps>(
  ({ onClick, onKeyDown, role = "button", tabIndex = 0, disabled, ...rest }, ref) => {
    const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
      onKeyDown?.(e);
      if (disabled || e.defaultPrevented) return;
      if (e.target !== e.currentTarget) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    return (
      <div
        ref={ref}
        role={disabled ? undefined : role}
        tabIndex={disabled ? undefined : tabIndex}
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={handleKeyDown}
        {...rest}
      />
    );
  },
);
ClickableDiv.displayName = "ClickableDiv";
