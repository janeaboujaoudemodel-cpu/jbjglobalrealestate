import { Suspense, lazy } from "react";

/**
 * Lazy boundary for GlobalSearchModal.
 *
 * The modal is ~50 KB of source plus its search index. Four navigation shells
 * used to import it statically while GlobalHeader imported it dynamically, so
 * Rollup could not split it and it shipped inside `app.js` on every route.
 * All consumers now render THIS component, which is the single dynamic edge —
 * the chunk is fetched only when a user actually opens search.
 */
const loadGlobalSearchModal = () => import("@/components/GlobalSearchModal");
const GlobalSearchModal = lazy(loadGlobalSearchModal);

export const preloadGlobalSearchModal = () => void loadGlobalSearchModal();

type Props = {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  embedded?: boolean;
  anchorRect?: DOMRect | null;
};

export default function GlobalSearchModalLazy(props: Props) {
  if (!props.isOpen) return null;
  return (
    <Suspense fallback={null}>
      <GlobalSearchModal {...props} />
    </Suspense>
  );
}
