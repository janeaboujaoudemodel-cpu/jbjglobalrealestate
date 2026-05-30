/**
 * contrastGuard — DISABLED (permanent no-op).
 *
 * The previous runtime engine repainted text/icon colors on every
 * mouseover, focusin, pointerdown, MutationObserver tick, route change,
 * and visibilitychange event. That created the platform-wide flicker
 * the owner reported (text flipping black ↔ white on hover/scroll/wait,
 * titles disappearing, labels blinking).
 *
 * Contrast is now owned 100% by the static CSS surface contract in
 * `src/index.css` (data-surface tokens, .jj-cta-* / .jj-badge-* / .jj-pill-active
 * primitives, and the foreground-only locks). Adding any JS repaint here
 * would re-introduce the flicker — leave this as a no-op.
 *
 * The export is kept so existing call sites (App.tsx) compile without changes.
 */
export function installContrastGuard(): void {
  /* intentionally empty — see file header */
}

export default installContrastGuard;
